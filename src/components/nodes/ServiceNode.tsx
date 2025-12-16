import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const ServiceNode = memo(({ data }: any) => {
  const service = data.service;

  return (
    <div
      style={{
        backgroundColor: '#2d2d2d',
        border: '2px solid #0dbc79',
        borderRadius: '0',
        padding: '12px',
        minWidth: '140px',
        color: '#ccc',
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
        Service
      </div>
      <div style={{ fontSize: '12px', color: '#fff', textAlign: 'center' }}>
        {service.name}
      </div>
      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
        {service.type}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
