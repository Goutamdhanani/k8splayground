import { create } from 'zustand';
import type { ClusterState, Event } from '../types/cluster';

interface ClusterStore extends ClusterState {
  addEvent: (event: Omit<Event, 'id' | 'timestamp'>) => void;
  initializeCluster: () => void;
}

const createInitialState = (): ClusterState => ({
  docker: {
    images: [],
  },
  kubernetes: {
    nodes: [
      {
        id: 'node-1',
        name: 'minikube',
        status: 'Ready',
        capacity: {
          cpu: '4',
          memory: '8Gi',
        },
      },
    ],
    deployments: [],
    replicasets: [],
    pods: [],
    services: [],
    ingresses: [],
    configMaps: [],
    secrets: [],
    volumes: [],
    claims: [],
  },
  events: [],
});

export const useClusterStore = create<ClusterStore>((set) => ({
  ...createInitialState(),
  
  addEvent: (event) => set((state) => ({
    events: [
      ...state.events,
      {
        ...event,
        id: `event-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      },
    ],
  })),
  
  initializeCluster: () => set(createInitialState()),
}));
