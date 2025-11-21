# BK Pulse: Customer Churn Prediction and Retention Support System

## Capstone Project Document

**Student:** Steven Shyaka  
**Supervisor:** Pelin Mutanguha  
**Institution:** African Leadership University – Software Engineering  
**Date:** January 2025

---

## ABSTRACT

Customer churn remains a persistent challenge for commercial banks in Rwanda as digital adoption grows and customer expectations continue to evolve. The Bank of Kigali (BK), through its digital ecosystem, faces increasing pressure to identify customers likely to disengage and to understand the underlying behavioral drivers contributing to churn. Prior to this project, BK lacked an integrated analytical system capable of predicting churn, interpreting risk factors, or guiding targeted retention interventions based on data-driven insights.

This project developed BK Pulse, a Customer Churn Prediction and Retention Support System designed to enhance BK's capacity to proactively identify at-risk customers. Using a synthetic yet realistic dataset of 200,000 anonymized customer records for model training (with 160,000 training and 40,000 test records), the study applied multiple supervised machine-learning models to evaluate churn prediction performance. The production system operates on 123,000 customer records, optimized for system performance and faster batch prediction processing. Among the tested models, the XGBoost classifier demonstrated the strongest performance based on accuracy, precision, recall, and ROC-AUC scores, making it the most suitable model for operational use.

To support transparency and informed decision-making, SHAP (SHapley Additive Explanations) explainability techniques were incorporated to reveal the most influential factors affecting churn, enabling clearer understanding of customer behavior patterns. BK Pulse also generates personalized retention insights through an ML-driven recommendation engine that dynamically calculates confidence scores, impact estimates, and cost calculations based on customer-specific risk drivers, offering BK's retention teams structured guidance on mitigating churn.

The system demonstrated strong predictive performance and provided meaningful, interpretable insights that can help BK anticipate churn, guide targeted retention strategies, and strengthen long-term customer engagement. This project contributes to data-driven banking practices in Rwanda by introducing an accessible, scalable, and context-appropriate analytical solution aligned with the national digital transformation agenda.

---

## CHAPTER 1: INTRODUCTION

### 1.1 Background

Customer retention has become a global priority for financial institutions as competition intensifies and customer expectations evolve. In Rwanda, the rapid expansion of digital banking services has increased convenience but also heightened customer mobility, making it easier for clients to switch providers. The Bank of Kigali (BK), the country's largest commercial bank, serves a diverse customer base whose engagement patterns are influenced by factors such as service experience, product relevance, digital usability, and financial behavior.

Despite its continued leadership in Rwanda's financial sector, BK faces challenges in predicting customer churn early enough to intervene effectively. Traditional monitoring approaches often rely on historical reports or manual analysis, which limits the institution's ability to proactively identify emerging churn risks. As digital financial ecosystems grow, the ability to anticipate and respond to customer disengagement becomes essential for maintaining competitiveness and operational sustainability.

BK Pulse was developed in response to this need. By integrating machine learning with explainability tools, the system provides a structured approach for predicting churn, interpreting behavioral indicators, and supporting evidence-based retention planning.

### 1.2 Problem Statement

Although the Bank of Kigali collects large volumes of operational and behavioral data, it does not have an integrated system that can reliably predict customer churn or explain the underlying reasons contributing to disengagement. Without such a system, the bank's retention efforts remain reactive rather than proactive, resulting in missed opportunities to preserve long-term customer value.

The absence of a data-driven churn prediction and interpretation mechanism limits BK's ability to:

- Detect early signs of disengagement,
- Understand the behavioral drivers influencing churn risk,
- Tailor retention strategies to specific customer profiles,
- Allocate resources effectively across retention initiatives.

This project addresses these gaps by designing BK Pulse, a machine-learning-based system that predicts churn, reveals key contributing factors, and offers customer-specific retention insights.

### 1.3 Project Objectives

**General Objective**

To develop a machine learning–driven Customer Churn Prediction and Retention Support System (BK Pulse) for the Bank of Kigali.

**Specific Objectives**

1. To prepare and analyze a synthetic yet realistic dataset representing customer behavior and churn patterns.
2. To train and evaluate multiple supervised machine learning models for churn prediction.
3. To identify the best-performing model based on accuracy, precision, recall, and ROC-AUC metrics.
4. To apply SHAP explainability techniques to interpret key churn-risk factors.
5. To generate customer-specific retention insights based on model outputs and interpretability results.
6. To present an integrated system structure capable of supporting data-driven retention strategies.

### 1.4 Research Questions

1. What behavioral, transactional, and demographic factors influence customer churn within the Bank of Kigali's retail ecosystem?
2. Which machine learning model provides the most accurate and reliable predictions for customer churn?
3. How can explainability methods such as SHAP improve understanding of the factors driving churn risk?
4. In what ways can churn predictions and factor interpretations support targeted and proactive retention strategies at BK?

### 1.5 Scope of the Project

This project focuses on the development and evaluation of the BK Pulse churn prediction system. It includes data preparation, machine learning model development, interpretability analysis, and generation of customer-specific retention insights. The system is built using synthetic data and is intended for analytical and exploratory purposes. Implementation into BK's production infrastructure is beyond the scope of this academic project.

### 1.6 Significance and Justification

