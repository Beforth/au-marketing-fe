import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import * as RT from '@radix-ui/react-tooltip';

const roles = [
  { id: 1, name: 'Trainee', role_type: 'employee', level: 1, permission_count: 4, is_system_role: false, description: '' },
  { id: 2, name: 'Super Admin', role_type: 'admin', level: 5, permission_count: 48, is_system_role: true, description: 'Everything.' },
  { id: 3, name: 'Region Head', role_type: 'manager', level: 3, permission_count: 24, is_system_role: true, description: 'Leads a region.' },
];
vi.mock('../../lib/hrms-rbac', async (orig) => ({
  ...(await orig<typeof import('../../lib/hrms-rbac')>()),
  hrmsRBACClient: { getMarketingRoles: vi.fn().mockResolvedValue(roles) },
}));

describe('Marketing Roles page', () => {
  it('groups roles by level, highest first, with a summary and level bars', async () => {
    const { RolesPage } = await import('../../pages/RolesPage');
    const store = configureStore({ reducer: { auth: () => ({ token: 't', user: {}, employee: null, roles: [], permissions: ['marketing.admin'] }) } });
    render(<Provider store={store}><RT.Provider><MemoryRouter><RolesPage /></MemoryRouter></RT.Provider></Provider>);
    await screen.findByText('Super Admin');
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['L5 · Admin', 'L3 · Manager', 'L1 · Entry']);
    expect(screen.getByText('System roles').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Custom roles').nextElementSibling).toHaveTextContent('1');
    expect(screen.getAllByRole('img', { name: /Level \d of 5/ })).toHaveLength(3);
    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});
