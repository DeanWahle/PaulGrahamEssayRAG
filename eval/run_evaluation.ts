import fs from 'fs';
import path from 'path';
import { GPT4Evaluator } from './evaluators/gpt4_evaluator';
import { HumanEvaluator } from './evaluators/human_evaluator';
import { EvalMetrics } from './evaluators/types';

// Import fetch for Node.js
const fetch = require('node-fetch');

// Load questions and golden answers
const questionsPath = path.join(__dirname, 'data', 'questions.json');
const answersPath = path.join(__dirname, 'data', 'golden_answers.json');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
const goldenAnswers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));

// Create a mapping of question IDs to golden answers for easier lookup
const answerMap = goldenAnswers.reduce((map, item) => {
  map[item.id] = item;
  return map;
}, {});

// Config
const BATCH_SIZE = 5; // Number of questions to evaluate in parallel
const API_ENDPOINT = 'http://localhost:3000/api';
const OUTPUT_DIR = path.join(__dirname, 'results');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Get system response for a given question
 */
async function getSystemResponse(question: string): Promise<any> {
  try {
    // Step 1: Search for relevant essays
    const searchResponse = await fetch(`${API_ENDPOINT}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question }),
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.statusText}`);
    }
    
    const { essays } = await searchResponse.json();
    
    if (!essays || essays.length === 0) {
      return { 
        status: 'no_essays',
        message: 'No relevant essays found'
      };
    }
    
    // Step 2: Generate summary using the essays
    const summaryResponse = await fetch(`${API_ENDPOINT}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essays, query: question }),
    });
    
    if (!summaryResponse.ok) {
      throw new Error(`Summary API error: ${summaryResponse.statusText}`);
    }
    
    const { summary, references } = await summaryResponse.json();
    
    return {
      status: 'success',
      essays: essays.map(e => ({ title: e.title, url: e.url })).slice(0, 5),
      summary,
      references
    };
  } catch (error) {
    console.error(`Error getting response for question: ${question}`, error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Evaluate a batch of questions
 */
async function evaluateBatch(batch, evaluator) {
  const results = [];
  
  for (const item of batch) {
    const { id, question } = item;
    const goldenAnswer = answerMap[id];
    
    if (!goldenAnswer) {
      console.warn(`No golden answer found for question ID ${id}`);
      continue;
    }
    
    console.log(`Evaluating question ${id}: "${question.substring(0, 50)}..."`);
    
    const systemResponse = await getSystemResponse(question);
    
    if (systemResponse.status !== 'success') {
      console.warn(`Failed to get valid response for question ${id}: ${systemResponse.message}`);
      results.push({
        id,
        question,
        status: 'failed',
        message: systemResponse.message,
        scores: {
          relevance: 0,
          accuracy: 0,
          completeness: 0,
          citation: 0,
          overall: 0
        }
      });
      continue;
    }
    
    // Evaluate the response
    const evaluationResult = await evaluator.evaluate({
      question,
      systemAnswer: systemResponse.summary,
      goldenAnswer: goldenAnswer.answer,
      keyPoints: goldenAnswer.key_points,
      retrievedEssays: systemResponse.essays.map(e => e.title)
    });
    
    results.push({
      id,
      question,
      status: 'success',
      systemResponse: {
        essays: systemResponse.essays,
        summary: systemResponse.summary,
        references: systemResponse.references
      },
      goldenAnswer: goldenAnswer.answer,
      keyPoints: goldenAnswer.key_points,
      scores: evaluationResult
    });
  }
  
  return results;
}

/**
 * Process questions in batches
 */
async function runEvaluation(useHumanEvaluator = false) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Choose evaluator based on argument
  const evaluator = useHumanEvaluator ? new HumanEvaluator() : new GPT4Evaluator();
  const allResults = [];
  
  // Process questions in batches
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchResults = await evaluateBatch(batch, evaluator);
    allResults.push(...batchResults);
    
    // Write interim results
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `interim_results_${timestamp}.json`),
      JSON.stringify(allResults, null, 2)
    );
    
    console.log(`Completed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)}`);
  }
  
  // Close human evaluator if used
  if (useHumanEvaluator) {
    (evaluator as HumanEvaluator).close();
  }
  
  // Calculate aggregate metrics
  const validResults = allResults.filter(result => result.status === 'success');
  const metrics = {
    total: questions.length,
    successful: validResults.length,
    failed: allResults.length - validResults.length,
    averageScores: {
      relevance: averageScore(validResults, 'relevance'),
      accuracy: averageScore(validResults, 'accuracy'),
      completeness: averageScore(validResults, 'completeness'),
      citation: averageScore(validResults, 'citation'),
      overall: averageScore(validResults, 'overall')
    }
  };
  
  // Write final results
  const finalResults = {
    timestamp,
    metrics,
    results: allResults
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `final_results_${timestamp}.json`),
    JSON.stringify(finalResults, null, 2)
  );
  
  console.log("\n===== Evaluation Complete =====");
  console.log(`Total questions: ${metrics.total}`);
  console.log(`Successful evaluations: ${metrics.successful}`);
  console.log(`Failed evaluations: ${metrics.failed}`);
  console.log("\nAverage Scores:");
  console.log(`Relevance: ${metrics.averageScores.relevance.toFixed(2)}`);
  console.log(`Accuracy: ${metrics.averageScores.accuracy.toFixed(2)}`);
  console.log(`Completeness: ${metrics.averageScores.completeness.toFixed(2)}`);
  console.log(`Citation Quality: ${metrics.averageScores.citation.toFixed(2)}`);
  console.log(`Overall: ${metrics.averageScores.overall.toFixed(2)}`);
  console.log(`\nResults saved to: ${path.join(OUTPUT_DIR, `final_results_${timestamp}.json`)}`);
}

/**
 * Helper function to calculate average score
 */
function averageScore(results, metric) {
  const sum = results.reduce((acc, result) => acc + (result.scores[metric] || 0), 0);
  return sum / results.length;
}

// Run the evaluation when script is executed directly
if (require.main === module) {
  // Check if human evaluation is requested
  const useHumanEvaluator = process.argv.includes('--human');
  
  console.log(`Starting evaluation with ${useHumanEvaluator ? 'human' : 'GPT-4'} evaluator...`);
  
  runEvaluation(useHumanEvaluator).catch(error => {
    console.error("Evaluation failed:", error);
    process.exit(1);
  });
}

export { runEvaluation }; 