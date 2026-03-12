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
  return (
    <aside className="w-56 shrink-0 border-r border-qfc-border bg-qfc-bg flex flex-col">
      <div className="px-5 py-5 border-b border-qfc-border">
        <h1 className="text-lg font-bold text-qfc-primary tracking-wide">QFC AgentHub</h1>
        <p className="text-xs text-qfc-muted mt-0.5">Agent Collaboration Layer</p>
      </div>
      <nav className="flex-1 py-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-qfc-bg-light text-qfc-primary border-l-2 border-qfc-primary'
                  : 'text-qfc-muted hover:text-qfc-text hover:bg-qfc-bg-light/50 border-l-2 border-transparent'
              }`
            }
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-qfc-border text-xs text-qfc-muted">
        v0.1.0
      </div>
    </aside>
  );
}
