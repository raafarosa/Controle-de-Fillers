const SHEET_JSON_URL = "https://docs.google.com/spreadsheets/d/1IhzmeXB9Dc7JRnOY3qGE1Ledbad8d7DW7MYCd-2xoY4/gviz/tq?tqx=out:json&gid=1622028477";
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwVvg8TrztE7j9CUVHgIu698tpfUAzIiNzoAEAROs6kqtT1nPBN72XiY0HzdMc26aE00w/exec"; // Substitua pelo URL do seu Web App
const JSON_RAW_DATA = `[[1,"Eu sou Luffy! O homem que vai ser o Rei dos Piratas!","Manga Canon",true]]`;
const EXTERNAL_JSON_FILE = "matriz.json";

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
    const hasHeader = rows.length > 0 && typeof rows[0][0] === "string" && /(ep|episódio|episodio|title|título|titulo|type|tipo|watched|assistido)/i.test(rows[0].join(" "));
    const rawRows = hasHeader ? rows.slice(1) : rows;

    return rawRows
        .map((item) => ({
            ep: Number(item[0]),
            title: String(item[1] ?? ""),
            type: String(item[2] ?? ""),
            watched: normalizeWatched(item[3])
        }))
        .filter((episode) => !Number.isNaN(episode.ep));
}

function normalizeWatched(value) {
    if (value === true || value === 1) return true;
    if (typeof value === "string") {
        return ["true", "sim", "yes", "1"].includes(value.trim().toLowerCase());
    }
    return false;
}

async function updateEpisodeStatus(epNumber, watched) {
    if (!SHEET_WEB_APP_URL) return false;

    // Criamos o link com os dados grudados nele (Query Parameters)
    const finalUrl = `${SHEET_WEB_APP_URL}?ep=${epNumber}&watched=${watched}`;

    try {
        // O modo 'no-cors' envia o dado, mas não permite que o JS leia a resposta.
        // Como é um projeto pessoal, "enviar" é o que importa!
        await fetch(finalUrl, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache'
        });

        console.log(`✅ Comando enviado: EP ${epNumber} -> ${watched}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar para nuvem:', error);
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
    const totalWatched = episodes.filter((episode) => episode.watched).length;
    const relevant = episodes.filter((episode) => episode.type !== "Filler");
    const hours = ((totalWatched * 18) / 60).toFixed(1);

    watchedCountSpan.textContent = totalWatched;
    remainingCountSpan.textContent = relevant.filter((episode) => !episode.watched).length;
    hoursWatchedSpan.textContent = hours;
    totalRelevantSpan.textContent = relevant.length;
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

    const cardHtml = filtered
        .map((episode) => {
            const typeClass = getTypeClass(episode.type);
            return `
                <div class="episode-card" data-ep="${episode.ep}">
                    <div class="card-header">
                        <span class="card-ep">Episódio ${episode.ep}</span>
                        <span class="type-badge ${typeClass}">${escapeHtml(episode.type)}</span>
                    </div>
                    <div class="card-title">${escapeHtml(episode.title)}</div>
                    <div class="card-footer">
                        <label for="watch-${episode.ep}">Assistido</label>
                        <input id="watch-${episode.ep}" type="checkbox" class="checkbox-custom" data-ep-check="${episode.ep}" ${episode.watched ? "checked" : ""}>
                    </div>
                </div>
            `;
        })
        .join("");

    cardsContainer.innerHTML = cardHtml;
    attachCheckboxListeners();

    if (tableBody) {
        const tableHtml = filtered
            .map((episode) => {
                const typeClass = getTypeClass(episode.type);
                return `
                    <tr class="episode-row" data-ep="${episode.ep}">
                        <td class="ep-col">${episode.ep}</td>
                        <td>${escapeHtml(episode.title)}</td>
                        <td><span class="type-badge ${typeClass}">${escapeHtml(episode.type)}</span></td>
                        <td><input type="checkbox" class="checkbox-custom" data-ep-check="${episode.ep}" ${episode.watched ? "checked" : ""}></td>
                    </tr>
                `;
            })
            .join("");

        tableBody.innerHTML = tableHtml;
        attachCheckboxListeners();
    }
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
            saveToLocalStorage();
            updateStats();
            renderCards();

            // Atualização otimista: envia em segundo plano sem bloquear
            updateEpisodeStatus(epNum, checkbox.checked);
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

async function init() {
    dataSourceSelect.value = "sheet";
    const success = await loadEpisodes();
    if (success && episodes.length > 0) {
        //loadWatchedStateFromStorage();
        renderCards();
        updateStats();
    } else {
        cardsContainer.innerHTML = '<div class="error-message">❌ ERRO: Não foi possível carregar a planilha. Verifique se a planilha está publicada.</div>';
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ Service Worker registrado!'))
            .catch(err => console.error('❌ Erro no SW:', err));
    });
}

init();