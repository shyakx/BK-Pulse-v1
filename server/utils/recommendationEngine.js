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
      action: 'Schedule personal call within 24 hours',
      priority: 'high',
      confidence: Math.min(95, 70 + Math.floor(churnScore / 2)),
      reason: `High churn risk (${churnScore}%) - immediate intervention needed`,
      category: 'engagement'
    });

    recommendations.push({
      action: 'Offer fee waiver for next 3 months',
      priority: 'high',
      confidence: 85,
      reason: 'Financial incentive to reduce immediate churn risk',
      category: 'financial'
    });

    if (riskFactors.includes('days since last transaction') || riskFactors.includes('transaction frequency')) {
      recommendations.push({
        action: 'Send personalized reactivation email with exclusive offers',
        priority: 'high',
        confidence: 80,
        reason: 'Low transaction activity detected - reactivation campaign needed',
        category: 'engagement'
      });
    }

    if (riskFactors.includes('complaint history')) {
      recommendations.push({
        action: 'Assign senior relationship manager for dedicated support',
        priority: 'high',
        confidence: 88,
        reason: 'Previous complaints indicate service dissatisfaction',
        category: 'service'
      });
    }

    if (customer.account_balance && customer.account_balance > 1000000) {
      recommendations.push({
        action: 'Recommend premium account upgrade with exclusive benefits',
        priority: 'high',
        confidence: 82,
        reason: 'High-value customer - premium offering to enhance retention',
        category: 'product'
      });
    }
  }

  // Medium Priority Recommendations (churn score 40-70)
  if (churnScore >= 40 && churnScore <= 70) {
    recommendations.push({
      action: 'Schedule proactive check-in call this week',
      priority: 'medium',
      confidence: 75,
      reason: `Moderate churn risk (${churnScore}%) - proactive engagement recommended`,
      category: 'engagement'
    });

    if (riskFactors.includes('account status')) {
      recommendations.push({
        action: 'Offer account activation benefits or account review',
        priority: 'medium',
        confidence: 70,
        reason: 'Account status may be impacting customer satisfaction',
        category: 'product'
      });
    }

    if (!customer.has_credit_card && customer.segment !== 'retail') {
      recommendations.push({
        action: 'Recommend credit card with welcome bonus',
        priority: 'medium',
        confidence: 68,
        reason: 'Cross-sell opportunity to increase engagement',
        category: 'product'
      });
    }

    if (riskFactors.includes('mobile banking usage') || riskFactors.includes('branch visits')) {
      recommendations.push({
        action: 'Provide digital banking training and onboarding',
        priority: 'medium',
        confidence: 72,
        reason: 'Low digital engagement - training may improve satisfaction',
        category: 'education'
      });
    }
  }

  // Low Priority / Preventive Recommendations (churn score < 40)
  if (churnScore < 40 && riskLevel === 'low') {
    recommendations.push({
      action: 'Send quarterly satisfaction survey',
      priority: 'low',
      confidence: 65,
      reason: 'Low-risk customer - maintain engagement through feedback',
      category: 'engagement'
    });

    if (customer.segment === 'sme' || customer.segment === 'corporate') {
      recommendations.push({
        action: 'Provide financial advisory consultation invitation',
        priority: 'low',
        confidence: 60,
        reason: 'Value-added service for business customers',
        category: 'service'
      });
    }

    recommendations.push({
      action: 'Share educational content about financial planning',
      priority: 'low',
      confidence: 55,
      reason: 'Educational content strengthens relationship',
      category: 'education'
    });
  }

  // Segment-specific recommendations
  if (customer.segment === 'retail' && churnScore > 50) {
    recommendations.push({
      action: 'Offer loyalty rewards program membership',
      priority: 'high',
      confidence: 75,
      reason: 'Retail customers respond well to loyalty programs',
      category: 'financial'
    });
  }

  if (customer.segment === 'corporate' || customer.segment === 'institutional_banking') {
    if (churnScore > 60) {
      recommendations.push({
        action: 'Schedule executive meeting to discuss relationship',
        priority: 'high',
        confidence: 85,
        reason: 'High-value corporate customer requires executive engagement',
        category: 'engagement'
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

