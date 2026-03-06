/**
 * Organization plants cache – keep plants by organization id so creating/editing
 * a plant doesn’t require a full refetch and state is preserved (e.g. no reload).
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Plant } from '../../lib/marketing-api';

export interface OrganizationPlantsState {
  /** organizationId -> list of plants */
  plantsByOrganizationId: Record<number, Plant[]>;
}

const initialState: OrganizationPlantsState = {
  plantsByOrganizationId: {},
};

const organizationPlantsSlice = createSlice({
  name: 'organizationPlants',
  initialState,
  reducers: {
    setOrganizationPlants: (state, action: PayloadAction<{ organizationId: number; plants: Plant[] }>) => {
      const { organizationId, plants } = action.payload;
      state.plantsByOrganizationId[organizationId] = plants;
    },
    addOrganizationPlant: (state, action: PayloadAction<{ organizationId: number; plant: Plant }>) => {
      const { organizationId, plant } = action.payload;
      const list = state.plantsByOrganizationId[organizationId] ?? [];
      if (!list.some((p) => p.id === plant.id)) {
        state.plantsByOrganizationId[organizationId] = [...list, plant];
      }
    },
    updateOrganizationPlant: (state, action: PayloadAction<{ organizationId: number; plant: Plant }>) => {
      const { organizationId, plant } = action.payload;
      const list = state.plantsByOrganizationId[organizationId] ?? [];
      state.plantsByOrganizationId[organizationId] = list.map((p) => (p.id === plant.id ? plant : p));
    },
    removeOrganizationPlant: (state, action: PayloadAction<{ organizationId: number; plantId: number }>) => {
      const { organizationId, plantId } = action.payload;
      const list = state.plantsByOrganizationId[organizationId] ?? [];
      state.plantsByOrganizationId[organizationId] = list.filter((p) => p.id !== plantId);
    },
  },
});

export const {
  setOrganizationPlants,
  addOrganizationPlant,
  updateOrganizationPlant,
  removeOrganizationPlant,
} = organizationPlantsSlice.actions;

/** Select plants for an organization (returns [] if id is null/undefined or not in cache). */
export function selectPlantsForOrganization(organizationId: string | undefined) {
  return (state: { organizationPlants: OrganizationPlantsState }) => {
    if (organizationId == null) return [];
    const id = parseInt(organizationId, 10);
    if (Number.isNaN(id)) return [];
    return state.organizationPlants.plantsByOrganizationId[id] ?? [];
  };
}

export default organizationPlantsSlice.reducer;
