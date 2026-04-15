const SHEET_JSON_URL = "https://docs.google.com/spreadsheets/d/1IhzmeXB9Dc7JRnOY3qGE1Ledbad8d7DW7MYCd-2xoY4/gviz/tq?tqx=out:json&gid=1622028477";
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwVvg8TrztE7j9CUVHgIu698tpfUAzIiNzoAEAROs6kqtT1nPBN72XiY0HzdMc26aE00w/exec"; // Substitua pelo URL do seu Web App
const JSON_RAW_DATA = `[[1,"Eu sou Luffy! O homem que vai ser o Rei dos Piratas!","Manga Canon",true]]`;
const EXTERNAL_JSON_FILE = "matriz.json";
let spoilersHidden = localStorage.getItem("spoilersHidden") === "true";
const toggleGlobalSpoilers = document.getElementById("toggleGlobalSpoilers");

let episodes = [];
let currentFilter = "all";
let searchTerm = "";
let deferredPrompt = null;

const cardsContainer = document.getElementById("cardsContainer");
const tableBody = document.getElementById("tableBody");
const watchedCountSpan = document.getElementById("watchedCount");
const remainingCountSpan = document.getElementById("remainingCount");
const hoursWatchedSpan = document.getElementById("hoursWatched");
const totalRelevantSpan = document.getElementById("totalRelevant");
const displayCountSpan = document.getElementById("displayCount");
const goToLastWatchedBtn = document.getElementById("goToLastWatchedBtn");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const dataSourceSelect = document.getElementById("dataSourceSelect");
const fileStatus = document.getElementById("fileStatus");
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installBtn.style.display = "inline-flex";
});

installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
        installBtn.style.display = "none";
    }
    deferredPrompt = null;
});

function showToast(message, isError = false) {
    const existingToast = document.querySelector(".toast-message");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    if (isError) toast.style.borderLeftColor = "#dc2626";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
}

async function loadEpisodes() {
    const source = dataSourceSelect.value;

    if (source === "hardcoded") {
        fileStatus.textContent = "📝 Hardcoded";
        return loadFromHardcoded();
    }

    if (source === "external") {
        fileStatus.textContent = "📄 Carregando matriz.json...";
        return loadFromExternalFile();
    }

    fileStatus.textContent = "📄 Carregando planilha...";
    const loaded = await loadFromGoogleSheet();
    if (loaded) return true;

    fileStatus.textContent = "❌ Falha no Google Sheets";
    showToast("❌ Não foi possível carregar a planilha. Tentando matriz.json...", true);
    return loadFromExternalFile();
}

function loadFromHardcoded() {
    try {
        const parsed = JSON.parse(JSON_RAW_DATA.trim());
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("JSON vazio");
        episodes = parsed.map((item) => ({
            ep: Number(item[0]),
            title: String(item[1]),
            type: String(item[2]),
            watched: normalizeWatched(item[3])
        }));
        fileStatus.textContent = `📝 ${episodes.length} episódios`;
        showToast(`✅ Hardcoded: ${episodes.length} episódios`);
        return true;
    } catch (error) {
        fileStatus.textContent = "❌ Erro no hardcoded";
        console.error(error);
        return false;
    }
}

async function loadFromExternalFile() {
    try {
        const response = await fetch(EXTERNAL_JSON_FILE);
        if (!response.ok) throw new Error("Arquivo não encontrado");
        const parsed = await response.json();
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("JSON vazio");
        episodes = parsed.map((item) => ({
            ep: Number(item[0]),
            title: String(item[1]),
            type: String(item[2]),
            watched: normalizeWatched(item[3])
        }));
        fileStatus.textContent = `✅ ${episodes.length} episódios`;
        showToast(`✅ matriz.json carregado: ${episodes.length} episódios`);
        return true;
    } catch (error) {
        fileStatus.textContent = "❌ matriz.json não encontrado";
        console.error(error);
        return false;
    }
}

