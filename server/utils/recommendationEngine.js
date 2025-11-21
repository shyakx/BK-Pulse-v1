/**
 * Recommendation Engine
 * Generates personalized retention recommendations based on ML predictions and SHAP values
 * All confidence scores, impacts, and costs are dynamically calculated from ML data
 */

/**
 * Calculate dynamic confidence score based on ML prediction and risk factors
 * @param {Number} baseConfidence - Base confidence for this action type
 * @param {Number} churnScore - ML churn score
 * @param {Array} relevantShapValues - SHAP values relevant to this recommendation
 * @returns {Number} Calculated confidence score (0-100)
 */
function calculateConfidence(baseConfidence, churnScore, relevantShapValues = []) {
  // Start with base confidence
  let confidence = baseConfidence;
  
  // Boost confidence if churn score is very high (action is more critical)
  if (churnScore > 80) {
    confidence += 10;
  } else if (churnScore > 70) {
    confidence += 5;
  }
  
  // Boost confidence if relevant SHAP values show high impact
  if (relevantShapValues.length > 0) {
    const avgImpact = relevantShapValues.reduce((sum, sv) => sum + (sv.impact || 0), 0) / relevantShapValues.length;
    confidence += Math.min(15, avgImpact * 0.3); // Max 15% boost from SHAP
  }
  
  return Math.min(95, Math.max(50, Math.round(confidence))); // Clamp between 50-95%
}

/**
 * Calculate dynamic impact percentage based on churn score and risk factors
 * @param {Number} baseMin - Base minimum impact %
 * @param {Number} baseMax - Base maximum impact %
 * @param {Number} churnScore - ML churn score
 * @param {Array} relevantShapValues - Relevant SHAP values
 * @returns {String} Impact range string
 */
function calculateImpact(baseMin, baseMax, churnScore, relevantShapValues = []) {
  // Higher churn score = higher potential impact
  const churnMultiplier = churnScore / 100;
  
  // Adjust based on SHAP values (if action addresses key risk factors)
  let shapBoost = 0;
  if (relevantShapValues.length > 0) {
    const avgImpact = relevantShapValues.reduce((sum, sv) => sum + (sv.impact || 0), 0) / relevantShapValues.length;
    shapBoost = avgImpact * 0.2; // Up to 20% boost
  }
  
  const minImpact = Math.round(baseMin + (churnScore - 50) * 0.2 + shapBoost);
  const maxImpact = Math.round(baseMax + (churnScore - 50) * 0.3 + shapBoost);
  
  // Determine impact level
  let level = 'Medium';
  if (maxImpact >= 25) level = 'High';
  else if (maxImpact < 12) level = 'Low-Medium';
  
  return `${level} - Can reduce churn risk by ${Math.max(5, minImpact)}-${Math.min(50, maxImpact)}%`;
}

/**
 * Calculate fee waiver cost based on customer data
 * @param {Object} customer - Customer data
 * @returns {String} Cost estimate
 */
function calculateFeeWaiverCost(customer) {
  // Base monthly fee varies by account type and balance
  let baseMonthlyFee = 5000; // RWF 5,000 base
  
  if (customer.product_type === 'Current') {
    baseMonthlyFee = customer.account_balance > 10000000 ? 10000 : 5000;
  } else if (customer.product_type === 'Savings') {
    baseMonthlyFee = 3000;
  }
  
  // 3-month waiver
  const totalCost = baseMonthlyFee * 3;
  const maxCost = totalCost * 1.5; // Add 50% buffer for variations
  
  return `RWF ${totalCost.toLocaleString()} - ${Math.round(maxCost).toLocaleString()} (3 months fees)`;
}

/**
 * Calculate loyalty program welcome bonus based on customer value
 * @param {Object} customer - Customer data
 * @returns {String} Cost estimate
 */
