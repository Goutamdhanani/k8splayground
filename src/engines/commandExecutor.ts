import type { Intent, CommandResult } from '../types/commands';
import { useClusterStore } from '../store/clusterStore';
import * as yaml from 'js-yaml';
import type { Image, Deployment, Service, Pod, Container } from '../types/cluster';

export function executeIntent(intent: Intent, yamlFiles: Record<string, string>): CommandResult {

  switch (intent.action) {
    case 'CREATE_IMAGE':
      return executeCreateImage(intent);
    
    case 'LIST_IMAGES':
      return executeListImages();
    
    case 'CREATE_OR_UPDATE_RESOURCE':
      return executeApply(intent, yamlFiles);
    
    case 'QUERY_STATE':
      return executeGet(intent);
    
    case 'QUERY_DETAILS':
      return executeDescribe(intent);
    
    case 'SCALE_RESOURCE':
      return executeScale(intent);
    
    case 'DELETE_RESOURCE':
      return executeDelete(intent);
    
    case 'SHOW_HELP':
      return executeHelp();
    
    default:
      return { success: false, output: '', error: 'Unknown command' };
  }
}

function executeCreateImage(intent: Intent): CommandResult {
  const imageName = intent.metadata?.imageName as string;
  const [name, tag = 'latest'] = imageName.split(':');

  const newImage: Image = {
    id: `img-${Date.now()}`,
    name,
    tag,
    createdAt: new Date(),
  };

  useClusterStore.setState((state) => ({
    docker: {
      ...state.docker,
      images: [...state.docker.images, newImage],
    },
  }));

  useClusterStore.getState().addEvent({
    type: 'Normal',
    reason: 'ImageBuilt',
    message: `Successfully built image ${name}:${tag}`,
    involvedObject: { kind: 'Image', name: imageName },
  });

  return {
    success: true,
    output: `Successfully built ${name}:${tag}\nImage ID: ${newImage.id}`,
  };
}

function executeListImages(): CommandResult {
  const images = useClusterStore.getState().docker.images;

  if (images.length === 0) {
    return { success: true, output: 'No images found' };
  }

  let output = 'REPOSITORY          TAG        IMAGE ID       CREATED\n';
  images.forEach(img => {
    const created = formatTimeSince(img.createdAt);
    output += `${img.name.padEnd(20)}${img.tag.padEnd(11)}${img.id.substring(0, 12).padEnd(15)}${created}\n`;
  });

  return { success: true, output };
}

function executeApply(intent: Intent, yamlFiles: Record<string, string>): CommandResult {
  const filename = intent.metadata?.filename as string;
  const yamlContent = yamlFiles[filename];

  if (!yamlContent) {
    return { success: false, output: '', error: `File not found: ${filename}` };
  }

  try {
    const resources = yaml.loadAll(yamlContent) as any[];
    
    resources.forEach((resource) => {
      if (!resource || !resource.kind) return;

      switch (resource.kind) {
        case 'Deployment':
          applyDeployment(resource);
          break;
        case 'Service':
          applyService(resource);
          break;
        case 'ConfigMap':
          applyConfigMap(resource);
          break;
        case 'Secret':
          applySecret(resource);
          break;
      }
    });

    return {
      success: true,
      output: `Applied configuration from ${filename}`,
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: `Failed to parse YAML: ${error}`,
    };
  }
}