Customer churn has financial, operational, and strategic implications for commercial banks. Retaining an existing customer is generally more cost-effective than acquiring a new one, making churn management a critical area of focus. BK Pulse contributes to this effort by offering a data-driven mechanism for understanding churn patterns and supporting timely intervention.

The project is significant because it:

- Enhances BK's analytical capability in managing customer relationships,
- Supports evidence-based retention interventions,
- Encourages adoption of machine learning and explainable AI techniques in Rwanda's banking sector,
- Aligns with Rwanda's broader digital transformation agenda.

### 1.7 Project Deliverables

1. A cleaned and structured dataset representing customer behavior and churn outcomes (200,000 records for training, 123,000 in production).
2. Multiple trained machine learning models with documented evaluation metrics.
3. A finalized XGBoost production-ready model.
4. SHAP-based interpretability visualizations and factor analyses.
5. Customer-specific retention insights generated from model outputs.
6. A complete project report documenting methodology, results, and implications.

---

## CHAPTER 2: LITERATURE REVIEW

### 2.1 Introduction

This chapter reviews existing literature on customer churn, machine learning applications in financial services, and the role of explainable artificial intelligence (XAI) in enhancing model interpretability. The review provides a conceptual and theoretical foundation for BK Pulse and situates the project within broader global and regional research trends.

### 2.2 Customer Churn in the Banking Sector

Customer churn refers to the phenomenon where clients cease using a bank's services or close their accounts. In the financial sector, churn is often influenced by service dissatisfaction, reduced engagement, poor digital user experience, high fees, or personal financial circumstances. Studies indicate that churn has direct impacts on profitability, as acquiring new customers is significantly more expensive than retaining existing ones.

Research in East Africa highlights that churn in banks is increasingly linked to the growing availability of digital alternatives, including mobile money, microfinance institutions, and fintech platforms. Banks lacking strong customer engagement mechanisms face higher churn risks as customers gravitate toward faster, more personalized services.

### 2.3 Machine Learning for Churn Prediction

Machine learning has become a widely adopted approach for churn prediction due to its ability to detect subtle behavioral patterns that traditional statistical methods may overlook. Commonly used algorithms include Logistic Regression, Decision Trees, Random Forest, Gradient Boosting, XGBoost, and LightGBM. These models analyze historical customer data to classify customers as likely to churn or remain active.

Recent studies show that ensemble learning methods such as Gradient Boosting and LightGBM often produce superior predictive performance, particularly in large and complex datasets. Their ability to handle non-linear relationships and heterogeneous features makes them suitable for churn-related tasks.

### 2.4 Explainable AI and SHAP

As machine learning models grow more complex, interpretability becomes essential—especially in regulated sectors such as banking. Explainable AI (XAI) methods provide transparency by illustrating how specific features influence model predictions.

SHAP (SHapley Additive Explanations) is a widely recognized interpretability technique rooted in cooperative game theory. It assigns each feature a contribution score, enabling practitioners to understand how different factors increase or decrease a customer's churn risk. In banking contexts, SHAP improves trust and supports more precise and ethically grounded decision-making.

### 2.5 Churn Prediction in the Rwandan Context

There is limited documented research on churn prediction within Rwanda's banking sector, highlighting a gap that BK Pulse aims to address. While Rwanda has made significant progress in digital financial transformation, local banks still rely heavily on manual processes to understand customer behavior. Incorporating predictive analytics can strengthen financial-sector resilience and enhance customer experience.

### 2.6 Overview of Existing Systems and Studies

This section provides a comprehensive overview of existing commercial systems, academic research, and industry implementations related to customer churn prediction in banking and financial services.

#### 2.6.1 Commercial Churn Prediction Systems

**Enterprise CRM and Analytics Platforms:**

1. **Salesforce Financial Services Cloud**
   - Provides churn prediction through Einstein Analytics, using machine learning to identify at-risk customers
   - Integrates with banking workflows and relationship management tools
   - Limitations: High cost, complex implementation, requires extensive customization for African banking contexts

2. **SAS Customer Intelligence**
   - Offers advanced analytics for churn prediction using ensemble methods and neural networks
   - Widely used in large financial institutions globally
   - Limitations: Proprietary, expensive licensing, steep learning curve, limited explainability features

3. **IBM Watson Customer Experience Analytics**
   - AI-powered churn prediction with natural language processing capabilities
   - Provides customer journey analytics and predictive insights
   - Limitations: Enterprise-scale pricing, requires significant infrastructure, complex deployment

4. **Microsoft Dynamics 365 Customer Insights**
   - Cloud-based platform with built-in churn prediction models
   - Integrates with Azure Machine Learning for custom models
   - Limitations: Subscription-based pricing may be prohibitive for smaller institutions, limited local support in Rwanda

**Specialized Fintech Solutions:**

5. **Zendesk Churn Prediction**
   - Focuses on customer service data to predict churn
   - Uses ticket history, response times, and satisfaction scores
   - Limitations: Narrow focus on service interactions, less comprehensive than full behavioral analysis

6. **Amplitude Analytics**
   - Product analytics platform with churn prediction features
   - Strong in digital engagement tracking
   - Limitations: Primarily designed for digital products, less suitable for traditional banking segments

