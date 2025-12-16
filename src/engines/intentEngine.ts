import type { ParsedCommand, Intent } from '../types/commands';

export function extractIntent(command: ParsedCommand): Intent | null {
  switch (command.type) {
    case 'docker':
      return extractDockerIntent(command);
    case 'kubectl':
      return extractKubectlIntent(command);
    case 'clear':
      return { action: 'CLEAR_TERMINAL' };
    case 'help':
      return { action: 'SHOW_HELP' };
    default:
      return null;
  }
}

function extractDockerIntent(command: ParsedCommand): Intent | null {
  switch (command.subcommand) {
    case 'build':
      const imageName = command.flags['t'] as string;
      if (!imageName) return null;
      return {
        action: 'CREATE_IMAGE',
        metadata: { imageName },
      };
    case 'images':
      return { action: 'LIST_IMAGES' };
    default:
      return null;
  }
}

function extractKubectlIntent(command: ParsedCommand): Intent | null {
  switch (command.subcommand) {
    case 'apply':
      const filename = command.flags['f'] as string;
      if (!filename) return null;
      return {
        action: 'CREATE_OR_UPDATE_RESOURCE',
        metadata: { filename },
      };
    
    case 'get':
      const resourceType = command.args[0];
      const resourceName = command.args[1];
      return {
        action: 'QUERY_STATE',
        resourceType,
        resourceName,
        namespace: (command.flags['n'] || command.flags['namespace']) as string,
      };
    
    case 'describe':
      return {
        action: 'QUERY_DETAILS',
        resourceType: command.args[0],
        resourceName: command.args[1],
        namespace: (command.flags['n'] || command.flags['namespace']) as string,
      };
    
    case 'scale':
      const scaleResourceType = command.args[0];
      const scaleResourceName = command.args[1];
      const replicasStr = command.flags['replicas'] as string;
      const replicas = replicasStr ? parseInt(replicasStr, 10) : undefined;
      
      if (!replicas || isNaN(replicas)) return null;
      
      return {
        action: 'SCALE_RESOURCE',
        resourceType: scaleResourceType,
        resourceName: scaleResourceName,
        replicas,
        namespace: (command.flags['n'] || command.flags['namespace']) as string,
      };
    
    case 'delete':
      return {
        action: 'DELETE_RESOURCE',
        resourceType: command.args[0],
        resourceName: command.args[1],
        namespace: (command.flags['n'] || command.flags['namespace']) as string,
      };
    
    default:
      return null;
  }
}
