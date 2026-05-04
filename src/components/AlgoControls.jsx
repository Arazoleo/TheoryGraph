import { SkipBack, Rewind, Play, Pause, FastForward, SkipForward } from 'lucide-react';

export default function AlgoControls({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onReset,
  onEnd,
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="h-16 border-t aux-bar backdrop-blur-md flex items-center justify-center gap-3 px-6 shrink-0">
      <button onClick={onReset} className="ctrl-btn" title="Reiniciar">
        <SkipBack size={16} />
      </button>
      <button
        onClick={onStepBack}
        className="ctrl-btn"
        disabled={currentStep <= 0}
        title="Passo anterior"
      >
        <Rewind size={16} />
      </button>

      {isPlaying ? (
        <button onClick={onPause} className="ctrl-btn primary" title="Pausar">
          <Pause size={18} />
        </button>
      ) : (
        <button
          onClick={onPlay}
          className="ctrl-btn primary"
          disabled={currentStep >= totalSteps - 1}
          title="Executar"
        >
          <Play size={18} className="ml-0.5" />
        </button>
      )}

      <button
        onClick={onStepForward}
        className="ctrl-btn"
        disabled={currentStep >= totalSteps - 1}
        title="Próximo passo"
      >
        <FastForward size={16} />
      </button>
      <button onClick={onEnd} className="ctrl-btn" title="Ir ao fim">
        <SkipForward size={16} />
      </button>

      <div className="ml-4 flex items-center gap-3 text-sm">
        <div className="w-44 h-1.5 rounded-full overflow-hidden relative" style={{ background: 'var(--surface)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #0891b2 0%, #4f46e5 50%, #7c3aed 100%)',
              boxShadow: progress > 0 ? '0 0 10px rgba(34,211,238,0.5), 0 0 5px rgba(124,58,237,0.4)' : 'none',
            }}
          />
        </div>
        <span
          className="text-xs font-mono w-16 text-center tabular-nums"
          style={{ color: 'var(--text-muted)' }}
        >
          {currentStep + 1} <span style={{ color: 'var(--border-bright)' }}>/</span> {totalSteps}
        </span>
      </div>
    </div>
  );
}
