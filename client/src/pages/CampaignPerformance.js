import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdDownload, MdArrowBack } from 'react-icons/md';
import api from '../services/api';

const CampaignPerformance = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [campaignCustomers, setCampaignCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);

  useEffect(() => {
    fetchCampaignPerformance();
    fetchCampaignCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: fetchCampaignPerformance and fetchCampaignCustomers are stable functions, only id should trigger refetch
  }, [id]);

  const fetchCampaignPerformance = async () => {
    try {
      setLoading(true);
      
      // Fetch both campaign details and performance
      const [campaignResponse, performanceResponse] = await Promise.all([
        api.getCampaign(id),
        api.getCampaignPerformance(id)
      ]);

      if (campaignResponse.success && campaignResponse.campaign) {
        const campaign = campaignResponse.campaign;
        const perf = performanceResponse.success ? performanceResponse.performance : null;

        // Calculate ROI: ((Revenue - Cost) / Cost) * 100
        // If no revenue data, estimate based on retained customers' average balance
        const budget = parseFloat(campaign.budget) || parseFloat(campaign.allocated_budget) || 0;
        const retained = campaign.converted_count || perf?.summary?.converted || 0;
        
        // Calculate total revenue from daily metrics if available
        let totalRevenue = 0;
        if (perf?.daily_metrics && perf.daily_metrics.length > 0) {
          totalRevenue = perf.daily_metrics.reduce((sum, day) => sum + (parseFloat(day.revenue) || 0), 0);
        }
        
        // If no revenue data, estimate: assume each retained customer has average balance
        // This is a conservative estimate - in production, use actual revenue data
        if (totalRevenue === 0 && retained > 0) {
          // Estimate: average customer balance * retention rate
          // Using a conservative estimate of 500,000 RWF per retained customer
          totalRevenue = retained * 500000;
        }
        
        let roi = 0;
        if (budget > 0) {
          roi = ((totalRevenue - budget) / budget) * 100;
        } else if (totalRevenue > 0) {
          // If no budget set, ROI is infinite (100%+)
          roi = 100;
        }

        setCampaign({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          targeted: campaign.target_count || 0,
          contacted: perf?.summary?.contacted || 0,
          responded: perf?.summary?.responded || 0,
          retained: retained,
          response_rate: perf?.summary?.response_rate || 0,
          retention_rate: perf?.summary?.conversion_rate || 0,
          roi: roi,
          budget: budget,
          revenue: totalRevenue,
          cost_per_conversion: perf?.summary?.cost_per_conversion || (budget > 0 && retained > 0 ? budget / retained : 0),
          start_date: campaign.start_date || new Date().toISOString(),
          end_date: campaign.end_date || null,
          status: campaign.status,
          daily_metrics: perf?.daily_metrics || []
        });
      } else {
        throw new Error(campaignResponse.message || 'Campaign not found');
      }
    } catch (err) {
      console.error('Error fetching campaign performance:', err);
      alert('Failed to fetch campaign performance: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignCustomers = async () => {
    try {
      setCustomersLoading(true);
      const response = await api.getCampaignCustomers(id, { limit: 100 });
      
      if (response.success && response.customers) {
        setCampaignCustomers(response.customers);
      }
    } catch (err) {
      console.error('Error fetching campaign customers:', err);
      setCampaignCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="alert alert-warning">
        Campaign not found
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/campaigns" className="btn btn-outline-secondary">
            <MdArrowBack className="me-2" />
            Back
          </Link>
          <div>
            <h2 className="fw-bold mb-1">{campaign.name}</h2>
            <p className="text-muted mb-0">Campaign Performance Metrics</p>
          </div>
        </div>
        <button className="btn btn-primary">
          <MdDownload className="me-2" />
          Export Report
        </button>
      </div>

      {/* Campaign Overview Cards */}
      <div className="row mb-4">
        <div className="col-md-2 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="mb-1">{campaign.targeted.toLocaleString()}</h3>
              <p className="text-muted mb-0 small">Targeted</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="mb-1">{campaign.contacted.toLocaleString()}</h3>
              <p className="text-muted mb-0 small">Contacted</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="mb-1 text-success">{campaign.response_rate.toFixed(1)}%</h3>
              <p className="text-muted mb-0 small">Response Rate</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="mb-1 text-primary">{campaign.retention_rate.toFixed(1)}%</h3>
              <p className="text-muted mb-0 small">Retention Rate</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className={`mb-1 ${campaign.roi >= 0 ? 'text-success' : 'text-danger'}`}>
                {campaign.roi.toFixed(1)}%
              </h3>
              <p className="text-muted mb-0 small">ROI</p>
            </div>
          </div>
        </div>
        <div className="col-md-2 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="mb-1">{campaign.retained.toLocaleString()}</h3>
              <p className="text-muted mb-0 small">Retained</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {(campaign.budget > 0 || campaign.revenue > 0) && (
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="text-muted mb-2">Budget</h6>
                <h4 className="mb-0">RWF {campaign.budget.toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="text-muted mb-2">Revenue Generated</h6>
                <h4 className="mb-0 text-success">RWF {campaign.revenue.toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="text-muted mb-2">Cost per Conversion</h6>
                <h4 className="mb-0">RWF {campaign.cost_per_conversion.toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Chart */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Conversion Funnel</h5>
        </div>
        <div className="card-body">
          <div className="text-center py-5">
            <p className="text-muted">Funnel visualization will be displayed here</p>
            <div className="d-flex justify-content-around mt-4">
              <div>
                <div className="rounded bg-primary text-white p-3 mb-2">Targeted<br />{campaign.targeted}</div>
              </div>
              <div>→</div>
              <div>
                <div className="rounded bg-info text-white p-3 mb-2">Contacted<br />{campaign.contacted}</div>
              </div>
              <div>→</div>
              <div>
                <div className="rounded bg-warning text-white p-3 mb-2">Responded<br />{campaign.responded}</div>
              </div>
              <div>→</div>
              <div>
                <div className="rounded bg-success text-white p-3 mb-2">Retained<br />{campaign.retained}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Conversion by Channel</h5>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <p className="text-muted">Chart visualization will be displayed here</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Response Time Distribution</h5>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <p className="text-muted">Chart visualization will be displayed here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Campaign Customers</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Contact Date</th>
                  <th>Channel</th>
                  <th>Response</th>
                  <th>Status</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {customersLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : campaignCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No customers targeted in this campaign yet
                    </td>
                  </tr>
                ) : (
                  campaignCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link to={`/customers/${customer.id}`}>
                          {customer.customer_id}
                        </Link>
                      </td>
                      <td>{customer.contacted_at ? new Date(customer.contacted_at).toLocaleDateString() : 'Not contacted'}</td>
                      <td>
                        {customer.status === 'contacted' || customer.status === 'responded' || customer.status === 'converted' 
                          ? 'Phone' 
                          : 'Pending'}
                      </td>
                      <td>
                        {customer.status === 'responded' || customer.status === 'converted' 
                          ? 'Yes' 
                          : customer.status === 'contacted' 
                          ? 'No' 
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`badge ${
                          customer.status === 'converted' ? 'bg-success' :
                          customer.status === 'responded' ? 'bg-info' :
                          customer.status === 'contacted' ? 'bg-warning' :
                          customer.status === 'rejected' ? 'bg-danger' :
                          'bg-secondary'
                        }`}>
                          {customer.status}
                        </span>
                      </td>
                      <td>{customer.outcome || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPerformance;

