import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { Tarea } from "../../tarea/tarea";
import { NuevaTarea } from "../nueva-tarea/nueva-tarea";
import { TareasService } from '../../servicios/tareas.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-tareas',
  imports: [Tarea, NuevaTarea],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css',
})
export class Tareas implements OnChanges {
  @Input({required: true}) nombre!: string;
  @Input({ required: true }) idUsuario!: string;
  
  estaAgregandoTareaNueva = false;
  tareasUsuarioSeleccionado = signal<any[]>([]); 

  constructor(private tareasService: TareasService, public authService: AuthService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idUsuario']) {
      this.cargarTareas();
    }
  }

  cargarTareas() {
    this.tareasService.obtenerTareasDeUsuario(this.idUsuario).subscribe({
      next: (datos) => {
        this.tareasUsuarioSeleccionado.set(datos);
      },
      error: (err) => {
        console.error('Error al traer las tareas:', err);
      }
    });
  }

  alIniciarNuevaTarea() {
    this.estaAgregandoTareaNueva = true;
  }

  alCerrarTareaNueva() {
    this.estaAgregandoTareaNueva = false;
    this.cargarTareas(); 
  }
}