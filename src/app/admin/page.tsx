'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Shield, Users, FileText, AlertTriangle, CheckCircle,
  XCircle, Search, Trash2, Ban, Crown, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { User, Prediction } from '@/lib/types';

export default function AdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'predictions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          return;
        }
      }

      // Fetch users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(usersData || []);

      // Fetch predictions
      const { data: predictionsData } = await supabase
        .from('predictions')
        .select(`
          *,
          user:users(*),
          prediction_scores(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      setPredictions(predictionsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBanUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await supabase.from('users').delete().eq('id', userId);
      fetchData();
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePrediction = async (predictionId: string) => {
    setActionLoading(predictionId);
    try {
      await supabase.from('predictions').delete().eq('id', predictionId);
      fetchData();
    } catch (error) {
      console.error('Error deleting prediction:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlagPrediction = async (predictionId: string) => {
    setActionLoading(predictionId);
    try {
      await supabase
        .from('predictions')
        .update({ is_flagged: true })
        .eq('id', predictionId);
      fetchData();
    } catch (error) {
      console.error('Error flagging prediction:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunEvaluation = async () => {
    setActionLoading('evaluating');
    try {
      const response = await fetch('/api/evaluate', { method: 'POST' });
      const result = await response.json();
      alert(`${result.count} tahmin değerlendirildi.`);
      fetchData();
    } catch (error) {
      console.error('Error running evaluation:', error);
      alert('Değerlendirme sırasında hata oluştu.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPredictions = predictions.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (currentUser) {
    const isAdmin = users.find(u => u.id === currentUser.id)?.role === 'admin';
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Erişim Reddedildi</h1>
              <p className="text-muted-foreground mb-4">
                Bu sayfaya erişim yetkiniz yok.
              </p>
              <Link href="/">
                <Button>Ana Sayfaya Dön</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">
                  Sistem yönetimi ve moderasyon
                </p>
              </div>
            </div>
            <Button
              onClick={handleRunEvaluation}
              disabled={actionLoading === 'evaluating'}
              className="gap-2"
            >
              {actionLoading === 'evaluating' ? (
                <Spinner size="sm" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Değerlendirme Çalıştır
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam Kullanıcı</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">{predictions.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam Tahmin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {predictions.filter(p => p.status === 'evaluated').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Değerlendirilen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">
                      {predictions.filter(p => p.is_flagged).length}
                    </p>
                    <p className="text-xs text-muted-foreground">İşaretli</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Kullanıcılar
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'predictions'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Tahminler
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content */}
          {activeTab === 'users' ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold">
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.username}</span>
                            {user.role === 'admin' && (
                              <Crown className="h-4 w-4 text-accent" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {user.avg_score?.toFixed(1) || '0.0'} ort.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.predictions_count || 0} tahmin
                          </p>
                        </div>
                        {user.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBanUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredPredictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      className={`p-4 hover:bg-secondary/30 ${
                        prediction.is_flagged ? 'bg-destructive/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {prediction.title}
                            </span>
                            {prediction.is_flagged && (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                İşaretli
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            🌍 {prediction.country_name} • {prediction.user?.username}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(prediction.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {prediction.prediction_scores?.[0] && (
                            <Badge variant="outline">
                              Puan: {prediction.prediction_scores[0].score}/10
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFlagPrediction(prediction.id)}
                            disabled={actionLoading === prediction.id}
                            className="text-yellow-500"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrediction(prediction.id)}
                            disabled={actionLoading === prediction.id}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
