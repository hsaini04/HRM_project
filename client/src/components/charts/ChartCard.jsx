import { ChartColumn, Table2 } from 'lucide-react';
import { useState } from 'react';
import { prefersReducedMotion } from '../../animations/index.js';
import { Card, CardHeader } from '../ui/Card.jsx';

// Chart chrome tokens (validated palette; text never wears a series colour). The CSS variables
// switch with the light/dark theme, so charts follow it without re-rendering.
export const CHART = {
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  tick: 'var(--chart-tick)',
  label: 'var(--chart-label)',
  cursor: 'var(--chart-cursor)',
  surface: 'var(--chart-surface)',
  series: '#2a78d6',
  seriesSoft: '#86b6ef',
  font: 12,
};

export const chartAnimation = () => !prefersReducedMotion();

export const axisProps = {
  // Recharts measures tick labels with `style` when deciding where to wrap; without the font size there
  // it measures at 16px and breaks labels that actually fit.
  tick: { fill: CHART.tick, fontSize: CHART.font, style: { fontSize: CHART.font } },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
};

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Recharts tooltip content: primary ink for values, a swatch carries series identity. */
export function ChartTooltip({ active, payload, label, valueFormatter = (value) => value, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      {label !== undefined && <p className="mb-1.5 font-semibold text-slate-900">{labelFormatter ? labelFormatter(label, payload) : label}</p>}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey || entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="size-2 rounded-[2px]" style={{ background: entry.payload?.fill || entry.color }} aria-hidden="true" />
              {entry.name}
            </span>
            <span className="tabular font-medium text-slate-900">{valueFormatter(entry.value, entry)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Card wrapper for every chart: title, legend, and a Chart/Table toggle so each chart has an
 * accessible table view with the exact values it plots.
 */
export function ChartCard({ title, subtitle, legend, table, height = 260, children, className = '', footer }) {
  const [view, setView] = useState('chart');
  return (
    <Card data-reveal className={`flex flex-col ${className}`}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          table && (
            <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label={`${title} view`}>
              {[
                { value: 'chart', icon: ChartColumn, label: 'Chart view' },
                { value: 'table', icon: Table2, label: 'Table view' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  aria-pressed={view === option.value}
                  aria-label={option.label}
                  title={option.label}
                  className={`grid size-7 place-items-center rounded-md transition-colors ${
                    view === option.value ? 'bg-raised text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <option.icon className="size-4" />
                </button>
              ))}
            </div>
          )
        }
      />
      <div className="flex flex-1 flex-col gap-3 px-5 pt-4 pb-5">
        {view === 'chart' ? (
          <>
            {legend && <Legend items={legend} />}
            <div style={{ height }} className="w-full min-w-0">
              {children}
            </div>
          </>
        ) : (
          <div className="scrollbar-thin overflow-auto" style={{ maxHeight: height + 40 }}>
            <table className="w-full text-sm">
              <thead className="table-head sticky top-0">
                <tr>
                  {table.columns.map((column) => (
                    <th key={column.key} className={`px-3 py-2 ${column.align === 'right' ? 'text-right' : ''}`}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.rows.map((row, index) => (
                  <tr key={index}>
                    {table.columns.map((column) => (
                      <td key={column.key} className={`px-3 py-2 text-slate-700 ${column.align === 'right' ? 'tabular text-right' : ''}`}>
                        {column.format ? column.format(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {footer}
      </div>
    </Card>
  );
}
