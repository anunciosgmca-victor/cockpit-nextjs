export type Workspace = 'default' | 'grupoordos';

export function currentWorkspace(): Workspace {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/grupoordos')) {
    return 'grupoordos';
  }
  return 'default';
}
