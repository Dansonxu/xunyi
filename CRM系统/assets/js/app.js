/* ---------- 通用：toast ---------- */
function toast(msg, type) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2200);
}

/* ---------- 导航 ---------- */
const breadcrumbMap = {
  'dashboard': 'CRM 工作台',
  'customers': '客户管理 / 客户列表',
  'customer-detail': '客户管理 / 客户详情',
  'my-tasks': '跟进任务 / 我的任务',
  'team-tasks': '跟进任务 / 团队任务',
  'funnel': '数据看板',
  'setting-source': '设置 / 客户来源标签',
  'setting-result': '设置 / 跟进结果模板'
};
function switchPage(pageId, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('breadcrumb').textContent = breadcrumbMap[pageId] || 'CRM';
  if (el && el.closest('.submenu')) {
    const submenu = el.closest('.submenu');
    if (!submenu.classList.contains('open')) {
      submenu.classList.add('open');
      const arrow = submenu.previousElementSibling && submenu.previousElementSibling.querySelector('.arrow');
      if (arrow) arrow.classList.add('open');
    }
  }
  document.querySelector('.content').scrollTop = 0;
}
function findMenu(pageId) { return document.querySelector('.menu-item[data-page="' + pageId + '"]'); }
function toggleSubmenu(el) {
  const submenu = el.nextElementSibling;
  const arrow = el.querySelector('.arrow');
  if (submenu && submenu.classList.contains('submenu')) {
    submenu.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
  }
}

/* ---------- 角色 / 数据隔离 ----------
   隔离三层：代理商(租户,硬隔离) > 门店(storeId) > 负责人(ownerId)
   老板=全门店可切换+汇总；店长=本门店；店员=仅自己负责 */
const ROLES = {
  boss:    { name: '王老板', avatar: '王', tag: '老板', store: null,       owner: null,   storeSwitch: true,  menus: { team: true,  board: true,  settings: true  } },
  manager: { name: '王店长', avatar: '王', tag: '店长', store: '城东旗舰店', owner: null,   storeSwitch: false, menus: { team: true,  board: true,  settings: false } },
  staff:   { name: '李老师', avatar: '李', tag: '店员', store: '城东旗舰店', owner: '李老师', storeSwitch: false, menus: { team: false, board: false, settings: false } }
};
let currentRole = 'boss';

