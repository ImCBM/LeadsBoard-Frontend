import { useState, useRef } from 'react';
import {
  UploadCloud, FileText, X, Download, Loader2, RefreshCw
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
  const fileInputRef = useRef(null);

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
      if (res.summary?.inserted > 0) {
        toast.success(`Successfully imported ${res.summary.inserted} leads!`);
      } else if (res.summary?.duplicates > 0) {
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

  const handleClose = () => {
    if (result && result.summary?.inserted > 0) {
      onSuccess?.();
    }
    setFile(null);
    setResult(null);
    onClose();
  };

  const details = result?.details || [];
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
              <div className={styles.resultsGrid}>
                <div className={styles.resultStat}>
                  <div className={styles.statNumber}>{result.summary?.total ?? 0}</div>
                  <div className={styles.statLabel}>Total Rows</div>
                </div>
                <div className={`${styles.resultStat} ${styles.success}`}>
                  <div className={styles.statNumber}>{result.summary?.inserted ?? 0}</div>
                  <div className={styles.statLabel}>Inserted</div>
                </div>
                <div className={`${styles.resultStat} ${styles.duplicates}`}>
                  <div className={styles.statNumber}>{result.summary?.duplicates ?? 0}</div>
                  <div className={styles.statLabel}>Duplicates</div>
                </div>
                <div className={`${styles.resultStat} ${styles.errors}`}>
                  <div className={styles.statNumber}>{result.summary?.errors ?? 0}</div>
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
                        Duplicates ({result.summary?.duplicates ?? 0})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${activeTab === 'errors' ? styles.filterPillActive : ''}`}
                        onClick={() => setActiveTab('errors')}
                      >
                        Errors ({result.summary?.errors ?? 0})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${activeTab === 'inserted' ? styles.filterPillActive : ''}`}
                        onClick={() => setActiveTab('inserted')}
                      >
                        Inserted ({result.summary?.inserted ?? 0})
                      </button>
                    </div>
                  </div>

                  <div className={styles.logList}>
                    {filteredDetails.map((item, idx) => (
                      <div key={idx} className={styles.logItem}>
                        <span className={styles.rowBadge}>Row {item.row}</span>
                        <div className={styles.logItemContent}>
                          <div>
                            <span className={styles.logName}>{item.name}</span>
                            {(item.email || item.phone) && (
                              <span className={styles.logContact}>
                                {item.email} {item.phone ? `· ${item.phone}` : ''}
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
