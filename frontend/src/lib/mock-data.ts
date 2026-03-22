import type { ConnectionProfile, Paper, Topic } from "@/lib/types";

export const topics: Topic[] = ["cs.CL", "cs.LG", "cs.AI", "stat.ML"];

export const mockFeed: Paper[] = [
  {
    id: "2501.10431",
    title: "Retrieval Signals for Efficient Long-Context Reasoning",
    abstract: "We study retrieval-aware adaptations that improve reasoning quality while limiting context growth in scientific QA workloads.",
    authors: ["A. Nanda", "M. Reed", "L. Park"],
    primaryCategory: "cs.LG",
    categories: ["cs.LG", "cs.AI"],
    publishedAt: "2025-01-18",
    arxivUrl: "https://arxiv.org/abs/2501.10431",
    pdfUrl: "https://arxiv.org/pdf/2501.10431",
  },
  {
    id: "2409.22410",
    title: "Grounded Summarization for Scientific Drafting",
    abstract: "This paper proposes grounded summarization objectives tailored for citation-heavy documents and evaluates factual consistency.",
    authors: ["S. Roy", "E. Jensen"],
    primaryCategory: "cs.CL",
    categories: ["cs.CL", "cs.AI"],
    publishedAt: "2024-09-09",
    arxivUrl: "https://arxiv.org/abs/2409.22410",
    pdfUrl: "https://arxiv.org/pdf/2409.22410",
  },
  {
    id: "2412.00217",
    title: "Risk-Aware Fine-Tuning Under Distribution Shift",
    abstract: "We introduce a risk-aware objective for model adaptation that remains stable under severe data shifts.",
    authors: ["D. Kim", "T. Vale", "R. Singh", "J. Hale"],
    primaryCategory: "stat.ML",
    categories: ["stat.ML", "cs.LG"],
    publishedAt: "2024-12-02",
    arxivUrl: "https://arxiv.org/abs/2412.00217",
    pdfUrl: "https://arxiv.org/pdf/2412.00217",
  },
  {
    id: "2501.09876",
    title: "Multi-Modal Fusion for Enhanced Document Understanding",
    abstract: "We present techniques for fusing text and visual information to improve document comprehension in OCR-heavy workflows.",
    authors: ["J. Chen", "P. Kumar", "Z. Liu"],
    primaryCategory: "cs.CV",
    categories: ["cs.CV", "cs.CL"],
    publishedAt: "2025-01-20",
    arxivUrl: "https://arxiv.org/abs/2501.09876",
    pdfUrl: "https://arxiv.org/pdf/2501.09876",
  },
  {
    id: "2412.15432",
    title: "Efficient Attention Mechanisms for Long Sequences",
    abstract: "A novel sparse attention pattern that reduces complexity while maintaining expressive power for processing very long documents.",
    authors: ["M. Wang", "R. Garcia", "L. Thompson"],
    primaryCategory: "cs.LG",
    categories: ["cs.LG", "stat.ML"],
    publishedAt: "2024-12-28",
    arxivUrl: "https://arxiv.org/abs/2412.15432",
    pdfUrl: "https://arxiv.org/pdf/2412.15432",
  },
];

export const mockConnections: ConnectionProfile[] = [
  {
    name: "GraphNomad",
    alias: "GraphNomad",
    bio: "Reads graph learning papers and practical ML systems work.",
    topics: ["cs.LG", "cs.AI"],
  },
  {
    name: "TokenMason",
    alias: "TokenMason",
    bio: "Focused on NLP efficiency and evaluation methodology.",
    topics: ["cs.CL", "stat.ML"],
  },
  {
    name: "ProofAndPrompt",
    alias: "ProofAndPrompt",
    bio: "Interested in formal methods, robust inference, and model behavior.",
    topics: ["cs.AI", "stat.ML"],
  },
];
