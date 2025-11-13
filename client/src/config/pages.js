/**
 * BK Pulse – Role-based Churn Intelligence Platform
 * Technology Stack: React + Bootstrap (Frontend), Node.js (Backend), PostgreSQL (Database)
 * Branding: Bank of Kigali colors and identity
 * Author: Steven SHYAKA
 * Date: 10/2025
 */

/**
 * Users and Roles:
 * 1. Retention Officer
 * 2. Retention Analyst
 * 3. Retention Manager
 * 4. Admin
 */

/**
 * Sidebar & Navbar Structure:
 * - Dynamic based on logged-in user role
 * - Navbar: Home/Dashboard, Profile, Logout
 * - Sidebar: role-specific links
 */

/**
 * Pages & Modules per Role
 */

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
    // ===== PREDICTIONS & INSIGHTS =====
    {
      name: "Predictions",
      route: "/prediction-insights",
      description: "View churn predictions for your assigned customers and run batch predictions.",
      components: ["PredictionConfiguration", "PredictionProgress", "ResultsSummary", "RiskSegmentationTable", "ExportOptions", "IndividualPredictions"],
      icon: "analytics",
      section: "insights"
    },
    // ===== PERFORMANCE & REPORTS =====
    {
      name: "Performance",
      route: "/performance",
      description: "Track your personal performance metrics and retention success.",
      components: ["PerformanceKPIs", "MonthlyTrendChart", "Leaderboard", "RecentSuccesses"],
      icon: "trending_up",
      section: "performance"
    },
    {
      name: "Reports",
      route: "/reports",
      description: "Generate reports on your customer retention activities and performance.",
      components: ["ReportGenerator", "ExportButtons", "TrendCharts"],
      icon: "assessment",
      section: "performance"
    }
  ],

  retentionAnalyst: [
    // ===== CORE ANALYST PAGES (Daily Use) =====
    {
      name: "Dashboard",
      route: "/dashboard",
      description: "High-level churn trends and KPIs. Quickly check today's churn numbers, top drivers, and customer loss impact.",
      components: ["ExecutiveKPIs", "ChurnTrendChart", "RiskDistributionChart", "ChurnDriversChart", "BranchPerformanceMap", "AccountTypeAnalysis"],
      icon: "dashboard",
      section: "core"
    },
    {
      name: "Predictions",
      route: "/prediction-insights",
      description: "Individual and group churn predictions. Identify which customers are most likely to churn soon and export target lists.",
      components: ["PredictionConfiguration", "PredictionProgress", "ResultsSummary", "RiskSegmentationTable", "ExportOptions", "IndividualPredictions"],
      icon: "analytics",
      section: "core"
    },
    {
      name: "Customers",
      route: "/customers",
      description: "Deep dive into single customer data. Investigate why a particular customer is at risk before outreach.",
      components: ["CustomerTable", "CustomerInfo", "RiskAssessment", "SHAPExplanation", "RecommendedActions", "RetentionNotes"],
      icon: "people",
      section: "core"
    },
    {
      name: "Recommendations",
      route: "/recommendations",
      description: "Suggested actions for at-risk customers. Choose or test the most effective intervention per customer.",
      components: ["RecommendationsTable", "RecommendationFilters", "ActionPrioritization", "ConfidenceScores", "ImpactAnalysis"],
      icon: "thumb_up",
      section: "core"
    },
    // ===== ANALYTICAL & STRATEGIC SUPPORT PAGES =====
    {
      name: "Behavior Analysis",
      route: "/behavioral-analysis",
      description: "Detect early churn signals from usage data. Find behavioral shifts that predict churn before it happens.",
      components: ["BehavioralPatterns", "TransactionAnalysis", "UsageTrends", "EarlyWarningSignals", "AnomalyDetection"],
      icon: "assessment",
      section: "analytical"
    },
    {
      name: "Campaigns",
      route: "/campaigns",
      description: "Measure impact of retention campaigns. Prove ROI of past retention actions and refine new strategies.",
      components: ["ActiveCampaigns", "CampaignPerformance", "ROIAnalysis", "CampaignWizard", "CampaignComparison"],
      icon: "campaign",
      section: "analytical"
    },
    {
      name: "Explainability",
      route: "/explainability",
      description: "Understand why the model made a prediction. Ensure decisions are fair, auditable, and regulator-friendly.",
      components: ["SHAPExplanation", "FeatureImportance", "ModelInterpretability", "FairnessMetrics", "ComplianceReports"],
      icon: "insights",
      section: "analytical"
    },
    // ===== ADVANCED / TECHNICAL ANALYST TOOLS =====
    {
      name: "Model Performance",
      route: "/model-insights",
      description: "Track model health and accuracy. Ensure predictions remain reliable; alert if performance drops.",
      components: ["ModelMetricsDashboard", "PerformanceOverTime", "ConfusionMatrix", "FeatureImportanceChart", "ModelComparison", "PredictionDistribution"],
      icon: "auto_awesome",
      section: "advanced"
    },
    {
      name: "Data",
      route: "/data-management",
      description: "Data quality and access. Check data refresh, fix source errors, or audit model changes.",
      components: ["DataQualityDashboard", "DataRefreshStatus", "SourceErrorTracking", "AuditLog", "ModelChangeHistory"],
      icon: "storage",
      section: "advanced"
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
    // ===== STRATEGIC ANALYSIS =====
    {
      name: "Analytics",
      route: "/strategic-analytics",
      description: "Deep-dive strategic analysis with CLV, cohort analysis, and predictive scenarios.",
      components: ["CLVAnalysis", "CohortAnalysis", "ProductAffinity", "CompetitiveAnalysis", "PredictiveScenarios"],
      icon: "analytics",
      section: "analytical"
    },
    {
      name: "Budget & ROI",
      route: "/budget-roi",
      description: "Financial oversight with budget tracking, ROI analysis, and cost-benefit evaluation.",
      components: ["BudgetDashboard", "ROIAnalysis", "CostBenefitAnalysis"],
      icon: "attach_money",
      section: "analytical"
    },
    {
      name: "Reports",
      route: "/reports",
      description: "Generate executive reports with strategic insights and team performance.",
      components: ["ReportGenerator", "ExportButtons", "TrendCharts", "ExecutiveDashboards"],
      icon: "assessment",
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
      name: "Audit",
      route: "/admin/audit",
      description: "Track system usage, compliance, data privacy, and security audit logs.",
      components: ["AuditLog", "ComplianceReports", "DataPrivacy"],
      icon: "security",
      section: "configuration"
    },
    {
      name: "Maintenance",
      route: "/admin/maintenance",
      description: "System maintenance: backups, database optimization, and system updates.",
      components: ["BackupManagement", "DatabaseMaintenance", "SystemUpdates"],
      icon: "backup",
      section: "configuration"
    }
  ]
};

export default pages;
