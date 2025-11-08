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
      description: "Quick overview of daily tasks and alerts with KPIs and priority alerts.",
      components: ["ChurnOverviewCard", "TaskList", "AlertsChart", "HighRiskCustomers", "PriorityAlerts", "RecentActivities", "QuickActions"],
      icon: "dashboard",
      section: "core"
    },
    {
      name: "Customers",
      route: "/customers",
      description: "Find and browse customers with advanced search and filtering capabilities.",
      components: ["CustomerTable", "FilterSidebar", "Pagination", "ChurnScoreDisplay", "SearchBar"],
      icon: "people",
      section: "core"
    },
    {
      name: "My Tasks",
      route: "/tasks",
      description: "Track assigned work and follow-ups with task management.",
      components: ["TaskSummaryCards", "TaskList", "TaskFilters", "AddTaskModal"],
      icon: "task",
      section: "core"
    },
    {
      name: "Notes",
      route: "/retention-notes",
      description: "Manage all retention interactions and notes with follow-up tracking.",
      components: ["NotesDashboard", "NotesTable", "AddNoteModal", "NotesTimeline"],
      icon: "note",
      section: "core"
    },
    // ===== PREDICTIONS & INSIGHTS =====
    {
      name: "Predictions",
      route: "/prediction-insights",
      description: "Individual and group churn predictions. Identify which customers are most likely to churn soon and export target lists.",
      components: ["PredictionConfiguration", "PredictionProgress", "ResultsSummary", "RiskSegmentationTable", "ExportOptions", "IndividualPredictions"],
      icon: "analytics",
      section: "insights"
    },
    {
      name: "Recommendations",
      route: "/recommendations",
      description: "Suggested actions for at-risk customers. Choose the most effective intervention per customer.",
      components: ["RecommendationsTable", "RecommendationFilters", "ActionPrioritization", "ConfidenceScores", "ImpactAnalysis"],
      icon: "thumb_up",
      section: "insights"
    },
    {
      name: "Analysis",
      route: "/behavioral-analysis",
      description: "Detect early churn signals from usage data. Find behavioral shifts that predict churn.",
      components: ["BehavioralPatterns", "TransactionAnalysis", "UsageTrends", "EarlyWarningSignals"],
      icon: "assessment",
      section: "insights"
    },
    // ===== CAMPAIGNS & PERFORMANCE =====
    {
      name: "Campaigns",
      route: "/campaigns",
      description: "View and participate in retention campaigns. Track campaign performance and customer engagement.",
      components: ["ActiveCampaigns", "CampaignPerformance", "CampaignDetails"],
      icon: "campaign",
      section: "performance"
    },
    {
      name: "Performance",
      route: "/performance",
      description: "Personal performance metrics and retention success tracking.",
      components: ["PerformanceKPIs", "MonthlyTrendChart", "Leaderboard", "RecentSuccesses"],
      icon: "trending_up",
      section: "performance"
    },
    {
      name: "Reports",
      route: "/reports",
      description: "Generate and view reports on customer retention and personal performance.",
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
    {
      name: "Dashboard",
      route: "/dashboard",
      description: "High-level strategic overview with KPIs, trends, and portfolio analysis.",
      components: ["StrategicKPIs", "TrendAnalysis", "BranchHeatmap", "TeamPerformance", "RiskPortfolio", "CampaignOverview", "AlertCenter"],
      icon: "dashboard"
    },
    {
      name: "Customers",
      route: "/customers",
      description: "View all customers across the organization with ML churn predictions.",
      components: ["CustomerTable", "FilterSidebar", "ExecutiveView", "RiskDistributionCharts"],
      icon: "people"
    },
    {
      name: "Approvals",
      route: "/approvals",
      description: "Review and approve campaigns with budget and ROI analysis.",
      components: ["PendingApprovalsQueue", "CampaignDetailView", "ApprovedCampaigns", "RejectedCampaigns"],
      icon: "approval"
    },
    {
      name: "Analytics",
      route: "/strategic-analytics",
      description: "Deep-dive analysis with CLV, cohort analysis, and predictive scenarios.",
      components: ["CLVAnalysis", "CohortAnalysis", "ProductAffinity", "CompetitiveAnalysis", "PredictiveScenarios"],
      icon: "analytics"
    },
    {
      name: "Team",
      route: "/team",
      description: "Oversee retention team with performance tracking and workload management.",
      components: ["TeamOverview", "IndividualPerformance", "WorkloadAssignment", "TrainingDevelopment"],
      icon: "supervisor_account"
    },
    {
      name: "Budget & ROI",
      route: "/budget-roi",
      description: "Financial oversight with budget tracking and ROI analysis.",
      components: ["BudgetDashboard", "ROIAnalysis", "CostBenefitAnalysis"],
      icon: "attach_money"
    },
    {
      name: "Reports",
      route: "/reports",
      description: "Generate executive reports with strategic insights.",
      components: ["ReportGenerator", "ExportButtons", "TrendCharts", "ExecutiveDashboards"],
      icon: "assessment"
    }
  ],

  admin: [
    {
      name: "Dashboard",
      route: "/admin/dashboard",
      description: "Technical system overview with health monitoring and usage statistics.",
      components: ["SystemHealth", "UsageStatistics", "ModelStatus"],
      icon: "dashboard"
    },
    {
      name: "Users",
      route: "/admin/users",
      description: "Manage system access with role assignments and permissions.",
      components: ["UserListTable", "AddUserForm", "UserDetailModal", "RolePermissionsMatrix"],
      icon: "people"
    },
    {
      name: "Customers",
      route: "/customers",
      description: "View all customers and manage customer data.",
      components: ["CustomerTable", "AdminControls", "DataManagement", "BulkOperations"],
      icon: "storage"
    },
    {
      name: "Models",
      route: "/admin/models",
      description: "ML model lifecycle management with training, deployment, and monitoring.",
      components: ["CurrentModelCard", "ModelTrainingPanel", "ModelHistory", "FeatureEngineering", "ModelTesting"],
      icon: "auto_awesome"
    },
    {
      name: "Settings",
      route: "/admin/settings",
      description: "System settings, prediction thresholds, notifications, and integrations.",
      components: ["GeneralSettings", "PredictionSettings", "NotificationSettings", "IntegrationSettings"],
      icon: "settings"
    },
    {
      name: "Audit",
      route: "/admin/audit",
      description: "Track system usage, compliance, and data privacy settings.",
      components: ["AuditLog", "ComplianceReports", "DataPrivacy"],
      icon: "security"
    },
    {
      name: "Maintenance",
      route: "/admin/maintenance",
      description: "System maintenance with backup management and database optimization.",
      components: ["BackupManagement", "DatabaseMaintenance", "SystemUpdates"],
      icon: "backup"
    }
  ]
};

export default pages;