function applyDeployment(resource: any): void {
  const metadata = resource.metadata || {};
  const spec = resource.spec || {};
  
  const deployment: Deployment = {
    id: `deploy-${Date.now()}`,
    name: metadata.name || 'unnamed',
    namespace: metadata.namespace || 'default',
    replicas: spec.replicas || 1,
    availableReplicas: 0,
    labels: metadata.labels || {},
    selector: spec.selector?.matchLabels || {},
    template: {
      labels: spec.template?.metadata?.labels || {},
      containers: (spec.template?.spec?.containers || []).map((c: any) => ({
        name: c.name,
        image: c.image,
        ports: c.ports?.map((p: any) => p.containerPort) || [],
      })),
    },
    createdAt: new Date(),
  };

  useClusterStore.setState((state) => {
    const existing = state.kubernetes.deployments.find(d => d.name === deployment.name && d.namespace === deployment.namespace);
    
    if (existing) {
      return {
        kubernetes: {
          ...state.kubernetes,
          deployments: state.kubernetes.deployments.map(d =>
            d.name === deployment.name && d.namespace === deployment.namespace
              ? { ...deployment, id: d.id, createdAt: d.createdAt }
              : d
          ),
        },
      };
    }

    return {
      kubernetes: {
        ...state.kubernetes,
        deployments: [...state.kubernetes.deployments, deployment],
      },
    };
  });

  // Create pods for the deployment
  // Note: setTimeout simulates asynchronous pod creation like in real Kubernetes
  setTimeout(() => createPodsForDeployment(deployment), 100);

  useClusterStore.getState().addEvent({
    type: 'Normal',
    reason: 'DeploymentCreated',
    message: `Deployment ${deployment.name} created`,
    involvedObject: { kind: 'Deployment', name: deployment.name, namespace: deployment.namespace },
  });
}

function createPodsForDeployment(deployment: Deployment): void {
  const state = useClusterStore.getState();
  const nodes = state.kubernetes.nodes.filter(n => n.status === 'Ready');
  
  if (nodes.length === 0) return;

  const pods: Pod[] = [];
  
  for (let i = 0; i < deployment.replicas; i++) {
    const node = nodes[i % nodes.length];
    const podName = `${deployment.name}-${Math.random().toString(36).substring(2, 10)}`;
    
    const containers: Container[] = deployment.template.containers.map(c => ({
      id: `container-${Date.now()}-${Math.random()}`,
      name: c.name,
      image: c.image,
      status: 'Running',
      ports: c.ports,
    }));

    const pod: Pod = {
      id: `pod-${Date.now()}-${i}`,
      name: podName,
      namespace: deployment.namespace,
      nodeName: node.name,
      status: 'Running',
      containers,
      labels: deployment.template.labels,
      createdAt: new Date(),
    };

    pods.push(pod);
  }

  useClusterStore.setState((state) => ({
    kubernetes: {
      ...state.kubernetes,
      pods: [...state.kubernetes.pods, ...pods],
      deployments: state.kubernetes.deployments.map(d =>
        d.id === deployment.id
          ? { ...d, availableReplicas: d.replicas }
          : d
      ),
    },
  }));

  pods.forEach(pod => {
    useClusterStore.getState().addEvent({
      type: 'Normal',
      reason: 'PodCreated',
      message: `Pod ${pod.name} created on node ${pod.nodeName}`,
      involvedObject: { kind: 'Pod', name: pod.name, namespace: pod.namespace },
    });
  });
}

function applyService(resource: any): void {
  const metadata = resource.metadata || {};
  const spec = resource.spec || {};
  
  const service: Service = {
    id: `svc-${Date.now()}`,
    name: metadata.name || 'unnamed',
    namespace: metadata.namespace || 'default',
    type: spec.type || 'ClusterIP',
    selector: spec.selector || {},
    ports: (spec.ports || []).map((p: any) => ({
      port: p.port,
      targetPort: p.targetPort || p.port,
      nodePort: p.nodePort,
    })),
    clusterIP: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    externalIP: spec.type === 'LoadBalancer' ? `192.168.1.${Math.floor(Math.random() * 255)}` : undefined,
  };

  useClusterStore.setState((state) => {
    const existing = state.kubernetes.services.find(s => s.name === service.name && s.namespace === service.namespace);
    
    if (existing) {
      return {
        kubernetes: {
          ...state.kubernetes,
          services: state.kubernetes.services.map(s =>
            s.name === service.name && s.namespace === service.namespace
              ? { ...service, id: s.id }
              : s
          ),
        },
      };
    }

    return {
      kubernetes: {
        ...state.kubernetes,
        services: [...state.kubernetes.services, service],
      },
    };
  });

  useClusterStore.getState().addEvent({
    type: 'Normal',
    reason: 'ServiceCreated',
    message: `Service ${service.name} created`,
    involvedObject: { kind: 'Service', name: service.name, namespace: service.namespace },
  });
}

