import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const ImageRegistryNode = memo(({ data }: any) => {
  const images = data.images;

  return (
    <div
      style={{
        backgroundColor: '#2d2d2d',
        border: '2px solid #bc3fbc',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        color: '#ccc',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#bc3fbc' }}>
        Image Registry
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {images.slice(0, 6).map((image: any) => (
          <div
            key={image.id}
            style={{
              backgroundColor: '#1e1e1e',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              border: '1px solid #bc3fbc',
            }}
          >
            {image.name}:{image.tag}
          </div>
        ))}
        {images.length > 6 && (
          <div style={{ fontSize: '10px', color: '#888', padding: '4px' }}>
            +{images.length - 6} more
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
