// Role-based page configuration for BK Pulse
const pages = {
  retentionOfficer: [
    // ===== CORE OFFICER PAGES (Daily Use) =====
    {
      name: "Dashboard",
      route: "/dashboard",
      description: "Quick overview of assigned customers, daily tasks, and priority alerts.",
      components: ["ChurnOverviewCard", "TaskList", "AlertsChart", "HighRiskCustomers", "PriorityAlerts", "RecentActivities", "QuickActions"],
      icon: "dashboard",
      section: "core"
    },
    {
      name: "Customers",
      route: "/customers",
      description: "View and manage your assigned customers with churn scores and risk levels.",
      components: ["CustomerTable", "FilterSidebar", "Pagination", "ChurnScoreDisplay", "SearchBar"],
      icon: "people",
      section: "core"
    },
    {
      name: "My Tasks",
      route: "/tasks",
      description: "Track assigned work, follow-ups, and task completion.",
      components: ["TaskSummaryCards", "TaskList", "TaskFilters", "AddTaskModal"],
      icon: "task",
      section: "core"
    },
    {
      name: "Notes",
      route: "/retention-notes",
      description: "Manage customer interaction notes and follow-up tracking.",
      components: ["NotesDashboard", "NotesTable", "AddNoteModal", "NotesTimeline"],
      icon: "note",
      section: "core"
    },
    {
      name: "Performance",
      route: "/performance",
      description: "Track personal performance metrics, retention rates, and leaderboard ranking.",
      components: ["PerformanceMetrics", "RetentionTrendChart", "Leaderboard", "RecentSuccesses"],
      icon: "trending_up",
      section: "core"
    },
    {
      name: "Retention Scripts",
      route: "/retention-scripts",
      description: "Guided conversation flows and communication templates for effective customer retention.",
      components: ["ScriptCategories", "PhoneScripts", "SMSTemplates", "EmailTemplates", "AIGeneratedScripts"],
      icon: "chat",
      section: "core"
    }
  ],

  retentionAnalyst: [
    // ===== CORE ANALYST PAGES (Daily Use) =====
    {
      name: "Dashboard",
      route: "/dashboard",
      description: "Analytics dashboard with overall churn rates, high-risk trends, reactivation success, segment movement, financial impact, and top churn drivers.",
      components: ["ChurnRates", "HighRiskTrends", "ReactivationSuccess", "SegmentMovement", "FinancialImpact", "TopChurnDrivers", "ModelDriftAlerts", "DataQualityAlerts"],
      icon: "dashboard",
      section: "core"
    },
    {
      name: "Predictions",
      route: "/prediction-insights",
      description: "Daily prediction batches, segment counts, accuracy tracking, confidence distribution, and batch comparisons.",
      components: ["DailyPredictionBatches", "SegmentCounts", "AccuracyTracking", "ConfidenceDistribution", "BatchComparison", "AnomalyDetection"],
      icon: "analytics",
      section: "core"
    },
    {
      name: "Recommendations",
      route: "/recommendations",
      description: "Model-driven strategic recommendations at segment and product level. Incentive impact recommendations and strategic actions.",
      components: ["StrategicRecommendations", "SegmentRecommendations", "ProductOpportunities", "IncentiveImpact", "RecommendationPrioritization"],
      icon: "thumb_up",
      section: "core"
    },
    // ===== STRATEGIC & ANALYTICS PAGES =====
    {
      name: "Campaigns",
      route: "/campaigns",
      description: "Full campaign view: performance, reach, conversions, earnings recovered, incentive effectiveness, A/B tests, and cost vs revenue impact.",
      components: ["CampaignPerformance", "CampaignReach", "Conversions", "EarningsRecovered", "IncentiveEffectiveness", "ABTestResults", "CostRevenueAnalysis", "ScenarioSimulations"],
      icon: "campaign",
      section: "analytical"
    },
    {
      name: "Analysis",
      route: "/analysis",
      description: "General analytics: inactivity patterns, salary drops, digital vs non-digital usage, inflow/outflow patterns, product adoption, CLV, region-based risk, and socio-demographic trends.",
      components: ["InactivityPatterns", "SalaryDropPatterns", "DigitalUsageAnalysis", "InflowOutflowPatterns", "ProductAdoption", "CLVAnalysis", "RegionRisk", "SocioDemographicTrends", "CustomQueryBuilder"],
      icon: "analytics",
      section: "analytical"
    },
    {
      name: "Model Insights",
      route: "/model-insights",
      description: "ML transparency: SHAP plots, feature importance, global & local explanations, performance metrics, confusion matrix, model/data drift detection, version history, and retraining logs.",
      components: ["SHAPSummary", "FeatureImportance", "GlobalLocalExplanations", "PerformanceMetrics", "ConfusionMatrix", "DriftDetection", "VersionHistory", "RetrainingLogs"],
      icon: "auto_awesome",
      section: "analytical"
    },
    // ===== GOVERNANCE & REPORTING =====
    {
      name: "Reports",
      route: "/reports",
      description: "Weekly churn reports, monthly reactivation reports, segment performance, incentive ROI, campaign summaries, model monitoring, and predictive accuracy reports.",
      components: ["WeeklyChurnReport", "MonthlyReactivationReport", "SegmentPerformance", "IncentiveROI", "CampaignSummaries", "ModelMonitoring", "AccuracyReports", "ExportOptions", "ReportScheduling"],
      icon: "assessment",
      section: "governance"
    }
  ],

  retentionManager: [
    // ===== STRATEGIC OVERVIEW =====
    {
      name: "Dashboard",
      route: "/dashboard",
      description: "High-level strategic overview with team KPIs, trends, and portfolio analysis.",
      components: ["StrategicKPIs", "TrendAnalysis", "BranchHeatmap", "TeamPerformance", "RiskPortfolio", "CampaignOverview", "AlertCenter"],
      icon: "dashboard",
      section: "core"
    },
    {
      name: "Customers",
      route: "/customers",
      description: "View all customers across the organization with ML churn predictions and assignments.",
      components: ["CustomerTable", "FilterSidebar", "ExecutiveView", "RiskDistributionCharts"],
      icon: "people",
      section: "core"
    },
    // ===== TEAM & OPERATIONS =====
    {
      name: "Team",
      route: "/team",
      description: "Oversee retention team with performance tracking, workload management, and assignments.",
      components: ["TeamOverview", "IndividualPerformance", "WorkloadAssignment", "TrainingDevelopment"],
      icon: "supervisor_account",
      section: "team"
    },
    {
      name: "Campaigns",
      route: "/campaigns",
      description: "View and manage retention campaigns across the organization.",
      components: ["ActiveCampaigns", "CampaignPerformance", "CampaignDetails", "ROIAnalysis"],
      icon: "campaign",
      section: "team"
    },
    {
      name: "Approvals",
      route: "/approvals",
      description: "Review and approve high-value retention actions and campaigns.",
      components: ["PendingApprovalsQueue", "CampaignDetailView", "ApprovedCampaigns", "RejectedCampaigns"],
      icon: "approval",
      section: "team"
    },
    {
      name: "Strategic Analytics",
      route: "/strategic-analytics",
      description: "Deep-dive analysis with CLV, cohort analysis, and predictive scenarios.",
      components: ["CLVAnalysis", "CohortAnalysis", "PredictiveScenarios", "StrategicKPIs"],
      icon: "trending_up",
      section: "analytical"
    },
    {
      name: "Budget & ROI",
      route: "/budget-roi",
      description: "Track retention budget allocation, spending, and return on investment.",
      components: ["BudgetOverview", "ROIAnalysis", "CampaignROI", "BudgetForecast"],
      icon: "attach_money",
      section: "analytical"
    }
  ],

  admin: [
    // ===== SYSTEM OVERVIEW =====
    {
      name: "Dashboard",
      route: "/admin/dashboard",
      description: "Technical system overview with health monitoring, usage statistics, and system status.",
      components: ["SystemHealth", "UsageStatistics", "ModelStatus"],
      icon: "dashboard",
      section: "core"
    },
    // ===== USER & ACCESS MANAGEMENT =====
    {
      name: "Users",
      route: "/admin/users",
      description: "Manage system users, role assignments, and access permissions.",
      components: ["UserListTable", "AddUserForm", "UserDetailModal", "RolePermissionsMatrix"],
      icon: "people",
      section: "management"
    },
    // ===== DATA & MODEL MANAGEMENT =====
    {
      name: "Data",
      route: "/admin/data",
      description: "Manage customer data, data quality, ETL processes, and data pipelines.",
      components: ["DataQualityDashboard", "DataRefreshStatus", "SourceErrorTracking", "AdminControls", "BulkOperations"],
      icon: "storage",
      section: "management"
    },
    {
      name: "Models",
      route: "/admin/models",
      description: "ML model lifecycle management: training, deployment, monitoring, and versioning.",
      components: ["CurrentModelCard", "ModelTrainingPanel", "ModelHistory", "FeatureEngineering", "ModelTesting"],
      icon: "auto_awesome",
      section: "management"
    },
    // ===== SYSTEM CONFIGURATION =====
    {
      name: "Settings",
      route: "/admin/settings",
      description: "Configure system settings, prediction thresholds, notifications, and integrations.",
      components: ["GeneralSettings", "PredictionSettings", "NotificationSettings", "IntegrationSettings"],
      icon: "settings",
      section: "configuration"
    },
    {
      name: "Audit Logs",
      route: "/admin/audit",
      description: "View system activity logs, user actions, and compliance audit trail.",
      components: ["AuditLogTable", "AuditFilters", "ExportAuditLog", "AuditDetails"],
      icon: "security",
      section: "configuration"
    },
    {
      name: "Backup & Maintenance",
      route: "/admin/maintenance",
      description: "Database backups, system optimization, and maintenance operations.",
      components: ["BackupStatus", "BackupSchedule", "DatabaseOptimization", "SystemHealth"],
      icon: "backup",
      section: "configuration"
    }
  ]
};

export default pages;
