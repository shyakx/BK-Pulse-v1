/**
 * Recommendation Engine
 * Generates personalized retention recommendations based on ML predictions and SHAP values
 */

/**
 * Generate recommendations based on churn prediction and SHAP values
 * @param {Object} customer - Customer data
 * @param {Object} prediction - ML prediction results
 * @param {Array} shapValues - SHAP values from model
 * @returns {Array} Array of recommendation objects
 */
function generateRecommendations(customer, prediction, shapValues = []) {
  const recommendations = [];
  const churnScore = prediction.churn_score || 0;
  const riskLevel = prediction.risk_level || 'low';
  
  // Extract top risk factors from SHAP values
  const riskFactors = shapValues
    .filter(item => item.direction === 'increases')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(item => item.feature.toLowerCase());

  // High Priority Recommendations (churn score > 70)
  if (churnScore > 70 || riskLevel === 'high') {
    recommendations.push({
      action: 'Schedule Personal Call',
      description: 'Contact customer within 24 hours to understand concerns and address issues',
      priority: 'high',
      confidence: Math.min(95, 70 + Math.floor(churnScore / 2)),
      reason: `High churn risk (${churnScore.toFixed(1)}%) - immediate intervention needed`,
      category: 'engagement',
      timeline: 'Within 24 hours',
      expectedOutcome: 'Identify root cause and create retention plan',
      implementationSteps: [
        'Review customer history and previous interactions',
        'Prepare talking points based on risk factors',
        'Schedule call and document conversation',
        'Follow up within 48 hours'
      ],
      estimatedImpact: 'High - Can reduce churn risk by 20-30%'
    });

    recommendations.push({
      action: 'Offer Fee Waiver',
      description: 'Provide 3-month fee waiver as financial incentive to retain customer',
      priority: 'high',
      confidence: 85,
      reason: 'Financial incentive to reduce immediate churn risk',
      category: 'financial',
      timeline: 'Within 48 hours',
      expectedOutcome: 'Immediate cost savings for customer, improved satisfaction',
      implementationSteps: [
        'Verify customer eligibility for fee waiver',
        'Prepare fee waiver offer document',
        'Send offer via email and SMS',
        'Track acceptance and apply waiver'
      ],
      estimatedImpact: 'High - Can reduce churn risk by 15-25%',
      estimatedCost: 'RWF 15,000 - 45,000 (3 months fees)'
    });

    if (riskFactors.includes('days since last transaction') || riskFactors.includes('transaction frequency')) {
      const daysInactive = customer.days_since_last_transaction || 0;
      recommendations.push({
        action: 'Send Reactivation Campaign',
        description: `Customer inactive for ${daysInactive} days - send personalized email with exclusive offers`,
        priority: 'high',
        confidence: 80,
        reason: 'Low transaction activity detected - reactivation campaign needed',
        category: 'engagement',
        timeline: 'Within 24 hours',
        expectedOutcome: 'Re-engage customer and restore transaction activity',
        implementationSteps: [
          'Prepare personalized email with customer-specific offers',
          'Include transaction history and account benefits',
          'Add exclusive limited-time offers',
          'Schedule follow-up if no response in 3 days'
        ],
        estimatedImpact: 'Medium-High - Can reduce churn risk by 10-20%'
      });
    }

    if (riskFactors.includes('complaint history') || customer.complaints > 0) {
      recommendations.push({
        action: 'Assign Senior Relationship Manager',
        description: 'Provide dedicated senior support to address service concerns',
        priority: 'high',
        confidence: 88,
        reason: `Previous complaints (${customer.complaints || 0}) indicate service dissatisfaction`,
        category: 'service',
        timeline: 'Within 48 hours',
        expectedOutcome: 'Improved service experience and customer satisfaction',
        implementationSteps: [
          'Review complaint history and resolution status',
          'Assign senior relationship manager',
          'Schedule introductory call',
          'Create personalized service plan'
        ],
        estimatedImpact: 'High - Can reduce churn risk by 25-35%'
      });
    }

    if (customer.account_balance && customer.account_balance > 1000000) {
      recommendations.push({
        action: 'Premium Account Upgrade',
        description: 'Recommend premium account with exclusive benefits and personalized service',
        priority: 'high',
        confidence: 82,
        reason: `High-value customer (Balance: RWF ${(customer.account_balance / 1000000).toFixed(1)}M) - premium offering to enhance retention`,
        category: 'product',
        timeline: 'Within 1 week',
        expectedOutcome: 'Enhanced value proposition and increased customer loyalty',
        implementationSteps: [
          'Review premium account benefits and eligibility',
          'Prepare personalized upgrade proposal',
          'Schedule meeting or call to present benefits',
          'Process upgrade if accepted'
        ],
        estimatedImpact: 'High - Can reduce churn risk by 20-30%',
        estimatedCost: 'No additional cost - upgrade existing account'
      });
    }
  }

  // Medium Priority Recommendations (churn score 40-70)
  if (churnScore >= 40 && churnScore <= 70) {
    recommendations.push({
      action: 'Proactive Check-in Call',
      description: 'Schedule proactive call this week to assess satisfaction and identify needs',
      priority: 'medium',
      confidence: 75,
      reason: `Moderate churn risk (${churnScore.toFixed(1)}%) - proactive engagement recommended`,
      category: 'engagement',
      timeline: 'Within 1 week',
      expectedOutcome: 'Early identification of issues and improved relationship',
      implementationSteps: [
        'Review customer profile and recent activity',
        'Schedule call at convenient time',
        'Prepare discussion points and questions',
        'Document findings and follow-up actions'
      ],
      estimatedImpact: 'Medium - Can reduce churn risk by 10-15%'
    });

    if (riskFactors.includes('account status') || customer.account_status !== 'active') {
      recommendations.push({
        action: 'Account Review & Activation',
        description: 'Review account status and offer activation benefits or account review',
        priority: 'medium',
        confidence: 70,
        reason: `Account status (${customer.account_status || 'unknown'}) may be impacting customer satisfaction`,
        category: 'product',
        timeline: 'Within 1 week',
        expectedOutcome: 'Resolve account issues and restore full account functionality',
        implementationSteps: [
          'Review account status and restrictions',
          'Identify activation requirements',
          'Contact customer to discuss account review',
          'Process activation or provide clear next steps'
        ],
        estimatedImpact: 'Medium - Can reduce churn risk by 10-20%'
      });
    }

    if (!customer.has_credit_card && customer.segment !== 'retail') {
      recommendations.push({
        action: 'Credit Card Cross-Sell',
        description: 'Recommend credit card with welcome bonus to increase engagement',
        priority: 'medium',
        confidence: 68,
        reason: 'Cross-sell opportunity to increase engagement and product stickiness',
        category: 'product',
        timeline: 'Within 2 weeks',
        expectedOutcome: 'Increased product usage and customer engagement',
        implementationSteps: [
          'Assess credit card eligibility',
          'Prepare personalized credit card offer',
          'Present benefits and welcome bonus',
          'Process application if interested'
        ],
        estimatedImpact: 'Medium - Can reduce churn risk by 8-15%',
        estimatedCost: 'Welcome bonus: RWF 10,000 - 25,000'
      });
    }

    if (riskFactors.includes('mobile banking usage') || riskFactors.includes('branch visits')) {
      recommendations.push({
        action: 'Digital Banking Training',
        description: 'Provide digital banking training and onboarding to improve satisfaction',
        priority: 'medium',
        confidence: 72,
        reason: 'Low digital engagement - training may improve satisfaction and convenience',
        category: 'education',
        timeline: 'Within 2 weeks',
        expectedOutcome: 'Increased digital adoption and improved customer experience',
        implementationSteps: [
          'Assess current digital banking usage',
          'Schedule training session (in-person or virtual)',
          'Provide step-by-step guidance',
          'Follow up to ensure successful adoption'
        ],
        estimatedImpact: 'Medium - Can reduce churn risk by 8-12%'
      });
    }
  }

  // Low Priority / Preventive Recommendations (churn score < 40)
  if (churnScore < 40 && riskLevel === 'low') {
    recommendations.push({
      action: 'Satisfaction Survey',
      description: 'Send quarterly satisfaction survey to maintain engagement and gather feedback',
      priority: 'low',
      confidence: 65,
      reason: 'Low-risk customer - maintain engagement through feedback',
      category: 'engagement',
      timeline: 'Within 2 weeks',
      expectedOutcome: 'Gather feedback and demonstrate care for customer opinion',
      implementationSteps: [
        'Prepare satisfaction survey',
        'Send via email and SMS',
        'Monitor response rate',
        'Review feedback and address any concerns'
      ],
      estimatedImpact: 'Low-Medium - Maintains engagement and prevents future issues'
    });

    if (customer.segment === 'sme' || customer.segment === 'corporate') {
      recommendations.push({
        action: 'Financial Advisory Consultation',
        description: 'Invite customer to financial advisory consultation as value-added service',
        priority: 'low',
        confidence: 60,
        reason: 'Value-added service for business customers to strengthen relationship',
        category: 'service',
        timeline: 'Within 1 month',
        expectedOutcome: 'Enhanced relationship and potential for additional services',
        implementationSteps: [
          'Identify relevant financial advisory topics',
          'Prepare consultation invitation',
          'Schedule consultation at convenient time',
          'Conduct consultation and provide recommendations'
        ],
        estimatedImpact: 'Low-Medium - Strengthens relationship and loyalty'
      });
    }

    recommendations.push({
      action: 'Educational Content Sharing',
      description: 'Share educational content about financial planning and banking services',
      priority: 'low',
      confidence: 55,
      reason: 'Educational content strengthens relationship and provides value',
      category: 'education',
      timeline: 'Ongoing',
      expectedOutcome: 'Increased customer knowledge and engagement',
      implementationSteps: [
        'Identify relevant educational content',
        'Personalize content based on customer profile',
        'Send via email or SMS',
        'Track engagement and adjust content strategy'
      ],
      estimatedImpact: 'Low - Maintains engagement and provides value'
    });
  }

  // Segment-specific recommendations
  if (customer.segment === 'retail' && churnScore > 50) {
    recommendations.push({
      action: 'Loyalty Rewards Program',
      description: 'Offer loyalty rewards program membership with points and exclusive benefits',
      priority: 'high',
      confidence: 75,
      reason: 'Retail customers respond well to loyalty programs',
      category: 'financial',
      timeline: 'Within 1 week',
      expectedOutcome: 'Increased engagement and transaction frequency',
      implementationSteps: [
        'Review loyalty program benefits and eligibility',
        'Prepare personalized enrollment offer',
        'Send enrollment invitation',
        'Activate membership and provide welcome bonus'
      ],
      estimatedImpact: 'Medium-High - Can reduce churn risk by 12-20%',
      estimatedCost: 'Welcome bonus: RWF 5,000 - 15,000'
    });
  }

  if (customer.segment === 'corporate' || customer.segment === 'institutional_banking') {
    if (churnScore > 60) {
      recommendations.push({
        action: 'Executive Relationship Meeting',
        description: 'Schedule executive-level meeting to discuss relationship and address concerns',
        priority: 'high',
        confidence: 85,
        reason: `High-value ${customer.segment} customer requires executive engagement`,
        category: 'engagement',
        timeline: 'Within 1 week',
        expectedOutcome: 'High-level relationship strengthening and issue resolution',
        implementationSteps: [
          'Review account history and relationship status',
          'Prepare executive briefing document',
          'Schedule meeting with senior executive',
          'Document outcomes and action items'
        ],
        estimatedImpact: 'High - Can reduce churn risk by 25-40%'
      });
    }
  }

  // Sort by priority and confidence
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => {
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.confidence - a.confidence;
  });

  // Limit to top 5 recommendations
  return recommendations.slice(0, 5);
}

module.exports = {
  generateRecommendations
};

