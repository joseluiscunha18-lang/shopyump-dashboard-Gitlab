export const primaryPaths=['/dashboard','/produtos','/pedidos','/clientes','/analises'];
export function hasPrimaryNavigation(path:string){return primaryPaths.includes(path.replace(/\/$/,''));}
