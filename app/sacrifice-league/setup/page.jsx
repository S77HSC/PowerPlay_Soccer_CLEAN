'use client';
import React, { Suspense } from 'react';
import TournamentSetupContent from './TournamentSetupContent';

export default function SetupPageWrapper() {
  return (
    <Suspense fallback={<div className="text-white text-center p-6">Loading setup page...</div>}>
      <TournamentSetupContent />
    </Suspense>
  );
}
