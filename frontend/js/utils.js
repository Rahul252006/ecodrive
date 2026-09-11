const Utils = {
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  formatNumber(val, decimals = 1) {
    if (val === null || val === undefined || isNaN(val)) return 'N/A';
    return Number(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    return '$' + Number(amount).toFixed(2);
  },

  getCategoryBadge(category, score) {
    let catStr = category;
    if (!catStr && score !== undefined) {
      if (score >= 90) catStr = 'Excellent';
      else if (score >= 75) catStr = 'Good';
      else if (score >= 60) catStr = 'Fair';
      else catStr = 'Poor';
    }
    catStr = catStr || 'Good';
    const slug = catStr.toLowerCase().replace(/\s+/g, '-');
    return `<span class="status-pill status-pill-${slug}"><span class="status-dot"></span>${catStr}</span>`;
  },

  getProvenanceBadge(type) {
    const label = type || 'estimated';
    return `<span class="provenance-tag" title="Data provenance">${label}</span>`;
  },

  renderLoading(text = 'Loading...') {
    return `
      <div class="loading-state">
        <div class="mini-spinner"></div>
        <span class="loading-text">${text}</span>
      </div>
    `;
  },

  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
