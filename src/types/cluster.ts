// Core Cluster State Types

export interface Image {
  id: string;
  name: string;
  tag: string;
  createdAt: Date;
}

export interface Node {
  id: string;
  name: string;
  status: 'Ready' | 'NotReady';
  capacity: {
    cpu: string;
    memory: string;
  };
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'Running' | 'Waiting' | 'Terminated';
  ports?: number[];
}

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  nodeName: string;
  status: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  containers: Container[];
  labels: Record<string, string>;
  createdAt: Date;
}

export interface ReplicaSet {
  id: string;
  name: string;
  namespace: string;
  replicas: number;
  availableReplicas: number;
  labels: Record<string, string>;
  selector: Record<string, string>;
  ownerDeployment?: string;
}

export interface Deployment {
  id: string;
  name: string;
  namespace: string;
  replicas: number;
  availableReplicas: number;
  labels: Record<string, string>;
  selector: Record<string, string>;
  template: {
    labels: Record<string, string>;
    containers: Omit<Container, 'id' | 'status'>[];
  };
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  namespace: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  selector: Record<string, string>;
  ports: {
    port: number;
    targetPort: number;
    nodePort?: number;
  }[];
  clusterIP?: string;
  externalIP?: string;
}

export interface Ingress {
  id: string;
  name: string;
  namespace: string;
  rules: {
    host?: string;
    paths: {
      path: string;
      serviceName: string;
      servicePort: number;
    }[];
  }[];
}

export interface ConfigMap {
  id: string;
  name: string;
  namespace: string;
  data: Record<string, string>;
}

export interface Secret {
  id: string;
  name: string;
  namespace: string;
  type: string;
  data: Record<string, string>;
}

export interface PersistentVolume {
  id: string;
  name: string;
  capacity: string;
  accessModes: string[];
  status: 'Available' | 'Bound' | 'Released' | 'Failed';
  storageClass?: string;
}

export interface PersistentVolumeClaim {
  id: string;
  name: string;
  namespace: string;
  requestedCapacity: string;
  accessModes: string[];
  volumeName?: string;
  status: 'Pending' | 'Bound' | 'Lost';
}

export interface Event {
  id: string;
  timestamp: Date;
  type: 'Normal' | 'Warning' | 'Error';
  reason: string;
  message: string;
  involvedObject: {
    kind: string;
    name: string;
    namespace?: string;
  };
}

export interface ClusterState {
  docker: {
    images: Image[];
  };
  kubernetes: {
    nodes: Node[];
    deployments: Deployment[];
    replicasets: ReplicaSet[];
    pods: Pod[];
    services: Service[];
    ingresses: Ingress[];
    configMaps: ConfigMap[];
    secrets: Secret[];
    volumes: PersistentVolume[];
    claims: PersistentVolumeClaim[];
  };
  events: Event[];
}
