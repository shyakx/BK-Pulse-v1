import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MdPeople, MdPerson, MdArrowForward, MdTrendingUp, MdWarning, MdCheckCircle } from 'react-icons/md';
import api from '../services/api';

const Team = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberActivities, setMemberActivities] = useState(null);
  const [memberCustomers, setMemberCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberData(selectedMember.id);
    }
  }, [selectedMember]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.getTeam();
      if (response.success) {
        setTeam(response.team);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
      alert('Failed to fetch team data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberData = async (memberId) => {
    try {
      setActivitiesLoading(true);
      const [activitiesResponse, customersResponse] = await Promise.all([
        api.getTeamActivities(memberId),
        api.getTeamCustomers(memberId, { limit: 10 })
      ]);

      if (activitiesResponse.success) {
        setMemberActivities(activitiesResponse.activities);
      }
      if (customersResponse.success) {
        setMemberCustomers(customersResponse.customers);
      }
    } catch (err) {
      console.error('Error fetching member data:', err);
    } finally {
      setActivitiesLoading(false);
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Team / Customer Oversight</h2>
          <p className="text-muted mb-0">View Officer and Analyst activities, drill down to individual customers or segments</p>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Total Team Members</p>
                  <h3 className="mb-0">{team.length}</h3>
                </div>
                <MdPeople className="text-primary" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Total Customers Assigned</p>
                  <h3 className="mb-0">
                    {team.reduce((sum, member) => sum + member.assignedCustomers, 0)}
                  </h3>
                </div>
                <MdPerson className="text-info" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">High Risk Cases</p>
                  <h3 className="mb-0 text-danger">
                    {team.reduce((sum, member) => sum + member.highRiskCustomers, 0)}
                  </h3>
                </div>
                <MdWarning className="text-danger" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Completed Tasks</p>
                  <h3 className="mb-0 text-success">
                    {team.reduce((sum, member) => sum + member.completedTasks, 0)}
                  </h3>
                </div>
                <MdCheckCircle className="text-success" style={{ fontSize: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Team Members List */}
        <div className="col-lg-5 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Team Members</h5>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {team.length === 0 ? (
                  <div className="p-4 text-center text-muted">No team members found</div>
                ) : (
                  team.map((member) => (
                    <button
                      key={member.id}
                      className={`list-group-item list-group-item-action ${
                        selectedMember?.id === member.id ? 'active' : ''
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{member.name}</h6>
                          <small className="text-muted">{member.role}</small>
                          <div className="mt-2">
                            <span className="badge bg-primary me-1">{member.assignedCustomers} Customers</span>
                            <span className="badge bg-warning me-1">{member.pendingTasks} Pending</span>
                            <span className="badge bg-success">{member.completedTasks} Completed</span>
                          </div>
                        </div>
                        <MdArrowForward />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Member Details */}
        <div className="col-lg-7 mb-4">
          {selectedMember ? (
            <div>
              {/* Member Stats */}
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">{selectedMember.name} - Overview</h5>
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-3">
                      <div>
                        <h4 className="mb-0">{selectedMember.assignedCustomers}</h4>
                        <small className="text-muted">Assigned</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div>
                        <h4 className="mb-0 text-danger">{selectedMember.highRiskCustomers}</h4>
                        <small className="text-muted">High Risk</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div>
                        <h4 className="mb-0">{selectedMember.retentionRate}%</h4>
                        <small className="text-muted">Retention Rate</small>
                      </div>
                    </div>
                    <div className="col-3">
                      <div>
                        <h4 className="mb-0">{selectedMember.notesCount}</h4>
                        <small className="text-muted">Notes</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Customers */}
              <div className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Assigned Customers</h5>
                  <Link to={`/customers?officer=${selectedMember.id}`} className="btn btn-sm btn-outline-primary">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {activitiesLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : memberCustomers.length === 0 ? (
                    <p className="text-muted text-center mb-0">No customers assigned</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Customer ID</th>
                            <th>Name</th>
                            <th>Risk</th>
                            <th>Churn Score</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberCustomers.map((customer) => (
                            <tr key={customer.id}>
                              <td>{customer.customer_id}</td>
                              <td>
                                <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
                              </td>
                              <td>
                                <span className={`badge ${
                                  customer.risk_level === 'high' ? 'bg-danger' :
                                  customer.risk_level === 'medium' ? 'bg-warning' : 'bg-success'
                                }`}>
                                  {customer.risk_level}
                                </span>
                              </td>
                              <td>{customer.churn_score.toFixed(1)}%</td>
                              <td>
                                <Link to={`/customers/${customer.id}`} className="btn btn-sm btn-outline-primary">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Recent Activities</h5>
                </div>
                <div className="card-body">
                  {activitiesLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : memberActivities ? (
                    <div>
                      <h6 className="small text-muted mb-2">Recent Actions</h6>
                      {memberActivities.actions.slice(0, 5).map((action) => (
                        <div key={action.id} className="mb-2 p-2 bg-light rounded">
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold">{action.type}</span>
                            <span className={`badge ${
                              action.status === 'completed' ? 'bg-success' :
                              action.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {action.status}
                            </span>
                          </div>
                          {action.customer_name && (
                            <small className="text-muted">
                              Customer: <Link to={`/customers/${action.customer_id}`}>{action.customer_name}</Link>
                            </small>
                          )}
                        </div>
                      ))}
                      <h6 className="small text-muted mb-2 mt-3">Recent Notes</h6>
                      {memberActivities.notes.slice(0, 5).map((note) => (
                        <div key={note.id} className="mb-2 p-2 bg-light rounded">
                          <div className="d-flex justify-content-between">
                            <span className="small">{note.note.substring(0, 80)}...</span>
                            <span className={`badge ${
                              note.status === 'resolved' ? 'bg-success' : 'bg-info'
                            }`}>
                              {note.status}
                            </span>
                          </div>
                          {note.customer_name && (
                            <small className="text-muted">
                              Customer: <Link to={`/customers/${note.customer_id}`}>{note.customer_name}</Link>
                            </small>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center mb-0">No recent activities</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-5">
                <MdPeople className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                <p className="text-muted">Select a team member to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Team;
