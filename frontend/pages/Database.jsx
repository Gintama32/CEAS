import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CSI_MASTERFORMAT_OPTIONS } from '../src/constants/csiMasterFormat';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const PROJECT_ENDPOINT = `${API_BASE_URL}/project/`;
const EXCEL_DATA_ENDPOINT = `${API_BASE_URL}/excel-data/`;
const DATA_ENDPOINT = `${API_BASE_URL}/data/`;

const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
};

const Database = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('all');
    const [search, setSearch] = useState('');
    const [csiFilter, setCsiFilter] = useState('');
    const [uploadActionStatus, setUploadActionStatus] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setStatus('');
            try {
                const [projectResp, uploadResp, rowResp] = await Promise.all([
                    fetch(PROJECT_ENDPOINT),
                    fetch(EXCEL_DATA_ENDPOINT),
                    fetch(DATA_ENDPOINT),
                ]);
                if (!projectResp.ok) throw new Error('Failed to load projects');
                if (!uploadResp.ok) throw new Error('Failed to load uploads');
                if (!rowResp.ok) throw new Error('Failed to load data rows');

                const [projectData, uploadData, rowData] = await Promise.all([
                    projectResp.json(),
                    uploadResp.json(),
                    rowResp.json(),
                ]);
                setProjects(projectData);
                setUploads(uploadData);
                setRows(rowData);
            } catch (error) {
                console.error(error);
                setStatus(error.message || 'Failed to load database information.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const projectLookup = useMemo(() => {
        const lookup = {};
        for (const project of projects) {
            lookup[project.id] = project;
        }
        return lookup;
    }, [projects]);

    const filteredUploads = useMemo(() => {
        return uploads.filter((upload) => {
            if (selectedProjectId !== 'all' && upload.project_id !== Number(selectedProjectId)) {
                return false;
            }
            if (!search.trim()) return true;
            const needle = search.toLowerCase();
            return (
                (upload.original_filename || '').toLowerCase().includes(needle) ||
                (projectLookup[upload.project_id]?.project_name || '').toLowerCase().includes(needle)
            );
        });
    }, [uploads, selectedProjectId, search, projectLookup]);

    const filteredRows = useMemo(() => {
        const csiNeedle = csiFilter.trim().toLowerCase();
        return rows.filter((row) => {
            if (selectedProjectId !== 'all' && row.project_id !== Number(selectedProjectId)) {
                return false;
            }
            if (csiNeedle) {
                const rowCode = (row.csi_code || '').toLowerCase();
                const rowTitle = (row.csi_title || '').toLowerCase();
                if (!rowCode.includes(csiNeedle) && !rowTitle.includes(csiNeedle)) {
                    return false;
                }
            }
            if (!search.trim()) return true;
            const needle = search.toLowerCase();
            return (
                (row.description || '').toLowerCase().includes(needle) ||
                (row.csi_code || '').toLowerCase().includes(needle) ||
                (row.csi_title || '').toLowerCase().includes(needle)
            );
        });
    }, [rows, selectedProjectId, search, csiFilter]);

    const handleDeleteUpload = async (upload) => {
        const confirmMessage = `Delete "${upload.original_filename}" and all parsed rows? This cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }
        try {
            setUploadActionStatus('Deleting upload…');
            const response = await fetch(`${EXCEL_DATA_ENDPOINT}${upload.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete upload.');
            }
            setUploads((prev) => prev.filter((existing) => existing.id !== upload.id));
            setRows((prev) => prev.filter((row) => row.excel_data_id !== upload.id));
            setUploadActionStatus('Upload deleted.');
            setTimeout(() => setUploadActionStatus(''), 2500);
        } catch (error) {
            console.error(error);
            setUploadActionStatus(error.message || 'Failed to delete upload.');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem' }}>
                <h1>Data Catalog</h1>
                <p>Loading catalog information…</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0 }}>Data Catalog</h1>
                <button
                    onClick={() => navigate('/projects')}
                    style={{
                        backgroundColor: '#1d7a5f',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1.2rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Manage Projects
                </button>
            </div>

            <p style={{ color: '#555', marginTop: '0.5rem' }}>
                Upload Excel workbooks, review parsed rows, and curate reusable cost data before building estimates.
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem',
                    alignItems: 'flex-end',
                }}
            >
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Project Filter</label>
                    <select
                        value={selectedProjectId}
                        onChange={(event) => setSelectedProjectId(event.target.value)}
                        style={{ minWidth: 220, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc' }}
                    >
                        <option value="all">All Projects</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                #{project.id} • {project.project_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Search</label>
                    <input
                        type="text"
                        placeholder="Search uploads or descriptions"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>CSI Filter</label>
                    <input
                        list="database-csi-options"
                        value={csiFilter}
                        onChange={(event) => setCsiFilter(event.target.value)}
                        placeholder="Filter by CSI code or title"
                        style={{ minWidth: 220, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ccc' }}
                    />
                    <datalist id="database-csi-options">
                        {CSI_MASTERFORMAT_OPTIONS.map((option) => (
                            <option key={option.code} value={option.code}>
                                {option.title}
                            </option>
                        ))}
                    </datalist>
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Actions</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/projects')}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                            }}
                        >
                            Upload Excel
                        </button>
                        <button
                            onClick={() => navigate('/projects')}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 6,
                                border: '1px solid #d1d5db',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                            }}
                        >
                            View Projects
                        </button>
                    </div>
                </div>
            </div>

            {status && (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 6,
                        border: '1px solid #ffe082',
                        background: '#fff8e1',
                    }}
                >
                    {status}
                </div>
            )}

            <section
                style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    marginBottom: '1.5rem',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>Excel Uploads</h2>
                    <span style={{ color: '#777', fontSize: '0.9rem' }}>{filteredUploads.length} upload(s)</span>
                </div>
                {uploadActionStatus && (
                    <div
                        style={{
                            marginTop: '0.75rem',
                            padding: '0.6rem 0.8rem',
                            borderRadius: 8,
                            border: '1px solid #fee2e2',
                            background: '#fef2f2',
                            color: '#b91c1c',
                        }}
                    >
                        {uploadActionStatus}
                    </div>
                )}
                <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Filename</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Project</th>
                                <th style={{ textAlign: 'center', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Rows</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Uploaded</th>
                                <th style={{ textAlign: 'center', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUploads.map((upload) => (
                                <tr key={upload.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '0.6rem' }}>{upload.original_filename}</td>
                                    <td style={{ padding: '0.6rem' }}>
                                        {projectLookup[upload.project_id]?.project_name || `#${upload.project_id}`}
                                    </td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{upload.row_count ?? '—'}</td>
                                    <td style={{ padding: '0.6rem' }}>{upload.status || '—'}</td>
                                    <td style={{ padding: '0.6rem' }}>{formatDate(upload.created_at)}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDeleteUpload(upload)}
                                            style={{
                                                border: '1px solid #fecaca',
                                                background: '#fee2e2',
                                                color: '#b91c1c',
                                                padding: '0.35rem 0.8rem',
                                                borderRadius: 6,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUploads.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '0.75rem', textAlign: 'center', color: '#777' }}>
                                        No uploads match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section
                style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>Parsed Line Items</h2>
                    <span style={{ color: '#777', fontSize: '0.9rem' }}>{filteredRows.length} row(s)</span>
                </div>
                <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Project</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>CSI Code</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>CSI Title</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                                <th style={{ textAlign: 'center', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                                <th style={{ textAlign: 'center', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Unit</th>
                                <th style={{ textAlign: 'right', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Material $</th>
                                <th style={{ textAlign: 'right', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Labor $</th>
                                <th style={{ textAlign: 'left', padding: '0.65rem', borderBottom: '1px solid #e5e7eb' }}>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => (
                                <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '0.6rem' }}>
                                        {projectLookup[row.project_id]?.project_name || `#${row.project_id}`}
                                    </td>
                                    <td style={{ padding: '0.6rem' }}>{row.csi_code || '—'}</td>
                                    <td style={{ padding: '0.6rem' }}>{row.csi_title || '—'}</td>
                                    <td style={{ padding: '0.6rem' }}>{row.description}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{row.quantity ?? '—'}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{row.unit ?? '—'}</td>
                                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                                        {row.material_amount != null ? `$${Number(row.material_amount).toFixed(2)}` : '—'}
                                    </td>
                                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                                        {row.labor_amount != null ? `$${Number(row.labor_amount).toFixed(2)}` : '—'}
                                    </td>
                                    <td style={{ padding: '0.6rem' }}>{row.created_at ? formatDate(row.created_at) : '—'}</td>
                                </tr>
                            ))}
                                {filteredRows.length === 0 && (
                                    <tr>
                                <td colSpan="9" style={{ padding: '0.75rem', textAlign: 'center', color: '#777' }}>
                                            No data rows match your filters.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Database;