/* 成员花名册：负责人 → 角色 + 所属门店（CRM 只读，源自代理端账号体系） */
const STAFF = {
  '王店长': { role: '店长', store: '城东旗舰店' },
  '李老师': { role: '店员', store: '城东旗舰店' },
  '张老师': { role: '店员', store: '城西店' },
  '孙店长': { role: '店长', store: '高新店' }
};
function roleTag(role) {
  const cls = role === '店长' ? 'tag-purple' : 'tag-blue';
  return '<span class="tag ' + cls + '" style="padding:0 5px;font-size:10px;">' + role + '</span>';
}
function renderOwnerCell(name) {
  const s = STAFF[name] || { role: '', store: '' };
  return '<div style="font-weight:500;">' + name + '</div>'
    + '<div style="font-size:11px;color:#909399;margin-top:2px;">' + roleTag(s.role) + ' ' + s.store + '</div>';
}
function ownerInline(name) {
  const s = STAFF[name] || { role: '', store: '' };
  return name + ' ' + roleTag(s.role) + ' · ' + s.store
    + ' <button class="btn-text assign-btn" onclick="openAssign(document.getElementById(\'detail-name\').textContent.trim())">分配</button>';
}
function findCustRow(name) {
  let found = null;
  document.querySelectorAll('#cust-tbody tr').forEach(tr => {
    if (tr.querySelector('td').textContent.trim() === name) found = tr;
  });
  return found;
}
/* 分配可选范围：老板=全部成员；店长=本门店成员；店员无权 */
function assignableStaff() {
  const all = Object.keys(STAFF);
  if (currentRole === 'manager') { const ms = ROLES.manager.store; return all.filter(n => STAFF[n].store === ms); }
  return all;
}
let assignTarget = '';
function openAssign(name) {
  assignTarget = name;
  document.getElementById('asg-customer').value = name;
  const row = findCustRow(name);
  const cur = row ? row.getAttribute('data-owner') : '';
  const cs = STAFF[cur] || { role: '', store: '' };
  document.getElementById('asg-current').textContent = cur ? (cur + '（' + cs.role + ' · ' + cs.store + '）') : '未分配';
  const sel = document.getElementById('asg-owner');
  sel.innerHTML = '';
  assignableStaff().forEach(n => {
    const s = STAFF[n];
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = n + '（' + s.role + ' · ' + s.store + '）';
    sel.appendChild(opt);
  });
  showModal('modal-assign');
}
function doAssign() {
  const newOwner = document.getElementById('asg-owner').value;
  const s = STAFF[newOwner];
  const row = findCustRow(assignTarget);
  if (row) {
    row.setAttribute('data-owner', newOwner);
    row.setAttribute('data-store', s.store);
    row.querySelectorAll('td')[5].innerHTML = renderOwnerCell(newOwner);
  }
  if (document.getElementById('detail-name').textContent.trim() === assignTarget) {
    document.getElementById('detail-owner').innerHTML = ownerInline(newOwner);
    document.getElementById('detail-store').textContent = s.store;
  }
  hideModal('modal-assign');
  applyCustFilter();
  updateAssignBtns();
  toast('已将「' + assignTarget + '」分配给 ' + newOwner + '（' + s.role + ' · ' + s.store + '）', 'success');
}
/* 店员无分配权，隐藏所有分配按钮 */
function updateAssignBtns() {
  const show = currentRole !== 'staff';
  document.querySelectorAll('.assign-btn').forEach(b => b.style.display = show ? '' : 'none');
}
/* 初始化列表：渲染负责人列(角色+门店) + 追加分配按钮 */
function initRows() {
  document.querySelectorAll('#cust-tbody tr').forEach(tr => {
    const name = tr.querySelector('td').textContent.trim();
    const tds = tr.querySelectorAll('td');
    tds[5].classList.add('owner-cell');
    tds[5].innerHTML = renderOwnerCell(tr.getAttribute('data-owner'));
    const opTd = tds[tds.length - 1];
    if (!opTd.querySelector('.assign-btn')) {
      const b = document.createElement('button');
      b.className = 'btn-text assign-btn';
      b.textContent = '分配';
      b.onclick = () => openAssign(name);
      opTd.appendChild(b);
    }
  });
}

function setRole(role, silent) {
  currentRole = role;
  const r = ROLES[role];
  document.getElementById('user-name').textContent = r.name;
  document.getElementById('user-avatar').textContent = r.avatar;
  document.getElementById('user-role-tag').textContent = r.tag;
  const ss = document.getElementById('store-select');
  if (r.storeSwitch) { ss.disabled = false; ss.value = 'all'; }
  else { ss.disabled = true; ss.value = r.store; }
  document.getElementById('menu-team-tasks').style.display = r.menus.team ? '' : 'none';
  document.getElementById('menu-funnel').style.display = r.menus.board ? '' : 'none';
  document.getElementById('menu-settings-group').style.display = r.menus.settings ? '' : 'none';
  // 若当前停留页对该角色不可见，退回工作台
  const active = document.querySelector('.page.active');
  const id = active ? active.id.replace('page-', '') : '';
  const blocked = (!r.menus.team && id === 'team-tasks')
    || (!r.menus.board && id === 'funnel')
    || (!r.menus.settings && (id === 'setting-source' || id === 'setting-result'));
  if (blocked) switchPage('dashboard', findMenu('dashboard'));
  applyCustFilter();
  updateScopeHints();
  updateAssignBtns();
  if (!silent) toast('已切换到「' + r.tag + '」视角', 'info');
}
function onStoreChange() { applyCustFilter(); updateScopeHints(); }

