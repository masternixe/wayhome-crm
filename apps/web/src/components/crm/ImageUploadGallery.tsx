'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  PhotoIcon, 
  PlusIcon, 
  XMarkIcon,
  ArrowUpTrayIcon,
  StarIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/20/solid';

interface ImageUploadGalleryProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  canEdit?: boolean;
  propertyId?: string;
}

export default function ImageUploadGallery({ 
  images, 
  onImagesChange, 
  canEdit = true,
  propertyId 
}: ImageUploadGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'property_image');
    if (propertyId) {
      formData.append('propertyId', propertyId);
    }

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return result.data.url;
  };

  const handleFileSelect = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        return uploadImage(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls];
      onImagesChange(newImages);
      
      alert(`✅ ${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Image upload error:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to upload images'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop reordering functions
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove dragged item
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          📸 Galeria e Imazheve
        </h2>
        
        {canEdit && (
          <button
            type="button"
            onClick={openFileDialog}
            disabled={uploading}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: uploading ? '#9ca3af' : '#2563eb', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              border: 'none',
              borderRadius: '0.5rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {uploading ? '⏳' : <ArrowUpTrayIcon style={{ width: '1rem', height: '1rem' }} />}
            {uploading ? 'Duke ngarkuar...' : 'Ngarko Imazhe'}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Drag & Drop Area */}
      {canEdit && images.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          style={{
            border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`,
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            background: dragOver ? '#f0f9ff' : '#f9fafb',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1rem'
          }}
        >
          <PhotoIcon style={{ 
            width: '4rem', 
            height: '4rem', 
            color: dragOver ? '#2563eb' : '#d1d5db', 
            margin: '0 auto 1rem auto' 
          }} />
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '0.5rem', 
            color: dragOver ? '#2563eb' : '#1f2937' 
          }}>
            {dragOver ? 'Drop images here!' : 'Upload Property Images'}
          </h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Drag & drop images here, or click to select files
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
            Supports: JPG, PNG, GIF, WebP (max 5MB each)
          </p>
        </div>
      )}

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {/* Featured Image Preview */}
          {images.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StarIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                Featured Image (First image will be shown on property listings)
              </h3>
              <div style={{ 
                position: 'relative',
                aspectRatio: '16/9',
                maxWidth: '400px',
                background: '#f3f4f6',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: '2px solid #f59e0b',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={images[0]} 
                  alt="Featured property image"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'flex';
                  }}
                />
                <div style={{ 
                  display: 'none',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '100%', 
                  height: '100%',
                  fontSize: '3rem',
                  color: '#6b7280'
                }}>
                  🖼️
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  left: '0.5rem',
                  background: 'rgba(245, 158, 11, 0.9)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <StarIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                  Featured
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail Grid for Reordering */}
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowsUpDownIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
            Image Gallery ({images.length} images) - Drag to reorder
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            {images.map((url, index) => (
              <div 
                key={`${url}-${index}`}
                draggable={canEdit}
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragLeave={handleImageDragLeave}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
                style={{ 
                  position: 'relative',
                  aspectRatio: '1',
                  background: '#f3f4f6',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  border: dragOverIndex === index ? '2px solid #2563eb' : (index === 0 ? '2px solid #f59e0b' : '1px solid #e5e7eb'),
                  boxShadow: draggedIndex === index ? '0 8px 25px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: canEdit ? 'grab' : 'default',
                  transform: draggedIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  opacity: draggedIndex === index ? 0.8 : 1
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={url} 
                  alt={`Property image ${index + 1}`}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    pointerEvents: 'none'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'flex';
                  }}
                />
                <div style={{ 
                  display: 'none',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '100%', 
                  height: '100%',
                  fontSize: '2rem',
                  color: '#6b7280'
                }}>
                  🖼️
                </div>
                
                {canEdit && (
                  <>
                    {/* Image number badge */}
                    <div style={{
                      position: 'absolute',
                      top: '0.25rem',
                      left: '0.25rem',
                      background: index === 0 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.6875rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.125rem'
                    }}>
                      {index === 0 && <StarIcon style={{ width: '0.5rem', height: '0.5rem' }} />}
                      #{index + 1}
                    </div>

                    {/* Move buttons for keyboard accessibility */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0.25rem',
                      left: '0.25rem',
                      display: 'flex',
                      gap: '0.25rem'
                    }}>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, index - 1)}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            background: 'rgba(37, 99, 235, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem'
                          }}
                          title="Move left"
                        >
                          ←
                        </button>
                      )}
                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, index + 1)}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            background: 'rgba(37, 99, 235, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.625rem'
                          }}
                          title="Move right"
                        >
                          →
                        </button>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        width: '1.25rem',
                        height: '1.25rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Remove image"
                    >
                      <XMarkIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </>
                )}
              </div>
            ))}
            
            {/* Add more images button */}
            {canEdit && (
              <div
                onClick={openFileDialog}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  aspectRatio: '1',
                  border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: dragOver ? '#f0f9ff' : '#f9fafb',
                  transition: 'all 0.2s ease',
                  color: dragOver ? '#2563eb' : '#6b7280'
                }}
              >
                <PlusIcon style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  marginBottom: '0.5rem' 
                }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  Add More
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {canEdit && (
        <div style={{ 
          padding: '1rem', 
          background: '#f0f9ff', 
          borderRadius: '0.75rem',
          border: '1px solid #bfdbfe'
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
            💡 Image Upload Tips
          </h4>
          <ul style={{ fontSize: '0.75rem', color: '#374151', margin: 0, paddingLeft: '1rem' }}>
            <li>Supported formats: JPG, PNG, GIF, WebP</li>
            <li>Maximum file size: 5MB per image</li>
            <li>Drag & drop multiple images at once</li>
            <li>First image will be used as the main property photo</li>
            <li>You can reorder images by removing and re-adding them</li>
          </ul>
        </div>
      )}
    </div>
  );
}
