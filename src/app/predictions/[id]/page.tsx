'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft, Heart, MessageCircle, Clock, Target,
  MapPin, Calendar, Share2, Flag
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Prediction } from '@/lib/types';
import { CATEGORY_LABELS, TIME_RANGE_LABELS } from '@/lib/types';

export default function PredictionDetailPage() {
  const params = useParams();
  const predictionId = params.id as string;
  const supabase = createClient();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch prediction with details
      const { data: predictionData } = await supabase
        .from('predictions')
        .select(`
          *,
          user:users(*),
          prediction_scores(*)
        `)
        .eq('id', predictionId)
        .single();
      setPrediction(predictionData);

      // Fetch likes
      const { data: likesData } = await supabase
        .from('likes')
        .select('*')
        .eq('prediction_id', predictionId);
      setLikesCount(likesData?.length || 0);
      setIsLiked(likesData?.some(l => l.user_id === user?.id) || false);

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('prediction_id', predictionId)
        .order('created_at', { ascending: true });
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching prediction:', error);
    } finally {
      setLoading(false);
    }
  }, [predictionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLike = async () => {
    if (!currentUser) {
      alert('Beğenmek için giriş yapmalısınız.');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('prediction_id', predictionId);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase.from('likes').insert({
          user_id: currentUser.id,
          prediction_id: predictionId,
        });
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Yorum yapmak için giriş yapmalısınız.');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await supabase.from('comments').insert({
        user_id: currentUser.id,
        prediction_id: predictionId,
        comment_text: newComment.trim(),
      });
      setNewComment('');
      fetchData();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tahmin Bulunamadı</h1>
          <p className="text-muted-foreground mb-4">
            Bu tahmin mevcut değil veya silinmiş.
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

  const daysRemaining = differenceInDays(new Date(prediction.deadline), new Date());
  const isExpired = daysRemaining <= 0;
  const score = prediction.prediction_scores?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Link>

          {/* Main Content */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge variant="category" category={prediction.category} className="mb-3">
                    {CATEGORY_LABELS[prediction.category]}
                  </Badge>
                  <CardTitle className="text-2xl mb-2">{prediction.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {prediction.country_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {TIME_RANGE_LABELS[prediction.time_range]}
                    </span>
                  </div>
                </div>
                {score && (
                  <div className="text-center p-4 rounded-xl bg-secondary/50">
                    <p className="text-4xl font-bold text-primary">{score.score}</p>
                    <p className="text-xs text-muted-foreground">/ 10</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-medium mb-2">Açıklama</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {prediction.description}
                </p>
              </div>

              {/* Expected Outcome */}
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Beklenen Sonuç
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {prediction.expected_outcome}
                </p>
              </div>

              {/* AI Reasoning */}
              {score && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border">
                  <h3 className="font-medium mb-2">🤖 AI Değerlendirmesi</h3>
                  <p className="text-sm">{score.ai_reasoning}</p>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${prediction.user?.username}`}>
                    <Avatar
                      src={prediction.user?.avatar_url}
                      fallback={prediction.user?.username}
                      size="md"
                    />
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${prediction.user?.username}`}
                      className="font-medium hover:text-primary"
                    >
                      {prediction.user?.username}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(prediction.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  isExpired
                    ? score
                      ? "bg-accent/20 text-accent"
                      : "bg-yellow-500/20 text-yellow-500"
                    : "bg-primary/20 text-primary"
                )}>
                  {isExpired ? (
                    score ? "Tamamlandı" : "Değerlendiriliyor..."
                  ) : (
                    `${Math.abs(daysRemaining)} gün kaldı`
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  onClick={handleLike}
                  className="gap-2"
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  {likesCount} Beğeni
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Paylaş
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <Flag className="h-4 w-4" />
                  Bildir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Yorumlar ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment Form */}
              {currentUser ? (
                <form onSubmit={handleComment} className="flex gap-3">
                  <Avatar
                    src={currentUser.user_metadata?.avatar_url}
                    fallback={currentUser.email}
                    size="sm"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Yorum yaz..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit" disabled={submitting || !newComment.trim()}>
                      {submitting ? 'Gönderiliyor...' : 'Gönder'}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Yorum yapmak için{' '}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    giriş yapın
                  </Link>
                </p>
              )}

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-4 pt-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Link href={`/profile/${comment.user?.username}`}>
                        <Avatar
                          src={comment.user?.avatar_url}
                          fallback={comment.user?.username}
                          size="sm"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${comment.user?.username}`}
                            className="font-medium text-sm hover:text-primary"
                          >
                            {comment.user?.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.comment_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Henüz yorum yok. İlk yorumu sen yap!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
