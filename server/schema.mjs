import { z } from 'zod';

const band = z.number().min(0).max(9).multipleOf(0.5).nullable();
const feedbackText = z.string().min(1).max(3000);

// All fields are required so the same schema works with strict OpenAI output.
export const assessmentSchema = z.object({
  skill: z.enum(['writing', 'speaking']),
  band,
  criteria: z.array(z.object({
    name: z.string().min(1).max(100), band, feedback: feedbackText,
  }).strict()).min(3).max(4),
  summary: feedbackText,
  mistakes: z.array(z.object({
    original: z.string().max(1200),
    correction: z.string().max(1200),
    explanation: feedbackText,
  }).strict()).max(12),
  improvedAnswer: z.string().max(16000),
  nextSteps: z.array(feedbackText).min(1).max(5),
  pronunciationAssessed: z.boolean(),
}).strict();

export const assessmentToolParameters = z.toJSONSchema(assessmentSchema, { target: 'draft-7' });
delete assessmentToolParameters.$schema;

export const assessmentRequestSchema = z.object({
  skill: z.enum(['writing', 'speaking']),
  taskType: z.enum(['task1', 'task2', 'part1', 'part2', 'part3']),
  prompt: z.string().trim().min(1).max(8000),
  response: z.string().trim().min(1).max(20000),
  context: z.string().max(12000).optional(),
}).strict().refine(input => input.skill === 'writing'
  ? ['task1', 'task2'].includes(input.taskType)
  : ['part1', 'part2', 'part3'].includes(input.taskType));

export const realtimeRequestSchema = z.object({
  part: z.enum(['part1', 'part2', 'part3']),
  prompt: z.string().trim().min(1).max(8000),
}).strict();

export function expectedCriteria(skill, taskType) {
  return skill === 'writing'
    ? [taskType === 'task1' ? 'Task Achievement' : 'Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy']
    : ['Fluency and Coherence', 'Lexical Resource', 'Grammatical Range and Accuracy', 'Pronunciation'];
}

const canonical = value => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');

export function normalizeAssessment(value, request) {
  const result = assessmentSchema.parse(value);
  if (result.skill !== request.skill) throw new Error('Invalid assessment skill');
  const names = expectedCriteria(request.skill, request.taskType);
  const criteria = names.map(name => {
    const matches = result.criteria.filter(item => canonical(item.name) === canonical(name));
    if (name === 'Pronunciation' && request.skill === 'speaking') {
      return { name, band: null, feedback: 'Pronunciation cannot be assessed from typed answers. Use the live speaking coach so the model can hear you.' };
    }
    if (matches.length !== 1) throw new Error('Invalid assessment criteria');
    if (name === 'Fluency and Coherence' && request.skill === 'speaking') {
      return { name, band: null, feedback: `${matches[0].feedback}\nThis comments on coherence in the text only; spoken fluency has not been heard and cannot be scored.` };
    }
    return { ...matches[0], name };
  });
  const scores = criteria.map(item => item.band);
  const overall = request.skill === 'writing' && scores.every(score => score !== null)
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 2) / 2
    : null;
  return {
    ...result, criteria, band: overall, pronunciationAssessed: false,
    summary: request.skill === 'speaking'
      ? `${result.summary}\nText-only practice: spoken fluency and pronunciation are unverified; no overall Speaking band is awarded.`
      : `${result.summary}\nAI practice estimate for this task; this is not an official IELTS result.`,
  };
}
