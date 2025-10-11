import React, { useState, useEffect } from 'react';

const TemplatesList = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock data for prototype - simulating Excel-like estimate templates
    const mockTemplates = [
        {
            id: '1',
            name: 'Residential Construction Template',
            description: 'Standard template for residential construction projects including foundation, framing, electrical, plumbing, and finishing',
            project_type: 'Residential',
            sections: [
                { code: '01-00-00', title: 'General Requirements', items: 12 },
                { code: '03-00-00', title: 'Concrete', items: 8 },
                { code: '05-00-00', title: 'Metals', items: 15 },
                { code: '06-00-00', title: 'Wood & Plastics', items: 20 },
                { code: '16-00-00', title: 'Electrical', items: 18 },
                { code: '22-00-00', title: 'Plumbing', items: 14 },
                { code: '09-00-00', title: 'Finishes', items: 25 }
            ],
            total_items: 112,
            created_at: '2024-01-10T10:00:00Z',
            is_active: true
        },
        {
            id: '2',
            name: 'Commercial Office Template',
            description: 'Comprehensive template for commercial office buildings with modern systems and finishes',
            project_type: 'Commercial',
            sections: [
                { code: '01-00-00', title: 'General Requirements', items: 15 },
                { code: '03-00-00', title: 'Concrete', items: 10 },
                { code: '05-00-00', title: 'Metals', items: 20 },
                { code: '07-00-00', title: 'Thermal & Moisture Protection', items: 12 },
                { code: '09-00-00', title: 'Finishes', items: 30 },
                { code: '11-00-00', title: 'Equipment', items: 8 },
                { code: '16-00-00', title: 'Electrical', items: 25 },
                { code: '21-00-00', title: 'Fire Suppression', items: 6 },
                { code: '22-00-00', title: 'Plumbing', items: 18 },
                { code: '23-00-00', title: 'HVAC', items: 22 }
            ],
            total_items: 166,
            created_at: '2024-01-05T14:30:00Z',
            is_active: true
        },
        {
            id: '3',
            name: 'Kitchen Remodel Template',
            description: 'Specialized template for kitchen renovation projects including cabinets, countertops, appliances, and fixtures',
            project_type: 'Renovation',
            sections: [
                { code: '01-00-00', title: 'General Requirements', items: 5 },
                { code: '06-00-00', title: 'Wood & Plastics (Cabinets)', items: 12 },
                { code: '09-00-00', title: 'Finishes (Countertops)', items: 8 },
                { code: '11-00-00', title: 'Equipment (Appliances)', items: 6 },
                { code: '16-00-00', title: 'Electrical', items: 10 },
                { code: '22-00-00', title: 'Plumbing', items: 8 },
                { code: '23-00-00', title: 'HVAC (Ventilation)', items: 4 }
            ],
            total_items: 53,
            created_at: '2024-01-15T09:15:00Z',
            is_active: true
        },
        {
            id: '4',
            name: 'Industrial Warehouse Template',
            description: 'Template for large-scale industrial and warehouse construction projects',
            project_type: 'Industrial',
            sections: [
                { code: '01-00-00', title: 'General Requirements', items: 20 },
                { code: '03-00-00', title: 'Concrete', items: 15 },
                { code: '05-00-00', title: 'Metals (Structural Steel)', items: 25 },
                { code: '07-00-00', title: 'Thermal & Moisture Protection', items: 18 },
                { code: '08-00-00', title: 'Openings (Doors & Windows)', items: 12 },
                { code: '16-00-00', title: 'Electrical', items: 30 },
                { code: '21-00-00', title: 'Fire Suppression', items: 15 },
                { code: '23-00-00', title: 'HVAC', items: 20 }
            ],
            total_items: 155,
            created_at: '2024-01-08T16:45:00Z',
            is_active: true
        }
    ];

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            // For prototype, use mock data
            // In real app, this would be: const response = await fetch("http://localhost:8000/api/v1/templates");
            setTimeout(() => {
                setTemplates(mockTemplates);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error loading templates:", error);
            setLoading(false);
        }
    };

    const useTemplate = (templateId) => {
        // Mock use template functionality
        alert(`Using template ${templateId} to create new estimate... (This is a prototype)`);
    };

    const editTemplate = (templateId) => {
        // Mock edit template functionality
        alert(`Editing template ${templateId}... (This is a prototype)`);
    };

    const duplicateTemplate = (templateId) => {
        // Mock duplicate template functionality
        alert(`Duplicating template ${templateId}... (This is a prototype)`);
    };

    const getProjectTypeColor = (type) => {
        switch (type) {
            case 'Residential': return '#28a745';
            case 'Commercial': return '#007bff';
            case 'Industrial': return '#dc3545';
            case 'Renovation': return '#ffc107';
            default: return '#6c757d';
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                <p>Loading templates...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0', color: '#333' }}>📋 Estimate Templates ({templates.length})</h3>
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
                    ➕ Create New Template
                </button>
            </div>

            {templates.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
                    <h4 style={{ color: '#666', marginBottom: '10px' }}>No templates found</h4>
                    <p style={{ color: '#999' }}>Create your first template to get started</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
                    {templates.map((template) => (
                        <div
                            key={template.id}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: '0 10px 0 0', color: '#333' }}>{template.name}</h4>
                                        <span
                                            style={{
                                                backgroundColor: getProjectTypeColor(template.project_type),
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {template.project_type}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
                                        {template.description}
                                    </p>
                                </div>
                            </div>

                            {/* Template Sections Preview */}
                            <div style={{ marginBottom: '15px' }}>
                                <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>
                                    📊 Sections ({template.sections.length}) - Total Items: {template.total_items}
                                </h5>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                    gap: '8px',
                                    maxHeight: '120px',
                                    overflowY: 'auto',
                                    padding: '8px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px'
                                }}>
                                    {template.sections.map((section, index) => (
                                        <div key={index} style={{ 
                                            fontSize: '12px',
                                            padding: '4px 8px',
                                            backgroundColor: 'white',
                                            borderRadius: '3px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <strong>{section.code}</strong> - {section.title}
                                            <div style={{ color: '#666', fontSize: '11px' }}>
                                                {section.items} items
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Template Stats */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '10px',
                                marginBottom: '15px',
                                padding: '10px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>SECTIONS</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                                        {template.sections.length}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>TOTAL ITEMS</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                                        {template.total_items}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>CREATED</div>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                                        {new Date(template.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => useTemplate(template.id)}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🚀 Use Template
                                </button>
                                <button
                                    onClick={() => editTemplate(template.id)}
                                    style={{
                                        backgroundColor: '#ffc107',
                                        color: '#212529',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => duplicateTemplate(template.id)}
                                    style={{
                                        backgroundColor: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    📋 Duplicate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplatesList;
