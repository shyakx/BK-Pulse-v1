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
    {
      name: "Dashboard",
      route: "/dashboard",
      description: "Quick overview of daily tasks and alerts with KPIs and priority alerts.",
      components: ["ChurnOverviewCard", "TaskList", "AlertsChart", "HighRiskCustomers", "PriorityAlerts", "RecentActivities", "QuickActions"],
      icon: "dashboard"
    },
    {
      name: "Customer Search & List",
      route: "/customers",
      description: "Find and browse customers with advanced search and filtering capabilities.",
      components: ["CustomerTable", "FilterSidebar", "Pagination", "ChurnScoreDisplay", "SearchBar"],
      icon: "people"
    },
    {
      name: "Customer Details",
      route: "/customers/:id",
      description: "Complete customer view with prediction, SHAP explanation, and retention actions.",
      components: ["CustomerInfo", "RiskAssessment", "SHAPExplanation", "RecommendedActions", "RetentionNotes", "FollowUpSchedule"],
      icon: "person"
    },
    {
      name: "Retention Notes",
      route: "/retention-notes",
      description: "Manage all retention interactions and notes with follow-up tracking.",
      components: ["NotesDashboard", "NotesTable", "AddNoteModal", "NotesTimeline"],
      icon: "note"
    },
    {
      name: "My Tasks",
      route: "/tasks",
      description: "Track assigned work and follow-ups with task management.",
      components: ["TaskSummaryCards", "TaskList", "TaskFilters", "AddTaskModal"],
      icon: "task"
    },
    {
      name: "Performance",
      route: "/performance",
      description: "Personal performance metrics and retention success tracking.",
      components: ["PerformanceKPIs", "MonthlyTrendChart", "Leaderboard", "RecentSuccesses"],
      icon: "trending_up"
    }
  ],

  retentionAnalyst: [
    {
      name: "Analytics Dashboard",
      route: "/dashboard",
      description: "Strategic overview and trends with executive KPIs and churn analysis.",
      components: ["ExecutiveKPIs", "ChurnTrendChart", "RiskDistributionChart", "ChurnDriversChart", "BranchPerformanceMap", "AccountTypeAnalysis"],
      icon: "dashboard"
    },
    {
      name: "Customer Analysis",
      route: "/customers",
      description: "View all customers with ML churn predictions. Analyze patterns by segment, branch, or risk level.",
      components: ["CustomerTable", "FilterSidebar", "Pagination", "BatchPredictionControls"],
      icon: "people"
    },
    {
      name: "Bulk Prediction",
      route: "/bulk-prediction",
      description: "Run predictions on customer segments with customizable filters and settings.",
      components: ["PredictionConfiguration", "PredictionProgress", "ResultsSummary", "RiskSegmentationTable", "ExportOptions"],
      icon: "analytics"
    },
    {
      name: "Campaign Management",
      route: "/campaigns",
      description: "Design and execute retention campaigns with target selection and action planning.",
      components: ["ActiveCampaigns", "CampaignWizard", "CampaignCards", "PastCampaigns"],
      icon: "campaign"
    },
    {
      name: "Campaign Performance",
      route: "/campaigns/:id/performance",
      description: "Track campaign effectiveness with detailed metrics and ROI analysis.",
      components: ["CampaignOverview", "CampaignTimeline", "PerformanceCharts", "CustomerList", "ABTestResults"],
      icon: "bar_chart"
    },
    {
      name: "Customer Segmentation",
      route: "/segmentation",
      description: "Analyze customer groups with segmentation builder and comparison tools.",
      components: ["SegmentationBuilder", "SegmentPreview", "SegmentComparison", "SavedSegments", "SegmentVisualization"],
      icon: "group"
    },
    {
      name: "Model Performance",
      route: "/model-insights",
      description: "Monitor ML model health, metrics, and feature importance over time.",
      components: ["ModelMetricsDashboard", "PerformanceOverTime", "ConfusionMatrix", "FeatureImportanceChart", "ModelComparison", "PredictionDistribution"],
      icon: "insights"
    },
    {
      name: "Reports",
      route: "/reports",
      description: "Generate and download reports with custom report builder and scheduled reports.",
      components: ["ReportTemplates", "CustomReportBuilder", "ScheduledReports", "ReportHistory"],
      icon: "assessment"
    }
  ],

  retentionManager: [
    {
      name: "Executive Dashboard",
      route: "/dashboard",
      description: "High-level strategic overview with KPIs, trends, and portfolio analysis.",
      components: ["StrategicKPIs", "TrendAnalysis", "BranchHeatmap", "TeamPerformance", "RiskPortfolio", "CampaignOverview", "AlertCenter"],
      icon: "dashboard"
    },
    {
      name: "Customers Overview",
      route: "/customers",
      description: "View all customers across the organization with ML churn predictions.",
      components: ["CustomerTable", "FilterSidebar", "ExecutiveView", "RiskDistributionCharts"],
      icon: "people"
    },
    {
      name: "Campaign Approval",
      route: "/approvals",
      description: "Review and approve campaigns with budget and ROI analysis.",
      components: ["PendingApprovalsQueue", "CampaignDetailView", "ApprovedCampaigns", "RejectedCampaigns"],
      icon: "approval"
    },
    {
      name: "Strategic Analytics",
      route: "/strategic-analytics",
      description: "Deep-dive analysis with CLV, cohort analysis, and predictive scenarios.",
      components: ["CLVAnalysis", "CohortAnalysis", "ProductAffinity", "CompetitiveAnalysis", "PredictiveScenarios"],
      icon: "analytics"
    },
    {
      name: "Team Management",
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
      name: "Reports & Analytics",
      route: "/reports",
      description: "Generate executive reports with strategic insights.",
      components: ["ReportGenerator", "ExportButtons", "TrendCharts", "ExecutiveDashboards"],
      icon: "assessment"
    }
  ],

  admin: [
    {
      name: "System Dashboard",
      route: "/admin/dashboard",
      description: "Technical system overview with health monitoring and usage statistics.",
      components: ["SystemHealth", "UsageStatistics", "ModelStatus"],
      icon: "dashboard"
    },
    {
      name: "User Management",
      route: "/admin/users",
      description: "Manage system access with role assignments and permissions.",
      components: ["UserListTable", "AddUserForm", "UserDetailModal", "RolePermissionsMatrix"],
      icon: "people"
    },
    {
      name: "Customer Data",
      route: "/customers",
      description: "View all customers and manage customer data.",
      components: ["CustomerTable", "AdminControls", "DataManagement", "BulkOperations"],
      icon: "storage"
    },
    {
      name: "Model Management",
      route: "/admin/models",
      description: "ML model lifecycle management with training, deployment, and monitoring.",
      components: ["CurrentModelCard", "ModelTrainingPanel", "ModelHistory", "FeatureEngineering", "ModelTesting"],
      icon: "auto_awesome"
    },
    {
      name: "System Configuration",
      route: "/admin/settings",
      description: "System settings, prediction thresholds, notifications, and integrations.",
      components: ["GeneralSettings", "PredictionSettings", "NotificationSettings", "IntegrationSettings"],
      icon: "settings"
    },
    {
      name: "Audit & Compliance",
      route: "/admin/audit",
      description: "Track system usage, compliance, and data privacy settings.",
      components: ["AuditLog", "ComplianceReports", "DataPrivacy"],
      icon: "security"
    },
    {
      name: "Backup & Maintenance",
      route: "/admin/maintenance",
      description: "System maintenance with backup management and database optimization.",
      components: ["BackupManagement", "DatabaseMaintenance", "SystemUpdates"],
      icon: "backup"
    }
  ]
};

export default pages;
