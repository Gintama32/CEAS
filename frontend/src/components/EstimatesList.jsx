import React, { useState, useEffect } from 'react';

const EstimatesList = () => {
    const [estimates, setEstimates] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock data for prototype
    const mockEstimates = [
        {
            id: '1',
            project_name: 'Office Building Renovation',
            client_name: 'ABC Corporation',
            project_location: 'Downtown, NY',
            estimate_date: '2024-01-15',
            prepared_by: 'John Smith',
            total_material: 45000,
            total_labor: 35000,
            total_amount: 80000,
            status: 'approved',
            created_at: '2024-01-15T10:30:00Z'
        },
        {
            id: '2',
            project_name: 'Residential Kitchen Remodel',
            client_name: 'Jane Doe',
            project_location: 'Suburban, CA',
            estimate_date: '2024-01-20',
            prepared_by: 'Sarah Johnson',
            total_material: 15000,
            total_labor: 12000,
            total_amount: 27000,
            status: 'draft',
            created_at: '2024-01-20T14:15:00Z'
        },
        {
            id: '3',
            project_name: 'Commercial Storefront',
            client_name: 'Retail Plus Inc',
            project_location: 'Mall District, TX',
            estimate_date: '2024-01-25',
            prepared_by: 'Mike Wilson',
            total_material: 25000,
            total_labor: 18000,
            total_amount: 43000,
            status: 'sent',
            created_at: '2024-01-25T09:45:00Z'
        }
    ];

    useEffect(() => {
        loadEstimates();
    }, []);

    const loadEstimates = async () => {
        setLoading(true);
        try {
            // For prototype, use mock data
            // In real app, this would be: const response = await fetch("http://localhost:8000/api/v1/estimates");
            setTimeout(() => {
                setEstimates(mockEstimates);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error loading estimates:", error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#28a745';
            case 'sent': return '#007bff';
            case 'draft': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return '✅ Approved';
            case 'sent': return '📤 Sent';
            case 'draft': return '📝 Draft';
            default: return '❓ Unknown';
        }
    };

    const exportToExcel = (estimateId) => {
        // Mock export functionality
        alert(`Exporting estimate ${estimateId} to Excel... (This is a prototype)`);
    };

    const viewEstimate = (estimateId) => {
        // Mock view functionality
        alert(`Viewing estimate ${estimateId}... (This is a prototype)`);
    };

    const editEstimate = (estimateId) => {
        // Mock edit functionality
        alert(`Editing estimate ${estimateId}... (This is a prototype)`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                <p>Loading estimates...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0', color: '#333' }}>💰 Past Estimates ({estimates.length})</h3>
                <button
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ➕ Create New Estimate
                </button>
            </div>

            {estimates.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
                    <h4 style={{ color: '#666', marginBottom: '10px' }}>No estimates found</h4>
                    <p style={{ color: '#999' }}>Create your first estimate to get started</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {estimates.map((estimate) => (
                        <div
                            key={estimate.id}
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '20px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                        <h4 style={{ margin: '0 10px 0 0', color: '#333' }}>{estimate.project_name}</h4>
                                        <span
                                            style={{
                                                backgroundColor: getStatusColor(estimate.status),
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {getStatusText(estimate.status)}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <strong style={{ color: '#666' }}>Client:</strong>
                                            <p style={{ margin: '2px 0 0 0', color: '#333' }}>{estimate.client_name}</p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666' }}>Location:</strong>
                                            <p style={{ margin: '2px 0 0 0', color: '#333' }}>{estimate.project_location}</p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666' }}>Prepared By:</strong>
                                            <p style={{ margin: '2px 0 0 0', color: '#333' }}>{estimate.prepared_by}</p>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#666' }}>Date:</strong>
                                            <p style={{ margin: '2px 0 0 0', color: '#333' }}>
                                                {new Date(estimate.estimate_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(3, 1fr)', 
                                        gap: '20px',
                                        backgroundColor: '#f8f9fa',
                                        padding: '15px',
                                        borderRadius: '6px'
                                    }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>MATERIAL</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                                                ${estimate.total_material?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>LABOR</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                                                ${estimate.total_labor?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>TOTAL</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                                                ${estimate.total_amount?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                                    <button
                                        onClick={() => viewEstimate(estimate.id)}
                                        style={{
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        👁️ View
                                    </button>
                                    <button
                                        onClick={() => editEstimate(estimate.id)}
                                        style={{
                                            backgroundColor: '#ffc107',
                                            color: '#212529',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => exportToExcel(estimate.id)}
                                        style={{
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        📊 Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EstimatesList;
