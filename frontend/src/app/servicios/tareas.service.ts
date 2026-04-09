import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NuevaTareaInfo } from '../tarea/tarea.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TareasService {
  
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tareas`; 

  constructor() {}

  // 1. GET
  obtenerTareasDeUsuario(idUsuario: string) {
    return this.http.get<any[]>(`${this.apiUrl}?idUsuario=${idUsuario}`);
  }

  // 2. POST
  agregarTarea(infoDeTarea: NuevaTareaInfo, idUsuario: string) {
    const nuevaTarea = {
      titulo: infoDeTarea.titulo,
      resumen: infoDeTarea.resumen,
      expira: infoDeTarea.fecha, 
      idUsuario: idUsuario
    };
    
    return this.http.post(this.apiUrl, nuevaTarea);
  }

  // 3. DELETE
  eliminarTarea(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 4. PUT: Actualizar tarea (¡Ahora sí está adentro de la clase!)
  completarTarea(id: string) {
    return this.http.put(`${this.apiUrl}/${id}`, {});
  }
}