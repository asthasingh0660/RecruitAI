import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate_id } = body;

    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id required' }, { status: 400 });
    }

    // Get candidate data
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidate_id)
      .single();

    if (candError || !candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Calculate score
    const { score, status: qualStatus } = calculateScore(candidate);

    // Update candidate with calculated score
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        qualification_score: score,
        status: qualStatus,
      })
      .eq('id', candidate_id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true,
      score,
      status: qualStatus,
      message: 'Score calculated and updated successfully'
    });

  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}