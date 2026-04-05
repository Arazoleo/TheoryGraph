import { Network, Play, GitFork, Table2 } from 'lucide-react';

const tabs = [
  { id: 'editor', label: 'Editor', icon: Network },
  { id: 'algorithms', label: 'Algoritmos MST', icon: Play },
  { id: 'unionfind', label: 'Conjuntos Disjuntos', icon: GitFork },
  { id: 'representations', label: 'Representações', icon: Table2 },
];

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center px-6 gap-6 shrink-0 z-10">
      <div className="flex items-center gap-3 mr-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Network size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold text-gradient tracking-tight">GraphLab</span>
      </div>

      <nav className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-cyan-400' : ''} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="ml-auto text-xs text-slate-500 hidden lg:block">
        Simulador Interativo de Teoria dos Grafos
      </div>
    </header>
  );
}
