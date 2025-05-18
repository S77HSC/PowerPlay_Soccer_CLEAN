'use client';
export const dynamic = 'force-dynamic';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const TournamentSetup = dynamic(() => import('./TournamentSetup'), { ssr: false });

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading tournament setup...</div>}>
      <TournamentSetup />
    </Suspense>
  );
}