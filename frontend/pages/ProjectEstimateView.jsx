import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CSI_MASTERFORMAT_OPTIONS, findCsiByCode } from '../src/constants/csiMasterFormat';

const API_BASE_URL = 'http://localhost:8000/api/v1';
const DATA_ENDPOINT = `${API_BASE_URL}/data/`;
const PROJECT_ENDPOINT = `${API_BASE_URL}/project/`;
const ESTIMATES_ENDPOINT = `${API_BASE_URL}/estimates/`;

const UNIT_OPTIONS = ['SF', 'EA', 'LS', 'LF', 'CY', 'SY', 'TON', 'HR'];

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const getCsiLabel = (code, title) => {
    if (!code && !title) return 'Uncoded';
    if (code && title) return `${code} ${title}`;
    return code || title || 'Uncoded';
};

const ProjectEstimateView = ({ project: propProject, excelDataId: propExcelDataId, estimateMetadata }) => {
    const navigate = useNavigate();
    const { projectId, estimateId } = useParams();
    const [project, setProject] = useState(propProject);
    const [estimateInfo, setEstimateInfo] = useState(estimateMetadata || null);
    const excelDataId = propExcelDataId ?? estimateInfo?.excel_data_id ?? null;
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [collapsedSections, setCollapsedSections] = useState({});
    const [statusMessage, setStatusMessage] = useState('');
    const [manualStatus, setManualStatus] = useState('');
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [manualValues, setManualValues] = useState({
        csi_code: '',
        csi_title: '',
        description: '',
        quantity: '',
        unit: 'SF',
        material_unit_cost: '',
        material_amount: '',
        labor_unit_cost: '',
        labor_amount: '',
    });
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editValues, setEditValues] = useState({
        quantity: '',
        material_unit_cost: '',
        labor_unit_cost: '',
    });
    const existingCsiOptions = useMemo(() => {
        const map = new Map();
        rows.forEach((row) => {
            if (row.csi_code) {
                if (!map.has(row.csi_code)) {
                    map.set(row.csi_code, row.csi_title || '');
                }
            }
        });
        return Array.from(map.entries()).map(([code, title]) => ({ code, title }));
    }, [rows]);

    useEffect(() => {
        const loadProject = async () => {
            if (propProject) {
                setProject(propProject);
                return;
            }
            if (projectId) {
                try {
                    const response = await fetch(`${PROJECT_ENDPOINT}${projectId}`);
                    if (!response.ok) throw new Error('Failed to load project');
                    const data = await response.json();
                    setProject(data);
                } catch (error) {
                    console.error(error);
                    setStatusMessage(error.message || 'Failed to load project');
                }
            }
        };

        loadProject();
    }, [projectId, propProject]);

    useEffect(() => {
        if (estimateMetadata) {
            setEstimateInfo(estimateMetadata);
        }
    }, [estimateMetadata]);

    useEffect(() => {
        if (estimateMetadata || !estimateId) {
            return;
        }
        let isCancelled = false;
        const loadEstimateDetails = async () => {
            try {
                const response = await fetch(`${ESTIMATES_ENDPOINT}${estimateId}`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Failed to load estimate details');
                }
                const data = await response.json();
                if (!isCancelled) {
                    setEstimateInfo(data);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error(error);
                    setStatusMessage(error.message || 'Failed to load estimate details');
                }
            }
        };

        loadEstimateDetails();

        return () => {
            isCancelled = true;
        };
    }, [estimateId, estimateMetadata]);

    useEffect(() => {
        const loadRows = async () => {
            if (!project) return;
            const datasetResolved = Boolean(propExcelDataId || estimateInfo);
            if (!datasetResolved) return;
            if (!excelDataId) {
                setRows([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const response = await fetch(DATA_ENDPOINT);
                if (!response.ok) throw new Error('Failed to load data rows');
                const data = await response.json();
                setRows(
                    data.filter((row) => row.project_id === project.id && row.excel_data_id === excelDataId)
                );
            } catch (error) {
                console.error(error);
                setStatusMessage(error.message || 'Failed to load rows');
            } finally {
                setLoading(false);
            }
        };

        loadRows();
    }, [project, excelDataId, estimateInfo, propExcelDataId]);

    const filteredRows = useMemo(() => {
        return rows
            .filter((row) => {
                if (!filterText.trim()) return true;
                const search = filterText.toLowerCase();
                return (
                    (row.description || '').toLowerCase().includes(search) ||
                    (row.csi_code || '').toLowerCase().includes(search) ||
                    (row.csi_title || '').toLowerCase().includes(search)
                );
            })
            .sort((a, b) => (a.excel_row_number || 0) - (b.excel_row_number || 0));
    }, [rows, filterText]);

    const groupedSections = useMemo(() => {
        const sections = {};
        for (const row of filteredRows) {
            const sectionLabel = getCsiLabel(row.csi_code, row.csi_title);
            if (!sections[sectionLabel]) sections[sectionLabel] = [];
            sections[sectionLabel].push(row);
        }
        return sections;
    }, [filteredRows]);

    const summaryMetrics = useMemo(() => {
        const sectionNames = Object.keys(groupedSections);
        let totalMaterial = 0;
        let totalLabor = 0;
        const csiTotals = {};
        const csiTitles = {};

        rows.forEach((row) => {
            const material = Number(row.material_amount) || 0;
            const labor = Number(row.labor_amount) || 0;
            totalMaterial += material;
            totalLabor += labor;
            const csiKey = row.csi_code || 'Uncoded';
            csiTotals[csiKey] = (csiTotals[csiKey] || 0) + material + labor;
            if (!csiTitles[csiKey] && row.csi_title) {
                csiTitles[csiKey] = row.csi_title;
            }
        });

        const csiBreakdown = Object.entries(csiTotals)
            .map(([code, total]) => ({
                code,
                title: csiTitles[code] || (code === 'Uncoded' ? 'Uncoded Items' : ''),
                total: Number(total.toFixed(2)),
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        return {
            sectionCount: sectionNames.length,
            lineItemCount: rows.length,
            totalMaterial: Number(totalMaterial.toFixed(2)),
            totalLabor: Number(totalLabor.toFixed(2)),
            totalCost: Number((totalMaterial + totalLabor).toFixed(2)),
            csiBreakdown,
        };
    }, [groupedSections, rows]);

    const handleToggleSection = (sectionName) => {
        setCollapsedSections((prev) => {
            const isCollapsed = !!prev[sectionName];
            return {
                ...prev,
                [sectionName]: !isCollapsed,
            };
        });
    };

    const resetEditState = () => {
        setEditingRowId(null);
        setEditValues({
            quantity: '',
            material_unit_cost: '',
            labor_unit_cost: '',
        });
    };

    const handleEditRow = (row) => {
        setEditingRowId(row.id);
        setEditValues({
            quantity: row.quantity ?? '',
            material_unit_cost: row.material_unit_cost ?? '',
            labor_unit_cost: row.labor_unit_cost ?? '',
        });
    };

    const handleCancelEdit = () => {
        resetEditState();
    };

    const handleEditFieldChange = (field, value) => {
        setEditValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const parseNumberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            throw new Error('Please enter valid numeric values.');
        }
        return parsed;
    };

    const handleSaveRow = async (rowId) => {
        if (!rowId) return;

        const payload = {
            quantity: parseNumberOrNull(editValues.quantity),
            material_unit_cost: parseNumberOrNull(editValues.material_unit_cost),
            labor_unit_cost: parseNumberOrNull(editValues.labor_unit_cost),
        };

        try {
            setStatusMessage('Saving changes…');
            const response = await fetch(`${DATA_ENDPOINT}${rowId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to update row');
            const updatedRow = await response.json();
            setRows((prev) => prev.map((existing) => (existing.id === updatedRow.id ? updatedRow : existing)));
            setStatusMessage('Row updated successfully.');
            resetEditState();
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to update row');
        }
    };

    const handleDeleteRow = async (row) => {
        const confirmMessage = `Delete "${row.description}" from ${getCsiLabel(row.csi_code, row.csi_title)}? This cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
            return;
        }
        try {
            setStatusMessage('Deleting row…');
            const response = await fetch(`${DATA_ENDPOINT}${row.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete row');
            setRows((prev) => prev.filter((existing) => existing.id !== row.id));
            setStatusMessage('Row deleted successfully.');
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Failed to delete row');
        }
    };

    const openManualModal = () => {
        const initialCsi = existingCsiOptions[0];
        setManualValues({
            csi_code: initialCsi?.code || '',
            csi_title: initialCsi?.title || '',
            description: '',
            quantity: '',
            unit: 'SF',
            material_unit_cost: '',
            material_amount: '',
            labor_unit_cost: '',
            labor_amount: '',
        });
        setManualStatus('');
        setIsManualModalOpen(true);
    };

    const closeManualModal = () => {
        setIsManualModalOpen(false);
        setManualStatus('');
    };

    const handleManualFieldChange = (field, value) => {
        setManualValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleManualCsiCodeChange = (value) => {
        const preset = findCsiByCode(value);
        const existingMatch = existingCsiOptions.find((option) => option.code === value);
        setManualValues((prev) => ({
            ...prev,
            csi_code: value,
            csi_title: preset?.title || existingMatch?.title || (value ? prev.csi_title : ''),
        }));
    };

    const parseOptionalNumber = (value, fieldLabel) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            throw new Error(`${fieldLabel} must be a valid number.`);
        }
        return parsed;
    };

    const handleManualSubmit = async (event) => {
        event.preventDefault();
        if (!project || !excelDataId) {
            setManualStatus('Open this view from “View Estimate” to append descriptions.');
            return;
        }
        const csiCodeInput = manualValues.csi_code?.trim();
        if (!csiCodeInput) {
            setManualStatus('CSI code is required.');
            return;
        }
        if (!manualValues.description.trim()) {
            setManualStatus('Description is required.');
            return;
        }
        const csiTitleInput = manualValues.csi_title?.trim() || '';

        let quantity;
        let materialUnitCost;
        let materialAmountInput;
        let laborUnitCost;
        let laborAmountInput;
        try {
            quantity = parseOptionalNumber(manualValues.quantity, 'Quantity');
            materialUnitCost = parseOptionalNumber(manualValues.material_unit_cost, 'Material $/Unit');
            materialAmountInput = parseOptionalNumber(manualValues.material_amount, 'Material Amount');
            laborUnitCost = parseOptionalNumber(manualValues.labor_unit_cost, 'Labor $/Unit');
            laborAmountInput = parseOptionalNumber(manualValues.labor_amount, 'Labor Amount');
        } catch (error) {
            setManualStatus(error.message);
            return;
        }

        const materialAmount = materialAmountInput;
        const laborAmount = laborAmountInput;
        const totalUnitCost =
            materialUnitCost === null && laborUnitCost === null ? null : (materialUnitCost || 0) + (laborUnitCost || 0);
        const totalAmount = materialAmount === null && laborAmount === null ? null : (materialAmount || 0) + (laborAmount || 0);

        const payload = {
            project_id: project.id,
            excel_data_id: excelDataId,
            csi_code: csiCodeInput,
            csi_title: csiTitleInput || null,
            description: manualValues.description,
            quantity,
            unit: manualValues.unit || null,
            material_unit_cost: materialUnitCost,
            material_amount: materialAmount,
            labor_unit_cost: laborUnitCost,
            labor_amount: laborAmount,
            total_unit_cost: totalUnitCost || null,
            total_amount: totalAmount || null,
        };

        try {
            setIsSavingManual(true);
            setManualStatus('Saving new description…');
            const response = await fetch(DATA_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to append description.');
            }

            const savedRow = await response.json();
            setRows((prev) => [...prev, savedRow]);
            setManualStatus(`Added "${savedRow.description}" to ${getCsiLabel(savedRow.csi_code, savedRow.csi_title)}.`);
            setManualValues((prev) => ({
                ...prev,
                description: '',
                quantity: '',
                material_unit_cost: '',
                material_amount: '',
                labor_unit_cost: '',
                labor_amount: '',
            }));
        } catch (error) {
            console.error('Failed to append descriptions:', error);
            setManualStatus(error.message || 'Failed to append descriptions.');
        } finally {
            setIsSavingManual(false);
        }
    };

    const handleExport = async (mode = 'structured') => {
        try {
            const response = await fetch(`${API_BASE_URL}/data/project/${project.id}/export?mode=${mode}`);
            if (!response.ok) throw new Error('Failed to export Excel');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `project_${project.id}_estimate_${mode}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            setStatusMessage(error.message || 'Export failed');
        }
    };

    const handleDownloadSummaryCsv = () => {
        const { sectionCount, lineItemCount, totalMaterial, totalLabor, totalCost, csiBreakdown } = summaryMetrics;
        const rowsCsv = [
            ['Metric', 'Value'],
            ['Sections', sectionCount],
            ['Line Items', lineItemCount],
            ['Total Material', totalMaterial],
            ['Total Labor', totalLabor],
            ['Grand Total', totalCost],
            [],
            ['CSI Breakdown', 'Total Amount'],
            ...csiBreakdown.map((entry) => [
                `${entry.code}${entry.title ? ` – ${entry.title}` : ''}`,
                entry.total,
            ]),
        ];
        const csvContent = rowsCsv.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `project_${project.id}_summary.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleBack = () => {
        if (projectId && estimateId) {
            navigate(`/projects/${projectId}/estimates`);
        } else {
            navigate('/projects');
        }
    };

    if (!project) {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={handleBack} style={{ marginBottom: '1rem' }}>
                    ← Back to Projects
                </button>
                <p>No project selected.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem' }}>
                <button onClick={handleBack} style={{ marginBottom: '1rem' }}>
                    ← Back to Projects
                </button>
                <p>Loading estimate data…</p>
            </div>
        );
    }

    return (
        <>
            <div style={{ padding: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={handleBack}
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
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5a6268';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                <span>←</span>
                <span>Back to Estimates</span>
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>{project.project_name}</h2>
                <p style={{ color: '#666' }}>
                    Client: {project.client_name || '—'} | Location: {project.project_location || '—'}
                </p>
            </div>

            {estimateInfo && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Estimate</div>
                        <div style={{ fontWeight: 600 }}>{estimateInfo.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Template</div>
                        <div style={{ fontWeight: 600 }}>{estimateInfo.template_id}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Status</div>
                        <div style={{ fontWeight: 600 }}>{estimateInfo.status?.toUpperCase() || '—'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Cost</div>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(estimateInfo.total_cost)}</div>
                    </div>
                </div>
            )}

            <div
                style={{
                    marginBottom: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                }}
            >
                {[
                    { label: 'Sections', value: summaryMetrics.sectionCount },
                    { label: 'Line Items', value: summaryMetrics.lineItemCount },
                    { label: 'Material Total', value: formatCurrency(summaryMetrics.totalMaterial) },
                    { label: 'Labor Total', value: formatCurrency(summaryMetrics.totalLabor) },
                    { label: 'Grand Total', value: formatCurrency(summaryMetrics.totalCost) },
                ].map((card) => (
                    <div
                        key={card.label}
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: '1rem',
                            background: 'white',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
                        }}
                    >
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{card.label}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem', marginTop: '0.25rem' }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {summaryMetrics.csiBreakdown.length > 0 && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        background: 'white',
                        padding: '1rem',
                    }}
                >
                    <h4 style={{ margin: '0 0 0.75rem 0' }}>Top CSI Totals</h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>CSI</th>
                                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Description</th>
                                    <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryMetrics.csiBreakdown.map((entry) => (
                                    <tr key={entry.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.5rem' }}>{entry.code}</td>
                                        <td style={{ padding: '0.5rem' }}>{entry.title}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                                            {formatCurrency(entry.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!excelDataId && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        borderRadius: 8,
                        border: '1px solid #ffe082',
                        background: '#fff8e1',
                        color: '#7a5a00',
                    }}
                >
                    Append descriptions is available when viewing a specific estimate upload. Open this view from the project’s
                    “View Estimate” button to enable manual entry.
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}
            >
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                        Filter rows
                    </label>
                    <input
                        type="text"
                        placeholder="Search description or CSI"
                        value={filterText}
                        onChange={(event) => setFilterText(event.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            minWidth: '260px',
                            borderRadius: 6,
                            border: '1px solid #ccc',
                        }}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => openManualModal()}
                    disabled={!excelDataId}
                    title={excelDataId ? 'Append a new description item' : 'Open this view from “View Estimate” to add items'}
                    style={{
                        padding: '0.55rem 1rem',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: excelDataId ? '#2563eb' : '#b0b5bd',
                        color: 'white',
                        fontWeight: 600,
                        cursor: excelDataId ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                    }}
                >
                    <span>＋</span>
                    <span>Add New Description Item</span>
                </button>

                <div
                    style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                    }}
                >
                    <button
                        onClick={() => handleExport('structured')}
                        style={{
                            padding: '0.55rem 1rem',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: '#34495e',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Export Structured
                    </button>
                    <button
                        onClick={() => handleExport('raw')}
                        style={{
                            padding: '0.55rem 1rem',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: '#1d4ed8',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Export Raw
                    </button>
                    <button
                        onClick={handleDownloadSummaryCsv}
                        style={{
                            padding: '0.55rem 1rem',
                            borderRadius: 6,
                            border: '1px solid #c7d2fe',
                            backgroundColor: 'white',
                            color: '#1e3a8a',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Download Summary
                    </button>
                </div>
            </div>

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

            {filteredRows.length === 0 ? (
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
                    <h4 style={{ color: '#666', marginBottom: '10px' }}>No estimate rows yet</h4>
                    <p style={{ color: '#999' }}>Upload an Excel workbook to see items here.</p>
                </div>
            ) : (
                Object.entries(groupedSections).map(([sectionName, sectionRows]) => {
                    const collapsed = collapsedSections[sectionName];
                    return (
                        <div
                            key={sectionName}
                            style={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 8,
                                marginBottom: '1rem',
                                overflow: 'hidden',
                                background: 'white',
                            }}
                        >
                            <button
                                onClick={() => handleToggleSection(sectionName)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.9rem 1rem',
                                    border: 'none',
                                    background: '#f5f5f5',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>{sectionName}</span>
                                <span>{collapsed ? '➕' : '➖'}</span>
                            </button>
                            {!collapsed && (
                                <div style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table
                                            style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                minWidth: '900px',
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Description</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>CSI</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Qty</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Unit</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Material Unit</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Material Amount</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Labor Unit</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Labor Amount</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Total Unit</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}>Total Amount</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 600, color: '#495057' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sectionRows.map((row) => {
                                                            const isEditing = editingRowId === row.id;
                                                            return (
                                                                <tr 
                                                                    key={row.id}
                                                                    style={{
                                                                        borderBottom: '1px solid #e9ecef',
                                                                        transition: 'background-color 0.15s ease',
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!isEditing) {
                                                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }}
                                                                >
                                                                    <td style={{ padding: '0.75rem' }}>{row.description}</td>
                                                                    <td style={{ padding: '0.75rem' }}>
                                                                        {row.csi_code ? (
                                                                            <>
                                                                                <div style={{ fontWeight: 600 }}>{row.csi_code}</div>
                                                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                                                    {row.csi_title || '—'}
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            '—'
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editValues.quantity}
                                                                                onChange={(event) =>
                                                                                    handleEditFieldChange('quantity', event.target.value)
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '0.4rem 0.5rem',
                                                                                    borderRadius: 4,
                                                                                    border: '1px solid #9ca3af',
                                                                                    fontSize: '0.9rem',
                                                                                    outline: 'none',
                                                                                }}
                                                                                onFocus={(e) => {
                                                                                    e.currentTarget.style.borderColor = '#34495e';
                                                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(52, 73, 94, 0.1)';
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    e.currentTarget.style.borderColor = '#9ca3af';
                                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            row.quantity ?? '—'
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.unit ?? '—'}</td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={editValues.material_unit_cost}
                                                                                onChange={(event) =>
                                                                                    handleEditFieldChange(
                                                                                        'material_unit_cost',
                                                                                        event.target.value
                                                                                    )
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '0.4rem 0.5rem',
                                                                                    borderRadius: 4,
                                                                                    border: '1px solid #9ca3af',
                                                                                    fontSize: '0.9rem',
                                                                                    outline: 'none',
                                                                                }}
                                                                                onFocus={(e) => {
                                                                                    e.currentTarget.style.borderColor = '#34495e';
                                                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(52, 73, 94, 0.1)';
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    e.currentTarget.style.borderColor = '#9ca3af';
                                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            formatCurrency(row.material_unit_cost)
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(row.material_amount)}</td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={editValues.labor_unit_cost}
                                                                                onChange={(event) =>
                                                                                    handleEditFieldChange('labor_unit_cost', event.target.value)
                                                                                }
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '0.4rem 0.5rem',
                                                                                    borderRadius: 4,
                                                                                    border: '1px solid #9ca3af',
                                                                                    fontSize: '0.9rem',
                                                                                    outline: 'none',
                                                                                }}
                                                                                onFocus={(e) => {
                                                                                    e.currentTarget.style.borderColor = '#34495e';
                                                                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(52, 73, 94, 0.1)';
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    e.currentTarget.style.borderColor = '#9ca3af';
                                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            formatCurrency(row.labor_unit_cost)
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(row.labor_amount)}</td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(row.total_unit_cost)}</td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#34495e' }}>{formatCurrency(row.total_amount)}</td>
                                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                                        {isEditing ? (
                                                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                                <button
                                                                                    onClick={() => handleSaveRow(row.id)}
                                                                                    style={{
                                                                                        padding: '0.5rem 0.9rem',
                                                                                        fontSize: '0.85rem',
                                                                                        borderRadius: 4,
                                                                                        border: 'none',
                                                                                        backgroundColor: '#34495e',
                                                                                        color: 'white',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 600,
                                                                                        transition: 'all 0.2s ease',
                                                                                    }}
                                                                                    onMouseEnter={(e) => {
                                                                                        e.currentTarget.style.backgroundColor = '#2c3e50';
                                                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(52, 73, 94, 0.3)';
                                                                                    }}
                                                                                    onMouseLeave={(e) => {
                                                                                        e.currentTarget.style.backgroundColor = '#34495e';
                                                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                                    }}
                                                                                >
                                                                                    ✓ Save
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleCancelEdit}
                                                                                    style={{
                                                                                        padding: '0.5rem 0.9rem',
                                                                                        fontSize: '0.85rem',
                                                                                        borderRadius: 4,
                                                                                        border: '1px solid #ccc',
                                                                                        backgroundColor: 'white',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 500,
                                                                                        transition: 'all 0.2s ease',
                                                                                    }}
                                                                                    onMouseEnter={(e) => {
                                                                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                                                        e.currentTarget.style.borderColor = '#999';
                                                                                    }}
                                                                                    onMouseLeave={(e) => {
                                                                                        e.currentTarget.style.backgroundColor = 'white';
                                                                                        e.currentTarget.style.borderColor = '#ccc';
                                                                                    }}
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleEditRow(row)}
                                                                                style={{
                                                                                    padding: '0.5rem 0.9rem',
                                                                                    fontSize: '0.85rem',
                                                                                    borderRadius: 4,
                                                                                    border: '1px solid #9ca3af',
                                                                                    backgroundColor: 'transparent',
                                                                                    color: '#374151',
                                                                                    cursor: 'pointer',
                                                                                    fontWeight: 500,
                                                                                    transition: 'all 0.2s ease',
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    e.currentTarget.style.backgroundColor = '#34495e';
                                                                                    e.currentTarget.style.color = 'white';
                                                                                    e.currentTarget.style.borderColor = '#34495e';
                                                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                                    e.currentTarget.style.color = '#374151';
                                                                                    e.currentTarget.style.borderColor = '#9ca3af';
                                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                                }}
                                                                            >
                                                                                ✏️ Edit
                                                                            </button>
                                                                        )}
                                                                            <button
                                                                                onClick={() => handleDeleteRow(row)}
                                                                                style={{
                                                                                    padding: '0.5rem 0.9rem',
                                                                                    fontSize: '0.85rem',
                                                                                    borderRadius: 4,
                                                                                    border: '1px solid #f87171',
                                                                                    backgroundColor: '#fee2e2',
                                                                                    color: '#b91c1c',
                                                                                    cursor: 'pointer',
                                                                                    fontWeight: 600,
                                                                                    transition: 'all 0.2s ease',
                                                                                }}
                                                                            >
                                                                                🗑 Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
            </div>
            {excelDataId && isManualModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1.5rem',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 720,
                            background: 'white',
                            borderRadius: 12,
                            padding: '1.5rem',
                            boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>Add New Description Item</h3>
                            <button
                                type="button"
                                onClick={closeManualModal}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                }}
                                aria-label="Close add description dialog"
                            >
                                ×
                            </button>
                        </div>
                        <p style={{ marginTop: 0, marginBottom: '1rem', color: '#555' }}>
                            Provide the CSI code and cost details for the new line item. You can select from existing codes or type a
                            brand new one.
                        </p>
                        {manualStatus && (
                            <div
                                style={{
                                    marginBottom: '0.75rem',
                                    padding: '0.7rem 1rem',
                                    borderRadius: 8,
                                    border: manualStatus.toLowerCase().startsWith('added')
                                        ? '1px solid #bbf7d0'
                                        : '1px solid #fecdd3',
                                    background: manualStatus.toLowerCase().startsWith('added') ? '#f0fdf4' : '#fef2f2',
                                    color: manualStatus.toLowerCase().startsWith('added') ? '#166534' : '#991b1b',
                                }}
                            >
                                {manualStatus}
                            </div>
                        )}
                        {isSavingManual && (
                            <p style={{ color: '#555', marginTop: 0, marginBottom: '0.75rem' }}>Saving new description…</p>
                        )}
                        <form onSubmit={handleManualSubmit}>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: '1rem',
                                }}
                            >
                                <div>
                                    <label htmlFor="manual-csi-code" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        CSI Code *
                                    </label>
                                    <input
                                        id="manual-csi-code"
                                        list="manual-csi-options"
                                        value={manualValues.csi_code}
                                        onChange={(event) => handleManualCsiCodeChange(event.target.value)}
                                        placeholder="01 00 00"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                    <datalist id="manual-csi-options">
                                        {CSI_MASTERFORMAT_OPTIONS.map((option) => (
                                            <option key={option.code} value={option.code}>
                                                {option.title}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label htmlFor="manual-csi-title" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        CSI Title
                                    </label>
                                    <input
                                        id="manual-csi-title"
                                        value={manualValues.csi_title}
                                        onChange={(event) => handleManualFieldChange('csi_title', event.target.value)}
                                        placeholder="General Requirements"
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label htmlFor="manual-description" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Description *
                                    </label>
                                    <textarea
                                        id="manual-description"
                                        value={manualValues.description}
                                        onChange={(event) => handleManualFieldChange('description', event.target.value)}
                                        placeholder="Describe the item you are adding"
                                        rows={3}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem 0.75rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                            resize: 'vertical',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="manual-quantity" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Quantity
                                    </label>
                                    <input
                                        id="manual-quantity"
                                        type="number"
                                        step="0.01"
                                        value={manualValues.quantity}
                                        onChange={(event) => handleManualFieldChange('quantity', event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="manual-unit" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Unit
                                    </label>
                                    <select
                                        id="manual-unit"
                                        value={manualValues.unit}
                                        onChange={(event) => handleManualFieldChange('unit', event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    >
                                        {UNIT_OPTIONS.map((unit) => (
                                            <option key={unit} value={unit}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="manual-material" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Material $/Unit
                                    </label>
                                    <input
                                        id="manual-material"
                                        type="number"
                                        step="0.01"
                                        value={manualValues.material_unit_cost}
                                        onChange={(event) => handleManualFieldChange('material_unit_cost', event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="manual-material-amount" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Material Amount
                                    </label>
                                    <input
                                        id="manual-material-amount"
                                        type="number"
                                        step="0.01"
                                        value={manualValues.material_amount}
                                        onChange={(event) => handleManualFieldChange('material_amount', event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="manual-labor" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Labor $/Unit
                                    </label>
                                    <input
                                        id="manual-labor"
                                        type="number"
                                        step="0.01"
                                        value={manualValues.labor_unit_cost}
                                        onChange={(event) => handleManualFieldChange('labor_unit_cost', event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="manual-labor-amount" style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                                        Labor Amount
                                    </label>
                                    <input
                                        id="manual-labor-amount"
                                        type="number"
                                        step="0.01"
                                        value={manualValues.labor_amount}
                                        onChange={(event) => handleManualFieldChange('labor_amount', event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.55rem 0.65rem',
                                            borderRadius: 6,
                                            border: '1px solid #d1d5db',
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '0.5rem',
                                    marginTop: '1.25rem',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={closeManualModal}
                                    style={{
                                        padding: '0.6rem 1.2rem',
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
                                    disabled={isSavingManual}
                                    style={{
                                        padding: '0.6rem 1.4rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: isSavingManual ? '#9ca3af' : '#1d7a5f',
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: isSavingManual ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {isSavingManual ? 'Saving…' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectEstimateView;

