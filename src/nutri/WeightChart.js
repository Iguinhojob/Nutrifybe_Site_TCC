import React from 'react';
import { fmtDay, fmtNum } from '../ui/format';

/** Gráfico de linha simples da evolução do peso. Os mesmos dados aparecem na tabela abaixo dele. */
export default function WeightChart({ points, goal }) {
  if (!points || points.length < 2) return null;
  const W = 900; const H = 280;
  const pad = { l: 48, r: 16, t: 30, b: 30 };
  const times = points.map((p) => new Date(`${p.day}T12:00:00`).getTime());
  const values = points.map((p) => p.value);
  const all = goal ? [...values, goal] : values;
  let min = Math.min(...all); let max = Math.max(...all);
  const span = Math.max(max - min, 2);
  min -= span * 0.15; max += span * 0.15;
  const t0 = Math.min(...times); const t1 = Math.max(...times);
  const x = (t) => pad.l + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const ticks = Array.from({ length: 4 }, (_, i) => min + ((max - min) * i) / 3);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const first = points[0]; const last = points[points.length - 1];
  const label = `Peso de ${fmtNum(first.value, 1)} kg em ${fmtDay(first.day, { day: 'numeric', month: 'short' })} para ${fmtNum(last.value, 1)} kg em ${fmtDay(last.day, { day: 'numeric', month: 'short' })}${goal ? `; meta de ${fmtNum(goal, 1)} kg` : ''}.`;

  return (
    <svg className="nf-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end">{fmtNum(t, 0)}</text>
        </g>
      ))}
      {goal && (
        <g>
          <line className="goal" x1={pad.l} x2={W - pad.r} y1={y(goal)} y2={y(goal)} />
          <text className="goal-label" x={W - pad.r} y={y(goal) - 6} textAnchor="end">Meta {fmtNum(goal, 1)} kg</text>
        </g>
      )}
      <path className="line" d={path} />
      {points.map((p, i) => <circle key={`${p.day}-${i}`} className="dot" cx={x(times[i])} cy={y(p.value)} r={4} />)}
      <text x={x(times[0])} y={H - 8} textAnchor="start">{fmtDay(first.day, { day: '2-digit', month: '2-digit' })}</text>
      <text x={x(times[times.length - 1])} y={H - 8} textAnchor="end">{fmtDay(last.day, { day: '2-digit', month: '2-digit' })}</text>
      <text x={pad.l - 8} y={12} textAnchor="end">kg</text>
    </svg>
  );
}
