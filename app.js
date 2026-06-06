const TCG = 'Gerlafingen';
const DEFAULT_SEASON_YEAR = 2026;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function seasonYear(data) {
  const match = String(data?.season || '').match(/20\d{2}/);
  return match ? Number(match[0]) : DEFAULT_SEASON_YEAR;
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

function allTcgMatches(team) {
  return [...(team.matches || []), ...(team.playoffs || [])].filter(isTcgMatch);
}

function nextMatch(team, year = DEFAULT_SEASON_YEAR) {
  const futureOpen = allTcgMatches(team)
    .filter(m => isOpenResult(m) && !isPastOpenResult(m, year))
    .sort((a, b) => matchSortValue(a, year) - matchSortValue(b, year));

  if (futureOpen.length) return futureOpen[0];

  const all = allTcgMatches(team).sort((a, b) => matchSortValue(a, year) - matchSortValue(b, year));
  return all[all.length - 1] || null;
}

function displayValue(value) {
  return value === undefined || value === null ? '' : value;
}

function tcgRank(team) {
  return (team.ranking || []).find(r => (r.team || '').includes(TCG));
}

function cleanGroup(team) {
  const name = team.name || team.title || '';
  const group = team.group || '';
  return group.replace(name + ' - ', '');
}

function formatDateTime(m) {
  const date = escapeHtml(m.date || '');
  const time = escapeHtml(m.time || '');
  return `${date}${time ? ' - ' + time : ''}`;
}

function formatTeamLabel(team, m) {
  const marked =
    (team === m.home && m.homeMarkedWithStar) ||
    (team === m.away && m.awayMarkedWithStar);

  return `${marked ? '* ' : ''}${escapeHtml(team || '')}`;
}

function formatMatchName(m) {
  const teams = Array.isArray(m.displayOrder) && m.displayOrder.length
    ? m.displayOrder
    : [m.home, m.away];

  return teams.map(team => formatTeamLabel(team, m)).join(' - ');
}

function formatResult(m, year = DEFAULT_SEASON_YEAR) {
  const result = String(m.result ?? '').trim();

  if (isPastOpenResult(m, year)) {
    return '<span class="missing-result-note">Resultat offen / prüfen</span>';
  }

  return isOpenResult(m) ? '-' : escapeHtml(result);
}

function matchRow(m, year = DEFAULT_SEASON_YEAR) {
  const classes = [isTcgMatch(m) ? 'home-match' : '', isPastOpenResult(m, year) ? 'missing-result' : '', m.phase ? 'phase-match' : '']
    .filter(Boolean)
    .join(' ');

  return `<tr class="${classes}">
    <td>${escapeHtml(m.round || '')}</td>
    <td>${formatDateTime(m)}</td>
    <td>${formatMatchName(m)}</td>
    <td><strong>${formatResult(m, year)}</strong></td>
  </tr>`;
}

function rankingRow(r) {
  return `<tr class="${(r.team || '').includes(TCG) ? 'home-match' : ''}">
    <td>${displayValue(r.rank)}</td>
    <td>${escapeHtml(r.team || '')}</td>
    <td>${displayValue(r.points)}</td>
    <td>${escapeHtml(r.sets || '')}</td>
  </tr>`;
}

function teamCard(team, year = DEFAULT_SEASON_YEAR) {
  const n = nextMatch(team, year);
  const rank = tcgRank(team);
  const name = team.name || team.title || '';
  const group = cleanGroup(team);
  const slug = team.slug || team.id || '';
  const phase = n?.phase ? `<span class="phase-pill">${escapeHtml(n.phase)}</span> ` : '';
  const nextInfo = n
    ? `${phase}${formatMatchName(n)}<br>${escapeHtml(n.date || '')}${n.time ? ' um ' + escapeHtml(n.time) : ''}`
    : 'Noch kein TCG-Spiel erfasst';

  return `<article class="team-card">
    <div class="team-card-head">
      <h3>${escapeHtml(name)}</h3>
      <p class="team-meta">${escapeHtml(group)}</p>
    </div>

    <div class="team-card-next">
      <p><strong>Nächstes TCG-Spiel:</strong><br>
        ${nextInfo}
      </p>
    </div>

    <div class="team-card-rank">
      <p><strong>Aktueller Rang TCG:</strong> ${rank ? rank.rank : '-'}</p>
    </div>

    <a class="button primary team-card-button" href="#${escapeHtml(slug)}">Details anzeigen</a>
  </article>`;
}

function playoffSections(team, year = DEFAULT_SEASON_YEAR) {
  const playoffs = team.playoffs || [];
  if (!playoffs.length) return '';

  const phases = [...new Set(playoffs.map(m => m.phase || 'Zusatzspiel'))];

  return phases.map(phase => {
    const rows = playoffs.filter(m => (m.phase || 'Zusatzspiel') === phase).map(m => matchRow(m, year)).join('');
    return `<div class="table-wrap phase-table">
      <h3>${escapeHtml(phase)}</h3>
      <table>
        <thead><tr><th>Runde</th><th>Datum</th><th>Begegnung</th><th>Resultat</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');
}

function teamDetail(team, year = DEFAULT_SEASON_YEAR) {
  const name = team.name || team.title || '';
  const group = cleanGroup(team);
  const captain = team.captain || 'noch offen';
  const slug = team.slug || team.id || '';
  const missingCount = [...(team.matches || []), ...(team.playoffs || [])].filter(m => isPastOpenResult(m, year)).length;
  const missingHint = missingCount
    ? `<p class="data-hint">Hinweis: Bei ${missingCount === 1 ? 'einer Begegnung ist' : missingCount + ' Begegnungen sind'} das Resultat noch offen oder noch nicht nachgetragen.</p>`
    : '';

  return `<article class="detail-card" id="${escapeHtml(slug)}">
    <div class="detail-header">
      <div>
        <h2>${escapeHtml(name)}</h2>
        <p class="team-meta">${escapeHtml(group)}</p>
        <p>Captain: ${escapeHtml(captain)}</p>
        ${missingHint}
      </div>
    </div>

    <div class="tables">
      <div class="table-wrap">
        <h3>Spielplan & Resultate</h3>
        <table>
          <thead><tr><th>Runde</th><th>Datum</th><th>Begegnung</th><th>Resultat</th></tr></thead>
          <tbody>${(team.matches || []).map(m => matchRow(m, year)).join('')}</tbody>
        </table>
      </div>

      ${playoffSections(team, year)}

      <div class="table-wrap">
        <h3>Rangliste</h3>
        <table>
          <thead><tr><th>Rang</th><th>Team</th><th>PT</th><th>Sätze</th></tr></thead>
          <tbody>${(team.ranking || []).map(rankingRow).join('')}</tbody>
        </table>
      </div>
    </div>

    <div class="detail-bottom-actions">
      <a class="button primary top-button" href="#top">Nach oben</a>
    </div>
  </article>`;
}

fetch('data/interclub.json')
  .then(r => r.json())
  .then(data => {
    const year = seasonYear(data);
    document.getElementById('team-overview').innerHTML = (data.teams || []).map(team => teamCard(team, year)).join('');
    document.getElementById('team-details').innerHTML = (data.teams || []).map(team => teamDetail(team, year)).join('');
  })
  .catch(() => {
    document.getElementById('team-overview').innerHTML = '<p>Interclub-Daten konnten nicht geladen werden.</p>';
  });
