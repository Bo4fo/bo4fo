/// <reference types="vite/client" />

// Ambient declarations so TypeScript/the IDE can resolve static asset imports
// (this project has no tsconfig, so these are declared explicitly to be safe).
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.jpeg" {
  const src: string;
  export default src;
}
declare module "*.gif" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.ico" {
  const src: string;
  export default src;
}
