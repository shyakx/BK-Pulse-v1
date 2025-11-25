import React, { useState, useEffect } from 'react';
import { MdAttachMoney, MdCalculate, MdHistory, MdCheckCircle, MdCancel, MdTrendingUp } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const IncentiveHub = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('eligibility');
  const [incentiveHistory, setIncentiveHistory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [roiInput, setRoiInput] = useState({ predictedEarnings: '', incentiveCost: '' });
  const [roiResult, setRoiResult] = useState(null);

  useEffect(() => {
    if (user) {
      fetchEligibleCustomers();
      fetchIncentiveHistory();
    }
  }, [user]);

  const fetchEligibleCustomers = async () => {
    try {
      setLoading(true);
      // Fetch assigned customers with their predicted earnings
      const response = await api.getDashboard();
      if (response.success) {
        // In a real implementation, this would come from a dedicated API
        // For now, we'll use mock data structure
        // Data not yet available from API for officers, rely on mock data for now
      }
    } catch (err) {
      console.error('Error fetching eligible customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncentiveHistory = async () => {
    try {
      // Fetch incentive history from API
      // This would be a new endpoint
      setIncentiveHistory([]);
    } catch (err) {
      console.error('Error fetching incentive history:', err);
    }
  };

  const calculateROI = () => {
    const earnings = parseFloat(roiInput.predictedEarnings) || 0;
    const cost = parseFloat(roiInput.incentiveCost) || 0;
    
    if (earnings > 0 && cost > 0) {
      const roi = ((earnings - cost) / cost) * 100;
      const netProfit = earnings - cost;
      setRoiResult({
        roi: roi.toFixed(2),
        netProfit: netProfit,
        isProfitable: netProfit > 0
      });
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleApplyTemplate = async (customer) => {
    if (!selectedTemplate || !customer) {
      alert('Please select both a template and a customer');
      return;
    }

    try {
      // Create a task/action for this incentive
      const taskData = {
        customer_id: customer.customerId,
        action_type: 'Incentive Offer',
        description: `Apply incentive: ${selectedTemplate.name} - ${selectedTemplate.description}. Value: RWF ${selectedTemplate.typicalValue.toLocaleString()}`,
        priority: selectedTemplate.roi === 'High' ? 'high' : selectedTemplate.roi === 'Medium' ? 'medium' : 'low'
      };

      const response = await api.createTask(taskData);
      
      if (response.success) {
        alert(`Incentive template "${selectedTemplate.name}" has been applied to ${customer.name}. A task has been created for follow-up.`);
        setShowTemplateModal(false);
        setSelectedTemplate(null);
        setSelectedCustomer(null);
        // Refresh incentive history
        fetchIncentiveHistory();
      } else {
        throw new Error(response.message || 'Failed to apply template');
      }
    } catch (err) {
      console.error('Error applying template:', err);
      alert('Failed to apply template: ' + (err.response?.data?.message || err.message));
    }
  };

  const incentiveTemplates = [
    {
      id: 1,
      name: 'Cashback for Reactivation',
      type: 'cashback',
      description: '5% cashback on first transaction after reactivation',
      typicalValue: 5000,
      roi: 'High'
    },
    {
      id: 2,
      name: 'Welcome-Back Bundle',
      type: 'bundle',
      description: 'Free advisory session + fee waiver for 1 month',
      typicalValue: 10000,
      roi: 'Medium'
    },
    {
      id: 3,
      name: 'Zero-Charge Month',
      type: 'fee_waiver',
      description: 'No charges for 1 month after reactivation',
      typicalValue: 3000,
      roi: 'High'
    },
    {
      id: 4,
      name: 'Business Account Support',
      type: 'service',
      description: 'Free business advisory session',
      typicalValue: 15000,
      roi: 'Medium'
    },
    {
      id: 5,
      name: 'Savings Interest Booster',
      type: 'interest',
      description: '1% additional interest for 3 months',
      typicalValue: 2000,
      roi: 'Low'
    },
    {
      id: 6,
      name: 'Digital Banking Awareness',
      type: 'education',
      description: 'Free digital banking training session',
      typicalValue: 5000,
      roi: 'Medium'
    }
  ];

  const mockEligibleCustomers = [
    {
      id: 1,
      customerId: '100012',
      name: 'John Doe',
      predictedEarnings: 50000,
      recommendedIncentive: 2500,
      incentiveType: 'cashback',
      expectedROI: 1900,
      behavioralDrivers: ['Low transactions', 'Salary stopped', 'High charges']
    },
    {
      id: 2,
      customerId: '100013',
      name: 'Jane Smith',
      predictedEarnings: 75000,
      recommendedIncentive: 3750,
      incentiveType: 'fee_waiver',
      expectedROI: 71250,
      behavioralDrivers: ['Inactive 60 days', 'Low digital usage']
    }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Incentive Hub</h2>
        <p className="text-muted mb-0">Maximize ROI through strategic customer reactivation incentives</p>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'eligibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            <MdCheckCircle className="me-2" />
            Eligibility Checker
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <MdAttachMoney className="me-2" />
            Templates
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <MdCalculate className="me-2" />
            ROI Calculator
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <MdHistory className="me-2" />
            History
          </button>
        </li>
      </ul>

      {/* Eligibility Checker Tab */}
      {activeTab === 'eligibility' && (
        <div className="bk-card">
          <div className="bk-card-header">
            <h5 className="fw-bold mb-0">Incentive Eligibility Checker</h5>
          </div>
          <div className="bk-card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Predicted Monthly Earnings</th>
                      <th>Recommended Incentive</th>
                      <th>Incentive Type</th>
                      <th>Expected ROI</th>
                      <th>Behavioral Drivers</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockEligibleCustomers.map(customer => (
                      <tr key={customer.id}>
                        <td>
                          <div>
                            <strong>{customer.name}</strong>
                            <br />
                            <small className="text-muted">ID: {customer.customerId}</small>
                          </div>
                        </td>
                        <td>
                          <strong className="text-success">
                            RWF {customer.predictedEarnings.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <strong className="text-primary">
                            RWF {customer.recommendedIncentive.toLocaleString()}
                          </strong>
                          <br />
                          <small className="text-muted">5% of earnings</small>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {customer.incentiveType.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <strong className={customer.expectedROI > 0 ? 'text-success' : 'text-danger'}>
                            RWF {customer.expectedROI.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {customer.behavioralDrivers.map((driver, idx) => (
                              <span key={idx} className="badge bg-warning text-dark">
                                {driver}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            Offer Incentive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="row">
          {incentiveTemplates.map(template => (
            <div key={template.id} className="col-md-6 mb-4">
              <div className="bk-card h-100">
                <div className="bk-card-header d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0">{template.name}</h6>
                  <span className={`badge ${
                    template.roi === 'High' ? 'bg-success' :
                    template.roi === 'Medium' ? 'bg-warning' : 'bg-info'
                  }`}>
                    {template.roi} ROI
                  </span>
                </div>
                <div className="bk-card-body">
                  <p className="text-muted">{template.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">Typical Value:</small>
                      <strong className="d-block">RWF {template.typicalValue.toLocaleString()}</strong>
                    </div>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ROI Calculator Tab */}
      {activeTab === 'calculator' && (
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="bk-card">
              <div className="bk-card-header">
                <h5 className="fw-bold mb-0">ROI Calculator</h5>
              </div>
              <div className="bk-card-body">
                <div className="mb-3">
                  <label className="form-label">Predicted Monthly Earnings (RWF)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={roiInput.predictedEarnings}
                    onChange={(e) => setRoiInput({...roiInput, predictedEarnings: e.target.value})}
                    placeholder="50000"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Incentive Cost (RWF)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={roiInput.incentiveCost}
                    onChange={(e) => setRoiInput({...roiInput, incentiveCost: e.target.value})}
                    placeholder="2500"
                  />
                </div>
                <button className="btn btn-primary w-100" onClick={calculateROI}>
                  <MdCalculate className="me-2" />
                  Calculate ROI
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="bk-card">
              <div className="bk-card-header">
                <h5 className="fw-bold mb-0">Results</h5>
              </div>
              <div className="bk-card-body">
                {roiResult ? (
                  <>
                    <div className="text-center mb-4">
                      <div className={`display-4 ${roiResult.isProfitable ? 'text-success' : 'text-danger'}`}>
                        {roiResult.roi}%
                      </div>
                      <p className="text-muted">Return on Investment</p>
                    </div>
                    <div className="mb-3">
                      <strong>Net Profit:</strong>
                      <span className={`float-end ${roiResult.isProfitable ? 'text-success' : 'text-danger'}`}>
                        RWF {roiResult.netProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className={`alert ${roiResult.isProfitable ? 'alert-success' : 'alert-danger'}`}>
                      {roiResult.isProfitable ? (
                        <><MdTrendingUp className="me-2" />This incentive is profitable!</>
                      ) : (
                        <><MdCancel className="me-2" />This incentive may not be profitable</>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5 text-muted">
                    Enter values and click Calculate ROI
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bk-card">
          <div className="bk-card-header">
            <h5 className="fw-bold mb-0">Incentive History</h5>
          </div>
          <div className="bk-card-body">
            {incentiveHistory.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <MdHistory size={48} className="mb-3 opacity-50" />
                <p>No incentive history available</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Incentive Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Impact</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incentiveHistory.map((incentive, idx) => (
                      <tr key={idx}>
                        <td>{new Date(incentive.date).toLocaleDateString()}</td>
                        <td>{incentive.customerName}</td>
                        <td>{incentive.type}</td>
                        <td>RWF {incentive.amount.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${
                            incentive.status === 'accepted' ? 'bg-success' :
                            incentive.status === 'rejected' ? 'bg-danger' : 'bg-warning'
                          }`}>
                            {incentive.status}
                          </span>
                        </td>
                        <td>{incentive.impact}</td>
                        <td>{incentive.roi}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && selectedTemplate && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply Template: {selectedTemplate.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedTemplate(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted">{selectedTemplate.description}</p>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <small className="text-muted">Typical Value:</small>
                      <strong className="d-block">RWF {selectedTemplate.typicalValue.toLocaleString()}</strong>
                    </div>
                    <span className={`badge ${
                      selectedTemplate.roi === 'High' ? 'bg-success' :
                      selectedTemplate.roi === 'Medium' ? 'bg-warning' : 'bg-info'
                    }`}>
                      {selectedTemplate.roi} ROI
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Select Customer</label>
                  {mockEligibleCustomers.length === 0 ? (
                    <div className="alert alert-info">
                      <small>No eligible customers found. Please check the Eligibility Checker tab for available customers.</small>
                    </div>
                  ) : (
                    <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {mockEligibleCustomers.map(customer => (
                        <button
                          key={customer.id}
                          type="button"
                          className={`list-group-item list-group-item-action ${
                            selectedCustomer?.id === customer.id ? 'active' : ''
                          }`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{customer.name}</strong>
                              <br />
                              <small className="text-muted">ID: {customer.customerId}</small>
                            </div>
                            <div className="text-end">
                              <small className="text-muted">Predicted Earnings:</small>
                              <br />
                              <strong className="text-success">
                                RWF {customer.predictedEarnings.toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedTemplate(null);
                    setSelectedCustomer(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApplyTemplate(selectedCustomer)}
                  disabled={!selectedCustomer}
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentiveHub;

