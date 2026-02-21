import { useUIStore } from '../store/uiStore';
import { simWorker } from '../../worker/simBridge';
import './ControlsPanel.css';

export const ControlsPanel = () => {
    const {
        isPaused, setPaused, simState,
        speedMultiplier, setSpeedMultiplier,
        showPheromones, setShowPheromones,
        renderMode, setRenderMode
    } = useUIStore();

    const handlePlayPause = async () => {
        if (isPaused) {
            await simWorker.start();
            setPaused(false);
        } else {
            await simWorker.pause();
            setPaused(true);
        }
    };

    const handleReset = async () => {
        await simWorker.reset();
        await simWorker.start();
        setPaused(false);
    };

    const handleSpeed = async (newSpeed: number) => {
        await simWorker.setSpeed(newSpeed);
        setSpeedMultiplier(newSpeed);
    };

    return (
        <div className="controls-panel">
            <h2 className="panel-title">Colony Controls</h2>

            <div className="status-grid">
                <div className="status-item">
                    <span className="label">Tick</span>
                    <span className="value">{simState?.tick || 0}</span>
                </div>
                <div className="status-item">
                    <span className="label">Ants</span>
                    <span className="value">{simState?.ants?.length || 0}</span>
                </div>
                <div className="status-item">
                    <span className="label">Colony Food</span>
                    <span className="value text-highlight">{simState?.colonyFood || 0}</span>
                </div>
            </div>

            <div className="control-group">
                <button
                    className={`btn-primary ${!isPaused ? 'active' : ''}`}
                    onClick={handlePlayPause}
                >
                    {isPaused ? '▶ Play' : '⏸ Pause'}
                </button>
                <button className="btn-secondary" onClick={handleReset}>
                    ↺ Reset
                </button>
            </div>

            <div className="control-section">
                <h3 className="section-title">Speed Multiplier</h3>
                <div className="button-group">
                    {[1, 2, 4].map((speed) => (
                        <button
                            key={speed}
                            className={`btn-toggle ${speedMultiplier === speed ? 'active' : ''}`}
                            onClick={() => handleSpeed(speed)}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>

            <div className="control-section">
                <h3 className="section-title">Display Mode</h3>
                <div className="button-group">
                    <button
                        className={`btn-toggle ${renderMode === '2D' ? 'active' : ''}`}
                        onClick={() => setRenderMode('2D')}
                    >
                        2D Map
                    </button>
                    <button
                        className={`btn-toggle ${renderMode === '3D' ? 'active' : ''}`}
                        onClick={() => setRenderMode('3D')}
                    >
                        3D Orbit
                    </button>
                </div>
            </div>

            <div className="control-section">
                <h3 className="section-title">Debug Overlays (2D Only)</h3>
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={showPheromones}
                        onChange={(e) => setShowPheromones(e.target.checked)}
                        disabled={renderMode !== '2D'}
                    />
                    Pheromone Heatmap
                </label>
            </div>
        </div>
    );
};
