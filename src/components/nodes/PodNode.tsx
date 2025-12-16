import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const PodNode = memo(({ data }: any) => {
  const pod = data.pod;

  return (
    <div
      style={{
        backgroundColor: '#2d2d2d',
        border: '2px solid #007acc',
        borderRadius: '20px',
        padding: '12px',
        minWidth: '120px',
        color: '#ccc',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
        Pod
      </div>
      <div style={{ fontSize: '12px', marginBottom: '4px', color: '#fff' }}>
        {pod.name.length > 20 ? pod.name.substring(0, 20) + '...' : pod.name}
      </div>
      
      <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>
        {pod.status}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {pod.containers.slice(0, 2).map((container: any) => (
          <div
            key={container.id}
            style={{
              backgroundColor: '#1e1e1e',
              padding: '4px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: container.status === 'Running' ? '#0dbc79' : '#888',
              }}
            />
            <span>{container.name}</span>
          </div>
        ))}
        {pod.containers.length > 2 && (
          <div style={{ fontSize: '9px', color: '#888' }}>
            +{pod.containers.length - 2} more
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
