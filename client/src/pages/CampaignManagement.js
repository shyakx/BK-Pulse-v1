import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdPause, MdMoreVert, MdTrendingUp, MdAccountBalance, MdBarChart, MdLightbulb, MdPeople, MdCheckCircle } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const CampaignManagement = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [campaignInsights, setCampaignInsights] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [error, setError] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    campaign_type: 'retention',
    target_segment: '',
    target_criteria: {
      risk_level: [],
      min_churn_score: null,
      max_churn_score: null,
      segment: []
    },
    start_date: '',
    end_date: '',
    budget: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getCampaigns();
      
      if (response.success && response.campaigns) {
        // Transform backend data to match frontend format
        const formattedCampaigns = response.campaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          target_segment: campaign.target_segment || 'All Customers',
          customer_count: campaign.target_count || 0,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          status: campaign.status || 'draft',
          contacted: campaign.converted_count || 0,
          responded: 0, // Can be calculated from campaign targets if needed
          retained: campaign.converted_count || 0,
          campaign_type: campaign.campaign_type,
          description: campaign.description,
          created_by_name: campaign.created_by_name
        }));
        setCampaigns(formattedCampaigns);
        
        // Calculate campaign insights
        const activeCampaigns = formattedCampaigns.filter(c => c.status === 'active' || c.status === 'Active');
        const totalCustomersTargeted = formattedCampaigns.reduce((sum, c) => sum + (c.customer_count || 0), 0);
        const totalContacted = formattedCampaigns.reduce((sum, c) => sum + (c.contacted || 0), 0);
        const totalRetained = formattedCampaigns.reduce((sum, c) => sum + (c.retained || 0), 0);
        const avgContactRate = totalCustomersTargeted > 0 ? (totalContacted / totalCustomersTargeted) * 100 : 0;
        const avgRetentionRate = totalContacted > 0 ? (totalRetained / totalContacted) * 100 : 0;
        
        // Store insights for display
        setCampaignInsights({
          totalCampaigns: formattedCampaigns.length,
          activeCampaigns: activeCampaigns.length,
          totalCustomersTargeted,
          totalContacted,
          totalRetained,
          avgContactRate,
          avgRetentionRate
        });
      } else {
        throw new Error(response.message || 'Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err.message || 'Failed to load campaigns');
      // Fallback to empty array if API fails
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Active: 'bg-success',
      active: 'bg-success',
      Draft: 'bg-secondary',
      draft: 'bg-secondary',
      Paused: 'bg-warning',
      paused: 'bg-warning',
      Completed: 'bg-info',
      completed: 'bg-info'
    };
    return badges[status] || 'bg-secondary';
  };

  const handleCreateCampaign = async (asDraft = false) => {
    try {
      if (!campaignForm.name) {
        alert('Please enter campaign name');
        return;
      }

      const campaignData = {
        ...campaignForm,
        status: asDraft ? 'draft' : 'active',
        budget: campaignForm.budget ? parseFloat(campaignForm.budget) : null
      };

      const response = await api.createCampaign(campaignData);
      if (response.success) {
        alert(`Campaign ${asDraft ? 'saved as draft' : 'created'} successfully!`);
        setShowWizard(false);
        setWizardStep(1);
        setCampaignForm({
          name: '',
          description: '',
          campaign_type: 'retention',
          target_segment: '',
          target_criteria: {
            risk_level: [],
            min_churn_score: null,
            max_churn_score: null,
            segment: []
          },
          start_date: '',
          end_date: '',
          budget: '',
          status: 'draft'
        });
        fetchCampaigns();
      } else {
        throw new Error(response.message || 'Failed to create campaign');
      }
    } catch (err) {
      alert('Failed to create campaign: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFormChange = (field, value) => {
    if (field.startsWith('target_criteria.')) {
      const criteriaField = field.replace('target_criteria.', '');
      setCampaignForm(prev => ({
        ...prev,
        target_criteria: {
          ...prev.target_criteria,
          [criteriaField]: value
        }
      }));
    } else {
      setCampaignForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Campaign Tracking</h2>
          <p className="text-muted mb-0">Measure impact of retention campaigns. Prove ROI of past retention actions and refine new strategies.</p>
        </div>
        {['retentionAnalyst', 'retentionManager', 'admin'].includes(user?.role) && (
        <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
          <MdAdd className="me-2" />
          Create Campaign
        </button>
        )}
      </div>

      {/* Campaign Performance Insights */}
      {campaigns.length > 0 && campaignInsights && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-success">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <MdBarChart className="me-2" />
                  Campaign Performance Overview & ROI Insights
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-3 mb-3">
                    <div className="card border-primary">
                      <div className="card-body text-center">
                        <MdPeople className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                        <h4>{campaignInsights.totalCampaigns}</h4>
                        <p className="text-muted small mb-0">Total Campaigns</p>
                        <small className="text-muted">
                          {campaignInsights.activeCampaigns} active
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-info">
                      <div className="card-body text-center">
                        <MdTrendingUp className="text-info mb-2" style={{ fontSize: '2rem' }} />
                        <h4>{campaignInsights.totalCustomersTargeted.toLocaleString()}</h4>
                        <p className="text-muted small mb-0">Customers Targeted</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <MdCheckCircle className="text-warning mb-2" style={{ fontSize: '2rem' }} />
                        <h4>{campaignInsights.avgContactRate.toFixed(1)}%</h4>
                        <p className="text-muted small mb-0">Avg Contact Rate</p>
                        <small className="text-muted">
                          {campaignInsights.totalContacted.toLocaleString()} contacted
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-success">
                      <div className="card-body text-center">
                        <MdAccountBalance className="text-success mb-2" style={{ fontSize: '2rem' }} />
                        <h4>{campaignInsights.avgRetentionRate.toFixed(1)}%</h4>
                        <p className="text-muted small mb-0">Avg Retention Rate</p>
                        <small className="text-muted">
                          {campaignInsights.totalRetained.toLocaleString()} retained
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actionable Insights */}
                <div className="alert alert-info mb-0">
                  <h6 className="mb-2">
                    <MdLightbulb className="me-2" />
                    Key Insights
                  </h6>
                  <ul className="mb-0">
                    {campaignInsights.avgContactRate < 50 && (
                      <li>
                        <strong>Contact Rate Opportunity:</strong> Average contact rate is {campaignInsights.avgContactRate.toFixed(1)}%. 
                        Consider improving outreach strategies to increase customer engagement.
                      </li>
                    )}
                    {campaignInsights.avgRetentionRate > 0 && (
                      <li>
                        <strong>Retention Success:</strong> {campaignInsights.totalRetained.toLocaleString()} customers 
                        ({campaignInsights.avgRetentionRate.toFixed(1)}% retention rate) have been retained through campaigns, 
                        demonstrating the effectiveness of targeted retention efforts.
                      </li>
                    )}
                    {campaignInsights.activeCampaigns > 0 && (
                      <li>
                        <strong>Active Campaigns:</strong> {campaignInsights.activeCampaigns} active campaigns are currently 
                        running. Monitor their performance regularly to optimize ROI.
                      </li>
                    )}
                    {campaignInsights.totalCustomersTargeted > 0 && (
                      <li>
                        <strong>Scale:</strong> Campaigns have targeted {campaignInsights.totalCustomersTargeted.toLocaleString()} 
                        customers total. Use performance data to refine targeting and improve future campaign effectiveness.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Campaigns */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Active Campaigns</h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-warning mb-3">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No campaigns found. Create your first campaign to get started.</p>
            </div>
          ) : (
            <div className="row">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="mb-1">{campaign.name}</h5>
                          <span className={`badge ${getStatusBadge(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <button className="btn btn-sm btn-link">
                          <MdMoreVert />
                        </button>
                      </div>
                      <div className="mb-3">
                        <p className="text-muted small mb-1">Target Segment</p>
                        <p className="mb-0">{campaign.target_segment}</p>
                      </div>
                      <div className="row mb-3">
                        <div className="col-6">
                          <p className="text-muted small mb-0">Customers</p>
                          <h6>{campaign.customer_count.toLocaleString()}</h6>
                        </div>
                        <div className="col-6">
                          <p className="text-muted small mb-0">Contacted</p>
                          <h6>{campaign.contacted.toLocaleString()}</h6>
                        </div>
                      </div>
                      {campaign.customer_count > 0 && (
                      <div className="mb-3">
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                              style={{ width: `${Math.min((campaign.contacted / campaign.customer_count) * 100, 100)}%` }}
                          >
                            {Math.round((campaign.contacted / campaign.customer_count) * 100)}%
                          </div>
                        </div>
                      </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </small>
                        <div>
                          <Link
                            to={`/campaigns/${campaign.id}/performance`}
                            className="btn btn-sm btn-outline-primary me-2"
                          >
                            View
                          </Link>
                          <button className="btn btn-sm btn-outline-secondary me-2">
                            <MdEdit />
                          </button>
                          <button className="btn btn-sm btn-outline-warning">
                            <MdPause />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Campaign</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowWizard(false);
                  setWizardStep(1);
                }}></button>
              </div>
              <div className="modal-body">
                {/* Step Indicator */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    {[1, 2, 3, 4].map(step => (
                      <div key={step} className="text-center">
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                          wizardStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'
                        }`} style={{ width: '40px', height: '40px' }}>
                          {step}
                        </div>
                        <div className="small mt-2">
                          {step === 1 && 'Details'}
                          {step === 2 && 'Target'}
                          {step === 3 && 'Actions'}
                          {step === 4 && 'Review'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                {wizardStep === 1 && (
                  <div>
                    <h6>Campaign Details</h6>
                    <p className="text-muted">Enter basic campaign information</p>
                    <div className="mb-3">
                      <label className="form-label">Campaign Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignForm.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="e.g., Q4 High-Risk Retention"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Campaign Type *</label>
                      <select
                        className="form-select"
                        value={campaignForm.campaign_type}
                        onChange={(e) => handleFormChange('campaign_type', e.target.value)}
                      >
                        <option value="retention">Retention</option>
                        <option value="win_back">Win Back</option>
                        <option value="upsell">Upsell</option>
                        <option value="cross_sell">Cross Sell</option>
                        <option value="preventive">Preventive</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={campaignForm.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Describe the campaign objectives and strategy..."
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={campaignForm.start_date}
                          onChange={(e) => handleFormChange('start_date', e.target.value)}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={campaignForm.end_date}
                          onChange={(e) => handleFormChange('end_date', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Budget (RWF)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={campaignForm.budget}
                        onChange={(e) => handleFormChange('budget', e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div>
                    <h6>Target Selection</h6>
                    <p className="text-muted">Select target customer segment and criteria</p>
                    <div className="mb-3">
                      <label className="form-label">Target Segment</label>
                      <input
                        type="text"
                        className="form-control"
                        value={campaignForm.target_segment}
                        onChange={(e) => handleFormChange('target_segment', e.target.value)}
                        placeholder="e.g., High Risk Customers"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Risk Level</label>
                      <div className="d-flex gap-3">
                        {['low', 'medium', 'high'].map(level => (
                          <div key={level} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={campaignForm.target_criteria.risk_level.includes(level)}
                              onChange={(e) => {
                                const current = campaignForm.target_criteria.risk_level;
                                const updated = e.target.checked
                                  ? [...current, level]
                                  : current.filter(r => r !== level);
                                handleFormChange('target_criteria.risk_level', updated);
                              }}
                              id={`risk-${level}`}
                            />
                            <label className="form-check-label" htmlFor={`risk-${level}`}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Min Churn Score</label>
                        <input
                          type="number"
                          className="form-control"
                          value={campaignForm.target_criteria.min_churn_score || ''}
                          onChange={(e) => handleFormChange('target_criteria.min_churn_score', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Max Churn Score</label>
                        <input
                          type="number"
                          className="form-control"
                          value={campaignForm.target_criteria.max_churn_score || ''}
                          onChange={(e) => handleFormChange('target_criteria.max_churn_score', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="100"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Customer Segments</label>
                      <div className="d-flex gap-3 flex-wrap">
                        {['retail', 'sme', 'corporate', 'institutional_banking'].map(seg => (
                          <div key={seg} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={campaignForm.target_criteria.segment.includes(seg)}
                              onChange={(e) => {
                                const current = campaignForm.target_criteria.segment;
                                const updated = e.target.checked
                                  ? [...current, seg]
                                  : current.filter(s => s !== seg);
                                handleFormChange('target_criteria.segment', updated);
                              }}
                              id={`segment-${seg}`}
                            />
                            <label className="form-check-label" htmlFor={`segment-${seg}`}>
                              {seg.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div>
                    <h6>Campaign Configuration</h6>
                    <p className="text-muted">Review and configure campaign settings</p>
                    <div className="alert alert-info">
                      <strong>Note:</strong> Campaign actions and messaging will be configured after campaign creation.
                      You can set up specific retention actions for each customer through the campaign management interface.
                    </div>
                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">Campaign Summary</h6>
                        <div className="small">
                          <p><strong>Type:</strong> {campaignForm.campaign_type}</p>
                          <p><strong>Target Segment:</strong> {campaignForm.target_segment || 'All Customers'}</p>
                          {campaignForm.start_date && <p><strong>Start:</strong> {new Date(campaignForm.start_date).toLocaleDateString()}</p>}
                          {campaignForm.end_date && <p><strong>End:</strong> {new Date(campaignForm.end_date).toLocaleDateString()}</p>}
                          {campaignForm.budget && <p><strong>Budget:</strong> RWF {parseFloat(campaignForm.budget).toLocaleString()}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div>
                    <h6>Review & Launch</h6>
                    <p className="text-muted">Review all settings before launching</p>
                    <div className="card mb-3">
                      <div className="card-header">
                        <h6 className="mb-0">Campaign Details</h6>
                      </div>
                      <div className="card-body">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <th>Name:</th>
                              <td>{campaignForm.name || 'Not set'}</td>
                            </tr>
                            <tr>
                              <th>Type:</th>
                              <td>{campaignForm.campaign_type}</td>
                            </tr>
                            <tr>
                              <th>Description:</th>
                              <td>{campaignForm.description || 'No description'}</td>
                            </tr>
                            <tr>
                              <th>Target Segment:</th>
                              <td>{campaignForm.target_segment || 'All Customers'}</td>
                            </tr>
                            <tr>
                              <th>Dates:</th>
                              <td>
                                {campaignForm.start_date && campaignForm.end_date
                                  ? `${new Date(campaignForm.start_date).toLocaleDateString()} - ${new Date(campaignForm.end_date).toLocaleDateString()}`
                                  : 'Not set'
                                }
                              </td>
                            </tr>
                            <tr>
                              <th>Budget:</th>
                              <td>{campaignForm.budget ? `RWF ${parseFloat(campaignForm.budget).toLocaleString()}` : 'Not set'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {!campaignForm.name && (
                      <div className="alert alert-warning">
                        Please complete all required fields before launching.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : setShowWizard(false)}
                >
                  {wizardStep > 1 ? 'Previous' : 'Cancel'}
                </button>
                {wizardStep < 4 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setWizardStep(wizardStep + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => handleCreateCampaign(true)}
                      disabled={!campaignForm.name}
                    >
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleCreateCampaign(false)}
                      disabled={!campaignForm.name}
                    >
                      Launch Campaign
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;

