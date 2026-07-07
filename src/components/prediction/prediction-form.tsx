'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { MapPin, Clock, Tag, Target, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Category, TimeRange } from '@/lib/types';
import { CATEGORY_LABELS, TIME_RANGE_LABELS } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';

interface PredictionFormProps {
  isOpen: boolean;
  onClose: () => void;
  country: { code: string; name: string; lat: number; lng: number };
  onSuccess?: () => void;
}

export function PredictionForm({
  isOpen,
  onClose,
  country,
  onSuccess,
}: PredictionFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expected_outcome: '',
    time_range: '3_months' as TimeRange,
    category: 'politics' as Category,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Tahmin oluşturmak için giriş yapmalısınız.');
        return;
      }

      // Calculate deadline based on time range
      const deadline = new Date();
      const daysMap: Record<TimeRange, number> = {
        '1_month': 30,
        '3_months': 90,
        '6_months': 180,
        '1_year': 365,
      };
      deadline.setDate(deadline.getDate() + daysMap[formData.time_range]);

      const { error } = await supabase.from('predictions').insert({
        user_id: user.id,
        country_code: country.code,
        country_name: country.name,
        title: formData.title,
        description: formData.description,
        expected_outcome: formData.expected_outcome,
        time_range: formData.time_range,
        category: formData.category,
        deadline: deadline.toISOString(),
        status: 'active',
      });

      if (error) throw error;

      setFormData({
        title: '',
        description: '',
        expected_outcome: '',
        time_range: '3_months',
        category: 'politics',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating prediction:', error);
      alert('Tahmin oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const timeRangeOptions = Object.entries(TIME_RANGE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Tahmin Oluştur" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Country */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-medium">{country.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">{country.code}</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tahmin Başlığı
          </label>
          <Input
            placeholder="örn: Rusya, Ukrayna'da ilerleme kaydedecek"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tahmin Açıklaması</label>
          <Textarea
            placeholder="Bu tahmini neden yapıyorsun? Detaylı açıklama yaz..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            maxLength={1000}
            rows={4}
          />
        </div>

        {/* Expected Outcome */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Beklenen Sonuç
          </label>
          <Textarea
            placeholder="Tahminin gerçekleşirse nasıl bir sonuç bekliyorsun?"
            value={formData.expected_outcome}
            onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
            required
            maxLength={500}
            rows={2}
          />
        </div>

        {/* Time Range & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Zaman Dilimi
            </label>
            <Select
              options={timeRangeOptions}
              value={formData.time_range}
              onChange={(e) => setFormData({ ...formData, time_range: e.target.value as TimeRange })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <Select
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
            />
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Tahmin Oluştur
            </>
          )}
        </Button>
      </form>
    </Modal>
  );
}
