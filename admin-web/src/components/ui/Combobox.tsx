import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  onCreateNew?: (value: string) => Promise<boolean>;
  label?: string;
  allowCreate?: boolean;
  className?: string;
}

/**
 * Minimalistic combobox for typing, filtering, and creating options.
 */
export default function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Type to search...',
  onCreateNew,
  label,
  allowCreate = true,
  className = '',
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches an existing option
  const exactMatch = options.some(
    option => option.toLowerCase() === search.toLowerCase()
  );

  // Show "Create new" option - show when typing something that doesn't exist
  const showCreateOption = allowCreate && search.trim() && !exactMatch;

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
    setSearch('');
  };

  const handleCreate = async () => {
    if (!search.trim() || !onCreateNew) return;

    setCreating(true);
    try {
      const success = await onCreateNew(search.trim());
      if (success) {
        onChange(search.trim());
        setOpen(false);
        setSearch('');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    setOpen(true);

    // If user clears the input, clear the selection
    if (!newValue) {
      onChange('');
    }
  };

  const handleInputFocus = () => {
    setOpen(true);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 pr-10 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (!open) {
              inputRef.current?.focus();
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronDown
            size={20}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-md max-h-60 overflow-auto">
          {filteredOptions.length > 0 || showCreateOption ? (
            <>
              {filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between ${
                    value === option ? 'bg-[var(--bg-secondary)]' : ''
                  }`}
                >
                  <span className="text-[var(--text-primary)]">{option}</span>
                  {value === option && (
                    <Check size={14} className="text-[var(--text-primary)]" />
                  )}
                </button>
              ))}

              {/* Create new */}
              {showCreateOption && (
                <>
                  {filteredOptions.length > 0 && (
                    <div className="border-t border-[var(--border-primary)]" />
                  )}
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2 text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Plus size={14} className="flex-shrink-0" />
                    <span className="flex-1 truncate">
                      {creating ? 'Creating...' : `Create "${search}"`}
                    </span>
                  </button>
                </>
              )}
            </>
          ) : search.trim() ? (
            <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
              No results
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
              {options.length === 0 ? 'No options' : 'Type to search'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
