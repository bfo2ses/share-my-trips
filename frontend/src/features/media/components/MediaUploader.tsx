import { useState, useRef } from 'react';
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

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';

export function MediaUploader({ dayID, tripID, onUploadComplete }: MediaUploaderProps) {
  const { token } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const items: UploadItem[] = Array.from(files).map((f) => ({
      file: f,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploads((prev) => [...prev, ...items]);

    items.forEach((item, idx) => {
      const offset = uploads.length;
      uploadFile(item.file, offset + idx);
    });
  }

  async function uploadFile(file: File, index: number) {
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

  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const hasActiveUploads = activeUploads.length > 0;

  return (
    <div className={styles.uploader}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className={styles.input}
      />
      <button
        className={styles.addBtn}
        onClick={() => inputRef.current?.click()}
        disabled={hasActiveUploads}
      >
        + Ajouter des photos / vidéos
      </button>

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
