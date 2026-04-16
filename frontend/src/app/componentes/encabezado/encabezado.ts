import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SelectionService } from '../../servicios/selection.service';
import { AuthService } from '../../servicios/auth.service';
import { AdminModalComponent } from '../admin-modal/admin-modal.component';
import { EliminarAdminComponent } from '../eliminar-admin/eliminar-admin';
import { PerfilesModalComponent } from '../perfiles-modal/perfiles-modal.component';
import { UsuariosService } from '../../servicios/usuarios.service';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [AdminModalComponent, EliminarAdminComponent, PerfilesModalComponent],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  public authService = inject(AuthService);
  private selectionService = inject(SelectionService);

  mostrarModal = false;
  mostrarModalEliminar = false;
  mostrarModalPerfiles = false;

  constructor(private router: Router, private usuariosService: UsuariosService) {}

  volverAlInicio() {
    this.selectionService.setIdUsuarioSeleccionado(null);
    this.router.navigate(['/']);
  }

  abrirModalAdmin() {
    this.mostrarModal = true;
  }

  abrirModalPerfiles() {
    this.mostrarModalPerfiles = true;
  }

  alCerrarModalPerfiles() {
    this.mostrarModalPerfiles = false;
  }

  abrirModalEliminarAdmin() {
    this.mostrarModalEliminar = true;
  }

  irALogin() {
    this.router.navigate(['/login']);
  }
}
