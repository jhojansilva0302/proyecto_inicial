export interface tarea {
  id: string;
  idUsuario: string;
  titulo: string;
  resumen: string;
  expira: string;
  completada?: number; 
}

export interface NuevaTareaInfo {
  titulo: string;
  resumen: string;
  fecha: string;
}