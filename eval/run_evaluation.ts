// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { GPT4Evaluator } from './evaluators/gpt4_evaluator';
import { EvalMetrics, Evaluator, EvalInput } from './evaluators/types';
import { getEssaysForQuestion } from '../src/utils/essay_retrieval';
import { askQuestion } from '../src/utils/qa';

// Type for a question from questions.json
interface Question {
  id: number;
  question: string;
  tags: string[];
  related_essays: string[];
}

// Type for a golden answer from golden_answers.json
interface GoldenAnswer {
  id: number;
  answer: string;
  key_points: string[];
}

// Type for an essay
interface Essay {
  title: string;
  content: string;
}

// Type for a system response
interface SystemResponse {
  answer: string;
  retrievedEssays: string[];
  error?: string;
}

// Type for an evaluation result
interface EvaluationResult {
  question: string;
  systemAnswer: string;
  goldenAnswer: string;
  keyPoints: string[];
  retrievedEssays: string[];
  metrics: EvalMetrics;
}

// Load questions from JSON file
const questions: Question[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'questions.json'), 'utf-8')
);

// Load golden answers from JSON file
const goldenAnswers: GoldenAnswer[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'golden_answers.json'), 'utf-8')
);

// Create a map of question ID to golden answer for easy lookup
const answerMap = goldenAnswers.reduce((map: Record<number, GoldenAnswer>, item: GoldenAnswer) => {
  map[item.id] = item;
  return map;
}, {});

// Get a system response for a question
async function getSystemResponse(question: Question): Promise<SystemResponse> {
  try {
    // Retrieve relevant essays
    const retrievedEssays = await getEssaysForQuestion(question.question);
    const essayTitles = retrievedEssays.map((essay: Essay) => essay.title);
    
    // Generate answer
    const answer = await askQuestion(question.question);
    
    return {
      answer,
      retrievedEssays: essayTitles
    };
  } catch (error: unknown) {
    console.error(`Error processing question ${question.id}:`, error);
    return {
      answer: "",
      retrievedEssays: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Evaluate a batch of questions
async function evaluateBatch(batch: Question[], evaluator: Evaluator): Promise<EvaluationResult[]> {
  const results: EvaluationResult[] = [];
  
  for (const question of batch) {
    console.log(`Processing question ${question.id}: ${question.question}`);
    
    // Skip if no golden answer exists
    if (!answerMap[question.id]) {
      console.warn(`No golden answer found for question ${question.id}, skipping`);
      continue;
    }
    
    // Get the system's response
    const systemResponse = await getSystemResponse(question);
    
    // Skip if there was an error
    if (systemResponse.error) {
      console.error(`Error with question ${question.id}: ${systemResponse.error}`);
      continue;
    }
    
    const goldenAnswer = answerMap[question.id];
    
    // Prepare evaluation input
    const evalInput: EvalInput = {
      question: question.question,
      systemAnswer: systemResponse.answer,
      goldenAnswer: goldenAnswer.answer,
      keyPoints: goldenAnswer.key_points,
      retrievedEssays: systemResponse.retrievedEssays,
    };
    
    // Evaluate the response
    console.log(`Evaluating response for question ${question.id}`);
    const metrics = await evaluator.evaluate(evalInput);
    
    // Store the results
    results.push({
      question: question.question,
      systemAnswer: systemResponse.answer,
      goldenAnswer: goldenAnswer.answer,
      keyPoints: goldenAnswer.key_points,
      retrievedEssays: systemResponse.retrievedEssays,
      metrics,
    });
    
    console.log(`Finished evaluating question ${question.id}`);
    console.log("Scores:", metrics);
    console.log("-----------------------------------");
  }
  
  return results;
}

// Calculate average score across all metrics
function averageScore(results: EvaluationResult[]): EvalMetrics {
  const initialMetrics: EvalMetrics = {
    relevance: 0,
    accuracy: 0,
    completeness: 0,
    citation: 0,
    overall: 0
  };
  
  const sum = results.reduce((acc: EvalMetrics, result: EvaluationResult) => {
    acc.relevance += result.metrics.relevance;
    acc.accuracy += result.metrics.accuracy;
    acc.completeness += result.metrics.completeness;
    acc.citation += result.metrics.citation;
    acc.overall += result.metrics.overall;
    return acc;
  }, initialMetrics);
  
  const count = results.length;
  return {
    relevance: sum.relevance / count,
    accuracy: sum.accuracy / count,
    completeness: sum.completeness / count,
    citation: sum.citation / count,
    overall: sum.overall / count
  };
}

// Main function to run the evaluation
async function main() {
  // Use command-line argument for number of questions or default to 5
  const numQuestions = process.argv[2] ? parseInt(process.argv[2], 10) : 5;
  const sampleQuestions = questions.slice(0, numQuestions);
  
  console.log(`Running evaluation on ${sampleQuestions.length} questions`);
  
  // Initialize evaluator
  const evaluator = new GPT4Evaluator();
  
  // Run evaluation
  const results = await evaluateBatch(sampleQuestions, evaluator);
  
  // Calculate and display overall scores
  const averages = averageScore(results);
  console.log("\nEVALUATION SUMMARY");
  console.log("------------------");
  console.log(`Questions evaluated: ${results.length}`);
  console.log(`Average Relevance: ${(averages.relevance * 10).toFixed(2)}/10`);
  console.log(`Average Accuracy: ${(averages.accuracy * 10).toFixed(2)}/10`);
  console.log(`Average Completeness: ${(averages.completeness * 10).toFixed(2)}/10`);
  console.log(`Average Citation Quality: ${(averages.citation * 10).toFixed(2)}/10`);
  console.log(`Average Overall Quality: ${(averages.overall * 10).toFixed(2)}/10`);
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsDir = path.join(__dirname, 'results');
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(resultsDir, `eval_results_${timestamp}.json`),
    JSON.stringify({ results, averages }, null, 2)
  );
  
  console.log(`\nResults saved to eval_results_${timestamp}.json`);
}

// Run the evaluation if this file is executed directly
if (require.main === module) {
  main().catch(err => {
    console.error("Error in evaluation:", err);
    process.exit(1);
  });
} 