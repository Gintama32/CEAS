import React, { useState, useEffect } from "react";
import DataPage from "./DataPage";
import EstimatesPage from "./EstimatesPage";
import TemplatesPage from "./TemplatesPage";

function Dashboard() {
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(false);


    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        console.log(`Selected option: ${option}`);
    }

    const handleBackToDashboard = () => {
        setSelectedOption(null);
    }

    const dashboardOptions = [
        {
            id: 'data',
            title: 'Data',
            description: 'View and manage your data',
            icon: '📊'
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


    // If a page is selected, render that page
    if (selectedOption === 'data') {
        return <DataPage onBack={handleBackToDashboard} />;
    }

    if (selectedOption === 'estimates') {
        return <EstimatesPage onBack={handleBackToDashboard} />;
    }

    if (selectedOption === 'templates') {
        return <TemplatesPage onBack={handleBackToDashboard} />;
    }

    // Otherwise, render the main dashboard
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
