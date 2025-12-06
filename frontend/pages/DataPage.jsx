import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ItemInput from '../src/components/ItemInput';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const PROJECT_ENDPOINT = `${API_BASE_URL}/project/`;
const EXCEL_DATA_ENDPOINT = `${API_BASE_URL}/excel-data/`;
const EXCEL_UPLOAD_ENDPOINT = `${API_BASE_URL}/excel-data/upload`;
const DATA_ENDPOINT = `${API_BASE_URL}/data/`;

const DataPage = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    const [project, setProject] = useState(null);
    const [excelUploads, setExcelUploads] = useState([]);
    const [selectedUploadId, setSelectedUploadId] = useState(null);

    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [manualStatus, setManualStatus] = useState('');
    const [pageStatus, setPageStatus] = useState('');
    const [isCatalogMode, setIsCatalogMode] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            setPageStatus('No project selected. Please go back and choose a project.');
            return;
        }

        const loadProjectData = async () => {
            setLoading(true);
            setPageStatus('');
            try {
                const [projectResponse, uploadsResponse] = await Promise.all([
                    fetch(`${PROJECT_ENDPOINT}${projectId}`),
                    fetch(EXCEL_DATA_ENDPOINT),
                ]);

                if (!projectResponse.ok) {
                    const errorText = await projectResponse.text();
                    throw new Error(errorText || 'Failed to load project.');
                }

                if (!uploadsResponse.ok) {
                    const errorText = await uploadsResponse.text();
                    throw new Error(errorText || 'Failed to load estimates.');
                }

                const projectData = await projectResponse.json();
                const uploadsData = await uploadsResponse.json();

                setProject(projectData);
                const filteredUploads = uploadsData
                    .filter((upload) => upload.project_id === Number(projectId))
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setExcelUploads(filteredUploads);
                setSelectedUploadId((current) => current ?? filteredUploads[0]?.id ?? null);
                if (!filteredUploads.length) {
                    setIsCatalogMode(true);
                }
            } catch (error) {
                console.error('Failed to load page data:', error);
                setPageStatus(error.message || 'Failed to load page data.');
            } finally {
                setLoading(false);
            }
        };

        loadProjectData();
    }, [projectId]);

    const projectLabel = useMemo(() => {
        if (!project) return 'Unknown Project';
        const parts = [
            `#${project.id}`,
            project.project_name || 'Untitled Project',
            project.project_location ? `(${project.project_location})` : null,
        ].filter(Boolean);
        return parts.join(' ');
    }, [project]);

    const formatUploadLabel = (upload) => {
        if (!upload) return '';
        const base = `#${upload.id} • ${upload.original_filename || 'Upload'}`;
        if (upload.status === 'estimate') {
            return `${base} (Estimate)`;
        }
        return base;
    };

    const handleManualSubmit = async ({ items }) => {
        if (!project) {
            setManualStatus('Select a project before saving new items.');
            return false;
        }

        if (!items?.length) {
            setManualStatus('Please add at least one line item.');
            return false;
        }

        if (!isCatalogMode && !selectedUploadId) {
            setManualStatus('Select an upload or enable catalog mode.');
            return false;
        }

        setManualStatus('');
        setIsSavingManual(true);
        let savedCount = 0;

        try {
            for (const item of items) {
                const payload = {
                    project_id: project.id,
                    excel_data_id: isCatalogMode ? null : selectedUploadId,
                    description: item.description,
                    csi_code: item.csi_code ?? null,
                    csi_title: item.csi_title ?? null,
                    quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || null,
                    unit: item.unit || null,
                    material_unit_cost: typeof item.material_unit_cost === 'number'
                        ? item.material_unit_cost
                        : Number(item.material_unit_cost) || null,
                    labor_unit_cost: typeof item.labor_unit_cost === 'number'
                        ? item.labor_unit_cost
                        : Number(item.labor_unit_cost) || null,
                    material_amount: typeof item.material_amount === 'number'
                        ? item.material_amount
                        : Number(item.material_amount) || null,
                    labor_amount: typeof item.labor_amount === 'number'
                        ? item.labor_amount
                        : Number(item.labor_amount) || null,
                };

                const totalUnitCost = (payload.material_unit_cost || 0) + (payload.labor_unit_cost || 0);
                const totalAmount = (payload.material_amount || 0) + (payload.labor_amount || 0);
                payload.total_unit_cost = totalUnitCost || null;
                payload.total_amount = totalAmount || null;

                const response = await fetch(DATA_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to save line item.');
                }

                savedCount += 1;
            }

            const successMessage = `Successfully saved ${savedCount} item${savedCount === 1 ? '' : 's'}.`;
            setManualStatus(successMessage);
            alert(successMessage);
            return true;
        } catch (error) {
            console.error('Failed to save manual items:', error);
            setManualStatus(error.message || 'Failed to save line items.');
            return false;
        } finally {
            setIsSavingManual(false);
        }
    };

    const handleUploadSubmit = async (event) => {
        event.preventDefault();
        setUploadStatus('');

        if (!project || !project.id) {
            setUploadStatus('No project selected. Please go back and choose a project.');
            return;
        }

        if (!file) {
            setUploadStatus('Please choose an Excel (.xlsx/.xlsm) file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('project_id', project.id);
        formData.append('file', file);

        try {
            setIsUploading(true);
            const response = await fetch(EXCEL_UPLOAD_ENDPOINT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to upload Excel file.');
            }

            const data = await response.json();
            setUploadStatus(`Uploaded "${data.original_filename}" (${data.row_count} rows).`);
            setFile(null);
            event.target.reset();

            setExcelUploads((prev) => {
                const next = [
                    {
                        ...data,
                        id: data.id,
                        project_id: project.id,
                    },
                    ...prev,
                ];
            setSelectedUploadId(data.id);
            setIsCatalogMode(false);
                return next;
            });

            setTimeout(() => {
                navigate(`/projects/${projectId}/estimates`);
            }, 1500);
        } catch (error) {
            console.error('Excel upload failed:', error);
            setUploadStatus(error.message || 'Upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
                    ← Back to Projects
                </button>
                <p>Loading project data...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
            <button onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
                ← Back to Projects
            </button>

            <h1 style={{ marginBottom: '0.5rem' }}>Manage Project Data</h1>
            <p style={{ maxWidth: 540, color: '#555' }}>
                Upload an Excel workbook or append individual descriptions to an existing estimate.
                Each manual line item will be saved to the selected upload so it shows up in estimates immediately.
            </p>

            <div style={{ margin: '1rem 0', padding: '1rem', background: '#f5f5f5', borderRadius: 8 }}>
                <strong>Project:</strong> {projectLabel}
            </div>

            {pageStatus && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#fff3cd', borderRadius: 6, border: '1px solid #ffeeba' }}>
                    {pageStatus}
                </div>
            )}

            <section style={{ marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Append New Descriptions</h2>
                        <p style={{ color: '#666', marginTop: '0.25rem' }}>
                            Add catalog items manually or append them to an existing estimate upload.
                        </p>
                    </div>
                    {excelUploads.length > 0 && (
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Estimate upload</label>
                            <select
                                value={selectedUploadId || ''}
                                onChange={(event) => setSelectedUploadId(Number(event.target.value) || null)}
                                style={{ minWidth: 260, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                                disabled={isCatalogMode}
                            >
                                {excelUploads.map((upload) => (
                                    <option key={upload.id} value={upload.id}>
                                        {formatUploadLabel(upload)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div
                    style={{
                        marginTop: '1rem',
                        padding: '0.9rem 1rem',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                    }}
                >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <input
                            type="checkbox"
                            checked={isCatalogMode}
                            onChange={(event) => setIsCatalogMode(event.target.checked)}
                            disabled={!excelUploads.length}
                        />
                        Add directly to catalog (no upload)
                    </label>
                    <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
                        When enabled, new items are saved without an Excel upload and become part of your reusable catalog. When disabled,
                        items are appended to the selected upload so they flow straight into the estimate.
                    </p>
                    {!excelUploads.length && (
                        <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem' }}>
                            No uploads yet—catalog mode is enabled by default.
                        </p>
                    )}
                </div>

                {manualStatus && (
                    <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', color: '#166534' }}>
                        {manualStatus}
                    </div>
                )}
                {isSavingManual && (
                    <p style={{ color: '#555', marginBottom: '0.5rem' }}>Saving items…</p>
                )}
                <ItemInput onDataSubmit={handleManualSubmit} />
            </section>

            <section style={{ background: 'white', padding: '1.5rem', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <h2 style={{ marginTop: 0 }}>Import Data from Excel</h2>
                <p style={{ color: '#666' }}>
                    Uploading a workbook automatically creates an estimate upload and populates rows that appear under Project Estimates.
                </p>
                <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
                    <label>
                        Excel file (.xlsx / .xlsm)
                        <input
                            type="file"
                            name="file"
                            accept=".xlsx,.xlsm"
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                        />
                    </label>

                    <button type="submit" disabled={isUploading}>
                        {isUploading ? 'Uploading…' : 'Import'}
                    </button>
                </form>

                {uploadStatus && (
                    <p style={{ marginTop: '1rem', color: uploadStatus.startsWith('Uploaded') ? 'green' : 'red' }}>
                        {uploadStatus}
                    </p>
                )}
            </section>
        </div>
    );
};

export default DataPage;