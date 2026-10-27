import { useState, useRef, useMemo } from 'react';
import {
  UploadCloud, FileText, X, Download, Loader2, RefreshCw, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as leadsApi from '../../api/leads';
import Button from '../ui/Button';
import styles from './ImportLeadsModal.module.css';

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'duplicates' | 'errors' | 'inserted'
  const [copiedBatch, setCopiedBatch] = useState(false);
  const fileInputRef = useRef(null);

  const summary = useMemo(() => {
    if (!result) return { total: 0, inserted: 0, duplicates: 0, errors: 0 };
    return result.summary || {
      total: result.total ?? 0,
      inserted: result.inserted ?? 0,
      duplicates: result.duplicates ?? 0,
      errors: result.errors ?? 0,
    };
  }, [result]);

  const details = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.details) && result.details.length > 0) {
      return result.details;
    }
    const list = [];
    if (Array.isArray(result.duplicates_detail)) {
      result.duplicates_detail.forEach((d) => {
        list.push({
          row: d.row,
          status: 'duplicate',
          name: d.name || 'Lead',
          email: d.email,
          phone: d.contact_number,
          duplicate_field: d.duplicate_field || (d.duplicate_fields?.[0]),
          message: d.reason || `Duplicate lead detected: ${d.duplicate_field || 'record'} already exists in the database.`,
        });
      });
    }
    if (Array.isArray(result.errors_detail)) {
      result.errors_detail.forEach((e) => {
        list.push({
          row: e.row,
          status: 'error',
          name: e.name || `Row ${e.row}`,
          email: e.email,
          phone: e.phone,
          message: Array.isArray(e.errors)
            ? e.errors.join('; ')
            : (typeof e.errors === 'object' && e.errors !== null ? Object.values(e.errors).flat().join('; ') : 'Validation error'),
        });
      });
    }
    return list.sort((a, b) => a.row - b.row);
  }, [result]);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f) => {
    if (!f.name.endsWith('.csv') && !f.type.includes('csv') && !f.type.includes('text')) {
      toast.error('Please upload a valid .csv file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      'Full Name,Job Title,Title Tier,Corporate Work Email,Contact Number,Company Name,Clean Root Domain,Website Status,Executive LinkedIn URL,Company LinkedIn Page,Industry Classification,Employee Headcount,HQ Location',
      'Jane Doe,Chief Technology Officer,C-Level,jane.doe@acme.com,+1 (555) 234-5678,Acme Corp,acme.com,HTTP 200 OK,https://www.linkedin.com/in/janedoe,https://www.linkedin.com/company/acme,Software Development,45,"Austin, Texas, United States"',
      'Markus Schmidt,VP of Sales,VP-Level,markus.schmidt@berlinfin.de,+49 30 1234567,Berlin Financial,berlinfin.de,HTTP 200 OK,https://www.linkedin.com/in/markusschmidt,,Financial Services,120,"Berlin, Berlin, Germany"',
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Sample template downloaded');
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await leadsApi.importCsv(file);
      setResult(res);
      const insertedCount = res.summary?.inserted ?? (res.inserted ?? 0);
      const dupCount = res.summary?.duplicates ?? (res.duplicates ?? 0);

      if (insertedCount > 0) {
        toast.success(`Successfully imported ${insertedCount} leads!`);
      } else if (dupCount > 0) {
        toast('Import completed with duplicate skips.', { icon: '⚠️' });
      } else {
        toast.error('No leads could be imported.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to upload CSV file.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyBatchId = () => {
    if (!result?.batch_id) return;
    navigator.clipboard.writeText(result.batch_id);
    setCopiedBatch(true);
    toast.success('Batch ID copied to clipboard');
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  const handleClose = () => {
    if (summary.inserted > 0) {
      onSuccess?.();
    }
    setFile(null);
    setResult(null);
    onClose();
  };

  const filteredDetails = details.filter((item) => {
    if (activeTab === 'inserted') return item.status === 'inserted';
    if (activeTab === 'duplicates') return item.status === 'duplicate';
    if (activeTab === 'errors') return item.status === 'error';
    return true;
  });

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Import Leads via CSV</h2>
              <p className={styles.subtitle}>
                Upload lead spreadsheets. Records are validated, normalized, and checked for email & phone duplicates.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {isUploading ? (
            <div className={styles.uploadingBox}>
              <Loader2 size={42} className={styles.spinner} />
              <div className={styles.uploadingText}>Validating rows and checking duplicates…</div>
              <p className={styles.dropzoneSubtext}>This may take a moment for large spreadsheets.</p>
            </div>
          ) : result ? (
            /* Results Breakdown */
            <>
              {result.batch_id && (
                <div className={styles.batchIdBanner}>
                  <span>Ingestion Batch: <code className={styles.batchIdCode}>{result.batch_id}</code></span>
                  <button className={styles.copyBatchBtn} onClick={handleCopyBatchId}>
                    {copiedBatch ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedBatch ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>
              )}

              <div className={styles.resultsGrid}>
                <div className={styles.resultStat}>
                  <div className={styles.statNumber}>{summary.total}</div>
                  <div className={styles.statLabel}>Total Rows</div>
                </div>
                <div className={`${styles.resultStat} ${styles.success}`}>
                  <div className={styles.statNumber}>{summary.inserted}</div>
                  <div className={styles.statLabel}>Inserted</div>
                </div>
                <div className={`${styles.resultStat} ${styles.duplicates}`}>
                  <div className={styles.statNumber}>{summary.duplicates}</div>
                  <div className={styles.statLabel}>Duplicates</div>
                </div>
                <div className={`${styles.resultStat} ${styles.errors}`}>
                  <div className={styles.statNumber}>{summary.errors}</div>
                  <div className={styles.statLabel}>Errors</div>
                </div>
              </div>

              {/* Itemized Details Feed */}
              {details.length > 0 && (
                <div className={styles.logContainer}>
                  <div className={styles.logHeader}>
                    <span>Row Details ({filteredDetails.length})</span>
                    <div className={styles.logFilterPills}>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${activeTab === 'all' ? styles.filterPillActive : ''}`}
                        onClick={() => setActiveTab('all')}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${activeTab === 'duplicates' ? styles.filterPillActive : ''}`}
                        onClick={() => setActiveTab('duplicates')}
                      >
                        Duplicates ({summary.duplicates})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${activeTab === 'errors' ? styles.filterPillActive : ''}`}
                        onClick={() => setActiveTab('errors')}
                      >
                        Errors ({summary.errors})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${activeTab === 'inserted' ? styles.filterPillActive : ''}`}
                        onClick={() => setActiveTab('inserted')}
                      >
                        Inserted ({summary.inserted})
                      </button>
                    </div>
                  </div>

                  <div className={styles.logList}>
                    {filteredDetails.map((item, idx) => (
                      <div key={idx} className={styles.logItem}>
                        <span className={styles.rowBadge}>Row {item.row}</span>
                        <div className={styles.logItemContent}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={styles.logName}>{item.name}</span>
                            {(item.email || item.phone) && (
                              <span className={styles.logContact}>
                                {item.email} {item.phone ? `· ${item.phone}` : ''}
                              </span>
                            )}
                            {item.duplicate_field && (
                              <span className={styles.conflictBadge}>
                                {item.duplicate_field === 'contact_number'
                                  ? 'Phone Duplicate'
                                  : item.duplicate_field === 'corporate_email'
                                  ? 'Email Duplicate'
                                  : 'Email & Phone Duplicate'}
                              </span>
                            )}
                          </div>
                          <div
                            className={`${styles.logMessage} ${
                              item.status === 'inserted'
                                ? styles.msgSuccess
                                : item.status === 'duplicate'
                                ? styles.msgDuplicate
                                : styles.msgError
                            }`}
                          >
                            {item.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Upload Screen */
            <>
              {/* Dropzone */}
              <div
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                />
                <div className={styles.dropzoneIcon}>
                  <UploadCloud size={26} />
                </div>
                <div className={styles.dropzoneText}>
                  Click to browse or drag and drop your CSV file here
                </div>
                <div className={styles.dropzoneSubtext}>
                  Supports UTF-8 CSVs up to 10MB. Duplicate emails & contact numbers are detected automatically.
                </div>
              </div>

              {/* Selected file preview */}
              {file && (
                <div className={styles.selectedCard}>
                  <div className={styles.selectedFileInfo}>
                    <FileText size={20} className={styles.fileIcon} />
                    <div>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileSize}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={() => setFile(null)}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Guidance & Template */}
              <div className={styles.guidanceBox}>
                <span>Need formatting reference? Download our pre-configured CSV template.</span>
                <button
                  type="button"
                  className={styles.templateLink}
                  onClick={handleDownloadTemplate}
                >
                  <Download size={14} />
                  <span>Download Template</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {result ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
              >
                <RefreshCw size={14} />
                <span>Upload Another</span>
              </Button>
              <Button size="sm" onClick={handleClose}>
                Done & View Leads
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                <UploadCloud size={14} />
                <span>Start Import</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
