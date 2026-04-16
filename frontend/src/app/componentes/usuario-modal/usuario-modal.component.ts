import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuariosService } from '../../servicios/usuarios.service';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './usuario-modal.component.html',
  styleUrl: './usuario-modal.component.css'
})
export class UsuarioModalComponent implements OnChanges {
  @Input() modoCreacion: boolean = true;
  @Input() usuarioAEditar: any = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  usuarioForm: FormGroup;
  mensaje = '';
  imagenBase64: string | null = null;
  cargando = false;

  constructor(private fb: FormBuilder, private usuariosService: UsuariosService) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['usuarioAEditar'] && this.usuarioAEditar) {
      this.usuarioForm.patchValue({ nombre: this.usuarioAEditar.nombre });
      this.imagenBase64 = this.usuarioAEditar.avatar || null;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    if (this.usuarioForm.valid) {
      this.cargando = true;
      const { nombre } = this.usuarioForm.value;
      const avatar = this.imagenBase64 || undefined;

      if (this.modoCreacion) {
        this.usuariosService.crearUsuario(nombre, avatar).subscribe({
          next: () => {
            this.cargando = false;
            this.guardado.emit();
            this.cerrar.emit();
          },
          error: (err) => {
            this.cargando = false;
            this.mensaje = err.error?.error || 'Error creando usuario';
          }
        });
      } else {
        this.usuariosService.editarUsuario(this.usuarioAEditar.id, nombre, avatar).subscribe({
          next: () => {
            this.cargando = false;
            this.guardado.emit();
            this.cerrar.emit();
          },
          error: (err) => {
            this.cargando = false;
            this.mensaje = err.error?.error || 'Error actualizando usuario';
          }
        });
      }
    }
  }
}