function applyConfigMap(resource: any): void {
  const metadata = resource.metadata || {};
  
  const configMap = {
    id: `cm-${Date.now()}`,
    name: metadata.name || 'unnamed',
    namespace: metadata.namespace || 'default',
    data: resource.data || {},
  };

  useClusterStore.setState((state) => ({
    kubernetes: {
      ...state.kubernetes,
      configMaps: [...state.kubernetes.configMaps, configMap],
    },
  }));

  useClusterStore.getState().addEvent({
    type: 'Normal',
    reason: 'ConfigMapCreated',
    message: `ConfigMap ${configMap.name} created`,
    involvedObject: { kind: 'ConfigMap', name: configMap.name, namespace: configMap.namespace },
  });
}

function applySecret(resource: any): void {
  const metadata = resource.metadata || {};
  
  const secret = {
    id: `secret-${Date.now()}`,
    name: metadata.name || 'unnamed',
    namespace: metadata.namespace || 'default',
    type: resource.type || 'Opaque',
    data: resource.data || {},
  };

  useClusterStore.setState((state) => ({
    kubernetes: {
      ...state.kubernetes,
      secrets: [...state.kubernetes.secrets, secret],
    },
  }));

  useClusterStore.getState().addEvent({
    type: 'Normal',
    reason: 'SecretCreated',
    message: `Secret ${secret.name} created`,
    involvedObject: { kind: 'Secret', name: secret.name, namespace: secret.namespace },
  });
}

function executeGet(intent: Intent): CommandResult {
  const state = useClusterStore.getState();
  const namespace = intent.namespace || 'default';

  switch (intent.resourceType) {
    case 'pods':
    case 'pod':
      return getPodsOutput(state.kubernetes.pods, namespace, intent.resourceName);
    
    case 'deployments':
    case 'deployment':
    case 'deploy':
      return getDeploymentsOutput(state.kubernetes.deployments, namespace, intent.resourceName);
    
    case 'services':
    case 'service':
    case 'svc':
      return getServicesOutput(state.kubernetes.services, namespace, intent.resourceName);
    
    case 'nodes':
    case 'node':
      return getNodesOutput(state.kubernetes.nodes, intent.resourceName);
    
    default:
      return { success: false, output: '', error: `Unknown resource type: ${intent.resourceType}` };
  }
}

function getPodsOutput(pods: Pod[], namespace: string, name?: string): CommandResult {
  let filtered = pods.filter(p => p.namespace === namespace);
  if (name) {
    filtered = filtered.filter(p => p.name === name);
  }

  if (filtered.length === 0) {
    return { success: true, output: 'No resources found' };
  }

  let output = 'NAME                    READY   STATUS    RESTARTS   AGE\n';
  filtered.forEach(pod => {
    const ready = `${pod.containers.filter(c => c.status === 'Running').length}/${pod.containers.length}`;
    const age = formatTimeSince(pod.createdAt);
    output += `${pod.name.padEnd(24)}${ready.padEnd(8)}${pod.status.padEnd(10)}0          ${age}\n`;
  });

  return { success: true, output };
}

function getDeploymentsOutput(deployments: Deployment[], namespace: string, name?: string): CommandResult {
  let filtered = deployments.filter(d => d.namespace === namespace);
  if (name) {
    filtered = filtered.filter(d => d.name === name);
  }

  if (filtered.length === 0) {
    return { success: true, output: 'No resources found' };
  }

  let output = 'NAME                 READY   UP-TO-DATE   AVAILABLE   AGE\n';
  filtered.forEach(deploy => {
    const ready = `${deploy.availableReplicas}/${deploy.replicas}`;
    const age = formatTimeSince(deploy.createdAt);
    output += `${deploy.name.padEnd(21)}${ready.padEnd(8)}${deploy.replicas.toString().padEnd(13)}${deploy.availableReplicas.toString().padEnd(12)}${age}\n`;
  });

  return { success: true, output };
}

