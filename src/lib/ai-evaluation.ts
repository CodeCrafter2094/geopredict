import type { Prediction } from '@/lib/types';

interface EvaluationResult {
  score: number;
  reasoning: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function evaluatePrediction(
  prediction: Prediction
): Promise<EvaluationResult> {
  const groqApiKey = process.env.GROQ_API_KEY;

  // If no API key, use rule-based fallback
  if (!groqApiKey) {
    return evaluateWithRules(prediction);
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Sen bir jeopolitik uzmanısın. Kullanıcının tahminlerini 0-10 arasında puanla.

Puanlama kriterleri:
- 10 = Tamamen doğru (tahmin birebir gerçekleşti)
- 7-9 = Büyük ölçüde doğru (tahminin büyük kısmı gerçekleşti)
- 4-6 = Kısmen doğru (tahminin yarısı gerçekleşti)
- 1-3 = Büyük ölçüde yanlış (tahmin yanlıştı)
- 0 = Tamamen yanlış (tahmin tamamen tutmadı)

Açıklama Türkçe olmalı ve en fazla 2 cümle olmalı.

JSON formatında yanıt ver:
{"score": number, "reasoning": "kısa açıklama"}`,
          },
          {
            role: 'user',
            content: `
Ülke: ${prediction.country_name}
Kategori: ${prediction.category}
Başlık: ${prediction.title}
Açıklama: ${prediction.description}
Beklenen Sonuç: ${prediction.expected_outcome}
Tahmin Tarihi: ${new Date(prediction.created_at).toLocaleDateString('tr-TR')}
Son Tarih: ${new Date(prediction.deadline).toLocaleDateString('tr-TR')}

Bu tahminin şu ana kadar ne kadar doğru çıktığını değerlendir. Eğer henüz sonuç belli değilse, "Gelecekte değerlendirilecek" olarak işaretle ve bekleyen durumunu belirt.
`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      try {
        const result = JSON.parse(content);
        return {
          score: Math.max(0, Math.min(10, result.score)),
          reasoning: result.reasoning || 'Değerlendirme tamamlandı.',
        };
      } catch {
        // If JSON parsing fails, try to extract score from text
        const scoreMatch = content.match(/\d+/);
        const score = scoreMatch ? parseInt(scoreMatch[0]) : 5;
        return {
          score: Math.max(0, Math.min(10, score)),
          reasoning: content.slice(0, 200),
        };
      }
    }

    return evaluateWithRules(prediction);
  } catch (error) {
    console.error('Groq API error:', error);
    // Fallback to rule-based evaluation
    return evaluateWithRules(prediction);
  }
}

function evaluateWithRules(prediction: Prediction): EvaluationResult {
  // Rule-based fallback evaluation
  // This is a simple heuristic-based evaluation
  
  const categoryKeywords: Record<string, string[]> = {
    war: ['savaş', 'askeri', 'ord', 'saldırı', 'savunma', 'çatışma', 'kontratak', 'ilerleme'],
    politics: ['seçim', 'hükümet', 'başkan', 'başbakan', 'parti', 'yasama', 'diplomasi'],
    economy: ['ekonomi', 'piyasa', 'borsa', 'enflasyon', 'gsmh', 'ticaret', 'ihracat', 'ithalat'],
    technology: ['teknoloji', 'yapay zeka', 'yazılım', 'donanım', 'inovasyon', 'ar-ge', 'startup'],
  };

  const keywords = categoryKeywords[prediction.category] || [];
  const textToCheck = `${prediction.title} ${prediction.description} ${prediction.expected_outcome}`.toLowerCase();
  
  let matchCount = keywords.filter(kw => textToCheck.includes(kw)).length;
  
  // Calculate base score
  let score = 5 + (matchCount * 0.5);
  
  // Time-based adjustment
  const daysPassed = Math.floor((Date.now() - new Date(prediction.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.floor((new Date(prediction.deadline).getTime() - new Date(prediction.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const progress = totalDays > 0 ? daysPassed / totalDays : 1;

  // Adjust score based on prediction realism
  if (prediction.description.length > 100) score += 1;
  if (prediction.expected_outcome.length > 50) score += 1;
  
  // Add some variance
  score += (Math.random() - 0.5) * 2;

  // Clamp score
  score = Math.max(0, Math.min(10, Math.round(score)));

  return {
    score,
    reasoning: `Kural tabanlı değerlendirme: ${prediction.category} kategorisinde ${matchCount} anahtar kelime eşleşti. Tahmin detay seviyesi: ${prediction.description.length > 100 ? 'yüksek' : 'orta'}.`,
  };
}

export async function checkModeration(
  text: string
): Promise<{ flagged: boolean; reason?: string }> {
  const groqApiKey = process.env.GROQ_API_KEY;

  // Simple keyword-based moderation first
  const bannedWords = ['spam', 'troll', 'gereksiz', 'abuse'];
  const lowerText = text.toLowerCase();
  
  for (const word of bannedWords) {
    if (lowerText.includes(word)) {
      return { flagged: true, reason: `Uygunsuz içerik tespit edildi: ${word}` };
    }
  }

  // If no API key, return false
  if (!groqApiKey) {
    return { flagged: false };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Sen bir içerik moderasyon sistemisisin. Verilen metni kontrol et ve uygunsuz içerik varsa işaretle.',
          },
          {
            role: 'user',
            content: `Şu metni moderasyon açısından değerlendir:\n\n${text}\n\nEğer uygunsuz içerik, spam, troll veya rahatsız edici içerik varsa, bunu belirt. Aksi halde "Temiz" yaz.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';

    if (content.includes('uygunsuz') || content.includes('spam') || content.includes('troll')) {
      return { flagged: true, reason: 'İçerik moderasyon kurallarını ihlal ediyor olabilir.' };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Moderation API error:', error);
    return { flagged: false };
  }
}
