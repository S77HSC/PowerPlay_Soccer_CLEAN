'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TournamentPlayContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get('match');

  return (
    <div className="text-white text-center">
      Playing match: <strong>{matchId}</strong>
    </div>
  );
}