function getServicesOutput(services: Service[], namespace: string, name?: string): CommandResult {
  let filtered = services.filter(s => s.namespace === namespace);
  if (name) {
    filtered = filtered.filter(s => s.name === name);
  }

  if (filtered.length === 0) {
    return { success: true, output: 'No resources found' };
  }

  let output = 'NAME           TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE\n';
  filtered.forEach(svc => {
    const ports = svc.ports.map(p => `${p.port}:${p.nodePort || p.targetPort}/TCP`).join(',');
    const externalIP = svc.externalIP || '<none>';
    output += `${svc.name.padEnd(15)}${svc.type.padEnd(15)}${(svc.clusterIP || '').padEnd(16)}${externalIP.padEnd(14)}${ports.padEnd(15)}1m\n`;
  });

  return { success: true, output };
}

function getNodesOutput(nodes: any[], name?: string): CommandResult {
  let filtered = nodes;
  if (name) {
    filtered = filtered.filter(n => n.name === name);
  }

  if (filtered.length === 0) {
    return { success: true, output: 'No resources found' };
  }

  let output = 'NAME       STATUS   ROLES           AGE   VERSION\n';
  filtered.forEach(node => {
    output += `${node.name.padEnd(11)}${node.status.padEnd(9)}control-plane   1d    v1.28.0\n`;
  });

  return { success: true, output };
}

function executeDescribe(intent: Intent): CommandResult {
  const state = useClusterStore.getState();
  const namespace = intent.namespace || 'default';

  if (!intent.resourceName) {
    return { success: false, output: '', error: 'Resource name is required' };
  }

  switch (intent.resourceType) {
    case 'pod':
      const pod = state.kubernetes.pods.find(p => p.name === intent.resourceName && p.namespace === namespace);
      if (!pod) {
        return { success: false, output: '', error: `Pod ${intent.resourceName} not found` };
      }
      return { success: true, output: describePod(pod, state.events) };
    
    case 'deployment':
      const deploy = state.kubernetes.deployments.find(d => d.name === intent.resourceName && d.namespace === namespace);
      if (!deploy) {
        return { success: false, output: '', error: `Deployment ${intent.resourceName} not found` };
      }
      return { success: true, output: describeDeployment(deploy, state.events) };
    
    case 'service':
      const svc = state.kubernetes.services.find(s => s.name === intent.resourceName && s.namespace === namespace);
      if (!svc) {
        return { success: false, output: '', error: `Service ${intent.resourceName} not found` };
      }
      return { success: true, output: describeService(svc, state.events) };
    
    default:
      return { success: false, output: '', error: `Unknown resource type: ${intent.resourceType}` };
  }
}

function describePod(pod: Pod, events: any[]): string {
  let output = `Name:         ${pod.name}\n`;
  output += `Namespace:    ${pod.namespace}\n`;
  output += `Node:         ${pod.nodeName}\n`;
  output += `Status:       ${pod.status}\n`;
  output += `Labels:       ${Object.entries(pod.labels).map(([k, v]) => `${k}=${v}`).join('\n              ')}\n`;
  output += `\nContainers:\n`;
  
  pod.containers.forEach(c => {
    output += `  ${c.name}:\n`;
    output += `    Image:  ${c.image}\n`;
    output += `    Status: ${c.status}\n`;
    if (c.ports && c.ports.length > 0) {
      output += `    Ports:  ${c.ports.join(', ')}\n`;
    }
  });

  const podEvents = events.filter(e => e.involvedObject.name === pod.name && e.involvedObject.kind === 'Pod');
  if (podEvents.length > 0) {
    output += `\nEvents:\n`;
    podEvents.slice(-5).forEach(e => {
      output += `  ${e.type}  ${e.reason}  ${e.message}\n`;
    });
  }

  return output;
}

