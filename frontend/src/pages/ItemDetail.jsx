import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TransferModal from '../components/TransferModal';
import { ArrowLeft, Edit2, Trash2, Calendar, DollarSign, Tag, RefreshCw, Check, Clock, X, ShieldAlert } from 'lucide-react';

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Transition modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editAcquired, setEditAcquired] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/items/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Accessory not found.');
      }
      setItem(data);
      
      // Initialize edit fields
      setEditName(data.name);
      setEditBrand(data.brand);
      setEditCategory(data.category);
      setEditTags(data.tags ? data.tags.join(', ') : '');
      setEditNotes(data.notes || '');
      setEditPrice(data.purchasePrice || '');
      setEditAcquired(data.acquiredOn ? data.acquiredOn.split('T')[0] : '');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('ARE YOU SECURE YOU WANT TO REMOVE THIS PIECE FROM THE ARCHIVE? THIS ACTION IS PERMANENT.')) {
      return;
    }

    try {
      const res = await authFetch(`/api/items/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Failed to delete accessory.');
      }
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await authFetch(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          brand: editBrand,
          category: editCategory,
          tags: editTags ? editTags.split(',').map(t => t.trim()) : [],
          notes: editNotes,
          purchasePrice: editPrice ? parseFloat(editPrice) : undefined,
          acquiredOn: editAcquired ? new Date(editAcquired).toISOString() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update metadata.');
      }

      setItem(data);
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTransferSuccess = (updatedItem) => {
    setItem(updatedItem);
  };

  if (loading) {
    return (
      <div class="min-h-screen bg-vault-bg flex flex-col items-center justify-center font-mono">
        <RefreshCw class="w-8 h-8 text-vault-lime animate-spin mb-4" />
        <span class="text-xs text-vault-muted uppercase">DECRYPTING ACCESSORY RECORDS...</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div class="min-h-screen bg-vault-bg flex flex-col items-center justify-center font-mono p-6">
        <ShieldAlert class="w-12 h-12 text-vault-red mb-4" />
        <span class="text-sm text-vault-primary uppercase mb-4">{error || 'ACCESSORY RECORD NOT LOCATED.'}</span>
        <Link to="/" class="text-vault-lime hover:underline uppercase text-xs font-bold">
          &lt; RETURN TO VAULT
        </Link>
      </div>
    );
  }

  // Format dates helper
  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  };

  const formatTimeStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBadgeColors = () => {
    if (item.isOverdue) return 'bg-vault-red/10 border-vault-red text-vault-red shadow-glow-red/10 animate-pulse';
    
    switch (item.status) {
      case 'IN_CLOSET':
        return 'bg-vault-lime/10 border-vault-lime text-vault-lime';
      case 'MISSING':
        return 'bg-neutral-950 border-neutral-800 text-vault-muted border-dashed';
      default: // Out statuses
        return 'bg-neutral-900 border-neutral-700 text-vault-primary';
    }
  };

  return (
    <div class="min-h-screen bg-vault-bg font-sans pb-24 relative">
      
      {/* Top action header */}
      <div class="border-b border-neutral-900 bg-vault-bg/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            class="text-vault-muted hover:text-vault-lime transition-colors flex items-center gap-2 font-mono text-xs font-bold uppercase"
          >
            <ArrowLeft class="w-4 h-4" />
            RETURN TO STORAGE
          </Link>
          
          <div class="flex gap-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              class="hairline-border border-neutral-800 hover:border-vault-lime text-vault-muted hover:text-vault-lime px-4 py-2 text-xs font-mono flex items-center gap-2 transition-all uppercase"
            >
              {isEditing ? <X class="w-3.5 h-3.5" /> : <Edit2 class="w-3.5 h-3.5" />}
              {isEditing ? 'DISCARD EDIT' : 'EDIT PROPERTIES'}
            </button>
            
            <button
              onClick={handleDelete}
              class="hairline-border border-neutral-800 hover:border-vault-red text-vault-muted hover:text-vault-red px-4 py-2 text-xs font-mono flex items-center gap-2 transition-all uppercase"
            >
              <Trash2 class="w-3.5 h-3.5" />
              DELETE PIECE
            </button>
          </div>
        </div>
      </div>

      <main class="max-w-6xl mx-auto px-6 mt-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Column Left: Visual Cover column */}
          <div class="lg:col-span-5 flex flex-col gap-4">
            <div class="bg-vault-card hairline-border overflow-hidden relative aspect-[4/5] bg-neutral-950">
              <img
                src={item.coverImageUrl || PLACEHOLDER_IMG}
                alt={item.name}
                class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-out"
              />
              
              {/* Overdue visual label indicator */}
              {item.isOverdue && (
                <div class="absolute top-4 left-4 bg-vault-red text-white font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-widest animate-pulse">
                  OVERDUE DETECTED // RETRIEVE PIECE
                </div>
              )}
            </div>
            
            <span class="text-[9px] font-mono text-vault-muted text-center uppercase tracking-widest">
              ID: {item._id} // STAMPED {formatDateStr(item.createdAt)}
            </span>
          </div>

          {/* Column Right: Details Panel / Edit Mode */}
          <div class="lg:col-span-7 space-y-8">
            
            {isEditing ? (
              /* Toggle Edit Form */
              <form onSubmit={handleUpdate} class="bg-vault-card hairline-border p-6 sm:p-8 space-y-6 relative">
                <div class="absolute top-0 left-0 right-0 h-[2px] bg-vault-lime"></div>
                <h3 class="font-mono text-sm font-bold text-vault-lime uppercase tracking-widest">
                  // EDIT ACCESSORY PROPERTIES
                </h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                      ACCESSORY NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-sans text-sm focus:outline-none transition-colors"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                        BRAND
                      </label>
                      <input
                        type="text"
                        required
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                        class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-xs focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                        CATEGORY
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-sans text-xs focus:outline-none transition-colors"
                      >
                        {['Bag', 'Shoes', 'Jewellery', 'Sunglasses', 'Belt', 'Watch', 'Other'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                        PURCHASE PRICE ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-xs focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                        ACQUIRED DATE
                      </label>
                      <input
                        type="date"
                        value={editAcquired}
                        onChange={(e) => setEditAcquired(e.target.value)}
                        class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-1.5 text-vault-primary font-mono text-xs focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                      TAGS (COMMA SEPARATED)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-xs focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                      NOTES
                    </label>
                    <textarea
                      rows="3"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-sans text-xs focus:outline-none resize-none"
                    ></textarea>
                  </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    class="bg-transparent border border-neutral-900 text-vault-muted hover:text-vault-primary px-4 py-2 text-xs font-mono uppercase transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    class="bg-vault-lime text-vault-bg font-sans font-black text-xs uppercase px-6 py-2 tracking-widest flex items-center justify-center gap-1.5 glow-button"
                  >
                    {saving ? <RefreshCw class="w-3.5 h-3.5 animate-spin" /> : <Check class="w-3.5 h-3.5" />}
                    SAVE DETAILS
                  </button>
                </div>
              </form>
            ) : (
              /* Display mode details */
              <div class="space-y-6">
                
                {/* Brand & Name headings */}
                <div>
                  <span class="font-mono text-sm text-vault-muted uppercase tracking-wider block mb-1">
                    {item.brand}
                  </span>
                  <h2 class="text-4xl font-black text-vault-primary tracking-tight uppercase">
                    {item.name}
                  </h2>
                </div>

                {/* Status Badges - Tappable state change */}
                <div class="flex flex-wrap items-center gap-4 py-2">
                  <span class="font-mono text-[10px] text-vault-muted uppercase tracking-wider">
                    CURRENT CUSTODY:
                  </span>
                  
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    class={`border px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase cursor-pointer hover:bg-white hover:text-vault-bg hover:border-white transition-all ${getBadgeColors()}`}
                    title="TRIGGER STATE TRANSITION"
                  >
                    {item.isOverdue ? 'STATUS: OVERDUE' : `STATUS: ${item.status}`}
                  </button>
                  
                  {item.status !== 'MISSING' && (
                    <span class="text-[9px] font-mono text-vault-muted hidden sm:inline">
                      (TAP BADGE TO CHANGE)
                    </span>
                  )}
                </div>

                {/* Main grid parameters */}
                <div class="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-neutral-900">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 border border-neutral-900 bg-vault-card flex items-center justify-center text-vault-muted">
                      <Tag class="w-4 h-4 text-vault-lime" />
                    </div>
                    <div>
                      <span class="block text-[8px] font-mono text-vault-muted uppercase">CATEGORY</span>
                      <span class="block text-sm font-sans font-bold text-vault-primary uppercase">{item.category}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 border border-neutral-900 bg-vault-card flex items-center justify-center text-vault-muted">
                      <DollarSign class="w-4 h-4 text-vault-lime" />
                    </div>
                    <div>
                      <span class="block text-[8px] font-mono text-vault-muted uppercase">EST. VALUE</span>
                      <span class="block text-sm font-mono font-bold text-vault-primary">
                        {item.purchasePrice ? `$${item.purchasePrice.toLocaleString()}` : '$—'}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 border border-neutral-900 bg-vault-card flex items-center justify-center text-vault-muted">
                      <Calendar class="w-4 h-4 text-vault-lime" />
                    </div>
                    <div>
                      <span class="block text-[8px] font-mono text-vault-muted uppercase">ACQUIRED</span>
                      <span class="block text-sm font-mono font-bold text-vault-primary">{formatDateStr(item.acquiredOn)}</span>
                    </div>
                  </div>
                </div>

                {/* Custodian detail if out */}
                {['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(item.status) && (
                  <div class="border border-neutral-900 bg-[#0C0C0C] p-5 relative">
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-vault-lime"></div>
                    <h4 class="font-mono text-[10px] text-vault-lime uppercase tracking-widest mb-3">
                      // CUSTODIAN METRICS
                    </h4>
                    
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div>
                        <span class="block text-[8px] font-mono text-vault-muted uppercase">CUSTODIAN</span>
                        <span class="block text-sm font-sans font-bold text-vault-primary uppercase">
                          {item.custodianName || 'UNSPECIFIED'}
                        </span>
                      </div>
                      
                      <div>
                        <span class="block text-[8px] font-mono text-vault-muted uppercase">CONTACT HANDLE</span>
                        <span class="block text-xs font-mono text-vault-primary truncate">
                          {item.custodianContact || 'NONE PRESET'}
                        </span>
                      </div>

                      <div>
                        <span class="block text-[8px] font-mono text-vault-muted uppercase">EXPECTED BACK</span>
                        <span class={`block text-xs font-mono font-bold ${item.isOverdue ? 'text-vault-red animate-pulse' : 'text-vault-primary'}`}>
                          {formatDateStr(item.returnDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes box */}
                {item.notes && (
                  <div class="space-y-2">
                    <h4 class="font-mono text-[10px] text-vault-muted uppercase tracking-widest">
                      // ARCHIVIST NOTES:
                    </h4>
                    <p class="text-sm font-sans text-[#D0D0D0] leading-relaxed italic bg-vault-card/50 p-4 border border-dashed border-neutral-900">
                      "{item.notes}"
                    </p>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-mono text-[9px] text-vault-muted uppercase tracking-wider mr-2">
                      TAGS:
                    </span>
                    {item.tags.map(tag => (
                      <span key={tag} class="bg-neutral-900/50 border border-neutral-900 text-vault-muted px-3 py-1 font-mono text-[9px] uppercase tracking-wider">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Custodian History Timeline */}
                <div class="space-y-6 pt-6 border-t border-neutral-900">
                  <div>
                    <h3 class="text-sm font-bold font-sans text-vault-primary uppercase tracking-widest">
                      // TRANSFER TIMELINE LOG
                    </h3>
                    <p class="text-[9px] font-mono text-vault-muted uppercase mt-0.5">
                      CHRONOLOGICAL RECORD OF CUSTODY SHIFTS
                    </p>
                  </div>

                  {item.loanLog && item.loanLog.length > 0 ? (
                    <div class="space-y-6 relative pl-5 border-l border-neutral-900 ml-2 py-2 font-mono text-[11px]">
                      {item.loanLog.slice().reverse().map((log, index) => {
                        const isOutLog = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(log.toStatus);
                        
                        return (
                          <div key={log._id || index} class="relative">
                            
                            {/* Dotted point anchor */}
                            <div class={`absolute -left-[25px] top-[4px] w-2 h-2 rounded-full border ${
                              isOutLog ? 'bg-vault-lime border-vault-lime' : 'bg-[#0A0A0A] border-neutral-800'
                            }`}></div>

                            <div class="space-y-1.5">
                              <div class="flex items-center gap-3">
                                <span class="text-vault-muted">
                                  {formatDateStr(log.transferredAt)} @ {formatTimeStr(log.transferredAt)}
                                </span>
                                
                                <span class={`px-2 py-0.5 border text-[9px] font-bold ${
                                  isOutLog ? 'bg-neutral-900 border-neutral-800 text-vault-primary' : 'bg-vault-lime/5 border-vault-lime text-vault-lime'
                                }`}>
                                  {log.toStatus}
                                </span>
                              </div>

                              {isOutLog ? (
                                <p class="text-vault-primary uppercase">
                                  LENT TO <strong class="text-vault-lime">{log.recipientName}</strong> ({log.recipientContact || 'NO CONTACT'}) — EXPECTED RETURN: <span class="text-white">{formatDateStr(log.expectedReturn)}</span>
                                </p>
                              ) : log.toStatus === 'MISSING' ? (
                                <p class="text-vault-red uppercase font-bold animate-pulse">
                                  PIECE RECORDED AS MISSING // CUSTODY SUSPENDED.
                                </p>
                              ) : (
                                <p class="text-vault-muted uppercase">
                                  RETURNED TO SECURE VAULT CLOSET STORAGE // CUSTODY SETTLED.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div class="p-6 border border-dashed border-neutral-900 text-center text-vault-muted font-mono text-xs uppercase">
                      NO HISTORIC TRANSFERS PRESET. PIECE HAS REMAINED STATIONARY.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </main>

      {/* Transfer State Machine Trigger Modal */}
      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        currentStatus={item.status}
        itemId={item._id}
        onTransferSuccess={handleTransferSuccess}
      />
    </div>
  );
}
