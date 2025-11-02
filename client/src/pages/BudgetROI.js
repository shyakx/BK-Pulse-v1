import React, { useState, useEffect } from 'react';
import { MdAttachMoney, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import api from '../services/api';

const BudgetROI = () => {
  const [budget, setBudget] = useState(null);
  const [roi, setRoi] = useState(null);

  useEffect(() => {
    fetchBudgetROI();
  }, []);

  const fetchBudgetROI = async () => {
    try {
      const response = await api.getBudgetROI();

      if (response.success && response.budget_roi) {
        const data = response.budget_roi.summary;
        
        setBudget({
          total: data.total_budget || 0,
          spent: data.total_allocated || 0,
          remaining: (data.total_budget || 0) - (data.total_allocated || 0),
          forecast: data.total_budget || 0
        });

        setRoi({
          retentionCostPerCustomer: data.cost_per_conversion || 0,
          savedRevenue: data.total_revenue || 0,
          netBenefit: (data.total_revenue || 0) - (data.total_budget || 0),
          overallROI: data.overall_roi || 0,
          totalConversions: data.total_conversions || 0,
          roiByCampaign: response.budget_roi.campaigns || []
        });
      } else {
        throw new Error(response.message || 'Failed to fetch budget ROI');
      }
    } catch (err) {
      console.error('Error fetching budget ROI:', err);
      alert('Failed to fetch budget ROI: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (amount) => {
    return `RWF ${Math.round(amount / 1000000)}M`;
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">Budget & ROI</h2>
          <p className="text-muted mb-0">Financial oversight with budget tracking and ROI analysis</p>
        </div>
      </div>

      {/* Budget Dashboard */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Budget Dashboard</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <MdAttachMoney className="text-primary mb-2" style={{ fontSize: '2rem' }} />
                  <h4>{budget && formatCurrency(budget.total)}</h4>
                  <p className="text-muted small mb-0">Total Budget</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <MdTrendingDown className="text-warning mb-2" style={{ fontSize: '2rem' }} />
                  <h4>{budget && formatCurrency(budget.spent)}</h4>
                  <p className="text-muted small mb-0">Spent</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <MdTrendingUp className="text-success mb-2" style={{ fontSize: '2rem' }} />
                  <h4>{budget && formatCurrency(budget.remaining)}</h4>
                  <p className="text-muted small mb-0">Remaining</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <p className="text-muted small mb-1">Forecast</p>
                  <h4>{budget && formatCurrency(budget.forecast)}</h4>
                  <p className="text-muted small mb-0">End of Period</p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-2">
              <span>Budget Utilization</span>
              <span>{budget && Math.round((budget.spent / budget.total) * 100)}%</span>
            </div>
            <div className="progress" style={{ height: '30px' }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${budget ? (budget.spent / budget.total) * 100 : 0}%` }}
              >
                {budget && Math.round((budget.spent / budget.total) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">ROI Analysis</h5>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <h5 className="text-muted">{roi && `RWF ${Math.round(roi.retentionCostPerCustomer).toLocaleString()}`}</h5>
                <p className="text-muted small mb-0">Retention Cost per Customer</p>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <h5 className="text-success">{roi && formatCurrency(roi.savedRevenue)}</h5>
                <p className="text-muted small mb-0">Saved Revenue</p>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <h5 className="text-warning">{budget && formatCurrency(budget.spent)}</h5>
                <p className="text-muted small mb-0">Total Cost</p>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="text-center">
                <h5 className="text-primary">{roi && formatCurrency(roi.netBenefit)}</h5>
                <p className="text-muted small mb-0">Net Benefit</p>
              </div>
            </div>
          </div>

          {/* ROI by Campaign */}
          {roi && roi.roiByCampaign.length > 0 && (
            <div>
              <h6 className="mb-3">ROI by Campaign</h6>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th>ROI</th>
                      <th>Saved Revenue</th>
                      <th>Cost</th>
                      <th>Net Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roi.roiByCampaign.map((campaign, index) => (
                      <tr key={index}>
                        <td>{campaign.name}</td>
                        <td>
                          <span className="badge bg-success">{campaign.roi.toFixed(1)}x</span>
                        </td>
                        <td>{formatCurrency(campaign.saved)}</td>
                        <td>{formatCurrency(campaign.cost)}</td>
                        <td className="text-success">
                          {formatCurrency(campaign.saved - campaign.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cost-Benefit Analysis */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Cost-Benefit Analysis</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card bg-light">
                <div className="card-body">
                  <h6>Intervention Costs</h6>
                  <ul className="list-unstyled mt-3">
                    <li className="mb-2">
                      <span className="text-muted">Campaign Execution:</span>
                      <span className="float-end fw-bold">{budget && formatCurrency(budget.spent * 0.7)}</span>
                    </li>
                    <li className="mb-2">
                      <span className="text-muted">Incentives & Offers:</span>
                      <span className="float-end fw-bold">{budget && formatCurrency(budget.spent * 0.3)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card bg-light">
                <div className="card-body">
                  <h6>Churn Costs (Avoided)</h6>
                  <ul className="list-unstyled mt-3">
                    <li className="mb-2">
                      <span className="text-muted">Lost Revenue:</span>
                      <span className="float-end fw-bold text-danger">{roi && formatCurrency(roi.savedRevenue * 0.8)}</span>
                    </li>
                    <li className="mb-2">
                      <span className="text-muted">Acquisition Costs:</span>
                      <span className="float-end fw-bold text-danger">{roi && formatCurrency(roi.savedRevenue * 0.2)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="card border-primary">
              <div className="card-body text-center">
                <h5 className="text-primary mb-2">Break-even Analysis</h5>
                <p className="mb-0">
                  Break-even point: <strong>{budget && Math.round((budget.spent / (roi?.savedRevenue || 1)) * 100)}%</strong> retention rate required
                </p>
                <p className="text-success mt-2 mb-0">
                  Current performance: <strong>+{roi && Math.round((roi.netBenefit / budget?.spent || 0) * 100)}%</strong> above break-even
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetROI;

