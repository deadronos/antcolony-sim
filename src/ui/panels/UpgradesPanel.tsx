import { useUIStore } from '../store/uiStore';
import { simWorker } from '../../worker/simBridge';
import { UPGRADE_DEFS, getUpgradeCost } from '../../sim/core/upgrades';
import './ControlsPanel.css'; // Reusing the same glassmorphism baseline
import './UpgradesPanel.css';
import type { SimUpgrades } from '../../sim/core/types';

export const UpgradesPanel = () => {
    const { simState } = useUIStore();

    if (!simState) return null;

    const handlePurchase = async (upgradeId: keyof SimUpgrades) => {
        await simWorker.purchaseUpgrade(upgradeId);
    };

    const upgrades = Object.values(UPGRADE_DEFS).map(def => {
        const id = def.id as keyof SimUpgrades;
        const currentLevel = simState.upgrades[id];
        const cost = getUpgradeCost(def, currentLevel);
        const isMaxLevel = currentLevel >= def.maxLevel;
        const canAfford = simState.colonyFood >= cost;

        return (
            <div key={def.id} className="upgrade-card">
                <div className="upgrade-header">
                    <h4>{def.name}</h4>
                    <span className="level-badge">Lv. {currentLevel} / {def.maxLevel}</span>
                </div>
                <p className="upgrade-desc">{def.description}</p>
                <button
                    className={`btn-purchase ${isMaxLevel ? 'maxed' : canAfford ? 'affordable' : 'locked'}`}
                    disabled={isMaxLevel || !canAfford}
                    onClick={() => handlePurchase(id)}
                >
                    {isMaxLevel ? 'MAX LEVEL' : `Buy - ${cost} Food`}
                </button>
            </div>
        );
    });

    return (
        <div className="controls-panel upgrades-panel">
            <h2 className="panel-title">Evolution Lab</h2>
            <div className="upgrades-list">
                {upgrades}
            </div>
        </div>
    );
};
