import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SummaryStrip from '../components/SummaryStrip';
import ItemCard from '../components/ItemCard';
import EmptyState from '../components/EmptyState';
import AddItemDrawer from '../components/AddItemDrawer';
import NotificationDrawer from '../components/NotificationDrawer';
import { LogOut, Plus, Filter, RefreshCw, AlertCircle, Bell } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const notifs = await res.json();
        const unread = notifs.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/items');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to retrieve archive items.');
      }
      setItems(data);
      // Fetch unread count after fetching items to pick up any new overdue alerts
      await fetchUnreadCount();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items locally (super fast)
  const filteredItems = items.filter(item => {
    const categoryMatch = selectedCategory === 'ALL' || item.category.toUpperCase() === selectedCategory;
    
    // Status filter formatting helper
    let statusMatch = true;
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'OVERDUE') {
        statusMatch = item.isOverdue;
      } else if (selectedStatus === 'OUT') {
        statusMatch = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(item.status);
      } else {
        statusMatch = item.status === selectedStatus;
      }
    }
    
    return categoryMatch && statusMatch;
  });

  // Calculate stats for Summary Strip
  const total = items.length;
  const out = items.filter(i => ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(i.status)).length;
  const overdueItems = items.filter(i => i.isOverdue);
  const overdueCount = overdueItems.length;
  const missing = items.filter(i => i.status === 'MISSING').length;

  return (
    <div class="min-h-screen bg-vault-bg font-sans pb-24 relative overflow-x-hidden">
      {/* Background grids */}
      <div class="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 pointer-events-none opacity-[0.02]">
        <div class="border-r border-vault-primary"></div>
        <div class="border-r border-vault-primary"></div>
        <div class="border-r border-vault-primary"></div>
        <div></div>
      </div>

      {/* Header bar */}
      <header class="border-b border-neutral-900 sticky top-0 bg-vault-bg/85 backdrop-blur-md z-40">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-baseline gap-2">
            <span class="font-mono text-xl font-bold tracking-widest text-vault-lime">ClosetOS</span>
            <span class="text-[9px] font-mono text-vault-muted hidden sm:inline">// ACCESSORY ARCHIVE</span>
          </div>

          <div class="flex items-center gap-6">
            {/* Notification Bell Icon */}
            <button
              onClick={() => setNotifOpen(true)}
              class="relative hairline-border hover:border-vault-lime text-vault-muted hover:text-vault-lime p-2.5 transition-all flex items-center justify-center"
              title="SYSTEM LOGS"
            >
              <Bell class="w-4 h-4" />
              {unreadCount > 0 && (
                <span class="absolute -top-1 -right-1 bg-vault-red text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-vault-bg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <div class="text-right hidden sm:block">
              <span class="block text-xs font-mono text-vault-muted uppercase">CREATOR IN SESSION:</span>
              <span class="block text-xs font-bold text-vault-primary uppercase font-mono">{user?.displayName}</span>
            </div>
            
            <button
              onClick={logout}
              class="hairline-border hover:border-vault-red text-vault-muted hover:text-vault-red p-2.5 transition-all flex items-center justify-center gap-2 group"
            >
              <LogOut class="w-4 h-4" />
              <span class="text-[9px] font-mono tracking-widest uppercase hidden md:inline group-hover:text-vault-red">
                LOGOUT
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard content container */}
      <main class="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Page Title & Refresh */}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 class="text-3xl sm:text-4xl font-black text-vault-primary uppercase tracking-tight">
              ARCHIVE STORAGE
            </h1>
            <p class="text-xs font-mono text-vault-muted uppercase mt-1">
              STATUS OVERVIEW AND REAL-TIME CUSTODY TRACKING
            </p>
          </div>
          
          <button
            onClick={fetchItems}
            disabled={loading}
            class="hairline-border border-neutral-800 hover:border-vault-lime text-vault-muted hover:text-vault-lime px-4 py-2 text-xs font-mono flex items-center gap-2 transition-all uppercase"
          >
            <RefreshCw class={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            REFRESH CACHE
          </button>
        </div>

        {/* Display Summary Statistics */}
        <SummaryStrip total={total} out={out} overdue={overdueCount} missing={missing} />

        {/* Overdue Tray (only appears if overdue items exist) */}
        {overdueCount > 0 && (
          <div class="mb-10 border border-vault-red bg-vault-red/5 p-6 relative overflow-hidden shadow-glow-red/5">
            {/* Top red accent */}
            <div class="absolute top-0 left-0 right-0 h-[2px] bg-vault-red animate-pulse"></div>
            
            <div class="flex items-center gap-2 mb-4">
              <AlertCircle class="w-5 h-5 text-vault-red animate-bounce" />
              <h2 class="text-sm font-black font-sans text-vault-red tracking-widest uppercase">
                OVERDUE CUSTODY DETECTED ({overdueCount.toString().padStart(2, '0')})
              </h2>
            </div>
            
            {/* Overdue Items Horizontal Scroll Grid */}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {overdueItems.map(item => (
                <div key={item._id} class="border border-vault-red/35 bg-vault-card/70 scale-95 hover:scale-100 transition-all duration-300">
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && items.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-24">
            <RefreshCw class="w-8 h-8 text-vault-lime animate-spin mb-4" />
            <span class="font-mono text-xs text-vault-muted uppercase">LOADING VAULT DATABASE...</span>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <EmptyState onOpenDrawer={() => setDrawerOpen(true)} />
        ) : (
          /* Grid filters and results */
          <div class="space-y-6">
            
            {/* Filter controls */}
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
              
              {/* Category Filter Chips */}
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-[10px] text-vault-muted uppercase tracking-wider mr-2 flex items-center gap-1.5">
                  <Filter class="w-3.5 h-3.5" />
                  CATEGORY:
                </span>
                {['ALL', 'BAG', 'SHOES', 'JEWELLERY', 'SUNGLASSES', 'BELT', 'WATCH', 'OTHER'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    class={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all border ${
                      selectedCategory === cat
                        ? 'bg-vault-lime text-vault-bg border-vault-lime font-bold'
                        : 'bg-transparent text-vault-muted border-neutral-900 hover:border-neutral-700 hover:text-vault-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter Chips */}
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-[10px] text-vault-muted uppercase tracking-wider mr-2">
                  STATUS:
                </span>
                {[
                  { value: 'ALL', label: 'ALL' },
                  { value: 'IN_CLOSET', label: 'IN CLOSET' },
                  { value: 'OUT', label: 'OUT NOW' },
                  { value: 'OVERDUE', label: 'OVERDUE' },
                  { value: 'MISSING', label: 'MISSING' }
                ].map(stat => (
                  <button
                    key={stat.value}
                    onClick={() => setSelectedStatus(stat.value)}
                    class={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all border ${
                      selectedStatus === stat.value
                        ? stat.value === 'OVERDUE'
                          ? 'bg-vault-red text-white border-vault-red font-bold'
                          : 'bg-vault-lime text-vault-bg border-vault-lime font-bold'
                        : 'bg-transparent text-vault-muted border-neutral-900 hover:border-neutral-700 hover:text-vault-primary'
                    }`}
                  >
                    {stat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessory Grid display */}
            {filteredItems.length === 0 ? (
              <div class="text-center py-20 border border-neutral-900 bg-vault-card/20">
                <p class="font-mono text-xs text-vault-muted uppercase">
                  NO VAULT ITEMS MATCH THE ACTIVE FILTER PRESETS.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                  }}
                  class="mt-4 font-mono text-[10px] text-vault-lime hover:underline uppercase font-bold"
                >
                  CLEAR FILTERS // RESET
                </button>
              </div>
            ) : (
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <ItemCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Add Accessory Lime FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        class="fixed bottom-8 right-8 w-14 h-14 bg-vault-lime text-vault-bg rounded-full flex items-center justify-center shadow-lg shadow-vault-lime/20 hover:scale-105 hover:bg-white active:scale-95 transition-all z-40 glow-button"
        title="LOG NEW ACCESSORY"
      >
        <Plus class="w-6 h-6 stroke-[3px]" />
      </button>

      {/* Slide up logging Drawer */}
      <AddItemDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onRefresh={fetchItems} 
      />

      {/* Slide out Notification Drawer */}
      <NotificationDrawer
        isOpen={notifOpen}
        onClose={() => {
          setNotifOpen(false);
          fetchUnreadCount(); // Refresh count on close
        }}
      />
    </div>
  );
}
