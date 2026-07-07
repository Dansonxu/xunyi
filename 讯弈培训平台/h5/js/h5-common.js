const H5Common = {
  tabs: [
    { name: "首页", icon: "fa-house", href: "index.html", page: "index" },
    { name: "资料", icon: "fa-book", href: "materials.html", page: "materials" },
    { name: "培训", icon: "fa-graduation-cap", href: "training-programs.html", page: "training" },
    { name: "考试", icon: "fa-file-pen", href: "exams.html", page: "exams" },
    { name: "我的", icon: "fa-user", href: "profile.html", page: "profile" }
  ],

  init(options = {}) {
    DataStore.initMockData();
    this.ensureLearnerUser();
    if (!options.hideHeader) this.renderHeader(options);
    if (!options.hideTabbar) this.renderTabbar(options.activeTab);
  },

  ensureLearnerUser() {
    let user = DataStore.getCurrentUser();
    if (!user || (user.role !== "agent" && user.role !== "employee")) {
      // Demo fallback: assign first agent for backward compatibility
      const agents = DataStore.getUsers().filter(u => u.role === "agent");
      if (agents.length) {
        DataStore.setCurrentUser(agents[0]);
      }
    }
  },

  getCurrentLearner() {
    return DataStore.getCurrentUser();
  },

  getLearnerRole() {
    const user = this.getCurrentLearner();
    return user ? user.role : "";
  },

  isAgent() {
    return this.getLearnerRole() === "agent";
  },

  isEmployee() {
    return this.getLearnerRole() === "employee";
  },

  getVisibleMaterials() {
    const user = this.getCurrentLearner();
    return user ? DataStore.getVisibleMaterials(user) : [];
  },

  getVisibleExams() {
    const user = this.getCurrentLearner();
    return user ? DataStore.getVisibleExams(user) : [];
  },

  getVisibleTrainingPrograms() {
    const user = this.getCurrentLearner();
    return user ? DataStore.getVisibleTrainingPrograms(user) : [];
  },

  // Backward compatibility alias
  getCurrentAgent() {
    return this.getCurrentLearner();
  },

  renderHeader(options) {
    const existing = document.querySelector(".h5-header");
    if (existing) existing.remove();

    const header = document.createElement("header");
    header.className = "h5-header";
    const backHtml = options.showBack
      ? `<a href="javascript:history.back()" class="h5-header-back"><i class="fa-solid fa-chevron-left"></i></a>`
      : "";
    const actionHtml = options.headerAction
      ? `<a href="${options.headerAction.href}" class="h5-header-action">${options.headerAction.text}</a>`
      : "";
    header.innerHTML = `${backHtml}<div class="h5-header-title">${options.title || ""}</div>${actionHtml}`;
    document.body.insertBefore(header, document.body.firstChild);
    if (typeof window.replaceHeroicons === "function") {
      window.replaceHeroicons();
    }
  },

  renderTabbar(activePage) {
    const existing = document.querySelector(".h5-tabbar");
    if (existing) existing.remove();

    const tabbar = document.createElement("nav");
    tabbar.className = "h5-tabbar";
    tabbar.innerHTML = this.tabs.map(tab => `
      <a href="${tab.href}" class="h5-tabbar-item ${tab.page === activePage ? "active" : ""}">
        <i class="fa-solid ${tab.icon}"></i>
        <span>${tab.name}</span>
      </a>
    `).join("");
    document.body.appendChild(tabbar);
    if (typeof window.replaceHeroicons === "function") {
      window.replaceHeroicons();
    }
  },

  toast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const iconMap = { success: "fa-check-circle", error: "fa-circle-xmark", warning: "fa-triangle-exclamation" };
    toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.success}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  getQueryParam(name) {
    return new URLSearchParams(location.search).get(name);
  },

  formatTypeLabel(type) {
    const map = { pdf: "PDF", word: "Word", video: "视频" };
    return map[type] || type;
  },

  formatDuration(minutes) {
    return `${minutes} 分钟`;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = H5Common;
}
