import { getGreeting } from '@/lib/db';
import Logo from '@/components/brand/Logo';
import GiftExperience from '@/components/greeting/GiftExperience';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GreetingPage({ params }: PageProps) {
  const { id } = await params;
  const greeting = await getGreeting(id);

  if (!greeting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Logo size={44} className="justify-center mb-8" />
          <h1 className="section-title mb-2">הברכה לא נמצאה</h1>
          <p className="section-subtitle mb-6">
            ייתכן שהקישור שגוי או שהברכה הוסרה
          </p>
          <a href="/" className="btn-primary">
            חזרה לדף הבית
          </a>
        </div>
      </div>
    );
  }

  if (greeting.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <Logo size={44} className="justify-center mb-8" />
          <h1 className="section-title mb-2">הברכה עדיין ממתינה לאישור</h1>
          <p className="section-subtitle">
            עוד רגע קטן — הברכה תיפתח מיד לאחר אישור מנהל המערכת
          </p>
        </div>
      </div>
    );
  }

  return <GiftExperience greeting={greeting} />;
}