function updateScopeHints() {
  const r = ROLES[currentRole];
  const storeSel = document.getElementById('store-select').value;
  const cust = document.getElementById('cust-scope');
  const board = document.getElementById('board-scope');
  const team = document.getElementById('team-scope');
  if (currentRole === 'boss') {
    if (cust)  cust.textContent  = '当前可见：' + (storeSel === 'all' ? '全部门店所有客户' : storeSel + ' 客户') + '（老板视角）';
    if (board) board.textContent = '数据范围：' + (storeSel === 'all' ? '全部门店汇总' : storeSel) + '，可切门店下钻（老板视角）';
    if (team)  team.textContent  = '数据范围：全部门店成员（老板视角）';
  } else if (currentRole === 'manager') {
    if (cust)  cust.textContent  = '当前可见：' + r.store + ' 全部客户（店长视角，跨门店不可见）';
    if (board) board.textContent = '数据范围：' + r.store + '，按成员下钻（店长视角）';
    if (team)  team.textContent  = '数据范围：' + r.store + ' 成员（店长视角）';
  } else {
    if (cust)  cust.textContent  = '当前可见：仅我负责的客户（店员视角 · ' + r.name + '，同店他人客户不可见）';
  }
}

/* ---------- 客户列表：tab 过滤 / 搜索 / 分页 ---------- */
function applyCustFilter() {
  const r = ROLES[currentRole];
  const storeSel = document.getElementById('store-select').value;
  const tab = document.querySelector('#cust-tabs .tab.active');
  const stage = tab ? tab.getAttribute('data-stage') : 'all';
  const kw = (document.getElementById('cust-search').value || '').trim();
  const src = document.getElementById('cust-source').value;
  const owner = document.getElementById('cust-owner').value;
  let shown = 0;
  document.querySelectorAll('#cust-tbody tr').forEach(tr => {
    const rowStore = tr.getAttribute('data-store');
    const rowOwner = tr.getAttribute('data-owner');
    // 角色门店约束：店长/店员锁本店；老板按门店切换器
    const okRoleStore = r.store ? (rowStore === r.store) : (storeSel === 'all' || rowStore === storeSel);
    // 角色负责人约束：店员只看自己负责
    const okRoleOwner = !r.owner || rowOwner === r.owner;
    // 工具栏筛选
    const okStage = stage === 'all' || tr.getAttribute('data-stage') === stage;
    const okKw = !kw || tr.innerText.indexOf(kw) !== -1;
    const okSrc = !src || tr.getAttribute('data-source') === src;
    const okOwner = !owner || rowOwner === owner;
    const show = okRoleStore && okRoleOwner && okStage && okKw && okSrc && okOwner;
    tr.style.display = show ? '' : 'none';
    if (show) shown++;
  });
  document.getElementById('cust-total').textContent = '共 ' + shown + ' 条（当前页演示数据）';
}
function filterStage(tabEl, stage) {
  tabEl.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  applyCustFilter();
}
function searchCustomers() { applyCustFilter(); toast('已按条件筛选', 'info'); }
function resetCustFilter() {
  document.getElementById('cust-search').value = '';
  document.getElementById('cust-source').value = '';
  document.getElementById('cust-owner').value = '';
  document.querySelectorAll('#cust-tabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelector('#cust-tabs .tab[data-stage="all"]').classList.add('active');
  applyCustFilter();
  toast('已重置筛选', 'info');
}
function gotoPage(btn, n) {
  if (n === 'prev' || n === 'next') { toast('翻页（演示）', 'info'); return; }
  btn.parentElement.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  toast('加载第 ' + n + ' 页（演示）', 'info');
}

/* ---------- 号码脱敏 + 查看入口（无外呼） ----------
   列表脱敏防批量抄录；详情页对负责人本人/上级放开明文
   「查看完整」点开显示明文并记审计日志；不做外呼、不接运营商隐私号 */
function revealPhone() {
  const el = document.getElementById('detail-phone');
  el.textContent = '137 1234 2210';
  toast('已显示完整号码 · 本次查看已记审计日志', 'warn');
}
function copyText(label) { toast('已复制' + label + '（演示）', 'success'); }

/* ---------- 进客户详情 ---------- */
function openCustomer(name) {
  document.getElementById('detail-name').textContent = name || '张妈妈';
  const row = findCustRow(name);
  if (row) {
    document.getElementById('detail-owner').innerHTML = ownerInline(row.getAttribute('data-owner'));
    document.getElementById('detail-store').textContent = row.getAttribute('data-store');
  }
  switchPage('customer-detail', findMenu('customers'));
  updateAssignBtns();
}

/* ---------- 漏斗 / 来源下钻 ---------- */
const stageCN = { lead:'线索', contact:'联系中', intent:'意向', trial:'试听', active:'在读', lost:'流失' };
function drillStage(stage) {
  switchPage('customers', findMenu('customers'));
  const tab = document.querySelector('#cust-tabs .tab[data-stage="' + stage + '"]');
  if (tab) filterStage(tab, stage);
  toast('已下钻到「' + (stageCN[stage] || stage) + '」客户', 'info');
}
function drillSource(src) {
  switchPage('customers', findMenu('customers'));
  document.getElementById('cust-source').value = src;
  applyCustFilter();
  toast('已下钻到来源「' + src + '」', 'info');
}

/* ---------- 跟进记录 ---------- */
const followTitleMap = { phone:'电话跟进', wechat:'微信跟进', visit:'到店跟进' };
const followClassMap = { phone:'phone', wechat:'', visit:'visit' };
function openFollow(customer) {
  document.getElementById('mf-customer').value = customer || '张妈妈（朵朵）';
  document.getElementById('mf-result').value = '';
  document.getElementById('mf-result').classList.remove('field-err');
  document.getElementById('mf-tpl').value = '';
  document.getElementById('mf-next').value = '';
  const r = document.querySelector('input[name="mf-ch"][value="phone"]'); if (r) r.checked = true;
  showModal('modal-follow');
}
function applyResultTpl() {
  const tpl = document.getElementById('mf-tpl').value;
  const ta = document.getElementById('mf-result');
  if (tpl && !ta.value.trim()) ta.value = tpl;
}
function saveFollow() {
  const ta = document.getElementById('mf-result');
  if (!ta.value.trim()) { ta.classList.add('field-err'); toast('请填写跟进结果', 'err'); return; }
  ta.classList.remove('field-err');
  const ch = (document.querySelector('input[name="mf-ch"]:checked') || {}).value || 'phone';
  const next = document.getElementById('mf-next').value;
  const tl = document.getElementById('detail-timeline');
  if (tl) {
    const node = document.createElement('div');
    node.className = 'tl-node ' + (followClassMap[ch] || '');
    const now = new Date();
    const ts = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    node.innerHTML = '<div class="tl-head">' + followTitleMap[ch] + ' <span class="tag tag-gray">王店长</span></div>'
      + '<div class="tl-time">' + ts + '</div>'
      + '<div class="tl-body">' + ta.value.replace(/</g,'&lt;') + '</div>'
      + (next ? '<div class="tl-next">下次回访：' + next + '</div>' : '');
    tl.insertBefore(node, tl.firstChild);
    if (next) { const d = document.getElementById('detail-next-date'); if (d) d.textContent = next; }
  }
  hideModal('modal-follow');
  toast('跟进记录已保存', 'success');
}

/* ---------- 推进阶段 ---------- */
function promoteStage() {
  const sel = document.getElementById('ms-target');
  const target = sel.value;
  if (target === 'active') {
    toast('「在读」需先关联报名订单/合约，请走报名流程', 'warn');
    return;
  }
  document.querySelectorAll('.detail-stage').forEach(b => {
    b.className = 'stage stage-' + target + (b.classList.contains('detail-stage') ? ' detail-stage' : '');
    b.textContent = stageCN[target];
  });
  hideModal('modal-stage');
  toast('阶段已推进至「' + stageCN[target] + '」', 'success');
}

/* ---------- 添加孩子 ---------- */
function addKid() {
  const name = (document.getElementById('mk-name').value || '').trim();
  if (!name) { toast('请填写孩子姓名', 'err'); return; }
  const sex = document.getElementById('mk-sex').value;
  const age = (document.getElementById('mk-age').value || '?');
  const base = document.getElementById('mk-base').value;
  const card = document.createElement('div');
  card.className = 'kid-card';
  card.innerHTML = '<div class="kc-name">' + name.replace(/</g,'&lt;') + '</div><div class="kc-meta">' + sex + ' · ' + age + '岁 · ' + base + '</div>';
  document.getElementById('kid-list').appendChild(card);
  document.getElementById('mk-name').value = '';
  document.getElementById('mk-age').value = '';
  hideModal('modal-kid');
  toast('已添加孩子「' + name + '」', 'success');
}

/* ---------- 新建客户 ---------- */
function createCustomerModal() {
  const phone = document.getElementById('mc-phone').value.trim();
  const name = document.getElementById('mc-name').value.trim();
  if (!/^\d{11}$/.test(phone)) { document.getElementById('mc-phone').classList.add('field-err'); toast('请填写 11 位手机号', 'err'); return; }
  if (!name) { document.getElementById('mc-name').classList.add('field-err'); toast('请填写家长称呼', 'err'); return; }
  document.getElementById('mc-phone').classList.remove('field-err');
  document.getElementById('mc-name').classList.remove('field-err');
  const tb = document.getElementById('cust-tbody');
  const masked = phone.slice(0,3) + '****' + phone.slice(7);
  const kid = document.getElementById('mc-kid').value.trim();
  const age = document.getElementById('mc-age').value.trim();
  const src = document.getElementById('mc-source').value;
  const owner = document.getElementById('mc-owner').value.replace('（我）','');
  const store = (STAFF[owner] || {}).store || '城东旗舰店';
  const tr = document.createElement('tr');
  tr.setAttribute('data-stage','lead');
  tr.setAttribute('data-source', src);
  tr.setAttribute('data-owner', owner);
  tr.setAttribute('data-store', store);
  tr.innerHTML = '<td>' + name + '</td><td>' + masked + '</td><td>' + (kid ? kid + (age ? ' / ' + age + '岁' : '') : '—') + '</td>'
    + '<td><span class="stage stage-lead">线索</span></td><td>' + src + '</td>'
    + '<td class="owner-cell">' + renderOwnerCell(owner) + '</td><td>—</td><td><span class="tag tag-orange">待首联</span></td>'
    + '<td><button class="btn-text" onclick="openCustomer(\'' + name + '\')">详情</button><button class="btn-text" onclick="openFollow(\'' + name + '\')">跟进</button><button class="btn-text assign-btn" onclick="openAssign(\'' + name + '\')">分配</button></td>';
  tb.insertBefore(tr, tb.firstChild);
  updateAssignBtns();
  ['mc-phone','mc-name','mc-kid','mc-age'].forEach(id => document.getElementById(id).value = '');
  hideModal('modal-customer');
  switchPage('customers', findMenu('customers'));
  toast('客户「' + name + '」已创建，进入线索阶段', 'success');
}

/* ---------- 批量导入 ---------- */
function openImport() {
  document.getElementById('import-preview').style.display = 'none';
  document.getElementById('import-fname').textContent = '点击选择文件 / 拖拽 .xlsx 到此处';
  showModal('modal-import');
}
function mockPickFile() {
  document.getElementById('import-fname').textContent = '客户名单_2026.xlsx（已选择）';
  document.getElementById('import-preview').style.display = '';
  toast('文件已解析，校验完成', 'info');
}
function doImport() {
  if (document.getElementById('import-preview').style.display === 'none') { toast('请先上传文件', 'err'); return; }
  const owner = currentRole === 'staff' ? '李老师' : '王店长';
  const store = STAFF[owner].store;
  const rows = [
    { name: '赵女士', phone: '138****1111', kid: '苗苗 / 6岁', src: '转介绍' },
    { name: '钱先生', phone: '138****2222', kid: '壮壮 / 7岁', src: '地推扫码' },
    { name: '孙女士', phone: '138****3333', kid: '糖糖 / 5岁', src: '美团' }
  ];
  const tb = document.getElementById('cust-tbody');
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-stage', 'lead');
    tr.setAttribute('data-source', r.src);
    tr.setAttribute('data-owner', owner);
    tr.setAttribute('data-store', store);
    tr.innerHTML = '<td>' + r.name + '</td><td>' + r.phone + '</td><td>' + r.kid + '</td>'
      + '<td><span class="stage stage-lead">线索</span></td><td>' + r.src + '</td>'
      + '<td class="owner-cell">' + renderOwnerCell(owner) + '</td><td>—</td><td><span class="tag tag-orange">待首联</span></td>'
      + '<td><button class="btn-text" onclick="openCustomer(\'' + r.name + '\')">详情</button><button class="btn-text" onclick="openFollow(\'' + r.name + '\')">跟进</button><button class="btn-text assign-btn" onclick="openAssign(\'' + r.name + '\')">分配</button></td>';
    tb.insertBefore(tr, tb.firstChild);
  });
  hideModal('modal-import');
  applyCustFilter();
  updateAssignBtns();
  toast('已导入 3 条客户，进入「线索」阶段', 'success');
}

