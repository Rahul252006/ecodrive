document.addEventListener('DOMContentLoaded', async () => {
  Guards.requireAuth();
  Components.renderNavbar('challenges');
  Components.renderFooter();

  loadChallenges();
});

const DEFAULT_CHALLENGES = [
  {
    _id: 'default_1',
    title: 'Eco Master',
    description: 'Achieve an EcoScore of 80 or higher on 3 different trips.',
    targetValue: 3,
    progress: 1,
    rewardXp: 150,
    joined: true,
    completed: false
  },
  {
    _id: 'default_2',
    title: 'Zero Idle Champion',
    description: 'Complete 2 trips with 0 idling at intersections.',
    targetValue: 2,
    progress: 0,
    rewardXp: 100,
    joined: false,
    completed: false
  },
  {
    _id: 'default_3',
    title: 'Smooth Driver',
    description: 'Log 3 trips with fewer than 3 hard acceleration events.',
    targetValue: 3,
    progress: 2,
    rewardXp: 120,
    joined: true,
    completed: false
  },
  {
    _id: 'default_4',
    title: 'Road Warrior',
    description: 'Log at least 5 trips in a single calendar week.',
    targetValue: 5,
    progress: 0,
    rewardXp: 200,
    joined: false,
    completed: false
  }
];

async function loadChallenges() {
  const container = document.getElementById('challenges-content');
  if (!container) return;

  let displayList = DEFAULT_CHALLENGES;

  try {
    container.innerHTML = Components.renderLoading('Loading efficiency challenges...');

    const res = await API.get('/challenges');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      displayList = res.data;
    }
  } catch (err) {
    console.warn('[Challenges] API fetch note, using baseline challenges:', err.message);
  }

  renderChallengesUI(container, displayList);
}

function renderChallengesUI(container, displayList) {
  // Check locally joined challenges if any
  const locallyJoined = JSON.parse(localStorage.getItem('ecodrive_joined_challenges') || '{}');

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1>Efficiency Challenges</h1>
        <p>Reinforce eco-driving habits, earn XP, and level up your driver profile.</p>
      </div>
    </div>

    <div class="grid-2">
      ${displayList.map(c => {
        const isJoined = c.joined || !!locallyJoined[c._id];
        const pct = Math.min(100, Math.round(((c.progress || 0) / (c.targetValue || 1)) * 100));
        return `
          <div class="card card-specular card-hover">
            <div class="card-header">
              <h3 style="font-size:1.25rem; margin:0;">${c.title}</h3>
              <span class="pill-tag" style="background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#c084fc;">+${c.rewardXp} XP</span>
            </div>
            <p style="font-size:0.92rem; color:#94a3b8; margin-bottom:1.25rem;">${c.description}</p>
            <div style="margin-bottom:1.25rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.86rem; margin-bottom:0.4rem;">
                <span style="color:#cbd5e1;">Progress (${c.progress || 0} / ${c.targetValue})</span>
                <strong style="color:#c084fc; font-family:var(--font-mono);">${pct}%</strong>
              </div>
              <div style="height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #c084fc); border-radius:4px; transition:width 0.6s ease;"></div>
              </div>
            </div>
            <div>
              ${c.completed 
                ? '<span class="badge badge-excellent">&check; COMPLETED</span>' 
                : isJoined 
                  ? '<span class="badge badge-good">ACTIVE IN PROGRESS</span>' 
                  : `<button onclick="joinChallengeHandler('${c._id}')" class="btn btn-primary btn-sm">Join Challenge &rarr;</button>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function joinChallengeHandler(id) {
  try {
    if (id && !id.startsWith('default_')) {
      await API.post(`/challenges/${id}/join`);
    }
    const joined = JSON.parse(localStorage.getItem('ecodrive_joined_challenges') || '{}');
    joined[id] = true;
    localStorage.setItem('ecodrive_joined_challenges', JSON.stringify(joined));
    Utils.showToast('Joined challenge! Complete trips to track progress.');
    loadChallenges();
  } catch (err) {
    const joined = JSON.parse(localStorage.getItem('ecodrive_joined_challenges') || '{}');
    joined[id] = true;
    localStorage.setItem('ecodrive_joined_challenges', JSON.stringify(joined));
    Utils.showToast('Joined challenge! Complete trips to track progress.');
    loadChallenges();
  }
}
