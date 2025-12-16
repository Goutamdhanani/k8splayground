# Kubernetes Visual Simulator

A deterministic, state-driven, non-executing simulation environment that visually represents Docker and Kubernetes behavior without running real containers, clusters, or networks. This is a rules-based simulator designed for learning Kubernetes concepts through visual feedback.

![Kubernetes Visual Simulator](https://github.com/user-attachments/assets/29399e6c-a0ce-4d57-8931-194ec5c8ab63)

## Features

### 🎯 Core Capabilities
- **Visual Cluster Representation** - Interactive graph showing nodes, pods, deployments, services, and more
- **Terminal Command Execution** - Bash-style terminal with command history and autocomplete
- **YAML Editor** - Monaco-powered editor with syntax highlighting and validation
- **Real-time State Management** - All changes immediately reflected in the visual canvas
- **Event Timeline** - Track all state transitions and resource changes

### 🛠️ Tech Stack
- **React + TypeScript** - Modern UI framework with type safety
- **React Flow** - Visual graph rendering for cluster topology
- **Monaco Editor** - YAML editing with syntax highlighting
- **xterm.js** - Terminal emulation for command execution
- **Zustand** - State management for cluster state
- **Vite** - Fast build tooling and development server

## Architecture

The simulator is built on 4 core engines:

### 1. Input Engine
- Bash-style terminal with command history (↑ ↓ arrows)
- Supports commands: `docker`, `kubectl`, `clear`, `help`
- Context-aware autocomplete
- YAML editor with real-time validation

### 2. Intent Engine
- Parses and validates commands
- Extracts intent from user input
- Maps commands to state mutations:
  - `docker build` → CREATE_IMAGE
  - `kubectl apply` → CREATE_OR_UPDATE_RESOURCE
  - `kubectl scale` → SCALE_RESOURCE
  - `kubectl delete` → DELETE_RESOURCE
  - `kubectl get` → QUERY_STATE
  - `kubectl describe` → QUERY_DETAILS

### 3. Cluster State Engine
Single source of truth managing:
- Docker images
- Kubernetes nodes, pods, deployments, services
- ReplicaSets, ConfigMaps, Secrets
- Persistent volumes and claims
- Event history

### 4. Visual Engine
Pure renderer that displays:
- Virtual Image Registry (Docker images)
- Kubernetes Nodes
- Pods with container details
- Deployments as grouped resources
- Services with animated connection lines
- Network topology and traffic flow

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## Usage

### Supported Commands

#### Docker Commands
```bash
docker build -t <image-name>:<tag> .   # Build a virtual Docker image
docker images                           # List all virtual images
```

#### Kubectl Commands
```bash
# Apply configurations
kubectl apply -f <filename>

# Query resources
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get nodes

# Describe resources
kubectl describe pod <pod-name>
kubectl describe deployment <deployment-name>
kubectl describe service <service-name>

# Scale deployments
kubectl scale deployment <name> --replicas=<count>

# Delete resources
kubectl delete pod <pod-name>
kubectl delete deployment <deployment-name>
kubectl delete service <service-name>

# Other commands
clear                                   # Clear terminal
help                                    # Show help message
```

### Example Workflow

1. **Create a deployment:**
   ```bash
   kubectl apply -f deployment.yaml
   ```

2. **View the pods:**
   ```bash
   kubectl get pods
   ```

3. **Scale the deployment:**
   ```bash
   kubectl scale deployment nginx-deployment --replicas=5
   ```

4. **Create a service:**
   ```bash
   kubectl apply -f service.yaml
   ```

5. **Build a Docker image:**
   ```bash
   docker build -t myapp:1.0 .
   ```

## UI Layout

### 1. Explorer Panel (Left Sidebar)
- File tree showing YAML configuration files
- Validation indicators (green = valid, red = error)
- Create new file button

### 2. Canvas (Center - Main Visual Area)
- Interactive cluster graph
- Nodes, pods, deployments, services visualization
- Animated connections showing traffic flow
- Zoom, pan, and minimap controls

### 3. Resource Panel (Right Sidebar)
- Tabs for Pods, Deployments, Services, Images
- Real-time resource status
- Quick overview of cluster state

### 4. Terminal (Bottom)
- Command execution with realistic output
- Command history with arrow key navigation
- Educational error messages

### 5. YAML Editor (Center Bottom)
- Syntax highlighting for YAML
- Real-time validation
- Toggle visibility

## Key Features

### Visual Feedback
- **Pods** appear as capsules with container icons
- **Deployments** shown as bracketed groups
- **Services** displayed as hexagons
- **Nodes** as large rounded rectangles
- **Image Registry** at the top showing Docker images
- **Animated connections** for service-to-pod routing

### State Management
- All resources stored in a single state tree
- Events logged for every state change
- Deterministic behavior - same commands always produce same results
- No actual containers or networks created

### Educational Focus
- Commands teach Kubernetes concepts
- Error messages explain what went wrong and why
- Visual representation helps understand relationships
- Safe environment to experiment

## Development

### Project Structure
```
src/
├── components/          # UI components
│   ├── nodes/          # React Flow custom nodes
│   ├── ExplorerPanel.tsx
│   ├── ResourcePanel.tsx
│   ├── Terminal.tsx
│   ├── VisualCanvas.tsx
│   └── YamlEditor.tsx
├── engines/            # Core logic engines
│   ├── commandParser.ts
│   ├── intentEngine.ts
│   └── commandExecutor.ts
├── store/              # State management
│   └── clusterStore.ts
├── types/              # TypeScript definitions
│   ├── cluster.ts
│   └── commands.ts
├── App.tsx             # Main application
└── main.tsx            # Entry point
```

### Build Commands
```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Inspired by Kubernetes architecture and kubectl
- Built with modern web technologies
- Designed for educational purposes
