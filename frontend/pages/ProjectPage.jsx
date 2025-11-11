import React, { useEffect, useState } from 'react';
import ProjectInput from '../src/components/ProjectInput';
import './ProjectPage.css';
import DataPage from './DataPage';
const API_BASE_URL = 'http://localhost:8000/api/v1/project/';

const ProjectPage = ({ onBack }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showDataPage, setShowDataPage] = useState(false);
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

    const handleAddItem = () => {
        setShowDataPage(true);
    };

    // If DataPage should be shown, render it
    if (showDataPage) {
        return <DataPage onBack={() => setShowDataPage(false)} />;
    }

    return (
        <div className="project-page">
            <div className="project-back-button-wrapper">
                <button className="project-back-button" onClick={onBack}>
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
                                            onClick={() => alert(`Editing project ${project.project_name} (prototype)`)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="project-card__button project-card__button--add"
                                            onClick={handleAddItem}
                                        >
                                            ➕ Add Item
                                        </button>
                                        <button
                                            className="project-card__button project-card__button--delete"
                                            onClick={() => alert(`Deleting project ${project.project_name} (prototype)`)}
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
        </div>
    );
};

export default ProjectPage;
