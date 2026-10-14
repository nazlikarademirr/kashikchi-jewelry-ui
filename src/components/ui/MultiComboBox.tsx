import { useId, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface MultiComboBoxOption {
  value: string;
  label: string;
  depth?: number;
  children?: string[];
  parentId?: string;
}

export function MultiComboBox({ label, placeholder, emptyText, options, value, onChange, disabled = false }: {
  label: string; placeholder: string; emptyText: string;
  options: MultiComboBoxOption[]; value: string[];
  onChange: (value: string[]) => void; disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(-1);
  const visible = options.filter(option => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const selectedText = options
    .filter(option => {
      if (!value.includes(option.value)) return false;
      if (option.parentId && value.includes(option.parentId)) return false;
      return true;
    })
    .map(option => option.label)
    .join(', ');

  const toggle = (key: string) => {
    const target = options.find(o => o.value === key);
    if (!target) return;

    let next: string[];
    if (target.children && target.children.length > 0) {
      const isCurrentlySelected = value.includes(key);
      if (isCurrentlySelected) {
        const toRemove = new Set([key, ...target.children]);
        next = value.filter(v => !toRemove.has(v));
      } else {
        const toAdd = [key, ...target.children];
        next = Array.from(new Set([...value, ...toAdd]));
      }
    } else {
      const isCurrentlySelected = value.includes(key);
      if (isCurrentlySelected) {
        next = value.filter(v => v !== key && v !== target.parentId);
      } else {
        const withChild = Array.from(new Set([...value, key]));
        if (target.parentId) {
          const parentOption = options.find(o => o.value === target.parentId);
          const allChildren = parentOption?.children ?? [];
          const allSelected = allChildren.length > 0 && allChildren.every(cId => withChild.includes(cId));
          if (allSelected) {
            next = Array.from(new Set([...withChild, target.parentId]));
          } else {
            next = withChild;
          }
        } else {
          next = withChild;
        }
      }
    }
    onChange(next);
  };

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="combobox" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}>
        <input id={id} ref={input} className="input input--has-action" role="combobox" autoComplete="off"
          disabled={disabled} value={open ? search : selectedText} placeholder={selectedText || placeholder}
          title={selectedText} aria-expanded={open} aria-controls={`${id}-options`} aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
          onClick={() => { if (!open) { setSearch(''); setActive(-1); setOpen(true); } }}
          onChange={event => { setSearch(event.target.value); setActive(-1); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              if (!open) { setSearch(''); setOpen(true); setActive(options.length ? 0 : -1); }
              else setActive(index => visible.length ? Math.max(0, Math.min(visible.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))) : -1);
            } else if (event.key === 'Enter' && open) {
              event.preventDefault();
              if (visible[active]) toggle(visible[active].value);
            } else if (event.key === 'Escape' && open) {
              event.preventDefault(); event.stopPropagation(); setOpen(false);
            }
          }} />
        <button type="button" className="input-action-btn" aria-label={label} disabled={disabled}
          aria-expanded={open} aria-controls={`${id}-options`} onMouseDown={event => event.preventDefault()}
          onClick={() => { setSearch(''); setActive(-1); setOpen(!open); input.current?.focus(); }}>
          <Icon name="chevronDown" size={18} />
        </button>
        {open && (
          <div id={`${id}-options`} className="combobox__options" role="listbox" aria-label={label} aria-multiselectable="true">
            {visible.map((option, index) => (
              <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={value.includes(option.value)}
                className={`combobox__option multiselect__option ${option.depth === 1 ? 'multiselect__option--child' : 'multiselect__option--parent'} ${index === active ? 'combobox__option--active' : ''}`}
                onMouseDown={event => event.preventDefault()} onClick={() => toggle(option.value)}>
                <span className="multiselect__check" aria-hidden="true">{value.includes(option.value) && <Icon name="check" size={14} />}</span>
                {option.label}
              </div>
            ))}
            {!visible.length && <div className="combobox__option muted">{emptyText}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
