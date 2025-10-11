import React from 'react';
import EstimatesList from '../src/components/EstimatesList';

const EstimatesPage = ({ onBack }) => {
    return (
        <div style={{ padding: '20px' }}>
            {/* Back Button */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={onBack}
                    style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Estimates List Component */}
            <EstimatesList />
        </div>
    );
};

export default EstimatesPage;
