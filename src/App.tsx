import { useEffect, useRef } from 'react';
import { simWorker } from './worker/simBridge';
import { useUIStore } from './ui/store/uiStore';
import { renderSimulation, invalidateStaticCanvas } from './render2d/canvasRenderer';
import { ControlsPanel } from './ui/panels/ControlsPanel';
import { UpgradesPanel } from './ui/panels/UpgradesPanel';
import { AntScene } from './render3d/AntScene';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from './shared/constants';
import './index.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setSimState, setPaused, renderMode } = useUIStore();

  useEffect(() => {
    // Init simulation on mount
    const init = async () => {
      await simWorker.init();
      await simWorker.pause();
      setPaused(true);
    };
    init();
  }, [setPaused, setSimState]);

  // Separate effect for rendering loop to ensure we pick up UI store changes
  useEffect(() => {
    let rafId: number;
    let isFetching = false;

    const loop = async () => {
      if (!isFetching) {
        isFetching = true;
        try {
          const snapshot = await simWorker.getSnapshot();
          if (snapshot) {
            // Invalidate static canvas on reset so it gets rebuilt with new grid
            if (snapshot.tick === 0) {
              invalidateStaticCanvas();
            }
            setSimState(snapshot);

            // Only fire 2D canvas renders if we are actually looking at it
            if (useUIStore.getState().renderMode === '2D') {
              const ctx = canvasRef.current?.getContext('2d');
              if (ctx) {
                renderSimulation(ctx, snapshot, {
                  showPheromones: useUIStore.getState().showPheromones
                });
              }
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
  }, [setSimState]);

  return (
    <div className="app-container">
      {renderMode === '2D' ? (
        <canvas
          ref={canvasRef}
          width={WORLD_WIDTH * CELL_SIZE}
          height={WORLD_HEIGHT * CELL_SIZE}
          className="sim-canvas"
        />
      ) : (
        <AntScene />
      )}
      <UpgradesPanel />
      <ControlsPanel />
    </div>
  );
}

export default App;
