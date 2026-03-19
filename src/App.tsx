import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { simWorker } from './worker/simBridge';
import { useUIStore } from './ui/store/uiStore';
import { renderSimulation, invalidateStaticCanvas } from './render2d/canvasRenderer';
import { ControlsPanel } from './ui/panels/ControlsPanel';
import { UpgradesPanel } from './ui/panels/UpgradesPanel';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from './shared/constants';
import './index.css';

const LazyAntScene = lazy(() =>
  import('./render3d/AntScene').then((module) => ({ default: module.AntScene }))
);

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setSimState, setPaused, renderMode } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Init simulation on mount
    const init = async () => {
      try {
        await simWorker.init();
        await simWorker.pause();
        setPaused(true);
      } finally {
        setIsLoading(false);
      }
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
    <div className="app-container" role="main" aria-label="Ant colony simulation">
      {isLoading ? (
        <div className="loading-overlay" role="alert" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Initializing Ant Colony...</p>
        </div>
      ) : (
        <>
          <div className="sim-container">
            {renderMode === '2D' ? (
              <canvas
                ref={canvasRef}
                width={WORLD_WIDTH * CELL_SIZE}
                height={WORLD_HEIGHT * CELL_SIZE}
                className="sim-canvas"
                role="img"
                aria-label="Ant colony simulation canvas"
                tabIndex={0}
              />
            ) : (
              <Suspense
                fallback={
                  <div className="loading-overlay" role="status" aria-live="polite" aria-label="Loading 3D view">
                    <div className="loading-spinner" aria-hidden="true"></div>
                    <p>Loading 3D view...</p>
                  </div>
                }
              >
                <LazyAntScene />
              </Suspense>
            )}
          </div>
          <div className="panels-container">
            <UpgradesPanel />
            <ControlsPanel />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
