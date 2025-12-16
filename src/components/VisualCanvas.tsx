import { useEffect } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useClusterStore } from '../store/clusterStore';
import { PodNode } from './nodes/PodNode';
import { DeploymentNode } from './nodes/DeploymentNode';
import { ServiceNode } from './nodes/ServiceNode';
import { NodeNode } from './nodes/NodeNode';
import { ImageRegistryNode } from './nodes/ImageRegistryNode';

const nodeTypes = {
  pod: PodNode,
  deployment: DeploymentNode,
  service: ServiceNode,
  node: NodeNode,
  imageRegistry: ImageRegistryNode,
};

export function VisualCanvas() {
  const state = useClusterStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Image Registry (top)
    if (state.docker.images.length > 0) {
      newNodes.push({
        id: 'image-registry',
        type: 'imageRegistry',
        position: { x: 400, y: 50 },
        data: { images: state.docker.images },
      });
    }

    // Kubernetes Nodes
    state.kubernetes.nodes.forEach((node, idx) => {
      newNodes.push({
        id: node.id,
        type: 'node',
        position: { x: 100 + idx * 700, y: 200 },
        data: { node },
      });
    });

    // Pods
    const podsByNode: Record<string, any[]> = {};
    state.kubernetes.pods.forEach((pod) => {
      if (!podsByNode[pod.nodeName]) {
        podsByNode[pod.nodeName] = [];
      }
      podsByNode[pod.nodeName].push(pod);
    });

    Object.entries(podsByNode).forEach(([nodeName, pods]) => {
      const nodeObj = state.kubernetes.nodes.find((n) => n.name === nodeName);
      if (!nodeObj) return;

      pods.forEach((pod, idx) => {
        const nodeIdx = state.kubernetes.nodes.findIndex((n) => n.name === nodeName);
        newNodes.push({
          id: pod.id,
          type: 'pod',
          position: {
            x: 150 + nodeIdx * 700 + (idx % 3) * 150,
            y: 300 + Math.floor(idx / 3) * 120,
          },
          data: { pod },
        });

        // Edge from node to pod
        newEdges.push({
          id: `${nodeObj.id}-${pod.id}`,
          source: nodeObj.id,
          target: pod.id,
          animated: false,
          style: { stroke: '#555', strokeWidth: 1 },
        });

        // Edge from image registry to pod (if image exists)
        pod.containers.forEach((container: any) => {
          const image = state.docker.images.find(
            (img) => container.image.includes(img.name)
          );
          if (image) {
            newEdges.push({
              id: `image-registry-${pod.id}-${container.id}`,
              source: 'image-registry',
              target: pod.id,
              animated: true,
              style: { stroke: '#007acc', strokeWidth: 2, strokeDasharray: '5,5' },
            });
          }
        });
      });
    });

    // Deployments (visual grouping)
    state.kubernetes.deployments.forEach((deploy, idx) => {
      newNodes.push({
        id: deploy.id,
        type: 'deployment',
        position: { x: 50 + idx * 350, y: 250 },
        data: { deployment: deploy },
      });
    });

    // Services
    state.kubernetes.services.forEach((service, idx) => {
      newNodes.push({
        id: service.id,
        type: 'service',
        position: { x: 100 + idx * 300, y: 550 },
        data: { service },
      });

      // Connect services to matching pods
      state.kubernetes.pods.forEach((pod) => {
        const matches = Object.entries(service.selector).every(
          ([key, value]) => pod.labels[key] === value
        );
        if (matches) {
          newEdges.push({
            id: `${service.id}-${pod.id}`,
            source: service.id,
            target: pod.id,
            animated: true,
            style: { stroke: '#0dbc79', strokeWidth: 2 },
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    state.docker.images,
    state.kubernetes.nodes,
    state.kubernetes.pods,
    state.kubernetes.deployments,
    state.kubernetes.services,
  ]);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1e1e1e' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap
          style={{ backgroundColor: '#2d2d2d' }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'pod':
                return '#007acc';
              case 'service':
                return '#0dbc79';
              case 'deployment':
                return '#e5e510';
              case 'node':
                return '#888';
              default:
                return '#ccc';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
