import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

export default function EmptyState({ onOpenDrawer }) {
  return (
    <div class="hairline-border bg-vault-card/50 p-12 text-center max-w-lg mx-auto my-12 relative overflow-hidden">
      {/* Visual neon corner accents */}
      <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-vault-lime"></div>
      <div class="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-vault-lime"></div>
      <div class="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-vault-lime"></div>
      <div class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-vault-lime"></div>

      <div class="mx-auto w-12 h-12 bg-vault-lime/5 rounded-full flex items-center justify-center mb-6">
        <Sparkles class="w-6 h-6 text-vault-lime animate-pulse" />
      </div>

      <h3 class="text-xl font-bold font-sans text-vault-primary tracking-wide uppercase mb-3">
        VAULT IS VACANT
      </h3>
      
      <p class="text-sm font-mono text-vault-muted leading-relaxed max-w-sm mx-auto mb-8 uppercase">
        YOU HAVE NOT ARCHIVED ANY ACCESSORIES YET. KICKSTART YOUR PREMIUM INVENTORY NOW.
      </p>

      <button
        onClick={onOpenDrawer}
        class="inline-flex items-center gap-2 bg-vault-lime hover:bg-white text-vault-bg font-sans font-black text-xs uppercase px-6 py-4 tracking-widest transition-all shadow-glow-lime/10 hover:shadow-glow-lime/25"
      >
        <Plus class="w-4 h-4" />
        LOG FIRST ITEM
      </button>
    </div>
  );
}
