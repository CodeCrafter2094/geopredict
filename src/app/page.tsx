'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { WorldMap } from '@/components/map/world-map';
import { PredictionForm } from '@/components/prediction/prediction-form';
import { PredictionCard } from '@/components/prediction/prediction-card';
import { LeaderboardWidget } from '@/components/leaderboard/leaderboard-widget';
import { Spinner } from '@/components/ui/spinner';
import { TrendingUp, Clock, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Prediction, LeaderboardEntry } from '@/lib/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'top'>('all');
  const [likedPredictions, setLikedPredictions] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch predictions with user data
      let query = supabase
        .from('predictions')
        .select(`
          *,
          user:users(*),
          prediction_scores(*),
          _count:likes(count), comments(count)
        `)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false });

      if (filter === 'top') {
        query = query.is('prediction_scores', null);
      } else if (filter === 'recent') {
        query = query.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      }

      const { data: predictionsData } = await query.limit(20);
      setPredictions(predictionsData || []);

      // Fetch leaderboard
      const { data: leaderboardData } = await supabase
        .from('users')
        .select('*')
        .order('avg_score', { ascending: false })
        .limit(10);
      setLeaderboard((leaderboardData as unknown as LeaderboardEntry[]) || []);

      // Fetch user's liked predictions
      if (user) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('prediction_id')
          .eq('user_id', user.id);
        setLikedPredictions(new Set(likesData?.map(l => l.prediction_id) || []));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCountrySelect = (country: { code: string; name: string; lat: number; lng: number }) => {
    if (!user) {
      alert('Tahmin oluşturmak için giriş yapmalısınız.');
      return;
    }
    setSelectedCountry(country);
    setShowForm(true);
  };

  const handleLike = async (predictionId: string) => {
    if (!user) {
      alert('Beğenmek için giriş yapmalısınız.');
      return;
    }

    try {
      if (likedPredictions.has(predictionId)) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('prediction_id', predictionId);
        setLikedPredictions(prev => {
          const next = new Set(prev);
          next.delete(predictionId);
          return next;
        });
      } else {
        // Like
        await supabase.from('likes').insert({
          user_id: user.id,
          prediction_id: predictionId,
        });
        setLikedPredictions(prev => new Set([...prev, predictionId]));
      }

      // Refresh predictions
      fetchData();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Ad Banner Top */}
      <div className="h-20 bg-secondary/30 border-b border-border flex items-center justify-center">
        <div className="text-muted-foreground text-sm">[ Reklam Alanı - 728x90 ]</div>
      </div>

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Section */}
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-border shadow-xl">
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                      🌍 Jeopolitik Tahmin Haritası
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Dünya haritasına tıklayarak tahmin oluştur
                    </p>
                  </div>
                </div>
                <WorldMap
                  onCountrySelect={handleCountrySelect}
                  className="h-[500px] shadow-2xl border border-border"
                />
              </div>

              {/* Predictions Feed */}
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Tahminler
                  </h2>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as typeof filter)}
                      className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">Tümü</option>
                      <option value="recent">Son 7 Gün</option>
                      <option value="top">Henüz Puanlanmamış</option>
                    </select>
                  </div>
                </div>

                {/* Feed */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Spinner size="lg" />
                  </div>
                ) : predictions.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">
                      Henüz tahmin yok. İlk tahmini sen yap! 🌍
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {predictions.map((prediction) => (
                      <PredictionCard
                        key={prediction.id}
                        prediction={prediction}
                        onLike={handleLike}
                        isLiked={likedPredictions.has(prediction.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Inline Ad */}
                <div className="h-24 bg-secondary/30 rounded-lg border border-border flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">[ Reklam Alanı - Feed İçi ]</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Leaderboard */}
              <LeaderboardWidget
                entries={leaderboard}
                currentUserId={user?.id}
              />

              {/* Recent Activity */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  Son Aktiviteler
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-muted-foreground">
                      Yeni tahmin oluşturuldu
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">
                      Bir tahmin puanlandı
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-muted-foreground">
                      Yeni kullanıcı katıldı
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar Ad */}
              <div className="h-64 bg-secondary/30 rounded-xl border border-border flex items-center justify-center">
                <span className="text-muted-foreground text-sm">[ Reklam Alanı - 300x250 ]</span>
              </div>

              {/* How it works */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-border p-4 space-y-3">
                <h3 className="font-semibold">Nasıl Çalışır? 🎯</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    Haritaya tıkla ve ülke seç
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    Tahminini detaylı açıkla
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    Zaman dilimi seç (1 ay - 1 yıl)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">4.</span>
                    AI tahminini puanlasın!
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Prediction Form Modal */}
      {selectedCountry && (
        <PredictionForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedCountry(null);
          }}
          country={selectedCountry}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
