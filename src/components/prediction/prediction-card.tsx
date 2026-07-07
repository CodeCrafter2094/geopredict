'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Clock, Flag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Prediction } from '@/lib/types';
import { CATEGORY_LABELS, TIME_RANGE_LABELS } from '@/lib/types';

interface PredictionCardProps {
  prediction: Prediction;
  onLike?: (predictionId: string) => void;
  isLiked?: boolean;
  compact?: boolean;
}

export function PredictionCard({
  prediction,
  onLike,
  isLiked = false,
  compact = false,
}: PredictionCardProps) {
  const daysRemaining = differenceInDays(new Date(prediction.deadline), new Date());
  const isExpired = new Date(prediction.deadline) < new Date();
  const likesCount = prediction._count?.likes || prediction.likes?.length || 0;
  const commentsCount = prediction._count?.comments || prediction.comments?.length || 0;

  const score = prediction.prediction_scores?.[0];

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-accent';
    if (score >= 5) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <Card className={cn(
      'p-4 hover:border-primary/50 transition-all duration-200 group',
      compact ? 'space-y-2' : 'space-y-3'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link href={`/predictions/${prediction.id}`} className="flex-1">
          <h3 className={cn(
            "font-semibold group-hover:text-primary transition-colors line-clamp-2",
            compact ? "text-sm" : "text-base"
          )}>
            {prediction.title}
          </h3>
        </Link>
        {score && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg",
            "bg-secondary/50"
          )}>
            <span className={cn("font-bold", getScoreColor(score.score))}>
              {score.score}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        )}
      </div>

      {/* Country & Category */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="category" category={prediction.category}>
          {CATEGORY_LABELS[prediction.category]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          🌍 {prediction.country_name}
        </span>
      </div>

      {/* Description */}
      {!compact && prediction.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">
          {prediction.description}
        </p>
      )}

      {/* Score explanation */}
      {score && !compact && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground italic">
            💬 {score.ai_reasoning}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar
            src={prediction.user?.avatar_url}
            fallback={prediction.user?.username}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium">
              {prediction.user?.username || 'Anonim'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(prediction.created_at), { addSuffix: true, locale: tr })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-muted-foreground">
          {/* Deadline */}
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isExpired ? "text-destructive" : "text-muted-foreground"
          )}>
            <Clock className="h-3 w-3" />
            {isExpired ? (
              <span>Süre doldu</span>
            ) : (
              <span>{Math.abs(daysRemaining)} gün</span>
            )}
          </div>

          {/* Likes */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onLike?.(prediction.id);
            }}
            className={cn(
              "flex items-center gap-1 text-xs hover:text-primary transition-colors",
              isLiked && "text-primary"
            )}
          >
            <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
            <span>{likesCount}</span>
          </button>

          {/* Comments */}
          <Link
            href={`/predictions/${prediction.id}`}
            className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{commentsCount}</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}
