import { useState } from 'react';
import {
  Settings,
  Image,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  fixAllProductImageUrls,
  verifyProductImages,
} from '../utils/fixImageUrls';

export default function Maintenance() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    type: 'fix' | 'verify' | null;
    data: any;
  }>({ type: null, data: null });

  const handleFixImages = async () => {
    setLoading(true);
    setResults({ type: null, data: null });

    try {
      const result = await fixAllProductImageUrls();
      setResults({ type: 'fix', data: result });
    } catch (error) {
      setResults({
        type: 'fix',
        data: {
          success: false,
          message: 'Failed to fix images',
          updated: 0,
          errors: [(error as Error).message],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyImages = async () => {
    setLoading(true);
    setResults({ type: null, data: null });

    try {
      const result = await verifyProductImages();
      setResults({ type: 'verify', data: result });
    } catch (error) {
      setResults({
        type: 'verify',
        data: {
          total: 0,
          accessible: 0,
          broken: [],
          error: (error as Error).message,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-8 w-8 text-[var(--text-primary)]" />
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          System Maintenance
        </h1>
      </div>

      <div className="space-y-6">
        {/* Image URL Utilities */}
        <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <Image className="h-6 w-6 text-[var(--text-primary)] mt-1" />
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Product Image URLs
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Standardize and verify product image URLs in the database. This
                ensures consistency between admin web and mobile app.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleFixImages}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] touch-manipulation"
            >
              {loading && results.type === 'fix' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--bg-primary)] border-t-transparent" />
              ) : (
                <CheckCircle size={18} />
              )}
              Fix All Image URLs
            </button>

            <button
              onClick={handleVerifyImages}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2.5 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              {loading && results.type === 'verify' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--text-primary)] border-t-transparent" />
              ) : (
                <AlertCircle size={18} />
              )}
              Verify Images
            </button>
          </div>
        </div>

        {/* Results Display */}
        {results.type && results.data && (
          <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              Results
            </h3>

            {results.type === 'fix' && (
              <div>
                {results.data.success ? (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] mb-4">
                    <CheckCircle className="h-5 w-5 text-[var(--text-primary)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {results.data.message}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Successfully updated {results.data.updated} product
                        image URLs
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-400">
                        {results.data.message}
                      </p>
                    </div>
                  </div>
                )}

                {results.data.errors && results.data.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Errors:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-[var(--text-secondary)]">
                      {results.data.errors.map((error: string, idx: number) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results.type === 'verify' && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      Total Products
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {results.data.total}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      Accessible
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {results.data.accessible}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-500 mb-1">
                      Broken
                    </p>
                    <p className="text-2xl font-bold text-red-800 dark:text-red-400">
                      {results.data.broken.length}
                    </p>
                  </div>
                </div>

                {results.data.broken.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
                      Products with broken images:
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.data.broken.map(
                        (product: {
                          id: string;
                          name: string;
                          image_url: string;
                        }) => (
                          <div
                            key={product.id}
                            className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                          >
                            <p className="font-medium text-[var(--text-primary)]">
                              {product.name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1 font-mono break-all">
                              {product.image_url}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {results.data.error && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-400">
                      {results.data.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">
            📖 How It Works
          </h3>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <div>
              <p className="font-semibold mb-1">Fix All Image URLs:</p>
              <p>
                Standardizes all product image URLs to the format{' '}
                <code className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] font-mono text-xs">
                  products/filename.ext
                </code>
                . This ensures consistency between admin web and mobile app.
                Images uploaded via admin web will work correctly on mobile, and
                vice versa.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Verify Images:</p>
              <p>
                Checks all product images to ensure they exist in Supabase
                storage. Reports which products have broken or missing images
                that need attention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








