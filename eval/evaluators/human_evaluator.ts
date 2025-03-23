import { EvalInput, EvalMetrics, Evaluator } from './types';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

/**
 * Evaluator that prompts a human to assess the quality of system responses
 */
export class HumanEvaluator implements Evaluator {
  private rl: readline.Interface;
  private results: any[] = [];
  private resultsFile: string;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Create results file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = path.join(__dirname, '..', 'results');
    
    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    this.resultsFile = path.join(resultsDir, `human_eval_${timestamp}.json`);
  }
  
  private async promptForScore(criteria: string, description: string): Promise<number> {
    return new Promise((resolve) => {
      this.rl.question(`${criteria} (1-10, ${description}): `, (answer) => {
        const score = parseInt(answer, 10);
        if (isNaN(score) || score < 1 || score > 10) {
          console.log('Please enter a number between 1 and 10');
          resolve(this.promptForScore(criteria, description));
        } else {
          resolve(score);
        }
      });
    });
  }
  
  private saveResults() {
    fs.writeFileSync(this.resultsFile, JSON.stringify(this.results, null, 2));
    console.log(`Results saved to ${this.resultsFile}`);
  }

  async evaluate(input: EvalInput): Promise<EvalMetrics> {
    const { question, systemAnswer, goldenAnswer, keyPoints, retrievedEssays } = input;
    
    // Display information for human evaluator
    console.log('\n================ HUMAN EVALUATION ================\n');
    console.log(`QUESTION: ${question}\n`);
    
    console.log('SYSTEM ANSWER:');
    console.log(systemAnswer);
    console.log('\n----------------------------------------\n');
    
    console.log('GOLDEN ANSWER:');
    console.log(goldenAnswer);
    console.log('\n----------------------------------------\n');
    
    console.log('KEY POINTS:');
    keyPoints.forEach((point, i) => console.log(`${i+1}. ${point}`));
    console.log('\n----------------------------------------\n');
    
    console.log('RETRIEVED ESSAYS:');
    retrievedEssays.forEach((title, i) => console.log(`${i+1}. ${title}`));
    console.log('\n----------------------------------------\n');
    
    // Prompt for scores
    console.log('Please rate the following on a scale of 1-10:');
    
    const relevance = await this.promptForScore(
      'RELEVANCE', 
      'How relevant were the retrieved essays to answering the question?'
    );
    
    const accuracy = await this.promptForScore(
      'ACCURACY', 
      'How factually accurate is the answer compared to the golden answer?'
    );
    
    const completeness = await this.promptForScore(
      'COMPLETENESS', 
      'How thoroughly does the answer address the key points?'
    );
    
    const citation = await this.promptForScore(
      'CITATION QUALITY', 
      'How well does the system cite specific essays and attribute ideas?'
    );
    
    const overall = await this.promptForScore(
      'OVERALL QUALITY', 
      'What is your overall assessment of the answer quality?'
    );
    
    // Prompt for comments
    let comments = '';
    await new Promise<void>((resolve) => {
      this.rl.question('Any additional comments or improvement suggestions? ', (answer) => {
        comments = answer;
        resolve();
      });
    });
    
    // Save result
    const result = {
      question,
      systemAnswer,
      goldenAnswer: goldenAnswer,
      keyPoints,
      retrievedEssays,
      scores: {
        relevance,
        accuracy,
        completeness,
        citation,
        overall
      },
      comments
    };
    
    this.results.push(result);
    this.saveResults();
    
    // Normalize scores to be between 0 and 1
    const metrics: EvalMetrics = {
      relevance: relevance / 10,
      accuracy: accuracy / 10,
      completeness: completeness / 10,
      citation: citation / 10,
      overall: overall / 10
    };
    
    return metrics;
  }
  
  close() {
    this.rl.close();
  }
} 