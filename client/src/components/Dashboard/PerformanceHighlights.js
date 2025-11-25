import React from 'react';
import { MdTrendingUp, MdCheckCircle, MdAttachMoney } from 'react-icons/md';

const PerformanceHighlights = ({ performance }) => {
  const { reactivationsThisMonth = 0, conversionRate = 0, earningsSaved = 0 } = performance || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bk-card">
      <div className="bk-card-header">
        <h5 className="fw-bold mb-0">Performance Highlights</h5>
      </div>
      <div className="bk-card-body">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="text-center p-3 bg-success bg-opacity-10 rounded h-100">
              <MdTrendingUp className="text-success mb-2" size={32} />
              <h3 className="mb-1 fw-bold">{reactivationsThisMonth}</h3>
              <p className="mb-0 text-muted small">Reactivations This Month</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="text-center p-3 bg-primary bg-opacity-10 rounded h-100">
              <MdCheckCircle className="text-primary mb-2" size={32} />
              <h3 className="mb-1 fw-bold">{conversionRate}%</h3>
              <p className="mb-0 text-muted small">Conversion Rate</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="text-center p-3 bg-info bg-opacity-10 rounded h-100">
              <MdAttachMoney className="text-info mb-2" size={32} />
              <h3 className="mb-1 fw-bold">{formatCurrency(earningsSaved)}</h3>
              <p className="mb-0 text-muted small">Earnings Saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceHighlights;

