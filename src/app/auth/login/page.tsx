'use client';

import { useState } from 'react';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken bir hata oluştu.');
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
          <p className="text-muted-foreground">Jeopolitik tahmin platformuna hoş geldiniz</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Giriş Yap</CardTitle>
            <CardDescription>
              Hesabınıza erişmek için giriş yapın
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Beni hatırla</span>
                </label>
                <Link href="/auth/forgot-password" className="text-primary hover:underline">
                  Şifremi unuttum
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  'Giriş yapılıyor...'
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Hesabın yok mu?{' '}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Kayıt Ol
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <Card className="bg-secondary/30 border-dashed">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Demo hesap: <span className="font-mono text-foreground">demo@geopredict.com</span> / <span className="font-mono text-foreground">demo123</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
