'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Target, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { LeaderboardEntry } from '@/lib/types';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'year'>('all');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('avg_score', { ascending: false });

      const { data } = await query.limit(50);
      setEntries((data as unknown as LeaderboardEntry[]) || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-400" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Trophy className="h-8 w-8 text-accent" />
                Liderlik Tablosu
              </h1>
              <p className="text-muted-foreground mt-1">
                En iyi jeopolitik tahminciler
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{entries.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Toplam Tahminci</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {entries.length > 0
                        ? (entries.reduce((acc, e) => acc + (e.avg_score || 0), 0) / entries.length).toFixed(1)
                        : '0.0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Ortalama Skor</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {entries[0]?.username || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">1. Sırada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sıralama</CardTitle>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
                  className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  <option value="all">Tüm Zamanlar</option>
                  <option value="month">Bu Ay</option>
                  <option value="year">Bu Yıl</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Yükleniyor...</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Henüz veri yok
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <Link
                      key={entry.id}
                      href={`/profile/${entry.username}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-all",
                        index < 3 && "bg-gradient-to-r from-primary/5 to-transparent"
                      )}
                    >
                      {/* Rank */}
                      <div className="w-12 flex justify-center">
                        {getRankIcon(index + 1)}
                      </div>

                      {/* Avatar & Name */}
                      <Avatar
                        src={entry.avatar_url}
                        fallback={entry.username}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">
                            {entry.username}
                          </span>
                          {index < 3 && (
                            <Badge variant="default" className="bg-accent/20 text-accent">
                              🏆
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {entry.avg_score?.toFixed(1) || '0.0'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Ortalama</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {entry.predictions_count || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Tahmin</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent">
                            {entry.total_score?.toFixed(0) || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Toplam</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
