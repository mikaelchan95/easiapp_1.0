import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function Content() {
  const [banners, setBanners] = useState([
    {
      id: 1,
      title: 'Summer Sale',
      image: 'https://placehold.co/600x200',
      active: true,
    },
    {
      id: 2,
      title: 'New Arrivals',
      image: 'https://placehold.co/600x200',
      active: false,
    },
  ]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Content & Banners
        </h1>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 font-semibold transition-all hover:opacity-90 shadow-sm min-h-[44px] touch-manipulation">
          <Plus size={20} />
          Add Banner
        </button>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map(banner => (
          <div
            key={banner.id}
            className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative h-40 bg-[var(--bg-tertiary)]">
              <img
                src={banner.image}
                alt={banner.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    banner.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400'
                  }`}
                >
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)] truncate">
                {banner.title}
              </h3>
              <div className="flex justify-end gap-2">
                <button className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors min-h-[36px] touch-manipulation">
                  <Edit size={16} className="inline mr-1" />
                  Edit
                </button>
                <button className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
