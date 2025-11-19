/**
 * Apex Strategy Monitor Backend (Node.js/JavaScript)
 * --------------------------------------------------
 * This script simulates the core logic of the Apex off-chain server.
 * It continuously monitors the performance of the simulated strategy fleet,
 * calculates the real-time aggregated Profit and Loss (PnL), and acts as the
 * trusted Oracle to trigger the Smart Contract failover if a critical loss threshold is hit.
 * 
 * NOTE: In a real-world scenario, this code would use web3/ethers.js to interact
 * with the Ethereum network and make authenticated RPC calls to the vault contract.
 */

// --- CONFIGURATION CONSTANTS ---
const MAX_SUB_STRATEGIES = 450;
const CRITICAL_LOSS_THRESHOLD_USD = -2000; // The threshold that triggers the failover.
const MONITORING_INTERVAL_MS = 1000;      // Check every second.

// --- SIMULATED SMART CONTRACT ORACLE ADDRESS ---
// The address the ApexAutonomousVault contract is initialized with.
const TRUSTED_ORACLE_ADDRESS = "0xApexBackendOracleAddress123";

// --- STATE MANAGEMENT ---
let strategyFleet = []; // Array to hold all 450 sub-strategy objects
let isFailoverTriggered = false;
let currentPnL = 0;
let monitoringLoop;

// --- UTILITY: SIMULATED WEB3/ETHEREUM INTERACTION ---

/**
 * @notice Simulates calling the triggerFailover function on the ApexAutonomousVault Smart Contract.
 * @param failingStrategyId The ID of the strategy that was active and failed.
 * @param newStrategyId The ID of the stable backup strategy to switch to.
 */
async function triggerSmartContractFailover(failingStrategyId, newStrategyId) {
    if (isFailoverTriggered) return;

    console.warn("--- CRITICAL EVENT DETECTED ---");
    console.warn(`[Failover] Critical PnL loss detected. Total Loss: ${currentPnL.toFixed(2)} USD.`);
    console.warn(`[API Call] Preparing authenticated transaction to vault...`);

    // Actual web3/ethers.js transaction call would go here
    // Example:
    // const tx = await vaultContract.triggerFailover(failingStrategyId, newStrategyId);
    // await tx.wait();
    
    isFailoverTriggered = true;
    console.log(`[SUCCESS] Smart Contract Failover triggered by Oracle. Vault State is now switched to Strategy ID: ${newStrategyId}`);
    console.log("---------------------------------");
    
    // Stop the monitoring loop once failover is triggered
    clearInterval(monitoringLoop); 
}


// --- CORE LOGIC: MONITORING AND DECISION ---

/**
 * @notice Initializes the simulated fleet of 450 strategies.
 */
function initStrategyFleet() {
    for (let i = 1; i <= MAX_SUB_STRATEGIES; i++) {
        strategyFleet.push({
            id: i,
            pnl: 0,
            volatility: (Math.random() * 0.05) + 0.01, // 1% to 6% volatility
            status: 'HEALTHY', // HEALTHY, WARNING, CRITICAL
            currentMultiplier: 1.0, 
            baseAllocation: 1000 // A conceptual base capital allocation
        });
    }
    console.log(`[Init] Initialized ${MAX_SUB_STRATEGIES} strategies.`);
}

/**
 * @notice Calculates the simulated real-time performance for the entire fleet.
 * @returns The total aggregated PnL for the fleet.
 */
function calculateStrategyPerformance() {
    let totalPnL = 0;
    let criticalCount = 0;

    for (const strategy of strategyFleet) {
        // Simple simulation of PnL change (random walk with volatility factor)
        const change = (Math.random() - 0.5) * strategy.volatility * strategy.baseAllocation * strategy.currentMultiplier;
        strategy.pnl += change;
        
        // Strategy performance degradation simulation (specifically for low IDs)
        if (strategy.id === 1 || strategy.id === 5) { 
             strategy.pnl -= Math.random() * 20; 
        }
        
        // Update status based on individual PnL
        if (strategy.pnl < -50) {
            strategy.status = 'CRITICAL';
            criticalCount++;
        } else if (strategy.pnl < -10) {
            strategy.status = 'WARNING';
        } else {
            strategy.status = 'HEALTHY';
        }

        totalPnL += strategy.pnl;
    }
    
    // Global multiplier adjustment (simulates market conditions)
    if (totalPnL < -500) {
        strategyFleet.forEach(s => s.currentMultiplier = 0.8); 
    } else {
        strategyFleet.forEach(s => s.currentMultiplier = 1.0);
    }

    console.log(`[Monitor] Total PnL: ${totalPnL.toFixed(2)} USD | Critical Strategies: ${criticalCount}`);
    
    return totalPnL;
}

/**
 * @notice Checks if the aggregated PnL loss has crossed the critical threshold.
 * @param currentPnL The total aggregated Profit and Loss.
 */
function checkForCriticalLoss(currentPnL) {
    if (currentPnL <= CRITICAL_LOSS_THRESHOLD_USD) {
        // Assuming Strategy 450 is the stable, pre-vetted backup
        triggerSmartContractFailover(1, 450); // Example: Failover from Strategy 1 to Strategy 450
    }
}

// --- MAIN EXECUTION LOOP ---

function startMonitoring() {
    console.log(`[System] Apex Backend Monitoring Service started at ${new Date().toISOString()}`);
    console.log(`[System] Critical Loss Threshold set to: ${CRITICAL_LOSS_THRESHOLD_USD} USD`);
    
    initStrategyFleet();

    // Set up the recurring monitoring loop
    monitoringLoop = setInterval(() => {
        if (!isFailoverTriggered) {
            currentPnL = calculateStrategyPerformance();
            checkForCriticalLoss(currentPnL);
        }
    }, MONITORING_INTERVAL_MS);
}

// Start the server process
startMonitoring();
