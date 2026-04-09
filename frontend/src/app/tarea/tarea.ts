import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { tarea } from './tarea.model';
import { Tarjeta } from '../componentes/tarjeta/tarjeta';
import { DatePipe } from '@angular/common';
import { TareasService } from '../servicios/tareas.service';
import { AuthService } from '../servicios/auth.service';

@Component({
  selector: 'app-tarea',
  imports: [Tarjeta, DatePipe],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class Tarea {
  @Input({required: true}) tarea!: tarea;
  
  @Output() completar = new EventEmitter<string>(); 
  @Output() eliminar = new EventEmitter<string>(); 

  private tareasService = inject(TareasService);
  public authService = inject(AuthService);

  alCompletarTarea() {
    this.tareasService.completarTarea(this.tarea.id).subscribe({
      next: () => {
        console.log('¡Tarea marcada como completada en MySQL!');
        this.completar.emit(this.tarea.id);
      },
      error: (err) => console.error('Error al completar:', err)
    });
  }

  alEliminarTarea() {
    this.tareasService.eliminarTarea(this.tarea.id).subscribe({
      next: () => {
        console.log('¡Tarea eliminada de MySQL!');
        this.eliminar.emit(this.tarea.id);
      },
      error: (err) => console.error('Error al eliminar:', err)
    });
  }
}