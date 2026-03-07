import { useState } from 'react';
import { Plus, Trash2, Edit, Image as ImageIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

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
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Content"
        description="Manage banners and promotional content"
        actions={<Button leftIcon={<Plus size={16} />}>Add Banner</Button>}
      />

      {banners.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <ImageIcon size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-[var(--text-secondary)]">
            No banners yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map(banner => (
            <Card key={banner.id} hover className="overflow-hidden !p-0">
              <div className="relative h-40 bg-gray-50">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={banner.active ? 'mono' : 'mono-outline'}>
                    {banner.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-3">
                  {banner.title}
                </h3>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
