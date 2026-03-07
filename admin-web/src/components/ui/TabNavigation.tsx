import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Tab {
  label: string;
  value: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface StateTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  variant?: 'underline' | 'pill';
}

interface LinkTabNavigationProps {
  tabs: Tab[];
  variant?: 'underline' | 'pill';
}

type TabNavigationProps =
  | (StateTabNavigationProps & { mode?: 'state' })
  | (LinkTabNavigationProps & { mode: 'link' });

export function TabNavigation(props: TabNavigationProps) {
  const location = useLocation();
  const variant = props.variant ?? 'underline';

  if (props.mode === 'link') {
    return (
      <nav className={containerClass(variant)}>
        {props.tabs.map(tab => {
          const isActive = location.pathname === tab.value;
          return (
            <Link
              key={tab.value}
              to={tab.value}
              className={tabClass(variant, isActive)}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge}
            </Link>
          );
        })}
      </nav>
    );
  }

  const { activeTab, onChange } = props as StateTabNavigationProps;
  return (
    <nav className={containerClass(variant)}>
      {props.tabs.map(tab => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={tabClass(variant, isActive)}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </nav>
  );
}

function containerClass(variant: 'underline' | 'pill') {
  if (variant === 'pill') {
    return 'inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1';
  }
  return 'flex items-center gap-6 border-b border-gray-200';
}

function tabClass(variant: 'underline' | 'pill', isActive: boolean) {
  const base =
    'inline-flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap';
  if (variant === 'pill') {
    return `${base} px-3 py-1.5 rounded-md ${
      isActive
        ? 'bg-white text-[var(--text-primary)] shadow-sm'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;
  }
  return `${base} pb-3 border-b-2 -mb-px ${
    isActive
      ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
  }`;
}
