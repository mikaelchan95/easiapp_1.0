import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Tag,
  Edit,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getImageUrl } from '../lib/imageUtils';
import { categoryService } from '../services/categoryService';
import { useToast } from '../components/ui/Toast';
import CategorySlideOver from '../components/Categories/CategorySlideOver';
import type { Category } from '../types/category';

type FilterTab = 'all' | 'active' | 'inactive';
const PAGE_SIZE = 10;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

// ─── Sortable Row ────────────────────────────────────────────────
interface SortableRowProps {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggleActive: (c: Category) => void;
  togglingId: string | null;
}

function SortableRow({
  category,
  onEdit,
  onDelete,
  onToggleActive,
  togglingId,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  };

  const imgUrl = getImageUrl(category.image_url);
  const isToggling = togglingId === category.id;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group transition-colors ${isDragging ? 'bg-[var(--bg-tertiary)] shadow-lg ring-1 ring-[var(--border-primary)]' : 'hover:bg-[var(--bg-tertiary)]/50'}`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-4 w-10">
        <button
          {...attributes}
          {...listeners}
          className="text-[var(--text-tertiary)] cursor-grab group-hover:text-[var(--text-secondary)] transition-colors touch-manipulation active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      </td>

      {/* Thumbnail */}
      <td className="px-4 py-4 w-16">
        <div className="size-10 rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon size={16} className="text-[var(--text-tertiary)]" />
          )}
        </div>
      </td>

      {/* Name & Slug */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-[var(--text-primary)]">
            {category.name}
          </span>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">
            /{category.slug}
          </span>
        </div>
      </td>

      {/* Products Count */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--text-secondary)]">
          {category.count || 0} items
        </span>
      </td>

      {/* Status Toggle */}
      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={category.is_active}
              disabled={isToggling}
              onChange={() => onToggleActive(category)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
          </label>
          <span
            className={`ml-3 text-xs font-bold ${category.is_active ? 'text-[var(--color-primary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors rounded-lg hover:bg-[var(--bg-tertiary)]"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-[var(--text-tertiary)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function Categories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Slide-over state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ─── Filtering ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = categories;

    if (activeTab === 'active') result = result.filter(c => c.is_active);
    if (activeTab === 'inactive') result = result.filter(c => !c.is_active);

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    }

    return result;
  }, [categories, activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const tabCounts = useMemo(
    () => ({
      all: categories.length,
      active: categories.filter(c => c.is_active).length,
      inactive: categories.filter(c => !c.is_active).length,
    }),
    [categories]
  );

  // ─── Actions ───────────────────────────────────────────────────
  const handleOpenSlideOver = (category?: Category) => {
    setEditingCategory(category || null);
    setSlideOverOpen(true);
  };

  const handleToggleActive = useCallback(
    async (category: Category) => {
      setTogglingId(category.id);
      try {
        await categoryService.toggleCategoryActive(
          category.id,
          !category.is_active
        );
        setCategories(prev =>
          prev.map(c =>
            c.id === category.id ? { ...c, is_active: !c.is_active } : c
          )
        );
        toast(
          `${category.name} is now ${!category.is_active ? 'active' : 'inactive'}`,
          'success'
        );
      } catch {
        toast('Failed to update status', 'error');
      } finally {
        setTogglingId(null);
      }
    },
    [toast]
  );

  const handleDelete = useCallback(
    async (category: Category) => {
      if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`))
        return;

      try {
        await categoryService.deleteCategory(category.id);
        setCategories(prev => prev.filter(c => c.id !== category.id));
        toast(`"${category.name}" deleted`, 'success');
      } catch {
        toast('Failed to delete category', 'error');
      }
    },
    [toast]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(categories, oldIndex, newIndex);
      setCategories(reordered);

      try {
        await categoryService.reorderCategories(reordered.map(c => c.id));
        toast(`Reordered ${categories.length} categories`, 'success');
      } catch {
        setCategories(categories);
        toast('Reorder failed', 'error');
      }
    },
    [categories, toast]
  );

  const nextSortOrder = useMemo(
    () => Math.max(...categories.map(c => c.sort_order), -1) + 1,
    [categories]
  );

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">
            Categories
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and organize your product categories
          </p>
        </div>
        <button
          onClick={() => handleOpenSlideOver()}
          className="flex items-center gap-2 rounded-lg h-10 px-5 bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--border-primary)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] placeholder:text-[var(--text-tertiary)] transition-all"
        />
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[var(--border-primary)] px-6">
          {(
            [
              { key: 'all', label: 'All Categories' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' },
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-bold'
                  : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs">({tabCounts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-full bg-[var(--bg-tertiary)] p-4">
              <Tag size={32} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              No categories found
            </h3>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Get started by creating your first category'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => handleOpenSlideOver()}
                className="mt-4 text-sm font-bold text-[var(--color-primary)] hover:underline"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-10 px-4 py-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider" />
                    <th className="w-16 px-4 py-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Category & Slug
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Products
                    </th>
                    <th className="w-40 px-6 py-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="w-28 px-6 py-3 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <SortableContext
                  items={paged.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-gray-100">
                    {paged.map(category => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onEdit={handleOpenSlideOver}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                        togglingId={togglingId}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Showing{' '}
              <span className="font-bold text-gray-700">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-gray-700">
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-gray-700">{filtered.length}</span>{' '}
              categories
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-white transition-all disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {getPageNumbers(currentPage, totalPages).map((item, i) =>
                item === '...' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="size-8 flex items-center justify-center text-xs text-gray-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`size-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                      item === currentPage
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border border-gray-300 text-gray-500 hover:bg-white'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="size-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-white transition-all disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over */}
      <CategorySlideOver
        isOpen={slideOverOpen}
        onClose={() => {
          setSlideOverOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSaved={loadCategories}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
}
