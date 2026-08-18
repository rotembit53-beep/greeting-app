'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Icon from '@/components/ui/Icon';

function ApprovedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Logo size={44} className="justify-center mb-8" />
          <span
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <Icon name="alert" size={36} />
          </span>
          <h1 className="section-title mb-2">האישור נכשל</h1>
          <p className="section-subtitle mb-6">
            {error === 'invalid' && 'הקישור אינו תקין'}
            {error === 'unauthorized' && 'הקישור פג תוקף או שאינו מורשה'}
            {error === 'failed' && 'אירעה שגיאה בעת עיבוד הבקשה'}
          </p>
          <a href="/" className="btn-primary">
            חזרה לדף הבית
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Logo size={44} className="justify-center mb-8" />
        <span
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
        >
          <Icon name="check-circle" size={36} />
        </span>
        <h1 className="section-title mb-2">הברכה אושרה בהצלחה</h1>
        <p className="section-subtitle mb-6">
          הברכה עלתה לאוויר — היוצר יכול עכשיו לשתף אותה עם הנמען
        </p>
        <a href="/" className="btn-primary">
          חזרה לדף הבית
        </a>
      </div>
    </div>
  );
}

export default function ApprovedPage() {
  return (
    <Suspense>
      <ApprovedContent />
    </Suspense>
  );
}
