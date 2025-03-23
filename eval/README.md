# Paul Graham Essay RAG Evaluation Toolkit

This toolkit provides a comprehensive framework for evaluating the performance of the Paul Graham Essay RAG (Retrieval-Augmented Generation) system.

## Overview

The evaluation toolkit:

1. Uses a predefined set of questions and golden answers from domain experts
2. Runs these questions through the RAG system
3. Evaluates the responses against golden answers using various metrics
4. Generates detailed reports and statistics

## Evaluation Metrics

The system evaluates responses on five key metrics:

1. **Relevance (1-10)**: How relevant were the retrieved essays to answering the question?
2. **Accuracy (1-10)**: How factually accurate is the answer compared to the golden answer?
3. **Completeness (1-10)**: How thoroughly does the response address the key points?
4. **Citation Quality (1-10)**: How well does the system cite essays and attribute ideas?
5. **Overall Quality (1-10)**: An overall assessment of the response quality

## Directory Structure

```
eval/
├── data/                  # Contains questions and golden answers
│   ├── questions.json     # Set of evaluation questions
│   └── golden_answers.json # Expert-written answers
├── evaluators/            # Evaluation modules
│   ├── types.ts           # Type definitions
│   ├── gpt4_evaluator.ts  # GPT-4 based automated evaluator
│   └── human_evaluator.ts # Interactive human evaluation tool
├── results/               # Stores evaluation results
├── run_evaluation.ts      # Main evaluation script
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## How to Use

### Prerequisites

- Node.js 14+
- The RAG system running locally on port 3000
- API key for OpenAI (for GPT-4 evaluator)

### Installation

```bash
cd eval
npm install
```

### Running Evaluations

#### Automated Evaluation using GPT-4

This runs all evaluation questions through the system and uses GPT-4 to evaluate the responses:

```bash
npm run eval:auto
```

#### Human Evaluation

For manual evaluation of system responses:

```bash
npm run human
```

This will prompt you to score each response interactively.

### Output

Evaluation results are saved in the `results/` directory with timestamped filenames:

- `interim_results_[timestamp].json`: Results saved after each batch
- `final_results_[timestamp].json`: Complete evaluation results with metrics

## Extending the Evaluation Set

To add new questions and golden answers:

1. Edit `data/questions.json` to add new questions
2. Edit `data/golden_answers.json` to add corresponding golden answers
3. Ensure question IDs match between both files

## Result Analysis

The final results provide aggregate statistics including:

- Overall success rate
- Average scores across all metrics
- Detailed breakdown of performance on each question
- Suggestions for improvement

## Future Improvements

- Add support for comparing different versions of the RAG system
- Implement more sophisticated evaluation metrics
- Create a web dashboard for visualization of evaluation results
