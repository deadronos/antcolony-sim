import { useEffect, useRef } from 'react';
import { simWorker } from './worker/simBridge';
import { useUIStore } from './ui/store/uiStore';
import { renderSimulation } from './render2d/canvasRenderer';
import { ControlsPanel } from './ui/panels/ControlsPanel';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from './shared/constants';
import './index.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setSimState, setPaused } = useUIStore();

  useEffect(() => {
    // Init simulation on mount
    const init = async () => {
      await simWorker.init();
      await simWorker.pause();
      setPaused(true);
    };
    init();

    let rafId: number;
    let isFetching = false;

    const loop = async () => {
      if (!isFetching) {
        isFetching = true;
        try {
          const state = await simWorker.getState();
          if (state) {
            // Avoid updating Zustand every frame to prevent React overhead,
            // or do it selectively. For now we update it every frame.
            setSimState(state);

            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
              renderSimulation(ctx, state);
            }
          }
        } catch (e) {
          console.error("Worker fetch failed", e);
        } finally {
          isFetching = false;
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [setSimState, setPaused]);

  return (
    <div className="app-container">
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH * CELL_SIZE}
        height={WORLD_HEIGHT * CELL_SIZE}
        className="sim-canvas"
      />
      <ControlsPanel />
    </div>
  );
}

export default App;
