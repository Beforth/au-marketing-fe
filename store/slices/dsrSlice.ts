
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DSRTask } from '../../lib/hrms-rbac';

const DSR_STORAGE_KEY = 'dsr_tasks_cache';

export interface DSRState {
  tasks: DSRTask[];
  loadedAt: string | null;
  loading: boolean;
}

function loadFromStorage(): DSRState {
  try {
    const raw = localStorage.getItem(DSR_STORAGE_KEY);
    if (!raw) return { tasks: [], loadedAt: null, loading: false };
    const parsed = JSON.parse(raw);
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      loadedAt: typeof parsed.loadedAt === 'string' ? parsed.loadedAt : null,
      loading: false,
    };
  } catch {
    return { tasks: [], loadedAt: null, loading: false };
  }
}

function saveToStorage(state: DSRState) {
  try {
    localStorage.setItem(DSR_STORAGE_KEY, JSON.stringify({
      tasks: state.tasks,
      loadedAt: state.loadedAt,
    }));
  } catch {
    // storage full or unavailable
  }
}

const initialState: DSRState = loadFromStorage();

const dsrSlice = createSlice({
  name: 'dsr',
  initialState,
  reducers: {
    setDSRTasks: (state, action: PayloadAction<DSRTask[]>) => {
      state.tasks = action.payload;
      state.loadedAt = new Date().toISOString();
      state.loading = false;
      saveToStorage(state);
    },
    setDSRLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearDSR: (state) => {
      state.tasks = [];
      state.loadedAt = null;
      state.loading = false;
      localStorage.removeItem(DSR_STORAGE_KEY);
    },
  },
});

export const { setDSRTasks, setDSRLoading, clearDSR } = dsrSlice.actions;

export const selectDSRTasks = (state: { dsr: DSRState }) => state.dsr.tasks;
export const selectDSRLoadedAt = (state: { dsr: DSRState }) => state.dsr.loadedAt;
export const selectDSRLoading = (state: { dsr: DSRState }) => state.dsr.loading;

/**
 * Returns true if the cached DSR data is stale (>5 min) or absent.
 */
export const selectDSRIsStale = (state: { dsr: DSRState }) => {
  if (!state.dsr.loadedAt) return true;
  const age = Date.now() - new Date(state.dsr.loadedAt).getTime();
  return age > 5 * 60 * 1000;
};

export default dsrSlice.reducer;
