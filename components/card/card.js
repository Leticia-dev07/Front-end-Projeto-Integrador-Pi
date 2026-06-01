/**
 * components/card/card.js
 * Stat card builder and chart helpers.
 */
const Card = {
  stat({ icon, label, value, delta, color = 'blue', id = '' }) {
    return `
      <div class="stat-card ${color}" ${id ? `id="${id}"` : ''}>
        <div class="stat-icon"><i class="${icon}"></i></div>
        <div class="stat-info">
          <p class="stat-label">${label}</p>
          <p class="stat-value">${value}</p>
          ${delta ? `<p class="stat-delta">${delta}</p>` : ''}
        </div>
      </div>`;
  },

  /** Animate number counting up */
  animateCount(el, to, duration = 800) {
    if (!el) return;
    const from = 0;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /** Simple bar chart */
  barChart(data, maxVal = null) {
    const max = maxVal || Math.max(...data.map(d => d.value), 1);
    return `
      <div class="chart-bars">
        ${data.map(d => `
          <div class="chart-bar" style="height:${Helpers.pct(d.value, max)}%;background:var(--accent);opacity:0.8" title="${d.label}: ${d.value}">
            <div class="bar-tooltip">${d.label}: ${d.value}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:6px;margin-top:var(--space-2)">
        ${data.map(d => `<div style="flex:1;font-size:0.6rem;text-align:center;color:var(--gray-400);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.label}</div>`).join('')}
      </div>`;
  },

  /** Donut-style progress rings (SVG) */
  donut(pct, color = 'var(--accent)', size = 80) {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * (pct / 100);
    return `
      <svg width="${size}" height="${size}" style="transform:rotate(-90deg)">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--gray-100)" stroke-width="8"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="8"
          stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
          style="transition:stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)"/>
      </svg>`;
  },
};

window.Card = Card;
