'use client';

import React, { Suspense } from 'react';
import PageContent from './PageContent';

export default function SkillPlayerWrapper() {
  return (
    <Suspense fallback={<div className="text-white text-center p-6">Loading skill player...</div>}>
      <PageContent />
    </Suspense>
  );
}
