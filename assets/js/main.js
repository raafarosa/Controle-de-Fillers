"use strict";

/* ============================================================================
 * CONFIGURAÇÃO / CONSTANTES
 * ============================================================================ */
const SHEET_JSON_URL = "https://docs.google.com/spreadsheets/d/1IhzmeXB9Dc7JRnOY3qGE1Ledbad8d7DW7MYCd-2xoY4/gviz/tq?tqx=out:json&gid=1622028477";
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwVvg8TrztE7j9CUVHgIu698tpfUAzIiNzoAEAROs6kqtT1nPBN72XiY0HzdMc26aE00w/exec";

const RELEVANT_TYPES = ["Manga Canon", "Mixed Canon/Filler", "Anime Canon"];
const MINUTES_PER_EPISODE = 18;
const DIAS_MEDIA_PADRAO = 90;
const HIGHLIGHT_DURATION_MS = 2200;
const SEARCH_DEBOUNCE_MS = 200;

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
    { arco: "Reverie", saga: "Saga Yonkou", fim: 891 },
    { arco: "País de Wano", saga: "Saga Yonkou", fim: 1088 },
    // 10. Saga Final
    { arco: "Egghead", saga: "Saga Final", fim: 1155 },
    { arco: "Elbaph", saga: "Saga Final", fim: 2500 }
];

/* ============================================================================
 * ESTADO GLOBAL
 * ============================================================================ */
let episodes = [];
let currentFilter = "all";
let searchTerm = "";
let deferredPrompt = null;

/* ============================================================================
 * SELETORES DOM
 * ============================================================================ */
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

/* ============================================================================
 * UTIL: DATAS (fonte única de parsing/formatação — usada em todo o arquivo)
 * ============================================================================ */
function parseDataBR(str) {
    if (!str || typeof str !== "string" || !str.includes("/")) return null;
    const partes = str.split("/").map(Number);
    if (partes.length !== 3 || partes.some(n => isNaN(n))) return null;
    const [dia, mes, ano] = partes;
    const d = new Date(ano, mes - 1, dia);
    return isNaN(d.getTime()) ? null : d;
}

function formatarDataBR(date) {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function hojeFimDoDia() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}

