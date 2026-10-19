import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import WorldMapPanel, { aggregateByCountry, countryFor } from '../../components/dashboard/WorldMapPanel';
import type { WorldMapRow } from '../../lib/marketing-api';

const NAMES = ['India', 'Germany', 'United Arab Emirates', 'United States of America', 'United Kingdom'];
const row = (o: Partial<WorldMapRow>): WorldMapRow => ({ domain_id: 1, domain_name: 'Export', is_export: true, region_id: 1, region_name: 'Germany', lead_count: 1, open_count: 1, won_count: 0, won_value: 0, pipeline_value: 0, ...o });

describe('world map country matching', () => {
  it('Domestic regions are all India; Export regions are matched by name or common spelling', () => {
    expect(countryFor({ is_export: false, region_name: 'South 1' }, NAMES)).toBe('India');
    expect(countryFor({ is_export: true, region_name: ' germany ' }, NAMES)).toBe('Germany');
    expect(countryFor({ is_export: true, region_name: 'UAE' }, NAMES)).toBe('United Arab Emirates');
    expect(countryFor({ is_export: true, region_name: 'USA' }, NAMES)).toBe('United States of America');
    expect(countryFor({ is_export: true, region_name: 'Middle East' }, NAMES)).toBeNull();
  });

  it('adds regions per country, keeps unplaced ones aside and follows the chosen measure', () => {
    const rows = [
      row({ region_name: 'South 1', is_export: false, domain_name: 'Domestic', lead_count: 3, won_count: 1, won_value: 500000, pipeline_value: 200000 }),
      row({ region_name: 'North 1', is_export: false, domain_name: 'Domestic', lead_count: 2, won_value: 100000 }),
      row({ region_name: 'Germany', lead_count: 4, won_value: 0, pipeline_value: 900000 }),
      row({ region_name: 'Middle East', lead_count: 5 }),
    ];
    const leads = aggregateByCountry(rows, 'leads', NAMES);
    expect(leads.countries.find((c) => c.id === 'India')?.value).toBe(5);
    expect(leads.countries.find((c) => c.id === 'Germany')?.value).toBe(4);
    expect(leads.unplaced).toEqual([{ name: 'Middle East', leads: 5 }]);
    const won = aggregateByCountry(rows, 'won', NAMES);
    expect(won.countries.map((c) => c.id)).toEqual(['India']); // Germany has no won value, so it is not shaded
    expect(won.countries[0].value).toBe(600000);
  });
});

describe('world map panel', () => {
  it('draws the map and lists the countries, with unplaced regions called out', () => {
    (globalThis as any).IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
    const { container } = render(
      <WorldMapPanel metric="leads" rows={[row({ region_name: 'Germany', lead_count: 4 }), row({ region_name: 'Middle East', lead_count: 2 })]} />
    );
    expect(container.querySelector('svg[aria-label^="Leads by country"]')).not.toBeNull();
    expect(screen.getAllByText(/Germany/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Not on the map.*Middle East \(2\)/)).toBeInTheDocument();
  });
});
