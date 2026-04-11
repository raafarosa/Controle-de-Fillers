# 🏴‍☠️ One Piece Tracker

Este é um sistema de gerenciamento de progresso para a maratona do anime **One Piece**. O projeto nasceu da necessidade de centralizar o controle de episódios assistidos de forma personalizada, integrando ferramentas de desenvolvimento web com o ecossistema do Google.

> [!IMPORTANTE]  
> **Objetivo do Projeto:** Este sistema foi desenvolvido estritamente para **fins de estudo e uso pessoal**. Ele serve como um laboratório para praticar lógica de programação, manipulação de APIs e sincronização de dados em tempo real.

---

## 🚀 Funcionalidades

* **Sincronização com Google Sheets:** Atua como um "espelho" de uma planilha, utilizando-a como banco de dados principal.
* **Controle Inteligente de Stats:** Calcula automaticamente o total de episódios assistidos, horas restantes e progresso baseado apenas em conteúdos Canon (ignorando Fillers nos cálculos de tempo).
* **Filtros Dinâmicos:** Filtragem rápida por tipo (Manga Canon, Anime Canon, Mixed, Filler) e busca por título ou número.
* **Interface Adaptável (Mobile First):** Design focado em usabilidade móvel com suporte a **PWA** (instalação como aplicativo).
* **Fuso Horário Local:** Registro de datas de conclusão sincronizado com o horário de Brasília (UTC-3), independente do servidor.
* **Persistência Híbrida:** Utiliza `localStorage` para feedback instantâneo da UI e chamadas assíncronas via Google Apps Script para persistência definitiva.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5, CSS3 (Moderno/Responsivo) e Vanilla JavaScript (ES6+).
* **Backend / Database:** [Google Apps Script](https://developers.google.com/apps-script) servindo como uma API intermediária e [Google Sheets](https://www.google.com/sheets/about/) como banco de dados NoSQL.
* **PWA:** Service Workers e Manifest para suporte offline e instalação.

---

## 📂 Estrutura do Projeto

```text
├── assets/
│   ├── css/          # Estilização visual (Cards, Tabelas, Filtros)
│   └── js/           # Lógica principal (main.js) e tratamento de dados
├── index.html        # Estrutura principal da aplicação
├── manifest.json     # Configurações do PWA
├── sw.js             # Service Worker para cache e offline
└── matriz.json       # Backup local dos dados dos episódios
```

---

## ⚙️ Como Funciona a Integração?

1.  O sistema consome os dados da planilha via **Google Visualization API** (JSON).
2.  Ao marcar um episódio, o JavaScript captura o evento, atualiza o estado local e dispara uma requisição `GET` para o **Google Apps Script**.
3.  O Script recebe o número do episódio, o status e a data formatada pelo navegador (`pt-BR`) e atualiza as células correspondentes na planilha.
4.  O sistema lê as datas gravadas para exibir o histórico de conclusão diretamente nos cards.

---

## 📝 Notas de Estudo

Durante o desenvolvimento, foram explorados conceitos de:
* Manipulação de DOM de alta performance.
* Tratamento de fuso horário em ambientes distribuídos.
* Criação de APIs simples com Google Apps Script.
* Otimização de cache e Service Workers.

---
*Desenvolvido com carinho vontade de terminar o anime.
