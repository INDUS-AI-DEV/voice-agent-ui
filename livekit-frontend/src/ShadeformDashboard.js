import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Server, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Eye, EyeOff, Info, X } from 'lucide-react';

const ShadeformDashboard = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authTimestamp, setAuthTimestamp] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // New state for instance details modal
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [instanceDetails, setInstanceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  // Check authentication timeout
  useEffect(() => {
    if (isAuthenticated && authTimestamp) {
      const checkTimeout = () => {
        const hourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago
        if (authTimestamp < hourAgo) {
          setIsAuthenticated(false);
          setPin('');
          setAuthTimestamp(null);
          setInstances([]);
          setError('Session expired. Please authenticate again.');
        }
      };

      const interval = setInterval(checkTimeout, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authTimestamp]);

  const API_BASE = process.env.REACT_APP_SHADEFORM_API_URL || 'http://localhost:8000/shadeform';

  const apiRequest = async (endpoint, options = {}) => {
    if (!pin || pin.length !== 6) {
      throw new Error('Authentication required. Please enter your PIN.');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-PIN': pin,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle authentication failure
        setIsAuthenticated(false);
        setPin('');
        setAuthTimestamp(null);
        setInstances([]);
        throw new Error('Authentication failed. Please enter your PIN again.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiRequest('/auth/verify', {method: "POST"});
      setIsAuthenticated(true);
      setAuthTimestamp(Date.now());
      
      setSuccess('Authentication successful!');
      await fetchInstances();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = useCallback(async () => {
    if (!isAuthenticated || !pin || pin.length !== 6) {
      setError('Please authenticate first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/instances');
      const activeInstances = [
        ...data.starting_instances.map(i => ({ ...i, status: 'starting', type: 'starting' })),
        ...data.running_instances.map(i => ({ ...i, status: 'active', type: 'running' }))
      ];
      
      setInstances(activeInstances);
    } catch (err) {
      setError(`Failed to fetch instances: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [pin, isAuthenticated]);

  const fetchInstanceDetails = async (instanceId) => {
    setLoadingDetails(true);
    setDetailsError('');
    
    try {
      const response = await apiRequest(`/instances/${instanceId}`);
      setInstanceDetails(response);
    } catch (err) {
      setDetailsError(`Failed to fetch instance details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInstanceClick = async (instance) => {
    const instanceId = getInstanceId(instance);
    setSelectedInstance(instance);
    setInstanceDetails(null);
    setDetailsError('');
    await fetchInstanceDetails(instanceId);
  };

  const closeDetailsModal = () => {
    setSelectedInstance(null);
    setInstanceDetails(null);
    setDetailsError('');
  };

  const createInstance = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiRequest('/instances/create', {
        method: 'POST',
        body: JSON.stringify({}), // Using default configs
      });

      setSuccess(`Instance ${response.instance_id} created successfully!`);
      await fetchInstances();
    } catch (err) {
      setError(`Failed to create instance: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const deleteInstance = async (instanceId) => {
    setDeleteConfirm(instanceId);
  };

  const confirmDelete = async () => {
    const instanceId = deleteConfirm;
    setDeleteConfirm(null);
    setError('');
    setSuccess('');

    try {
      await apiRequest(`/instances/${instanceId}`, {
        method: 'DELETE',
        body: JSON.stringify({ force: true }),
      });

      setSuccess('Instance deleted successfully!');
      await fetchInstances();
    } catch (err) {
      setError(`Failed to delete instance: ${err.message}`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPin('');
    setAuthTimestamp(null);
    setInstances([]);
    setError('');
    setSuccess('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'starting':
        return <Clock style={{width: '16px', height: '16px', color: '#f59e0b', animation: 'spin 1s linear infinite'}} />;
      case 'active':
        return <CheckCircle style={{width: '16px', height: '16px', color: '#10b981'}} />;
      default:
        return <XCircle style={{width: '16px', height: '16px', color: '#ef4444'}} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'starting':
        return {backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d'};
      case 'active':
        return {backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7'};
      default:
        return {backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5'};
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getInstanceId = (instance) => {
    return instance.instance_id || instance.id || 'Unknown';
  };

  // Keyframes for animations
  const spinKeyframes = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #c7d2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif'
      }}>
        <style>{spinKeyframes}</style>
        <div style={{width: '100%', maxWidth: '28rem'}}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '1.5rem',
            padding: '2rem'
          }}>
            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '4rem',
                height: '4rem',
                backgroundColor: '#dbeafe',
                borderRadius: '50%',
                marginBottom: '1rem'
              }}>
                <Shield style={{width: '2rem', height: '2rem', color: '#2563eb'}} />
              </div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '0.5rem',
                margin: '0 0 0.5rem 0'
              }}>
                Shadeform Dashboard
              </h1>
              <p style={{color: '#64748b', margin: '0'}}>Enter your 6-digit PIN to continue</p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
              <div>
                <label htmlFor="pin" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  PIN
                </label>
                <div style={{position: 'relative'}}>
                  <input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) setPin(value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && pin.length === 6 && !loading) {
                        handlePinSubmit(e);
                      }
                    }}
                    placeholder="Enter 6-digit PIN"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontSize: '1.125rem',
                      textAlign: 'center',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      letterSpacing: '0.1em',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      opacity: loading ? '0.5' : '1',
                      cursor: loading ? 'not-allowed' : 'text',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#64748b'}
                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                  >
                    {showPin ? <EyeOff style={{width: '1.25rem', height: '1.25rem'}} /> : <Eye style={{width: '1.25rem', height: '1.25rem'}} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePinSubmit}
                disabled={loading || pin.length !== 6}
                style={{
                  width: '100%',
                  backgroundColor: loading || pin.length !== 6 ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: loading || pin.length !== 6 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading && pin.length === 6) {
                    e.target.style.backgroundColor = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && pin.length === 6) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw style={{width: '1rem', height: '1rem', animation: 'spin 1s linear infinite'}} />
                    Authenticating...
                  </>
                ) : (
                  'Authenticate'
                )}
              </button>
            </div>

            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #c7d2fe 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif'
    }}>
      <style>{spinKeyframes}</style>
      <div style={{maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem'}}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 0.25rem 0'
            }}>
              Shadeform Dashboard
            </h1>
            <p style={{color: '#64748b', margin: '0'}}>
              Manage your GPU instances
            </p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <button
              onClick={fetchInstances}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                color: '#64748b',
                background: 'none',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? '0.5' : '1'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.color = '#0f172a';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.color = '#64748b';
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <RefreshCw style={{
                width: '1rem', 
                height: '1rem',
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }} />
              Refresh
            </button>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                color: '#64748b',
                background: 'none',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#dc2626';
                e.target.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#64748b';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{marginBottom: '2rem'}}>
          <button
            onClick={createInstance}
            disabled={creating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: creating ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontWeight: '600',
              borderRadius: '0.75rem',
              border: 'none',
              cursor: creating ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              opacity: creating ? '0.5' : '1'
            }}
            onMouseEnter={(e) => {
              if (!creating) {
                e.target.style.backgroundColor = '#1d4ed8';
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!creating) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {creating ? (
              <RefreshCw style={{width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite'}} />
            ) : (
              <Plus style={{width: '1.25rem', height: '1.25rem'}} />
            )}
            Create Instance
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '0.75rem'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '0.75rem'
          }}>
            {success}
          </div>
        )}

        {/* Instances List */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          borderRadius: '1.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: 'rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#0f172a',
                margin: '0'
              }}>
                Active Instances
              </h2>
              <span style={{
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                {instances.length} instance{instances.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {loading && instances.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem',
              gap: '0.75rem'
            }}>
              <RefreshCw style={{
                width: '2rem', 
                height: '2rem', 
                color: '#94a3b8',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{color: '#64748b'}}>Loading instances...</span>
            </div>
          ) : instances.length === 0 ? (
            <div style={{textAlign: 'center', padding: '3rem'}}>
              <Server style={{width: '3rem', height: '3rem', color: '#cbd5e1', margin: '0 auto 1rem'}} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '500',
                color: '#0f172a',
                marginBottom: '0.5rem',
                margin: '0 0 0.5rem 0'
              }}>
                No active instances
              </h3>
              <p style={{color: '#64748b', margin: '0'}}>
                Create your first instance to get started
              </p>
            </div>
          ) : (
            <div>
              {instances.map((instance, index) => (
                <div 
                  key={getInstanceId(instance)} 
                  style={{
                    padding: '1.5rem',
                    borderTop: index > 0 ? '1px solid #e2e8f0' : 'none',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(248, 250, 252, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => handleInstanceClick(instance)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{flex: '1', minWidth: '200px'}}>
                      <div style={{display: 'flex', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem'}}>
                        {getStatusIcon(instance.status)}
                        <span style={{
                          fontWeight: '500',
                          color: '#0f172a'
                        }}>
                          {instance.name || getInstanceId(instance)}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid',
                          borderRadius: '9999px',
                          ...getStatusColor(instance.status)
                        }}>
                          {instance.status}
                        </span>
                        <Info style={{width: '1rem', height: '1rem', color: '#64748b'}} />
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        color: '#64748b',
                        gap: '1.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'}}>
                          ID: {getInstanceId(instance)}
                        </span>
                        {instance.region && <span>Region: {instance.region}</span>}
                        {instance.created_at && (
                          <span>Created: {formatDate(instance.created_at)}</span>
                        )}
                      </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteInstance(getInstanceId(instance));
                        }}
                        style={{
                          padding: '0.5rem',
                          color: '#9ca3af',
                          background: 'none',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#dc2626';
                          e.target.style.backgroundColor = '#fef2f2';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#9ca3af';
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        title="Delete instance"
                      >
                        <Trash2 style={{width: '1rem', height: '1rem'}} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instance Details Modal */}
        {selectedInstance && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: '50'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '48rem',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    margin: '0 0 0.25rem 0'
                  }}>
                    Instance Details
                  </h3>
                  <p style={{
                    color: '#64748b',
                    margin: '0',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                  }}>
                    {getInstanceId(selectedInstance)}
                  </p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  style={{
                    padding: '0.5rem',
                    color: '#9ca3af',
                    background: 'none',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#64748b';
                    e.target.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#9ca3af';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <X style={{width: '1.25rem', height: '1.25rem'}} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{
                flex: '1',
                overflow: 'auto',
                padding: '1.5rem'
              }}>
                {loadingDetails ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    gap: '0.75rem'
                  }}>
                    <RefreshCw style={{
                      width: '2rem', 
                      height: '2rem', 
                      color: '#94a3b8',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{color: '#64748b'}}>Loading instance details...</span>
                  </div>
                ) : detailsError ? (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    borderRadius: '0.75rem',
                    textAlign: 'center'
                  }}>
                    {detailsError}
                  </div>
                ) : instanceDetails ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                    {/* Status and Basic Info */}
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem'}}>
                        {getStatusIcon(instanceDetails.status)}
                        <span style={{
                          fontWeight: '600',
                          color: '#0f172a',
                          fontSize: '1.125rem'
                        }}>
                          Status: {instanceDetails.status}
                        </span>
                      </div>
                      <p style={{color: '#64748b', margin: '0', fontSize: '0.875rem'}}>
                        {instanceDetails.message}
                      </p>
                    </div>

                    {/* Database Information */}
                    {instanceDetails.details?.database_info && (
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#0f172a',
                          margin: '0 0 0.75rem 0'
                        }}>
                          Database Information
                        </h4>
                        <div style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          padding: '1rem'
                        }}>
                          <pre style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                            fontSize: '0.75rem',
                            color: '#374151',
                            margin: '0',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            maxHeight: '200px',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(instanceDetails.details.database_info, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* API Information */}
                    {instanceDetails.details?.api_info && (
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#0f172a',
                          margin: '0 0 0.75rem 0'
                        }}>
                          Live API Information
                        </h4>
                        <div style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.75rem',
                          padding: '1rem'
                        }}>
                          <pre style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                            fontSize: '0.75rem',
                            color: '#374151',
                            margin: '0',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            maxHeight: '200px',
                            overflow: 'auto'
                          }}>
                            {JSON.stringify(instanceDetails.details.api_info, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: '#fefce8',
                      border: '1px solid #fde047',
                      borderRadius: '0.75rem'
                    }}>
                      <div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: '#92400e',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Collection
                        </span>
                        <p style={{
                          margin: '0.25rem 0 0 0',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                          fontSize: '0.875rem',
                          color: '#0f172a'
                        }}>
                          {instanceDetails.details?.collection || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: '#92400e',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          Last Updated
                        </span>
                        <p style={{
                          margin: '0.25rem 0 0 0',
                          fontSize: '0.875rem',
                          color: '#0f172a'
                        }}>
                          {instanceDetails.details?.last_updated ? 
                            formatDate(instanceDetails.details.last_updated) : 
                            'Unknown'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Raw Response (Collapsible) */}
                    <details style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      overflow: 'hidden'
                    }}>
                      <summary style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        fontWeight: '500',
                        color: '#374151',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        Raw API Response
                      </summary>
                      <div style={{padding: '1rem'}}>
                        <pre style={{
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                          fontSize: '0.75rem',
                          color: '#374151',
                          margin: '0',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          maxHeight: '300px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(instanceDetails, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
                  <button
                    onClick={() => fetchInstanceDetails(getInstanceId(selectedInstance))}
                    disabled={loadingDetails}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: '#64748b',
                      background: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: loadingDetails ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: loadingDetails ? '0.5' : '1'
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingDetails) {
                        e.target.style.color = '#0f172a';
                        e.target.style.backgroundColor = '#f1f5f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingDetails) {
                        e.target.style.color = '#64748b';
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <RefreshCw style={{
                      width: '1rem', 
                      height: '1rem',
                      animation: loadingDetails ? 'spin 1s linear infinite' : 'none'
                    }} />
                    Refresh
                  </button>
                  <button
                    onClick={closeDetailsModal}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#2563eb';
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: '50'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '28rem',
              width: '100%',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '0.5rem',
                margin: '0 0 0.5rem 0'
              }}>
                Delete Instance
              </h3>
              <p style={{color: '#64748b', marginBottom: '1.5rem', margin: '0 0 1.5rem 0'}}>
                Are you sure you want to delete this instance? This action cannot be undone.
              </p>
              <div style={{
                marginBottom: '1.5rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem'
              }}>
                <span style={{fontSize: '0.875rem', color: '#64748b'}}>Instance ID: </span>
                <span style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '0.875rem',
                  color: '#0f172a'
                }}>
                  {deleteConfirm}
                </span>
              </div>
              <div style={{display: 'flex', gap: '0.75rem'}}>
                <button
                  onClick={cancelDelete}
                  style={{
                    flex: '1',
                    padding: '0.5rem 1rem',
                    color: '#64748b',
                    background: 'none',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#0f172a';
                    e.target.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#64748b';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: '1',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#dc2626';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShadeformDashboard;
