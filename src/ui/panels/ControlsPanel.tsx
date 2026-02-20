import { useUIStore } from '../store/uiStore';
import { simWorker } from '../../worker/simBridge';

export const ControlsPanel: React.FC = () => {
    const { isPaused, setPaused, simState } = useUIStore();

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

    return (
        <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px', borderRadius: '8px',
            fontFamily: 'monospace', width: '250px'
        }}>
            <h2>Colony Controls</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={handlePlayPause} style={{ flex: 1, padding: '8px' }}>
                    {isPaused ? 'Play' : 'Pause'}
                </button>
                <button onClick={handleReset} style={{ flex: 1, padding: '8px' }}>
                    Reset
                </button>
            </div>

            <div>
                <p>Tick: {simState?.tick || 0}</p>
                <p>Ants: {simState?.ants?.length || 0}</p>
                <p>Colony Food: {simState?.colonyFood || 0}</p>
            </div>
        </div>
    );
};
