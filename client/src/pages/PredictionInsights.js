import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MdPlayArrow, MdDownload, MdSearch, MdFilterList, MdPerson, MdTrendingUp, MdAccountCircle, MdInfo, MdEmail, MdPhone, MdLocationOn, MdBusiness, MdAccountBalance, MdTrendingDown } from 'react-icons/md';

const PredictionInsights = () => {
  const [segmentType, setSegmentType] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState(null);
  const [sortBy, setSortBy] = useState('churn_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Individual customer lookup
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [individualCustomer, setIndividualCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [customerPrediction, setCustomerPrediction] = useState(null);
  const [customerShap, setCustomerShap] = useState(null);

  const handleRunPrediction = async () => {
    try {
      setProcessing(true);
      setResults(null);
      setPredictions([]);
      setShowCustomerList(false);
      
      // Use smaller limit to avoid timeouts (batch predictions can take time)
      const limit = segmentType === 'all' ? 100 : 50;
      
      // Call real API with longer timeout
      const response = await api.batchPredict({ 
        limit: limit 
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to run predictions');
      }
      
      // Calculate segmentation from results
      const predictionsData = response.predictions || [];
      const validPredictions = predictionsData.filter(p => !p.error && p.churn_score !== undefined);
      
      if (validPredictions.length === 0) {
        throw new Error('No valid predictions returned. Try running predictions again.');
      }

      // Fetch customer details for predictions
      const customerIds = validPredictions.map(p => p.customer_id).filter(Boolean);
      let customerDetails = [];
      if (customerIds.length > 0) {
        try {
          const customersResponse = await api.getCustomers({ 
            limit: 1000,
            search: customerIds.join(',')
          });
          if (customersResponse.success && customersResponse.customers) {
            customerDetails = customersResponse.customers;
          }
        } catch (err) {
          console.warn('Could not fetch customer details:', err);
        }
      }

      // Merge predictions with customer details
      const enrichedPredictions = validPredictions.map(pred => {
        const customer = customerDetails.find(c => 
          c.customer_id === pred.customer_id || c.id === pred.customer_id
        );
        return {
          ...pred,
          customer_name: customer?.name || 'Unknown',
          account_balance: customer?.account_balance || 0,
          email: customer?.email || '',
          segment: customer?.segment || '',
          branch: customer?.branch || ''
        };
      });
      
      setPredictions(enrichedPredictions);
      
      const critical = validPredictions.filter(p => p.churn_score >= 70);
      const high = validPredictions.filter(p => p.churn_score >= 50 && p.churn_score < 70);
      const medium = validPredictions.filter(p => p.churn_score >= 40 && p.churn_score < 50);
      const low = validPredictions.filter(p => p.churn_score < 40);
      const avgChurnProb = validPredictions.reduce((sum, p) => sum + (p.churn_score || 0), 0) / validPredictions.length;

      // Calculate at-risk balance
      const criticalBalance = critical.reduce((sum, p) => {
        const customer = customerDetails.find(c => 
          c.customer_id === p.customer_id || c.id === p.customer_id
        );
        return sum + (parseFloat(customer?.account_balance) || 0);
      }, 0);
      const highBalance = high.reduce((sum, p) => {
        const customer = customerDetails.find(c => 
          c.customer_id === p.customer_id || c.id === p.customer_id
        );
        return sum + (parseFloat(customer?.account_balance) || 0);
      }, 0);
      const totalAtRiskBalance = criticalBalance + highBalance;

      setResults({
        totalAnalyzed: response.total || validPredictions.length,
        predictedChurners: critical.length + high.length,
        avgChurnProb: avgChurnProb.toFixed(1),
        totalAtRiskBalance: totalAtRiskBalance,
        segmentation: {
          critical: { 
            count: critical.length, 
            percent: validPredictions.length > 0 ? ((critical.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: critical.length > 0 ? (criticalBalance / critical.length).toFixed(0) : 0,
            avgProb: critical.length > 0 ? (critical.reduce((sum, p) => sum + p.churn_score, 0) / critical.length).toFixed(1) : 0,
            customers: critical
          },
          high: { 
            count: high.length, 
            percent: validPredictions.length > 0 ? ((high.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: high.length > 0 ? (highBalance / high.length).toFixed(0) : 0,
            avgProb: high.length > 0 ? (high.reduce((sum, p) => sum + p.churn_score, 0) / high.length).toFixed(1) : 0,
            customers: high
          },
          medium: { 
            count: medium.length, 
            percent: validPredictions.length > 0 ? ((medium.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: 0,
            avgProb: medium.length > 0 ? (medium.reduce((sum, p) => sum + p.churn_score, 0) / medium.length).toFixed(1) : 0,
            customers: medium
          },
          low: { 
            count: low.length, 
            percent: validPredictions.length > 0 ? ((low.length / validPredictions.length) * 100).toFixed(2) : 0,
            avgBalance: 0,
            avgProb: 0,
            customers: low
          }
        }
      });
    } catch (err) {
      console.error('Prediction error:', err);
      let errorMessage = err.message || 'Failed to run prediction';
      
      if (err.isTimeout || errorMessage.includes('timeout')) {
        errorMessage = 'Prediction request timed out. Batch predictions can take several minutes. Try reducing the number of customers or check back later.';
      }
      
      alert(errorMessage);
      setResults({
        error: errorMessage,
        totalAnalyzed: 0
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleLookupCustomer = async () => {
    if (!customerIdInput.trim()) {
      alert('Please enter a customer ID');
      return;
    }

    try {
      setLoadingCustomer(true);
      setIndividualCustomer(null);
      setCustomerPrediction(null);
      setCustomerShap(null);

      // Fetch customer details
      const customerResponse = await api.getCustomer(customerIdInput.trim());
      
      if (!customerResponse.success || !customerResponse.customer) {
        throw new Error('Customer not found. Please check the customer ID and try again.');
      }

      const customer = customerResponse.customer;
      setIndividualCustomer(customer);

      // Automatically run prediction if customer is found
      try {
        const predictResponse = await api.updateCustomerPrediction(customerIdInput.trim());
        if (predictResponse.success && predictResponse.prediction) {
          setCustomerPrediction(predictResponse.prediction);
        }
      } catch (predictError) {
        console.warn('Could not generate prediction:', predictError);
        // Continue without prediction
      }

      // Try to fetch SHAP values
      try {
        const shapResponse = await api.getCustomerSHAP(customerIdInput.trim());
        if (shapResponse.success && shapResponse.shap_values) {
          setCustomerShap(shapResponse.shap_values);
        }
      } catch (shapError) {
        console.warn('Could not fetch SHAP values:', shapError);
        // Continue without SHAP
      }
    } catch (err) {
      console.error('Error looking up customer:', err);
      alert(err.message || 'Failed to lookup customer. Please check the customer ID.');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handlePredictIndividualCustomer = async () => {
    if (!individualCustomer) {
      alert('Please lookup a customer first');
      return;
    }

    try {
      setLoadingCustomer(true);
      const customerId = individualCustomer.customer_id || individualCustomer.id;
      const predictResponse = await api.updateCustomerPrediction(customerId);
      
      if (predictResponse.success && predictResponse.prediction) {
        setCustomerPrediction(predictResponse.prediction);
        
        // Refresh customer data
        const customerResponse = await api.getCustomer(customerId);
        if (customerResponse.success && customerResponse.customer) {
          setIndividualCustomer(customerResponse.customer);
        }

        // Try to fetch SHAP values
        try {
          const shapResponse = await api.getCustomerSHAP(customerId);
          if (shapResponse.success && shapResponse.shap_values) {
            setCustomerShap(shapResponse.shap_values);
          }
        } catch (shapError) {
          console.warn('Could not fetch SHAP values:', shapError);
        }
      } else {
        throw new Error('Failed to generate prediction');
      }
    } catch (err) {
      console.error('Error running prediction:', err);
      alert('Failed to run prediction: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleExport = (format, riskLevel = null) => {
    let dataToExport = predictions;
    
    // Filter by risk level if specified
    if (riskLevel) {
      dataToExport = dataToExport.filter(p => {
        const score = p.churn_score || 0;
        if (riskLevel === 'critical') return score >= 70;
        if (riskLevel === 'high') return score >= 50 && score < 70;
        if (riskLevel === 'medium') return score >= 40 && score < 50;
        if (riskLevel === 'low') return score < 40;
        return true;
      });
    }

    // Sort data
    const sorted = [...dataToExport].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    if (format === 'csv') {
      let csvContent = 'Customer ID,Name,Email,Segment,Branch,Churn Score (%),Risk Level,Account Balance\n';
      sorted.forEach(p => {
        csvContent += `${p.customer_id || ''},${p.customer_name || ''},${p.email || ''},${p.segment || ''},${p.branch || ''},${(p.churn_score || 0).toFixed(1)},${p.risk_level || ''},${(p.account_balance || 0).toFixed(2)}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction_insights_${riskLevel || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      // For Excel, we'll create a CSV with .xls extension (basic Excel support)
      let csvContent = 'Customer ID\tName\tEmail\tSegment\tBranch\tChurn Score (%)\tRisk Level\tAccount Balance\n';
      sorted.forEach(p => {
        csvContent += `${p.customer_id || ''}\t${p.customer_name || ''}\t${p.email || ''}\t${p.segment || ''}\t${p.branch || ''}\t${(p.churn_score || 0).toFixed(1)}\t${p.risk_level || ''}\t${(p.account_balance || 0).toFixed(2)}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction_insights_${riskLevel || 'all'}_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // For PDF, create a simple text-based report
      let pdfContent = `BK Pulse - Prediction Insights Report\n`;
      pdfContent += `Generated: ${new Date().toLocaleString()}\n\n`;
      pdfContent += `Total Customers Analyzed: ${results.totalAnalyzed}\n`;
      pdfContent += `Predicted Churners: ${results.predictedChurners}\n`;
      pdfContent += `Average Churn Probability: ${results.avgChurnProb}%\n\n`;
      pdfContent += `Risk Level Breakdown:\n`;
      Object.entries(results.segmentation).forEach(([level, data]) => {
        if (data.count > 0) {
          pdfContent += `  ${level.toUpperCase()}: ${data.count} (${data.percent}%)\n`;
        }
      });
      pdfContent += `\n\nCustomer Details:\n`;
      pdfContent += `Customer ID | Name | Churn Score | Risk Level | Balance\n`;
      pdfContent += `-`.repeat(80) + `\n`;
      sorted.slice(0, 100).forEach(p => {
        pdfContent += `${p.customer_id || ''} | ${p.customer_name || ''} | ${(p.churn_score || 0).toFixed(1)}% | ${p.risk_level || ''} | RWF ${(p.account_balance || 0).toLocaleString()}\n`;
      });
      
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction_insights_${riskLevel || 'all'}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      alert('PDF export created as text file. For full PDF support, please use a PDF library.');
    }
  };

  const handleViewCustomers = (riskLevel) => {
    setSelectedRiskLevel(riskLevel);
    setShowCustomerList(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredPredictions = predictions.filter(p => {
    if (selectedRiskLevel) {
      const score = p.churn_score || 0;
      if (selectedRiskLevel === 'critical' && score < 70) return false;
      if (selectedRiskLevel === 'high' && (score < 50 || score >= 70)) return false;
      if (selectedRiskLevel === 'medium' && (score < 40 || score >= 50)) return false;
      if (selectedRiskLevel === 'low' && score >= 40) return false;
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (p.customer_id || '').toLowerCase().includes(search) ||
        (p.customer_name || '').toLowerCase().includes(search) ||
        (p.email || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Prediction Insights</h2>
          <p className="text-muted mb-0">Individual and group churn predictions. Identify which customers are most likely to churn soon and export target lists.</p>
        </div>
      </div>

      {/* Individual Customer Lookup */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Individual Customer Prediction</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8 mb-3">
              <label className="form-label">Customer ID / Number</label>
              <div className="input-group">
                <span className="input-group-text">
                  <MdPerson />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter customer ID (e.g., CUST001, 12345)"
                  value={customerIdInput}
                  onChange={(e) => setCustomerIdInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLookupCustomer()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleLookupCustomer}
                  disabled={loadingCustomer || !customerIdInput.trim()}
                >
                  {loadingCustomer ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MdSearch className="me-2" />
                      Lookup
                    </>
                  )}
                </button>
              </div>
              <small className="text-muted">Enter a customer ID to view their demographics, transaction history, and churn prediction</small>
            </div>
            <div className="col-md-4 mb-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setIndividualCustomer(null);
                  setCustomerIdInput('');
                  setCustomerPrediction(null);
                  setCustomerShap(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Customer Details */}
      {individualCustomer && (
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Customer Details & Prediction</h5>
            <Link
              to={`/customers/${individualCustomer.customer_id || individualCustomer.id}`}
              className="btn btn-sm btn-outline-primary"
            >
              View Full Profile
            </Link>
          </div>
          <div className="card-body">
            <div className="row">
              {/* Customer Demographics */}
              <div className="col-md-6 mb-4">
                <h6 className="text-primary mb-3">
                  <MdAccountCircle className="me-2" />
                  Demographics
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: '40%' }}>Customer ID:</td>
                        <td>{individualCustomer.customer_id || individualCustomer.id}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Name:</td>
                        <td>{individualCustomer.name || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Email:</td>
                        <td>{individualCustomer.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Phone:</td>
                        <td>{individualCustomer.phone || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Age:</td>
                        <td>{individualCustomer.age || individualCustomer.Age || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Gender:</td>
                        <td>{individualCustomer.gender || individualCustomer.Gender || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Location:</td>
                        <td>{individualCustomer.location || individualCustomer.Location || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Account & Transaction Information */}
              <div className="col-md-6 mb-4">
                <h6 className="text-primary mb-3">
                  <MdBusiness className="me-2" />
                  Account & Transaction Information
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: '40%' }}>Segment:</td>
                        <td>
                          <span className="badge bg-info">
                            {individualCustomer.segment || individualCustomer.Customer_Segment || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Branch:</td>
                        <td>{individualCustomer.branch || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Product Type:</td>
                        <td>{individualCustomer.product_type || individualCustomer.Account_Type || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Account Balance:</td>
                        <td className="fw-bold text-success">
                          RWF {parseFloat(individualCustomer.account_balance || individualCustomer.Balance || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Tenure (Months):</td>
                        <td>{individualCustomer.tenure_months || individualCustomer.Tenure_Months || 0}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Avg Transaction Value:</td>
                        <td>
                          RWF {parseFloat(individualCustomer.average_transaction_value || individualCustomer.Average_Transaction_Value || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Transaction Frequency:</td>
                        <td>{individualCustomer.transaction_frequency || individualCustomer.Transaction_Frequency || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Lagging Indicators */}
            <div className="row mb-4">
              <div className="col-12">
                <h6 className="text-primary mb-3">
                  <MdTrendingDown className="me-2" />
                  Lagging Indicators
                </h6>
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <div className="card border-warning">
                      <div className="card-body text-center">
                        <p className="text-muted small mb-1">Complaints</p>
                        <h4>{individualCustomer.complaints || individualCustomer.Complaints || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-info">
                      <div className="card-body text-center">
                        <p className="text-muted small mb-1">Support Tickets</p>
                        <h4>{individualCustomer.support_tickets || individualCustomer.Support_Tickets || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-secondary">
                      <div className="card-body text-center">
                        <p className="text-muted small mb-1">Days Since Last Transaction</p>
                        <h4>{individualCustomer.days_since_last_transaction || individualCustomer.Days_Since_Last_Transaction || 'N/A'}</h4>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="card border-danger">
                      <div className="card-body text-center">
                        <p className="text-muted small mb-1">Account Status</p>
                        <h6>
                          <span className={`badge ${
                            individualCustomer.account_status === 'active' || individualCustomer.Account_Status === 'Active'
                              ? 'bg-success' : 'bg-warning'
                          }`}>
                            {individualCustomer.account_status || individualCustomer.Account_Status || 'N/A'}
                          </span>
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Churn Prediction */}
            {customerPrediction && (
              <div className="row">
                <div className="col-12">
                  <h6 className="text-primary mb-3">
                    <MdTrendingUp className="me-2" />
                    Churn Prediction
                  </h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className={`card border-${
                        (customerPrediction.churn_score || 0) >= 70 ? 'danger' :
                        (customerPrediction.churn_score || 0) >= 50 ? 'warning' : 'success'
                      }`}>
                        <div className="card-body text-center">
                          <p className="text-muted small mb-1">Churn Score</p>
                          <h2 className={`text-${
                            (customerPrediction.churn_score || 0) >= 70 ? 'danger' :
                            (customerPrediction.churn_score || 0) >= 50 ? 'warning' : 'success'
                          }`}>
                            {(customerPrediction.churn_score || 0).toFixed(1)}%
                          </h2>
                          <span className={`badge bg-${
                            customerPrediction.risk_level === 'high' ? 'danger' :
                            customerPrediction.risk_level === 'medium' ? 'warning' : 'success'
                          }`}>
                            {customerPrediction.risk_level || 'low'} risk
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <p className="text-muted small mb-1">Churn Probability</p>
                          <h4>{((customerPrediction.churn_probability || 0) * 100).toFixed(1)}%</h4>
                          <p className="text-muted small mb-0">
                            {customerPrediction.churn_prediction === 1 ? 'Likely to Churn' : 'Not Likely to Churn'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card">
                        <div className="card-body text-center">
                          <p className="text-muted small mb-1">Prediction Confidence</p>
                          <h4>{(customerPrediction.confidence || 85).toFixed(0)}%</h4>
                          <small className="text-muted">Model confidence</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SHAP Values / Feature Importance */}
                  {customerShap && customerShap.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-primary mb-3">Key Factors Influencing Prediction</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead>
                            <tr>
                              <th>Feature</th>
                              <th>Impact</th>
                              <th>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerShap.slice(0, 10).map((shap, idx) => (
                              <tr key={idx}>
                                <td>{shap.feature || shap.name}</td>
                                <td>
                                  <span className={`badge ${shap.value > 0 ? 'bg-danger' : 'bg-success'}`}>
                                    {shap.value > 0 ? '+' : ''}{shap.value?.toFixed(4)}
                                  </span>
                                </td>
                                <td className="text-muted small">{shap.customer_value || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handlePredictIndividualCustomer}
                disabled={loadingCustomer}
              >
                <MdPlayArrow className="me-2" />
                Run Prediction
              </button>
              <Link
                to={`/customers/${individualCustomer.customer_id || individualCustomer.id}`}
                className="btn btn-outline-primary"
              >
                <MdPerson className="me-2" />
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Prediction Configuration */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Bulk Prediction Configuration</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Segment Selection</label>
              <div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="segmentType"
                    id="all"
                    value="all"
                    checked={segmentType === 'all'}
                    onChange={(e) => setSegmentType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="all">
                    All Customers
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="segmentType"
                    id="custom"
                    value="custom"
                    checked={segmentType === 'custom'}
                    onChange={(e) => setSegmentType(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor="custom">
                    Custom Segment (Coming Soon)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunPrediction}
              disabled={processing}
            >
              <MdPlayArrow className="me-2" />
              {processing ? 'Processing...' : 'Run Bulk Predictions'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {processing && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="progress mb-2" style={{ height: '30px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: '100%' }}
              >
                Processing...
              </div>
            </div>
            <p className="text-center mb-0">
              <strong>Processing predictions...</strong> This may take several minutes. Please do not close this page.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {results && results.error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {results.error}
        </div>
      )}

      {/* Results */}
      {results && !results.error && (
        <>
          {/* Results Summary */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card">
                <div className="card-body text-center">
                  <h3 className="mb-1">{results.totalAnalyzed.toLocaleString()}</h3>
                  <p className="text-muted mb-0 small">Total Analyzed</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-warning">
                <div className="card-body text-center">
                  <h3 className="mb-1 text-warning">{results.predictedChurners.toLocaleString()}</h3>
                  <p className="text-muted mb-0 small">Predicted Churners</p>
                  <small className="text-muted">(Critical + High Risk)</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-info">
                <div className="card-body text-center">
                  <h3 className="mb-1">{results.avgChurnProb}%</h3>
                  <p className="text-muted mb-0 small">Avg Churn Probability</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card border-danger">
                <div className="card-body text-center">
                  <h3 className="mb-1">RWF {Math.round(results.totalAtRiskBalance / 1000000)}M</h3>
                  <p className="text-muted mb-0 small">At-Risk Balance</p>
                  <small className="text-muted">(Critical + High)</small>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Segmentation Table */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Risk Segmentation</h5>
              <div>
                <button 
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => handleExport('csv')}
                  title="Export all predictions to CSV"
                >
                  <MdDownload className="me-1" />
                  Export All (CSV)
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>Risk Level</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Avg Balance</th>
                      <th>Avg Churn Prob</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.segmentation).map(([level, data]) => (
                      data.count > 0 && (
                        <tr key={level}>
                          <td>
                            <span className={`badge ${
                              level === 'critical' ? 'bg-danger' :
                              level === 'high' ? 'bg-warning' :
                              level === 'medium' ? 'bg-info' : 'bg-success'
                            }`}>
                              {level.toUpperCase()}
                            </span>
                          </td>
                          <td>{data.count.toLocaleString()}</td>
                          <td>{data.percent}%</td>
                          <td>RWF {parseInt(data.avgBalance || 0).toLocaleString()}</td>
                          <td>{data.avgProb}%</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleViewCustomers(level)}
                              >
                                View Customers
                              </button>
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => handleExport('csv', level)}
                                title={`Export ${level} risk customers`}
                              >
                                <MdDownload />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Customer List View */}
          {showCustomerList && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  {selectedRiskLevel ? `${selectedRiskLevel.toUpperCase()} Risk Customers` : 'All Predicted Customers'}
                </h5>
                <div>
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={() => setShowCustomerList(false)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleExport('csv', selectedRiskLevel)}
                  >
                    <MdDownload className="me-1" />
                    Export
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Search and Filters */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <MdSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by customer ID, name, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <select
                      className="form-select"
                      value={selectedRiskLevel || ''}
                      onChange={(e) => setSelectedRiskLevel(e.target.value || null)}
                    >
                      <option value="">All Risk Levels</option>
                      <option value="critical">Critical (≥70%)</option>
                      <option value="high">High (50-70%)</option>
                      <option value="medium">Medium (40-50%)</option>
                      <option value="low">Low (&lt;40%)</option>
                    </select>
                  </div>
                </div>

                {/* Customer Table */}
                <div className="table-responsive">
                  <table className="table table-hover table-sm">
                    <thead>
                      <tr>
                        <th>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-white"
                            onClick={() => handleSort('customer_id')}
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Customer ID {sortBy === 'customer_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                        </th>
                        <th>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-white"
                            onClick={() => handleSort('customer_name')}
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Name {sortBy === 'customer_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                        </th>
                        <th>Email</th>
                        <th>Segment</th>
                        <th>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-white"
                            onClick={() => handleSort('churn_score')}
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Churn Score {sortBy === 'churn_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                        </th>
                        <th>Risk Level</th>
                        <th>
                          <button 
                            className="btn btn-link p-0 text-decoration-none text-white"
                            onClick={() => handleSort('account_balance')}
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Balance {sortBy === 'account_balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </button>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPredictions.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-3 text-muted">
                            No customers found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        sortedPredictions.map((pred) => (
                          <tr key={pred.customer_id}>
                            <td>{pred.customer_id || '-'}</td>
                            <td>{pred.customer_name || 'Unknown'}</td>
                            <td>{pred.email || '-'}</td>
                            <td>{pred.segment || '-'}</td>
                            <td>
                              <span className={`badge ${
                                (pred.churn_score || 0) >= 70 ? 'bg-danger' :
                                (pred.churn_score || 0) >= 50 ? 'bg-warning' :
                                (pred.churn_score || 0) >= 40 ? 'bg-info' : 'bg-success'
                              }`}>
                                {(pred.churn_score || 0).toFixed(1)}%
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                pred.risk_level === 'high' ? 'bg-danger' :
                                pred.risk_level === 'medium' ? 'bg-warning' : 'bg-success'
                              }`}>
                                {pred.risk_level || 'low'}
                              </span>
                            </td>
                            <td>RWF {(pred.account_balance || 0).toLocaleString()}</td>
                            <td>
                              <Link
                                to={`/customers/${pred.customer_id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <MdPerson className="me-1" />
                                View
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {sortedPredictions.length > 0 && (
                  <div className="mt-3 text-muted small">
                    Showing {sortedPredictions.length} of {predictions.length} customers
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!results && !processing && (
        <div className="card">
          <div className="card-body text-center py-5">
            <MdTrendingUp style={{ fontSize: '4rem', color: '#6c757d' }} className="mb-3" />
            <h5>No Predictions Yet</h5>
            <p className="text-muted">
              Run predictions on customer segments to identify which customers are most likely to churn.
              <br />
              You can then export target lists for retention campaigns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionInsights;

