import { Injectable, signal, computed } from '@angular/core';
import { USUARIOS_FALSOS } from '../usuarios-falsos';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  public idUsuarioSeleccionado = signal<string | null>(null);
  private usuarios = USUARIOS_FALSOS;

  public setIdUsuarioSeleccionado(id: string | null) {
    this.idUsuarioSeleccionado.set(id);
  }

  public usuarioSeleccionado = computed(() => {
    const id = this.idUsuarioSeleccionado();
    return id ? this.usuarios.find(u => u.id === id) : null;
  });
}
