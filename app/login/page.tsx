'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { seed } from '@/lib/api';
import { onboarding as onboardingApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Church, Loader2, Sparkles, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSamplePrompt, setShowSamplePrompt] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleTemplates, setSampleTemplates] = useState<Array<{ id: string; name: string; is_default: boolean }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      checkOnboardingAndProceed();
    }
  }, [user, loading]);

  async function checkOnboardingAndProceed() {
    if (!user) return;
    const status = await onboardingApi.getStatus();
    if (!status.has_sample_data) {
      setShowSamplePrompt(true);
    } else {
      router.replace('/');
    }
  }

  useEffect(() => {
    if (!showSamplePrompt || !user) return;

    async function loadSampleTemplates() {
      setTemplatesLoading(true);
      setError(null);
      try {
        const { templates, error: templatesError } = await seed.getTemplates();
        if (templatesError) {
          setError(templatesError);
          setSampleTemplates([]);
          return;
        }

        setSampleTemplates(templates || []);
        const defaultTemplate = (templates || []).find((template: { id: string; name: string; is_default: boolean }) => template.is_default);
        setSelectedTemplateId(defaultTemplate?.id || (templates || [])[0]?.id || null);
      } catch {
        setError('Không thể tải dữ liệu mẫu. Vui lòng thử lại.');
      } finally {
        setTemplatesLoading(false);
      }
    }

    loadSampleTemplates();
  }, [showSamplePrompt, user]);

  async function handleImportSample(templateId?: string) {
    setSampleLoading(true);
    try {
      const { error: importError } = await seed.importSampleData(templateId || selectedTemplateId || undefined);
      if (importError) {
        setError(importError);
      } else {
        await onboardingApi.markComplete();
        setShowSamplePrompt(false);
        router.replace('/');
      }
    } catch {
      setError('Không thể nhập dữ liệu mẫu. Vui lòng thử lại.');
    } finally {
      setSampleLoading(false);
    }
  }

  async function handleSkipSample() {
    await onboardingApi.markComplete();
    setShowSamplePrompt(false);
    router.replace('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password, name || undefined);
        if (signUpError) {
          setError(signUpError);
          return;
        }
        const status = await onboardingApi.getStatus();
        if (!status.has_sample_data) {
          setShowSamplePrompt(true);
        } else {
          router.replace('/');
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
          return;
        }
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showSamplePrompt && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Chào mừng bạn!</CardTitle>
            <CardDescription>
              Bạn muốn sử dụng dữ liệu mẫu hay tự tuỳ chỉnh từ đầu?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleImportSample(selectedTemplateId || undefined)}
                disabled={sampleLoading || templatesLoading}
                className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border p-5 text-center transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
              >
                {sampleLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                )}
                <div>
                  <p className="font-semibold">Dùng dữ liệu mẫu</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thời khóa biểu, lịch sinh hoạt, mục tiêu học tập được thiết lập sẵn
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSkipSample}
                disabled={sampleLoading}
                className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border p-5 text-center transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
              >
                <FileText className="h-8 w-8 text-muted-foreground transition-transform group-hover:scale-110" />
                <div>
                  <p className="font-semibold">Tự tuỳ chỉnh</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bắt đầu từ trang trắng và tự thiết lập theo nhu cầu cá nhân
                  </p>
                </div>
              </button>
            </div>

            {templatesLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách mẫu...
              </div>
            ) : sampleTemplates.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Chọn mẫu bạn muốn dùng</p>
                <div className="grid gap-2">
                  {sampleTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                        selectedTemplateId === template.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium">{template.name}</span>
                      {template.is_default && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Mặc định
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
              Bạn có thể thay đổi mọi thứ sau khi thiết lập. Dữ liệu mẫu chỉ là điểm khởi đầu.
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Church className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Chủng Sinh Study Planner</CardTitle>
          <CardDescription>
            {mode === 'signin' ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Họ tên (tùy chọn)</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  disabled={submitting}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : mode === 'signin' ? (
                'Đăng nhập'
              ) : (
                'Đăng ký'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {mode === 'signin' ? (
              <p className="text-muted-foreground">
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-primary font-medium hover:underline"
                >
                  Đăng ký
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="text-primary font-medium hover:underline"
                >
                  Đăng nhập
                </button>
              </p>
            )}
          </div>

          {mode === 'signup' && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Sau khi đăng ký, bạn sẽ được hỏi có muốn dùng dữ liệu mẫu hay không.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
