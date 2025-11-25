import React, { useState } from 'react';
import { MdPhone, MdEmail, MdSms, MdContentCopy, MdAutoAwesome } from 'react-icons/md';

const RetentionScripts = () => {
  const [activeTab, setActiveTab] = useState('scripts');
  const [selectedCategory, setSelectedCategory] = useState('inactive_30');
  const [selectedScript, setSelectedScript] = useState(null);
  const [customerContext, setCustomerContext] = useState({
    name: '',
    churnScore: '',
    inactivityDays: '',
    riskLevel: ''
  });

  const scriptCategories = [
    { id: 'inactive_30', label: 'Inactive 30 Days', icon: '⏱️' },
    { id: 'inactive_60', label: 'Inactive 60 Days', icon: '⏰' },
    { id: 'inactive_180', label: 'Dormant (180+ Days)', icon: '💤' },
    { id: 'salary_stopped', label: 'Salary Stopped', icon: '💰' },
    { id: 'high_charges', label: 'Complaining About Charges', icon: '💸' },
    { id: 'high_risk', label: 'High-Risk Churn', icon: '🚨' },
    { id: 'low_digital', label: 'Low Digital Engagement', icon: '📱' }
  ];

  const scriptTemplates = {
    inactive_30: {
      phone: {
        title: 'Phone Call Script - Inactive 30 Days',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name]. 

I'm calling to check in on your account. I noticed you haven't made any transactions in the past 30 days. 

Is everything okay? Are you experiencing any issues with your account or our services?

[Key Talking Points]
- Ask if customer changed phone numbers or contact information
- Inquire about any issues or concerns
- Offer assistance with account reactivation
- Suggest digital banking options for convenience

[Action Prompts]
- Update contact information if changed
- Schedule follow-up if needed
- Offer product recommendations based on customer needs

[Follow-up Instructions]
- If customer is satisfied: Schedule check-in in 2 weeks
- If customer has concerns: Escalate to manager and follow up within 24 hours`,
        duration: '5-7 minutes'
      },
      sms: {
        title: 'SMS Template - Inactive 30 Days',
        script: `Hi [Customer Name], we noticed you haven't used your account recently. Is everything okay? We're here to help. Reply HELP for assistance or call [Phone Number]. - [Bank Name]`
      },
      email: {
        title: 'Email Template - Inactive 30 Days',
        script: `Subject: We Miss You - Let's Get Your Account Active Again

Dear [Customer Name],

We noticed you haven't made any transactions in the past 30 days. We want to make sure everything is okay with your account.

If you're experiencing any issues or have questions, please don't hesitate to reach out. We're here to help!

[Product Recommendations]
- Digital banking for convenient transactions
- Mobile banking app for on-the-go access
- Account review to ensure you have the right products

Best regards,
[Your Name]
[Bank Name]`
      }
    },
    inactive_60: {
      phone: {
        title: 'Phone Call Script - Inactive 60 Days',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name].

I'm reaching out because your account has been inactive for 60 days. We want to ensure you're still satisfied with our services.

[Key Talking Points]
- Express concern about account inactivity
- Ask about reasons for inactivity
- Offer solutions to reactivate account
- Discuss benefits of maintaining active account

[Incentive Suggestions]
- Fee waiver for next month
- Cashback on first transaction
- Free advisory session

[Follow-up Instructions]
- Schedule follow-up call in 1 week
- Send email with account reactivation steps`,
        duration: '7-10 minutes'
      },
      sms: {
        title: 'SMS Template - Inactive 60 Days',
        script: `Hi [Customer Name], your account has been inactive for 60 days. We'd love to help you reactivate it. Call us at [Phone Number] or visit [Branch]. Special offer available! - [Bank Name]`
      }
    },
    inactive_180: {
      phone: {
        title: 'Phone Call Script - Dormant Account (180+ Days)',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name].

I'm calling regarding your account which has been dormant for over 180 days. We want to help you reactivate it and get back to banking with us.

[Key Talking Points]
- Acknowledge account dormancy
- Understand reasons for dormancy
- Offer reactivation incentives
- Explain account reactivation process

[Incentive Suggestions]
- Welcome-back bundle (fee waiver + cashback)
- Zero-charge month
- Free advisory session
- Product upgrade options

[Action Prompts]
- Verify customer identity
- Update KYC if needed
- Process account reactivation
- Schedule branch visit if required

[Follow-up Instructions]
- Immediate follow-up within 24 hours
- Branch visit coordination if needed
- Email with reactivation steps`,
        duration: '10-15 minutes'
      },
      sms: {
        title: 'SMS Template - Dormant Account',
        script: `Hi [Customer Name], we'd love to help reactivate your dormant account. Special welcome-back offer available! Call [Phone Number] or visit [Branch]. - [Bank Name]`
      }
    },
    salary_stopped: {
      phone: {
        title: 'Phone Call Script - Salary Stopped',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name].

I noticed your salary deposits have stopped. I wanted to check in and see if everything is okay.

[Key Talking Points]
- Ask about employment status
- Inquire about new salary account
- Offer account maintenance options
- Discuss alternative banking solutions

[Product Recommendations]
- Account type change if needed
- Lower maintenance fee options
- Digital banking for cost savings

[Follow-up Instructions]
- Follow up in 1 week if no response
- Offer account review appointment`,
        duration: '7-10 minutes'
      }
    },
    high_charges: {
      phone: {
        title: 'Phone Call Script - Complaining About Charges',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name].

I understand you have concerns about account charges. I'm here to help address those concerns and find a solution that works for you.

[Key Talking Points]
- Listen to customer concerns
- Explain charges clearly
- Offer fee reduction options
- Suggest ways to minimize charges

[Incentive Suggestions]
- Fee waiver for next month
- Account type review for lower fees
- Digital banking to reduce transaction costs

[Action Prompts]
- Review account charges
- Offer fee waiver if appropriate
- Suggest account optimization

[Follow-up Instructions]
- Confirm fee adjustments
- Check customer satisfaction`,
        duration: '10-12 minutes'
      }
    },
    high_risk: {
      phone: {
        title: 'Phone Call Script - High-Risk Churn',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name].

I'm calling because we've identified some risk factors with your account. We want to work with you to address any concerns and ensure you're getting the best value from our services.

[Key Talking Points]
- Acknowledge risk factors (based on ML model)
- Ask about customer satisfaction
- Address specific concerns
- Offer personalized solutions

[Incentive Suggestions]
- Personalized incentive based on risk drivers
- Account review and optimization
- Product recommendations

[Action Prompts]
- Address specific risk drivers
- Offer tailored solutions
- Schedule follow-up

[Follow-up Instructions]
- Immediate follow-up within 48 hours
- Monitor account activity
- Escalate if needed`,
        duration: '10-15 minutes'
      }
    },
    low_digital: {
      phone: {
        title: 'Phone Call Script - Low Digital Engagement',
        script: `Hello [Customer Name], this is [Your Name] from [Bank Name].

I noticed you're not using our digital banking services much. I'd love to show you how digital banking can make your life easier and save you money.

[Key Talking Points]
- Benefits of digital banking
- Cost savings through digital transactions
- Security features
- Training and support available

[Incentive Suggestions]
- Free digital banking training
- Fee reduction for digital transactions
- Mobile banking app setup assistance

[Action Prompts]
- Schedule digital banking demo
- Offer training session
- Set up mobile banking

[Follow-up Instructions]
- Follow up after training
- Check digital adoption
- Offer ongoing support`,
        duration: '8-10 minutes'
      }
    }
  };

  const generatePersonalizedScript = () => {
    // AI-based script generation based on customer context
    const { name, churnScore, inactivityDays, riskLevel } = customerContext;
    
    if (!name || !churnScore) {
      return 'Please fill in customer context to generate personalized script.';
    }

    return `Hello ${name}, this is [Your Name] from [Bank Name].

Based on our analysis, your account shows a churn risk score of ${churnScore}%. 

${inactivityDays ? `Your account has been inactive for ${inactivityDays} days.` : ''}

${riskLevel ? `Our system currently classifies your profile as a ${riskLevel} risk customer. ` : ''}

We want to work with you to address any concerns and ensure you're getting the best value from our services.

[Personalized Recommendations based on ML model]
- Address specific risk drivers identified
- Offer tailored solutions
- Provide relevant incentives

Would you be available for a brief conversation to discuss how we can help?`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Script copied to clipboard!');
  };

  const currentScripts = scriptTemplates[selectedCategory] || {};

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Retention Scripts</h2>
        <p className="text-muted mb-0">Guided conversation flows for effective customer retention</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'scripts' ? 'active' : ''}`}
            onClick={() => setActiveTab('scripts')}
          >
            <MdPhone className="me-2" />
            Scripts
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <MdAutoAwesome className="me-2" />
            AI-Generated Scripts
          </button>
        </li>
      </ul>

      {/* Scripts Tab */}
      {activeTab === 'scripts' && (
        <div className="row">
          {/* Category Selection */}
          <div className="col-md-3 mb-4">
            <div className="bk-card">
              <div className="bk-card-header">
                <h6 className="fw-bold mb-0">Script Categories</h6>
              </div>
              <div className="bk-card-body p-0">
                <div className="list-group list-group-flush">
                  {scriptCategories.map(category => (
                    <button
                      key={category.id}
                      className={`list-group-item list-group-item-action ${
                        selectedCategory === category.id ? 'active' : ''
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span className="me-2">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Script Display */}
          <div className="col-md-9 mb-4">
            <div className="bk-card">
              <div className="bk-card-header d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Available Scripts</h6>
                <div className="btn-group" role="group">
                  <button
                    className={`btn btn-sm ${selectedScript === 'phone' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedScript('phone')}
                  >
                    <MdPhone className="me-1" />
                    Phone
                  </button>
                  <button
                    className={`btn btn-sm ${selectedScript === 'sms' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedScript('sms')}
                  >
                    <MdSms className="me-1" />
                    SMS
                  </button>
                  <button
                    className={`btn btn-sm ${selectedScript === 'email' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedScript('email')}
                  >
                    <MdEmail className="me-1" />
                    Email
                  </button>
                </div>
              </div>
              <div className="bk-card-body">
                {selectedScript && currentScripts[selectedScript] ? (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5>{currentScripts[selectedScript].title}</h5>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => copyToClipboard(currentScripts[selectedScript].script)}
                      >
                        <MdContentCopy className="me-1" />
                        Copy
                      </button>
                    </div>
                    {currentScripts[selectedScript].duration && (
                      <p className="text-muted">
                        <strong>Duration:</strong> {currentScripts[selectedScript].duration}
                      </p>
                    )}
                    <div className="bg-light p-4 rounded" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {currentScripts[selectedScript].script}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <MdPhone size={48} className="mb-3 opacity-50" />
                    <p>Select a script type to view</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI-Generated Scripts Tab */}
      {activeTab === 'ai' && (
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="bk-card">
              <div className="bk-card-header">
                <h6 className="fw-bold mb-0">Customer Context</h6>
              </div>
              <div className="bk-card-body">
                <div className="mb-3">
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customerContext.name}
                    onChange={(e) => setCustomerContext({...customerContext, name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Churn Score (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={customerContext.churnScore}
                    onChange={(e) => setCustomerContext({...customerContext, churnScore: e.target.value})}
                    placeholder="75"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Inactivity Days</label>
                  <input
                    type="number"
                    className="form-control"
                    value={customerContext.inactivityDays}
                    onChange={(e) => setCustomerContext({...customerContext, inactivityDays: e.target.value})}
                    placeholder="45"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Risk Level</label>
                  <select
                    className="form-select"
                    value={customerContext.riskLevel}
                    onChange={(e) => setCustomerContext({...customerContext, riskLevel: e.target.value})}
                  >
                    <option value="">Select Risk Level</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-8 mb-4">
            <div className="bk-card">
              <div className="bk-card-header d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">Generated Script</h6>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => copyToClipboard(generatePersonalizedScript())}
                >
                  <MdContentCopy className="me-1" />
                  Copy
                </button>
              </div>
              <div className="bk-card-body">
                <div className="bg-light p-4 rounded" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {generatePersonalizedScript()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionScripts;