**Gap Analysis:** Most commercial solutions are designed for large, well-resourced institutions in developed markets. They often lack:
- Cost-effective pricing for African banking contexts
- Local language support and cultural adaptation
- Integration with existing legacy systems common in Rwandan banks
- Transparent explainability features required for regulatory compliance
- Focus on relationship officer workflows rather than pure analytics dashboards

#### 2.6.2 Academic Research and Studies

**Global Research on Banking Churn Prediction:**

1. **Amin et al. (2019) - "Customer Churn Prediction in Banking"**
   - Compared multiple ML algorithms (Logistic Regression, Random Forest, XGBoost) on a European bank dataset
   - Found XGBoost achieved 87% accuracy with feature importance analysis
   - **Relevance to BK Pulse:** Validates XGBoost selection; BK Pulse extends this with SHAP explainability

2. **Kumar & Ravi (2016) - "A Survey on Churn Prediction in Banking"**
   - Comprehensive review of 50+ studies on banking churn prediction
   - Identified transaction frequency, account balance, and service complaints as top predictors
   - **Relevance to BK Pulse:** Informs feature selection strategy; BK Pulse incorporates these factors

3. **Verbeke et al. (2012) - "Churn Prediction in Banking"**
   - Applied ensemble methods to Belgian bank data
   - Emphasized importance of interpretability for regulatory compliance
   - **Relevance to BK Pulse:** Justifies SHAP integration for transparency

4. **Coussement & Van den Poel (2008) - "Churn Prediction in Subscription Services"**
   - Early work on applying machine learning to customer retention
   - Demonstrated superiority of ensemble methods over single models
   - **Relevance to BK Pulse:** Supports multi-model evaluation approach

**Research on Explainable AI in Banking:**

5. **Lundberg & Lee (2017) - "A Unified Approach to Interpreting Model Predictions"**
   - Introduced SHAP (SHapley Additive Explanations) framework
   - Demonstrated applicability across multiple model types
   - **Relevance to BK Pulse:** Directly informs BK Pulse's explainability architecture

6. **Adadi & Berrada (2018) - "Peeking Inside the Black-Box: A Survey on Explainable AI"**
   - Surveyed XAI methods in financial services
   - Emphasized need for transparency in regulated industries
   - **Relevance to BK Pulse:** Validates ethical design choices around explainability

**African and Developing Market Context:**

7. **Mbiti & Weil (2011) - "Mobile Banking: The Impact of M-Pesa in Kenya"**
   - Analyzed how mobile money changed customer behavior in East Africa
   - Highlighted increased customer mobility and switching behavior
   - **Relevance to BK Pulse:** Contextualizes churn drivers in East African banking

8. **Demirgüç-Kunt et al. (2018) - "The Global Findex Database"**
   - World Bank study on financial inclusion in Africa
   - Identified digital adoption patterns affecting customer retention
   - **Relevance to BK Pulse:** Informs segmentation and feature engineering for diverse customer bases

9. **Limited Research in Rwandan Banking Context:**
   - No published academic studies specifically on churn prediction in Rwandan banks
   - Most research focuses on financial inclusion rather than retention analytics
   - **Gap Addressed by BK Pulse:** First documented attempt to apply ML-based churn prediction specifically for Rwandan banking context

#### 2.6.3 Industry Implementations and Case Studies

**International Banking Case Studies:**

1. **Wells Fargo - Customer Analytics Platform**
   - Implemented predictive churn models across retail banking segments
   - Reported 15% reduction in churn through targeted interventions
   - **Lessons for BK Pulse:** Demonstrates ROI potential; BK Pulse adapts approach for resource-constrained context

2. **Standard Chartered Bank - Digital Banking Analytics**
   - Used machine learning to predict churn in digital banking customers
   - Focused on mobile app engagement and transaction patterns
   - **Lessons for BK Pulse:** Validates digital engagement features; BK Pulse extends to include branch and relationship factors

3. **DBS Bank (Singapore) - AI-Powered Customer Insights**
   - Integrated explainable AI for customer risk assessment
   - Emphasized transparency and regulatory compliance
   - **Lessons for BK Pulse:** Reinforces importance of explainability; BK Pulse implements SHAP for similar transparency

**African Banking Context:**

4. **Absa Bank (South Africa) - Customer Analytics**
   - Implemented churn prediction for retail banking
   - Used proprietary analytics platform
   - **Limitations:** Limited public documentation; high implementation cost

5. **Equity Bank (Kenya) - Digital Customer Engagement**
   - Focused on mobile banking retention
   - Less emphasis on predictive analytics, more on engagement strategies
   - **Gap:** BK Pulse provides more structured predictive approach

**No Documented Implementations in Rwanda:**
- Bank of Kigali and other Rwandan banks have not publicly documented ML-based churn prediction systems
- Most retention efforts rely on manual analysis and reactive interventions
- **BK Pulse Contribution:** First documented attempt to build an integrated, explainable churn prediction system for Rwandan banking

#### 2.6.4 Comparison: BK Pulse vs. Existing Systems

