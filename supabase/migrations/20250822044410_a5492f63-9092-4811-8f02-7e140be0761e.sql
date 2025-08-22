-- Create quizzes table to store quiz sessions
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Quiz',
  source_content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('text', 'pdf')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table to store individual quiz questions
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_answers table to store quiz responses
CREATE TABLE public.user_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, question_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for quizzes (allow public read for now, auth required for create)
CREATE POLICY "Anyone can view quizzes" 
ON public.quizzes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create quizzes" 
ON public.quizzes 
FOR INSERT 
TO authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes" 
ON public.quizzes 
FOR UPDATE 
TO authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

-- Create policies for questions (follow quiz access)
CREATE POLICY "Anyone can view questions" 
ON public.questions 
FOR SELECT 
USING (true);

CREATE POLICY "Questions can be inserted for accessible quizzes" 
ON public.questions 
FOR INSERT 
USING (true);

-- Create policies for user_answers
CREATE POLICY "Users can view their own answers" 
ON public.user_answers 
FOR SELECT 
TO authenticated
USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can create their own answers" 
ON public.user_answers 
FOR INSERT 
TO authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_user_answers_quiz_id ON public.user_answers(quiz_id);
CREATE INDEX idx_user_answers_user_id ON public.user_answers(user_id);