import { Suspense } from 'react';
import TesterPageContent from './TesterPageContent';

export default function TesterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        Загрузка...
      </div>
    }>
      <TesterPageContent />
    </Suspense>
  );
}