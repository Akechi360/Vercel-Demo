'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Paperclip, UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Input } from './input';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: File[];
  onValueChange?: (files: File[]) => void;
}

export function FileInput({
  value = [],
  onValueChange,
  className,
  multiple,
  accept,
  ...props
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;
    
    const updatedFiles = multiple ? [...value, ...newFiles] : newFiles;
    onValueChange?.(updatedFiles);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...value];
    updatedFiles.splice(index, 1);
    onValueChange?.(updatedFiles);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEvents = useCallback((e: DragEvent<HTMLLabelElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(isOver);
  }, []);

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    const newFiles = Array.from(e.dataTransfer.files);
     if (!newFiles.length) return;

    const updatedFiles = multiple ? [...value, ...newFiles] : newFiles;
    onValueChange?.(updatedFiles);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className={cn(
            'group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-background/50 p-6 text-center transition-colors hover:border-primary/50',
            { 'border-primary bg-primary/10': dragOver }
        )}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={handleDrop}
        htmlFor="file-input"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleButtonClick()}
      >
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <UploadCloud className="h-8 w-8" />
          <span>Arrastra y suelta archivos aquí, o</span>
          <Button type="button" variant="outline" size="sm" onClick={handleButtonClick} className='pointer-events-none'>
            Examinar archivos
          </Button>
        </div>
        <Input
          {...props}
          ref={fileInputRef}
          type="file"
          id="file-input"
          className="sr-only"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
        />
      </label>

      {value.length > 0 && (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{value.length} archivo(s) seleccionado(s)</p>
            <ul className="space-y-2">
                {value.map((file, index) => (
                    <li key={index} className="flex items-center justify-between rounded-md border bg-muted/20 p-2 text-sm">
                        <div className="flex items-center gap-2 truncate">
                            <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="truncate">{file.name}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{file.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className='flex items-center gap-2'>
                             <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFile(index)}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove file</span>
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
}
