'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface CopyFieldProps {
  value: string;
  accentColor: string;
  borderColor: string;
}

/** Read-only value with a copy button — no navigation, so a bad link can't error. */
export default function CopyField({ value, accentColor, borderColor }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard blocked — the field is selectable as a fallback
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        readOnly
        value={value}
        dir="ltr"
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 px-3 py-2 rounded-lg text-sm !text-left"
        style={{ border: `1px solid ${borderColor}`, background: '#fff', color: '#2b2320' }}
      />
      <button
        onClick={copy}
        className="px-4 py-2 rounded-lg font-medium text-sm text-white flex items-center gap-1.5 transition-opacity hover:opacity-90"
        style={{ background: accentColor }}
        aria-label="העתקת הקישור"
      >
        <Icon name={copied ? 'check' : 'copy'} size={16} />
        {copied ? 'הועתק!' : 'העתקה'}
      </button>
    </div>
  );
}
