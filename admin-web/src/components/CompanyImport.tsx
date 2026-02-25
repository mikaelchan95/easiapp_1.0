import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import type { Company } from '../types';
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface CompanyImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportRow {
  name: string;
  company_name: string;
  uen: string;
  address: string;
  phone?: string;
  email?: string;
  credit_limit?: number;
  payment_terms?: string;
  status?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const CSV_TEMPLATE_HEADERS = [
  'name',
  'company_name',
  'uen',
  'address',
  'phone',
  'email',
  'credit_limit',
  'payment_terms',
  'status',
];

export default function CompanyImport({
  onClose,
  onSuccess,
}: CompanyImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      CSV_TEMPLATE_HEADERS,
      [
        'Sample Logistics Pte Ltd',
        'Sample Logistics',
        '202012345A',
        '123 Business St, Singapore 123456',
        '+65 6123 4567',
        'contact@sample.com',
        '10000',
        'NET30',
        'active',
      ],
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    setLoading(true);
    setErrors([]);
    setImportData([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const validationErrors: ValidationError[] = [];
        const validRows: ImportRow[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNumber = index + 2;

          // Required fields validation
          if (!row.name || !row.name.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'name',
              message: 'Company name is required',
            });
          }

          if (!row.company_name || !row.company_name.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'company_name',
              message: 'Display name is required',
            });
          }

          if (!row.uen || !row.uen.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'uen',
              message: 'UEN is required',
            });
          }

          if (!row.address || !row.address.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'address',
              message: 'Address is required',
            });
          }

          // Status validation
          const validStatuses = ['active', 'suspended', 'pending_verification'];
          const status = row.status?.toLowerCase() || 'active';
          if (!validStatuses.includes(status)) {
            validationErrors.push({
              row: rowNumber,
              field: 'status',
              message:
                'Invalid status. Use: active, suspended, or pending_verification',
            });
          }

          // Build valid row
          const importRow: ImportRow = {
            name: row.name?.trim(),
            company_name: row.company_name?.trim(),
            uen: row.uen?.trim(),
            address: row.address?.trim(),
            phone: row.phone?.trim() || '',
            email: row.email?.trim() || '',
            credit_limit: row.credit_limit ? parseFloat(row.credit_limit) : 0,
            payment_terms: row.payment_terms?.trim() || 'COD',
            status: status,
          };

          validRows.push(importRow);
        });

        setErrors(validationErrors);
        setImportData(validRows);
        setLoading(false);
      },
      error: error => {
        alert('Error parsing CSV: ' + error.message);
        setLoading(false);
      },
    });
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      alert('Please fix validation errors before importing');
      return;
    }

    if (importData.length === 0) {
      alert('No data to import');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      const companiesToInsert = importData.map(row => ({
        name: row.name,
        company_name: row.company_name,
        uen: row.uen,
        address: row.address,
        phone: row.phone || null,
        email: row.email || null,
        credit_limit: row.credit_limit || 0,
        current_credit: 0,
        payment_terms: row.payment_terms || 'COD',
        status: row.status || 'active',
        require_approval: false,
      }));

      const { data, error } = await supabase
        .from('companies')
        .insert(companiesToInsert)
        .select();

      if (error) {
        if (error.code === '23505') {
          alert('Some UENs already exist. Please check for duplicates.');
          failedCount = importData.length;
        } else {
          throw error;
        }
      } else {
        successCount = data?.length || 0;
      }

      setImportResult({ success: successCount, failed: failedCount });

      if (successCount > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      alert('Error importing companies: ' + (error as Error).message);
      failedCount = importData.length;
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-brand-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Import Companies from CSV
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Upload Section */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                <Download size={18} />
                Download Template
              </button>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-8 text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  <Upload size={24} />
                  <span className="font-medium">
                    {file ? file.name : 'Click to upload CSV file'}
                  </span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-lg bg-[var(--bg-tertiary)] p-4 text-sm text-[var(--text-primary)]">
              <strong>Instructions:</strong>
              <ul className="ml-5 mt-2 list-disc space-y-1">
                <li>Download the template to see the required format</li>
                <li>Required fields: name, company_name, uen, address</li>
                <li>
                  Status: use "active", "suspended", or "pending_verification"
                </li>
                <li>Payment terms: COD, NET7, NET15, NET30, or NET60</li>
                <li>UENs must be unique</li>
              </ul>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-red-800">
                <AlertCircle size={20} />
                Validation Errors ({errors.length})
              </div>
              <div className="max-h-40 overflow-y-auto">
                <ul className="space-y-1 text-sm text-red-700">
                  {errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>
                      Row {error.row}, {error.field}: {error.message}
                    </li>
                  ))}
                  {errors.length > 10 && (
                    <li className="font-medium">
                      ... and {errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="mb-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-4">
              <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                <CheckCircle2 size={20} />
                Import Complete
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Successfully imported {importResult.success} compan
                {importResult.success === 1 ? 'y' : 'ies'}.
                {importResult.failed > 0 && ` Failed: ${importResult.failed}`}
              </p>
            </div>
          )}

          {/* Preview Table */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[var(--text-primary)]" size={32} />
            </div>
          )}

          {!loading && importData.length > 0 && (
            <div>
              <h3 className="mb-3 font-bold text-[var(--text-primary)]">
                Preview ({importData.length} companies)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-tertiary)] text-xs font-bold uppercase text-[var(--text-primary)]">
                    <tr>
                      <th className="px-4 py-2">Company Name</th>
                      <th className="px-4 py-2">UEN</th>
                      <th className="px-4 py-2">Address</th>
                      <th className="px-4 py-2">Credit Limit</th>
                      <th className="px-4 py-2">Payment Terms</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {importData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-2 font-medium">{row.name}</td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {row.uen}
                        </td>
                        <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">
                          {row.address}
                        </td>
                        <td className="px-4 py-2">
                          S${(row.credit_limit || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">{row.payment_terms}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              row.status === 'active'
                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                                : row.status === 'suspended'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                            }`}
                          >
                            {row.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 50 && (
                  <div className="border-t border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-2 text-center text-sm text-[var(--text-secondary)]">
                    Showing first 50 of {importData.length} companies
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-default)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing || importData.length === 0 || errors.length > 0}
            className="flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 font-bold text-[var(--color-primary-text)] transition-colors hover:bg-brand-dark/90 disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Importing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Import {importData.length} Compan
                {importData.length === 1 ? 'y' : 'ies'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