async function loadFromGoogleSheet() {
    try {
        const response = await fetch(SHEET_JSON_URL);
        if (!response.ok) throw new Error("Erro ao acessar a planilha");
        const bodyText = await response.text();
        const sheetData = parseGoogleSheetJson(bodyText);
        episodes = parseSheetRows(sheetData);
        if (!Array.isArray(episodes) || episodes.length === 0) throw new Error("Planilha vazia");
        fileStatus.textContent = `✅ ${episodes.length} episódios (Google Sheets)`;
        showToast(`✅ Planilha carregada: ${episodes.length} episódios`);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function parseGoogleSheetJson(rawText) {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Resposta inválida do Google Sheets");
    const jsonText = rawText.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonText);
}

function parseSheetRows(data) {
    if (!data?.table?.rows || !Array.isArray(data.table.rows)) {
        throw new Error("Formato de dados da planilha inválido");
    }

    const rows = data.table.rows.map((row) => row.c.map((cell) => cell?.v ?? ""));
    const hasHeader = rows.length > 0 && typeof rows[0][0] === "string";
    const rawRows = hasHeader ? rows.slice(1) : rows;

    return rawRows
        .map((item) => {
            let rawDate = item[4];
            let formattedDate = "";

            if (rawDate) {
                // Se a data vier no formato Date(2026,3,11) do Google
                if (typeof rawDate === "string" && rawDate.includes("Date")) {
                    const dateValues = rawDate.match(/\d+/g);
                    if (dateValues) {
                        // O mês no JS começa em 0, mas no Google Sheets gviz também.
                        const d = new Date(dateValues[0], dateValues[1], dateValues[2]);
                        formattedDate = d.toLocaleDateString('pt-BR');
                    }
                } else {
                    // Se vier como uma data padrão ou string
                    formattedDate = formatDate(rawDate);
                }
            }

            return {
                ep: Number(item[0]),
                title: String(item[1] ?? ""),
                type: String(item[2] ?? ""),
                watched: normalizeWatched(item[3]),
                date: formattedDate // Data tratada
            };
        })
        .filter((episode) => !Number.isNaN(episode.ep));
}

function normalizeWatched(value) {
    if (value === true || value === 1) return true;
    if (typeof value === "string") {
        return ["true", "sim", "yes", "1"].includes(value.trim().toLowerCase());
    }
    return false;
}

function formatDate(dateValue) {
    if (!dateValue) return "";
    try {
        const d = new Date(dateValue);
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString('pt-BR');
    } catch (e) {
        return "";
    }
}

async function updateEpisodeStatus(epNumber, watched, dataLog) {
    if (!SHEET_WEB_APP_URL) return false;

    // Adicionamos o parâmetro &date na URL
    const finalUrl = `${SHEET_WEB_APP_URL}?ep=${epNumber}&watched=${watched}&date=${dataLog}`;

    try {
        await fetch(finalUrl, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache'
        });
        console.log(`✅ Enviado: EP ${epNumber} | Data: ${dataLog}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar:', error);
        return false;
    }
}

function saveToLocalStorage() {
    localStorage.setItem(
        "onePieceWatchedData",
        JSON.stringify(episodes.map((episode) => ({ ep: episode.ep, watched: episode.watched })))
    );
}

function loadWatchedStateFromStorage() {
    const stored = localStorage.getItem("onePieceWatchedData");
    if (!stored || episodes.length === 0) return;

    try {
        const saved = JSON.parse(stored);
        saved.forEach((item) => {
            const episode = episodes.find((ep) => ep.ep === Number(item.ep));
            if (episode) episode.watched = item.watched === true;
        });
    } catch (error) {
        console.error(error);
    }
}

function updateStats() {
    // 1. Filtra episódios assistidos (total geral)
    const totalWatched = episodes.filter((episode) => episode.watched).length;

    // 2. Filtra episódios que NÃO são Filler (relevantes)
    const relevantTypes = ["Manga Canon", "Mixed Canon/Filler", "Anime Canon"];
    const relevantEpisodes = episodes.filter((ep) => relevantTypes.includes(ep.type));

    // 3. Filtra quem falta assistir dentro dos relevantes (Comportamento da sua CONT.SES)
    const missingRelevant = relevantEpisodes.filter((ep) => !ep.watched).length;

    // 4. Cálculos de Tempo (18 min por ep)
    const hoursWatched = ((totalWatched * 18) / 60).toFixed(1);
    const hoursRemaining = ((missingRelevant * 18) / 60).toFixed(1);

    // 5. Atualiza o HTML (formatando com vírgula para bater com a planilha)
    watchedCountSpan.textContent = totalWatched;
    remainingCountSpan.textContent = missingRelevant;
    hoursWatchedSpan.textContent = hoursWatched.replace('.', ',');
    totalRelevantSpan.textContent = hoursRemaining.replace('.', ',');
}

function findLastWatchedEpisode() {
    return [...episodes]
        .filter((episode) => episode.watched === true)
        .sort((a, b) => b.ep - a.ep)[0] || null;
}

function waitForPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function scrollToEpisode(epNumber) {
    // Identifica se estamos no PC (Tabela) ou Celular (Cards)
    const isDesktop = window.getComputedStyle(document.querySelector('.table-wrapper')).display !== 'none';

    // Seleciona o alvo baseado no dispositivo
    const target = isDesktop
        ? document.querySelector(`.episode-row[data-ep="${epNumber}"]`)
        : document.querySelector(`.episode-card[data-ep="${epNumber}"]`);

    if (!target) return false;

    // Remove destaques antigos
    document.querySelectorAll(".highlight-episode").forEach(el => el.classList.remove("highlight-episode"));

    // Adiciona o destaque e rola a tela
    target.classList.add("highlight-episode");
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => target.classList.remove("highlight-episode"), 2200);
    return true;
}

async function goToLastWatched() {
    const lastWatched = findLastWatchedEpisode();
    if (!lastWatched) {
        showToast("🎉 Nenhum episódio assistido ainda!");
        return;
    }

    if (currentFilter !== "all") {
        filterBtns.forEach((btn) => btn.classList.remove("active-filter"));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add("active-filter");
        currentFilter = "all";
        renderCards();
        await waitForPaint();
        scrollToEpisode(lastWatched.ep);
        return;
    }

    scrollToEpisode(lastWatched.ep);
}

function getFilteredEpisodes() {
    let filtered = [...episodes];

    if (currentFilter !== "all") {
        filtered = filtered.filter((episode) => episode.type === currentFilter);
    }

    if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filtered = filtered.filter(
            (episode) =>
                episode.title.toLowerCase().includes(term) ||
                episode.ep.toString().includes(term)
        );
    }

    return filtered.sort((a, b) => a.ep - b.ep);
}

function escapeHtml(value) {
    return String(value).replace(/[&<>]/g, (char) => {
        if (char === "&") return "&amp;";
        if (char === "<") return "&lt;";
        if (char === ">") return "&gt;";
        return char;
    });
}

function renderCards() {
    const filtered = getFilteredEpisodes();
    displayCountSpan.textContent = `📺 ${filtered.length} de ${episodes.length}`;

    if (filtered.length === 0) {
        cardsContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">Nenhum episódio encontrado 🔍</div>';
        if (tableBody) tableBody.innerHTML = "";
        return;
    }

    // RENDERIZAÇÃO DOS CARDS (MOBILE)
    const cardHtml = filtered
        .map((episode) => {
            const typeClass = getTypeClass(episode.type);
            const watchedClass = episode.watched ? "is-watched" : "";
            return `
                <div class="episode-card" data-ep="${episode.ep}">
                    <div class="card-header">
                        <span class="card-ep">Episódio ${episode.ep}</span>
                        <span class="type-badge ${typeClass}">${escapeHtml(episode.type)}</span>
                    </div>
                    <div class="card-title">${escapeHtml(episode.title)}</div>
                    <div class="card-footer" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
                        ${episode.date ? `<span style="font-size: 0.7rem; color: #94a3b8; display: flex; align-items: center; gap: 4px;">📅 Concluído em: ${episode.date}</span>` : ''}
                        <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
                            <label for="watch-${episode.ep}" style="cursor: pointer;">Assistido</label>
                            <input id="watch-${episode.ep}" type="checkbox" class="checkbox-custom" data-ep-check="${episode.ep}" ${episode.watched ? "checked" : ""}>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

    cardsContainer.innerHTML = cardHtml;

    // RENDERIZAÇÃO DA TABELA (DESKTOP)
    if (tableBody) {
        const tableHtml = filtered
            .map((episode) => {
                const typeClass = getTypeClass(episode.type);
                const watchedClass = episode.watched ? "is-watched" : "";
                return `
                    <tr class="episode-row" data-ep="${episode.ep}">
                        <td class="ep-col">${episode.ep}</td>
                        <td>${escapeHtml(episode.title)}</td>
                        <td><span class="type-badge ${typeClass}">${escapeHtml(episode.type)}</span></td>
                        <td style="font-size: 0.8rem; color: #94a3b8;">${episode.date || '-'}</td>
                        <td><input type="checkbox" class="checkbox-custom" data-ep-check="${episode.ep}" ${episode.watched ? "checked" : ""}></td>
                    </tr>
                `;
            })
            .join("");

        tableBody.innerHTML = tableHtml;
    }

    // Vincula os eventos após renderizar
    attachCheckboxListeners();
}

function getTypeClass(type) {
    if (type === "Manga Canon") return "type-MangaCanon";
    if (type === "Mixed Canon/Filler") return "type-Mixed";
    if (type === "Anime Canon") return "type-AnimeCanon";
    return "type-Filler";
}

function attachCheckboxListeners() {
    document.querySelectorAll('.checkbox-custom').forEach((checkbox) => {
        checkbox.addEventListener('change', async (event) => {
            event.stopPropagation();
            const epNum = Number(checkbox.dataset.epCheck);
            const episode = episodes.find((item) => item.ep === epNum);
            if (!episode) return;

            episode.watched = checkbox.checked;

            // --- MELHORIA AQUI: Captura a data exata do clique no padrão BR ---
            const agora = new Date();
            const dataBrasilia = agora.toLocaleDateString('pt-BR');

            // Atualizamos a data no objeto local para o feedback ser instantâneo
            episode.date = checkbox.checked ? dataBrasilia : "";

            saveToLocalStorage();
            updateStats();
            renderCards();

            // Enviamos a data correta para a nuvem
            updateEpisodeStatus(epNum, checkbox.checked, dataBrasilia);
        });
    });
}

goToLastWatchedBtn.addEventListener("click", goToLastWatched);

searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderCards();
});

searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") event.target.blur();
});

filterBtns.forEach((button) => {
    button.addEventListener("click", () => {
        filterBtns.forEach((btn) => btn.classList.remove("active-filter"));
        button.classList.add("active-filter");
        currentFilter = button.dataset.filter;
        renderCards();
    });
});

dataSourceSelect.addEventListener("change", async () => {
    const success = await loadEpisodes();
    if (success) {
        loadWatchedStateFromStorage();
        renderCards();
        updateStats();
    } else {
        cardsContainer.innerHTML = '<div class="error-message">❌ ERRO: Não foi possível carregar a fonte de dados.</div>';
    }
});

function applySpoilerMode() {
    const container = document.querySelector(".app-container");
    const icon = document.getElementById("spoilerIcon");
    const text = document.getElementById("spoilerText");

    if (spoilersHidden) {
        container.classList.add("spoilers-hidden");
        if (icon) icon.textContent = "👁️";
        if (text) text.textContent = "Mostrar Títulos";
    } else {
        container.classList.remove("spoilers-hidden");
        if (icon) icon.textContent = "👁️";
        if (text) text.textContent = "Ocultar Títulos";
    }
}

// Função global para o clique no olho
window.toggleSingleSpoiler = function (btn) {
    const parent = btn.closest('.episode-card') || btn.closest('.episode-row');
    parent.classList.toggle('reveal-title');
};

