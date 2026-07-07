import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluatePrediction } from '@/lib/ai-evaluation';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get expired predictions that haven't been evaluated
    const { data: expiredPredictions, error: fetchError } = await supabase
      .from('predictions')
      .select('*')
      .eq('status', 'active')
      .lt('deadline', new Date().toISOString())
      .is('is_flagged', false)
      .limit(10);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredPredictions || expiredPredictions.length === 0) {
      return NextResponse.json({ message: 'No predictions to evaluate', count: 0 });
    }

    const results = [];

    for (const prediction of expiredPredictions) {
      try {
        // Evaluate the prediction
        const evaluation = await evaluatePrediction(prediction);

        // Save the score
        const { error: scoreError } = await supabase
          .from('prediction_scores')
          .insert({
            prediction_id: prediction.id,
            score: evaluation.score,
            ai_reasoning: evaluation.reasoning,
            evaluated_at: new Date().toISOString(),
          });

        if (scoreError) {
          console.error('Error saving score:', scoreError);
          continue;
        }

        // Update prediction status
        const { error: updateError } = await supabase
          .from('predictions')
          .update({ status: 'evaluated' })
          .eq('id', prediction.id);

        if (updateError) {
          console.error('Error updating prediction:', updateError);
          continue;
        }

        // Update user stats
        const { data: userPredictions } = await supabase
          .from('prediction_scores')
          .select('score')
          .eq('prediction_id', prediction.id);

        // Get all scores for this user
        const { data: allUserScores } = await supabase
          .from('prediction_scores')
          .select('score')
          .eq('prediction_id', prediction.id);

        // Calculate new average
        const scores = allUserScores?.map(s => s.score) || [];
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
        const totalScore = scores.reduce((a, b) => a + b, 0);

        // Update user stats
        const { data: userData } = await supabase
          .from('users')
          .select('predictions_count')
          .eq('id', prediction.user_id)
          .single();

        await supabase
          .from('users')
          .update({
            avg_score: avgScore,
            total_score: totalScore,
            predictions_count: (userData?.predictions_count || 0) + 1,
          })
          .eq('id', prediction.user_id);

        results.push({
          prediction_id: prediction.id,
          score: evaluation.score,
        });
      } catch (error) {
        console.error('Error evaluating prediction:', error);
      }
    }

    return NextResponse.json({
      message: 'Evaluation complete',
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for checking status
export async function GET() {
  try {
    const supabase = await createClient();

    const { count: pendingCount } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('deadline', new Date().toISOString());

    const { count: totalCount } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true });

    const { count: evaluatedCount } = await supabase
      .from('predictions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'evaluated');

    return NextResponse.json({
      total: totalCount || 0,
      evaluated: evaluatedCount || 0,
      pending: pendingCount || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
