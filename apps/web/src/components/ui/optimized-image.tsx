'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  variants?: Record<string, string>;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  showLoader?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
};

export default function OptimizedImage({
  src,
  alt,
  variants,
  fallback = '/placeholder-image.jpg',
  className,
  containerClassName,
  showLoader = true,
  aspectRatio,
  width,
  height,
  sizes,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate sizes attribute for responsive images
  const responsiveSizes = sizes || 
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Generate srcSet from variants if available
  const srcSet = variants ? Object.entries(variants)
    .map(([size, url]) => {
      const sizeMap: Record<string, string> = {
        thumbnail: '150w',
        small: '300w',
        medium: '600w',
        large: '1200w',
        hero: '1920w',
      };
      return `${url} ${sizeMap[size] || '1x'}`;
    }).join(', ') : undefined;

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
    }
  };

  // Determine aspect ratio class
  let aspectClass = '';
  if (typeof aspectRatio === 'string') {
    aspectClass = aspectRatioClasses[aspectRatio];
  } else if (typeof aspectRatio === 'number') {
    aspectClass = `aspect-[${aspectRatio}]`;
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        aspectClass,
        containerClassName
      )}
    >
      {/* Loading placeholder */}
      {isLoading && showLoader && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={responsiveSizes}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...(srcSet && { 'data-srcset': srcSet })}
        {...props}
      />
    </div>
  );
}

// Preset components for common use cases
export function PropertyImage({
  src,
  alt,
  variants,
  className,
  ...props
}: Omit<OptimizedImageProps, 'aspectRatio'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      variants={variants}
      aspectRatio="landscape"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={cn('object-cover', className)}
      {...props}
    />
  );
}

export function HeroImage({
  src,
  alt,
  variants,
  className,
  ...props
}: Omit<OptimizedImageProps, 'aspectRatio' | 'priority'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      variants={variants}
      aspectRatio="video"
      priority={true}
      sizes="100vw"
      className={cn('object-cover', className)}
      {...props}
    />
  );
}

export function ThumbnailImage({
  src,
  alt,
  variants,
  className,
  ...props
}: Omit<OptimizedImageProps, 'aspectRatio'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      variants={variants}
      aspectRatio="square"
      sizes="(max-width: 640px) 150px, 200px"
      className={cn('object-cover', className)}
      {...props}
    />
  );
}

export function AgentAvatar({
  src,
  alt,
  variants,
  className,
  ...props
}: Omit<OptimizedImageProps, 'aspectRatio'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      variants={variants}
      aspectRatio="square"
      sizes="(max-width: 640px) 64px, 80px"
      className={cn('object-cover rounded-full', className)}
      fallback="/default-avatar.jpg"
      {...props}
    />
  );
}
