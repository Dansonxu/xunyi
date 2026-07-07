const AdminCommon = {
  menu: [
    { title: "概览", items: [
      { name: "首页", icon: "fa-house", href: "index.html" }
    ]},
    { title: "内容管理", items: [
      { name: "资料管理", icon: "fa-book", href: "materials.html" },
      { name: "分类配置", icon: "fa-tags", href: "categories.html", adminOnly: true },
      { name: "题库管理", icon: "fa-circle-question", href: "question-bank.html" },
      { name: "考试管理", icon: "fa-file-pen", href: "exams.html" },
      { name: "培训项目管理", icon: "fa-graduation-cap", href: "training-programs.html" }
    ]},
    { title: "用户与数据", items: [
      { name: "账号管理", icon: "fa-user-gear", href: "users.html", adminOnly: true },
      { name: "学员管理", icon: "fa-users", href: "learners.html", adminOnly: true },
      { name: "学习统计", icon: "fa-chart-line", href: "stats-study.html", adminOnly: true },
      { name: "考试统计", icon: "fa-chart-pie", href: "stats-exam.html", adminOnly: true }
    ]}
  ],

  roleLabel(user) {
    if (!user) return "";
    if (user.role === "admin") return "管理员";
    if (user.role === "agent") return "代理运营";
    if (user.role === "employee") return "员工运营";
    return "";
  },

  init(activePage) {
    DataStore.initMockData();
    this.checkAuth();
    this.guardPage(activePage);
    this.renderLayout(activePage);
  },

  checkAuth() {
    const user = DataStore.getCurrentUser();
    if (!user || !user.isBackendUser) {
      if (!location.pathname.includes("login.html")) {
        location.href = "login.html";
      }
    }
  },

  // Block operator accounts from opening admin-only pages directly via URL.
  guardPage(activePage) {
    const user = DataStore.getCurrentUser();
    if (!user || user.role === "admin") return;
    const adminOnlyPages = this.menu
      .flatMap(g => g.items)
      .filter(i => i.adminOnly)
      .map(i => i.href);
    if (adminOnlyPages.includes(activePage)) {
      location.href = "index.html";
    }
  },

  renderLayout(activePage) {
    const user = DataStore.getCurrentUser();
    if (!user) return;

    const layout = document.querySelector(".admin-layout");
    if (!layout) return;

    const pathPrefix = "";
    const sidebarHtml = this.renderSidebar(activePage, pathPrefix);
    const headerHtml = this.renderHeader(user);

    layout.insertAdjacentHTML("afterbegin", sidebarHtml);
    const main = layout.querySelector(".admin-main");
    if (main) {
      main.insertAdjacentHTML("afterbegin", headerHtml);
    }
    if (typeof window.replaceHeroicons === "function") {
      window.replaceHeroicons();
    }
  },

  renderSidebar(activePage, prefix = "") {
    const user = DataStore.getCurrentUser();
    const isAdmin = user && user.role === "admin";
    const itemsHtml = this.menu.map(group => {
      const items = group.items.filter(item => isAdmin || !item.adminOnly);
      if (!items.length) return "";
      return `
      <div class="admin-menu-group">
        <div class="admin-menu-title">${group.title}</div>
        ${items.map(item => `
          <a href="${prefix}${item.href}" class="admin-menu-item ${item.href === activePage ? "active" : ""}">
            <i class="fa-solid ${item.icon}"></i>
            <span>${item.name}</span>
          </a>
        `).join("")}
      </div>
    `;
    }).join("");

    return `
      <aside class="admin-sidebar">
        <div class="admin-logo">
          <i class="fa-solid fa-graduation-cap"></i>
          讯弈培训平台
        </div>
        <nav class="admin-menu">${itemsHtml}</nav>
      </aside>
    `;
  },

  renderHeader(user) {
    return `
      <header class="admin-header">
        <div class="admin-breadcrumb">
          <a href="index.html">首页</a>
        </div>
        <div class="admin-header-right">
          <div class="admin-user" onclick="AdminCommon.logout()" title="退出登录">
            <div class="admin-user-avatar">${user.name.charAt(0)}</div>
            <span class="admin-user-name">${user.name}</span>
            <span class="badge badge-info" style="margin-left:4px;">${this.roleLabel(user)}</span>
            <i class="fa-solid fa-right-from-bracket text-muted"></i>
          </div>
        </div>
      </header>
    `;
  },

  logout() {
    if (confirm("确定要退出登录吗？")) {
      DataStore.logout();
      location.href = "login.html";
    }
  },

  setPageTitle(title) {
    const el = document.querySelector(".admin-page-title");
    if (el) el.textContent = title;
    const breadcrumb = document.querySelector(".admin-breadcrumb");
    if (breadcrumb) {
      breadcrumb.innerHTML = `<a href="index.html">首页</a> > <span class="current">${title}</span>`;
    }
    document.title = `${title} - 讯弈培训平台`;
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

  formatDateTime(str) {
    return str || "-";
  },

  getQueryParam(name) {
    return new URLSearchParams(location.search).get(name);
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = AdminCommon;
}
