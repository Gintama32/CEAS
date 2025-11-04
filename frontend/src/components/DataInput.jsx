import React, { useState } from 'react';

const DataInput = ({ onDataSubmit }) => {
    const [formData, setFormData] = useState({
        project_name: '',
        project_location: '',
        client_name: '',
        prepared_by: '',
        description: '',
        quantity: '',
        unit: 'SF',
        material_unit_cost: '',
        labor_unit_cost: ''
    });

    const [items, setItems] = useState([]);

    const units = ['SF', 'EA', 'LS', 'LF', 'CY', 'SY', 'TON', 'HR'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addItem = () => {
        if (formData.description && formData.quantity) {
            const newItem = {
                id: Date.now(),
                description: formData.description,
                quantity: parseFloat(formData.quantity),
                unit: formData.unit,
                material_unit_cost: parseFloat(formData.material_unit_cost) || 0,
                labor_unit_cost: parseFloat(formData.labor_unit_cost) || 0,
                material_amount: (parseFloat(formData.quantity) || 0) * (parseFloat(formData.material_unit_cost) || 0),
                labor_amount: (parseFloat(formData.quantity) || 0) * (parseFloat(formData.labor_unit_cost) || 0)
            };
            
            setItems(prev => [...prev, newItem]);
            
            // Reset item fields
            setFormData(prev => ({
                ...prev,
                description: '',
                quantity: '',
                material_unit_cost: '',
                labor_unit_cost: ''
            }));
        }
    };

    const removeItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = () => {
        if (formData.project_name && formData.client_name && items.length > 0) {
            const dataToSubmit = {
                project_info: {
                    project_name: formData.project_name,
                    project_location: formData.project_location,
                    client_name: formData.client_name,
                    prepared_by: formData.prepared_by,
                    estimate_date: new Date().toISOString()
                },
                items: items,
                metadata: {
                    created_at: new Date().toISOString(),
                    total_items: items.length
                }
            };
            
            onDataSubmit(dataToSubmit);
            
            // Reset form
            setFormData({
                project_name: '',
                project_location: '',
                client_name: '',
                prepared_by: '',
                description: '',
                quantity: '',
                unit: 'SF',
                material_unit_cost: '',
                labor_unit_cost: ''
            });
            setItems([]);
        }
    };

    const totalMaterial = items.reduce((sum, item) => sum + (item.material_amount || 0), 0);
    const totalLabor = items.reduce((sum, item) => sum + (item.labor_amount || 0), 0);
    const grandTotal = totalMaterial + totalLabor;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>📊 Data Input Form</h3>
            
            {/* Project Information */}
            <div style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>Project Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Project Name *
                        </label>
                        <input
                            type="text"
                            name="project_name"
                            value={formData.project_name}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="Enter project name"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Project Location
                        </label>
                        <input
                            type="text"
                            name="project_location"
                            value={formData.project_location}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="Enter project location"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Client Name *
                        </label>
                        <input
                            type="text"
                            name="client_name"
                            value={formData.client_name}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="Enter client name"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Prepared By
                        </label>
                        <input
                            type="text"
                            name="prepared_by"
                            value={formData.prepared_by}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="Enter preparer name"
                        />
                    </div>
                </div>
            </div>

            {/* Add Item Form */}
            <div style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h4 style={{ marginBottom: '15px', color: '#333' }}>Add Line Item</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Description *
                        </label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="Item description"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Quantity *
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Unit
                        </label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        >
                            {units.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Material $/Unit
                        </label>
                        <input
                            type="number"
                            name="material_unit_cost"
                            value={formData.material_unit_cost}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Labor $/Unit
                        </label>
                        <input
                            type="number"
                            name="labor_unit_cost"
                            value={formData.labor_unit_cost}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <button
                            onClick={addItem}
                            style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Add Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Items List */}
            {items.length > 0 && (
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ marginBottom: '15px', color: '#333' }}>Line Items ({items.length})</h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Qty</th>
                                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Unit</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Material $/Unit</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Material Total</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labor $/Unit</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Labor Total</th>
                                    <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>Item Total</th>
                                    <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.description}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{item.unit}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${item.material_unit_cost?.toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${item.material_amount?.toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${item.labor_unit_cost?.toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${item.labor_amount?.toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            ${((item.material_amount || 0) + (item.labor_amount || 0)).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                style={{
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                                    <td colSpan="4" style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>TOTALS:</td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${totalMaterial.toFixed(2)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}></td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${totalLabor.toFixed(2)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #ddd' }}>${grandTotal.toFixed(2)}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={handleSubmit}
                    disabled={!formData.project_name || !formData.client_name || items.length === 0}
                    style={{
                        backgroundColor: items.length > 0 && formData.project_name && formData.client_name ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        cursor: items.length > 0 && formData.project_name && formData.client_name ? 'pointer' : 'not-allowed',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    💾 Save Data to Database
                </button>
            </div>
        </div>
    );
};

export default DataInput;
