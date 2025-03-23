// Evaluation metric scores
export interface EvalMetrics {
  relevance: number;     // How relevant the retrieved essays are to the question
  accuracy: number;      // Factual correctness compared to golden answer
  completeness: number;  // How completely the system addresses key points
  citation: number;      // Quality of citations and reference to source material
  overall: number;       // Overall quality score
}

// Input for evaluators
export interface EvalInput {
  question: string;
  systemAnswer: string;
  goldenAnswer: string;
  keyPoints: string[];
  retrievedEssays: string[];
}

// Interface for all evaluators
export interface Evaluator {
  evaluate(input: EvalInput): Promise<EvalMetrics>;
} 