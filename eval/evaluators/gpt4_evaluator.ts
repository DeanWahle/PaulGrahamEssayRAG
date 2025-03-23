import { EvalInput, EvalMetrics, Evaluator } from './types';
import openai from '../../src/utils/openai';

/**
 * Evaluator that uses GPT-4 to assess the quality of system responses
 */
export class GPT4Evaluator implements Evaluator {
  async evaluate(input: EvalInput): Promise<EvalMetrics> {
    const { question, systemAnswer, goldenAnswer, keyPoints, retrievedEssays } = input;
    
    // Construct the evaluation prompt
    const prompt = `
You are an expert evaluator assessing the quality of a RAG (Retrieval-Augmented Generation) system's responses about Paul Graham's essays.

QUESTION: "${question}"

SYSTEM ANSWER:
${systemAnswer}

GOLDEN ANSWER (Human expert answer, use this as ground truth):
${goldenAnswer}

KEY POINTS that should be addressed (check which ones the system covered):
${keyPoints.map(point => `- ${point}`).join('\n')}

RETRIEVED ESSAYS (essays the system used to generate its answer):
${retrievedEssays.map(title => `- ${title}`).join('\n')}

Please evaluate the system's answer on the following criteria on a scale from 1 to 10:

1. RELEVANCE (1-10): How relevant were the retrieved essays to answering the question? Did the system retrieve the most appropriate essays?

2. ACCURACY (1-10): How factually accurate is the system's answer compared to the golden answer? Does it contain any factual errors or misrepresentations of Paul Graham's views?

3. COMPLETENESS (1-10): How thoroughly does the system's answer address the key points? Does it miss important aspects covered in the golden answer?

4. CITATION QUALITY (1-10): How well does the system cite specific essays and attribute ideas to the correct sources? Are the citations accurate?

5. OVERALL QUALITY (1-10): What is your overall assessment of the system's answer quality?

For each criterion, provide:
- A numerical score from 1 to 10
- A brief explanation justifying your score

Finally, include brief feedback on how the system's answer could be improved.

FORMAT YOUR RESPONSE LIKE THIS EXACTLY:
RELEVANCE: [score]
[explanation]

ACCURACY: [score]
[explanation]

COMPLETENESS: [score]
[explanation]

CITATION QUALITY: [score]
[explanation]

OVERALL QUALITY: [score]
[explanation]

IMPROVEMENT SUGGESTIONS:
[suggestions]
`;

    try {
      // Call GPT-4 to perform the evaluation
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2, // Low temperature for more consistent evaluations
      });

      const response = completion.choices[0].message.content;
      
      // Extract scores using regex
      const relevanceMatch = response.match(/RELEVANCE: (\d+)/);
      const accuracyMatch = response.match(/ACCURACY: (\d+)/);
      const completenessMatch = response.match(/COMPLETENESS: (\d+)/);
      const citationMatch = response.match(/CITATION QUALITY: (\d+)/);
      const overallMatch = response.match(/OVERALL QUALITY: (\d+)/);
      
      const metrics: EvalMetrics = {
        relevance: relevanceMatch ? parseInt(relevanceMatch[1], 10) : 0,
        accuracy: accuracyMatch ? parseInt(accuracyMatch[1], 10) : 0,
        completeness: completenessMatch ? parseInt(completenessMatch[1], 10) : 0,
        citation: citationMatch ? parseInt(citationMatch[1], 10) : 0,
        overall: overallMatch ? parseInt(overallMatch[1], 10) : 0
      };
      
      // Normalize scores to be between 0 and 1
      Object.keys(metrics).forEach(key => {
        metrics[key] = metrics[key] / 10;
      });
      
      return metrics;
    } catch (error) {
      console.error("Error in GPT-4 evaluation:", error);
      
      // Return zeros in case of failure
      return {
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        citation: 0,
        overall: 0
      };
    }
  }
} 