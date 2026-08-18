'use client';

import { useState, useEffect } from 'react';
import { Greeting } from '@/types/greeting';
import Icon from '@/components/ui/Icon';

interface ShareModalProps {
  greeting: Greeting;
}

export default function ShareModal({ greeting }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [greetingUrl, setGreetingUrl] = useState('');

  useEffect(() => {
    setGreetingUrl(`${window.location.origin}/greeting/${greeting.id}`);
  }, [greeting.id]);

  const shareData = greeting.aiText.shareData;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(greetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `${shareData.whatsappMessage}\n${greetingUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleGmail = () => {
    const body = encodeURIComponent(`${shareData.gmailBody}\n\n${greetingUrl}`);
    window.open(
      `https://mail.google.com/mail/?view=cm&to=&subject=${encodeURIComponent(
        shareData.gmailSubject
      )}&body=${body}`,
      '_blank'
    );
  };

  const channels = [
    { label: 'WhatsApp', icon: 'chat' as const, onClick: handleWhatsApp },
    { label: 'Gmail', icon: 'mail' as const, onClick: handleGmail },
    {
      label: 'Instagram',
      icon: 'camera' as const,
      onClick: () => window.open('https://www.instagram.com/', '_blank'),
    },
    {
      label: 'Facebook',
      icon: 'facebook' as const,
      onClick: () => window.open('https://www.facebook.com/', '_blank'),
    },
  ];

  return (
    <div className="pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
      <h2 className="section-title text-xl mb-6">שיתוף הברכה</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {channels.map((channel) => (
          <button
            key={channel.label}
            onClick={channel.onClick}
            className="chip flex flex-col items-center gap-2 !py-4"
          >
            <span style={{ color: 'var(--primary)' }}>
              <Icon name={channel.icon} size={24} />
            </span>
            <span className="font-semibold text-sm">{channel.label}</span>
          </button>
        ))}
      </div>

      {/* Copy Link */}
      <div
        className="mt-6 p-4 rounded-xl border"
        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
      >
        <p className="field-label">או העתיקו את הקישור</p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={greetingUrl}
            dir="ltr"
            className="input-field flex-1 text-sm !text-left"
          />
          <button
            onClick={copyToClipboard}
            className="btn-primary !px-4"
            aria-label="העתקת קישור"
          >
            <Icon name={copied ? 'check' : 'copy'} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
