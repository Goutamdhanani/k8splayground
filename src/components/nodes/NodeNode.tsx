import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const NodeNode = memo(({ data }: any) => {
  const node = data.node;

  return (
    <div
      style={{
        backgroundColor: '#3e3e3e',
        border: '2px solid #888',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '250px',
        minHeight: '180px',
        color: '#ccc',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#888' }}>
        Node
      </div>
      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
        {node.name}
      </div>
      
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
        Status: <span style={{ color: node.status === 'Ready' ? '#0dbc79' : '#cd3131' }}>{node.status}</span>
      </div>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
        CPU: {node.capacity.cpu} cores
      </div>
      <div style={{ fontSize: '11px', color: '#888' }}>
        Memory: {node.capacity.memory}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
