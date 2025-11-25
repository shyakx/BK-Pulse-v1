import React from 'react';
import { MdTimer, MdTimerOff, MdBlock } from 'react-icons/md';

const ActivityOverview = ({ activityOverview }) => {
  const { inactive30 = 0, inactive60 = 0, inactive90 = 0, inactive180 = 0, dormantCases = 0 } = activityOverview || {};

  return (
    <div className="bk-card">
      <div className="bk-card-header">
        <h5 className="fw-bold mb-0">Customer Activity Overview</h5>
      </div>
      <div className="bk-card-body">
        <div className="row g-3">
          <div className="col-6 col-md-4">
            <div className="text-center p-3 bg-info bg-opacity-10 rounded">
              <MdTimer className="text-info mb-2" size={28} />
              <h4 className="mb-0 fw-bold">{inactive30}</h4>
              <small className="text-muted">Inactive 30 days</small>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
              <MdTimer className="text-warning mb-2" size={28} />
              <h4 className="mb-0 fw-bold">{inactive60}</h4>
              <small className="text-muted">Inactive 60 days</small>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
              <MdTimerOff className="text-danger mb-2" size={28} />
              <h4 className="mb-0 fw-bold">{inactive90}</h4>
              <small className="text-muted">Inactive 90 days</small>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
              <MdTimerOff className="text-danger mb-2" size={28} />
              <h4 className="mb-0 fw-bold">{inactive180}</h4>
              <small className="text-muted">Inactive 180 days</small>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="text-center p-3 bg-dark bg-opacity-10 rounded">
              <MdBlock className="text-dark mb-2" size={28} />
              <h4 className="mb-0 fw-bold">{dormantCases}</h4>
              <small className="text-muted">Dormant Cases</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityOverview;