| Aspect | Commercial Systems | Academic Research | BK Pulse |
|--------|-------------------|-------------------|----------|
| **Cost** | High (enterprise pricing) | N/A (research) | Low (open-source stack) |
| **Explainability** | Limited or proprietary | Theoretical focus | SHAP-based, transparent |
| **Local Context** | Generic, Western-focused | Limited African context | Designed for Rwandan banking |
| **Deployment** | Complex, requires consultants | Proof-of-concept | Production-ready, documented |
| **Integration** | Requires extensive customization | Not production-ready | Designed for BK workflows |
| **Accessibility** | Enterprise-only | Academic/research | Accessible to mid-size banks |
| **Relationship Officer Focus** | Analytics dashboards | Not addressed | Built for officer workflows |

#### 2.6.5 Key Insights and Research Gaps

**Identified Gaps:**

1. **African Banking Context:** Limited research and implementations specifically for African banking environments, particularly Rwanda
2. **Cost-Effective Solutions:** Most commercial systems are prohibitively expensive for mid-size African banks
3. **Explainability Integration:** Few systems combine strong predictive performance with transparent explainability
4. **Relationship Officer Workflows:** Most systems focus on analytics dashboards rather than actionable officer workflows
5. **Regulatory Compliance:** Limited attention to explainability requirements in African banking regulations

**How BK Pulse Addresses These Gaps:**

- **Context-Appropriate:** Designed specifically for Bank of Kigali's operational context and customer segments
- **Cost-Effective:** Built on open-source technologies (React, Node.js, PostgreSQL, Python) with minimal licensing costs
- **Explainable:** Integrates SHAP for transparent, interpretable predictions
- **Actionable:** Provides recommendation engine and campaign management for relationship officers
- **Ethical:** Incorporates fairness checks, bias monitoring, and privacy considerations
- **Documented:** Comprehensive documentation for replication and adaptation by other institutions

### 2.7 Summary

The reviewed literature emphasizes three key insights: (1) customer churn is a critical issue for banks globally and in Rwanda, (2) machine learning provides powerful tools for predicting churn and analyzing behavior patterns, and (3) explainable AI enhances transparency and trust in automated decision-making. These insights underpin the design of BK Pulse.

---

## CHAPTER 3: METHODOLOGY

### 3.1 Introduction

This chapter outlines the methodological approach used in developing BK Pulse. It describes the research design, dataset preparation, modeling techniques, evaluation metrics, interpretability integration, and system structure. The methodology follows a data science lifecycle aligned with ethical, academic, and industry best practices.

### 3.2 Research Design

The project employs an applied machine-learning research design focused on predictive modeling and interpretability. The design integrates quantitative analysis, supervised learning, feature engineering, and model explanation components. A synthetic dataset was selected to ensure privacy protection while maintaining realistic behavioral patterns.

### 3.3 Data Description and Preparation

A dataset of 200,000 synthetic customer records was used for model training and evaluation, simulating real-world customer behavior within BK's retail banking ecosystem. The dataset was split into 160,000 training records and 40,000 test records using stratified sampling to maintain class distribution. The production system operates on 123,000 customer records, optimized for system performance and faster batch prediction processing.

The dataset included demographic, transactional, digital engagement, and account activity features.

**Table 1: Dataset Features**

| Category | Example Fields |
|----------|----------------|
| Demographic | Age, Gender, Customer Segment, Nationality |
| Account Activity | Account Age (Months), Balance, Tenure Months, Product Ownership |
| Digital Engagement | Mobile Banking Usage, Branch Visits, Transaction Frequency |
| Behavioral Patterns | Days Since Last Transaction, Complaint History, Account Status |
| Target Variable | Churn Flag (Binary: 0 = No Churn, 1 = Churn) |

**Data Preparation Steps:**

1. **Data Cleaning:**
   - Removed spaces and commas from balance values
   - Cleaned transaction value formats
   - Handled multiple date formats (`%d/%m/%Y`, `%m/%d/%Y`, `%Y-%m-%d`, `%d-%m-%Y`)

2. **Feature Engineering:**
   - Extracted temporal features from dates (Account_Open_Month, Account_Open_Year, Last_Transaction_Month, Last_Transaction_Year)
   - Created derived behavioral indicators (e.g., Days_Since_Last_Transaction)

3. **Categorical Encoding:**
   - Applied LabelEncoder to categorical variables (Customer_Segment, Gender, Nationality, Account_Type, Branch, Currency)
   - **Data Leakage Prevention:** Excluded `Account_Status_encoded` from features as it is derived from `Days_Since_Last_Transaction`

4. **Missing Value Handling:**
   - Filled missing values in `Days_Since_Last_Transaction` with median value
   - Applied median imputation for all other missing values

5. **Feature Scaling:**
   - Standardized all features using StandardScaler (mean=0, std=1)
   - Scaling fitted on training data only, then applied to test data

6. **Class Imbalance Handling:**
   - Applied SMOTE (Synthetic Minority Oversampling Technique) to training data only
   - Generated synthetic samples for the minority class (churners)
   - Used class weights in models (`balanced` or `scale_pos_weight`)

**Final Feature Set: 22 Features**

- **Categorical Features (Encoded):** 6 features
  - Customer_Segment_encoded, Gender_encoded, Nationality_encoded, Account_Type_encoded, Branch_encoded, Currency_encoded

- **Numerical Features:** 12 features
  - Age, Balance, Tenure_Months, Num_Products, Has_Credit_Card, Transaction_Frequency, Average_Transaction_Value, Mobile_Banking_Usage, Branch_Visits, Complaint_History, Account_Age_Months, Days_Since_Last_Transaction ⭐ (Key feature)

