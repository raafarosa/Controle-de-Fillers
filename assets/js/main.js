const SHEET_JSON_URL = "https://docs.google.com/spreadsheets/d/1IhzmeXB9Dc7JRnOY3qGE1Ledbad8d7DW7MYCd-2xoY4/gviz/tq?tqx=out:json&gid=1622028477";
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwVvg8TrztE7j9CUVHgIu698tpfUAzIiNzoAEAROs6kqtT1nPBN72XiY0HzdMc26aE00w/exec";
const JSON_RAW_DATA = `[[1,"Eu sou Luffy! O homem que vai ser o Rei dos Piratas!","Manga Canon",true]]`;
const EXTERNAL_JSON_FILE = "matriz.json";

const MAPA_ARCOS_NETFLIX = [
    // 1. Saga East Blue
    { arco: "Romance Dawn", saga: "Saga East Blue", fim: 3 },
    { arco: "Orange Town", saga: "Saga East Blue", fim: 8 },
    { arco: "Vila Syrup", saga: "Saga East Blue", fim: 18 },
    { arco: "Baratie", saga: "Saga East Blue", fim: 30 },
    { arco: "Arlong Park", saga: "Saga East Blue", fim: 44 },
    { arco: "Bando do Buggy", saga: "Saga East Blue", fim: 47 },
    { arco: "Loguetown", saga: "Saga East Blue", fim: 53 },
    { arco: "Dragão Milenar (F)", saga: "Saga East Blue", fim: 61 },
    // 2. Saga Alabasta
    { arco: "Reverse Mountain", saga: "Saga Alabasta", fim: 63 },
    { arco: "Whiskey Peak", saga: "Saga Alabasta", fim: 67 },
    { arco: "Coby e Helmeppo", saga: "Saga Alabasta", fim: 69 },
    { arco: "Little Garden", saga: "Saga Alabasta", fim: 77 },
    { arco: "Ilha Drum", saga: "Saga Alabasta", fim: 91 },
    { arco: "Alabasta", saga: "Saga Alabasta", fim: 130 },
    { arco: "Pós-Alabasta (F)", saga: "Saga Alabasta", fim: 135 },
    // 3. Saga Skypiea
    { arco: "Ilha Carneiro (F)", saga: "Saga Skypiea", fim: 138 },
    { arco: "Ilha Ruluka (F)", saga: "Saga Skypiea", fim: 143 },
    { arco: "Jaya", saga: "Saga Skypiea", fim: 152 },
    { arco: "Skypiea", saga: "Saga Skypiea", fim: 195 },
    { arco: "G-8 (F)", saga: "Saga Skypiea", fim: 206 },
    // 4. Saga Water 7 / CP9
    { arco: "Long Ring Long Land", saga: "Saga Water 7 / CP9", fim: 219 },
    { arco: "Sonhos do Oceano (F)", saga: "Saga Water 7 / CP9", fim: 224 },
    { arco: "Retorno do Foxy (F)", saga: "Saga Water 7 / CP9", fim: 228 },
    { arco: "Water 7", saga: "Saga Water 7 / CP9", fim: 263 },
    { arco: "Enies Lobby", saga: "Saga Water 7 / CP9", fim: 312 },
    { arco: "Pós-Enies Lobby", saga: "Saga Water 7 / CP9", fim: 325 },
    // 5. Saga Thriller Bark
    { arco: "Adorável Terra (F)", saga: "Saga Thriller Bark", fim: 336 },
    { arco: "Thriller Bark", saga: "Saga Thriller Bark", fim: 381 },
    { arco: "Ilha Spa (F)", saga: "Saga Thriller Bark", fim: 384 },
    // 6. Saga Guerra de Marineford
    { arco: "Arquipélago Sabaody", saga: "Saga Marineford", fim: 407 },
    { arco: "Amazon Lily", saga: "Saga Marineford", fim: 421 },
    { arco: "Impel Down", saga: "Saga Marineford", fim: 458 },
    { arco: "Marineford", saga: "Saga Marineford", fim: 489 },
    { arco: "Pós-Guerra", saga: "Saga Marineford", fim: 516 },
    // 7. Saga Ilha dos Homens-Peixe
    { arco: "Retorno a Sabaody", saga: "Saga Homens-Peixe", fim: 522 },
    { arco: "Ilha dos Homens-Peixe", saga: "Saga Homens-Peixe", fim: 574 },
    // 8. Saga Aliança Pirata / Dressrosa
    { arco: "Ambição de Z (F)", saga: "Saga Dressrosa", fim: 578 },
    { arco: "Punk Hazard", saga: "Saga Dressrosa", fim: 625 },
    { arco: "Recuperação do Caesar (F)", saga: "Saga Dressrosa", fim: 628 },
    { arco: "Dressrosa", saga: "Saga Dressrosa", fim: 746 },
    // 9. Saga Yonkou
    { arco: "Minas de Prata (F)", saga: "Saga Yonkou", fim: 750 },
    { arco: "Zou", saga: "Saga Yonkou", fim: 779 },
    { arco: "Marinha Provisória (F)", saga: "Saga Yonkou", fim: 782 },
    { arco: "Ilha Whole Cake", saga: "Saga Yonkou", fim: 877 },
    { arco: "Levely", saga: "Saga Yonkou", fim: 891 },
    { arco: "País de Wano", saga: "Saga Yonkou", fim: 1088 },
    // 10. Saga Final
    { arco: "Egghead", saga: "Saga Final", fim: 1116 },
    { arco: "Elbaph", saga: "Saga Final", fim: 2500 }
];

