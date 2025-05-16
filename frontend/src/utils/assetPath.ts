/**
 * Utility to get the correct asset path whether in development or production (GitHub Pages)
 * @param path The path to the asset relative to the public folder
 * @returns The correct path to the asset
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // In production, assets are under /LendFlow/
  // In development, assets are at the root
  const basePath = import.meta.env.PROD ? '/LendFlow/' : '/';
  
  return `${basePath}${cleanPath}`;
} 