import { Component } from '@angular/core';
import { Usuario } from '../usuario/usuario';
import { USUARIOS_FALSOS } from '../../usuarios-falsos';
import { Tareas } from '../tareas/tareas';
import { SelectionService } from '../../servicios/selection.service';

@Component({
  selector: 'app-home',
  imports: [Usuario, Tareas],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  usuarios = USUARIOS_FALSOS;
  
  constructor(public selectionService: SelectionService) {}

  alSeleccionarUsuario(id: string) {
    this.selectionService.setIdUsuarioSeleccionado(id);
  }
}
