import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-modal.component.html',
  styleUrl: './admin-modal.component.css'
})
export class AdminModalComponent {
  @Output() cerrar = new EventEmitter<void>();
  adminForm: FormGroup;
  perfilForm: FormGroup;

  adminMessage = '';
  perfilMessage = '';

  administradores: any[] = [];

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.adminForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.perfilForm = this.fb.group({
      adminId: ['', Validators.required],
      newPassword: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarAdministradores();
  }

  cargarAdministradores() {
    this.authService.obtenerAdministradores().subscribe({
      next: (data) => this.administradores = data,
      error: (e) => console.error(e)
    });
  }

  crearAdmin() {
    if (this.adminForm.valid) {
      const { username, password } = this.adminForm.value;
      this.authService.crearAdministrador(username, password).subscribe({
        next: () => {
          this.adminMessage = 'Admin creado exitosamente.';
          this.adminForm.reset();
          this.cargarAdministradores();
        },
        error: (err) => this.adminMessage = err.error?.error || 'Error'
      });
    }
  }

  actualizarPerfil() {
    if (this.perfilForm.valid) {
      const { adminId, newPassword } = this.perfilForm.value;
      this.authService.actualizarPerfil(adminId, newPassword).subscribe({
        next: () => {
          this.perfilMessage = 'Contraseña actualizada.';
          this.perfilForm.reset();
        },
        error: (err) => this.perfilMessage = err.error?.error || 'Error'
      });
    }
  }
}
