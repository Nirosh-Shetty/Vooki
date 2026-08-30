"use client";

import React, { useState } from "react";
import { Check, Send, X } from "lucide-react";
import { PublicProfileData } from "./types";

interface CreatorInquiryModalProps {
  data: PublicProfileData;
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorInquiryModal({ data, isOpen, onClose }: CreatorInquiryModalProps) {
  const [inquiryBrand, setInquiryBrand] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryBudget, setInquiryBudget] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  if (!isOpen) return null;

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      onClose();
      setInquiryBrand("");
      setInquiryEmail("");
      setInquiryBudget("");
      setInquiryMessage("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface)] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[color:var(--vooki-app-text-strong)]">
              Work with {data.name}
            </h3>
            <p className="text-xs text-[color:var(--vooki-app-text-muted)] mt-0.5">
              Submit your brief directly to the creator.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inquirySent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[color:var(--vooki-app-text-strong)]">
              Inquiry Sent Successfully!
            </h4>
            <p className="text-xs text-[color:var(--vooki-app-text-muted)] max-w-xs mx-auto">
              {data.name} has received your proposal and will respond via email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendInquiry} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                Brand or Agency Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={inquiryBrand}
                onChange={(e) => setInquiryBrand(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="collabs@brand.com"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                  Estimated Budget
                </label>
                <input
                  type="text"
                  placeholder="$500 - $2,500"
                  value={inquiryBudget}
                  onChange={(e) => setInquiryBudget(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[color:var(--vooki-app-text-strong)] mb-1">
                Campaign Scope & Deliverables
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe deliverables (e.g. 1x YouTube Short + Dedicated Reel)..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] bg-[color:var(--vooki-app-surface-strong)] text-[color:var(--vooki-app-text-strong)] focus:outline-hidden focus:border-[color:var(--vooki-app-active-border)] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[color:var(--vooki-app-border-strong)] text-xs font-semibold text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-strong)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--vooki-app-text-strong)] text-[color:var(--vooki-app-bg)] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Proposal</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

