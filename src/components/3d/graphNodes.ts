import { demoData } from "../../data/portfolioData";
import { computeRadialTreeLayout } from "./graphLayout";

// Shared, precomputed node layout for the "Selected Works" (projects) and
// "Engineering Log" (blogs) relational graphs — computed once from the
// static `demoData` and consumed by both `RelationalGraph` (rendering) and
// `CameraRig` (hover-magnetism lookAt bias), so the two layers can never
// drift out of sync.
export const PROJECT_TREE = computeRadialTreeLayout(demoData.projects, (p) => p.tags);
export const BLOG_TREE = computeRadialTreeLayout(demoData.blogs, (b) => b.keywords);
export const PROJECT_POSITIONS = PROJECT_TREE.items;
export const BLOG_POSITIONS = BLOG_TREE.items;
