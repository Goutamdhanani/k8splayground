import { useState } from 'react';
import * as yaml from 'js-yaml';

interface ExplorerPanelProps {
  files: Record<string, string>;
  onFileSelect: (filename: string) => void;
  onFileCreate: (filename: string, content: string) => void;
  selectedFile: string | null;
}

export function ExplorerPanel({ files, onFileSelect, onFileCreate, selectedFile }: ExplorerPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const filename = newFileName.endsWith('.yaml') ? newFileName : `${newFileName}.yaml`;
    const defaultContent = `apiVersion: v1
kind: Pod
metadata:
  name: example-pod
spec:
  containers:
  - name: nginx
    image: nginx:latest
`;
    
    onFileCreate(filename, defaultContent);
    setNewFileName('');
    setIsCreating(false);
  };

  const isFileValid = (content: string): boolean => {
    try {
      yaml.loadAll(content);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div
      style={{
        width: '250px',
        backgroundColor: '#252526',
        borderRight: '1px solid #3e3e3e',
        display: 'flex',
        flexDirection: 'column',
        color: '#ccc',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #3e3e3e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Explorer
        </span>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ccc',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 4px',
          }}
          title="New File"
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {isCreating && (
          <div style={{ padding: '8px 12px', backgroundColor: '#2d2d2d' }}>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              placeholder="filename.yaml"
              autoFocus
              style={{
                width: '100%',
                padding: '4px 8px',
                backgroundColor: '#3c3c3c',
                border: '1px solid #007acc',
                color: '#ccc',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        )}

        {Object.keys(files).map((filename) => {
          const isValid = isFileValid(files[filename]);
          const isSelected = filename === selectedFile;

          return (
            <div
              key={filename}
              onClick={() => onFileSelect(filename)}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#37373d' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#2a2d2e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isValid ? '#0dbc79' : '#cd3131',
                  flexShrink: 0,
                }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {filename}
              </span>
            </div>
          );
        })}

        {Object.keys(files).length === 0 && !isCreating && (
          <div style={{ padding: '12px', fontSize: '13px', color: '#888' }}>
            No files yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
