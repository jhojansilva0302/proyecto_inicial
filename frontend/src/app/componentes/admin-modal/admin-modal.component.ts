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

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.adminForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.perfilForm = this.fb.group({
      newPassword: ['', Validators.required]
    });
  }

  crearAdmin() {
    if (this.adminForm.valid) {
      const { username, password } = this.adminForm.value;
      this.authService.crearAdministrador(username, password).subscribe({
        next: () => {
          this.adminMessage = 'Admin creado exitosamente.';
          this.adminForm.reset();
        },
        error: (err) => this.adminMessage = err.error?.error || 'Error'
      });
    }
  }

  actualizarPerfil() {
    if (this.perfilForm.valid) {
      const { newPassword } = this.perfilForm.value;
      this.authService.actualizarPerfil(newPassword).subscribe({
        next: () => {
          this.perfilMessage = 'Contraseña actualizada. Cierra sesión e ingresa de nuevo para probarla.';
          this.perfilForm.reset();
        },
        error: (err) => this.perfilMessage = err.error?.error || 'Error'
      });
    }
  }
}
