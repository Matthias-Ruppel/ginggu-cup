const TCG = 'Gerlafingen';
let slides = [];
let current = 0;
let timer = null;

function getDateTime() {
  const now = new Date();

  const date = now.toLocaleDateString('de-CH', {
    weekday: 'short',
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

function tcgMatches(team) {
  return (team.matches || []).filter(isTcgMatch);
}

function nextTcgMatch(team) {
  const list = tcgMatches(team);
  return list.find(m => m.result === '0:0') || list[list.length - 1];
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
    <span class="rank-team">${r.team || ''}</span>
    <span class="rank-points">${r.points ?? ''}</span>
    <span class="rank-sets">${r.sets || ''}</span>
  </li>`;
}

function matchLine(m) {
  const home = isHomeMatch(m);

  return `<li class="${home ? 'home' : 'away'}">
    <span>
      <strong>${m.date || ''}${m.time ? ' · ' + m.time : ''}</strong><br>
      ${m.home || ''} – ${m.away || ''}
    </span>
    <span class="screen-result">${m.result || '-'}</span>
    ${home ? '<span class="home-badge">Heimspiel</span>' : '<span></span>'}
  </li>`;
}

function slideDuration(slide) {
  if (slide.type === 'welcome') return 7000;
  if (slide.type === 'dates') return 16000;
  if (slide.type === 'team') return Math.min(19000, 9000 + (slide.matchCount || 1) * 1500);
  return 11000;
}

function renderSlide() {
  const slide = slides[current];

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
    const el = document.querySelector('.screen-datetime');
    if (el) el.textContent = getDateTime();
  }, 60000);
}

fetch('data/interclub.json')
  .then(r => r.json())
  .then(data => {
    slides.push({
      type: 'welcome',
      html: `<section class="screen-slide welcome-slide screen-light-slide">
        <div class="welcome-panel">
          <img class="welcome-logo" src="logo.png" alt="TC Gerlafingen Logo">
          <span class="screen-badge">Willkommen im Clubhaus</span>
          <h1>TC Gerlafingen</h1>
          <p>Turniere · Interclub · Clubleben · Termine 2026</p>
          <div class="welcome-update">Aktualisiert: ${data.updated || ''}</div>
        </div>
      </section>`
    });

    slides.push({
      type: 'dates',
      html: `<section class="screen-slide dates-slide screen-light-slide">
        <div class="dates-header">
          <div class="dates-brand"><img src="logo.png" alt="TC Gerlafingen Logo"><span>TC Gerlafingen</span></div>
          <div class="dates-title"><h2>Termine 2026</h2><p>Wichtige Anlaesse, Turniere und Clubaktivitaeten</p></div>
          <div></div>
        </div>
        <div class="dates-card-grid">
          <article class="date-card blue"><span class="date-pill">02. Juni</span><p class="date-day">Dienstag</p><h3>Naechster Clubabend mit Essen</h3><p><strong>Chrigu's Kaese-Risotto</strong> mit Grillbeilage.<br>Organisiert von <strong>35+ 3L</strong>.</p></article>
          <article class="date-card blue"><span class="date-pill">19. Juni</span><p class="date-day">Freitag</p><h3>4. Crazy-Tennis Turnier</h3><p>Spass, Bewegung und ein etwas anderes Tennis-Erlebnis fuer unsere Mitglieder.</p></article>
          <article class="date-card yellow"><span class="date-pill">09. August</span><p class="date-day">Sonntag</p><h3>Ginggu-Tagesturnier</h3><p>Damen, Herren und Mixed – kompakt, sportlich und gesellig an einem Tag.</p></article>
          <article class="date-card blue"><span class="date-pill">06. September</span><p class="date-day">Sonntag</p><h3>Finaltag Einzel-Clubmeisterschaften</h3><p>Auf allen Plaetzen. Die Finalspiele der Einzel-Clubmeisterschaften.</p></article>
          <article class="date-card blue"><span class="date-pill">02./03. Mai – 27./28. Juni</span><p class="date-day">Wochenenden</p><h3>Interclub Saison 2026</h3><p>Details nach der Auslosung im TCG-Kalender. Resultate und Ranglisten findest Du unter Interclub 2026.</p></article>
          <article class="date-card yellow"><span class="date-pill">25.–27. September</span><p class="date-day">Freitag bis Sonntag</p><h3>5. Ginggu-Cup</h3><p>Swiss Tennis Turnier auf allen Plaetzen – mit starken Matches und Clubleben pur.</p></article>
        </div>
      </section>`
    });

    data.teams.forEach(team => {
      const name = team.name || team.title || '';
      const group = cleanGroup(team);
      const n = nextTcgMatch(team);
      const matches = tcgMatches(team);
      const home = n && isHomeMatch(n);

      slides.push({
        type: 'team',
        matchCount: matches.length,
        html: `<section class="screen-slide team-slide">
          <div class="screen-team-header">
            <div class="screen-team-name">${name}</div>
            <div class="screen-team-group">${group}</div>
          </div>

          <div class="screen-card next-match">
            <h3>Nächstes TCG-Spiel</h3>
            <p>
              ${n ? `${n.home || ''} – ${n.away || ''}<br>${n.date || ''}${n.time ? ' · ' + n.time + ' Uhr' : ''}` : 'Noch kein Spiel erfasst'}
            </p>
            ${home ? '<span class="home-badge big">Heimspiel</span>' : ''}
          </div>

          <div class="screen-grid lower">
            <div class="screen-card">
              <h3>TCG-Spiele</h3>
              <ul class="screen-match-list">
                ${matches.map(matchLine).join('')}
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
