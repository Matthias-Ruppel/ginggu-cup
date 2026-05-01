const TCG = 'Gerlafingen';

function isHomeMatch(m) {
  return (m.home || '').includes(TCG) || (m.away || '').includes(TCG);
}

function nextMatch(team) {
  return team.matches.find(m => m.result === '0:0') || team.matches[team.matches.length - 1];
}

function tcgRank(team) {
  return team.ranking.find(r => (r.team || '').includes(TCG));
}

function cleanGroup(team) {
  const name = team.name || team.title || '';
  const group = team.group || '';
  return group.replace(name + ' - ', '');
}

function matchRow(m) {
  return `<tr class="${isHomeMatch(m) ? 'home-match' : ''}">
    <td>${m.round || ''}</td>
    <td>${m.date || ''}${m.time ? ' - ' + m.time : ''}</td>
    <td>${m.home || ''} - ${m.away || ''}</td>
    <td><strong>${m.result || '-'}</strong></td>
  </tr>`;
}

function rankingRow(r) {
  return `<tr class="${(r.team || '').includes(TCG) ? 'home-match' : ''}">
    <td>${r.rank ?? ''}</td>
    <td>${r.team || ''}</td>
    <td>${r.points ?? ''}</td>
    <td>${r.sets || ''}</td>
  </tr>`;
}

function teamCard(team) {
  const n = nextMatch(team);
  const rank = tcgRank(team);
  const name = team.name || team.title || '';
  const group = cleanGroup(team);
  const slug = team.slug || team.id || '';

  return `<article class="team-card">
    <div class="team-card-head">
      <h3>${name}</h3>
      <p class="team-meta">${group}</p>
    </div>

    <div class="team-card-next">
      <p><strong>Nächstes TCG-Spiel:</strong><br>
        ${n.home || ''} - ${n.away || ''}<br>
        ${n.date || ''}${n.time ? ' um ' + n.time : ''}
      </p>
    </div>

    <div class="team-card-rank">
      <p><strong>Aktueller Rang TCG:</strong> ${rank ? rank.rank : '-'}</p>
    </div>

    <a class="button primary team-card-button" href="#${slug}">Details anzeigen</a>
  </article>`;
}

function teamDetail(team) {
  const name = team.name || team.title || '';
  const group = cleanGroup(team);
  const captain = team.captain || 'noch offen';
  const slug = team.slug || team.id || '';

  return `<article class="detail-card" id="${slug}">
    <div class="detail-header">
      <div>
        <h2>${name}</h2>
        <p class="team-meta">${group}</p>
        <p>Captain: ${captain}</p>
      </div>
    </div>

    <div class="tables">
      <div class="table-wrap">
        <h3>Spielplan & Resultate</h3>
        <table>
          <thead><tr><th>Runde</th><th>Datum</th><th>Begegnung</th><th>Resultat</th></tr></thead>
          <tbody>${team.matches.map(matchRow).join('')}</tbody>
        </table>
      </div>

      <div class="table-wrap">
        <h3>Rangliste</h3>
        <table>
          <thead><tr><th>Rang</th><th>Team</th><th>PT</th><th>Sätze</th></tr></thead>
          <tbody>${team.ranking.map(rankingRow).join('')}</tbody>
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
    document.getElementById('team-overview').innerHTML = data.teams.map(teamCard).join('');
    document.getElementById('team-details').innerHTML = data.teams.map(teamDetail).join('');
  })
  .catch(() => {
    document.getElementById('team-overview').innerHTML = '<p>Interclub-Daten konnten nicht geladen werden.</p>';
  });
