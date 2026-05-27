import * as apiService from './machinesApiService';
import * as localStorageService from './machinesLocalStorageService';

const VALID_MODES = ['api', 'demo'];
const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'demo';

if (!VALID_MODES.includes(DATA_MODE)) {
  console.warn(
    `[machinesDataService] Modo inválido: "${DATA_MODE}". Use "api" ou "demo". Usando "demo" como fallback.`,
  );
}

const resolvedMode = VALID_MODES.includes(DATA_MODE) ? DATA_MODE : 'demo';
const service = resolvedMode === 'demo' ? localStorageService : apiService;

export const getActiveShiftSessionId = service.getActiveShiftSessionId;
export const insertMachine = service.insertMachine;
export const insertStop = service.insertStop;
export const updateStopResume = service.updateStopResume;
export const insertTest = service.insertTest;
export const getActiveShiftSession = service.getActiveShiftSession;
export const deactivateShiftSession = service.deactivateShiftSession;
export const startNewShiftSession = service.startNewShiftSession;
export const updateMachineRequest = service.updateMachineRequest;
export const deleteMachineRequest = service.deleteMachineRequest;
export const fetchMachines = service.fetchMachines;
