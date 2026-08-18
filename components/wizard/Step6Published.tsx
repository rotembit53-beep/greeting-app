'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface StepProps {
  state: any;
}

export default function Step6Published({ state }: StepProps) {
  const router = useRouter();
  const [isApproved, setIsApproved] = useState(state.status === 'approved');
  const [polling, setPolling] = useState(!isApproved);
  const [greetingUrl, setGreetingUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setGreetingUrl(`${window.location.origin}/greeting/${state.id}`);
  }, [state.id]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/greeting-status?id=${state.id}`);
        const data: any = await res.json();

        if (data.isApproved) {
          setIsApproved(true);
          setPolling(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [polling, state.id]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(greetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isApproved) {
    return (
      <div className="space-y-6 text-center py-6">
        <div>
          <span
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            <Icon name="gift" size={32} />
          </span>
          <h2 className="section-title">הברכה אושרה!</h2>
          <p className="section-subtitle">
            הכל מוכן — עכשיו אפשר לשתף את הברכה עם הנמען
          </p>
        </div>

        <button
          onClick={() => router.push(`/greeting/${state.id}`)}
          className="btn-primary text-lg !px-10"
        >
          מעבר לברכה
          <Icon name="chevron-left" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center py-6">
      <div>
        <span
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
        >
          <Icon name="clock" size={32} />
        </span>
        <h2 className="section-title">ממתינים לאישור</h2>
        <p className="section-subtitle max-w-md mx-auto">
          מנהל המערכת קיבל את הבקשה — ברגע שיאשר, הברכה תעלה לאוויר
        </p>
      </div>

      <div
        className="p-6 rounded-xl border max-w-lg mx-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
      >
        <p className="field-label text-right">הקישור לברכה שלכם</p>
        <div className="flex gap-2">
          <code
            dir="ltr"
            className="flex-1 p-3 rounded-lg text-sm overflow-x-auto whitespace-nowrap text-left"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {greetingUrl}
          </code>
          <button onClick={copyLink} className="btn-ghost !px-4" aria-label="העתקת קישור">
            <Icon name={copied ? 'check' : 'copy'} size={18} />
          </button>
        </div>
      </div>

      <div className="note-box max-w-lg mx-auto">
        בודקים אוטומטית כל כמה שניות אם הברכה אושרה — אפשר להשאיר את הדף פתוח
      </div>
    </div>
  );
}
