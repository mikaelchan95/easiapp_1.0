import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/product';
import {
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface ProductImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportRow {
  name: string;
  description?: string;
  category: string;
  sku: string;
  retail_price: number;
  trade_price?: number;
  promo_price?: number;
  promo_start_date?: string;
  promo_end_date?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_limited?: boolean;
  image_url?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const CSV_TEMPLATE_HEADERS = [
  'name',
  'description',
  'category',
  'sku',
  'retail_price',
  'trade_price',
  'promo_price',
  'promo_start_date',
  'promo_end_date',
  'stock_quantity',
  'low_stock_threshold',
  'is_active',
  'is_featured',
  'is_limited',
  'image_url',
];

export default function ProductImport({
  onClose,
  onSuccess,
}: ProductImportProps) {
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
        'Sample Whisky',
        'Premium single malt whisky',
        'Whisky',
        'SAMPLE-001',
        '199.90',
        '169.90',
        '',
        '',
        '',
        '50',
        '10',
        'true',
        'false',
        'false',
        '',
      ],
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
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
          const rowNumber = index + 2; // +2 because index is 0-based and row 1 is headers

          // Required fields validation
          if (!row.name || !row.name.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'name',
              message: 'Name is required',
            });
          }

          if (!row.category || !row.category.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'category',
              message: 'Category is required',
            });
          }

          if (!row.sku || !row.sku.trim()) {
            validationErrors.push({
              row: rowNumber,
              field: 'sku',
              message: 'SKU is required',
            });
          }

          if (!row.retail_price || isNaN(parseFloat(row.retail_price))) {
            validationErrors.push({
              row: rowNumber,
              field: 'retail_price',
              message: 'Valid retail price is required',
            });
          }

          // Price validation
          const retailPrice = parseFloat(row.retail_price);
          const tradePrice = row.trade_price
            ? parseFloat(row.trade_price)
            : undefined;
          const promoPrice = row.promo_price
            ? parseFloat(row.promo_price)
            : undefined;

          if (retailPrice && retailPrice <= 0) {
            validationErrors.push({
              row: rowNumber,
              field: 'retail_price',
              message: 'Retail price must be greater than 0',
            });
          }

          if (tradePrice && tradePrice >= retailPrice) {
            validationErrors.push({
              row: rowNumber,
              field: 'trade_price',
              message: 'Trade price must be less than retail price',
            });
          }

          if (promoPrice && promoPrice >= retailPrice) {
            validationErrors.push({
              row: rowNumber,
              field: 'promo_price',
              message: 'Promo price must be less than retail price',
            });
          }

          // Build valid row
          const importRow: ImportRow = {
            name: row.name?.trim(),
            description: row.description?.trim() || '',
            category: row.category?.trim(),
            sku: row.sku?.trim(),
            retail_price: parseFloat(row.retail_price),
            trade_price: tradePrice,
            promo_price: promoPrice,
            promo_start_date: row.promo_start_date || null,
            promo_end_date: row.promo_end_date || null,
            stock_quantity: row.stock_quantity
              ? parseInt(row.stock_quantity)
              : 0,
            low_stock_threshold: row.low_stock_threshold
              ? parseInt(row.low_stock_threshold)
              : 10,
            is_active:
              row.is_active === 'true' ||
              row.is_active === '1' ||
              row.is_active === true,
            is_featured:
              row.is_featured === 'true' ||
              row.is_featured === '1' ||
              row.is_featured === true,
            is_limited:
              row.is_limited === 'true' ||
              row.is_limited === '1' ||
              row.is_limited === true,
            image_url: row.image_url?.trim() || '',
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
      // 1. Identify and create missing categories
      const uniqueCategories = new Set(
        importData.map(row => row.category).filter(Boolean)
      );

      if (uniqueCategories.size > 0) {
        // Fetch existing categories
        const { data: existingCategories, error: catError } = await supabase
          .from('categories')
          .select('name');

        if (catError) throw catError;

        const existingCategoryNames = new Set(
          existingCategories?.map(c => c.name) || []
        );
        const newCategories = Array.from(uniqueCategories).filter(
          cat => !existingCategoryNames.has(cat)
        );

        if (newCategories.length > 0) {
          // Prepare new categories for insertion
          // Helper to generate slug (duplicated from Categories.tsx to avoid dependency)
          const generateSlug = (name: string) => {
            return name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '');
          };

          // Get max sort order to append new categories at the end
          const { data: maxSortData } = await supabase
            .from('categories')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1);

          let currentSortOrder = (maxSortData?.[0]?.sort_order || 0) + 1;

          const categoriesToInsert = newCategories.map(name => ({
            name,
            slug: generateSlug(name),
            is_active: true,
            sort_order: currentSortOrder++,
            description: `Imported category: ${name}`,
          }));

          const { error: insertError } = await supabase
            .from('categories')
            .insert(categoriesToInsert);

          if (insertError) {
            console.error('Error creating new categories:', insertError);
            // We continue even if category creation fails, though it might be less than ideal
          }
        }
      }

      // Batch insert products
      const productsToInsert = importData.map(row => ({
        name: row.name,
        description: row.description || '',
        category: row.category,
        sku: row.sku,
        retail_price: row.retail_price,
        trade_price: row.trade_price || 0,
        promo_price: row.promo_price || null,
        promo_start_date: row.promo_start_date || null,
        promo_end_date: row.promo_end_date || null,
        stock_quantity: row.stock_quantity || 0,
        low_stock_threshold: row.low_stock_threshold || 10,
        is_active: row.is_active !== false,
        is_featured: row.is_featured || false,
        is_limited: row.is_limited || false,
        image_url: row.image_url || '',
        rating: 0,
      }));

      // Deduplicate by SKU (keeping the last occurrence)
      const uniqueProductsMap = new Map();
      productsToInsert.forEach(product => {
        uniqueProductsMap.set(product.sku, product);
      });
      const uniqueProductsToInsert = Array.from(uniqueProductsMap.values());

      const { data, error } = await supabase
        .from('products')
        .upsert(uniqueProductsToInsert, { onConflict: 'sku' })
        .select();

      if (error) {
        throw error;
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
      alert('Error importing products: ' + (error as Error).message);
      failedCount = importData.length;
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-[var(--bg-card)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Import Products from CSV
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
            <div className="rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] p-4 text-sm text-[var(--text-secondary)]">
              <strong className="block mb-2 font-semibold text-[var(--text-primary)]">
                Instructions:
              </strong>
              <ul className="ml-5 mt-2 list-disc space-y-1">
                <li>Download the template to see the required format</li>
                <li>Required fields: name, category, sku, retail_price</li>
                <li>
                  Boolean fields (is_active, is_featured, is_limited): use
                  "true" or "false"
                </li>
                <li>
                  Dates (promo_start_date, promo_end_date): use YYYY-MM-DD
                  format
                </li>
                <li>SKUs must be unique</li>
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
                Successfully imported {importResult.success} product(s).
                {importResult.failed > 0 && ` Failed: ${importResult.failed}`}
              </p>
            </div>
          )}

          {/* Preview Table */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2
                className="animate-spin text-[var(--text-primary)]"
                size={32}
              />
            </div>
          )}

          {!loading && importData.length > 0 && (
            <div>
              <h3 className="mb-3 font-bold text-[var(--text-primary)]">
                Preview ({importData.length} products)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-tertiary)] text-xs font-bold uppercase text-[var(--text-primary)]">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Retail Price</th>
                      <th className="px-4 py-2">Promo Price</th>
                      <th className="px-4 py-2">Stock</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {importData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-2 font-medium">{row.name}</td>
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {row.sku}
                        </td>
                        <td className="px-4 py-2">
                          S${row.retail_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          {row.promo_price
                            ? `S$${row.promo_price.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2">{row.stock_quantity}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              row.is_active
                                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                            }`}
                          >
                            {row.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 50 && (
                  <div className="border-t border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-2 text-center text-sm text-[var(--text-secondary)]">
                    Showing first 50 of {importData.length} products
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
                Import {importData.length} Product
                {importData.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
