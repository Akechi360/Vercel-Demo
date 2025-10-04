import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

// Utility functions for placeholder images
export function getPlaceholderImage(type: 'avatar' | 'patient' | 'doctor'): string {
  const placeholder = PlaceHolderImages.find(img => img.id === `default-${type}`);
  return placeholder?.imageUrl || '/images/placeholder-avatar.png';
}

export function getPlaceholderByDescription(description: string): ImagePlaceholder | undefined {
  return PlaceHolderImages.find(img => 
    img.description.toLowerCase().includes(description.toLowerCase())
  );
}

export function getAllPlaceholderImages(): ImagePlaceholder[] {
  return PlaceHolderImages;
}
