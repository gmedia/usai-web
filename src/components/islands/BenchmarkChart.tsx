import { useId, useMemo, useState } from 'react';
import {
  classIds,
  classRoutes,
  concurrencies,
  runtimeLabels,
  throughput,
  type ClassId,
  type Conc,
  type Runtime,
} from '../../data/benchmarks';

type Labels = {
  classLabel: string;
  concLabel: string;
  unit: string;
  tableToggle: string;
  runtime: string;
  ahead: string;
  behind: string;
  laravelOnly: string;
  insight: Record<ClassId, string>;
};

type Props = {
  lang: 'en' | 'id';
  labels: Labels;
  classNames: Record<ClassId, { name: string; body: string }>;
  initialClass?: ClassId;
  initialConc?: Conc;
};

export default function BenchmarkChart({ lang, labels, classNames, initialClass = 'C', initialConc = 64 }: Props) {
  const [cls, setCls] = useState<ClassId>(initialClass);
  const [conc, setConc] = useState<Conc>(initialConc);
  const [showTable, setShowTable] = useState(false);
  const fmt = useMemo(() => new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US'), [lang]);
  const uid = useId();

  const rows = useMemo(() => {
    const row = throughput[cls][conc];
    return (Object.entries(row) as [Runtime, number][]).sort((a, b) => b[1] - a[1]);
  }, [cls, conc]);
  const max = rows[0]?.[1] ?? 1;
  const usai = throughput[cls][conc].usai ?? 0;
  const node = throughput[cls][conc].node ?? 0;
  const ahead = usai >= node;
  const delta = node ? Math.round(((usai - node) / node) * 100) : 0;

  return (
    <div className="card p-5 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <fieldset className="flex-1">
          <legend className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-dim">{labels.classLabel}</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {classIds.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={cls === id}
                onClick={() => setCls(id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${cls === id ? 'border-mint/50 bg-mint/10 text-paper' : 'border-line text-muted hover:text-paper'}`}
              >
                <span className="font-mono text-xs text-mint">{id}</span> {classNames[id].name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="shrink-0">
          <legend className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-dim">{labels.concLabel}</legend>
          <div className="mt-2 inline-flex rounded-lg border border-line p-0.5">
            {concurrencies.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={conc === c}
                onClick={() => setConc(c)}
                className={`whitespace-nowrap rounded-md px-3 py-1 font-mono text-sm transition-colors ${conc === c ? 'bg-white/10 text-paper' : 'text-muted hover:text-paper'}`}
              >
                c = {c}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-heading text-lg font-semibold text-paper">
          {cls} · {classNames[cls].name}
        </p>
        <p className="font-mono text-xs text-dim">{classRoutes[cls]}</p>
        <p className={`ml-auto rounded-full px-2.5 py-0.5 font-mono text-xs ${ahead ? 'bg-mint/10 text-mint' : 'bg-caution/10 text-caution'}`}>
          {ahead ? labels.ahead : labels.behind} ({delta > 0 ? '+' : ''}
          {delta} %)
        </p>
      </div>

      <ul className="mt-5 space-y-2.5" aria-label={`${classNames[cls].name}, c = ${conc}, ${labels.unit}`}>
        {rows.map(([rt, v]) => {
          const isUsai = rt === 'usai';
          return (
            <li key={rt} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 sm:grid-cols-[10rem_1fr]">
              <span className={`truncate text-xs sm:text-sm ${isUsai ? 'font-semibold text-mint' : 'text-muted'}`}>{runtimeLabels[rt]}</span>
              <div className="relative flex h-7 items-center">
                <div
                  className={`h-full rounded-md transition-[width] duration-700 ease-out ${isUsai ? 'bg-gradient-to-r from-teal to-mint shadow-[0_0_20px_rgba(45,212,191,0.35)]' : 'bg-white/[0.09]'}`}
                  style={{ width: `${Math.max(1.5, (v / max) * 100)}%` }}
                />
                <span className={`ml-2 shrink-0 font-mono text-xs tabular-nums ${isUsai ? 'text-paper' : 'text-dim'}`}>{fmt.format(v)}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-sm leading-relaxed text-muted">{labels.insight[cls]}</p>
      {conc !== 64 && <p className="mt-1 text-xs text-dim">{labels.laravelOnly}</p>}

      <div className="mt-5 border-t border-line pt-4">
        <button
          type="button"
          className="text-xs text-muted underline decoration-dotted underline-offset-4 hover:text-paper"
          aria-expanded={showTable}
          aria-controls={`${uid}-table`}
          onClick={() => setShowTable((s) => !s)}
        >
          {labels.tableToggle}
        </button>
        {showTable && (
          <div id={`${uid}-table`} className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">
                {classNames[cls].name} — {labels.unit}
              </caption>
              <thead>
                <tr className="border-b border-line font-mono text-[0.65rem] uppercase tracking-[0.14em] text-dim">
                  <th scope="col" className="py-2 pr-4 font-normal">
                    {labels.runtime}
                  </th>
                  {concurrencies.map((c) => (
                    <th key={c} scope="col" className="py-2 pr-4 text-right font-normal">
                      c = {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(runtimeLabels) as Runtime[]).map((rt) => (
                  <tr key={rt} className="border-b border-line/60">
                    <th scope="row" className={`py-2 pr-4 font-normal ${rt === 'usai' ? 'text-mint' : 'text-muted'}`}>
                      {runtimeLabels[rt]}
                    </th>
                    {concurrencies.map((c) => {
                      const v = throughput[cls][c][rt];
                      return (
                        <td key={c} className="py-2 pr-4 text-right font-mono tabular-nums text-fog/90">
                          {v === undefined ? '—' : fmt.format(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
