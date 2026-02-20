import * as Comlink from 'comlink';
import type { SimAPI } from './simWorker';

// Initialize the worker module
const worker = new Worker(new URL('./simWorker.ts', import.meta.url), {
    type: 'module'
});

// Create Comlink proxy
export const simWorker = Comlink.wrap<SimAPI>(worker);
