import { useState } from 'react';
import { useClusterStore } from '../store/clusterStore';

type TabType = 'pods' | 'deployments' | 'services' | 'images';

export function ResourcePanel() {
  const [activeTab, setActiveTab] = useState<TabType>('deployments');
  const state = useClusterStore();

  const tabs: TabType[] = ['pods', 'deployments', 'services', 'images'];

  return (
    <div
      style={{
        width: '300px',
        backgroundColor: '#252526',
        borderLeft: '1px solid #3e3e3e',
        display: 'flex',
        flexDirection: 'column',
        color: '#ccc',
      }}
    >
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #3e3e3e',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Resources
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #3e3e3e',
          backgroundColor: '#2d2d2d',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: activeTab === tab ? '#1e1e1e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #007acc' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {activeTab === 'images' && <ImagesSection images={state.docker.images} />}
        {activeTab === 'deployments' && <DeploymentsSection deployments={state.kubernetes.deployments} />}
        {activeTab === 'pods' && <PodsSection pods={state.kubernetes.pods} />}
        {activeTab === 'services' && <ServicesSection services={state.kubernetes.services} />}
      </div>
    </div>
  );
}

function ImagesSection({ images }: { images: any[] }) {
  if (images.length === 0) {
    return <div style={{ color: '#888', fontSize: '13px' }}>No images built yet</div>;
  }

  return (
    <div>
      {images.map((img) => (
        <div
          key={img.id}
          style={{
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#2d2d2d',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>
            {img.name}:{img.tag}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            ID: {img.id.substring(0, 12)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeploymentsSection({ deployments }: { deployments: any[] }) {
  if (deployments.length === 0) {
    return <div style={{ color: '#888', fontSize: '13px' }}>No deployments</div>;
  }

  return (
    <div>
      {deployments.map((deploy) => (
        <div
          key={deploy.id}
          style={{
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#2d2d2d',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>{deploy.name}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: deploy.availableReplicas === deploy.replicas ? '#0dbc79' : '#e5e510',
                color: '#000',
              }}
            >
              {deploy.availableReplicas}/{deploy.replicas}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            Namespace: {deploy.namespace}
          </div>
        </div>
      ))}
    </div>
  );
}

function PodsSection({ pods }: { pods: any[] }) {
  if (pods.length === 0) {
    return <div style={{ color: '#888', fontSize: '13px' }}>No pods</div>;
  }

  return (
    <div>
      {pods.map((pod) => (
        <div
          key={pod.id}
          style={{
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#2d2d2d',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{pod.name}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '3px',
                backgroundColor: pod.status === 'Running' ? '#0dbc79' : '#888',
                color: '#000',
              }}
            >
              {pod.status}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            Node: {pod.nodeName}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Containers: {pod.containers.length}
          </div>
        </div>
      ))}
    </div>
  );
}

function ServicesSection({ services }: { services: any[] }) {
  if (services.length === 0) {
    return <div style={{ color: '#888', fontSize: '13px' }}>No services</div>;
  }

  return (
    <div>
      {services.map((svc) => (
        <div
          key={svc.id}
          style={{
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#2d2d2d',
            borderRadius: '4px',
            fontSize: '13px',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{svc.name}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            Type: {svc.type}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            ClusterIP: {svc.clusterIP}
          </div>
          {svc.externalIP && (
            <div style={{ fontSize: '11px', color: '#888' }}>
              External: {svc.externalIP}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