function describeDeployment(deploy: Deployment, events: any[]): string {
  let output = `Name:         ${deploy.name}\n`;
  output += `Namespace:    ${deploy.namespace}\n`;
  output += `Labels:       ${Object.entries(deploy.labels).map(([k, v]) => `${k}=${v}`).join('\n              ')}\n`;
  output += `Replicas:     ${deploy.replicas} desired | ${deploy.availableReplicas} available\n`;
  output += `Selector:     ${Object.entries(deploy.selector).map(([k, v]) => `${k}=${v}`).join(',')}\n`;
  
  const deployEvents = events.filter(e => e.involvedObject.name === deploy.name && e.involvedObject.kind === 'Deployment');
  if (deployEvents.length > 0) {
    output += `\nEvents:\n`;
    deployEvents.slice(-5).forEach(e => {
      output += `  ${e.type}  ${e.reason}  ${e.message}\n`;
    });
  }

  return output;
}

function describeService(svc: Service, _events: any[]): string {
  let output = `Name:         ${svc.name}\n`;
  output += `Namespace:    ${svc.namespace}\n`;
  output += `Type:         ${svc.type}\n`;
  output += `Cluster IP:   ${svc.clusterIP}\n`;
  if (svc.externalIP) {
    output += `External IP:  ${svc.externalIP}\n`;
  }
  output += `Selector:     ${Object.entries(svc.selector).map(([k, v]) => `${k}=${v}`).join(',')}\n`;
  output += `Ports:\n`;
  svc.ports.forEach(p => {
    output += `  Port:        ${p.port} -> ${p.targetPort}\n`;
  });

  return output;
}

function executeScale(intent: Intent): CommandResult {
  const state = useClusterStore.getState();
  const namespace = intent.namespace || 'default';

  if (intent.resourceType !== 'deployment' && intent.resourceType !== 'deploy') {
    return { success: false, output: '', error: 'Only deployments can be scaled' };
  }

  if (!intent.resourceName || !intent.replicas) {
    return { success: false, output: '', error: 'Resource name and replicas are required' };
  }

  const deployment = state.kubernetes.deployments.find(
    d => d.name === intent.resourceName && d.namespace === namespace
  );

  if (!deployment) {
    return { success: false, output: '', error: `Deployment ${intent.resourceName} not found` };
  }

  const oldReplicas = deployment.replicas;
  const newReplicas = intent.replicas;

  useClusterStore.setState((state) => ({
    kubernetes: {
      ...state.kubernetes,
      deployments: state.kubernetes.deployments.map(d =>
        d.name === intent.resourceName && d.namespace === namespace
          ? { ...d, replicas: newReplicas }
          : d
      ),
    },
  }));

  // Adjust pods
  // Note: setTimeout simulates the async nature of scaling operations in real Kubernetes
  setTimeout(() => {
    const currentPods = useClusterStore.getState().kubernetes.pods.filter(
      p => p.namespace === namespace && Object.entries(deployment.selector).every(([k, v]) => p.labels[k] === v)
    );

    if (newReplicas > currentPods.length) {
      // Add pods
      const podsToAdd = newReplicas - currentPods.length;
      const updatedDeployment = useClusterStore.getState().kubernetes.deployments.find(
        d => d.name === intent.resourceName && d.namespace === namespace
      );
      if (updatedDeployment) {
        createPodsForDeployment({ ...updatedDeployment, replicas: podsToAdd });
      }
    } else if (newReplicas < currentPods.length) {
      // Remove pods
      const podsToRemove = currentPods.slice(newReplicas);
      useClusterStore.setState((state) => ({
        kubernetes: {
          ...state.kubernetes,
          pods: state.kubernetes.pods.filter(p => !podsToRemove.find(pr => pr.id === p.id)),
        },
      }));
    }

    useClusterStore.setState((state) => ({
      kubernetes: {
        ...state.kubernetes,
        deployments: state.kubernetes.deployments.map(d =>
          d.name === intent.resourceName && d.namespace === namespace
            ? { ...d, availableReplicas: newReplicas }
            : d
        ),
      },
    }));
  }, 100);

  useClusterStore.getState().addEvent({
    type: 'Normal',
    reason: 'DeploymentScaled',
    message: `Scaled deployment ${intent.resourceName} from ${oldReplicas} to ${newReplicas} replicas`,
    involvedObject: { kind: 'Deployment', name: intent.resourceName, namespace },
  });

  return {
    success: true,
    output: `deployment.apps/${intent.resourceName} scaled`,
  };
}

