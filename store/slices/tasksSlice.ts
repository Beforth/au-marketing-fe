import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { marketingAPI, TaskItem } from '../../lib/marketing-api';

interface TasksState {
  items: TaskItem[];
  isLoading: boolean;
}

const initialState: TasksState = {
  items: [],
  isLoading: false,
};

export const fetchTodayTasks = createAsyncThunk('tasks/fetchTodayTasks', async () => {
  return marketingAPI.getTodayTasks();
});

export const addManualTask = createAsyncThunk(
  'tasks/addManualTask',
  async (payload: { title: string; description?: string }) => {
    return marketingAPI.createManualTask(payload);
  }
);

export const completeTaskById = createAsyncThunk(
  'tasks/completeTaskById',
  async (taskId: number) => {
    const response = await marketingAPI.completeTask(taskId);
    return { taskId, completedAt: response.completed_at };
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTodayTasks.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchTodayTasks.rejected, (state) => {
        state.items = [];
        state.isLoading = false;
      })
      .addCase(addManualTask.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(completeTaskById.fulfilled, (state, action) => {
        state.items = state.items.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, completed_at: action.payload.completedAt || new Date().toISOString() }
            : task
        );
      });
  },
});

export const selectTodayTasks = (state: { tasks: TasksState }) => state.tasks.items;
export const selectTasksLoading = (state: { tasks: TasksState }) => state.tasks.isLoading;

export default tasksSlice.reducer;
