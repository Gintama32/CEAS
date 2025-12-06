import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectInput from '../src/components/ProjectInput';
import './ProjectPage.css';
const API_BASE_URL = 'http://localhost:8000/api/v1/project/';

const ProjectPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [editForm, setEditForm] = useState({
        project_name: '',
        project_location: '',
        client_name: '',
        prepared_by: '',
    });
    const [editStatus, setEditStatus] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }
            const data = await response.json();
            setProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const openEditModal = (project) => {
        setEditingProject(project);
        setEditForm({
            project_name: project.project_name || '',
            project_location: project.project_location || '',
            client_name: project.client_name || '',
            prepared_by: project.prepared_by || '',
        });
        setEditStatus('');
    };

    const closeEditModal = () => {
        if (isSavingEdit) return;
        setEditingProject(null);
        setEditStatus('');
    };

    const handleEditFieldChange = (event) => {
        const { name, value } = event.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditSubmit = async (event) => {
        event.preventDefault();
        if (!editingProject) return;

        if (!editForm.project_name.trim() || !editForm.client_name.trim()) {
            setEditStatus('Project name and client name are required.');
            return;
        }

        setIsSavingEdit(true);
        setEditStatus('');

        try {
            const response = await fetch(`${API_BASE_URL}${editingProject.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    project_name: editForm.project_name,
                    project_location: editForm.project_location,
                    client_name: editForm.client_name,
                    prepared_by: editForm.prepared_by,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update project.');
            }

            const updatedProject = await response.json();
            setProjects((prev) => prev.map((proj) => (proj.id === updatedProject.id ? updatedProject : proj)));
            setEditStatus('Project updated successfully.');
            setTimeout(() => {
                setEditingProject(null);
                setEditStatus('');
            }, 800);
        } catch (err) {
            console.error('Error updating project:', err);
            setEditStatus(err.message || 'Failed to update project.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleProjectSubmit = async (projectData) => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || 'Failed to submit project');
            }
            const newProject = await response.json();
            setProjects((prev) => [newProject, ...prev]);
            setShowForm(false);
            alert('Project saved successfully!');
        } catch (err) {
            console.error('Error submitting project:', err);
            alert(`Failed to save project: ${err.message}`);
        }
    };

    const handleAddItem = (project) => {
        navigate(`/projects/${project.id}/add-item`);
    };

    const handleViewEstimates = (project) => {
        navigate(`/projects/${project.id}/estimates`);
    };

    const handleDelete = async (project) => {
        const confirmMessage = `Are you sure you want to delete "${project.project_name}"?\n\nThis will also delete:\n- All estimates and Excel uploads\n- All associated data rows\n\nThis action cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${project.id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete project');
            }

            // Remove from local state
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
            alert(`Successfully deleted "${project.project_name}"`);
        } catch (error) {
            console.error(error);
            alert(`Failed to delete project: ${error.message}`);
        }
    };

    return (
        <div className="project-page">
            <div className="project-back-button-wrapper" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="project-back-button" onClick={() => navigate('/')}>
                    ← Back to Dashboard
                </button>
            </div>

            <div className="project-header">
                <h2 className="project-header__title">Projects</h2>
                <button
                    className={`project-toggle-button ${showForm ? 'project-toggle-button--active' : ''}`}
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm ? '× Cancel' : '+ Add Project'}
                </button>
            </div>

            {showForm && (
                <div className="project-form-wrapper">
                    <ProjectInput onProjectSubmit={handleProjectSubmit} />
                </div>
            )}

            <div className="project-list-wrapper">
                {loading ? (
                    <p className="project-loading">Loading projects…</p>
                ) : error ? (
                    <p className="project-error">{error}</p>
                ) : projects.length === 0 ? (
                    <p className="project-empty">No projects yet. Click "Add Project" to create one.</p>
                ) : (
                    <div className="project-list">
                        {projects.map((project) => (
                            <div className="project-card" key={project.id}>
                                <div className="project-card__content">
                                    <div className="project-card__info">
                                        <div className="project-card__title">
                                            <span className="project-card__title-icon">🏗️</span>
                                            <h3 className="project-card__title-text">{project.project_name}</h3>
                                        </div>

                                        <div className="project-card__grid">
                                            <div>
                                                <div className="project-card__label">Client</div>
                                                <div className="project-card__value">{project.client_name || '—'}</div>
                                            </div>
                                            <div>
                                                <div className="project-card__label">Location</div>
                                                <div className="project-card__value">{project.project_location || '—'}</div>
                                            </div>
                                            <div>
                                                <div className="project-card__label">Prepared By</div>
                                                <div className="project-card__value">{project.prepared_by || '—'}</div>
                                            </div>
                                        </div>

                                        <div className="project-card__metrics">
                                            <div className="project-card__metric">
                                                <div className="project-card__metric-label">PROJECT ID</div>
                                                <div className="project-card__metric-value project-card__metric-value--highlight">#{project.id}</div>
                                            </div>
                                            <div className="project-card__metric">
                                                <div className="project-card__metric-label">CREATED</div>
                                                <div className="project-card__metric-value">
                                                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}
                                                </div>
                                            </div>
                                            <div className="project-card__metric">
                                                <div className="project-card__metric-label">UPDATED</div>
                                                <div className="project-card__metric-value">
                                                    {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="project-card__actions">
                                        <button
                                            className="project-card__button project-card__button--edit"
                                            onClick={() => openEditModal(project)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="project-card__button project-card__button--view"
                                            onClick={() => handleViewEstimates(project)}
                                        >
                                            <span>📑</span>
                                            <span>View Estimates</span>
                                        </button>
                                        <button
                                            className="project-card__button project-card__button--add"
                                            onClick={() => handleAddItem(project)}
                                        >
                                            ➕ Add Item
                                        </button>
                                        <button
                                            className="project-card__button project-card__button--delete"
                                            onClick={() => handleDelete(project)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editingProject && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                        zIndex: 2000,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 520,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: '1.5rem',
                            boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Edit Project</h3>
                                <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                                    Update metadata for <strong>{editingProject.project_name}</strong>.
                                </p>
                            </div>
                            <button
                                onClick={closeEditModal}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.5rem',
                                    cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                                    color: '#475569',
                                }}
                                disabled={isSavingEdit}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Project Name *</label>
                                <input
                                    type="text"
                                    name="project_name"
                                    value={editForm.project_name}
                                    onChange={handleEditFieldChange}
                                    required
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Client Name *</label>
                                <input
                                    type="text"
                                    name="client_name"
                                    value={editForm.client_name}
                                    onChange={handleEditFieldChange}
                                    required
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Project Location</label>
                                <input
                                    type="text"
                                    name="project_location"
                                    value={editForm.project_location}
                                    onChange={handleEditFieldChange}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Prepared By</label>
                                <input
                                    type="text"
                                    name="prepared_by"
                                    value={editForm.prepared_by}
                                    onChange={handleEditFieldChange}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
                                />
                            </div>

                            {editStatus && (
                                <div
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: 8,
                                        background: editStatus.toLowerCase().includes('success') ? '#dcfce7' : '#fee2e2',
                                        color: editStatus.toLowerCase().includes('success') ? '#166534' : '#991b1b',
                                    }}
                                >
                                    {editStatus}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={isSavingEdit}
                                    style={{
                                        border: '1px solid #d1d5db',
                                        backgroundColor: 'white',
                                        color: '#1f2937',
                                        padding: '0.55rem 1.2rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    style={{
                                        border: 'none',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        padding: '0.55rem 1.4rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isSavingEdit ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectPage;