if (toggleGlobalSpoilers) {
    toggleGlobalSpoilers.addEventListener("click", () => {
        spoilersHidden = !spoilersHidden;
        localStorage.setItem("spoilersHidden", spoilersHidden);
        applySpoilerMode();
    });
}

async function init() {
    dataSourceSelect.value = "sheet";
    const success = await loadEpisodes();

    if (success && episodes.length > 0) {
        // COMENTE OU REMOVA a linha abaixo para não sobrescrever os dados da planilha com o cache local
        // loadWatchedStateFromStorage(); 

        renderCards();
        updateStats();
    } else {
        cardsContainer.innerHTML = '<div class="error-message">❌ ERRO: Verifique a conexão com a planilha.</div>';
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ Service Worker registrado!'))
            .catch(err => console.error('❌ Erro no SW:', err));
    });
}

const backToTopBtn = document.getElementById("backToTopBtn");

function toggleBackToTop() {
    // Detecta scroll em praticamente qualquer navegador/dispositivo
    const scrolled = document.documentElement.scrollTop || document.body.scrollTop;

    if (scrolled > 300) {
        backToTopBtn.style.display = "flex"; // Garante o display
        setTimeout(() => backToTopBtn.classList.add("show"), 10);
    } else {
        backToTopBtn.classList.remove("show");
        setTimeout(() => {
            if (!backToTopBtn.classList.contains("show")) {
                backToTopBtn.style.display = "none";
            }
        }, 300);
    }
}

// Escuta scroll e touchmove (movimento de dedo no mobile)
window.addEventListener("scroll", toggleBackToTop, { passive: true });
window.addEventListener("touchmove", toggleBackToTop, { passive: true });

backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

applySpoilerMode();
init();