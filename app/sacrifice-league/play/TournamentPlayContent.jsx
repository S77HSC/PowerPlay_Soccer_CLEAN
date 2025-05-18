'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import TournamentPlayContent from './TournamentPlayContent';

export default function PlayPageWrapper() {
  return (
    <Suspense fallback={<div className="text-white text-center p-6">Loading match data...</div>}>
      <TournamentPlayContent />
    </Suspense>
  );
}
