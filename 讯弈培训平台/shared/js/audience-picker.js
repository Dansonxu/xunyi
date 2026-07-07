/**
 * AudiencePicker - 人员/部门选择器
 *
 * 用法：
 *   AudiencePicker.open({
 *     roleFilter: "employee",          // 可选，限制只显示某角色的人员
 *     selectedUserIds: ["emp_1"],
 *     selectedDepartments: ["市场部"],
 *     onConfirm: ({ userIds, departments }) => { ... }
 *   });
 */
const AudiencePicker = (function () {
  let current = null;

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function open(options = {}) {
    if (current) close(false);

    const roleFilter = options.roleFilter || null;
    const allLearners = DataStore.getLearners();
    const learners = roleFilter
      ? allLearners.filter(u => u.role === roleFilter)
      : allLearners;

    let selectedUserIds = Array.isArray(options.selectedUserIds)
      ? [...options.selectedUserIds]
      : [];
    let selectedDepartments = Array.isArray(options.selectedDepartments)
      ? [...options.selectedDepartments]
      : [];

    // Clean up selections that no longer exist
    const learnerIds = new Set(learners.map(u => u.id));
    selectedUserIds = selectedUserIds.filter(id => learnerIds.has(id));
    const validDepartments = new Set(
      learners.map(u => u.department).filter(Boolean)
    );
    selectedDepartments = selectedDepartments.filter(d => validDepartments.has(d));

    let searchKeyword = "";
    let selectedDepartmentFilter = ""; // empty means show all departments in the main list

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="admin-modal wide audience-picker-modal">
        <div class="admin-modal-header">
          <span>选择指定人员</span>
          <button type="button" class="audience-picker-close" aria-label="关闭">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div class="audience-picker-toolbar">
            <div class="audience-picker-search">
              <input type="text" class="form-control" id="apSearch" placeholder="搜索姓名">
            </div>
            <div class="audience-picker-stats">
              共 <strong id="apTotalUsers">0</strong> 人，
              已选 <strong id="apSelectedUsers">0</strong> 人，
              <strong id="apSelectedDepts">0</strong> 个部门
            </div>
          </div>
          <div class="audience-picker-layout">
            <div class="audience-picker-sidebar">
              <div class="audience-picker-sidebar-title">部门列表</div>
              <div class="audience-picker-dept-list" id="apDeptList"></div>
            </div>
            <div class="audience-picker-main">
              <div class="audience-picker-user-list" id="apUserList"></div>
            </div>
          </div>
          <div class="audience-picker-summary" id="apSummary"></div>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="btn btn-ghost" id="apCancel">取消</button>
          <button type="button" class="btn btn-primary" id="apConfirm">确认选择</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    current = { overlay, options };

    const searchInput = overlay.querySelector("#apSearch");
    const deptListEl = overlay.querySelector("#apDeptList");
    const userListEl = overlay.querySelector("#apUserList");
    const totalUsersEl = overlay.querySelector("#apTotalUsers");
    const selectedUsersEl = overlay.querySelector("#apSelectedUsers");
    const selectedDeptsEl = overlay.querySelector("#apSelectedDepts");
    const summaryEl = overlay.querySelector("#apSummary");

    function getDepartmentUsers(deptName) {
      return deptName
        ? learners.filter(u => u.department === deptName)
        : learners.filter(u => !u.department);
    }

    function getDeptState(deptName) {
      const deptUsers = getDepartmentUsers(deptName);
      if (!deptUsers.length) return { checked: false, indeterminate: false, count: 0, total: 0 };
      const selectedCount = deptUsers.filter(u => selectedUserIds.includes(u.id)).length;
      return {
        checked: selectedDepartments.includes(deptName) || selectedCount === deptUsers.length,
        indeterminate: selectedCount > 0 && selectedCount < deptUsers.length && !selectedDepartments.includes(deptName),
        count: selectedCount,
        total: deptUsers.length
      };
    }

    function toggleDepartment(deptName, checked) {
      const deptUsers = getDepartmentUsers(deptName);
      const deptUserIds = deptUsers.map(u => u.id);
      if (checked) {
        selectedUserIds = Array.from(new Set([...selectedUserIds, ...deptUserIds]));
        if (!selectedDepartments.includes(deptName)) {
          selectedDepartments.push(deptName);
        }
      } else {
        selectedUserIds = selectedUserIds.filter(id => !deptUserIds.includes(id));
        selectedDepartments = selectedDepartments.filter(d => d !== deptName);
      }
      render();
    }

    function toggleUser(userId, checked) {
      if (checked) {
        if (!selectedUserIds.includes(userId)) selectedUserIds.push(userId);
      } else {
        selectedUserIds = selectedUserIds.filter(id => id !== userId);
      }
      // Reconcile department selection: if all users in a department are selected, mark department as selected;
      // if none are selected, remove department.
      const user = learners.find(u => u.id === userId);
      if (user && user.department) {
        const deptUsers = getDepartmentUsers(user.department);
        const allSelected = deptUsers.every(u => selectedUserIds.includes(u.id));
        const noneSelected = !deptUsers.some(u => selectedUserIds.includes(u.id));
        if (allSelected && !selectedDepartments.includes(user.department)) {
          selectedDepartments.push(user.department);
        } else if (noneSelected) {
          selectedDepartments = selectedDepartments.filter(d => d !== user.department);
        } else {
          selectedDepartments = selectedDepartments.filter(d => d !== user.department);
        }
      }
      render();
    }

    function getFilteredUsers() {
      const kw = searchKeyword.trim().toLowerCase();
      let list = learners;
      if (selectedDepartmentFilter) {
        list = list.filter(u => u.department === selectedDepartmentFilter);
      }
      if (kw) {
        list = list.filter(u => (u.name || "").toLowerCase().includes(kw));
      }
      return list;
    }

    function renderDeptList() {
      const departments = DataStore.getDepartments(roleFilter);
      const noDeptUsers = learners.filter(u => !u.department);

      let html = `
        <label class="audience-picker-dept-item ${selectedDepartmentFilter === "" ? "active" : ""}">
          <input type="radio" name="apDeptFilter" value="" ${selectedDepartmentFilter === "" ? "checked" : ""}>
          <span>全部部门</span>
          <span class="count">(${learners.length})</span>
        </label>
      `;

      departments.forEach(dept => {
        const state = getDeptState(dept);
        html += `
          <div class="audience-picker-dept-item">
            <input type="checkbox" class="ap-dept-check" data-dept="${escapeHtml(dept)}"
              ${state.checked ? "checked" : ""}
              ${state.indeterminate ? 'data-indeterminate="true"' : ""}>
            <span class="ap-dept-name" data-dept="${escapeHtml(dept)}">${escapeHtml(dept)}</span>
            <span class="count">(${state.count}/${state.total})</span>
          </div>
        `;
      });

      if (noDeptUsers.length) {
        const state = getDeptState("");
        html += `
          <div class="audience-picker-dept-item">
            <input type="checkbox" class="ap-dept-check" data-dept=""
              ${state.checked ? "checked" : ""}
              ${state.indeterminate ? 'data-indeterminate="true"' : ""}>
            <span class="ap-dept-name" data-dept="">未分配部门</span>
            <span class="count">(${state.count}/${state.total})</span>
          </div>
        `;
      }

      deptListEl.innerHTML = html;

      deptListEl.querySelectorAll(".ap-dept-check").forEach(cb => {
        const dept = cb.dataset.dept;
        const state = getDeptState(dept);
        cb.indeterminate = state.indeterminate;
        cb.checked = state.checked;
        cb.addEventListener("change", (e) => {
          e.stopPropagation();
          toggleDepartment(dept, cb.checked);
        });
      });

      deptListEl.querySelectorAll(".ap-dept-name").forEach(el => {
        el.addEventListener("click", () => {
          selectedDepartmentFilter = el.dataset.dept;
          render();
        });
      });

      deptListEl.querySelectorAll("input[name='apDeptFilter']").forEach(radio => {
        radio.addEventListener("change", () => {
          selectedDepartmentFilter = radio.value;
          render();
        });
      });
    }

    function renderUserList() {
      const users = getFilteredUsers();
      const grouped = {};
      users.forEach(u => {
        const dept = u.department || "未分配部门";
        if (!grouped[dept]) grouped[dept] = [];
        grouped[dept].push(u);
      });

      let html = "";
      if (!users.length) {
        html = `<div class="admin-selector-empty">无匹配人员</div>`;
      } else {
        Object.keys(grouped).sort().forEach(dept => {
          html += `<div class="audience-picker-group-title">${escapeHtml(dept)}</div>`;
          grouped[dept].forEach(u => {
            html += `
              <div class="admin-selector-item audience-picker-user-item">
                <input type="checkbox" class="ap-user-check" id="ap_user_${u.id}" value="${escapeHtml(u.id)}"
                  ${selectedUserIds.includes(u.id) ? "checked" : ""}>
                <div>
                  <label for="ap_user_${u.id}">${escapeHtml(u.name || u.username)}</label>
                  <div class="admin-selector-meta">${escapeHtml(u.department || "未分配部门")} · ${u.role === "employee" ? "内部员工" : "代理商"}</div>
                </div>
              </div>
            `;
          });
        });
      }

      userListEl.innerHTML = html;

      userListEl.querySelectorAll(".ap-user-check").forEach(cb => {
        cb.addEventListener("change", () => {
          toggleUser(cb.value, cb.checked);
        });
      });
    }

    function renderSummary() {
      totalUsersEl.textContent = learners.length;
      selectedUsersEl.textContent = selectedUserIds.length;
      selectedDeptsEl.textContent = selectedDepartments.length;

      const parts = [];
      if (selectedDepartments.length) {
        parts.push(`${selectedDepartments.length}个部门全选`);
      }
      const individualCount = selectedUserIds.filter(id => {
        const u = learners.find(x => x.id === id);
        return u && !(u.department && selectedDepartments.includes(u.department));
      }).length;
      if (individualCount) {
        parts.push(`${individualCount}个单独人员`);
      }
      summaryEl.textContent = parts.length ? `已选：${parts.join("、")}` : "未选择任何人员或部门";
    }

    function render() {
      renderDeptList();
      renderUserList();
      renderSummary();
    }

    function close(confirmed) {
      if (!current) return;
      if (confirmed && typeof options.onConfirm === "function") {
        options.onConfirm({
          userIds: [...selectedUserIds],
          departments: [...selectedDepartments]
        });
      }
      overlay.remove();
      current = null;
    }

    searchInput.addEventListener("input", (e) => {
      searchKeyword = e.target.value;
      renderUserList();
    });

    overlay.querySelector("#apCancel").addEventListener("click", () => close(false));
    overlay.querySelector("#apConfirm").addEventListener("click", () => close(true));
    overlay.querySelector(".audience-picker-close").addEventListener("click", () => close(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });

    render();
  }

  return { open };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AudiencePicker;
}
