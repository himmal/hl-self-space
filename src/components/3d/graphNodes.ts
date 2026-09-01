import { demoData } from "../../data/portfolioData";
import { computeClusterLayout, computeSharedEdges } from "./graphLayout";

// Shared, precomputed node layout for the "Selected Works" (projects) and
// "Engineering Log" (blogs) relational graphs — computed once from the
// static `demoData` and consumed by both `RelationalGraph` (rendering) and
// `CameraRig` (hover-magnetism lookAt bias), so the two layers can never
// drift out of sync.
export const PROJECT_POSITIONS = computeClusterLayout(demoData.projects, (p) => p.tags);
export const BLOG_POSITIONS = computeClusterLayout(demoData.blogs, (b) => b.keywords);
export const BLOG_EDGES = computeSharedEdges(demoData.blogs, (b) => b.keywords);