function getArco(ep) {
    const info = MAPA_ARCOS_NETFLIX.find(a => ep <= a.fim);
    if (info) {
        return `${info.saga}: ${info.arco}`;
    }
    return "Saga Desconhecida";
}

let episodes = [];
let currentFilter = "all";
let searchTerm = "";
let deferredPrompt = null;

// Seletores DOM
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
const backToTopBtn = document.getElementById("backToTopBtn");
const finishPredictionSpan = document.getElementById("finishPrediction");

// --- INICIALIZAÇÃO E PWA ---
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = "inline-flex";
});

if (installBtn) {
    installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") installBtn.style.display = "none";
        deferredPrompt = null;
    });
}

// --- CARREGAMENTO DE DADOS ---
async function loadEpisodes() {
    const source = dataSourceSelect.value;
    fileStatus.textContent = "⌛ Carregando...";
    if (source === "hardcoded") return loadFromHardcoded();
    if (source === "external") return loadFromExternalFile();
    const loaded = await loadFromGoogleSheet();
    if (loaded) return true;
    return loadFromExternalFile();
}

async function loadFromGoogleSheet() {
    try {
        const response = await fetch(SHEET_JSON_URL);
        const bodyText = await response.text();
        const jsonText = bodyText.slice(bodyText.indexOf("{"), bodyText.lastIndexOf("}") + 1);
        const data = JSON.parse(jsonText);
        episodes = parseSheetRows(data);
        fileStatus.textContent = `✅ ${episodes.length} episódios`;
        return true;
    } catch (e) { return false; }
}

function parseSheetRows(data) {
    const rows = data.table.rows.map(row => row.c.map(cell => cell?.v ?? ""));
    const rawRows = typeof rows[0][0] === "string" ? rows.slice(1) : rows;

    return rawRows.map(item => {
        let formattedDate = "";
        if (item[4]) {
            if (typeof item[4] === "string" && item[4].includes("Date")) {
                const dVal = item[4].match(/\d+/g);

                // REMOVEMOS O -1 DAQUI:
                // Se o log diz que 20/03 é hoje (20/04), 
                // é porque o dVal[1] já vem como 3 (Março no JS).
                formattedDate = new Date(dVal[0], dVal[1], dVal[2]).toLocaleDateString('pt-BR');
            } else {
                formattedDate = new Date(item[4]).toLocaleDateString('pt-BR');
            }
        }
        return {
            ep: Number(item[0]),
            type: String(item[2] || ""),
            watched: (item[3] === true || item[3] === 1 || String(item[3]).toLowerCase() === "true"),
            date: formattedDate
        };
    }).filter(ep => !isNaN(ep.ep));
}

