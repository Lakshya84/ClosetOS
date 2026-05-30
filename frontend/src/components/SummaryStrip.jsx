import React from 'react';
import { Layers, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';

export default function SummaryStrip({ total = 0, out = 0, overdue = 0, missing = 0 }) {
  const stats = [
    {
      label: 'TOTAL PIECES',
      count: total,
      icon: Layers,
      color: 'text-vault-primary',
      borderColor: 'border-neutral-900'
    },
    {
      label: 'OUT NOW',
      count: out,
      icon: RefreshCw,
      color: out > 0 ? 'text-vault-lime' : 'text-vault-muted',
      borderColor: out > 0 ? 'border-vault-lime/30' : 'border-neutral-900'
    },
    {
      label: 'OVERDUE',
      count: overdue,
      icon: AlertTriangle,
      color: overdue > 0 ? 'text-vault-red font-extrabold animate-pulse' : 'text-vault-muted',
      borderColor: overdue > 0 ? 'border-vault-red' : 'border-neutral-900',
      glow: overdue > 0 ? 'shadow-glow-red/20 bg-vault-red/5' : ''
    },
    {
      label: 'MISSING',
      count: missing,
      icon: HelpCircle,
      color: missing > 0 ? 'text-neutral-400' : 'text-vault-muted',
      borderColor: 'border-neutral-900'
    }
  ];

  return (
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            class={`bg-vault-card border p-6 flex flex-col justify-between min-h-[110px] relative transition-all ${stat.borderColor} ${stat.glow || ''}`}
          >
            {/* Subtle line decoration inside */}
            <div class="flex items-center justify-between w-full">
              <span class="text-[10px] font-mono text-vault-muted tracking-widest uppercase">
                {stat.label}
              </span>
              <Icon class={`w-4 h-4 ${stat.color}`} />
            </div>
            
            <div class="flex items-baseline justify-between mt-4">
              <span class={`text-3xl font-mono tracking-tighter font-black ${stat.color}`}>
                {stat.count.toString().padStart(2, '0')}
              </span>
              <span class="text-[9px] font-mono text-vault-muted">
                // ACTIVE
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