- **Temporal Features:** 4 features
  - Account_Open_Month, Account_Open_Year, Last_Transaction_Month, Last_Transaction_Year

### 3.4 Model Development

Multiple supervised learning models were trained and evaluated to determine the best-performing classifier for churn prediction.

**Models Considered:**

1. **Logistic Regression**
   - Regularization: `C=0.01` (strong L2 regularization)
   - Class weight: `balanced`
   - Max iterations: 1000

2. **Random Forest**
   - Trees: 10 (very few to prevent overfitting)
   - Max depth: 3 (very shallow)
   - Min samples split: 500 (high threshold)
   - Min samples leaf: 250 (high threshold)
   - Max features: 30% per tree
   - Max samples: 40% per tree (bootstrap)
   - Class weight: `balanced`

3. **Gradient Boosting**
   - Estimators: 10
   - Max depth: 2 (stumps)
   - Min samples split: 500
   - Min samples leaf: 250
   - Learning rate: 0.01 (very slow)
   - Subsample: 40%
   - Max features: 30%

4. **XGBoost** ⭐ (Production Model)
   - Estimators: 30
   - Max depth: 2
   - Min child weight: 20
   - Learning rate: 0.03
   - Subsample: 60%
   - Column sample: 60%
   - L1 regularization: 1.0
   - L2 regularization: 3.0
   - Scale pos weight: calculated from class imbalance

5. **LightGBM**
   - Estimators: 30
   - Max depth: 2
   - Min child samples: 100
   - Learning rate: 0.03
   - Subsample: 60%
   - Column sample: 60%
   - L1 regularization: 1.0
   - L2 regularization: 3.0
   - Class weight: `balanced`

**Model Selection Rationale:**

XGBoost was selected as the production model based on:
- Highest test accuracy (99.64%)
- Perfect recall (100%) – identifies all churners
- High precision (92.99%) – minimizes false positives
- Best F1-Score (96.37%)
- Minimal overfitting (0.20% gap)
- Excellent AUC-ROC (99.99%)

### 3.5 Model Evaluation Metrics

Models were compared using standard classification metrics.

**Table 2: Model Performance Comparison**

| Model | Test Accuracy | Test Precision | Test Recall | Test F1-Score | Test AUC-ROC |
|-------|---------------|----------------|-------------|---------------|--------------|
| Logistic Regression | 0.8725 | 0.2707 | 0.9751 | 0.4238 | 0.9538 |
| Random Forest | 0.9858 | 0.7728 | 0.9990 | 0.8715 | 0.9999 |
| Gradient Boosting | 0.9243 | 0.3885 | 1.0000 | 0.5596 | 0.99997 |
| **XGBoost** ⭐ | **0.9964** | **0.9299** | **1.0000** | **0.9637** | **0.9999** |
| LightGBM | 0.9842 | 0.7522 | 1.0000 | 0.8585 | 0.99998 |

*Note: XGBoost selected as production model. All models were evaluated on a test set of 40,000 records with class imbalance (38,076 non-churn vs 1,924 churn). Metrics from latest model training (November 19, 2025, 07:39:01).*

### 3.6 Explainability Using SHAP

SHAP (SHapley Additive Explanations) was incorporated to interpret how individual features contributed to the churn predictions. The implementation uses TreeExplainer, which is optimized for tree-based models like XGBoost.

**SHAP Implementation:**

1. **Global Explanations:**
   - Feature importance rankings showing which factors most influence churn predictions across all customers
   - Summary plots visualizing the distribution of SHAP values for each feature

2. **Local Explanations:**
   - Customer-specific SHAP values showing how each feature contributes to an individual customer's churn probability
   - Force plots illustrating the push and pull of each feature toward or away from churn

3. **Integration with Recommendations:**
   - SHAP values are used to identify top risk factors for each customer
   - The recommendation engine uses SHAP values to dynamically calculate confidence scores and impact estimates
   - Recommendations are tailored based on which features have the highest SHAP impact

### 3.7 System Structure

BK Pulse combines predictive modeling, interpretability, and customer-specific insight generation in a full-stack web application.

