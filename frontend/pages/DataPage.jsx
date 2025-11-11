import React from 'react';
import ItemInput from '../src/components/ItemInput';

const DataPage = ({ onBack }) => {

    const handleDataSubmit = async (data) => {
        try {
            // Extract items array from the data object
            const items = data.items || [];
            
            // Send each item individually to match DataCreate schema
            const promises = items.map(item => {
                // Prepare item data matching DataCreate schema
                const itemData = {
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    material_unit_cost: item.material_unit_cost || 0,
                    labor_unit_cost: item.labor_unit_cost || 0
                };
                
                return fetch('http://localhost:8000/api/v1/data/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemData)
                });
            });

            const responses = await Promise.all(promises);
            
            // Check if all requests succeeded
            const failed = responses.filter(r => !r.ok);
            if (failed.length > 0) {
                throw new Error(`Failed to submit ${failed.length} item(s)`);
            }
            
            alert(`Successfully saved ${items.length} item(s)!`);
        }
        catch (error) {
            console.error('Error submitting data:', error);
            alert(`Failed to save data: ${error.message}`);
        }
    }
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
            <ItemInput onDataSubmit={handleDataSubmit} />
        </div>
    );
};

export default DataPage;
