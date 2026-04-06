import { useUIStore } from '../store/uiStore';
import { simWorker } from '../../worker/simBridge';
import { BroodType, AntType } from '../../sim/core/types';
import './ControlsPanel.css';

export const ControlsPanel = () => {
    const {
        isPaused, setPaused, simState,
        speedMultiplier, setSpeedMultiplier,
        showPheromones, setShowPheromones,
        renderMode, setRenderMode
    } = useUIStore();

    const eggs = simState?.brood?.filter(b => b.type === BroodType.EGG).length || 0;
    const larvae = simState?.brood?.filter(b => b.type === BroodType.LARVA).length || 0;
    const pupae = simState?.brood?.filter(b => b.type === BroodType.PUPA).length || 0;

    // Count ants currently carrying food
    const antsWithFood = simState?.ants?.filter(a => a.hasFood).length || 0;

    // Estimate food in world (remaining quantity in tiles) - only available in full SimState, not Snapshot
    const foodInWorld = simState && 'foodQuantity' in simState ?
        (simState as { foodQuantity?: Uint8Array }).foodQuantity?.reduce((sum: number, qty: number) => sum + qty, 0) || 0 : 0;

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

    const handleProductionType = async (type: AntType) => {
        await simWorker.setProductionType(type);
    };

    const currentProductionType = simState?.productionType ?? AntType.WORKER;

    return (
        <div className="controls-panel" role="region" aria-label="Colony controls">
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
                    <span className="label">Carrying Food</span>
                    <span className="value text-highlight">{antsWithFood}</span>
                </div>
                <div className="status-item">
                    <span className="label">Colony Food</span>
                    <span className="value text-highlight">{Math.floor(simState?.colonyFood || 0)}</span>
                </div>
                <div className="status-item">
                    <span className="label">Food Available</span>
                    <span className="value">{foodInWorld}</span>
                </div>
                <div className="status-item">
                    <span className="label">Food Patches</span>
                    <span className="value">{simState?.foodTileCount || 0}</span>
                </div>
            </div>

            <div className="control-section">
                <h3 className="section-title">Spawn Selection</h3>
                <div className="button-group">
                    <button
                        className={`btn-toggle ${currentProductionType === AntType.WORKER ? 'active' : ''}`}
                        onClick={() => handleProductionType(AntType.WORKER)}
                        aria-label="Select worker ant type"
                        aria-pressed={currentProductionType === AntType.WORKER}
                        role="radio"
                        tabIndex={0}
                    >
                        Worker
                    </button>
                    <button
                        className={`btn-toggle ${currentProductionType === AntType.SCOUT ? 'active' : ''}`}
                        onClick={() => handleProductionType(AntType.SCOUT)}
                        aria-label="Select scout ant type"
                        aria-pressed={currentProductionType === AntType.SCOUT}
                        role="radio"
                        tabIndex={0}
                    >
                        Scout
                    </button>
                    <button
                        className={`btn-toggle ${currentProductionType === AntType.SOLDIER ? 'active' : ''}`}
                        onClick={() => handleProductionType(AntType.SOLDIER)}
                        aria-label="Select soldier ant type"
                        aria-pressed={currentProductionType === AntType.SOLDIER}
                        role="radio"
                        tabIndex={0}
                    >
                        Soldier
                    </button>
                </div>
            </div>

            <div className="status-grid brood-stats">
                <div className="status-item">
                    <span className="label">Eggs</span>
                    <span className="value">{eggs}</span>
                </div>
                <div className="status-item">
                    <span className="label">Larvae</span>
                    <span className="value">{larvae}</span>
                </div>
                <div className="status-item">
                    <span className="label">Pupae</span>
                    <span className="value">{pupae}</span>
                </div>
            </div>

            <div className="control-group">
                <button
                    className={`btn-primary ${!isPaused ? 'active' : ''}`}
                    onClick={handlePlayPause}
                    aria-label={isPaused ? 'Play simulation' : 'Pause simulation'}
                    aria-pressed={!isPaused}
                    tabIndex={0}
                >
                    {isPaused ? '▶ Play' : '⏸ Pause'}
                </button>
                <button 
                    className="btn-secondary" 
                    onClick={handleReset}
                    aria-label="Reset simulation"
                    tabIndex={0}
                >
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
                            aria-label={`Set simulation speed to ${speed}x`}
                            aria-pressed={speedMultiplier === speed}
                            role="radio"
                            tabIndex={0}
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
                        aria-label="Switch to 2D map view"
                        aria-pressed={renderMode === '2D'}
                        role="radio"
                        tabIndex={0}
                    >
                        2D Map
                    </button>
                    <button
                        className={`btn-toggle ${renderMode === '3D' ? 'active' : ''}`}
                        onClick={() => setRenderMode('3D')}
                        aria-label="Switch to 3D orbit view"
                        aria-pressed={renderMode === '3D'}
                        role="radio"
                        tabIndex={0}
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
                        aria-label="Toggle pheromone heatmap overlay"
                        aria-checked={showPheromones}
                        tabIndex={0}
                    />
                    Pheromone Heatmap
                </label>
            </div>
        </div>
    );
};
