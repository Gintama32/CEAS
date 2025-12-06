import React, { useMemo, useState } from 'react';
import { CSI_MASTERFORMAT_OPTIONS, findCsiByCode } from '../constants/csiMasterFormat';

const UNIT_OPTIONS = ['SF', 'EA', 'LS', 'LF', 'CY', 'SY', 'TON', 'HR'];

const INITIAL_FORM_STATE = {
    csi_code: '',
    csi_title: '',
    description: '',
    quantity: '',
    unit: 'SF',
    material_unit_cost: '',
    material_amount: '',
    labor_unit_cost: '',
    labor_amount: '',
};

const ItemInput = ({ onDataSubmit }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [items, setItems] = useState([]);

    const parseNumberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCsiCodeChange = (value) => {
        const preset = findCsiByCode(value);
        setFormData((prev) => ({
            ...prev,
            csi_code: value,
            csi_title: preset?.title || prev.csi_title,
        }));
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_STATE);
    };

    const addItem = (event) => {
        event.preventDefault();
        if (!formData.description.trim() || !formData.quantity) {
            alert('Description and quantity are required.');
            return;
        }
        if (!formData.csi_code.trim()) {
            alert('Please assign a CSI code before adding the item.');
            return;
        }

        const matchedCsi = findCsiByCode(formData.csi_code.trim());
        const newItem = {
            id: Date.now(),
            csi_code: formData.csi_code.trim(),
            csi_title: formData.csi_title?.trim() || matchedCsi?.title || null,
            description: formData.description.trim(),
            quantity: parseNumberOrNull(formData.quantity),
            unit: formData.unit || 'SF',
            material_unit_cost: parseNumberOrNull(formData.material_unit_cost),
            material_amount: parseNumberOrNull(formData.material_amount),
            labor_unit_cost: parseNumberOrNull(formData.labor_unit_cost),
            labor_amount: parseNumberOrNull(formData.labor_amount),
        };

        const totalUnitCost = (newItem.material_unit_cost || 0) + (newItem.labor_unit_cost || 0);
        const totalAmount = (newItem.material_amount || 0) + (newItem.labor_amount || 0);
        newItem.total_unit_cost = totalUnitCost || null;
        newItem.total_amount = totalAmount || null;

        setItems((prev) => [...prev, newItem]);
        resetForm();
    };

    const removeItem = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!items.length) {
            alert('Add at least one line item before saving.');
            return;
        }
        const success = await onDataSubmit({ items });
        if (success !== false) {
            resetForm();
            setItems([]);
        }
    };

    const totals = useMemo(() => {
        return items.reduce(
            (acc, item) => {
                acc.material += item.material_amount || 0;
                acc.labor += item.labor_amount || 0;
                return acc;
            },
            { material: 0, labor: 0 }
        );
    }, [items]);

    return (
        <div>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Append Catalog Items</h3>
            <form onSubmit={handleSubmit} noValidate>
                <div
                    style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}
                >
                    <h4 style={{ margin: 0, color: '#333' }}>Line Item Details</h4>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                        }}
                    >
                        <div>
                            <label htmlFor="csi_code" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                CSI Code *
                            </label>
                            <input
                                id="csi_code"
                                name="csi_code"
                                list="csi-code-options"
                                value={formData.csi_code}
                                onChange={(event) => handleCsiCodeChange(event.target.value)}
                                placeholder="01 00 00"
                                required
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                            <datalist id="csi-code-options">
                                {CSI_MASTERFORMAT_OPTIONS.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.title}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="csi_title" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                CSI Title
                            </label>
                            <input
                                id="csi_title"
                                name="csi_title"
                                value={formData.csi_title}
                                onChange={handleFieldChange}
                                placeholder="General Requirements"
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleFieldChange}
                            placeholder="Describe the line item"
                            rows={3}
                            required
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                resize: 'vertical',
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.75rem',
                        }}
                    >
                        <div>
                            <label htmlFor="quantity" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                Quantity *
                            </label>
                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.quantity}
                                onChange={handleFieldChange}
                                required
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label htmlFor="unit" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                Unit
                            </label>
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleFieldChange}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            >
                                {UNIT_OPTIONS.map((unit) => (
                                    <option key={unit} value={unit}>
                                        {unit}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="material_unit_cost" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                Material $/Unit
                            </label>
                            <input
                                id="material_unit_cost"
                                name="material_unit_cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.material_unit_cost}
                                onChange={handleFieldChange}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label htmlFor="material_amount" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                Material Amount
                            </label>
                            <input
                                id="material_amount"
                                name="material_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.material_amount}
                                onChange={handleFieldChange}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label htmlFor="labor_unit_cost" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                Labor $/Unit
                            </label>
                            <input
                                id="labor_unit_cost"
                                name="labor_unit_cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.labor_unit_cost}
                                onChange={handleFieldChange}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div>
                            <label htmlFor="labor_amount" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                Labor Amount
                            </label>
                            <input
                                id="labor_amount"
                                name="labor_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.labor_amount}
                                onChange={handleFieldChange}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={addItem}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ➕ Add Item
                            </button>
                        </div>
                    </div>
                </div>

                {items.length > 0 && (
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                        }}
                    >
                        <h4 style={{ marginTop: 0, color: '#333' }}>Pending Items ({items.length})</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>Description</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'left' }}>CSI</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>Unit</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Mat $/Unit</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Mat Amount</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Labor $/Unit</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'right' }}>Labor Amount</th>
                                        <th style={{ padding: '10px', border: '1px solid #e5e7eb', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9' }}>{item.description}</td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9' }}>
                                                <div style={{ fontWeight: 600 }}>{item.csi_code}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{item.csi_title || '—'}</div>
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                {item.quantity ?? '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>{item.unit}</td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'right' }}>
                                                {item.material_unit_cost != null ? `$${item.material_unit_cost.toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'right' }}>
                                                {item.material_amount != null ? `$${item.material_amount.toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'right' }}>
                                                {item.labor_unit_cost != null ? `$${item.labor_unit_cost.toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'right' }}>
                                                {item.labor_amount != null ? `$${item.labor_amount.toFixed(2)}` : '—'}
                                            </td>
                                            <td style={{ padding: '10px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    style={{
                                                        border: '1px solid #fee2e2',
                                                        background: '#fef2f2',
                                                        color: '#b91c1c',
                                                        padding: '4px 10px',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                                        <td colSpan={5} style={{ padding: '10px', textAlign: 'right', border: '1px solid #f1f5f9' }}>
                                            Totals
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #f1f5f9' }}>
                                            {totals.material ? `$${totals.material.toFixed(2)}` : '—'}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #f1f5f9' }}></td>
                                        <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #f1f5f9' }}>
                                            {totals.labor ? `$${totals.labor.toFixed(2)}` : '—'}
                                        </td>
                                        <td style={{ border: '1px solid #f1f5f9' }}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                <div style={{ textAlign: 'center' }}>
                    <button
                        type="submit"
                        disabled={items.length === 0}
                        style={{
                            backgroundColor: items.length ? '#16a34a' : '#9ca3af',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: 8,
                            cursor: items.length ? 'pointer' : 'not-allowed',
                            fontSize: '16px',
                            fontWeight: 600,
                        }}
                    >
                        💾 Save Data to Database
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ItemInput;