function calculateLoyaltyBonus(customer) {
  const balance = parseFloat(customer.account_balance || 0);
  
  // Higher balance = higher welcome bonus
  let minBonus = 5000;
  let maxBonus = 15000;
  
  if (balance > 10000000) { // > 10M
    minBonus = 10000;
    maxBonus = 25000;
  } else if (balance > 5000000) { // > 5M
    minBonus = 7500;
    maxBonus = 20000;
  }
  
  return `Welcome bonus: RWF ${minBonus.toLocaleString()} - ${maxBonus.toLocaleString()}`;
}

/**
 * Calculate timeline based on urgency (churn score)
 * @param {Number} churnScore - ML churn score
 * @param {String} baseTimeline - Base timeline
 * @returns {String} Adjusted timeline
 */
function calculateTimeline(churnScore, baseTimeline) {
  if (churnScore > 85) {
    return 'Within 12 hours'; // Critical
  } else if (churnScore > 75) {
    return 'Within 24 hours'; // Urgent
  } else if (churnScore > 60) {
    return 'Within 48 hours'; // High priority
  }
  return baseTimeline; // Use base timeline for lower scores
}

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
    .slice(0, 5);
  
  const riskFactorNames = riskFactors.map(item => item.feature.toLowerCase());
  
  // Get SHAP values for specific features
  const getShapForFeature = (featureName) => {
    return shapValues.filter(sv => 
      sv.feature.toLowerCase().includes(featureName.toLowerCase())
    );
  };
  
  // High Priority Recommendations (churn score > 70)
  if (churnScore > 70 || riskLevel === 'high') {
    // Schedule Personal Call - Dynamic confidence based on churn score
    const callShapValues = getShapForFeature('transaction') || getShapForFeature('activity');
    const callConfidence = calculateConfidence(75, churnScore, callShapValues);
    
    recommendations.push({
      action: 'Schedule Personal Call',
      description: 'Contact customer within 24 hours to understand concerns and address issues',
      priority: 'high',
      confidence: callConfidence,
      reason: `High churn risk (${churnScore.toFixed(1)}%) - immediate intervention needed`,
      category: 'engagement',
      timeline: calculateTimeline(churnScore, 'Within 24 hours'),
      expectedOutcome: 'Identify root cause and create retention plan',
      implementationSteps: [
        'Review customer history and previous interactions',
        'Prepare talking points based on risk factors',
        'Schedule call and document conversation',
        'Follow up within 48 hours'
      ],
      estimatedImpact: calculateImpact(20, 30, churnScore, callShapValues)
    });

    // Offer Fee Waiver - Dynamic confidence and cost
    const financialShapValues = getShapForFeature('balance') || getShapForFeature('transaction');
    const feeConfidence = calculateConfidence(75, churnScore, financialShapValues);
    
    recommendations.push({
      action: 'Offer Fee Waiver',
      description: 'Provide 3-month fee waiver as financial incentive to retain customer',
      priority: 'high',
      confidence: feeConfidence,
      reason: 'Financial incentive to reduce immediate churn risk',
      category: 'financial',
      timeline: calculateTimeline(churnScore, 'Within 48 hours'),
      expectedOutcome: 'Immediate cost savings for customer, improved satisfaction',
      implementationSteps: [
        'Verify customer eligibility for fee waiver',
        'Prepare fee waiver offer document',
        'Send offer via email and SMS',
        'Track acceptance and apply waiver'
      ],
      estimatedImpact: calculateImpact(15, 25, churnScore, financialShapValues),
      estimatedCost: calculateFeeWaiverCost(customer)
    });

    // Reactivation Campaign - Only if transaction-related risk factors
    if (riskFactorNames.some(f => f.includes('transaction') || f.includes('activity') || f.includes('days'))) {
      const daysInactive = customer.days_since_last_transaction || 0;
      const reactivationShapValues = getShapForFeature('transaction') || getShapForFeature('days');
      const reactivationConfidence = calculateConfidence(70, churnScore, reactivationShapValues);
      
      recommendations.push({
        action: 'Send Reactivation Campaign',
        description: `Customer inactive for ${daysInactive} days - send personalized email with exclusive offers`,
        priority: 'high',
        confidence: reactivationConfidence,
        reason: 'Low transaction activity detected - reactivation campaign needed',
        category: 'engagement',
        timeline: calculateTimeline(churnScore, 'Within 24 hours'),
        expectedOutcome: 'Re-engage customer and restore transaction activity',
        implementationSteps: [
          'Prepare personalized email with customer-specific offers',
          'Include transaction history and account benefits',
          'Add exclusive limited-time offers',
          'Schedule follow-up if no response in 3 days'
        ],
        estimatedImpact: calculateImpact(10, 20, churnScore, reactivationShapValues)
      });
    }

    // Senior Relationship Manager - Only if complaint-related
    if (riskFactorNames.some(f => f.includes('complaint')) || customer.complaint_history > 0) {
      const complaintShapValues = getShapForFeature('complaint');
      const managerConfidence = calculateConfidence(80, churnScore, complaintShapValues);
      
      recommendations.push({
        action: 'Assign Senior Relationship Manager',
        description: 'Provide dedicated senior support to address service concerns',
        priority: 'high',
        confidence: managerConfidence,
        reason: `Previous complaints (${customer.complaint_history || 0}) indicate service dissatisfaction`,
        category: 'service',
        timeline: calculateTimeline(churnScore, 'Within 48 hours'),
        expectedOutcome: 'Improved service experience and customer satisfaction',
        implementationSteps: [
          'Review complaint history and resolution status',
          'Assign senior relationship manager',
          'Schedule introductory call',
          'Create personalized service plan'
        ],
        estimatedImpact: calculateImpact(25, 35, churnScore, complaintShapValues)
      });
    }

    // Premium Account Upgrade - Only for high-value customers
    const balance = parseFloat(customer.account_balance || 0);
    if (balance > 1000000) { // > 1M RWF
      const premiumShapValues = getShapForFeature('balance') || getShapForFeature('segment');
      const premiumConfidence = calculateConfidence(75, churnScore, premiumShapValues);
      
      recommendations.push({
        action: 'Premium Account Upgrade',
        description: 'Recommend premium account with exclusive benefits and personalized service',
        priority: 'high',
        confidence: premiumConfidence,
        reason: `High-value customer (Balance: RWF ${(balance / 1000000).toFixed(1)}M) - premium offering to enhance retention`,
        category: 'product',
        timeline: 'Within 1 week',
        expectedOutcome: 'Enhanced value proposition and increased customer loyalty',
        implementationSteps: [
          'Review premium account benefits and eligibility',
          'Prepare personalized upgrade proposal',
          'Schedule meeting or call to present benefits',
          'Process upgrade if accepted'
        ],
        estimatedImpact: calculateImpact(20, 30, churnScore, premiumShapValues),
        estimatedCost: 'No additional cost - upgrade existing account'
      });
    }
  }

  // Medium Priority Recommendations (churn score 40-70)
  if (churnScore >= 40 && churnScore <= 70) {
    const proactiveShapValues = getShapForFeature('activity') || getShapForFeature('transaction');
    const proactiveConfidence = calculateConfidence(65, churnScore, proactiveShapValues);
    
    recommendations.push({
      action: 'Proactive Check-in Call',
      description: 'Schedule proactive call this week to assess satisfaction and identify needs',
      priority: 'medium',
      confidence: proactiveConfidence,
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
      estimatedImpact: calculateImpact(10, 15, churnScore, proactiveShapValues)
    });

    if (riskFactorNames.some(f => f.includes('status') || f.includes('account')) || customer.account_status !== 'Active') {
      const statusShapValues = getShapForFeature('status') || getShapForFeature('account');
      const statusConfidence = calculateConfidence(65, churnScore, statusShapValues);
      
      recommendations.push({
        action: 'Account Review & Activation',
        description: 'Review account status and offer activation benefits or account review',
        priority: 'medium',
        confidence: statusConfidence,
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
        estimatedImpact: calculateImpact(10, 20, churnScore, statusShapValues)
      });
    }

    if (!customer.has_credit_card && customer.segment !== 'retail') {
      const crossSellShapValues = getShapForFeature('product') || getShapForFeature('engagement');
      const crossSellConfidence = calculateConfidence(60, churnScore, crossSellShapValues);
      
      recommendations.push({
        action: 'Credit Card Cross-Sell',
        description: 'Recommend credit card with welcome bonus to increase engagement',
        priority: 'medium',
        confidence: crossSellConfidence,
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
        estimatedImpact: calculateImpact(8, 15, churnScore, crossSellShapValues),
        estimatedCost: 'Welcome bonus: RWF 10,000 - 25,000'
      });
    }

    if (riskFactorNames.some(f => f.includes('mobile') || f.includes('digital') || f.includes('branch'))) {
      const digitalShapValues = getShapForFeature('mobile') || getShapForFeature('branch');
      const digitalConfidence = calculateConfidence(65, churnScore, digitalShapValues);
      
      recommendations.push({
        action: 'Digital Banking Training',
        description: 'Provide digital banking training and onboarding to improve satisfaction',
        priority: 'medium',
        confidence: digitalConfidence,
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
        estimatedImpact: calculateImpact(8, 12, churnScore, digitalShapValues)
      });
    }
  }

  // Low Priority / Preventive Recommendations (churn score < 40)
  if (churnScore < 40 && riskLevel === 'low') {
    const surveyConfidence = calculateConfidence(60, churnScore, []);
    
    recommendations.push({
      action: 'Satisfaction Survey',
      description: 'Send quarterly satisfaction survey to maintain engagement and gather feedback',
      priority: 'low',
      confidence: surveyConfidence,
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
      const advisoryConfidence = calculateConfidence(55, churnScore, []);
      
      recommendations.push({
        action: 'Financial Advisory Consultation',
        description: 'Invite customer to financial advisory consultation as value-added service',
        priority: 'low',
        confidence: advisoryConfidence,
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

    const educationConfidence = calculateConfidence(50, churnScore, []);
    
    recommendations.push({
      action: 'Educational Content Sharing',
      description: 'Share educational content about financial planning and banking services',
      priority: 'low',
      confidence: educationConfidence,
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
    const loyaltyShapValues = getShapForFeature('segment') || getShapForFeature('engagement');
    const loyaltyConfidence = calculateConfidence(70, churnScore, loyaltyShapValues);
    
    recommendations.push({
      action: 'Loyalty Rewards Program',
      description: 'Offer loyalty rewards program membership with points and exclusive benefits',
      priority: 'high',
      confidence: loyaltyConfidence,
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
      estimatedImpact: calculateImpact(12, 20, churnScore, loyaltyShapValues),
      estimatedCost: calculateLoyaltyBonus(customer)
    });
  }

  if (customer.segment === 'corporate' || customer.segment === 'institutional_banking') {
    if (churnScore > 60) {
      const executiveShapValues = getShapForFeature('segment') || getShapForFeature('balance');
      const executiveConfidence = calculateConfidence(80, churnScore, executiveShapValues);
      
      recommendations.push({
        action: 'Executive Relationship Meeting',
        description: 'Schedule executive-level meeting to discuss relationship and address concerns',
        priority: 'high',
        confidence: executiveConfidence,
        reason: `High-value ${customer.segment} customer requires executive engagement`,
        category: 'engagement',
        timeline: calculateTimeline(churnScore, 'Within 1 week'),
        expectedOutcome: 'High-level relationship strengthening and issue resolution',
        implementationSteps: [
          'Review account history and relationship status',
          'Prepare executive briefing document',
          'Schedule meeting with senior executive',
          'Document outcomes and action items'
        ],
        estimatedImpact: calculateImpact(25, 40, churnScore, executiveShapValues)
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
