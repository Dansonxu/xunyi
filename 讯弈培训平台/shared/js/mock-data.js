const MockData = {
  users: [
    {
      id: "admin_1",
      role: "admin",
      username: "admin",
      password: "admin123",
      name: "总部管理员",
      isBackendUser: true,
      avatar: ""
    },
    {
      id: "op_agent_1",
      role: "agent",
      username: "opagent",
      password: "123456",
      name: "代理运营",
      isBackendUser: true,
      avatar: ""
    },
    {
      id: "op_emp_1",
      role: "employee",
      username: "opemp",
      password: "123456",
      name: "员工运营",
      department: "培训部",
      isBackendUser: true,
      avatar: ""
    },
    {
      id: "agent_1",
      role: "agent",
      username: "agent001",
      password: "123456",
      name: "张代理",
      avatar: ""
    },
    {
      id: "agent_2",
      role: "agent",
      username: "agent002",
      password: "123456",
      name: "李代理",
      avatar: ""
    },
    {
      id: "agent_3",
      role: "agent",
      username: "agent003",
      password: "123456",
      name: "王代理",
      avatar: ""
    },
    {
      id: "emp_1",
      role: "employee",
      username: "emp001",
      password: "123456",
      name: "陈员工",
      department: "市场部",
      employeeType: "全职",
      avatar: ""
    },
    {
      id: "emp_2",
      role: "employee",
      username: "emp002",
      password: "123456",
      name: "刘员工",
      department: "客服部",
      employeeType: "全职",
      avatar: ""
    }
  ],

  materials: [
    {
      id: "mat_1",
      title: "2024 产品培训手册",
      type: "pdf",
      category: "产品知识",
      audience: "agent",
      description: "全面介绍 2024 年新产品功能、卖点及销售话术。",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileSize: "2.5MB",
      status: "published",
      uploadTime: "2024-01-15 10:30",
      uploaderId: "admin_1",
      viewCount: 45,
      finishCount: 32
    },
    {
      id: "mat_2",
      title: "代理商销售政策解读",
      type: "video",
      category: "销售政策",
      audience: "agent",
      description: "总部销售政策详细解读与常见问答。",
      fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      fileSize: "18.6MB",
      status: "published",
      uploadTime: "2024-01-16 14:00",
      uploaderId: "admin_1",
      viewCount: 38,
      finishCount: 25
    },
    {
      id: "mat_3",
      title: "售后服务操作规范",
      type: "word",
      category: "售后服务",
      audience: "agent",
      description: "售后服务标准流程与注意事项文档。",
      fileUrl: "../assets/demo-files/sample.docx",
      fileSize: "1.2MB",
      status: "published",
      uploadTime: "2024-01-17 09:15",
      uploaderId: "admin_1",
      viewCount: 27,
      finishCount: 18
    },
    {
      id: "mat_4",
      title: "新员工入职指南",
      type: "pdf",
      category: "入职培训",
      audience: "employee",
      description: "公司介绍、规章制度、办公流程与入职须知。",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      fileSize: "3.2MB",
      status: "published",
      uploadTime: "2024-02-01 09:00",
      uploaderId: "admin_1",
      viewCount: 12,
      finishCount: 8
    },
    {
      id: "mat_5",
      title: "员工合规培训视频",
      type: "video",
      category: "合规培训",
      audience: "employee",
      description: "信息安全、商业行为准则与合规要求。",
      fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      fileSize: "22.1MB",
      status: "published",
      uploadTime: "2024-02-02 14:00",
      uploaderId: "admin_1",
      viewCount: 10,
      finishCount: 6
    }
  ],

  materialCategories: [
    { id: "cat_1", name: "产品知识", sortOrder: 1 },
    { id: "cat_2", name: "销售政策", sortOrder: 2 },
    { id: "cat_3", name: "售后服务", sortOrder: 3 }
  ],

  questions: [
    {
      id: "q_1",
      type: "single",
      content: "2024 新产品的核心升级点是什么？",
      options: [
        { id: "A", text: "性能提升 30%" },
        { id: "B", text: "价格降低 20%" },
        { id: "C", text: "外观颜色增加" },
        { id: "D", text: "保修期延长" }
      ],
      correctAnswer: ["A"],
      score: 5,
      category: "产品知识",
      materialId: "mat_1",
      audience: "agent"
    },
    {
      id: "q_2",
      type: "single",
      content: "代理商最低提货量要求是多少？",
      options: [
        { id: "A", text: "10 台" },
        { id: "B", text: "50 台" },
        { id: "C", text: "100 台" },
        { id: "D", text: "无最低要求" }
      ],
      correctAnswer: ["B"],
      score: 5,
      category: "销售政策",
      materialId: "mat_2",
      audience: "agent"
    },
    {
      id: "q_3",
      type: "multiple",
      content: "售后服务受理渠道包含哪些？（多选）",
      options: [
        { id: "A", text: "官方客服热线" },
        { id: "B", text: "代理商微信" },
        { id: "C", text: "官网工单系统" },
        { id: "D", text: "邮件" }
      ],
      correctAnswer: ["A", "C"],
      score: 10,
      category: "售后服务",
      materialId: "mat_3",
      audience: "agent"
    },
    {
      id: "q_4",
      type: "judge",
      content: "代理商可以直接修改产品官方售价。",
      options: [
        { id: "A", text: "正确" },
        { id: "B", text: "错误" }
      ],
      correctAnswer: ["B"],
      score: 5,
      category: "销售政策",
      materialId: "mat_2",
      audience: "agent"
    },
    {
      id: "q_5",
      type: "single",
      content: "产品质保期从何时开始计算？",
      options: [
        { id: "A", text: "生产日期" },
        { id: "B", text: "发货日期" },
        { id: "C", text: "客户签收日期" },
        { id: "D", text: "代理商采购日期" }
      ],
      correctAnswer: ["C"],
      score: 5,
      category: "售后服务",
      materialId: "mat_3",
      audience: "agent"
    },
    {
      id: "q_6",
      type: "multiple",
      content: "新产品的主打卖点有哪些？（多选）",
      options: [
        { id: "A", text: "高性能芯片" },
        { id: "B", text: "超长续航" },
        { id: "C", text: "轻薄便携" },
        { id: "D", text: "免费换新" }
      ],
      correctAnswer: ["A", "B", "C"],
      score: 10,
      category: "产品知识",
      materialId: "mat_1",
      audience: "agent"
    },
    {
      id: "q_7",
      type: "single",
      content: "员工入职后应在多少个工作日内完成入职指南学习？",
      options: [
        { id: "A", text: "3 个工作日" },
        { id: "B", text: "5 个工作日" },
        { id: "C", text: "7 个工作日" },
        { id: "D", text: "10 个工作日" }
      ],
      correctAnswer: ["B"],
      score: 5,
      category: "入职培训",
      materialId: "mat_4",
      audience: "employee"
    },
    {
      id: "q_8",
      type: "judge",
      content: "员工可以将公司账号密码告知同事以方便协作。",
      options: [
        { id: "A", text: "正确" },
        { id: "B", text: "错误" }
      ],
      correctAnswer: ["B"],
      score: 5,
      category: "合规培训",
      materialId: "mat_5",
      audience: "employee"
    },
    {
      id: "q_9",
      type: "multiple",
      content: "以下哪些行为符合公司商业行为准则？（多选）",
      options: [
        { id: "A", text: "保护客户隐私数据" },
        { id: "B", text: "如实记录业务数据" },
        { id: "C", text: "接受小额礼品无需报备" },
        { id: "D", text: "发现违规及时上报" }
      ],
      correctAnswer: ["A", "B", "D"],
      score: 10,
      category: "合规培训",
      materialId: "mat_5",
      audience: "employee"
    }
  ],

  exams: [
    {
      id: "exam_1",
      title: "产品知识基础考核",
      description: "考核代理商对 2024 新产品知识的掌握情况。",
      audience: "agent",
      materialIds: ["mat_1"],
      questionIds: ["q_1", "q_6"],
      duration: 15,
      passScore: 9,
      maxAttempts: 3,
      status: "published",
      startTime: "2024-01-18 00:00",
      endTime: "2024-12-31 23:59",
      createTime: "2024-01-17 16:00"
    },
    {
      id: "exam_2",
      title: "销售政策与售后规范综合考试",
      description: "覆盖销售政策和售后服务操作规范的综合测试。",
      audience: "agent",
      materialIds: ["mat_2", "mat_3"],
      questionIds: ["q_2", "q_3", "q_4", "q_5"],
      duration: 30,
      passScore: 15,
      maxAttempts: 2,
      status: "published",
      startTime: "2024-01-20 00:00",
      endTime: "2024-12-31 23:59",
      createTime: "2024-01-18 10:00"
    },
    {
      id: "exam_3",
      title: "新员工入职培训考核",
      description: "检验新员工对公司制度与合规要求的掌握情况。",
      audience: "employee",
      materialIds: ["mat_4", "mat_5"],
      questionIds: ["q_7", "q_8", "q_9"],
      duration: 20,
      passScore: 15,
      maxAttempts: 3,
      status: "published",
      startTime: "2024-02-01 00:00",
      endTime: "2024-12-31 23:59",
      createTime: "2024-01-30 10:00"
    }
  ],

  trainingPrograms: [
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
  ],

  studyRecords: [
    {
      id: "sr_1",
      agentId: "agent_1",
      materialId: "mat_1",
      audience: "agent",
      status: "finished",
      progress: 100,
      startTime: "2024-01-18 10:00",
      finishTime: "2024-01-18 10:30"
    },
    {
      id: "sr_2",
      agentId: "agent_1",
      materialId: "mat_2",
      audience: "agent",
      status: "reading",
      progress: 45,
      startTime: "2024-01-19 14:00",
      finishTime: ""
    }
  ],

  examRecords: [
    {
      id: "er_1",
      examId: "exam_1",
      agentId: "agent_1",
      answers: {
        q_1: ["A"],
        q_6: ["A", "B", "C"]
      },
      score: 100,
      correctCount: 2,
      totalCount: 2,
      status: "passed",
      startTime: "2024-01-18 10:35",
      submitTime: "2024-01-18 10:42",
      duration: 7
    }
  ],

  announcements: [
    {
      id: "ann_1",
      title: "新产品培训资料已上线",
      content: "请各位代理商及时学习新产品培训手册，并参加配套考试。",
      publishTime: "2024-01-15",
      priority: true
    },
    {
      id: "ann_2",
      title: "销售政策更新通知",
      content: "2024 年第一季度销售政策已更新，请查看相关视频资料。",
      publishTime: "2024-01-16",
      priority: false
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = MockData;
}
