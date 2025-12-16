import { memo } from 'react';

export const DeploymentNode = memo(({ data }: any) => {
  const deployment = data.deployment;

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        border: '2px dashed #e5e510',
        borderRadius: '8px',
        padding: '8px',
        minWidth: '200px',
        color: '#e5e510',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
        Deployment
      </div>
      <div style={{ fontSize: '12px', color: '#fff' }}>
        {deployment.name}
      </div>
      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
        {deployment.availableReplicas}/{deployment.replicas} replicas
      </div>
    </div>
  );
});