// --- RENDERIZAÇÃO ---
function renderCards() {
    const filtered = getFilteredEpisodes();

    // Atualiza o contador de exibição
    if (displayCountSpan) {
        displayCountSpan.textContent = `📺 ${filtered.length} de ${episodes.length}`;
    }

    // Caso não encontre resultados
    if (filtered.length === 0) {
        const emptyMsg = '<div style="text-align:center;padding:2rem;">Nenhum encontrado 🔍</div>';
        cardsContainer.innerHTML = emptyMsg;
        if (tableBody) tableBody.innerHTML = "";
        return;
    }

    // --- RENDERIZAÇÃO MOBILE (CARDS) ---
    cardsContainer.innerHTML = filtered.map(ep => {
        const infoSagaArco = getArco(ep.ep);
        // Formata a data em negrito se ela existir
        const dataFormatada = ep.date
            ? `<span style="font-size:0.7rem; color:#94a3b8;">📅 Concluído: <b style="color: #e2e8f0;">${ep.date}</b></span>`
            : '';

        return `
            <div class="episode-card ${ep.watched ? 'is-watched' : ''}" data-ep="${ep.ep}">
                <div style="font-size: 0.58rem; color: #facc15; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2;">
                    📍 ${infoSagaArco}
                </div>
                <div class="card-header">
                    <span class="card-ep">EPISÓDIO ${ep.ep}</span>
                    <span class="type-badge ${getTypeClass(ep.type)}">${ep.type}</span>
                </div>
                <div class="card-footer" style="margin-top:0.5rem; display: flex; flex-direction:column; gap:8px;">
                    ${dataFormatada}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <label style="font-size:0.8rem;">Assistido</label>
                        <input type="checkbox" class="checkbox-custom" data-ep-check="${ep.ep}" ${ep.watched ? "checked" : ""}>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    // --- RENDERIZAÇÃO DESKTOP (TABELA) ---
    if (tableBody) {
        tableBody.innerHTML = filtered.map(ep => {
            // Estilo da data na tabela com Negrito (Bold)
            const dataCell = ep.date
                ? `<b style="color: #e2e8f0;">${ep.date}</b>`
                : '-';

            return `
                <tr class="episode-row ${ep.watched ? 'is-watched' : ''}" data-ep="${ep.ep}">
                    <td class="col-arco">${getArco(ep.ep)}</td>
                    <td class="col-ep">${ep.ep}</td>
                    <td style="text-align: center;">
                        <span class="type-badge ${getTypeClass(ep.type)}">${ep.type}</span>
                    </td>
                    <td style="color:#94a3b8; font-size:0.8rem; text-align: center;">
                        ${dataCell}
                    </td>
                    <td style="text-align: center;">
                        <input type="checkbox" class="checkbox-custom" data-ep-check="${ep.ep}" ${ep.watched ? "checked" : ""}>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Reativa os listeners de eventos
    attachCheckboxListeners();
}

function getFilteredEpisodes() {
    let filtered = [...episodes];
    if (currentFilter !== "all") filtered = filtered.filter(ep => ep.type === currentFilter);
    if (searchTerm.trim()) {
        filtered = filtered.filter(ep => ep.ep.toString().includes(searchTerm.trim()));
    }
    return filtered.sort((a, b) => a.ep - b.ep);
}

// --- LÓGICA DE NEGÓCIO ---
function attachCheckboxListeners() {
    document.querySelectorAll('.checkbox-custom').forEach(cb => {
        cb.addEventListener('change', async () => {
            const epNum = Number(cb.dataset.epCheck);
            const ep = episodes.find(item => item.ep === epNum);
            if (!ep) return;
            const dataBR = new Date().toLocaleDateString('pt-BR');
            ep.watched = cb.checked;
            ep.date = cb.checked ? dataBR : "";
            updateStats();
            renderCards();
            updateEpisodeStatus(epNum, ep.watched, dataBR);
        });
    });
}

async function updateEpisodeStatus(ep, watched, date) {
    if (!SHEET_WEB_APP_URL) return;
    try { await fetch(`${SHEET_WEB_APP_URL}?ep=${ep}&watched=${watched}&date=${date}`, { mode: 'no-cors' }); } catch (e) { }
}

function updateStats() {
    // 1. Cálculos Básicos
    const watchedEpisodes = episodes.filter(ep => ep.watched);
    const watchedCount = watchedEpisodes.length;

    const relevant = episodes.filter(ep => ["Manga Canon", "Mixed Canon/Filler", "Anime Canon"].includes(ep.type));
    const missing = relevant.filter(ep => !ep.watched).length;

    // --- NOVA LÓGICA: ASSISTIDOS HOJE (VERSÃO CORRIGIDA) ---
    const hojeString = new Date().toLocaleDateString('pt-BR');

    const assistidosHoje = episodes.filter(ep => {
        // 1. Só interessa quem está marcado como assistido e tem data
        if (!ep.watched || !ep.date) return false;

        // 2. Limpa possíveis espaços em branco ou resíduos de formatação
        const dataLimpa = ep.date.trim();
        const hojeLimpo = hojeString.trim();

        // 3. Retorna a comparação
        return dataLimpa === hojeLimpo;
    }).length;

    const todayCountSpan = document.getElementById("todayCount");
    if (todayCountSpan) {
        todayCountSpan.textContent = assistidosHoje;
    }

    // Atualiza os spans básicos de contagem e horas
    watchedCountSpan.textContent = watchedCount;
    remainingCountSpan.textContent = missing;
    hoursWatchedSpan.textContent = ((watchedCount * 18) / 60).toFixed(1).replace('.', ',');
    totalRelevantSpan.textContent = ((missing * 18) / 60).toFixed(1).replace('.', ',');

    // 2. Lógica Preditiva (Média Diária Real e Data Alvo)

    // Filtramos apenas as datas válidas (DD/MM/AAAA) presentes nos episódios assistidos
    const activeDates = watchedEpisodes
        .map(ep => ep.date)
        .filter(d => d && d.includes('/'));

    // Criamos um Set para contar apenas dias únicos de atividade
    const totalDaysActive = [...new Set(activeDates)].length;

    if (totalDaysActive > 0 && missing > 0) {
        // Média de episódios por dia que você realmente assistiu (considerando apenas dias ativos)
        const avgPerDay = watchedCount / totalDaysActive;

        // Quantos dias faltam para acabar os episódios relevantes (arredondado para cima)
        const daysToFinish = Math.ceil(missing / avgPerDay);

        // Cálculo da Data Final estimada
        const estimatedDate = new Date(); // Data de hoje
        estimatedDate.setDate(estimatedDate.getDate() + daysToFinish); // Soma os dias previstos

        // Formatação manual para DD/MM/AAAA (Padrão Brasil)
        const day = String(estimatedDate.getDate()).padStart(2, '0');
        const month = String(estimatedDate.getMonth() + 1).padStart(2, '0');
        const year = estimatedDate.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        // Exibe o resultado final no card
        finishPredictionSpan.textContent = `${daysToFinish} dias (${formattedDate})`;

    } else if (missing === 0) {
        finishPredictionSpan.textContent = "Concluído! 🎉";
    } else {
        // Caso não haja histórico de datas (ex: primeira vez usando o app)
        finishPredictionSpan.textContent = "Aguardando dados...";
    }
}
// --- FUNÇÃO CORRIGIDA: IR PARA O ÚLTIMO ASSISTIDO ---
goToLastWatchedBtn.addEventListener("click", async () => {
    // 1. Encontra o maior número de EP que está marcado como assistido
    const lastWatched = [...episodes]
        .filter(e => e.watched)
        .sort((a, b) => b.ep - a.ep)[0];

    if (!lastWatched) {
        showToast("🎉 Nenhum episódio assistido ainda!");
        return;
    }

    // 2. Se houver filtro ou busca ativa, limpa tudo para o EP aparecer
    if (currentFilter !== "all" || searchTerm !== "") {
        currentFilter = "all";
        searchTerm = "";
        searchInput.value = "";
        filterBtns.forEach(b => b.classList.toggle("active-filter", b.dataset.filter === "all"));

        renderCards(); // Re-renderiza a lista completa

        // Pequena pausa para o navegador "desenhar" os novos elementos no HTML
        await new Promise(resolve => requestAnimationFrame(resolve));
    }

    // 3. Tenta localizar o elemento (Card ou Linha da Tabela)
    const isDesktop = window.innerWidth > 768;
    const selector = isDesktop
        ? `.episode-row[data-ep="${lastWatched.ep}"]`
        : `.episode-card[data-ep="${lastWatched.ep}"]`;

    const target = document.querySelector(selector);

    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });

        // Efeito visual de destaque
        target.classList.add("highlight-episode");
        setTimeout(() => target.classList.remove("highlight-episode"), 2200);
    } else {
        console.warn("Elemento não encontrado no DOM para o EP:", lastWatched.ep);
    }
});

