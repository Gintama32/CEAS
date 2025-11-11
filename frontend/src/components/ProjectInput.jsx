import React from "react";
import { useState } from "react";
function ProjectInput({ onProjectSubmit }) {
    const [formData, setFormData] = useState({
        project_name: '',
        project_location: '',
        client_name: '',
        prepared_by: ''
    });
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        if (formData.project_name && formData.client_name) {
            const projectData = {
                    project_name: formData.project_name,
                    project_location: formData.project_location,
                    client_name: formData.client_name,
                    prepared_by: formData.prepared_by,
            };
            
            onProjectSubmit(projectData);
            // Reset form
            setFormData({
                project_name: '',
                project_location: '',
                client_name: '',
                prepared_by: '',
            });
        }
    };
  return (
    <div>
    <h3 style={{ marginBottom: '20px', color: '#333' }}>Create New Project</h3>
    
    {/* Project Information */}
    <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>

        <h4 style={{ marginBottom: '15px', color: '#333' }}>Project Information</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
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
        <form onSubmit={handleSubmit}>
    <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    >
        Submit
        </button>
        </form>
    </div>
    </div>
  );
}

export default ProjectInput;
