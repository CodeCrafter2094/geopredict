'use client';

import { useState } from 'react';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create user profile in users table
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          username: formData.username,
          email: formData.email,
          role: 'user',
        });

        if (profileError) {
          // If profile creation fails, still redirect but log error
          console.error('Profile creation error:', profileError);
          // Try to update if exists
          await supabase.from('users').upsert({
            id: data.user.id,
            username: formData.username,
            email: formData.email,
          }, { onConflict: 'id' });
        }
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Kayıt olurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <Globe className="h-10 w-10 text-primary" />
          </Link>
          <h1 className="text-2xl font-bold">GeoPredict</h1>
          <p className="text-muted-foreground">Jeopolitik tahmin platformuna katıl</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Kayıt Ol</CardTitle>
            <CardDescription>
              Ücretsiz hesap oluştur ve tahmin yapmaya başla
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Kullanıcı Adı</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="jeopolitik_uzmani"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Password requirements */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3 w-3 ${formData.password.length >= 6 ? 'text-accent' : ''}`} />
                  En az 6 karakter
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3 w-3 ${formData.password === formData.confirmPassword && formData.password ? 'text-accent' : ''}`} />
                  Şifreler eşleşmeli
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  'Hesap oluşturuluyor...'
                ) : (
                  <>
                    Kayıt Ol
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Zaten hesabın var mı?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Giriş Yap
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Kayıt olarak{' '}
          <Link href="#" className="underline">
            Kullanım Koşulları
          </Link>{' '}
          ve{' '}
          <Link href="#" className="underline">
            Gizlilik Politikası
          </Link>
          'nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
