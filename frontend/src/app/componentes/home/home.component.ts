import { Component, OnInit } from '@angular/core';
import { Usuario } from '../usuario/usuario';
import { Tareas } from '../tareas/tareas';
import { SelectionService } from '../../servicios/selection.service';
import { UsuariosService } from '../../servicios/usuarios.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Usuario, Tareas],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  constructor(
    public selectionService: SelectionService, 
    public usuariosService: UsuariosService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.usuariosService.cargarUsuariosGlobaes();
  }

  alSeleccionarUsuario(id: string) {
    this.selectionService.setIdUsuarioSeleccionado(id);
  }

  get usuarioSeleccionado() {
    const id = this.selectionService.idUsuarioSeleccionado();
    if (!id) return null;
    return this.usuariosService.usuarios().find(u => u.id === id) || null;
  }
}
