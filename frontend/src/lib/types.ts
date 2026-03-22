export type Topic = "cs.CL" | "cs.LG" | "cs.AI" | "stat.ML" | "cs.CV";

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  primaryCategory: Topic;
  categories: Topic[];
  publishedAt: string;
  arxivUrl: string;
  pdfUrl: string;
}

export interface ConnectionProfile {
  name?: string;
  alias?: string;
  bio: string;
  topics: string[];
}
