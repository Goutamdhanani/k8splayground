import { Editor } from '@monaco-editor/react';
import { useState } from 'react';
import * as yaml from 'js-yaml';

interface YamlEditorProps {
  filename: string;
  content: string;
  onChange: (filename: string, content: string) => void;
}

export function YamlEditor({ filename, content, onChange }: YamlEditorProps) {
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string>('');

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;

    // Validate YAML
    try {
      yaml.loadAll(value);
      setIsValid(true);
      setError('');
    } catch (e) {
      setIsValid(false);
      setError(e instanceof Error ? e.message : 'Invalid YAML');
    }

    onChange(filename, value);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid #3e3e3e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: '#ccc', fontSize: '14px' }}>{filename}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isValid ? '#0dbc79' : '#cd3131',
            }}
          />
          {!isValid && (
            <span style={{ color: '#cd3131', fontSize: '12px' }}>
              {error}
            </span>
          )}
        </div>
      </div>
      <Editor
        height="100%"
        defaultLanguage="yaml"
        value={content}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
