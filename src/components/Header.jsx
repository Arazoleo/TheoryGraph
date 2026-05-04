import { Network, Play, GitFork, Table2, Sun, Moon } from 'lucide-react';

const tabs = [
  { id: 'editor', label: 'Editor', icon: Network },
  { id: 'algorithms', label: 'Algoritmos', icon: Play },
  { id: 'unionfind', label: 'Conj. Disjuntos', icon: GitFork },
  { id: 'representations', label: 'Representações', icon: Table2 },
];

export default function Header({ activeTab, onTabChange, isDark, onThemeToggle }) {
  return (
    <header
      className="h-14 flex items-center px-5 gap-5 shrink-0 z-10 relative"
      style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border-color)' }}
    >
      {/* Gradient accent line at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.4) 30%, rgba(139,92,246,0.4) 70%, transparent 100%)',
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-1 shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0e7490 0%, #4f46e5 50%, #7c3aed 100%)',
            boxShadow: '0 0 16px rgba(34,211,238,0.35), 0 0 6px rgba(124,58,237,0.3)',
          }}
        >
          <Network size={15} className="text-white relative z-10" />
        </div>
        <span className="text-[1.05rem] font-black text-gradient tracking-tight">GraphLab</span>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative"
              style={{
                color: isActive ? '#22d3ee' : 'var(--text-muted)',
                background: isActive ? 'rgba(34,211,238,0.07)' : 'transparent',
              }}
            >
              <Icon size={14} style={{ color: isActive ? '#22d3ee' : 'var(--text-muted)' }} />
              <span className="hidden md:inline">{tab.label}</span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px rounded-full pointer-events-none"
                  style={{
                    width: '60%',
                    background: 'linear-gradient(90deg, #22d3ee, #8b5cf6)',
                    boxShadow: '0 0 6px rgba(34,211,238,0.6)',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <span
          className="text-xs hidden lg:block font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          Simulador de Teoria dos Grafos
        </span>
        <button
          onClick={onThemeToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            background: 'var(--surface-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}
          title={isDark ? 'Modo Claro' : 'Modo Escuro'}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
}
