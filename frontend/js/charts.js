const Charts = {
  renderGauge(containerId, score = 0, category = 'Good') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let color = '#8b5cf6';
    if (score >= 90) color = '#10b981';
    else if (score >= 75) color = '#8b5cf6';
    else if (score >= 60) color = '#f59e0b';
    else color = '#ef4444';

    container.innerHTML = `
      <div class="score-gauge-box">
        <div class="score-circle" style="border-color: ${color}; box-shadow: 0 0 25px ${color}50;">
          <span class="score-number" style="color: ${color}">${score}</span>
          <span class="score-label">ECO SCORE</span>
        </div>
        <div style="margin-top:0.25rem;">
          ${Utils.getCategoryBadge(category, score)}
        </div>
      </div>
    `;
  },

  renderBreakdownBars(containerId, breakdown = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const metrics = [
      { key: 'acceleration', label: 'Acceleration Smoothness', weight: '25%' },
      { key: 'braking', label: 'Braking Smoothness', weight: '20%' },
      { key: 'idle', label: 'Idle Optimization', weight: '15%' },
      { key: 'speedConsistency', label: 'Speed Consistency', weight: '15%' },
      { key: 'efficiency', label: 'Fuel / Energy Efficiency', weight: '15%' },
      { key: 'routeEfficiency', label: 'Route Efficiency', weight: '10%' }
    ];

    let html = '<div style="display:flex; flex-direction:column; gap:1rem;">';
    metrics.forEach(m => {
      const val = breakdown[m.key] !== undefined ? breakdown[m.key] : 80;
      let barColor = '#8b5cf6';
      if (val >= 85) barColor = '#10b981';
      else if (val >= 65) barColor = '#8b5cf6';
      else if (val >= 50) barColor = '#f59e0b';
      else barColor = '#ef4444';

      html += `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.86rem; margin-bottom:0.35rem;">
            <span><strong style="color:#f1f5f9;">${m.label}</strong> <span style="color:#64748b; font-size:0.75rem;">(${m.weight})</span></span>
            <span style="font-weight:700; color:${barColor}; font-family:var(--font-mono);">${val}/100</span>
          </div>
          <div style="height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
            <div style="width:${val}%; height:100%; background:linear-gradient(90deg, ${barColor}90, ${barColor}); border-radius:4px; transition:width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  },

  renderTrendChart(containerId, points = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!points || points.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:1.5rem; color:#64748b;">Not enough trip history yet to display trend visualization.</p>`;
      return;
    }

    const svgWidth = 600;
    const svgHeight = 200;
    const padding = 30;

    const scores = points.map(p => p.avgEcoScore);
    const minScore = Math.min(...scores, 40);
    const maxScore = 100;

    const stepX = (svgWidth - padding * 2) / Math.max(1, points.length - 1);
    
    let pathD = '';
    const dots = [];

    points.forEach((p, idx) => {
      const x = padding + idx * stepX;
      const normalizedY = (p.avgEcoScore - minScore) / (maxScore - minScore);
      const y = (svgHeight - padding) - normalizedY * (svgHeight - padding * 2);

      if (idx === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }

      dots.push({ x, y, score: p.avgEcoScore, date: p.date });
    });

    let svgHtml = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%; height:auto; overflow:visible;">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Horizontal Grid Lines -->
        <line x1="${padding}" y1="${padding}" x2="${svgWidth - padding}" y2="${padding}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
        <line x1="${padding}" y1="${svgHeight / 2}" x2="${svgWidth - padding}" y2="${svgHeight / 2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
        <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" stroke="rgba(255,255,255,0.06)"/>

        <!-- Trend Line -->
        <path d="${pathD}" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round"/>

        <!-- Dots -->
        ${dots.map(d => `
          <circle cx="${d.x}" cy="${d.y}" r="5" fill="#070709" stroke="#c084fc" stroke-width="2.5">
            <title>${d.date}: ${d.score} Eco Score</title>
          </circle>
        `).join('')}
      </svg>
    `;

    container.innerHTML = svgHtml;
  }
};