function executeDelete(intent: Intent): CommandResult {
  const state = useClusterStore.getState();
  const namespace = intent.namespace || 'default';

  if (!intent.resourceName) {
    return { success: false, output: '', error: 'Resource name is required' };
  }

  switch (intent.resourceType) {
    case 'pod':
      const pod = state.kubernetes.pods.find(p => p.name === intent.resourceName && p.namespace === namespace);
      if (!pod) {
        return { success: false, output: '', error: `Pod ${intent.resourceName} not found` };
      }

      useClusterStore.setState((state) => ({
        kubernetes: {
          ...state.kubernetes,
          pods: state.kubernetes.pods.filter(p => p.id !== pod.id),
        },
      }));

      useClusterStore.getState().addEvent({
        type: 'Normal',
        reason: 'PodDeleted',
        message: `Pod ${pod.name} deleted`,
        involvedObject: { kind: 'Pod', name: pod.name, namespace },
      });

      return { success: true, output: `pod "${intent.resourceName}" deleted` };
    
    case 'deployment':
    case 'deploy':
      const deploy = state.kubernetes.deployments.find(d => d.name === intent.resourceName && d.namespace === namespace);
      if (!deploy) {
        return { success: false, output: '', error: `Deployment ${intent.resourceName} not found` };
      }

      // Delete associated pods
      useClusterStore.setState((state) => ({
        kubernetes: {
          ...state.kubernetes,
          deployments: state.kubernetes.deployments.filter(d => d.id !== deploy.id),
          pods: state.kubernetes.pods.filter(p => {
            return !(p.namespace === namespace && Object.entries(deploy.selector).every(([k, v]) => p.labels[k] === v));
          }),
        },
      }));

      useClusterStore.getState().addEvent({
        type: 'Normal',
        reason: 'DeploymentDeleted',
        message: `Deployment ${deploy.name} deleted`,
        involvedObject: { kind: 'Deployment', name: deploy.name, namespace },
      });

      return { success: true, output: `deployment.apps "${intent.resourceName}" deleted` };
    
    case 'service':
    case 'svc':
      const svc = state.kubernetes.services.find(s => s.name === intent.resourceName && s.namespace === namespace);
      if (!svc) {
        return { success: false, output: '', error: `Service ${intent.resourceName} not found` };
      }

      useClusterStore.setState((state) => ({
        kubernetes: {
          ...state.kubernetes,
          services: state.kubernetes.services.filter(s => s.id !== svc.id),
        },
      }));

      useClusterStore.getState().addEvent({
        type: 'Normal',
        reason: 'ServiceDeleted',
        message: `Service ${svc.name} deleted`,
        involvedObject: { kind: 'Service', name: svc.name, namespace },
      });

      return { success: true, output: `service "${intent.resourceName}" deleted` };
    
    default:
      return { success: false, output: '', error: `Unknown resource type: ${intent.resourceType}` };
  }
}

function executeHelp(): CommandResult {
  const helpText = `
Kubernetes Visual Simulator - Available Commands:

Docker Commands:
  docker build -t <image-name> .   Build a virtual Docker image
  docker images                     List all virtual images

Kubectl Commands:
  kubectl apply -f <file>          Apply configuration from a YAML file
  kubectl get <resource>           List resources (pods, deployments, services, nodes)
  kubectl describe <type> <name>   Show detailed information about a resource
  kubectl scale deployment <name> --replicas=<count>  Scale a deployment
  kubectl delete <type> <name>     Delete a resource

Other Commands:
  clear                            Clear the terminal
  help                             Show this help message

Examples:
  docker build -t myapp:1.0 .
  kubectl apply -f deployment.yaml
  kubectl get pods
  kubectl describe pod myapp-123
  kubectl scale deployment myapp --replicas=3
  kubectl delete deployment myapp
`;

  return { success: true, output: helpText };
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
