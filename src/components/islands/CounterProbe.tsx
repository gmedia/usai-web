import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The correctness probe from docs/measurements/2026-09-23-sweep.md, made
 * interactive. One module-level counter, asked for by successive requests:
 *   one Node process  -> 1 2 3 …
 *   node:cluster ×8   -> round-robin over eight counters (1 1 1 1 1 1 1 1 2 2)
 *   Usai              -> a fresh world every time (1 1 1 …)
 */

type Labels = {
  send: string;
  sendTen: string;
  reset: string;
  lanes: Record<'node' | 'cluster' | 'usai', { name: string; hint: string }>;
  responses: string;
  worker: string;
  worldBorn: string;
  worldEnded: string;
  idle: string;
};

const WORKERS = 8;
const MAX_HISTORY = 20;

export default function CounterProbe({ labels }: { labels: Labels }) {
  const [node, setNode] = useState<number[]>([]);
  const [cluster, setCluster] = useState<{ value: number; worker: number }[]>([]);
  const [usai, setUsai] = useState<number[]>([]);
  const [workerCounters, setWorkerCounters] = useState<number[]>(() => Array(WORKERS).fill(0));
  const [pulse, setPulse] = useState(0);
  const [worldState, setWorldState] = useState<'idle' | 'born' | 'ended'>('idle');
  const counters = useRef({ node: 0, cluster: Array(WORKERS).fill(0) as number[], rr: 0 });
  const timers = useRef<number[]>([]);
  const [live, setLive] = useState('');

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const sendOne = useCallback(() => {
    const c = counters.current;
    c.node += 1;
    const w = c.rr % WORKERS;
    c.rr += 1;
    c.cluster[w] += 1;
    const nodeValue = c.node;
    const clusterValue = c.cluster[w];

    setNode((h) => [...h, nodeValue].slice(-MAX_HISTORY));
    setCluster((h) => [...h, { value: clusterValue, worker: w + 1 }].slice(-MAX_HISTORY));
    setUsai((h) => [...h, 1].slice(-MAX_HISTORY));
    setWorkerCounters([...c.cluster]);
    setPulse((p) => p + 1);
    setWorldState('born');
    timers.current.push(window.setTimeout(() => setWorldState('ended'), 420));
    setLive(`Node ${nodeValue}, cluster ${clusterValue}, Usai 1`);
  }, []);

  const sendTen = useCallback(() => {
    clearTimers();
    for (let i = 0; i < 10; i++) timers.current.push(window.setTimeout(sendOne, i * 140));
  }, [sendOne]);

  const reset = useCallback(() => {
    clearTimers();
    counters.current = { node: 0, cluster: Array(WORKERS).fill(0), rr: 0 };
    setNode([]);
    setCluster([]);
    setUsai([]);
    setWorkerCounters(Array(WORKERS).fill(0));
    setWorldState('idle');
    setLive('');
  }, []);

  const empty = node.length === 0;

  return (
    <div className="probe card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-4 sm:p-5">
        <button type="button" className="btn btn-primary" onClick={sendOne}>
          {labels.send}
        </button>
        <button type="button" className="btn btn-ghost" onClick={sendTen}>
          {labels.sendTen}
        </button>
        <button type="button" className="btn ml-auto px-3 text-sm text-muted hover:text-paper" onClick={reset} disabled={empty}>
          {labels.reset}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {live}
      </p>

      <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        <Lane name={labels.lanes.node.name} hint={labels.lanes.node.hint} tone="leak" current={node.at(-1)} history={node.map(String)} pulse={pulse} empty={empty} idle={labels.idle} responses={labels.responses}>
          <div className="mt-4 flex items-center gap-2" aria-hidden="true">
            <Memory active={!empty} label="1 process" />
          </div>
        </Lane>

        <Lane name={labels.lanes.cluster.name} hint={labels.lanes.cluster.hint} tone="uneven" current={cluster.at(-1)?.value} history={cluster.map((c) => String(c.value))} pulse={pulse} empty={empty} idle={labels.idle} responses={labels.responses} sub={cluster.at(-1) ? `${labels.worker} ${cluster.at(-1)!.worker}` : undefined}>
          <div className="mt-4 grid grid-cols-8 gap-1" aria-hidden="true">
            {workerCounters.map((v, i) => (
              <div key={i} className={`flex h-8 items-center justify-center rounded-md border font-mono text-[0.7rem] transition-colors duration-300 ${cluster.at(-1)?.worker === i + 1 ? 'border-caution/60 bg-caution/15 text-caution' : 'border-line bg-white/[0.02] text-dim'}`}>
                {v}
              </div>
            ))}
          </div>
        </Lane>

        <Lane name={labels.lanes.usai.name} hint={labels.lanes.usai.hint} tone="fresh" current={usai.at(-1)} history={usai.map(String)} pulse={pulse} empty={empty} idle={labels.idle} responses={labels.responses}>
          <div className="mt-4 flex h-8 items-center gap-3" aria-hidden="true">
            <span className={`world-dot ${worldState}`} />
            <span className="font-mono text-xs text-dim">
              {worldState === 'born' ? labels.worldBorn : worldState === 'ended' ? labels.worldEnded : '—'}
            </span>
          </div>
        </Lane>
      </div>
    </div>
  );
}

function Lane(props: {
  name: string;
  hint: string;
  tone: 'leak' | 'uneven' | 'fresh';
  current?: number;
  history: string[];
  pulse: number;
  empty: boolean;
  idle: string;
  responses: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  const color = props.tone === 'fresh' ? 'text-mint' : props.tone === 'uneven' ? 'text-caution' : 'text-fog';
  return (
    <div className="flex flex-col p-5 sm:p-6">
      <h3 className="font-heading text-base font-semibold text-paper">{props.name}</h3>
      <p className="mt-1 min-h-[2.5rem] text-sm text-muted">{props.hint}</p>
      <div className="mt-4 flex items-baseline gap-3">
        <span key={props.pulse} className={`counter-pop font-heading text-6xl font-extrabold tabular-nums ${color}`}>
          {props.current ?? 0}
        </span>
        {props.sub && <span className="font-mono text-xs text-dim">{props.sub}</span>}
      </div>
      {props.children}
      <div className="mt-5">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-dim">{props.responses}</p>
        <p className={`mt-1.5 min-h-[1.5rem] break-words font-mono text-sm ${props.empty ? 'text-dim' : color}`}>
          {props.empty ? <span className="text-xs">{props.idle}</span> : props.history.join(' ')}
        </p>
      </div>
    </div>
  );
}

function Memory({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`flex h-8 flex-1 items-center gap-2 rounded-md border px-3 font-mono text-[0.7rem] transition-colors ${active ? 'border-fog/25 bg-white/[0.04] text-muted' : 'border-line text-dim'}`}>
      <span className="size-1.5 rounded-full bg-fog/60" />
      {label}
    </div>
  );
}
