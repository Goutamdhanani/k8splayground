import type { ParsedCommand } from '../types/commands';

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const type = parts[0] as ParsedCommand['type'];
  
  if (!['docker', 'kubectl', 'clear', 'help'].includes(type)) {
    return null;
  }

  const subcommand = parts[1];
  const remainingParts = parts.slice(2);
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < remainingParts.length; i++) {
    const part = remainingParts[i];
    
    if (part.startsWith('-')) {
      const flagPart = part.replace(/^-+/, '');
      
      // Check for --key=value format
      if (flagPart.includes('=')) {
        const [key, ...valueParts] = flagPart.split('=');
        flags[key] = valueParts.join('=');
      }
      // Check if next part is a value or another flag
      else if (i + 1 < remainingParts.length && !remainingParts[i + 1].startsWith('-')) {
        flags[flagPart] = remainingParts[i + 1];
        i++; // Skip next part as it's a value
      } else {
        flags[flagPart] = true;
      }
    } else {
      args.push(part);
    }
  }

  return {
    type,
    subcommand,
    args,
    flags,
  };
}

export function getCommandSuggestions(partial: string): string[] {
  const commands = [
    'docker build -t <image-name> .',
    'docker images',
    'kubectl apply -f <filename>',
    'kubectl get pods',
    'kubectl get deployments',
    'kubectl get services',
    'kubectl get nodes',
    'kubectl describe pod <pod-name>',
    'kubectl describe deployment <deployment-name>',
    'kubectl describe service <service-name>',
    'kubectl scale deployment <name> --replicas=<count>',
    'kubectl delete pod <pod-name>',
    'kubectl delete deployment <deployment-name>',
    'kubectl delete service <service-name>',
    'clear',
    'help',
  ];

  if (!partial) return commands;

  return commands.filter(cmd => cmd.startsWith(partial));
}
