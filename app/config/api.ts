// API base URL
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ppsudan.org/api';

// Helper function to construct full API URLs
export const getApiUrl = (path: string): string => {
  if (!path) return apiUrl;
  return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};