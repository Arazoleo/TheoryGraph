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
    <div className="h-16 border-t border-white/5 bg-slate-900/60 backdrop-blur-md flex items-center justify-center gap-3 px-6 shrink-0">
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
        <div className="w-40 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-slate-400 text-xs font-mono w-16 text-center">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
}
