import { Component, EventEmitter, inject, Input, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TareasService } from '../../servicios/tareas.service';

@Component({
  selector: 'app-nueva-tarea',
  imports: [FormsModule],
  templateUrl: './nueva-tarea.html',
  styleUrl: './nueva-tarea.css',
})
export class NuevaTarea {
  @Input({ required: true }) idUsuario!: string;
  @Output() cerrar = new EventEmitter<void>(); 

  tituloIngresado = '';
  resumenIngresado = '';
  fechaIngresado = '';

  private tareasService = inject(TareasService);
   
  alCancelar() {
    this.cerrar.emit();
  }

  alEnviar() {
    // 1. Corregimos el bug del título
    const nuevaTarea = {
      titulo: this.tituloIngresado, 
      resumen: this.resumenIngresado,
      fecha: this.fechaIngresado
    };

    // 2. Nos suscribimos a la respuesta de Node.js
    this.tareasService.agregarTarea(nuevaTarea, this.idUsuario).subscribe({
      next: (respuesta) => {
        console.log('¡Éxito desde la base de datos!', respuesta);
        // 3. Solo cerramos el formulario cuando el servidor confirme que se guardó
        this.cerrar.emit();
      },
      error: (error) => {
        console.error('Hubo un error al guardar la tarea:', error);
      }
    });
  }
}