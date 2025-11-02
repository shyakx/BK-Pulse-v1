import React, { useState } from 'react';
import { MdFilterList, MdClear } from 'react-icons/md';

const FilterSidebar = ({ onFilter, onClear }) => {
  const [filters, setFilters] = useState({
    segment: '',
    riskLevel: '',
    branch: '',
    minBalance: '',
    maxBalance: '',
    minChurnScore: '',
    maxChurnScore: ''
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilter && onFilter(newFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      segment: '',
      riskLevel: '',
      branch: '',
      minBalance: '',
      maxBalance: '',
      minChurnScore: '',
      maxChurnScore: ''
    };
    setFilters(clearedFilters);
    onClear && onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bk-card">
      <div className="bk-card-header d-flex align-items-center justify-content-between">
        <h6 className="fw-bold mb-0">
          <MdFilterList className="me-2" />
          Filters
        </h6>
        {hasActiveFilters && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleClear}
            title="Clear all filters"
          >
            <MdClear />
          </button>
        )}
      </div>
      
      <div className="bk-card-body">
        <form>
          {/* Segment Filter */}
          <div className="mb-3">
            <label className="form-label small fw-medium">Segment</label>
            <select
              className="form-select form-select-sm"
              value={filters.segment}
              onChange={(e) => handleFilterChange('segment', e.target.value)}
            >
              <option value="">All Segments</option>
              <option value="retail">Retail</option>
              <option value="sme">SME</option>
              <option value="corporate">Corporate</option>
              <option value="institutional_banking">Institutional Banking</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="mb-3">
            <label className="form-label small fw-medium">Risk Level</label>
            <select
              className="form-select form-select-sm"
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
            >
              <option value="">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="mb-3">
            <label className="form-label small fw-medium">Branch</label>
            <select
              className="form-select form-select-sm"
              value={filters.branch}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="Kigali Main">Kigali Main</option>
              <option value="Nyarugenge">Nyarugenge</option>
              <option value="Kimisagara">Kimisagara</option>
              <option value="Kacyiru">Kacyiru</option>
              <option value="Remera">Remera</option>
            </select>
          </div>

          {/* Balance Range */}
          <div className="mb-3">
            <label className="form-label small fw-medium">Account Balance</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min"
                  value={filters.minBalance}
                  onChange={(e) => handleFilterChange('minBalance', e.target.value)}
                />
              </div>
              <div className="col-6">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max"
                  value={filters.maxBalance}
                  onChange={(e) => handleFilterChange('maxBalance', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Churn Score Range */}
          <div className="mb-3">
            <label className="form-label small fw-medium">Churn Score</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Min %"
                  min="0"
                  max="100"
                  value={filters.minChurnScore}
                  onChange={(e) => handleFilterChange('minChurnScore', e.target.value)}
                />
              </div>
              <div className="col-6">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Max %"
                  min="0"
                  max="100"
                  value={filters.maxChurnScore}
                  onChange={(e) => handleFilterChange('maxChurnScore', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mb-3">
            <label className="form-label small fw-medium">Quick Filters</label>
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  handleFilterChange('riskLevel', 'high');
                  handleFilterChange('minChurnScore', '70');
                }}
              >
                High Risk Only
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={() => {
                  handleFilterChange('riskLevel', 'medium');
                  handleFilterChange('minChurnScore', '40');
                  handleFilterChange('maxChurnScore', '70');
                }}
              >
                Medium Risk
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() => {
                  handleFilterChange('riskLevel', 'low');
                  handleFilterChange('maxChurnScore', '40');
                }}
              >
                Low Risk
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilterSidebar;

