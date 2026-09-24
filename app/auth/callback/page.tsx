'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { seedDefaultDataForUser } from '@/lib/seed';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { exchangeCodeForSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const authError = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (authError) {
      setError(errorDescription || authError);
      setTimeout(() => router.replace('/login'), 3000);
      return;
    }

    if (!code) {
      setError('Không tìm thấy mã ủy quyền.');
      setTimeout(() => router.replace('/login'), 3000);
      return;
    }

    (async () => {
      try {
        const { error: exchangeError } = await exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError);
          setTimeout(() => router.replace('/login'), 3000);
          return;
        }

        // Seed default data for new Google users (no-op if already seeded)
        try {
          await seedDefaultDataForUser('');
        } catch {
          // Data may already exist — ignore
        }

        router.replace('/');
      } catch {
        setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
        setTimeout(() => router.replace('/login'), 3000);
      }
    })();
  }, [searchParams, router, exchangeCodeForSession]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Đang chuyển về trang đăng nhập...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang xử lý đăng nhập Google...</p>
        </div>
      )}
    </div>
  );
}
