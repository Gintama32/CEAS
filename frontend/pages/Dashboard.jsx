import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();

    const handleOptionSelect = (option) => {
        console.log(`Selected option: ${option}`);
        if (option === 'project') {
            navigate('/projects');
        } else if (option === 'estimates') {
            navigate('/estimates');
        } else if (option === 'templates') {
            navigate('/templates');
        }
    };

    const dashboardOptions = [
        {
            id: 'project',
            title: 'Project',
            description: 'Create and review projects',
            icon: '🏢'
        },
        {
            id: 'estimates',
            title: 'Estimates',
            description: 'Create and review estimates',
            icon: '💰'
        },
        {
            id: 'templates',
            title: 'Templates',
            description: 'Use and customize templates',
            icon: '📋'
        }
    ];

    // Render the main dashboard
    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ 
                textAlign: 'center', 
                marginBottom: '30px', 
                color: '#333',
                fontSize: '32px',
                fontWeight: 'bold'
            }}>
                Welcome to Your Dashboard
            </h2>
            
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                gap: '20px',
                marginBottom: '30px',
                flexWrap: 'wrap'
            }}>
                {dashboardOptions.map((option) => (
                    <div
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        style={{
                            border: '2px solid #e0e0e0',
                            borderRadius: '10px',
                            padding: '30px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            flex: '1',
                            minWidth: '250px',
                            maxWidth: '350px',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#007bff';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,123,255,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        >
                                <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                                {option.icon}
                            </div>
                            <h3 style={{ 
                                margin: '0 0 15px 0', 
                                color: '#333',
                                fontSize: '28px',
                                fontWeight: 'bold'
                            }}>
                                {option.title}
                            </h3>
                            <p style={{ 
                                color: '#666', 
                                margin: '0',
                                fontSize: '16px',
                                lineHeight: '1.5'
                            }}>
                                {option.description}
                            </p>
                    </div>
                    ))}
                </div>
        </div>
    );
}

export default Dashboard;
