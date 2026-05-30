import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle } from 'lucide-react';

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"; // chic dark luxury 3D render

export default function ItemCard({ item }) {
  const { _id, name, brand, category, coverImageUrl, status, returnDate, isOverdue } = item;

  // Format status badge styles
  const getStatusStyles = () => {
    if (isOverdue) {
      return {
        text: 'OVERDUE',
        bgClass: 'bg-vault-red/10 border-vault-red text-vault-red shadow-glow-red/10 animate-pulse',
      };
    }
    
    switch (status) {
      case 'IN_CLOSET':
        return {
          text: 'IN CLOSET',
          bgClass: 'bg-vault-lime/10 border-vault-lime text-vault-lime shadow-glow-lime/5',
        };
      case 'ON_LOAN':
        return {
          text: 'ON LOAN',
          bgClass: 'bg-neutral-900 border-neutral-700 text-vault-primary',
        };
      case 'SENT_TO_STYLIST':
        return {
          text: 'WITH STYLIST',
          bgClass: 'bg-neutral-900 border-neutral-700 text-vault-primary',
        };
      case 'AT_PR':
        return {
          text: 'AT PR',
          bgClass: 'bg-neutral-900 border-neutral-700 text-vault-primary',
        };
      case 'MISSING':
        return {
          text: 'MISSING // LOCKED',
          bgClass: 'bg-neutral-950 border-neutral-800 text-vault-muted border-dashed',
        };
      default:
        return {
          text: status,
          bgClass: 'bg-neutral-900 border-neutral-800 text-vault-primary',
        };
    }
  };

  const statusStyle = getStatusStyles();

  // Helper to format ISO date to readable monospace date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  };

  return (
    <Link
      to={`/items/${_id}`}
      class="group bg-vault-card border border-neutral-900 flex flex-col justify-between overflow-hidden glow-card h-full"
    >
      <div class="relative aspect-[4/5] overflow-hidden bg-neutral-950">
        {/* Cover Image */}
        <img
          src={coverImageUrl || PLACEHOLDER_IMG}
          alt={name}
          loading="lazy"
          class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
        />

        {/* Subtle Category Tag Overlay */}
        <div class="absolute top-3 left-3 bg-[#0A0A0A]/80 backdrop-blur-md border border-neutral-800 px-3 py-1 font-mono text-[9px] text-vault-primary tracking-widest uppercase">
          {category}
        </div>

        {/* Dynamic Status Badge */}
        <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div class={`border px-3 py-1 font-mono text-[9px] font-bold tracking-widest uppercase ${statusStyle.bgClass}`}>
            {statusStyle.text}
          </div>
          
          {isOverdue && (
            <div class="bg-vault-red text-white p-1 rounded-full animate-bounce shadow-lg shadow-vault-red/50">
              <AlertCircle class="w-4 h-4" />
            </div>
          )}
        </div>
        
        {/* Hover overlay detail */}
        <div class="absolute inset-0 bg-vault-bg/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span class="font-mono text-xs text-vault-lime border border-vault-lime px-4 py-2 bg-vault-bg/90 tracking-widest uppercase">
            VIEW PIECE //
          </span>
        </div>
      </div>

      {/* Info strip */}
      <div class="p-5 flex flex-col gap-2 relative">
        {/* Top line decoration */}
        <div class="absolute top-0 left-5 right-5 h-[1px] bg-neutral-900"></div>

        <div class="flex flex-col">
          <span class="font-mono text-[10px] text-vault-muted uppercase tracking-wider">
            {brand || 'UNKNOWN BRAND'}
          </span>
          <h4 class="font-sans text-base font-bold text-vault-primary tracking-tight truncate group-hover:text-vault-lime transition-colors">
            {name}
          </h4>
        </div>

        {/* Monospace return date helper if loaning */}
        {['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(status) && returnDate && (
          <div class="flex items-center gap-1.5 mt-2 font-mono text-[10px]">
            <Calendar class="w-3.5 h-3.5 text-vault-muted" />
            <span class="text-vault-muted uppercase">RETURN:</span>
            <span class={isOverdue ? 'text-vault-red font-bold' : 'text-vault-primary'}>
              {formatDate(returnDate)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
