import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const PROJECT_ENDPOINT = `${API_BASE_URL}/project/`;
const ESTIMATES_ENDPOINT = `${API_BASE_URL}/estimates/`;
const TEMPLATES_ENDPOINT = `${API_BASE_URL}/templates/`;

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const EstimatesList = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [estimates, setEstimates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');
    const [filterText, setFilterText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState({
        projectId: '',
        templateId: '',
        name: '',
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setStatusMessage('');
        try {
            const [projectsResp, templatesResp, estimatesResp] = await Promise.all([
                fetch(PROJECT_ENDPOINT),
                fetch(TEMPLATES_ENDPOINT),
                fetch(ESTIMATES_ENDPOINT),
            ]);

            if (!projectsResp.ok) throw new Error('Failed to load projects');
            if (!templatesResp.ok) throw new Error('Failed to load templates');
            if (!estimatesResp.ok) throw new Error('Failed to load estimates');

            const [projectData, templateData, estimateData] = await Promise.all([
                projectsResp.json(),
                templatesResp.json(),
                estimatesResp.json(),
            ]);

            setProjects(projectData);
            setTemplates(templateData);
            setEstimates(estimateData);
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to load estimates.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const projectLookup = useMemo(() => {
        const lookup = {};
        for (const project of projects) {
            lookup[project.id] = project;
        }
        return lookup;
    }, [projects]);

    const templateLookup = useMemo(() => {
        const lookup = {};
        for (const template of templates) {
            lookup[template.id] = template;
        }
        return lookup;
    }, [templates]);

    const filteredEstimates = useMemo(() => {
        return estimates.filter((estimate) => {
            if (selectedStatus !== 'all' && estimate.status !== selectedStatus) {
                return false;
            }
            if (!filterText.trim()) return true;
            const search = filterText.toLowerCase();
            const templateName = templateLookup[estimate.template_id]?.name || '';
            const projectName = estimate.project_name || projectLookup[estimate.project_id]?.project_name || '';
            return (
                estimate.name.toLowerCase().includes(search) ||
                projectName.toLowerCase().includes(search) ||
                templateName.toLowerCase().includes(search)
            );
        });
    }, [estimates, selectedStatus, filterText, projectLookup, templateLookup]);

    const handleOpenCreateModal = () => {
        setCreateForm({
            projectId: projects[0]?.id?.toString() || '',
            templateId: templates[0]?.id?.toString() || '',
            name: '',
        });
        setStatusMessage('');
        setIsCreateModalOpen(true);
    };

    const handleCreateEstimate = async (event) => {
        event.preventDefault();
        if (!createForm.projectId || !createForm.templateId || !createForm.name.trim()) {
            setStatusMessage('Please fill all required fields.');
            return;
        }

        const payload = {
            project_id: Number(createForm.projectId),
            template_id: Number(createForm.templateId),
            name: createForm.name.trim(),
        };

        try {
            setIsSubmitting(true);
            setStatusMessage('Creating estimate…');
            const response = await fetch(ESTIMATES_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create estimate.');
            }
            const created = await response.json();
            const createdWithMeta = {
                ...created,
                project_name: projectLookup[payload.project_id]?.project_name || created.project_name || '',
            };
            setEstimates((prev) => [createdWithMeta, ...prev]);
            setIsCreateModalOpen(false);
            setStatusMessage('');
            navigate(`/projects/${created.project_id}/estimates/${created.id}`);
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to create estimate.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNavigate = (estimate) => {
        navigate(`/projects/${estimate.project_id}/estimates/${estimate.id}`);
    };

    const handleDeleteEstimate = async (estimate) => {
        if (!window.confirm(`Delete estimate "${estimate.name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            setStatusMessage('Deleting estimate…');
            const response = await fetch(`${ESTIMATES_ENDPOINT}${estimate.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete estimate.');
            }
            setEstimates((prev) => prev.filter((item) => item.id !== estimate.id));
            setStatusMessage('Estimate deleted.');
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to delete estimate.');
        }
    };

    return (
        <div style={{ width: '100%', margin: '0 auto', maxWidth: '1200px' }}>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                }}
            >
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                        Search
                    </label>
                    <input
                        type="text"
                        placeholder="Search estimates, projects, templates"
                        value={filterText}
                        onChange={(event) => setFilterText(event.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                        Status
                    </label>
                    <select
                        value={selectedStatus}
                        onChange={(event) => setSelectedStatus(event.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                        }}
                    >
                        <option value="all">All</option>
                        <option value="draft">Draft</option>
                        <option value="review">Review</option>
                        <option value="final">Final</option>
                    </select>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={handleOpenCreateModal}
                        disabled={!projects.length || !templates.length}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: !projects.length || !templates.length ? '#94a3b8' : '#2563eb',
                            color: 'white',
                            fontWeight: 600,
                            cursor: !projects.length || !templates.length ? 'not-allowed' : 'pointer',
                        }}
                    >
                        ➕ Create Estimate
                    </button>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                    <p>Loading estimates...</p>
                </div>
            )}

            {statusMessage && !loading && (
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

            {!loading && filteredEstimates.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '40px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
                    <h4 style={{ color: '#666', marginBottom: '10px' }}>No estimates yet</h4>
                    <p style={{ color: '#999' }}>Create your first estimate to get started.</p>
                </div>
            )}

            {!loading && filteredEstimates.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Estimate</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Project</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Template</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '0.75rem' }}>Total Cost</th>
                                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Updated</th>
                                <th style={{ padding: '0.75rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEstimates.map((estimate) => (
                                <tr key={estimate.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 600 }}>{estimate.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>#{estimate.id}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {estimate.project_name ||
                                            projectLookup[estimate.project_id]?.project_name ||
                                            `#${estimate.project_id}`}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {templateLookup[estimate.template_id]?.name || estimate.template_id}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <span
                                            style={{
                                                backgroundColor:
                                                    estimate.status === 'final'
                                                        ? '#d1fae5'
                                                        : estimate.status === 'review'
                                                        ? '#fef9c3'
                                                        : '#e0e7ff',
                                                color:
                                                    estimate.status === 'final'
                                                        ? '#065f46'
                                                        : estimate.status === 'review'
                                                        ? '#854d0e'
                                                        : '#312e81',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: 12,
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {estimate.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                        {formatCurrency(estimate.total_cost)}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {new Date(estimate.updated_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleNavigate(estimate)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: 4,
                                                    border: '1px solid #d1d5db',
                                                    backgroundColor: 'white',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEstimate(estimate)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: 4,
                                                    border: '1px solid #fecaca',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#b91c1c',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isCreateModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.55)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 500,
                            background: 'white',
                            borderRadius: 12,
                            padding: '1.5rem',
                            boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
                        }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Create Estimate</h3>
                        <form
                            onSubmit={handleCreateEstimate}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                        >
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                    Project *
                                </label>
                                <select
                                    value={createForm.projectId}
                                    onChange={(event) =>
                                        setCreateForm((prev) => ({ ...prev, projectId: event.target.value }))
                                    }
                                    required
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc' }}
                                >
                                    <option value="">Select project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            #{project.id} • {project.project_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                    Template *
                                </label>
                                <select
                                    value={createForm.templateId}
                                    onChange={(event) =>
                                        setCreateForm((prev) => ({ ...prev, templateId: event.target.value }))
                                    }
                                    required
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc' }}
                                >
                                    <option value="">Select template</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                    Estimate Name *
                                </label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(event) =>
                                        setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                                    }
                                    placeholder="e.g., Phase 1 Budget"
                                    required
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 6,
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: '0.5rem 1.2rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: '#2563eb',
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.7 : 1,
                                    }}
                                >
                                    {isSubmitting ? 'Creating…' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstimatesList;

