import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { tarea } from './tarea.model';
import { Tarjeta } from '../componentes/tarjeta/tarjeta';
import { DatePipe } from '@angular/common';
import { TareasService } from '../servicios/tareas.service';
import { AuthService } from '../servicios/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tarea',
  imports: [Tarjeta, DatePipe, FormsModule],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class Tarea {
  @Input({required: true}) tarea!: tarea;
  
  esModoEdicion = false;
  tituloEditado = '';
  resumenEditado = '';
  expiraEditado = '';
  
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

  alHabilitarTarea() {
    this.tareasService.habilitarTarea(this.tarea.id).subscribe({
      next: () => {
        console.log('¡Tarea habilitada en MySQL!');
        this.completar.emit(this.tarea.id); // Se emite el mismo evento para recargar
      },
      error: (err) => console.error('Error al habilitar:', err)
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

  alActivarEdicion() {
    this.esModoEdicion = true;
    this.tituloEditado = this.tarea.titulo;
    this.resumenEditado = this.tarea.resumen;
    this.expiraEditado = this.tarea.expira;
  }

  alCancelarEdicion() {
    this.esModoEdicion = false;
  }

  alGuardarEdicion() {
    if (!this.tituloEditado || !this.resumenEditado || !this.expiraEditado) return;

    this.tareasService.editarTarea(this.tarea.id, {
      titulo: this.tituloEditado,
      resumen: this.resumenEditado,
      fecha: this.expiraEditado
    }).subscribe({
      next: () => {
        this.esModoEdicion = false;
        // Emitimos completar para recargar las tareas (el padre llama cargarTareas)
        this.completar.emit(this.tarea.id);
      },
      error: (err) => console.error('Error al editar:', err)
    });
  }
}