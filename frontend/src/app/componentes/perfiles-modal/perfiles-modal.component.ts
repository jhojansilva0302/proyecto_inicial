import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuariosService } from '../../servicios/usuarios.service';

@Component({
  selector: 'app-perfiles-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfiles-modal.component.html',
  styleUrl: './perfiles-modal.component.css'
})
export class PerfilesModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  
  usuarios: any[] = [];
  crearForm: FormGroup;
  editForm: FormGroup;
  
  modoEdicion: any = null;
  imagenBase64: string | null = null;
  imagenEditBase64: string | null = null;

  mensaje = '';

  constructor(private fb: FormBuilder, public usuariosService: UsuariosService) {
    this.crearForm = this.fb.group({
      nombre: ['', Validators.required]
    });
    this.editForm = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.cargarUsuariosGlobaes();
  }

  onFileSelected(event: any, isEdit: boolean = false) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          const comprimidoBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          if (isEdit) this.imagenEditBase64 = comprimidoBase64;
          else this.imagenBase64 = comprimidoBase64;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  crearPerfil() {
    if (this.crearForm.valid) {
      const { nombre } = this.crearForm.value;
      this.usuariosService.crearUsuario(nombre, this.imagenBase64 || undefined).subscribe({
        next: () => {
          this.mensaje = 'Perfil creado exitosamente.';
          this.crearForm.reset();
          this.imagenBase64 = null;
          this.cargarUsuarios();
        },
        error: (err) => this.mensaje = err.error?.error || 'Error creando perfil'
      });
    }
  }

  abrirEdicion(usuario: any) {
    this.modoEdicion = usuario;
    this.editForm.patchValue({ nombre: usuario.nombre });
    this.imagenEditBase64 = usuario.avatar || null;
  }

  cancelarEdicion() {
    this.modoEdicion = null;
    this.imagenEditBase64 = null;
    this.editForm.reset();
  }

  guardarEdicion() {
    if (this.editForm.valid && this.modoEdicion) {
      const { nombre } = this.editForm.value;
      this.usuariosService.editarUsuario(this.modoEdicion.id, nombre, this.imagenEditBase64 || undefined).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cancelarEdicion();
        },
        error: (err) => console.error('Error editando perfil:', err)
      });
    }
  }

  eliminarPerfil(id: string) {
    this.usuariosService.eliminarUsuario(id).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => alert(err.error?.error || 'Error eliminando perfil')
    });
  }
}
