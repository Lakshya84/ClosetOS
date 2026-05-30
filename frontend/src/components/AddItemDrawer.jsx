import React, { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddItemDrawer({ isOpen, onClose, onRefresh }) {
  if (!isOpen) return null;

  const { authFetch } = useAuth();
  
  // Base details
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Bag');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [acquiredOn, setAcquiredOn] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('IN_CLOSET');

  // Custodian details (if out)
  const [custodianName, setCustodianName] = useState('');
  const [custodianContact, setCustodianContact] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Image Upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Flow states
  const [submitting, setSubmitting] = useState(false);
  const [savedItemId, setSavedItemId] = useState(null);
  const [uploadError, setUploadError] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setCategory('Bag');
    setTags('');
    setNotes('');
    setPurchasePrice('');
    setAcquiredOn(new Date().toISOString().split('T')[0]);
    setStatus('IN_CLOSET');
    setCustodianName('');
    setCustodianContact('');
    setReturnDate('');
    setImageFile(null);
    setImagePreview(null);
    setSavedItemId(null);
    setUploadError(false);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Asynchronous Image Upload function (supporting retries)
  const uploadImage = async (itemId, fileToUpload) => {
    setUploadError(false);
    
    const formData = new FormData();
    formData.append('image', fileToUpload);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/items/${itemId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('vault_token')}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Cloudinary failed');
      }

      // Success! Reset and close
      handleClose();
      onRefresh();
    } catch (err) {
      console.error('Image Upload failed asynchronously:', err);
      setUploadError(true);
      onRefresh(); // Refresh so the user sees the saved text-item in their grid!
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSubmitting(true);

    // Zod validation check emulation locally
    if (!name || !brand || !category) {
      setValidationError('Name, Brand, and Category are strictly required.');
      setSubmitting(false);
      return;
    }

    const outStatuses = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'];
    if (outStatuses.includes(status) && (!custodianName || !returnDate)) {
      setValidationError('Custodian Name and Return Date are required when creating in an OUT status.');
      setSubmitting(false);
      return;
    }

    // Build item body
    const body = {
      name,
      brand,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      notes,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      acquiredOn: new Date(acquiredOn).toISOString(),
    };

    try {
      // 1. Create text entry first in DB
      const res = await authFetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save accessory credentials.');
      }

      const createdId = data._id;
      setSavedItemId(createdId);

      // If they chose an OUT status, trigger transition immediately
      if (outStatuses.includes(status)) {
        const transferRes = await authFetch(`/api/items/${createdId}/transfer`, {
          method: 'PATCH',
          body: JSON.stringify({
            toStatus: status,
            recipientName: custodianName,
            recipientContact: custodianContact,
            returnDate: new Date(returnDate).toISOString()
          })
        });

        if (!transferRes.ok) {
          const transferData = await transferRes.json();
          throw new Error(transferData.message || 'Accessory saved, but status initialization failed.');
        }
      }

      // 2. Perform image upload if file is selected
      if (imageFile) {
        await uploadImage(createdId, imageFile);
      } else {
        // No image attached, close gracefully
        handleClose();
        onRefresh();
      }
    } catch (err) {
      setValidationError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryUpload = async () => {
    if (savedItemId && imageFile) {
      setSubmitting(true);
      await uploadImage(savedItemId, imageFile);
      setSubmitting(false);
    }
  };

  const isOutStatus = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(status);

  return (
    <div class="fixed inset-0 z-50 flex items-end justify-center font-sans">
      {/* Dark backdrop with blur reset */}
      <div 
        onClick={submitting ? null : handleClose}
        class="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Drawer Panel (slides up) */}
      <div class="relative w-full max-w-2xl bg-vault-card hairline-border border-b-0 max-h-[90vh] overflow-y-auto z-10 transition-transform duration-500 ease-out transform translate-y-0 p-6 sm:p-8 shadow-2xl">
        
        {/* Top Lime accent indicator */}
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-vault-lime"></div>

        {/* Header */}
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-neutral-900">
          <div>
            <h2 class="text-xl font-bold font-sans text-vault-primary tracking-wide uppercase">
              {uploadError ? 'IMAGE UPLOAD WARNING' : 'LOG NEW ACCESSORY'}
            </h2>
            <p class="text-xs font-mono text-vault-muted uppercase mt-0.5">
              {uploadError ? 'CREDENTIALS RECORDED, PHOTO FAILED' : 'INPUT ACCESSORY PROPERTIES'}
            </p>
          </div>
          <button 
            onClick={handleClose} 
            disabled={submitting}
            class="text-vault-muted hover:text-vault-lime p-1 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors */}
        {validationError && !uploadError && (
          <div class="mb-6 p-4 border border-vault-red bg-vault-red/5 text-vault-red text-xs font-mono flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Failsafe Cloudinary Retry view */}
        {uploadError ? (
          <div class="space-y-6 py-6 text-center">
            <div class="mx-auto w-12 h-12 border border-dashed border-vault-red bg-vault-red/5 flex items-center justify-center text-vault-red mb-4">
              <AlertTriangle class="w-6 h-6 animate-pulse" />
            </div>
            
            <div class="max-w-md mx-auto">
              <h3 class="text-base font-bold text-vault-primary uppercase mb-2 font-mono">
                Accessory Details Saved!
              </h3>
              <p class="text-xs text-vault-muted font-mono uppercase leading-relaxed mb-6">
                THE PIECE "{name}" HAS BEEN SUCCESSFULLY LOGGED IN YOUR CLOSET DATABASE. HOWEVER, THE PHOTO FAILED TO UPLOAD TO CLOUDINARY. YOU CAN RETRY THE PHOTO UPLOAD NOW OR CLOSE THIS DRAWER TO DO IT LATER.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
              <button
                onClick={handleRetryUpload}
                disabled={submitting}
                class="bg-vault-lime hover:bg-white text-vault-bg font-sans font-black text-xs uppercase py-4 px-6 tracking-widest flex items-center justify-center gap-2 grow glow-button"
              >
                {submitting ? (
                  <RefreshCw class="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw class="w-4 h-4" />
                )}
                RETRY PHOTO UPLOAD
              </button>
              
              <button
                onClick={handleClose}
                disabled={submitting}
                class="bg-neutral-900 border border-neutral-800 hover:border-vault-primary text-vault-primary font-sans font-black text-xs uppercase py-4 px-6 tracking-widest grow transition-all"
              >
                CLOSE & KEEP GENERIC
              </button>
            </div>
          </div>
        ) : (
          /* Normal creation form */
          <form onSubmit={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Core Fields */}
              <div class="space-y-4">
                <div>
                  <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                    ACCESSORY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.G. CHROME HEARTS SUNGLASSES"
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-sans text-sm tracking-wide focus:outline-none placeholder-neutral-800 transition-colors"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                      BRAND *
                    </label>
                    <input
                      type="text"
                      required
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="E.G. BALENCIAGA"
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-mono text-xs tracking-wide focus:outline-none placeholder-neutral-800 transition-colors"
                    />
                  </div>

                  <div>
                    <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                      CATEGORY *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-sans text-xs tracking-wide focus:outline-none transition-colors"
                    >
                      {['Bag', 'Shoes', 'Jewellery', 'Sunglasses', 'Belt', 'Watch', 'Other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                      PRICE ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="E.G. 750"
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-mono text-xs tracking-wide focus:outline-none placeholder-neutral-800 transition-colors"
                    />
                  </div>

                  <div>
                    <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                      ACQUIRED ON
                    </label>
                    <input
                      type="date"
                      value={acquiredOn}
                      onChange={(e) => setAcquiredOn(e.target.value)}
                      class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2 text-vault-primary font-mono text-xs tracking-wide focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                    TAGS (COMMA SEPARATED)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="E.G. LEATHER, VINTAGE, GRAIL"
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-mono text-xs tracking-wide focus:outline-none placeholder-neutral-800 transition-colors"
                  />
                </div>

                <div>
                  <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                    NOTES / DETAILS
                  </label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.G. SLIGHT SCRATCH ON INNER LEFT ARM"
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-sans text-xs tracking-wide focus:outline-none placeholder-neutral-800 transition-colors resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Right Column: Image and Status setup */}
              <div class="space-y-4 flex flex-col justify-between">
                
                {/* Image upload area */}
                <div>
                  <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                    COVER IMAGE
                  </label>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    class="hairline-border bg-[#0E0E0E] hover:border-vault-lime cursor-pointer transition-all aspect-video flex flex-col items-center justify-center overflow-hidden relative"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                    ) : (
                      <div class="text-center p-4">
                        <Upload class="w-6 h-6 text-vault-muted mx-auto mb-2" />
                        <span class="font-mono text-[9px] text-vault-muted uppercase tracking-wider block">
                          CHOOSE IMAGE FILE
                        </span>
                        <span class="font-mono text-[8px] text-neutral-800 uppercase block mt-1">
                          PNG, JPG (MAX 5MB)
                        </span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      class="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {/* Status Picker */}
                <div>
                  <label class="block text-[10px] font-mono text-vault-primary tracking-wider uppercase mb-1.5">
                    INITIAL ARCHIVE STATUS
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    class="w-full bg-[#0E0E0E] hairline-border focus:border-vault-lime px-4 py-2.5 text-vault-primary font-sans text-xs tracking-wide focus:outline-none transition-colors mb-2"
                  >
                    <option value="IN_CLOSET">IN CLOSET (IN VAULT)</option>
                    <option value="ON_LOAN">ON LOAN (OUT)</option>
                    <option value="SENT_TO_STYLIST">SENT TO STYLIST (OUT)</option>
                    <option value="AT_PR">SENT TO PR AGENCY (OUT)</option>
                  </select>
                </div>

                {/* Custodian Form details (If OUT selected during initialization) */}
                {isOutStatus && (
                  <div class="border border-neutral-900 bg-neutral-950 p-4 space-y-3 relative">
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-vault-lime"></div>
                    <span class="block font-mono text-[9px] text-vault-lime tracking-widest uppercase mb-1">
                      // CUSTODIAN REQUIREMENTS
                    </span>
                    
                    <div>
                      <input
                        type="text"
                        required={isOutStatus}
                        value={custodianName}
                        onChange={(e) => setCustodianName(e.target.value)}
                        placeholder="RECIPIENT NAME *"
                        class="w-full bg-[#0C0C0C] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-[10px] tracking-wide focus:outline-none placeholder-neutral-800 transition-colors"
                      />
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={custodianContact}
                        onChange={(e) => setCustodianContact(e.target.value)}
                        placeholder="@INSTAGRAM / PHONE"
                        class="w-full bg-[#0C0C0C] hairline-border focus:border-vault-lime px-3 py-2 text-vault-primary font-mono text-[10px] tracking-wide focus:outline-none placeholder-neutral-800 transition-colors"
                      />
                      
                      <input
                        type="date"
                        required={isOutStatus}
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        class="w-full bg-[#0C0C0C] hairline-border focus:border-vault-lime px-3 py-1.5 text-vault-primary font-mono text-[10px] tracking-wide focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Action */}
            <div class="pt-4 border-t border-neutral-900 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                class="bg-transparent border border-neutral-900 hover:border-vault-muted text-vault-muted hover:text-vault-primary font-sans font-black text-xs uppercase px-6 py-4 tracking-widest transition-all"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={submitting}
                class="bg-vault-lime text-vault-bg font-sans font-black text-xs uppercase px-8 py-4 tracking-widest flex items-center justify-center gap-2 glow-button hover:bg-white transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <RefreshCw class="w-4 h-4 animate-spin" />
                    RECORDING VAULT...
                  </>
                ) : (
                  <>
                    <Check class="w-4 h-4" />
                    ADD ACCESSORY
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
