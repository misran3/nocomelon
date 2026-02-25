import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '../ui/button';

interface ImageUploaderProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  const processFile = (file: File) => {
    // If file is larger than 2MB, compress it
    if (file.size > 2 * 1024 * 1024) {
      compressImage(file);
    } else {
      onChange(file);
    }
  };

  const compressImage = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              onChange(newFile);
            }
          },
          'image/jpeg',
          0.8
        );
      };
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (previewUrl) {
    return (
      <div 
        className="relative w-full h-[300px] rounded-2xl overflow-hidden border border-border bg-card group cursor-pointer"
        onClick={triggerFileInput}
      >
        <img 
          src={previewUrl} 
          alt="Uploaded drawing" 
          className="w-full h-full object-contain bg-black/5"
        />
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={clearImage}
          className="absolute top-2 right-2 rounded-full w-8 h-8 shadow-md z-10 hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            Tap to change
          </div>
        </div>
        {/* Hidden input to allow changing file by clicking image */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`
        w-full h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
        ${isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/5'}
      `}
      onClick={triggerFileInput}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <div className="p-4 rounded-full bg-primary/10 text-primary mb-2 transition-transform group-hover:scale-110 duration-200">
        <Camera className="w-10 h-10" />
      </div>
      
      <div className="text-center px-4 space-y-1">
        <p className="text-lg font-medium text-foreground">Tap to upload</p>
        <p className="text-sm text-muted-foreground">
          or drag and drop
        </p>
      </div>

      <Button variant="ghost" size="sm" className="mt-2 pointer-events-none text-muted-foreground">
        <Upload className="w-4 h-4 mr-2" />
        Choose from library
      </Button>
    </div>
  );
}
