import React from 'react';
import DataInput from '../src/components/DataInput';

const DataPage = ({ onBack }) => {
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

            {/* Data Input Component */}
            <DataInput onDataSubmit={(data) => {
                console.log('Data submitted:', data);
                // Here you would typically send data to backend
                alert('Data saved successfully! (This is a prototype)');
            }} />
        </div>
    );
};

export default DataPage;
