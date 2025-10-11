import React from 'react';
import TemplatesList from '../src/components/TemplatesList';

const TemplatesPage = ({ onBack }) => {
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

            {/* Templates List Component */}
            <TemplatesList />
        </div>
    );
};

export default TemplatesPage;
