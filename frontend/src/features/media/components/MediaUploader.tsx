import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import styles from './MediaUploader.module.css';

interface UploadItem {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

interface MediaUploaderProps {
  dayID: string;
  tripID: string;
  onUploadComplete: () => void;
}

const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
]);
const ACCEPT = Array.from(ACCEPTED_TYPES).join(',');

export function MediaUploader({ dayID, tripID, onUploadComplete }: MediaUploaderProps) {
  const { token } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => ACCEPTED_TYPES.has(f.type));
    if (fileArray.length === 0) return;

    const startIndex = uploads.length;
    const items: UploadItem[] = fileArray.map((f) => ({
      file: f,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploads((prev) => [...prev, ...items]);

    fileArray.forEach((file, idx) => {
      uploadFile(file, startIndex + idx);
    });
  }, [uploads.length, dayID, tripID, token]);

  function uploadFile(file: File, index: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dayID', dayID);
    formData.append('tripID', tripID);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploads((prev) =>
          prev.map((u, i) => (i === index ? { ...u, progress: pct } : u)),
        );
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploads((prev) =>
          prev.map((u, i) => (i === index ? { ...u, progress: 100, status: 'done' } : u)),
        );
        onUploadComplete();
      } else {
        setUploads((prev) =>
          prev.map((u, i) => (i === index ? { ...u, status: 'error' } : u)),
        );
      }
    });

    xhr.addEventListener('error', () => {
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: 'error' } : u)),
      );
    });

    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }

  const hasActiveUploads = uploads.some((u) => u.status === 'uploading');

  return (
    <div className={styles.uploader}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className={styles.input}
      />

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !hasActiveUploads && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !hasActiveUploads && inputRef.current?.click()}
      >
        <span className={styles.dropzoneIcon}>+</span>
        <span className={styles.dropzoneText}>
          {dragOver
            ? 'Déposer ici'
            : 'Glisser-déposer ou cliquer pour ajouter des photos / vidéos'}
        </span>
      </div>

      {uploads.length > 0 && (
        <div className={styles.progress}>
          {uploads.map((u, i) => (
            <div key={i} className={styles.progressItem}>
              <span className={styles.filename}>{u.file.name}</span>
              {u.status === 'uploading' && (
                <div className={styles.bar}>
                  <div className={styles.barFill} style={{ width: `${u.progress}%` }} />
                </div>
              )}
              {u.status === 'done' && <span className={styles.done}>✓</span>}
              {u.status === 'error' && <span className={styles.error}>✕</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
