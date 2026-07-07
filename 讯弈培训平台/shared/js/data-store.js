const STORAGE_KEY = "agent_platform_data";
const SESSION_USER_KEY = "agent_platform_current_user";
const EXAM_SESSION_KEY = "agent_platform_exam_session";

const DataStore = {
  initMockData() {
    if (localStorage.getItem(STORAGE_KEY)) {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      let changed = false;

      // Migration: ensure material categories exist
      if (!data.materialCategories) {
        const categories = [...new Set((data.materials || []).map(m => m.category).filter(Boolean))];
        data.materialCategories = categories.map((name, i) => ({
          id: this._generateId("cat"),
          name,
          sortOrder: i + 1
        }));
        changed = true;
      }

      // Migration: ensure audience field on materials/exams defaults to "agent"
      if (data.materials) {
        data.materials.forEach(m => {
          if (!m.audience) { m.audience = "agent"; changed = true; }
        });
      }
      if (data.exams) {
        data.exams.forEach(e => {
          if (!e.audience) { e.audience = "agent"; changed = true; }
        });
      }

      // Migration: normalize audience to object schema {mode, role, userIds, departments}
      const normalizeAudienceInPlace = (item) => {
        if (!item.audience || typeof item.audience === "string") {
          item.audience = { mode: "role", role: item.audience || "agent", userIds: [], departments: [] };
          return true;
        }
        return false;
      };
      [data.materials, data.exams, data.trainingPrograms].forEach(arr => {
        if (arr) arr.forEach(item => { if (normalizeAudienceInPlace(item)) changed = true; });
      });

      // Migration: ensure demo employee users exist
      if (data.users && !data.users.some(u => u.role === "employee")) {
        data.users.push(
          { id: "emp_1", role: "employee", username: "emp001", password: "123456", name: "陈员工", department: "市场部", employeeType: "全职", avatar: "" },
          { id: "emp_2", role: "employee", username: "emp002", password: "123456", name: "刘员工", department: "客服部", employeeType: "全职", avatar: "" }
        );
        changed = true;
      }

      // Migration: ensure training programs exist
      if (!data.trainingPrograms) {
        data.trainingPrograms = [
          {
            id: "tp_1",
            title: "新员工入职培训",
            description: "公司文化、规章制度、办公流程与合规要求。",
            audience: "employee",
            materialIds: ["mat_4", "mat_5"],
            examIds: ["exam_3"],
            isMandatory: true,
            status: "published",
            sortOrder: 1,
            createTime: "2024-02-01 09:00"
          }
        ];
        changed = true;
      }

      // Migration: ensure backend account flags and demo operators exist
      if (data.users) {
        const admin = data.users.find(u => u.role === "admin");
        if (admin && !admin.isBackendUser) { admin.isBackendUser = true; changed = true; }
        if (!data.users.some(u => u.id === "op_agent_1")) {
          data.users.push({ id: "op_agent_1", role: "agent", username: "opagent", password: "123456", name: "代理运营", isBackendUser: true, avatar: "" });
          changed = true;
        }
        if (!data.users.some(u => u.id === "op_emp_1")) {
          data.users.push({ id: "op_emp_1", role: "employee", username: "opemp", password: "123456", name: "员工运营", department: "培训部", isBackendUser: true, avatar: "" });
          changed = true;
        }
      }

      if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MockData));
  },

  _getData() {
    this.initMockData();
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  },

  _setData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  _generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  },

  _nowStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  },

  // Users
  getUsers() {
    return this._getData().users || [];
  },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  },

  getUserByUsername(username) {
    return this.getUsers().find(u => u.username === username);
  },

  addUser(user) {
    const data = this._getData();
    user.id = user.id || this._generateId("user");
    data.users = data.users || [];
    data.users.push(user);
    this._setData(data);
    return user;
  },

  updateUser(id, updates) {
    const data = this._getData();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    this._setData(data);
    return data.users[idx];
  },

  deleteUser(id) {
    const data = this._getData();
    data.users = (data.users || []).filter(u => u.id !== id);
    this._setData(data);
  },

  // Backend operator accounts (can log into admin)
  getBackendUsers() {
    return this.getUsers().filter(u => u.isBackendUser);
  },

  // H5 learners only (exclude backend operator accounts)
  getLearners() {
    return this.getUsers().filter(u => (u.role === "agent" || u.role === "employee") && !u.isBackendUser);
  },

  // Audience helpers
  normalizeAudience(audience) {
    if (!audience) return { mode: "role", role: "agent", userIds: [], departments: [] };
    if (typeof audience === "string") {
      return { mode: "role", role: audience, userIds: [], departments: [] };
    }
    return {
      mode: audience.mode || "role",
      role: audience.role || "agent",
      userIds: Array.isArray(audience.userIds) ? audience.userIds : [],
      departments: Array.isArray(audience.departments) ? audience.departments : []
    };
  },

  formatAudienceLabel(audience) {
    const aud = this.normalizeAudience(audience);
    if (aud.mode === "role") {
      const map = { agent: "代理商", employee: "内部员工", all: "全部" };
      return map[aud.role] || aud.role;
    }
    const userCount = aud.userIds?.length || 0;
    const deptCount = aud.departments?.length || 0;
    if (userCount && deptCount) return `指定人员 ${userCount}人、${deptCount}部门`;
    if (userCount) return `指定人员 ${userCount}人`;
    if (deptCount) return `指定部门 ${deptCount}个`;
    return "指定人员";
  },

  getDepartments(roleFilter = null) {
    const learners = this.getLearners();
    const list = roleFilter ? learners.filter(u => u.role === roleFilter) : learners;
    return [...new Set(list.map(u => u.department).filter(Boolean))].sort();
  },

  // Content scope for a backend user.
  // admin -> null (sees everything); operator -> their own role (agent/employee)
  getScopeAudience(user) {
    if (!user || user.role === "admin") return null;
    return user.role;
  },

  // Filter a content list (materials/questions/exams/training programs) by the
  // current backend user's scope. admin sees all; operator sees only audience === own role
  // or specific targeting that includes any learner of their role.
  filterByScope(list, user) {
    const scope = this.getScopeAudience(user);
    if (!scope) return list;
    const scopeLearners = this.getLearners().filter(u => u.role === scope);
    return list.filter(item => {
      const aud = this.normalizeAudience(item.audience);
      if (aud.mode === "role") return aud.role === scope;
      const userMatch = scopeLearners.some(u => aud.userIds.includes(u.id));
      const deptMatch = scopeLearners.some(u => u.department && aud.departments.includes(u.department));
      return userMatch || deptMatch;
    });
  },

  // Current user (session)
  getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (raw) return JSON.parse(raw);

    // Integration point: external account system
    const extToken = sessionStorage.getItem("external_auth_token");
    if (extToken) {
      const user = this.resolveExternalUser(extToken);
      if (user) {
        this.syncExternalUser(user);
        this.setCurrentUser(user);
        return user;
      }
    }
    return null;
  },

  // Integration point: replace with actual backend API call
  resolveExternalUser(token) {
    // Expected return: { id, role, name, department, employeeType, ... }
    console.warn("resolveExternalUser() is a stub. Token:", token);
    return null;
  },

  syncExternalUser(user) {
    const data = this._getData();
    data.users = data.users || [];
    const idx = data.users.findIndex(u => u.id === user.id);
    if (idx === -1) {
      data.users.push(user);
    } else {
      data.users[idx] = { ...data.users[idx], ...user };
    }
    this._setData(data);
  },

  setCurrentUser(user) {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  },

  logout() {
    sessionStorage.removeItem(SESSION_USER_KEY);
  },

  // Materials
  getMaterials() {
    return this._getData().materials || [];
  },

  getMaterialById(id) {
    return this.getMaterials().find(m => m.id === id);
  },

  addMaterial(material) {
    const data = this._getData();
    material.id = material.id || this._generateId("mat");
    material.uploadTime = material.uploadTime || this._nowStr();
    material.viewCount = material.viewCount || 0;
    material.finishCount = material.finishCount || 0;
    data.materials = data.materials || [];
    data.materials.unshift(material);
    this._setData(data);
    return material;
  },

  updateMaterial(id, updates) {
    const data = this._getData();
    const idx = data.materials.findIndex(m => m.id === id);
    if (idx === -1) return null;
    data.materials[idx] = { ...data.materials[idx], ...updates };
    this._setData(data);
    return data.materials[idx];
  },

  deleteMaterial(id) {
    const data = this._getData();
    data.materials = data.materials.filter(m => m.id !== id);
    this._setData(data);
  },

  // Visibility helpers
  // roleOrUser can be a role string for backward compatibility, or a user object.
  _isVisibleToLearner(item, roleOrUser) {
    const aud = this.normalizeAudience(item.audience);
    const isUser = typeof roleOrUser === "object" && roleOrUser !== null;
    if (aud.mode === "role") {
      if (aud.role === "all") return true;
      return isUser ? aud.role === roleOrUser.role : aud.role === roleOrUser;
    }
    // specific mode requires a user object to resolve visibility
    if (!isUser) return false;
    if (aud.userIds && aud.userIds.includes(roleOrUser.id)) return true;
    if (roleOrUser.department && aud.departments && aud.departments.includes(roleOrUser.department)) return true;
    return false;
  },

  // For admin stats: check whether a content item is visible to any learner of a given role.
  _isVisibleToRole(item, role) {
    const aud = this.normalizeAudience(item.audience);
    if (aud.mode === "role") {
      if (aud.role === "all") return true;
      return aud.role === role;
    }
    const learners = this.getLearners().filter(u => u.role === role);
    const userMatch = learners.some(u => aud.userIds.includes(u.id));
    const deptMatch = learners.some(u => u.department && aud.departments.includes(u.department));
    return userMatch || deptMatch;
  },

  getVisibleMaterials(roleOrUser) {
    return this.getMaterials().filter(m => m.status === "published" && this._isVisibleToLearner(m, roleOrUser));
  },

  getVisibleExams(roleOrUser) {
    return this.getExams().filter(e => e.status === "published" && this._isVisibleToLearner(e, roleOrUser));
  },

  getVisibleTrainingPrograms(roleOrUser) {
    return this.getTrainingPrograms().filter(tp => tp.status === "published" && this._isVisibleToLearner(tp, roleOrUser));
  },

  // Training Programs
  getTrainingPrograms() {
    return this._getData().trainingPrograms || [];
  },

  getTrainingProgramById(id) {
    return this.getTrainingPrograms().find(tp => tp.id === id);
  },

  addTrainingProgram(program) {
    const data = this._getData();
    program.id = program.id || this._generateId("tp");
    program.createTime = program.createTime || this._nowStr();
    program.materialIds = program.materialIds || [];
    program.examIds = program.examIds || [];
    program.status = program.status || "published";
    program.sortOrder = program.sortOrder || (data.trainingPrograms?.length || 0) + 1;
    data.trainingPrograms = data.trainingPrograms || [];
    data.trainingPrograms.push(program);
    this._setData(data);
    return program;
  },

  updateTrainingProgram(id, updates) {
    const data = this._getData();
    const idx = data.trainingPrograms.findIndex(tp => tp.id === id);
    if (idx === -1) return null;
    data.trainingPrograms[idx] = { ...data.trainingPrograms[idx], ...updates };
    this._setData(data);
    return data.trainingPrograms[idx];
  },

  deleteTrainingProgram(id) {
    const data = this._getData();
    data.trainingPrograms = data.trainingPrograms.filter(tp => tp.id !== id);
    this._setData(data);
  },

  getTrainingProgramProgress(programId, learnerId) {
    const program = this.getTrainingProgramById(programId);
    if (!program) return null;
    const materials = program.materialIds.map(id => this.getMaterialById(id)).filter(Boolean);
    const exams = program.examIds.map(id => this.getExamById(id)).filter(Boolean);
    const records = this.getLearnerStudyRecords(learnerId);
    const examRecords = this.getLearnerExamRecords(learnerId);

    let materialFinished = 0;
    materials.forEach(m => {
      const r = records.find(x => x.materialId === m.id);
      if (r && r.status === "finished") materialFinished++;
    });

    let examPassed = 0;
    exams.forEach(e => {
      const passed = examRecords.some(r => r.examId === e.id && r.status === "passed");
      if (passed) examPassed++;
    });

    const totalItems = materials.length + exams.length;
    const completedItems = materialFinished + examPassed;
    return {
      materialTotal: materials.length,
      materialFinished,
      examTotal: exams.length,
      examPassed,
      progress: totalItems ? Math.round((completedItems / totalItems) * 100) : 0,
      isComplete: totalItems > 0 && completedItems === totalItems
    };
  },

  // Material Categories
  getMaterialCategories() {
    const data = this._getData();
    return (data.materialCategories || []).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getMaterialCategoryById(id) {
    return this.getMaterialCategories().find(c => c.id === id);
  },

  addMaterialCategory(category) {
    const data = this._getData();
    category.id = category.id || this._generateId("cat");
    category.sortOrder = category.sortOrder || (data.materialCategories?.length || 0) + 1;
    data.materialCategories = data.materialCategories || [];
    data.materialCategories.push(category);
    this._setData(data);
    return category;
  },

  updateMaterialCategory(id, updates) {
    const data = this._getData();
    const idx = data.materialCategories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    data.materialCategories[idx] = { ...data.materialCategories[idx], ...updates };
    this._setData(data);
    return data.materialCategories[idx];
  },

  deleteMaterialCategory(id) {
    const data = this._getData();
    data.materialCategories = data.materialCategories.filter(c => c.id !== id);
    this._setData(data);
  },

  isCategoryInUse(categoryName) {
    const materials = this.getMaterials();
    const questions = this.getQuestions();
    return materials.some(m => m.category === categoryName) ||
           questions.some(q => q.category === categoryName);
  },

  // Questions
  getQuestions() {
    return this._getData().questions || [];
  },

  getQuestionById(id) {
    return this.getQuestions().find(q => q.id === id);
  },

  addQuestion(question) {
    const data = this._getData();
    question.id = question.id || this._generateId("q");
    data.questions = data.questions || [];
    data.questions.push(question);
    this._setData(data);
    return question;
  },

  updateQuestion(id, updates) {
    const data = this._getData();
    const idx = data.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    data.questions[idx] = { ...data.questions[idx], ...updates };
    this._setData(data);
    return data.questions[idx];
  },

  deleteQuestion(id) {
    const data = this._getData();
    data.questions = data.questions.filter(q => q.id !== id);
    this._setData(data);
  },

  // Exams
  getExams() {
    return this._getData().exams || [];
  },

  getExamById(id) {
    return this.getExams().find(e => e.id === id);
  },

  addExam(exam) {
    const data = this._getData();
    exam.id = exam.id || this._generateId("exam");
    exam.createTime = exam.createTime || this._nowStr();
    data.exams = data.exams || [];
    data.exams.unshift(exam);
    this._setData(data);
    return exam;
  },

  updateExam(id, updates) {
    const data = this._getData();
    const idx = data.exams.findIndex(e => e.id === id);
    if (idx === -1) return null;
    data.exams[idx] = { ...data.exams[idx], ...updates };
    this._setData(data);
    return data.exams[idx];
  },

  deleteExam(id) {
    const data = this._getData();
    data.exams = data.exams.filter(e => e.id !== id);
    this._setData(data);
  },

  getExamQuestions(examId) {
    const exam = this.getExamById(examId);
    if (!exam) return [];
    const all = this.getQuestions();
    return exam.questionIds.map(id => all.find(q => q.id === id)).filter(Boolean);
  },

  // Study Records
  getStudyRecords() {
    return this._getData().studyRecords || [];
  },

  getStudyRecord(agentId, materialId) {
    return this.getStudyRecords().find(r => r.agentId === agentId && r.materialId === materialId);
  },

  getAgentStudyRecords(agentId) {
    return this.getStudyRecords().filter(r => r.agentId === agentId);
  },

  getLearnerStudyRecords(learnerId) {
    return this.getStudyRecords().filter(r => r.agentId === learnerId);
  },

  startStudy(agentId, materialId) {
    let record = this.getStudyRecord(agentId, materialId);
    if (record) return record;
    record = {
      id: this._generateId("sr"),
      agentId,
      materialId,
      status: "reading",
      progress: 0,
      startTime: this._nowStr(),
      finishTime: ""
    };
    const data = this._getData();
    data.studyRecords.push(record);
    const matIdx = data.materials.findIndex(m => m.id === materialId);
    if (matIdx !== -1) {
      data.materials[matIdx].viewCount = (data.materials[matIdx].viewCount || 0) + 1;
    }
    this._setData(data);
    return record;
  },

  finishStudy(agentId, materialId) {
    const data = this._getData();
    const idx = data.studyRecords.findIndex(r => r.agentId === agentId && r.materialId === materialId);
    if (idx === -1) {
      data.studyRecords.push({
        id: this._generateId("sr"),
        agentId,
        materialId,
        status: "finished",
        progress: 100,
        startTime: this._nowStr(),
        finishTime: this._nowStr()
      });
    } else {
      data.studyRecords[idx].status = "finished";
      data.studyRecords[idx].progress = 100;
      data.studyRecords[idx].finishTime = this._nowStr();
    }
    const matIdx = data.materials.findIndex(m => m.id === materialId);
    if (matIdx !== -1) {
      data.materials[matIdx].finishCount = (data.materials[matIdx].finishCount || 0) + 1;
    }
    this._setData(data);
  },

  updateStudyProgress(agentId, materialId, progress) {
    progress = Math.max(0, Math.min(100, Math.round(progress)));
    const data = this._getData();
    let idx = data.studyRecords.findIndex(r => r.agentId === agentId && r.materialId === materialId);
    let wasFinished = false;

    if (idx === -1) {
      data.studyRecords.push({
        id: this._generateId("sr"),
        agentId,
        materialId,
        status: progress >= 100 ? "finished" : "reading",
        progress,
        startTime: this._nowStr(),
        finishTime: progress >= 100 ? this._nowStr() : ""
      });
      idx = data.studyRecords.length - 1;
    } else {
      wasFinished = data.studyRecords[idx].status === "finished";
      data.studyRecords[idx].progress = Math.max(data.studyRecords[idx].progress || 0, progress);
      if (progress >= 100 && !wasFinished) {
        data.studyRecords[idx].status = "finished";
        data.studyRecords[idx].finishTime = this._nowStr();
      }
    }

    if (progress >= 100 && !wasFinished) {
      const matIdx = data.materials.findIndex(m => m.id === materialId);
      if (matIdx !== -1) {
        data.materials[matIdx].finishCount = (data.materials[matIdx].finishCount || 0) + 1;
      }
    }

    this._setData(data);
    return this.getStudyRecord(agentId, materialId);
  },

  // Exam Records
  getExamRecords() {
    return this._getData().examRecords || [];
  },

  getExamRecordById(id) {
    return this.getExamRecords().find(r => r.id === id);
  },

  getAgentExamRecords(agentId) {
    return this.getExamRecords().filter(r => r.agentId === agentId);
  },

  getLearnerExamRecords(learnerId) {
    return this.getExamRecords().filter(r => r.agentId === learnerId);
  },

  getAgentExamRecordCount(agentId, examId) {
    return this.getExamRecords().filter(r => r.agentId === agentId && r.examId === examId).length;
  },

  submitExam(examId, agentId, answers, durationMinutes) {
    const exam = this.getExamById(examId);
    if (!exam) return null;
    const questions = this.getExamQuestions(examId);
    let score = 0;
    let correctCount = 0;
    questions.forEach(q => {
      const userAns = answers[q.id] || [];
      const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      const isCorrect = userAns.length === correct.length && userAns.every(a => correct.includes(a));
      if (isCorrect) {
        score += q.score;
        correctCount++;
      }
    });
    const record = {
      id: this._generateId("er"),
      examId,
      agentId,
      answers,
      score,
      correctCount,
      totalCount: questions.length,
      status: score >= exam.passScore ? "passed" : "failed",
      startTime: this._nowStr(),
      submitTime: this._nowStr(),
      duration: durationMinutes || exam.duration
    };
    const data = this._getData();
    data.examRecords.push(record);
    this._setData(data);
    return record;
  },

  // Announcements
  getAnnouncements() {
    return this._getData().announcements || [];
  },

  addAnnouncement(ann) {
    const data = this._getData();
    ann.id = ann.id || this._generateId("ann");
    data.announcements = data.announcements || [];
    data.announcements.unshift(ann);
    this._setData(data);
    return ann;
  },

  // Statistics helpers
  getStudyStats(role) {
    let materials = this.getMaterials();
    let records = this.getStudyRecords();

    if (role) {
      const learnerIds = this.getUsers().filter(u => u.role === role).map(u => u.id);
      materials = materials.filter(m => this._isVisibleToLearner(m, role));
      records = records.filter(r => learnerIds.includes(r.agentId));
    }

    const totalView = materials.reduce((sum, m) => sum + (m.viewCount || 0), 0);
    const totalFinish = materials.reduce((sum, m) => sum + (m.finishCount || 0), 0);
    return {
      materialCount: materials.length,
      totalView,
      totalFinish,
      finishRate: totalView ? Math.round((totalFinish / totalView) * 100) : 0,
      agentCount: this.getUsers().filter(u => u.role === "agent").length,
      employeeCount: this.getUsers().filter(u => u.role === "employee").length,
      learnerCount: role ? this.getUsers().filter(u => u.role === role).length : this.getUsers().filter(u => u.role === "agent" || u.role === "employee").length
    };
  },

  getExamStats(role) {
    let exams = this.getExams();
    let records = this.getExamRecords();

    if (role) {
      const learnerIds = this.getUsers().filter(u => u.role === role).map(u => u.id);
      exams = exams.filter(e => this._isVisibleToLearner(e, role));
      records = records.filter(r => learnerIds.includes(r.agentId));
    }

    const totalCount = records.length;
    const passedCount = records.filter(r => r.status === "passed").length;
    const avgScore = totalCount ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / totalCount) : 0;
    return {
      examCount: exams.length,
      totalCount,
      passedCount,
      passRate: totalCount ? Math.round((passedCount / totalCount) * 100) : 0,
      avgScore,
      learnerCount: role ? this.getUsers().filter(u => u.role === role).length : this.getUsers().filter(u => u.role === "agent" || u.role === "employee").length
    };
  },

  // Session helpers for exam answering
  saveExamSession(session) {
    sessionStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(session));
  },

  getExamSession() {
    const raw = sessionStorage.getItem(EXAM_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  clearExamSession() {
    sessionStorage.removeItem(EXAM_SESSION_KEY);
  },

  // Clear all data (for demo/testing)
  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.initMockData();
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = DataStore;
}