function formatarTempo(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h${mins > 0 ? " " + mins + "m" : ""}`;
    return `${mins}m`;
}

/* ============================================================================
 * UTIL: ARCOS (fonte única de verdade — antes havia 3 implementações diferentes)
 * ============================================================================ */
function getArcoInfo(epNumero) {
    const index = MAPA_ARCOS_NETFLIX.findIndex(a => epNumero <= a.fim);
    if (index === -1) return null;
    const inicio = index > 0 ? MAPA_ARCOS_NETFLIX[index - 1].fim + 1 : 1;
    return {
        index,
        inicio,
        fim: MAPA_ARCOS_NETFLIX[index].fim,
        arco: MAPA_ARCOS_NETFLIX[index].arco,
        saga: MAPA_ARCOS_NETFLIX[index].saga
    };
}

function getArco(epNumero) {
    const info = getArcoInfo(epNumero);
    return info ? `${info.saga}: ${info.arco}` : "Saga Desconhecida";
}

/* ============================================================================
 * UTIL: DEBOUNCE (evita re-render a cada tecla digitada na busca)
 * ============================================================================ */
function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/* ============================================================================
 * UI: TOAST simples
 * OBS: esta função era chamada no arquivo original (goToLastWatchedBtn) mas não
 * estava definida em nenhum lugar do código enviado. Implementação mínima abaixo.
 * ============================================================================ */
function showToast(message, duration = 2500) {
    let toastEl = document.getElementById("appToast");
    if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "appToast";
        toastEl.style.cssText = [
            "position:fixed", "bottom:20px", "left:50%", "transform:translateX(-50%)",
            "background:#1e293b", "color:#e2e8f0", "padding:10px 16px", "border-radius:8px",
            "font-size:0.85rem", "z-index:9999", "opacity:0", "transition:opacity .3s",
            "pointer-events:none", "box-shadow:0 4px 12px rgba(0,0,0,0.3)"
        ].join(";");
        document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.style.opacity = "1";
    clearTimeout(toastEl._timeout);
    toastEl._timeout = setTimeout(() => { toastEl.style.opacity = "0"; }, duration);
}

/* ============================================================================
 * PWA / INSTALAÇÃO
 * ============================================================================ */
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

/* ============================================================================
 * CARREGAMENTO DE DADOS
 * ============================================================================ */
async function loadEpisodes() {
    const source = dataSourceSelect.value;
    fileStatus.textContent = "⌛ Carregando...";

    let ok = false;
    if (source === "hardcoded") {
        ok = await loadFromHardcoded();
    } else if (source === "external") {
        ok = await loadFromExternalFile();
    } else {
        ok = await loadFromGoogleSheet();
        if (!ok) ok = await loadFromExternalFile();
    }

    if (ok) {
        // CORREÇÃO ESTRUTURAL: garante ordem numérica dos episódios independente
        // da ordem em que vieram da fonte de dados. Toda a lógica preditiva
        // (arco atual, último assistido, etc.) depende dessa ordem estar correta.
        episodes.sort((a, b) => a.ep - b.ep);
    }
    return ok;
}

async function loadFromGoogleSheet() {
    try {
        const response = await fetch(SHEET_JSON_URL);
        const bodyText = await response.text();
        const jsonText = bodyText.slice(bodyText.indexOf("{"), bodyText.lastIndexOf("}") + 1);
        const data = JSON.parse(jsonText);
        episodes = parseSheetRows(data);
        fileStatus.textContent = `✅ ${episodes.length} episódios`;
        return episodes.length > 0;
    } catch (e) {
        console.error("Falha ao carregar do Google Sheets:", e);
        return false;
    }
}

async function loadFromHardcoded() {
    // OBS: esta função era referenciada no arquivo original, mas não havia
    // implementação em lugar nenhum do código enviado. Stub seguro abaixo —
    // se você já tem uma lista fixa em outro lugar, substitua este corpo.
    console.warn("loadFromHardcoded: nenhuma fonte fixa configurada neste arquivo.");
    fileStatus.textContent = "⚠️ Fonte 'hardcoded' não configurada";
    return false;
}

async function loadFromExternalFile() {
    // OBS: mesma situação — função referenciada mas ausente no original.
    // Assumi um arquivo local "episodes.json" como fallback; ajuste o caminho
    // se a sua fonte externa real for outra.
    try {
        const response = await fetch("episodes.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        episodes = Array.isArray(data) ? data : [];
        fileStatus.textContent = `✅ ${episodes.length} episódios (arquivo externo)`;
        return episodes.length > 0;
    } catch (e) {
        console.error("Falha ao carregar arquivo externo:", e);
        fileStatus.textContent = "❌ Falha ao carregar arquivo externo";
        return false;
    }
}

function parseSheetRows(data) {
    if (!data || !data.table || !Array.isArray(data.table.rows)) return [];

    const rows = data.table.rows.map(row => row.c.map(cell => (cell ? cell.v : "")));
    const rawRows = typeof rows[0]?.[0] === "string" ? rows.slice(1) : rows;

    return rawRows.map(item => {
        let formattedDate = "";
        const rawDate = item[4];

        if (rawDate) {
            if (typeof rawDate === "string" && rawDate.startsWith("Date(")) {
                // O Google Sheets serializa datas no formato "Date(ano,mes,dia)",
                // com o mês JÁ zero-indexado (0 = Janeiro) — igual ao construtor
                // nativo `new Date(ano, mes, dia)` do JavaScript. Por isso NÃO se
                // soma nem subtrai 1 ao mês aqui.
                const partes = rawDate.match(/-?\d+/g);
                if (partes && partes.length >= 3) {
                    const [ano, mes, dia] = partes.map(Number);
                    const d = new Date(ano, mes, dia);
                    if (!isNaN(d.getTime())) formattedDate = formatarDataBR(d);
                }
            } else {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) formattedDate = formatarDataBR(d);
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

/* ============================================================================
 * RENDERIZAÇÃO
 * ============================================================================ */
function getFilteredEpisodes() {
    let filtered = [...episodes];
    if (currentFilter !== "all") filtered = filtered.filter(ep => ep.type === currentFilter);
    if (searchTerm.trim()) {
        filtered = filtered.filter(ep => ep.ep.toString().includes(searchTerm.trim()));
    }
    return filtered.sort((a, b) => a.ep - b.ep);
}

function getTypeClass(t) {
    if (t === "Manga Canon") return "type-MangaCanon";
    if (t === "Mixed Canon/Filler") return "type-Mixed";
    if (t === "Anime Canon") return "type-AnimeCanon";
    return "type-Filler";
}

function renderCardHTML(ep) {
    const infoSagaArco = getArco(ep.ep);
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
}

function renderRowHTML(ep) {
    const dataCell = ep.date ? `<b style="color: #e2e8f0;">${ep.date}</b>` : '-';
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
}

function renderCards() {
    const filtered = getFilteredEpisodes();

    if (displayCountSpan) {
        displayCountSpan.textContent = `📺 ${filtered.length} de ${episodes.length}`;
    }

    if (filtered.length === 0) {
        cardsContainer.innerHTML = '<div style="text-align:center;padding:2rem;">Nenhum encontrado 🔍</div>';
        if (tableBody) tableBody.innerHTML = "";
        return;
    }

    cardsContainer.innerHTML = filtered.map(renderCardHTML).join("");
    if (tableBody) {
        tableBody.innerHTML = filtered.map(renderRowHTML).join("");
    }
    // Não é mais necessário reanexar listeners aqui — ver setupCheckboxDelegation()
    // registrado uma única vez em init().
}

/* ============================================================================
 * LÓGICA DE NEGÓCIO: CHECKBOX (delegação de evento única, em vez de recriar
 * um listener por checkbox a cada renderCards())
 * ============================================================================ */
function setupCheckboxDelegation() {
    document.addEventListener("change", async (e) => {
        const cb = e.target.closest(".checkbox-custom");
        if (!cb) return;
        await handleCheckboxChange(cb);
    });
}

async function handleCheckboxChange(cb) {
    const epNum = Number(cb.dataset.epCheck);
    const ep = episodes.find(item => item.ep === epNum);
    if (!ep) return;

    const dataBR = formatarDataBR(new Date());
    ep.watched = cb.checked;
    ep.date = cb.checked ? dataBR : "";

    updateStats();
    renderCards();

    const salvo = await updateEpisodeStatus(epNum, ep.watched, dataBR);
    if (!salvo) {
        showToast("⚠️ Não foi possível confirmar o salvamento na planilha");
    }
}

async function updateEpisodeStatus(ep, watched, date) {
    if (!SHEET_WEB_APP_URL) return true; // sem endpoint configurado — nada a salvar remotamente
    try {
        await fetch(`${SHEET_WEB_APP_URL}?ep=${ep}&watched=${watched}&date=${encodeURIComponent(date)}`, { mode: 'no-cors' });
        // OBS IMPORTANTE: com mode:'no-cors' o navegador SEMPRE retorna uma resposta
        // "opaque" — não é possível ler o status HTTP real. Isto significa que, mesmo
        // corrigido, este retorno "true" só garante que a REQUISIÇÃO foi enviada,
        // não que o Apps Script processou e salvou com sucesso do outro lado. Para
        // confirmação real seria necessário o Apps Script responder com CORS habilitado.
        return true;
    } catch (e) {
        console.error("Falha de rede ao salvar episódio", ep, e);
        return false;
    }
}

/* ============================================================================
 * ESTATÍSTICAS / LÓGICA PREDITIVA
 * ============================================================================ */
function updateStats() {
    // --- 0. Janela de dias configurável ---
    let diasMedia = DIAS_MEDIA_PADRAO;
    const salvoNoStorage = localStorage.getItem("config_dias_media");
    if (salvoNoStorage) {
        const parsed = parseInt(salvoNoStorage, 10);
        diasMedia = Math.max(1, isNaN(parsed) ? DIAS_MEDIA_PADRAO : parsed);
    }

    const inputHtml = document.getElementById("inputDias");
    if (inputHtml) {
        if (!inputHtml.value) inputHtml.value = diasMedia;
        if (!inputHtml.dataset.listenerAtivo) {
            inputHtml.addEventListener("input", function () {
                const novoValor = parseInt(this.value, 10);
                if (!isNaN(novoValor) && novoValor > 0) {
                    localStorage.setItem("config_dias_media", novoValor);
                    updateStats();
                }
            });
            inputHtml.dataset.listenerAtivo = "true";
        }
    }

    // --- 1. Base ---
    const watchedEpisodes = episodes.filter(ep => ep.watched);
    const watchedCount = watchedEpisodes.length;
    const relevant = episodes.filter(ep => RELEVANT_TYPES.includes(ep.type)).sort((a, b) => a.ep - b.ep);
    const missing = relevant.filter(ep => !ep.watched).length;

    const hoje = hojeFimDoDia();
    const hojeString = formatarDataBR(new Date());

    // --- 2. Média de ritmo (ep/dia) dentro da janela configurada ---
    const dataLimite = new Date();
    dataLimite.setHours(0, 0, 0, 0);
    dataLimite.setDate(dataLimite.getDate() - diasMedia);

    const epsNaJanela = watchedEpisodes
        .map(ep => ({ ep, data: parseDataBR(ep.date) }))
        .filter(x => x.data && x.data >= dataLimite && x.data <= hoje);

    let avgPerDay = 0;
    if (epsNaJanela.length > 0) {
        // Divisor = dias REALMENTE decorridos desde o episódio mais antigo dentro
        // da janela (limitado ao tamanho da janela) — evita diluir a média quando
        // o histórico de atividade é mais curto que "diasMedia".
        const maisAntiga = new Date(Math.min(...epsNaJanela.map(x => x.data.getTime())));
        const diasReaisDecorridos = Math.max(1, Math.ceil((hoje - maisAntiga) / 86400000) + 1);
        avgPerDay = epsNaJanela.length / Math.min(diasMedia, diasReaisDecorridos);
    } else {
        const todasDatas = watchedEpisodes.map(ep => parseDataBR(ep.date)).filter(Boolean).sort((a, b) => a - b);
        if (todasDatas.length > 0) {
            const totalDiasCorridos = Math.max(1, Math.ceil((hoje - todasDatas[0]) / 86400000));
            avgPerDay = watchedCount / totalDiasCorridos;
        }
    }

    // Média de EXIBIÇÃO (nunca abaixo de 1, por clareza no card) vs. média usada
    // nos CÁLCULOS de projeção de datas (preserva frações, sem piso artificial).
    const mediaArredondada = avgPerDay > 0 ? Math.max(1, Math.round(avgPerDay)) : 1;
    const mediaParaCalculo = avgPerDay > 0 ? avgPerDay : (1 / diasMedia);

    // --- 3. Assistidos hoje (geral, para o card de "Ritmo") ---
    const assistidosHoje = episodes.filter(ep => ep.watched && ep.date === hojeString).length;

    // --- 4. Estado do arco (fonte única — antes calculado de formas divergentes
    //         no card "Assistidos no Arco" e no card "Próximo arco") ---
    const firstUnwatched = relevant.find(ep => !ep.watched);
    const watchedRelevantAsc = relevant.filter(ep => ep.watched); // já em ordem crescente de ep
    const lastWatchedRelevant = watchedRelevantAsc.length ? watchedRelevantAsc[watchedRelevantAsc.length - 1] : null;

    const arcoEmProgresso = firstUnwatched ? getArcoInfo(Number(firstUnwatched.ep)) : null;
    const arcoDoUltimoAssistido = lastWatchedRelevant ? getArcoInfo(Number(lastWatchedRelevant.ep)) : null;

    // Detecta o cenário de transição: o arco anterior foi concluído HOJE.
    // Isso resolve o caso em que, ao terminar o último episódio de um arco, o
    // "firstUnwatched" pula direto para o arco seguinte e o card passava a
    // mostrar "amanhã" para o próximo arco em vez de "Hoje!" para o que terminou.
    const concluiuArcoHoje = !!(
        lastWatchedRelevant &&
        arcoDoUltimoAssistido &&
        arcoEmProgresso &&
        arcoDoUltimoAssistido.index < arcoEmProgresso.index &&
        lastWatchedRelevant.date === hojeString
    );

    let remainingInArcCount = 0;
    let tempoArcoTexto = "0m";
    if (firstUnwatched && arcoEmProgresso) {
        remainingInArcCount = relevant.filter(ep =>
            !ep.watched && ep.ep >= arcoEmProgresso.inicio && ep.ep <= arcoEmProgresso.fim
        ).length;
        tempoArcoTexto = formatarTempo(remainingInArcCount * MINUTES_PER_EPISODE);
    }

    // Assistidos hoje que pertencem especificamente ao arco em progresso
    // (evita que episódios de outro tipo/arco assistidos hoje abatam
    // incorretamente o restante do arco atual).
    const assistidosHojeNoArco = arcoEmProgresso
        ? relevant.filter(ep =>
            ep.watched && ep.date === hojeString &&
            ep.ep >= arcoEmProgresso.inicio && ep.ep <= arcoEmProgresso.fim
        ).length
        : 0;

    // ========================================================================
    // ATUALIZAÇÃO DOS SPANS
    // ========================================================================
    if (watchedCountSpan) {
        watchedCountSpan.textContent = `${watchedCount} (${formatarTempo(watchedCount * MINUTES_PER_EPISODE)})`;
    }

    if (remainingCountSpan) {
        remainingCountSpan.textContent = `${missing} Episódios (~${formatarTempo(missing * MINUTES_PER_EPISODE)})`;
    }

    if (hoursWatchedSpan) {
        hoursWatchedSpan.textContent =
            `${assistidosHoje} Episódios (~${formatarTempo(assistidosHoje * MINUTES_PER_EPISODE)}) | Média: ${mediaArredondada} ep/dia`;
    }

    const spanCurrentArc = document.getElementById("currentArcProgress");
    if (spanCurrentArc) {
        if (arcoDoUltimoAssistido) {
            const assistidosNoArco = relevant.filter(ep =>
                ep.watched && ep.ep >= arcoDoUltimoAssistido.inicio && ep.ep <= arcoDoUltimoAssistido.fim
            ).length;
            spanCurrentArc.textContent = `${assistidosNoArco} episódios de ${arcoDoUltimoAssistido.arco}`;
        } else {
            spanCurrentArc.textContent = `0 episódios assistidos`;
        }
    }

    const spanTotalRelevant = document.getElementById("totalRelevant");
    if (spanTotalRelevant) {
        if (concluiuArcoHoje) {
            spanTotalRelevant.textContent = `Arco concluído hoje! Próximo: ${arcoEmProgresso.arco}`;
        } else if (remainingInArcCount > 0) {
            const epsParaAmanha = Math.max(0, remainingInArcCount - assistidosHojeNoArco);
            if (epsParaAmanha === 0) {
                spanTotalRelevant.textContent = `${remainingInArcCount} episódios (~${tempoArcoTexto}) | Próximo arco: Hoje!`;
            } else {
                const daysToNextArc = Math.ceil(epsParaAmanha / mediaParaCalculo);
                const estimatedArcDate = new Date();
                estimatedArcDate.setDate(estimatedArcDate.getDate() + daysToNextArc);
                spanTotalRelevant.textContent =
                    `${remainingInArcCount} episódios (~${tempoArcoTexto}) | Próximo arco em ${daysToNextArc} dias (${formatarDataBR(estimatedArcDate)})`;
            }
        } else if (!firstUnwatched) {
            spanTotalRelevant.textContent = `Você concluiu todos os arcos mapeados! 🎉`;
        } else {
            spanTotalRelevant.textContent = `0 dias (Você já está mudando de arco!)`;
        }
    }

    const spanFinish = document.getElementById("finishPrediction");
    if (spanFinish) {
        if (missing > 0) {
            const daysToFinish = Math.ceil(missing / mediaParaCalculo);
            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() + daysToFinish);
            spanFinish.textContent = `${daysToFinish} dias (${formatarDataBR(estimatedDate)})`;
        } else {
            spanFinish.textContent = `Maratona concluída! 🎉`;
        }
    }
}

/* ============================================================================
 * NAVEGAÇÃO: ir para o último episódio assistido (usado em 2 lugares —
 * unificado aqui em vez de duplicado)
 * ============================================================================ */
function getLastWatchedEpisode() {
    const assistidos = episodes.filter(e => e.watched).sort((a, b) => b.ep - a.ep);
    return assistidos.length ? assistidos[0] : null;
}

function scrollToEpisode(epNumero) {
    const isDesktop = window.innerWidth > 768;
    const selector = isDesktop
        ? `.episode-row[data-ep="${epNumero}"]`
        : `.episode-card[data-ep="${epNumero}"]`;
    const target = document.querySelector(selector);
    if (!target) return false;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("highlight-episode");
    setTimeout(() => target.classList.remove("highlight-episode"), HIGHLIGHT_DURATION_MS);
    return true;
}

goToLastWatchedBtn.addEventListener("click", async () => {
    const lastWatched = getLastWatchedEpisode();
    if (!lastWatched) {
        showToast("🎉 Nenhum episódio assistido ainda!");
        return;
    }

    if (currentFilter !== "all" || searchTerm !== "") {
        currentFilter = "all";
        searchTerm = "";
        searchInput.value = "";
        filterBtns.forEach(b => b.classList.toggle("active-filter", b.dataset.filter === "all"));
        renderCards();
        await new Promise(resolve => requestAnimationFrame(resolve));
    }

    if (!scrollToEpisode(lastWatched.ep)) {
        console.warn("Elemento não encontrado no DOM para o EP:", lastWatched.ep);
    }
});

window.addEventListener("scroll", () => {
    if (window.scrollY > 200) backToTopBtn.classList.add("show");
    else backToTopBtn.classList.remove("show");
});

backToTopBtn.addEventListener("click", () => {
    const lastWatched = getLastWatchedEpisode();
    if (!lastWatched) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    const isDesktop = window.innerWidth > 768;
    const selector = isDesktop
        ? `.episode-row[data-ep="${lastWatched.ep}"]`
        : `.episode-card[data-ep="${lastWatched.ep}"]`;
    const target = document.querySelector(selector);

    if (!target) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    const rect = target.getBoundingClientRect();
    const isAtTarget = Math.abs(rect.top - (window.innerHeight / 2) + (rect.height / 2)) < 100;

    if (isAtTarget || rect.top < 0) {
        if (isAtTarget || window.scrollY < 100) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            scrollToEpisode(lastWatched.ep);
        }
    } else if (window.scrollY < 100) {
        scrollToEpisode(lastWatched.ep);
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

/* ============================================================================
 * BUSCA E FILTROS
 * ============================================================================ */
searchInput.addEventListener("input", debounce((e) => {
    searchTerm = e.target.value;
    renderCards();
}, SEARCH_DEBOUNCE_MS));

filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active-filter"));
    btn.classList.add("active-filter");
    currentFilter = btn.dataset.filter;
    renderCards();
}));

/* ============================================================================
 * INICIALIZAÇÃO
 * ============================================================================ */
async function init() {
    setupCheckboxDelegation();
    dataSourceSelect.value = "sheet";
    const success = await loadEpisodes();
    if (success) {
        renderCards();
        updateStats();
    } else {
        fileStatus.textContent = "❌ Não foi possível carregar os episódios";
        showToast("⚠️ Falha ao carregar dados — verifique a conexão");
    }
}

init();