searchInput.addEventListener("input", e => { searchTerm = e.target.value; renderCards(); });
filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active-filter"));
    btn.classList.add("active-filter");
    currentFilter = btn.dataset.filter;
    renderCards();
}));

function getTypeClass(t) {
    if (t === "Manga Canon") return "type-MangaCanon";
    if (t === "Mixed Canon/Filler") return "type-Mixed";
    if (t === "Anime Canon") return "type-AnimeCanon";
    return "type-Filler";
}

async function init() {
    dataSourceSelect.value = "sheet";
    const success = await loadEpisodes();
    if (success) { renderCards(); updateStats(); }
}

window.addEventListener("scroll", () => {
    if (window.scrollY > 200) { backToTopBtn.classList.add("show"); }
    else { backToTopBtn.classList.remove("show"); }
});

backToTopBtn.addEventListener("click", () => {
    // 1. Encontra o último assistido
    const lastWatched = [...episodes]
        .filter(e => e.watched)
        .sort((a, b) => b.ep - a.ep)[0];

    // Se não houver marcações, apenas sobe pro topo
    if (!lastWatched) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    const isDesktop = window.innerWidth > 768;
    const selector = isDesktop ? `.episode-row[data-ep="${lastWatched.ep}"]` : `.episode-card[data-ep="${lastWatched.ep}"]`;
    const target = document.querySelector(selector);

    if (!target) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    const rect = target.getBoundingClientRect();
    const isAtTarget = Math.abs(rect.top - (window.innerHeight / 2) + (rect.height / 2)) < 100;

    // --- NOVA LÓGICA DE DIREÇÃO ---

    // Se eu já estou no alvo OU se estou abaixo dele (rect.top < 0 significa que o alvo ficou pra cima)
    if (isAtTarget || rect.top < 0) {
        // Comportamento: Sobe (ou para o alvo ou para o topo da página)
        if (isAtTarget || window.scrollY < 100) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            // Sobe para o último assistido que ficou para trás
            target.scrollIntoView({ behavior: "smooth", block: "center" });
            target.classList.add("highlight-episode");
            setTimeout(() => target.classList.remove("highlight-episode"), 2200);
        }
    }
    // Se o alvo está abaixo de mim (rect.top > 0) e eu estou no topo da página
    else if (window.scrollY < 100) {
        // Comportamento: Desce para o último assistido
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("highlight-episode");
        setTimeout(() => target.classList.remove("highlight-episode"), 2200);
    }
    // Caso padrão: segurança para sempre subir se estiver em dúvida
    else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});
init();