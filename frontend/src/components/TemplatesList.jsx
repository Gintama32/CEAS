import React, { useEffect, useMemo, useState } from 'react';

import { CSI_MASTERFORMAT_OPTIONS, findCsiByCode } from '../constants/csiMasterFormat';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const TEMPLATES_ENDPOINT = `${API_BASE_URL}/templates`;
const DATA_ENDPOINT = `${API_BASE_URL}/data/`;
const PROJECT_ENDPOINT = `${API_BASE_URL}/project/`;
const EXCEL_DATA_ENDPOINT = `${API_BASE_URL}/excel-data/`;

const TEMPLATE_STATUSES = ['draft', 'review', 'published'];
const PROJECT_TYPES = ['General', 'Residential', 'Commercial', 'Industrial', 'Renovation'];

const emptyBuilder = {
    name: '',
    description: '',
    projectType: 'General',
    status: 'draft',
    sections: [],
    newSectionCsi: '',
    newSectionTitle: '',
};

const emptyPromote = {
    projectId: '',
    uploadId: '',
    name: '',
    description: '',
    projectType: 'General',
    templateStatus: 'draft',
};

const randomId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const TemplatesList = () => {
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [catalogItems, setCatalogItems] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogQuery, setCatalogQuery] = useState('');
    const [projects, setProjects] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');

    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [builderState, setBuilderState] = useState(emptyBuilder);
    const [builderMessage, setBuilderMessage] = useState('');
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [builderMode, setBuilderMode] = useState('create');
    const [templateBeingEdited, setTemplateBeingEdited] = useState(null);

    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [promoteState, setPromoteState] = useState(emptyPromote);
    const [promoteMessage, setPromoteMessage] = useState('');

    const hydrateTemplateForBuilder = (template) => {
        return {
            name: template.name || '',
            description: template.description || '',
            projectType: template.project_type || 'General',
            status: template.status || 'draft',
            sections: (template.sections || []).map((section) => {
                const sectionId = randomId();
                return {
                    id: sectionId,
                    title: section.title || section.csi_title || 'Section',
                    csi_code: section.csi_code || '',
                    csi_title: section.csi_title || '',
                    items: (section.items || []).map((item) => ({
                        id: randomId(),
                        catalog_data_id: item.catalog_data_id,
                        description: item.description,
                        unit: item.unit || '',
                        default_quantity: item.default_quantity ?? '',
                        material_unit_cost: item.material_unit_cost ?? '',
                        labor_unit_cost: item.labor_unit_cost ?? '',
                    })),
                };
            }),
            newSectionCsi: '',
            newSectionTitle: '',
        };
    };

    useEffect(() => {
        loadTemplates();
        loadCatalog();
        loadProjectsAndUploads();
    }, []);

    const loadTemplates = async () => {
        setTemplatesLoading(true);
        setStatusMessage('');
        try {
            const response = await fetch(TEMPLATES_ENDPOINT);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to load templates');
            }
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to load templates.');
        } finally {
            setTemplatesLoading(false);
        }
    };

    const loadCatalog = async () => {
        setCatalogLoading(true);
        try {
            const response = await fetch(DATA_ENDPOINT);
            if (!response.ok) throw new Error('Failed to load catalog items');
            const data = await response.json();
            setCatalogItems(data);
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to load catalog items.');
        } finally {
            setCatalogLoading(false);
        }
    };

    const loadProjectsAndUploads = async () => {
        try {
            const [projectsResp, uploadsResp] = await Promise.all([fetch(PROJECT_ENDPOINT), fetch(EXCEL_DATA_ENDPOINT)]);
            if (!projectsResp.ok) throw new Error('Failed to load projects');
            if (!uploadsResp.ok) throw new Error('Failed to load uploads');
            const [projectsData, uploadsData] = await Promise.all([projectsResp.json(), uploadsResp.json()]);
            setProjects(projectsData);
            setUploads(uploadsData);
        } catch (error) {
            console.error(error);
        }
    };

    const openBuilderModal = (template = null) => {
        if (template) {
            const hydrated = hydrateTemplateForBuilder(template);
            setBuilderState(hydrated);
            setActiveSectionId(hydrated.sections[0]?.id || null);
            setBuilderMode('edit');
            setTemplateBeingEdited(template);
        } else {
            setBuilderState(emptyBuilder);
            setActiveSectionId(null);
            setBuilderMode('create');
            setTemplateBeingEdited(null);
        }
        setBuilderMessage('');
        setIsBuilderOpen(true);
    };

    const closeBuilderModal = () => {
        setIsBuilderOpen(false);
        setBuilderMessage('');
        setBuilderMode('create');
        setTemplateBeingEdited(null);
        setActiveSectionId(null);
    };

    const openPromoteModal = () => {
        setPromoteState(emptyPromote);
        setPromoteMessage('');
        setIsPromoteOpen(true);
    };

    const closePromoteModal = () => {
        setIsPromoteOpen(false);
        setPromoteState(emptyPromote);
        setPromoteMessage('');
    };

    const handleBuilderMetaChange = (field, value) => {
        setBuilderState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const addSection = () => {
        if (!builderState.newSectionCsi && !builderState.newSectionTitle) {
            setBuilderMessage('Provide a CSI code or section title.');
            return;
        }
        const preset = builderState.newSectionCsi ? findCsiByCode(builderState.newSectionCsi) : null;
        const section = {
            id: randomId(),
            title: builderState.newSectionTitle || preset?.title || 'New Section',
            csi_code: builderState.newSectionCsi || '',
            csi_title: preset?.title || builderState.newSectionTitle || '',
            items: [],
        };
        setBuilderState((prev) => ({
            ...prev,
            sections: [...prev.sections, section],
            newSectionCsi: '',
            newSectionTitle: '',
        }));
        setActiveSectionId(section.id);
        setBuilderMessage('');
    };

    const removeSection = (sectionId) => {
        setBuilderState((prev) => ({
            ...prev,
            sections: prev.sections.filter((section) => section.id !== sectionId),
        }));
        if (activeSectionId === sectionId) {
            setActiveSectionId(null);
        }
    };

    const updateSectionItem = (sectionId, itemId, field, value) => {
        setBuilderState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    items: section.items.map((item) =>
                        item.id === itemId
                            ? {
                                  ...item,
                                  [field]: value,
                              }
                            : item
                    ),
                };
            }),
        }));
    };

    const removeSectionItem = (sectionId, itemId) => {
        setBuilderState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) return section;
                return {
                    ...section,
                    items: section.items.filter((item) => item.id !== itemId),
                };
            }),
        }));
    };

    const addCatalogItemToSection = (sectionId, catalogItem) => {
        setBuilderState((prev) => ({
            ...prev,
            sections: prev.sections.map((section) => {
                if (section.id !== sectionId) return section;
                const newItem = {
                    id: randomId(),
                    catalog_data_id: catalogItem.id,
                    description: catalogItem.description,
                    unit: catalogItem.unit || 'EA',
                    default_quantity: catalogItem.quantity ?? 1,
                    material_unit_cost: catalogItem.material_unit_cost ?? '',
                    labor_unit_cost: catalogItem.labor_unit_cost ?? '',
                };
                return {
                    ...section,
                    items: [...section.items, newItem],
                };
            }),
        }));
        setBuilderMessage('');
    };

    const numberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? null : parsed;
    };

    const handleBuilderSubmit = async (event) => {
        event.preventDefault();
        if (!builderState.name.trim()) {
            setBuilderMessage('Template name is required.');
            return;
        }
        if (!builderState.sections.length) {
            setBuilderMessage('Add at least one section.');
            return;
        }
        const emptySection = builderState.sections.find((section) => section.items.length === 0);
        if (emptySection) {
            setBuilderMessage(`Section "${emptySection.title}" needs at least one catalog item.`);
            return;
        }

        const payload = {
            name: builderState.name.trim(),
            description: builderState.description?.trim() || '',
            project_type: builderState.projectType,
            status: builderState.status,
            sections: builderState.sections.map((section, index) => ({
                title: section.title,
                csi_code: section.csi_code || null,
                csi_title: section.csi_title || null,
                sort_index: index,
                items: section.items.map((item, idx) => ({
                    catalog_data_id: item.catalog_data_id,
                    description: item.description,
                    unit: item.unit || null,
                    default_quantity: numberOrNull(item.default_quantity),
                    material_unit_cost: numberOrNull(item.material_unit_cost),
                    labor_unit_cost: numberOrNull(item.labor_unit_cost),
                    sort_index: idx,
                })),
            })),
        };

        const isEditingTemplate = builderMode === 'edit' && templateBeingEdited;
        const targetEndpoint = isEditingTemplate ? `${TEMPLATES_ENDPOINT}/${templateBeingEdited.id}` : TEMPLATES_ENDPOINT;
        const method = isEditingTemplate ? 'PUT' : 'POST';

        try {
            setBuilderMessage(isEditingTemplate ? 'Updating template…' : 'Saving template…');
            const response = await fetch(targetEndpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || (isEditingTemplate ? 'Failed to update template.' : 'Failed to create template.'));
            }
            await loadTemplates();
            setBuilderMessage(isEditingTemplate ? 'Template updated successfully.' : 'Template created successfully.');
            setTimeout(() => closeBuilderModal(), 900);
        } catch (error) {
            console.error(error);
            setBuilderMessage(error.message || (isEditingTemplate ? 'Failed to update template.' : 'Failed to create template.'));
        }
    };

    const handleDuplicateTemplate = async (templateId) => {
        try {
            const response = await fetch(`${TEMPLATES_ENDPOINT}/${templateId}/duplicate`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to duplicate template');
            await loadTemplates();
            setStatusMessage('Template duplicated.');
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to duplicate template.');
        }
    };

    const handleDeleteTemplate = async (templateId, templateName) => {
        const confirmed = window.confirm(`Delete template "${templateName}"? This action cannot be undone.`);
        if (!confirmed) return;
        try {
            const response = await fetch(`${TEMPLATES_ENDPOINT}/${templateId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete template');
            }
            await loadTemplates();
            setStatusMessage('Template deleted.');
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to delete template.');
        }
    };

    const handlePromoteChange = (field, value) => {
        setPromoteState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePromoteSubmit = async (event) => {
        event.preventDefault();
        if (!promoteState.projectId || !promoteState.uploadId || !promoteState.name.trim()) {
            setPromoteMessage('Fill all required fields.');
            return;
        }
        const payload = {
            project_id: Number(promoteState.projectId),
            excel_data_id: Number(promoteState.uploadId),
            name: promoteState.name.trim(),
            description: promoteState.description?.trim() || '',
            project_type: promoteState.projectType,
            status: promoteState.templateStatus,
        };
        try {
            setPromoteMessage('Promoting template…');
            const response = await fetch(`${TEMPLATES_ENDPOINT}/promote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to promote template.');
            }
            await loadTemplates();
            setPromoteMessage('Template created from estimate.');
            setTimeout(() => closePromoteModal(), 900);
        } catch (error) {
            console.error(error);
            setPromoteMessage(error.message || 'Failed to promote template.');
        }
    };

    const filteredUploads = useMemo(() => {
        if (!promoteState.projectId) return [];
        const pid = Number(promoteState.projectId);
        return uploads.filter((upload) => upload.project_id === pid);
    }, [promoteState.projectId, uploads]);

    const filteredCatalogItems = useMemo(() => {
        const needle = catalogQuery.toLowerCase();
        if (!needle) return catalogItems.slice(0, 25);
        return catalogItems
            .filter((item) => {
                return (
                    (item.description || '').toLowerCase().includes(needle) ||
                    (item.csi_code || '').toLowerCase().includes(needle) ||
                    (item.csi_title || '').toLowerCase().includes(needle)
                );
            })
            .slice(0, 25);
    }, [catalogItems, catalogQuery]);

    const formatUploadLabel = (upload) => {
        if (!upload) return '';
        const base = `#${upload.id} • ${upload.original_filename || 'Upload'}`;
        if (upload.status === 'estimate') {
            return `${base} (Estimate)`;
        }
        return base;
    };

    const getProjectTypeColor = (type) => {
        switch (type) {
            case 'Residential':
                return '#22c55e';
            case 'Commercial':
                return '#2563eb';
            case 'Industrial':
                return '#dc2626';
            case 'Renovation':
                return '#f59e0b';
            default:
                return '#475569';
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem',
                }}
            >
                <div>
                    <h2 style={{ margin: 0 }}>Template Library</h2>
                    <p style={{ margin: 0, color: '#475569' }}>Curate CSI-based templates from the catalog or promote live estimates.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={openPromoteModal}
                        style={{
                            border: '1px solid #c7d2fe',
                            background: '#eef2ff',
                            color: '#312e81',
                            padding: '0.6rem 1rem',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        ⬆️ Promote Estimate
                    </button>
                    <button
                        onClick={() => openBuilderModal()}
                        style={{
                            border: 'none',
                            background: '#2563eb',
                            color: 'white',
                            padding: '0.6rem 1rem',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        ➕ Create Template
                    </button>
                </div>
            </div>

            {statusMessage && (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        border: '1px solid #fde68a',
                        background: '#fef3c7',
                        color: '#92400e',
                    }}
                >
                    {statusMessage}
            </div>
            )}

            {templatesLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    <p>Loading templates…</p>
                </div>
            ) : templates.length === 0 ? (
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
                    <h4 style={{ color: '#666', marginBottom: '10px' }}>No templates yet</h4>
                    <p style={{ color: '#999' }}>Create a template from catalog data or promote an existing estimate.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1rem' }}>
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            style={{
                                background: 'white',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                padding: '1.25rem',
                                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                        <h3 style={{ margin: 0 }}>{template.name}</h3>
                                        <span
                                            style={{
                                                background: getProjectTypeColor(template.project_type),
                                                color: 'white',
                                                padding: '0.2rem 0.7rem',
                                                borderRadius: 999,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {template.project_type}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#475569' }}>{template.description || '—'}</p>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
                                    <div>Updated {new Date(template.updated_at).toLocaleDateString()}</div>
                                    <div>Status: <strong>{template.status.toUpperCase()}</strong></div>
                                </div>
                            </div>

                            <div
                                style={{
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                    gap: '0.75rem',
                                    background: '#f8fafc',
                                    borderRadius: 8,
                                    padding: '0.75rem',
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sections</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{template.sections.length}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Items</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{template.total_items}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Version</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{template.version}</div>
                                </div>
                            </div>

                            <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ background: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '0.35rem 0.6rem' }}>Section</th>
                                            <th style={{ textAlign: 'left', padding: '0.35rem 0.6rem' }}>CSI</th>
                                            <th style={{ textAlign: 'center', padding: '0.35rem 0.6rem' }}>Items</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {template.sections.map((section) => (
                                            <tr key={section.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.35rem 0.6rem' }}>{section.title}</td>
                                                <td style={{ padding: '0.35rem 0.6rem' }}>{section.csi_code || '—'}</td>
                                                <td style={{ padding: '0.35rem 0.6rem', textAlign: 'center' }}>{section.items.length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => openBuilderModal(template)}
                                    style={{
                                        border: '1px solid #93c5fd',
                                        background: '#dbeafe',
                                        color: '#1d4ed8',
                                        padding: '0.5rem 0.9rem',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDuplicateTemplate(template.id)}
                                    style={{
                                        border: '1px solid #cbd5f5',
                                        background: '#e0e7ff',
                                        color: '#3730a3',
                                        padding: '0.5rem 0.9rem',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    📋 Duplicate
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                                    style={{
                                        border: '1px solid #fecaca',
                                        background: '#fee2e2',
                                        color: '#b91c1c',
                                        padding: '0.5rem 0.9rem',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isBuilderOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 1100,
                            maxHeight: '95vh',
                            overflowY: 'auto',
                            background: 'white',
                            borderRadius: 12,
                            padding: '1.5rem',
                            boxShadow: '0 25px 60px rgba(15,23,42,0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{builderMode === 'edit' ? 'Edit Template' : 'New Template'}</h3>
                                <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                                    {builderMode === 'edit'
                                        ? 'Update CSI sections and catalog items for this template.'
                                        : 'Select CSI sections and attach catalog items with default quantities.'}
                                </p>
                            </div>
                            <button
                                onClick={closeBuilderModal}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.75rem',
                                    cursor: 'pointer',
                                    color: '#475569',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleBuilderSubmit}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                    gap: '0.75rem',
                                }}
                            >
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Name *</label>
                                    <input
                                        type="text"
                                        value={builderState.name}
                                        onChange={(event) => handleBuilderMetaChange('name', event.target.value)}
                                        required
                                        placeholder="e.g., Core & Shell Baseline"
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Project Type</label>
                                    <select
                                        value={builderState.projectType}
                                        onChange={(event) => handleBuilderMetaChange('projectType', event.target.value)}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                    >
                                        {PROJECT_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Status</label>
                                    <select
                                        value={builderState.status}
                                        onChange={(event) => handleBuilderMetaChange('status', event.target.value)}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                    >
                                        {TEMPLATE_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Description</label>
                                <textarea
                                    value={builderState.description}
                                    onChange={(event) => handleBuilderMetaChange('description', event.target.value)}
                                    rows={3}
                                    placeholder="Optional: capture assumptions or scope."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5f5', resize: 'vertical' }}
                                />
                            </div>

                            <div
                                style={{
                                    background: '#f8fafc',
                                    padding: '0.85rem',
                                    borderRadius: 10,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ flex: '1 1 160px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>CSI Code</label>
                                    <input
                                        type="text"
                                        list="csi-codes"
                                        value={builderState.newSectionCsi}
                                        onChange={(event) => handleBuilderMetaChange('newSectionCsi', event.target.value)}
                                        placeholder="e.g., 03 30 00"
                                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                    />
                                    <datalist id="csi-codes">
                                        {CSI_MASTERFORMAT_OPTIONS.map((option) => (
                                            <option key={option.code} value={option.code}>
                                                {option.title}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>
                                <div style={{ flex: '2 1 260px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Section Title</label>
                                    <input
                                        type="text"
                                        value={builderState.newSectionTitle}
                                        onChange={(event) => handleBuilderMetaChange('newSectionTitle', event.target.value)}
                                        placeholder="Concrete – Place & Finish"
                                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addSection}
                                    style={{
                                        border: 'none',
                                        background: '#0ea5e9',
                                        color: 'white',
                                        padding: '0.65rem 1.2rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ➕ Add Section
                                </button>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
                                    gap: '1rem',
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>Sections & Items</h4>
                                        {activeSectionId && (
                                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                Target section: <strong>{builderState.sections.find((section) => section.id === activeSectionId)?.title}</strong>
                                            </div>
                                        )}
                                    </div>
                                    {builderState.sections.length === 0 ? (
                                        <div
                                            style={{
                                                padding: '1rem',
                                                border: '1px dashed #cbd5f5',
                                                borderRadius: 10,
                                                textAlign: 'center',
                                                color: '#64748b',
                                            }}
                                        >
                                            Add a CSI section to begin dropping catalog items.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {builderState.sections.map((section) => (
                                                <div
                                                    key={section.id}
                                                    style={{
                                                        border: `2px solid ${activeSectionId === section.id ? '#2563eb' : '#e2e8f0'}`,
                                                        borderRadius: 10,
                                                        padding: '0.75rem',
                                                        background: activeSectionId === section.id ? '#eff6ff' : 'white',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{section.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                                                                {section.csi_code ? `${section.csi_code} • ${section.csi_title || 'CSI'}` : 'No CSI code'}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActiveSectionId(section.id)}
                                                                style={{
                                                                    border: '1px solid #cbd5f5',
                                                                    background: 'white',
                                                                    color: '#1d4ed8',
                                                                    padding: '0.3rem 0.7rem',
                                                                    borderRadius: 6,
                                                                    fontSize: '0.75rem',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Target
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSection(section.id)}
                                                                style={{
                                                                    border: '1px solid #fecaca',
                                                                    background: '#fee2e2',
                                                                    color: '#b91c1c',
                                                                    padding: '0.3rem 0.7rem',
                                                                    borderRadius: 6,
                                                                    fontSize: '0.75rem',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {section.items.length === 0 ? (
                                                        <div
                                                            style={{
                                                                border: '1px dashed #cbd5f5',
                                                                borderRadius: 8,
                                                                padding: '0.6rem',
                                                                marginTop: '0.7rem',
                                                                fontSize: '0.85rem',
                                                                color: '#64748b',
                                                            }}
                                                        >
                                                            No catalog items yet.
                                                        </div>
                                                    ) : (
                                                        <table
                                                            style={{
                                                                width: '100%',
                                                                borderCollapse: 'collapse',
                                                                marginTop: '0.7rem',
                                                                fontSize: '0.85rem',
                                                            }}
                                                        >
                                                            <thead>
                                                                <tr style={{ background: '#f8fafc' }}>
                                                                    <th style={{ textAlign: 'left', padding: '0.35rem 0.4rem' }}>Description</th>
                                                                    <th style={{ textAlign: 'center', padding: '0.35rem 0.4rem', width: '70px' }}>Qty</th>
                                                                    <th style={{ textAlign: 'center', padding: '0.35rem 0.4rem', width: '70px' }}>Unit</th>
                                                                    <th style={{ textAlign: 'center', padding: '0.35rem 0.4rem', width: '90px' }}>Material</th>
                                                                    <th style={{ textAlign: 'center', padding: '0.35rem 0.4rem', width: '90px' }}>Labor</th>
                                                                    <th></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {section.items.map((item) => (
                                                                    <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                                        <td style={{ padding: '0.35rem 0.4rem' }}>{item.description}</td>
                                                                        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                                                                            <input
                                                                                type="number"
                                                                                value={item.default_quantity ?? ''}
                                                                                onChange={(event) =>
                                                                                    updateSectionItem(section.id, item.id, 'default_quantity', event.target.value)
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    maxWidth: 70,
                                                                                    padding: '0.2rem 0.3rem',
                                                                                    borderRadius: 6,
                                                                                    border: '1px solid #cbd5f5',
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                                                                            <input
                                                                                type="text"
                                                                                value={item.unit || ''}
                                                                                onChange={(event) =>
                                                                                    updateSectionItem(section.id, item.id, 'unit', event.target.value)
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    maxWidth: 70,
                                                                                    padding: '0.2rem 0.3rem',
                                                                                    borderRadius: 6,
                                                                                    border: '1px solid #cbd5f5',
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.material_unit_cost ?? ''}
                                                                                onChange={(event) =>
                                                                                    updateSectionItem(section.id, item.id, 'material_unit_cost', event.target.value)
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    maxWidth: 90,
                                                                                    padding: '0.2rem 0.3rem',
                                                                                    borderRadius: 6,
                                                                                    border: '1px solid #cbd5f5',
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={item.labor_unit_cost ?? ''}
                                                                                onChange={(event) =>
                                                                                    updateSectionItem(section.id, item.id, 'labor_unit_cost', event.target.value)
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    maxWidth: 90,
                                                                                    padding: '0.2rem 0.3rem',
                                                                                    borderRadius: 6,
                                                                                    border: '1px solid #cbd5f5',
                                                                                }}
                                                                            />
                                                                        </td>
                                                                        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeSectionItem(section.id, item.id)}
                                                                                style={{
                                                                                    border: 'none',
                                                                                    background: 'transparent',
                                                                                    color: '#b91c1c',
                                                                                    cursor: 'pointer',
                                                                                    fontWeight: 700,
                                                                                }}
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0 }}>Catalog Items</h4>
                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            Showing {filteredCatalogItems.length} / {catalogItems.length}
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={catalogQuery}
                                        onChange={(event) => setCatalogQuery(event.target.value)}
                                        placeholder="Search description or CSI"
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 8,
                                            border: '1px solid #cbd5f5',
                                            marginBottom: '0.5rem',
                                        }}
                                    />
                                    <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem' }}>Description</th>
                                                    <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem', width: '70px' }}>CSI</th>
                                                    <th style={{ width: '70px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {catalogLoading ? (
                                                    <tr>
                                                        <td colSpan={3} style={{ textAlign: 'center', padding: '0.75rem' }}>
                                                            Loading catalog…
                                                        </td>
                                                    </tr>
                                                ) : filteredCatalogItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} style={{ textAlign: 'center', padding: '0.75rem' }}>
                                                            No catalog items found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCatalogItems.map((item) => (
                                                        <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '0.4rem 0.5rem' }}>{item.description}</td>
                                                            <td style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', color: '#475569' }}>
                                                                {item.csi_code || '—'}
                                                            </td>
                                                            <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                                                                <button
                                                                    type="button"
                                                                    disabled={!activeSectionId}
                                                                    onClick={() => addCatalogItemToSection(activeSectionId, item)}
                                                                    style={{
                                                                        border: 'none',
                                                                        background: activeSectionId ? '#22c55e' : '#cbd5f5',
                                                                        color: 'white',
                                                                        padding: '0.3rem 0.6rem',
                                                                        borderRadius: 6,
                                                                        fontSize: '0.75rem',
                                                                        cursor: activeSectionId ? 'pointer' : 'not-allowed',
                                                                    }}
                                                                >
                                                                    Add
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {builderMessage && (
                                <div
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: 8,
                                        background: builderMessage.includes('successfully') ? '#dcfce7' : '#fee2e2',
                                        color: builderMessage.includes('successfully') ? '#166534' : '#991b1b',
                                    }}
                                >
                                    {builderMessage}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={closeBuilderModal}
                                    style={{
                                        border: '1px solid #cbd5f5',
                                        background: 'white',
                                        color: '#1e293b',
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        border: 'none',
                                        background: '#2563eb',
                                        color: 'white',
                                        padding: '0.6rem 1.4rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {builderMode === 'edit' ? 'Update Template' : 'Save Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPromoteOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 520,
                            background: 'white',
                            borderRadius: 12,
                            padding: '1.5rem',
                            boxShadow: '0 25px 60px rgba(15,23,42,0.35)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Promote Estimate</h3>
                                <p style={{ margin: 0, color: '#475569' }}>Use an existing upload to seed a template.</p>
                            </div>
                            <button
                                onClick={closePromoteModal}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#475569',
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handlePromoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Project *</label>
                                <select
                                    value={promoteState.projectId}
                                    onChange={(event) => handlePromoteChange('projectId', event.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
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
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Estimate Upload *</label>
                                <select
                                    value={promoteState.uploadId}
                                    onChange={(event) => handlePromoteChange('uploadId', event.target.value)}
                                    required
                                    disabled={!promoteState.projectId}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                >
                                    <option value="">{promoteState.projectId ? 'Select upload' : 'Select a project first'}</option>
                                    {filteredUploads.map((upload) => (
                                        <option key={upload.id} value={upload.id}>
                                            {formatUploadLabel(upload)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Template Name *</label>
                                <input
                                    type="text"
                                    value={promoteState.name}
                                    onChange={(event) => handlePromoteChange('name', event.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Description</label>
                                <textarea
                                    rows={3}
                                    value={promoteState.description}
                                    onChange={(event) => handlePromoteChange('description', event.target.value)}
                                    style={{ width: '100%', padding: '0.7rem', borderRadius: 8, border: '1px solid #cbd5f5', resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Project Type</label>
                                <select
                                    value={promoteState.projectType}
                                    onChange={(event) => handlePromoteChange('projectType', event.target.value)}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                >
                                    {PROJECT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Template Status</label>
                                <select
                                    value={promoteState.templateStatus}
                                    onChange={(event) => handlePromoteChange('templateStatus', event.target.value)}
                                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5f5' }}
                                >
                                    {TEMPLATE_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {promoteMessage && (
                                <div
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: 8,
                                        background: promoteMessage.includes('created') ? '#dcfce7' : '#fee2e2',
                                        color: promoteMessage.includes('created') ? '#166534' : '#991b1b',
                                    }}
                                >
                                    {promoteMessage}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={closePromoteModal}
                                    style={{
                                        border: '1px solid #cbd5f5',
                                        background: 'white',
                                        color: '#1e293b',
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        border: 'none',
                                        background: '#0ea5e9',
                                        color: 'white',
                                        padding: '0.6rem 1.4rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Promote
                                </button>
                            </div>
                        </form>
                        </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesList;
