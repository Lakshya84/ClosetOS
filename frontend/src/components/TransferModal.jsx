import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Allowed client-side transitions matching the backend state machine
const ALLOWED_TRANSITIONS = {
  IN_CLOSET: ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR', 'MISSING'],
  ON_LOAN: ['IN_CLOSET', 'MISSING'],
  SENT_TO_STYLIST: ['IN_CLOSET', 'MISSING'],
  AT_PR: ['IN_CLOSET', 'MISSING'],
  MISSING: [] // Locked state
};

const STATUS_LABELS = {
  IN_CLOSET: 'IN CLOSET (VAULT)',
  ON_LOAN: 'ON LOAN (OUT)',
  SENT_TO_STYLIST: 'WITH STYLIST (OUT)',
  AT_PR: 'AT PR AGENCY (OUT)',
  MISSING: 'MISSING // LOCKED'
};

export default function TransferModal({ isOpen, onClose, currentStatus, itemId, onTransferSuccess }) {
  if (!isOpen) return null;

  const { authFetch } = useAuth();
  const [toStatus, setToStatus] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Get available transitions based on current status
  const availableOptions = ALLOWED_TRANSITIONS[currentStatus] || [];

  useEffect(() => {
    if (availableOptions.length > 0) {
      setToStatus(availableOptions[0]);
    }
  }, [currentStatus]);

  const handleClose = () => {
    setToStatus('');
    setRecipientName('');
    setRecipientContact('');
    setReturnDate('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const isOutStatus = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(toStatus);

    if (isOutStatus && (!recipientName || !returnDate)) {
      setError('Recipient Name and Return Date are strictly required for OUT transitions.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await authFetch(`/api/items/${itemId}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({
          toStatus,
          recipientName: isOutStatus ? recipientName : undefined,
          recipientContact: isOutStatus ? recipientContact : undefined,
          returnDate: isOutStatus ? new Date(returnDate).toISOString() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Status transition failed.');
      }

      onTransferSuccess(data);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isOutStatus = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(toStatus);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Blurred Backdrop */}
      <div 
        onClick={submitting ? null : handleClose}
        class="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm"
      ></div>

      {/* Modal Card */}
      <div class="relative w-full max-w-md bg-vault-card hairline-border shadow-2xl p-6 sm:p-8 z-10">
        
        {/* Top lime/red strip */}
        <div class={`absolute top-0 left-0 right-0 h-[2px] ${toStatus === 'MISSING' ? 'bg-vault-red' : 'bg-vault-lime'}`}></div>

        {/* Header */}
        <div class="flex items-center justify-between pb-4 border-b border-neutral-900 mb-6">
          <div>
            <h3 class="text-sm font-bold font-sans text-vault-primary tracking-widest uppercase">
              // STATE TRANSITION
            </h3>
            <p class="text-[10px] font-mono text-vault-muted uppercase">
              CURRENT STATE: {currentStatus}
            </p>
          </div>
          <button 
            onClick={handleClose} 
            disabled={submitting}
            class="text-vault-muted hover:text-vault-lime p-1 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        {/* Strict transition warning for MISSING items */}
        {currentStatus === 'MISSING' ? (
          <div class="space-y-4 py-4 text-center">
            <ShieldAlert class="w-12 h-12 text-vault-red mx-auto animate-pulse" />
            <h4 class="font-mono text-xs font-bold text-vault-primary uppercase">
              Archive State Locked
            </h4>
            <p class="font-mono text-[10px] text-vault-muted leading-relaxed uppercase">
              THIS ACCESSORY IS CURRENTLY MARKED AS MISSING. LOCKED STATES CANNOT BE TRANSITIONED OR LENT OUT. CONTACT ADMIN FOR MANUAL INVENTORY OVERRIDES.
            </p>
            <button
              onClick={handleClose}
              class="w-full bg-neutral-900 border border-neutral-800 hover:border-vault-primary text-vault-primary font-sans font-black text-xs uppercase py-3 tracking-widest transition-all"
            >
              ACKNOWLEDGE & CLOSE
            </button>
          </div>
        ) : (
          /* Transfer forms */
          <form onSubmit={handleSubmit} class="space-y-5">
            {error && (
              <div class="p-3 border border-vault-red bg-vault-red/5 text-vault-red text-[11px] font-mono flex items-center gap-2">
                <ShieldAlert class="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label class="block text-[9px] font-mono text-vault-primary tracking-wider uppercase mb-2">
                SELECT TARGET STATUS
              </label>
              <select
                value={toStatus}
                onChange={(e) => setToStatus(e.target.value)}
                class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2.5 text-vault-primary font-sans text-xs tracking-wide focus:outline-none transition-colors"
              >
                {availableOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {STATUS_LABELS[opt] || opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Outgoing Details */}
            {isOutStatus && (
              <div class="border border-neutral-900 bg-[#0C0C0C] p-4 space-y-4 relative">
                <div class="absolute top-0 left-0 w-1.5 h-full bg-vault-lime"></div>
                <span class="block font-mono text-[8px] text-vault-lime tracking-widest uppercase mb-1">
                  // ENTER CUSTODY DETAILS
                </span>

                <div>
                  <label class="block text-[8px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                    CUSTODIAN NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="RECIPIENT NAME"
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-sans text-xs focus:outline-none placeholder-neutral-800 transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-[8px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                    CONTACT HANDLE
                  </label>
                  <input
                    type="text"
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    placeholder="@INSTAGRAM / PHONE"
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-[11px] focus:outline-none placeholder-neutral-800 transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-[8px] font-mono text-vault-primary tracking-wider uppercase mb-1">
                    EXPECTED RETURN DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {toStatus === 'MISSING' && (
              <div class="border border-vault-red/30 bg-vault-red/5 p-4 relative">
                <div class="absolute top-0 left-0 w-1.5 h-full bg-vault-red"></div>
                <span class="block font-mono text-[8px] text-vault-red tracking-widest uppercase mb-1 font-bold">
                  // CRITICAL WARNING
                </span>
                <p class="font-mono text-[9px] text-vault-muted uppercase leading-relaxed">
                  TRANSITIONING TO MISSING WILL PERMANENTLY LOCK THIS ITEM IN THIS ARCHIVE. NO FURTHER TRANSFERS CAN BE PERFORMED.
                </p>
              </div>
            )}

            <div class="pt-4 border-t border-neutral-900 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                class="bg-transparent border border-neutral-900 hover:border-vault-muted text-vault-muted hover:text-vault-primary font-sans font-black text-xs uppercase px-4 py-3 tracking-widest transition-all"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={submitting}
                class={`font-sans font-black text-xs uppercase px-6 py-3 tracking-widest flex items-center justify-center gap-2 transition-all ${
                  toStatus === 'MISSING' 
                    ? 'bg-vault-red text-white hover:bg-white hover:text-vault-bg' 
                    : 'bg-vault-lime text-vault-bg hover:bg-white glow-button'
                }`}
              >
                {submitting ? (
                  <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                ) : (
                  STATUS_LABELS[toStatus]?.includes('LOCKED') ? 'LOCK STATE' : 'CONFIRM STATE'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
