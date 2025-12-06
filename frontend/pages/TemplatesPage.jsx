import React from 'react';
import { useNavigate } from 'react-router-dom';
import TemplatesList from '../src/components/TemplatesList';

const TemplatesPage = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '20px' }}>
            {/* Back Button */}
            <div style={{ marginTop: '2rem', marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => navigate('/')}
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
                        gap: '8px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#5a6268';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6c757d';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
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
