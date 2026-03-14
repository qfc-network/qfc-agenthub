import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '\u25A6' },
  { to: '/agents', label: 'Agents', icon: '\u2699' },
  { to: '/assignments', label: 'Assignments', icon: '\u2611' },
  { to: '/reputation', label: 'Reputation', icon: '\u2605' },
  { to: '/nfts', label: 'NFTs', icon: '\u26D3' },
  { to: '/platforms', label: 'Platforms', icon: '\u2B82' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
      isActive
        ? 'bg-qfc-bg-light text-qfc-primary border border-qfc-primary/30'
        : 'text-qfc-muted hover:text-qfc-text hover:bg-qfc-bg-light/50 border border-transparent'
    }`;

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-qfc-border bg-qfc-bg/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-bold text-qfc-primary tracking-wide">QFC AgentHub</h1>
            <p className="text-[11px] text-qfc-muted">Agent Collaboration Layer</p>
          </div>
          <button
            type="button"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg border border-qfc-border bg-qfc-bg-card px-3 py-2 text-sm text-qfc-text"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        {open && (
          <nav className="border-t border-qfc-border px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className={navLinkClass}
                >
                  <span className="text-base">{l.icon}</span>
                  <span className="truncate">{l.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>

      <aside className="hidden w-56 shrink-0 border-r border-qfc-border bg-qfc-bg md:flex md:flex-col">
        <div className="border-b border-qfc-border px-5 py-5">
          <h1 className="text-lg font-bold text-qfc-primary tracking-wide">QFC AgentHub</h1>
          <p className="mt-0.5 text-xs text-qfc-muted">Agent Collaboration Layer</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-3">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navLinkClass}>
              <span className="text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-qfc-border px-5 py-3 text-xs text-qfc-muted">v0.1.0</div>
      </aside>
    </>
  );
}
