import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectEstimateView from './ProjectEstimateView';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const PROJECT_ENDPOINT = `${API_BASE_URL}/project/`;
const ESTIMATES_ENDPOINT = `${API_BASE_URL}/estimates/`;
const TEMPLATES_ENDPOINT = `${API_BASE_URL}/templates/`;

const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
};

const ProjectEstimatesList = () => {
    const navigate = useNavigate();
    const { projectId, estimateId } = useParams();
    const [project, setProject] = useState(null);
    const [estimates, setEstimates] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [currentEstimate, setCurrentEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            setStatusMessage('No project ID provided');
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setStatusMessage('');

            try {
                const [projectResponse, estimatesResponse, templatesResponse] = await Promise.all([
                    fetch(`${PROJECT_ENDPOINT}${projectId}`),
                    fetch(`${ESTIMATES_ENDPOINT}?project_id=${projectId}`),
                    fetch(TEMPLATES_ENDPOINT),
                ]);

                if (!projectResponse.ok) {
                    const errorText = await projectResponse.text();
                    throw new Error(errorText || 'Failed to load project');
                }
                if (!estimatesResponse.ok) {
                    const errorText = await estimatesResponse.text();
                    throw new Error(errorText || 'Failed to load estimates');
                }
                if (!templatesResponse.ok) {
                    const errorText = await templatesResponse.text();
                    throw new Error(errorText || 'Failed to load templates');
                }

                const [projectData, estimatesData, templateData] = await Promise.all([
                    projectResponse.json(),
                    estimatesResponse.json(),
                    templatesResponse.json(),
                ]);

                setProject(projectData);
                setEstimates(
                    estimatesData.sort(
                        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                    )
                );
                setTemplates(templateData);

                if (estimateId) {
                    const selected = estimatesData.find((estimate) => estimate.id === Number(estimateId));
                    setCurrentEstimate(selected || null);
                } else {
                    setCurrentEstimate(null);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setStatusMessage(error.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [projectId, estimateId]);

    const templateLookup = templates.reduce((acc, template) => {
        acc[template.id] = template;
        return acc;
    }, {});

    if (estimateId && project && currentEstimate) {
        return (
            <ProjectEstimateView
                project={project}
                estimateMetadata={currentEstimate}
                excelDataId={currentEstimate.excel_data_id ?? null}
            />
        );
    }

    if (estimateId && project && !currentEstimate && !loading) {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={() => navigate(`/projects/${projectId}/estimates`)} style={{ marginBottom: '1rem' }}>
                    ← Back to Estimates
                </button>
                <p style={{ color: '#dc3545' }}>Estimate not found.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
                    ← Back to Projects
                </button>
                <p>Loading estimates…</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
                    ← Back to Projects
                </button>
                <p style={{ color: '#dc3545' }}>
                    {statusMessage || 'Failed to load project. Please try again.'}
                </p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/projects')}
                style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                }}
            >
                <span>←</span>
                <span>Back to Projects</span>
            </button>

            <h2 style={{ marginTop: 0 }}>{project.project_name} – Estimates</h2>

            {statusMessage && (
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        background: '#fff8e1',
                        borderRadius: 6,
                        marginBottom: '1rem',
                        border: '1px solid #ffe082',
                    }}
                >
                    {statusMessage}
                </div>
            )}

            {estimates.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '5px' }}>📋</div>
                    <h4 style={{ color: '#666', marginBottom: '5px' }}>No estimates yet</h4>
                    <p style={{ color: '#999', marginBottom: '0.25rem' }}>Create your first estimate to get started.</p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/templates')}
                            style={{
                                border: '1px solid #c7d2fe',
                                background: '#eef2ff',
                                color: '#312e81',
                                padding: '0.65rem 1rem',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                minWidth: 160,
                            }}
                        >
                            Browse Templates
                        </button>
                        <button
                            onClick={() => navigate(`/projects/${projectId}/add-item`)}
                            style={{
                                border: 'none',
                                background: '#2563eb',
                                color: 'white',
                                padding: '0.65rem 1.2rem',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer',
                                minWidth: 160,
                            }}
                        >
                            Create Estimate
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {estimates.map((estimate) => (
                        <div
                            key={estimate.id}
                            style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                padding: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#333' }}>
                                    {estimate.name}
                                </div>
                                <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                                    Template:{' '}
                                    <strong>{templateLookup[estimate.template_id]?.name || estimate.template_id}</strong>
                                </div>
                                <div style={{ color: '#666', fontSize: '0.85rem' }}>
                                    Updated: {formatDate(estimate.updated_at)} • Status: {estimate.status.toUpperCase()}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => navigate(`/projects/${projectId}/estimates/${estimate.id}`)}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: '#34495e',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                    }}
                                >
                                    <span>👁️</span>
                                    <span>Open</span>
                                </button>
                                <button
                                    onClick={() => navigate('/templates')}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        borderRadius: 6,
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    Template
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectEstimatesList;