/* ---------- 任务 tab ---------- */
function switchTaskTab(el, key) {
  el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  toast('切换到任务视图（演示）', 'info');
}
function remind(owner, customer) { toast('已向 ' + owner + ' 推送催办：' + customer, 'success'); }

/* ---------- 设置：启停 / 新增 ---------- */
function toggleEnable(btn) {
  const tr = btn.closest('tr');
  const tag = tr.querySelector('.en');
  const isEnabled = tag.textContent.trim() === '启用';
  if (isEnabled) {
    tag.textContent = '停用'; tag.className = 'tag tag-gray en';
    btn.textContent = '启用'; btn.classList.remove('danger');
    toast('已停用', 'warn');
  } else {
    tag.textContent = '启用'; tag.className = 'tag tag-green en';
    btn.textContent = '停用'; btn.classList.add('danger');
    toast('已启用', 'success');
  }
}
let addSeq = 0;
function addSettingRow(tbodyId, kind) {
  addSeq++;
  const tb = document.getElementById(tbodyId);
  const tr = document.createElement('tr');
  if (kind === 'source') {
    tr.innerHTML = '<td>新来源 ' + addSeq + '</td><td><span class="tag tag-green en">启用</span></td><td>0</td><td>-</td>'
      + '<td><button class="btn-text" onclick="toast(\'编辑（演示）\',\'info\')">编辑</button><button class="btn-text danger" onclick="toggleEnable(this)">停用</button></td>';
  } else {
    tr.innerHTML = '<td>新模板 ' + addSeq + '</td><td>通用</td><td><span class="tag tag-green en">启用</span></td>'
      + '<td><button class="btn-text" onclick="toast(\'编辑（演示）\',\'info\')">编辑</button><button class="btn-text danger" onclick="toggleEnable(this)">停用</button></td>';
  }
  tb.appendChild(tr);
  toast('已新增一行（演示，可继续编辑）', 'success');
}

/* ---------- Modal 基础 ---------- */
function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.add('hidden'); });
});

/* 初始化：渲染负责人列 + 分配按钮，默认老板视角 */
initRows();
setRole('boss', true);