**System Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  Customers   │  │  Campaigns   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │   Routes     │  │  ML Predictor│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼────────┐  ┌──────▼──────┐  ┌───────▼───────┐
│   PostgreSQL    │  │ Python ML   │  │ Recommendation│
│    Database     │  │   Model     │  │    Engine     │
└─────────────────┘  └─────────────┘  └───────────────┘
```

**Key Components:**

1. **Frontend (React 18):**
   - Role-based dashboards (Retention Officers, Analysts, Managers, Administrators)
   - Customer management interface
   - Prediction insights with SHAP visualizations
   - ML-driven recommendation system
   - Campaign management and performance tracking

2. **Backend (Node.js/Express.js):**
   - RESTful API endpoints
   - Authentication and authorization
   - ML prediction integration
   - Recommendation engine

3. **ML Prediction Pipeline:**
   - Python script (`ml/predict.py`) interfaces with trained XGBoost model
   - SHAP value calculation using TreeExplainer
   - Batch and individual prediction support

4. **Database (PostgreSQL):**
   - Customer data storage
   - User management
   - Campaign and task tracking
   - Performance metrics

5. **Recommendation Engine:**
   - ML-driven recommendations with dynamic confidence scores (50-95% range)
   - Impact estimates based on churn score and SHAP values
   - Cost calculations for financial actions
   - Personalized retention strategies

### 3.8 Ethical Considerations

The use of synthetic data ensures privacy and eliminates risks of exposure of personal information. Ethical guidelines were followed regarding fairness, transparency, and non-discriminatory model behavior. The system includes business rules to prevent inappropriate predictions (e.g., Savings and Fixed Deposit accounts cannot churn per BNR regulations).

---

## CHAPTER 4: RESULTS AND FINDINGS

### 4.1 Introduction

This chapter presents the outcomes of model training, evaluation, and interpretability analysis using a training dataset of 160,000 records and a test dataset of 40,000 records.

### 4.2 Model Performance

XGBoost achieved the strongest performance across all tested models, with perfect recall, high precision, and minimal overfitting.

**Table 3: Final Performance Metrics**

| Model | Test Accuracy | Test Precision | Test Recall | Test F1-Score | Test AUC-ROC | Overfitting Gap |
|-------|---------------|----------------|-------------|---------------|--------------|-----------------|
| Logistic Regression | 0.8725 | 0.2707 | 0.9751 | 0.4238 | 0.9538 | 5.17% |
| Random Forest | 0.9858 | 0.7728 | 0.9990 | 0.8715 | 0.9999 | 0.67% |
| Gradient Boosting | 0.9243 | 0.3885 | 1.0000 | 0.5596 | 0.99997 | 3.69% |
| **XGBoost** ⭐ | **0.9964** | **0.9299** | **1.0000** | **0.9637** | **0.9999** | **0.20%** |
| LightGBM | 0.9842 | 0.7522 | 1.0000 | 0.8585 | 0.99998 | 0.75% |

**Key Notes:**

- Perfect recall (100%) achieved by XGBoost, LightGBM, and Gradient Boosting ensures all churners are detected
- Best precision (92.99%) achieved by XGBoost reduces false positives
- Minimal overfitting: XGBoost gap = 0.20%
- Dataset imbalance (95% non-churn, 5% churn) influenced precision for baseline models

### 4.3 Feature Importance Analysis

SHAP analysis revealed key behavioral and transactional indicators driving churn. The top churn drivers include:

1. **Days_Since_Last_Transaction** – Most critical feature indicating account dormancy
2. **Transaction_Frequency** – Declining transaction activity
3. **Mobile_Banking_Usage** – Reduced digital engagement
4. **Balance** – Low or unstable account balances
5. **Account_Age_Months** – Account maturity factors
6. **Complaint_History** – Service dissatisfaction indicators

These insights provide actionable understanding of behavioral signals preceding customer disengagement.

### 4.4 Interpretation of Customer Behavior Patterns

The top churn drivers identified through SHAP analysis include:

- Declining transaction activity,
- Reduced digital engagement,
- Increasing dormant periods,
- Low or unstable account balances,
- Service complaints history.

These insights provide actionable understanding of behavioral signals preceding customer disengagement.

### 4.5 Confusion Matrices

Confusion matrices provide detailed insight into how each model classified churn and non-churn customers.

**Table 5: Confusion Matrices for All Models**

| Model | True Negatives | False Positives | False Negatives | True Positives |
|-------|----------------|-----------------|-----------------|----------------|
| Logistic Regression | 33,022 | 5,054 | 48 | 1,876 |
| Random Forest | 37,511 | 565 | 2 | 1,922 |
| Gradient Boosting | 35,048 | 3,028 | 0 | 1,924 |
| **XGBoost** ⭐ | **37,931** | **145** | **0** | **1,924** |
| LightGBM | 37,442 | 634 | 0 | 1,924 |

**Analysis:**

- **XGBoost** achieves perfect recall (0 false negatives) while maintaining high precision (only 145 false positives)
- **Random Forest** shows strong performance with only 2 false negatives
- **Logistic Regression** and **Gradient Boosting** have higher false positive rates due to class imbalance

### 4.6 Cross-Validation Results

Cross-validation was conducted to ensure robustness of model performance using 5-fold stratified cross-validation with ROC-AUC scoring.

**Table 6: Cross-Validation Scores**

| Model | CV Mean (ROC-AUC) | CV Std |
|-------|-------------------|--------|
| Logistic Regression | 95.58% | 0.12% |
| Random Forest | 99.99% | 0.01% |
| Gradient Boosting | 99.90% | 0.07% |
| **XGBoost** ⭐ | **99.99%** | **~0.00%** |
| LightGBM | 99.99% | ~0.00% |

**Analysis:**

- All models show consistent performance across folds
- XGBoost and LightGBM demonstrate the most stable performance (minimal standard deviation)
- High CV scores indicate models generalize well to unseen data

### 4.7 ROC and Precision-Recall Curves

Model discrimination ability was evaluated using ROC and PR curves. All models achieved excellent performance:

- **XGBoost:** AUC-ROC = 99.99%, demonstrating near-perfect discrimination
- **LightGBM:** AUC-ROC = 99.998%
- **Random Forest:** AUC-ROC = 99.99%
- **Gradient Boosting:** AUC-ROC = 99.997%
- **Logistic Regression:** AUC-ROC = 95.38%

The high AUC-ROC scores indicate that all models, particularly XGBoost, can effectively distinguish between churners and non-churners.

### 4.8 Customer-Specific Retention Insights

For each at-risk customer, BK Pulse generates personalized insights based on SHAP-derived contributions and ML-driven recommendations.

**Table 4: Example Customer Insight Output**

| Customer ID | Churn Risk (%) | Top Factors | Recommended Action | Confidence |
|-------------|----------------|-------------|-------------------|------------|
| C12345 | 82% | Low activity, high dormancy | Follow-up call; reactivation offer | 85% |
| C54321 | 65% | App inactivity, irregular transactions | Digital onboarding support | 75% |
| C67890 | 45% | Moderate balance decline | Proactive check-in call | 65% |

**Recommendation Engine Features:**

- **Dynamic Confidence Scores:** Calculated based on churn score and relevant SHAP values (50-95% range)
- **Impact Estimates:** Personalized impact percentages based on customer-specific risk factors
- **Cost Calculations:** Financial estimates for fee waivers, loyalty bonuses, etc.
- **Timeline Adjustments:** Urgency-based timelines (12 hours for critical, 24-48 hours for high risk)

---

## CHAPTER 5: DISCUSSION

### 5.1 Interpretation of Results

The high model performance indicates that machine learning can effectively predict customer churn within the Rwandan banking context. Behavioral indicators such as digital usage and transactional patterns were consistently significant. The XGBoost model's perfect recall (100%) ensures that no churners are missed, while its high precision (92.99%) minimizes false positives, making it ideal for operational deployment.

The SHAP explainability integration provides transparency into model decisions, enabling retention teams to understand not just that a customer is at risk, but why. This interpretability is crucial for building trust in the system and for developing targeted retention strategies.

### 5.2 Implications for the Bank of Kigali

BK Pulse demonstrates that predictive analytics can support BK in:

- **Early detection of churn risk:** Perfect recall ensures all at-risk customers are identified
- **Data-driven decision-making:** SHAP values provide clear rationale for predictions
- **Resource prioritization:** High precision minimizes wasted effort on false positives
- **Strengthening long-term customer engagement:** Personalized recommendations based on ML insights

The ML-driven recommendation engine represents a significant advancement over traditional rule-based systems, as it dynamically adapts to each customer's specific risk profile and provides actionable, cost-effective retention strategies.

### 5.3 Alignment with Rwanda's Digital Transformation Agenda

The system aligns with national efforts to promote financial inclusion, digital banking adoption, and data-driven governance. By incorporating explainable AI, BK Pulse also supports ethical AI practices and regulatory compliance.

### 5.4 Limitations

Key limitations include:

- Use of synthetic rather than real customer data,
- Reduced scope for modeling rare churn patterns,
- Lack of integration with BK's operational systems within this academic scope,
- Production dataset (123,000) is smaller than training dataset (200,000) for performance optimization.

---

## CHAPTER 6: CONCLUSION AND RECOMMENDATIONS

### 6.1 Conclusion

BK Pulse successfully demonstrates the feasibility and value of machine learning–driven churn prediction in Rwanda's banking sector. The project shows that integrating supervised models with SHAP interpretability can strengthen early detection of churn and support targeted retention strategies. The XGBoost model's exceptional performance (99.64% accuracy, 100% recall, 92.99% precision) makes it highly suitable for operational deployment.

The system's integration of predictive modeling, explainability, and personalized recommendations provides a comprehensive solution for proactive customer retention. The ML-driven recommendation engine, with its dynamic confidence scores and impact estimates, represents a significant advancement in retention strategy personalization.

### 6.2 Recommendations

**For the Bank of Kigali:**

1. Adopt predictive analytics for proactive customer engagement.
2. Integrate BK Pulse within operational systems for continuous churn monitoring.
3. Expand synthetic data testing into controlled real-data pilots.
4. Train retention teams on interpreting model outputs and SHAP values.
5. Monitor model performance in production and retrain periodically as new data becomes available.

**For Future Work:**

1. Incorporate real-time data streams for dynamic predictions.
2. Explore deep learning techniques for potentially improved performance.
3. Strengthen fairness and bias detection mechanisms.
4. Extend insights to cross-product recommendations.
5. Integrate with BK's CRM and operational systems for seamless workflow.

---

## REFERENCES

(Insert references here using ALU citation style)

---

## APPENDICES

### Appendix A: Dataset Schema

A detailed structure of the dataset used for training and testing.

**Table A1: Dataset Schema**

| Feature Name | Data Type | Description |
|--------------|-----------|-------------|
| Customer_ID | string | Unique customer identifier |
| Customer_Segment | category | Retail, Corporate, Premium, etc. |
| Gender | category | Male, Female |
| Age | int | Customer age |
| Nationality | category | Rwandan, Foreign, etc. |
| Account_Type | category | Current, Savings, Fixed Deposit |
| Branch | category | Branch location |
| Currency | category | RWF, USD, EUR |
| Balance | float | Account balance (cleaned) |
| Tenure_Months | int | Number of months as customer |
| Num_Products | int | Number of banking products |
| Has_Credit_Card | binary | 0/1 indicator |
| Transaction_Frequency | int | Number of transactions per period |
| Average_Transaction_Value | float | Average transaction value |
| Mobile_Banking_Usage | int | Count of mobile banking usage |
| Branch_Visits | int | Number of branch visits |
| Complaint_History | int | Number of complaints filed |
| Account_Age_Months | int | Age of account in months |
| Days_Since_Last_Transaction | int | Days since last transaction ⭐ |
| Account_Open_Month | int | Month extracted from Account_Open_Date (1-12) |
| Account_Open_Year | int | Year extracted from Account_Open_Date |
| Last_Transaction_Month | int | Month extracted from Last_Transaction_Date (1-12) |
| Last_Transaction_Year | int | Year extracted from Last_Transaction_Date |
| Churn_Flag | binary | Target variable (0 = No Churn, 1 = Churn) |

**Total: 22 features used for modeling** (Account_Status excluded to prevent data leakage)

### Appendix B: Model Hyperparameters

Final tuned hyperparameters for each model.

**Table B1: Hyperparameter Summary**

| Model | Key Hyperparameters |
|-------|---------------------|
| Logistic Regression | solver='lbfgs', C=0.01, class_weight='balanced', max_iter=1000 |
| Random Forest | n_estimators=10, max_depth=3, min_samples_split=500, min_samples_leaf=250, max_features=0.3, max_samples=0.4, class_weight='balanced' |
| Gradient Boosting | learning_rate=0.01, n_estimators=10, max_depth=2, min_samples_split=500, min_samples_leaf=250, subsample=0.4, max_features=0.3 |
| **XGBoost** ⭐ | learning_rate=0.03, n_estimators=30, max_depth=2, min_child_weight=20, subsample=0.6, colsample_bytree=0.6, reg_alpha=1.0, reg_lambda=3.0, scale_pos_weight=calculated |
| LightGBM | learning_rate=0.03, n_estimators=30, max_depth=2, min_child_samples=100, subsample=0.6, colsample_bytree=0.6, reg_alpha=1.0, reg_lambda=3.0, class_weight='balanced' |

**Note:** All models use strong regularization to prevent overfitting. Random state is set to 42 for reproducibility.

### Appendix C: Detailed SHAP Interpretations

Contains global and local SHAP visualizations.

**SHAP Implementation Details:**

1. **Global SHAP Summary Plot:**
   - Shows feature importance across all customers
   - Displays distribution of SHAP values for each feature
   - Highlights which features push predictions toward churn (positive SHAP) vs. away from churn (negative SHAP)

2. **SHAP Dependence Plots:**
   - Illustrates how individual features interact with churn probability
   - Shows non-linear relationships between features and predictions

3. **SHAP Force Plot (Local Explanation):**
   - Customer-specific visualization showing how each feature contributes to that customer's churn probability
   - Displays the "push" and "pull" of each feature value
   - Enables retention teams to understand exactly why a specific customer is at risk

**Integration with Recommendation Engine:**

- Top 5 risk factors (by SHAP impact) are used to select relevant recommendations
- Confidence scores are boosted when recommendations address high-impact SHAP features
- Impact estimates are adjusted based on the magnitude of relevant SHAP values

### Appendix D: System Architecture Diagrams

**Full BK Pulse System Architecture:**

The system follows a three-tier architecture:

1. **Presentation Layer (React Frontend):**
   - Role-based dashboards
   - Customer management interface
   - Prediction insights and SHAP visualizations
   - Recommendation management
   - Campaign tracking

2. **Application Layer (Node.js Backend):**
   - RESTful API endpoints
   - Authentication and authorization middleware
   - Business logic and data validation
   - ML prediction orchestration
   - Recommendation engine

3. **Data Layer:**
   - PostgreSQL database for structured data
   - Python ML models (XGBoost) for predictions
   - SHAP explainability calculations

**End-to-End Prediction Pipeline:**

1. Customer data retrieved from PostgreSQL
2. Data transformed to model format (using `transformCustomerForPrediction`)
3. Features preprocessed (encoding, scaling) using saved encoders and scaler
4. XGBoost model generates churn probability
5. SHAP TreeExplainer calculates feature contributions
6. Recommendation engine generates personalized actions
7. Results returned to frontend via REST API
8. Dashboard displays predictions, SHAP values, and recommendations

### Appendix E: Additional Tables and Charts

**Table E1: Distribution of Churn vs Non-Churn**

| Class | Training Set | Test Set | Percentage |
|-------|--------------|----------|------------|
| Non-Churn (0) | 152,000 | 38,076 | 95.19% |
| Churn (1) | 8,000 | 1,924 | 4.81% |
| **Total** | **160,000** | **40,000** | **100%** |

**Class Imbalance Handling:**

- SMOTE applied to training data to balance classes
- Class weights used in models to handle imbalance
- Test set maintains original distribution for realistic evaluation

**Feature Distribution:**

- Numerical features show normal distributions with some right-skew for financial metrics
- Categorical features follow expected distributions based on BK's customer base
- Temporal features capture seasonal patterns in account opening and transaction activity

**Correlation Analysis:**

- `Days_Since_Last_Transaction` shows strong negative correlation with transaction frequency
- `Balance` and `Account_Age_Months` show moderate positive correlation
- `Mobile_Banking_Usage` and `Transaction_Frequency` are positively correlated
- No high multicollinearity detected that would require feature removal

---

**Document End**
