'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PredictionCard } from '@/components/prediction/prediction-card';
import { Spinner } from '@/components/ui/spinner';
import { Trophy, Target, Calendar, TrendingUp, ArrowLeft, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { User, Prediction } from '@/lib/types';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Fetch profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        setUser(profileData);

        if (profileData) {
          // Fetch user's predictions
          const { data: predictionsData } = await supabase
            .from('predictions')
            .select(`
              *,
              user:users(*),
              prediction_scores(*),
              _count:likes(count), comments(count)
            `)
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false });
          setPredictions(predictionsData || []);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Kullanıcı Bulunamadı</h1>
          <p className="text-muted-foreground mb-4">
            Aradığınız kullanıcı mevcut değil.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const evaluatedPredictions = predictions.filter(p => p.status === 'evaluated');
  const accuracyPercentage = evaluatedPredictions.length > 0
    ? (evaluatedPredictions.reduce((acc, p) => acc + (p.prediction_scores?.[0]?.score || 0), 0) / evaluatedPredictions.length) * 10
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Link>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar
                  src={user.avatar_url}
                  fallback={user.username}
                  size="lg"
                  className="h-24 w-24 text-2xl"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{user.username}</h1>
                    {user.role === 'admin' && (
                      <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>

                  {isOwnProfile && (
                    <Button variant="outline" size="sm" className="mt-4 gap-2">
                      <Edit2 className="h-4 w-4" />
                      Profili Düzenle
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Target className="h-5 w-5" />
                      <span className="text-2xl font-bold">
                        {user.avg_score?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ortalama</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      <span className="text-2xl font-bold">
                        {user.predictions_count || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tahmin</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold">
                        {user.total_score?.toFixed(0) || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Toplam</p>
                  </div>
                </div>
              </div>

              {/* Accuracy Bar */}
              {evaluatedPredictions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Doğruluk Oranı</span>
                    <span className="text-sm text-muted-foreground">
                      %{accuracyPercentage.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${accuracyPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Predictions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tahminler
            </h2>

            {predictions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Bu kullanıcı henüz tahmin yapmamış.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
