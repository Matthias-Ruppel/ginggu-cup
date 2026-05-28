const TCG = 'Gerlafingen';
const DEFAULT_SEASON_YEAR = 2026;
const LAST_PUSH_DATE = '28.05.2026';
const SCREEN_VARIANT = getScreenVariant();
let slides = [];
let current = 0;
let timer = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getScreenVariant() {
  const params = new URLSearchParams(window.location.search);
  const variant = params.get('variant') || params.get('v') || '';
  const path = window.location.pathname.toLowerCase();

  if (
    variant === '2' ||
    path.endsWith('/screen') ||
    path.endsWith('/screen.html') ||
    path.endsWith('/screen2') ||
    path.endsWith('/screen2.html') ||
    path.endsWith('/screen-2') ||
    path.endsWith('/screen-2.html')
  ) {
    return '2';
  }

  return '1';
}

function seasonYear(data) {
  const match = String(data?.season || '').match(/20\d{2}/);
  return match ? Number(match[0]) : DEFAULT_SEASON_YEAR;
}

function getDateTime() {
  const now = new Date();

  const date = now.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const time = now.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${date} · ${time}`;
}

function isTcgMatch(m) {
  return (m.home || '').includes(TCG) || (m.away || '').includes(TCG);
}

function isHomeMatch(m) {
  return (m.home || '').includes(TCG);
}

function isOpenResult(m) {
  const result = String(m.result ?? '').trim();
  return result === '' || result === '-' || result === '0:0';
}

function parseMatchDate(m, year = DEFAULT_SEASON_YEAR) {
  const match = String(m.date || '').match(/(\d{1,2})\.(\d{1,2})\.?/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const [hour = 23, minute = 59] = String(m.time || '').match(/\d{1,2}/g)?.map(Number) || [];

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isPastOpenResult(m, year = DEFAULT_SEASON_YEAR) {
  const date = parseMatchDate(m, year);
  if (!date || !isOpenResult(m)) return false;
  return date < startOfToday();
}

function matchSortValue(m, year = DEFAULT_SEASON_YEAR) {
  const date = parseMatchDate(m, year);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function tcgMatches(team) {
  return [...(team.matches || []), ...(team.playoffs || [])].filter(isTcgMatch);
}

function nextTcgMatch(team, year = DEFAULT_SEASON_YEAR) {
  const futureOpen = tcgMatches(team)
    .filter(m => isOpenResult(m) && !isPastOpenResult(m, year))
    .sort((a, b) => matchSortValue(a, year) - matchSortValue(b, year));

  if (futureOpen.length) return futureOpen[0];

  const all = tcgMatches(team).sort((a, b) => matchSortValue(a, year) - matchSortValue(b, year));
  return all[all.length - 1] || null;
}

function tcgRank(team) {
  return (team.ranking || []).find(r => (r.team || '').includes(TCG));
}

function cleanGroup(team) {
  const name = team.name || team.title || '';
  const group = team.group || '';
  return group.replace(name + ' - ', '');
}

function rankingLine(r) {
  const isTcg = (r.team || '').includes(TCG);
  return `<li class="${isTcg ? 'tcg-rank' : ''}">
    <span class="rank-number">${r.rank ?? ''}</span>
    <span class="rank-team">${escapeHtml(r.team || '')}</span>
    <span class="rank-points">${r.points ?? ''}</span>
    <span class="rank-sets">${escapeHtml(r.sets || '')}</span>
  </li>`;
}

function screenResult(m, year = DEFAULT_SEASON_YEAR) {
  if (isPastOpenResult(m, year)) return 'prüfen';
  const result = String(m.result ?? '').trim();
  return isOpenResult(m) ? '-' : escapeHtml(result);
}

function matchLine(m, year = DEFAULT_SEASON_YEAR) {
  const home = isHomeMatch(m);
  const missing = isPastOpenResult(m, year);
  const phase = m.phase ? `<span class="screen-phase-pill">${escapeHtml(m.phase)}</span> ` : '';

  return `<li class="${home ? 'home' : 'away'} ${missing ? 'missing-screen-result' : ''}">
    <span>
      <strong>${phase}${escapeHtml(m.date || '')}${m.time ? ' · ' + escapeHtml(m.time) : ''}</strong><br>
      ${escapeHtml(m.home || '')} – ${escapeHtml(m.away || '')}
      ${missing ? '<br><em>Resultat offen / prüfen</em>' : ''}
    </span>
    <span class="screen-result">${screenResult(m, year)}</span>
    ${home ? '<span class="home-badge">Heimspiel</span>' : '<span></span>'}
  </li>`;
}

function slideDuration(slide) {
  if (slide.type === 'welcome') return 7000;
  if (slide.type === 'risotto') return 15000;
  if (slide.type === 'dates') return 16000;
  if (slide.type === 'team') return Math.min(21000, 9500 + (slide.matchCount || 1) * 1500);
  return 11000;
}

function renderSlide() {
  const slide = slides[current];

  if (SCREEN_VARIANT === '2') {
    document.body.classList.add('screen-v2-body');
    document.getElementById('screen-root').innerHTML =
      `<div class="screen-v2-shell">
        <main class="screen-v2-main">
          ${slide.html}
        </main>
        <aside class="screen-v2-rail">
          <div class="screen-v2-brand">
            <img src="assets/Logo_transparent_weiss.png" alt="TC Gerlafingen Logo">
            <span class="screen-v2-clock">${getDateTime()}</span>
          </div>

          <section class="screen-v2-event">
            <p class="screen-v2-kicker">Nächstes Event</p>
            <img class="screen-v2-event-image" src="assets/Spezial-Risotto.png" alt="Chrigu's Spezial-Risotto">
            <h2>Chrigu's Spezial-Risotto</h2>
            <p class="screen-v2-date">Dienstag, 02. Juni 2026</p>
            <p class="screen-v2-teaser">Italienischer Clubabend mit Salat, Risotto, Poulet vom Grill und Tiramisu.</p>
            <div class="screen-v2-register">Anmeldung möglich bis 1. Juni</div>
          </section>

          <section class="screen-v2-mini">
            <p class="screen-v2-kicker">Danach</p>
            <h3>4. Crazy-Tennis Turnier</h3>
            <p>Freitag, 19. Juni 2026</p>
          </section>

          <div class="screen-v2-progress">
            <span></span>
            <span>${current + 1}/${slides.length}</span>
          </div>
        </aside>
      </div>`;
    return;
  }

  document.body.classList.remove('screen-v2-body');
  document.getElementById('screen-root').innerHTML =
    `<div class="screen-datetime">${getDateTime()}</div>` +
    slide.html +
    `<div class="screen-footer">
      <span>TC Gerlafingen · Interclub 2026</span>
      <span>${current + 1}/${slides.length}</span>
    </div>`;
}

function scheduleNext() {
  clearTimeout(timer);

  const duration = slideDuration(slides[current]);

  timer = setTimeout(() => {
    current = (current + 1) % slides.length;
    renderSlide();
    scheduleNext();
  }, duration);
}

function start() {
  renderSlide();
  scheduleNext();

  setInterval(() => {
    const el = document.querySelector('.screen-datetime, .screen-v2-clock');
    if (el) el.textContent = getDateTime();
  }, 60000);
}

fetch('data/interclub.json')
  .then(r => r.json())
  .then(data => {
    const year = seasonYear(data);

    slides.push({
      type: 'welcome',
      html: `<section class="screen-slide welcome-slide screen-light-slide">
        <div class="welcome-panel">
          <img class="welcome-logo" src="logo.png" alt="TC Gerlafingen Logo">
          <span class="screen-badge">Willkommen im Clubhaus</span>
          <h1>TC Gerlafingen</h1>
          <p>Turniere · Interclub · Clubleben · Termine 2026</p>
          <div class="welcome-update">Aktualisiert: ${LAST_PUSH_DATE}</div>
        </div>
      </section>`
    });

    if (SCREEN_VARIANT !== '2') {
      slides.push({
        type: 'risotto',
        html: `<section class="screen-slide risotto-screen-slide">
        <div class="risotto-screen-bg">
          <img src="/assets/risotto-clubabend-20260602.jpeg" alt="Chrigu's Spezial-Risotto">
        </div>
        <div class="risotto-screen-overlay"></div>

        <div class="risotto-screen-content">
          <div class="risotto-screen-card">
            <div class="risotto-screen-kicker">Clubabend · Dienstag, 02. Juni 2026</div>

            <h1>Chrigu's Spezial-Risotto</h1>

            <p class="risotto-screen-subtitle">
              Risotto mit Weisswein, Zwiebeln und Raclettekäse
            </p>

            <p class="risotto-screen-lead">
              Die Herren 35+ 3. Liga<br>
              laden euch herzlich zum italienischen Clubabend ein.
            </p>

            <div class="risotto-screen-menu">
              <div class="risotto-screen-course">
                <strong>Vorspeise</strong>
                <span>Tomaten-Mozzarella-Salat</span>
              </div>
              <div class="risotto-screen-course featured">
                <strong>Hauptrolle</strong>
                <span>Chrigu's Risotto</span>
              </div>
              <div class="risotto-screen-course">
                <strong>Vom Grill</strong>
                <span>Poulet vom Grill</span>
              </div>
              <div class="risotto-screen-course">
                <strong>Dessert</strong>
                <span>Tiramisu</span>
              </div>
            </div>

            <div class="risotto-screen-bottom">
              <div class="risotto-screen-price">Menu: CHF 17.50</div>
              <div class="risotto-screen-cta">Jetzt auf tc-gerlafingen.ch anmelden</div>
            </div>
          </div>
        </div>
      </section>`
      });
    }

    slides.push({
      type: 'dates',
      html: `<section class="screen-slide dates-slide screen-light-slide">
        <div class="dates-header">
          <div class="dates-brand"><img src="logo.png" alt="TC Gerlafingen Logo"><span>TC Gerlafingen</span></div>
          <div class="dates-title"><h2>Termine 2026</h2><p>Wichtige Anlässe, Turniere und Clubaktivitäten</p></div>
          <div></div>
        </div>
        <div class="dates-card-grid">
          <article class="date-card blue"><span class="date-pill">02. Juni</span><p class="date-day">Dienstag</p><h3>Nächster Clubabend mit Essen</h3><p><strong>Chrigu's Käse-Risotto</strong> mit Grillbeilage.<br>Organisiert von <strong>35+ 3L</strong>.</p></article>
          <article class="date-card blue"><span class="date-pill">19. Juni</span><p class="date-day">Freitag</p><h3>4. Crazy-Tennis Turnier</h3><p>Spass, Bewegung und ein etwas anderes Tennis-Erlebnis für unsere Mitglieder.</p></article>
          <article class="date-card yellow"><span class="date-pill">09. August</span><p class="date-day">Sonntag</p><h3>Ginggu-Tagesturnier</h3><p>Damen, Herren und Mixed – kompakt, sportlich und gesellig an einem Tag.</p></article>
          <article class="date-card blue"><span class="date-pill">06. September</span><p class="date-day">Sonntag</p><h3>Finaltag Einzel-Clubmeisterschaften</h3><p>Auf allen Plätzen. Die Finalspiele der Einzel-Clubmeisterschaften.</p></article>
          <article class="date-card blue"><span class="date-pill">02./03. Mai – 27./28. Juni</span><p class="date-day">Wochenenden</p><h3>Interclub Saison 2026</h3><p>Details nach der Auslosung im TCG-Kalender. Resultate und Ranglisten findest Du unter Interclub 2026.</p></article>
          <article class="date-card yellow"><span class="date-pill">25.–27. September</span><p class="date-day">Freitag bis Sonntag</p><h3>5. Ginggu-Cup</h3><p>Swiss Tennis Turnier auf allen Plätzen – mit starken Matches und Clubleben pur.</p></article>
        </div>
      </section>`
    });

    (data.teams || []).forEach(team => {
      const name = team.name || team.title || '';
      const group = cleanGroup(team);
      const n = nextTcgMatch(team, year);
      const matches = tcgMatches(team).sort((a, b) => matchSortValue(a, year) - matchSortValue(b, year));
      const home = n && isHomeMatch(n);
      const rank = tcgRank(team);
      const missingCount = matches.filter(m => isPastOpenResult(m, year)).length;
      const phase = n?.phase ? `<span class="screen-phase-pill big">${escapeHtml(n.phase)}</span> ` : '';

      slides.push({
        type: 'team',
        matchCount: matches.length,
        html: `<section class="screen-slide team-slide">
          <div class="screen-team-header">
            <div class="screen-team-name">${escapeHtml(name)}</div>
            <div class="screen-team-group">${escapeHtml(group)}${rank ? ` · TCG Rang ${rank.rank}` : ''}</div>
          </div>

          <div class="screen-card next-match">
            <h3>Nächstes TCG-Spiel</h3>
            <p>
              ${n ? `${phase}${escapeHtml(n.home || '')} – ${escapeHtml(n.away || '')}<br>${escapeHtml(n.date || '')}${n.time ? ' · ' + escapeHtml(n.time) + ' Uhr' : ''}` : 'Noch kein Spiel erfasst'}
            </p>
            ${home ? '<span class="home-badge big">Heimspiel</span>' : ''}
          </div>

          <div class="screen-grid lower">
            <div class="screen-card">
              <h3>TCG-Spiele${missingCount ? ` · ${missingCount} Resultat offen` : ''}</h3>
              <ul class="screen-match-list">
                ${matches.map(m => matchLine(m, year)).join('')}
              </ul>
            </div>
            <div class="screen-card">
              <h3>Rangliste</h3>
              <div class="screen-ranking-head">
                <span>Rang</span><span>Team</span><span>PT</span><span>Sätze</span>
              </div>
              <ul class="screen-ranking-list">
                ${(team.ranking || []).map(rankingLine).join('')}
              </ul>
            </div>
          </div>
        </section>`
      });
    });

    start();
  })
  .catch(() => {
    document.getElementById('screen-root').innerHTML =
      '<section class="screen-slide"><h1>Daten konnten nicht geladen werden.</h1></section>';
  });
