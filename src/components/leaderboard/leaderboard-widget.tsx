'use client';

import Link from 'next/link';
import { Trophy, Medal, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardWidget({ entries, currentUserId }: LeaderboardProps) {
  const topThree = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-accent" />
          Liderlik Tablosu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 */}
        {topThree.length > 0 ? (
          <div className="flex items-end justify-center gap-2 pb-4">
            {topThree[1] && (
              <div className="flex flex-col items-center">
                <Avatar
                  src={topThree[1].avatar_url}
                  fallback={topThree[1].username}
                  size="lg"
                />
                <Medal className="h-5 w-5 text-gray-400 -mt-2" />
                <span className="text-xs font-medium mt-1">{topThree[1].username}</span>
                <span className="text-[10px] text-muted-foreground">
                  {topThree[1].avg_score?.toFixed(1) || '0.0'}
                </span>
              </div>
            )}
            
            {topThree[0] && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar
                    src={topThree[0].avatar_url}
                    fallback={topThree[0].username}
                    size="lg"
                  />
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-[10px] font-bold">1</span>
                  </div>
                </div>
                <Medal className="h-6 w-6 text-yellow-500 -mt-2" />
                <span className="text-sm font-bold mt-1">{topThree[0].username}</span>
                <span className="text-xs text-accent font-medium">
                  {topThree[0].avg_score?.toFixed(1) || '0.0'}
                </span>
              </div>
            )}
            
            {topThree[2] && (
              <div className="flex flex-col items-center">
                <Avatar
                  src={topThree[2].avatar_url}
                  fallback={topThree[2].username}
                  size="lg"
                />
                <Medal className="h-5 w-5 text-orange-400 -mt-2" />
                <span className="text-xs font-medium mt-1">{topThree[2].username}</span>
                <span className="text-[10px] text-muted-foreground">
                  {topThree[2].avg_score?.toFixed(1) || '0.0'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Henüz veri yok
          </div>
        )}

        {/* Rest of leaderboard */}
        {rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((entry, index) => (
              <Link
                key={entry.id}
                href={`/profile/${entry.username}`}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors",
                  entry.id === currentUserId && "bg-primary/10"
                )}
              >
                <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {index + 4}
                </span>
                <Avatar
                  src={entry.avatar_url}
                  fallback={entry.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {entry.username}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {entry.avg_score?.toFixed(1) || '0.0'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {entry.predictions_count || 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* View all link */}
        <Link
          href="/leaderboard"
          className="block text-center text-sm text-primary hover:underline pt-2"
        >
          Tümünü Gör →
        </Link>
      </CardContent>
    </Card>
  );
}
