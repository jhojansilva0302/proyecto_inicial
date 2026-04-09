import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-eliminar-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './eliminar-admin.html',
  styleUrl: './eliminar-admin.css'
})
export class EliminarAdminComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  public authService = inject(AuthService);
  administradores = signal<{id: number, username: string}[]>([]);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  ngOnInit() {
    this.cargarAdmins();
  }

  cargarAdmins() {
    this.authService.obtenerAdministradores().subscribe({
      next: (data) => this.administradores.set(data),
      error: () => this.errorMsg.set('No se pudieron cargar los administradores.')
    });
  }

  alCerrar() {
    this.cerrar.emit();
  }

  eliminar(id: number, e: Event) {
    e.preventDefault();
    this.errorMsg.set(null);
    this.successMsg.set(null);

    // Prompt for confirmation
    if (!window.confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
      return;
    }

    this.authService.eliminarAdministrador(id).subscribe({
      next: () => {
        this.successMsg.set('Administrador eliminado correctamente.');
        this.cargarAdmins(); // Refrescar lista
      },
      error: (err) => {
        if (err.error && err.error.error) {
          this.errorMsg.set(err.error.error);
        } else {
          this.errorMsg.set('Hubo un error al eliminar.');
        }
      }
    });
  }
}
