import { useState } from 'react';
import { ExplorerPanel } from './components/ExplorerPanel';
import { YamlEditor } from './components/YamlEditor';
import { VisualCanvas } from './components/VisualCanvas';
import { Terminal } from './components/Terminal';
import { ResourcePanel } from './components/ResourcePanel';

const defaultFiles: Record<string, string> = {
  'deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
`,
  'service.yaml': `apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: default
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
`,
};

function App() {
  const [yamlFiles, setYamlFiles] = useState<Record<string, string>>(defaultFiles);
  const [selectedFile, setSelectedFile] = useState<string | null>('deployment.yaml');
  const [showEditor, setShowEditor] = useState(true);

  const handleFileChange = (filename: string, content: string) => {
    setYamlFiles((prev) => ({
      ...prev,
      [filename]: content,
    }));
  };

  const handleFileCreate = (filename: string, content: string) => {
    setYamlFiles((prev) => ({
      ...prev,
      [filename]: content,
    }));
    setSelectedFile(filename);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        color: '#ccc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '50px',
          backgroundColor: '#007acc',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #005a9e',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>
          ☸ Kubernetes Visual Simulator
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Explorer */}
        <ExplorerPanel
          files={yamlFiles}
          onFileSelect={setSelectedFile}
          onFileCreate={handleFileCreate}
          selectedFile={selectedFile}
        />

        {/* Center: Canvas + Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top: Canvas */}
          <div style={{ flex: showEditor ? 0.6 : 1, position: 'relative' }}>
            <VisualCanvas />
            
            {/* Toggle Editor Button */}
            <button
              onClick={() => setShowEditor(!showEditor)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '8px 12px',
                backgroundColor: '#007acc',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                zIndex: 10,
              }}
            >
              {showEditor ? 'Hide Editor' : 'Show Editor'}
            </button>
          </div>

          {/* Bottom: YAML Editor */}
          {showEditor && selectedFile && (
            <div style={{ flex: 0.4, borderTop: '1px solid #3e3e3e' }}>
              <YamlEditor
                filename={selectedFile}
                content={yamlFiles[selectedFile] || ''}
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* Right: Resource Panel */}
        <ResourcePanel />
      </div>

      {/* Bottom: Terminal */}
      <div
        style={{
          height: '250px',
          borderTop: '1px solid #3e3e3e',
        }}
      >
        <Terminal yamlFiles={yamlFiles} />
      </div>
    </div>
  );
}

export default App;
