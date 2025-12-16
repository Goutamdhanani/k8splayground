// Command and Intent Types

export type CommandType = 
  | 'docker'
  | 'kubectl'
  | 'clear'
  | 'help';

export type DockerCommand = 
  | 'build'
  | 'images'
  | 'ps';

export type KubectlCommand = 
  | 'apply'
  | 'get'
  | 'describe'
  | 'scale'
  | 'delete';

export interface ParsedCommand {
  type: CommandType;
  subcommand?: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export type IntentAction = 
  | 'CREATE_IMAGE'
  | 'LIST_IMAGES'
  | 'CREATE_OR_UPDATE_RESOURCE'
  | 'QUERY_STATE'
  | 'QUERY_DETAILS'
  | 'SCALE_RESOURCE'
  | 'DELETE_RESOURCE'
  | 'CLEAR_TERMINAL'
  | 'SHOW_HELP';

export interface Intent {
  action: IntentAction;
  resourceType?: string;
  resourceName?: string;
  namespace?: string;
  yamlContent?: string;
  replicas?: number;
  metadata?: Record<string, any>;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}
