import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://qgnqbsxvtxnkykhhdddc.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { notes, userId, title } = await req.json();

    if (!notes || notes.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Notes content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating quiz for notes:', notes.substring(0, 100) + '...');

    // Create AI prompt for quiz generation
    const prompt = `You are StudySpark, an expert educational assistant. Your task is to create a high-quality, 7-question multiple-choice quiz from the user's notes provided below.

**Instructions:**
1. Carefully read and understand the entire text of the notes.
2. For each question you generate, identify the main sub-topic it relates to from the notes.
3. The questions must be based ONLY on the information present in the provided notes.
4. Return your response ONLY in a valid JSON format, as an array of question objects. Do not include any other text or explanation outside of the JSON structure.

**JSON Format:**
[
  {
    "topic": "The specific sub-topic from the notes",
    "question": "The question text",
    "options": {
      "A": "Option A",
      "B": "Option B", 
      "C": "Option C",
      "D": "Option D"
    },
    "correct_answer": "C",
    "explanation": "A brief explanation of why the answer is correct, based on the notes."
  }
]

**User's Notes:**
---
${notes}
---`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are StudySpark, an expert educational assistant that creates quizzes from study notes. Always return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate quiz' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content;

    // Clean up the response to ensure it's valid JSON
    generatedText = generatedText.trim();
    if (generatedText.startsWith('```json')) {
      generatedText = generatedText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    if (generatedText.startsWith('```')) {
      generatedText = generatedText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    let questions;
    try {
      questions = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Response:', generatedText);
      return new Response(JSON.stringify({ error: 'Invalid quiz format generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid questions format:', questions);
      return new Response(JSON.stringify({ error: 'Invalid quiz format generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);

    // Store quiz in database
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        user_id: userId || null,
        title: title || 'Generated Quiz',
        source_content: notes,
        source_type: 'text'
      }])
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz:', quizError);
      return new Response(JSON.stringify({ error: 'Failed to save quiz' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store questions in database
    const questionsToInsert = questions.map((q: any) => ({
      quiz_id: quizData.id,
      topic: q.topic,
      question_text: q.question,
      option_a: q.options.A,
      option_b: q.options.B,
      option_c: q.options.C,
      option_d: q.options.D,
      correct_answer: q.correct_answer,
      explanation: q.explanation
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Error creating questions:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to save questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Quiz generated successfully:', quizData.id);

    return new Response(JSON.stringify({ 
      questions,
      quizId: quizData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});