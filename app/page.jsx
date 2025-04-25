'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        router.push('/homepage'); // user is logged in
      } else {
        router.push('/login'); // not logged in
      }
    };

    checkUser();
  }, [router]);

  return null;
}
