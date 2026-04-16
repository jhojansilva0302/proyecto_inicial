import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  public idUsuarioSeleccionado = signal<string | null>(null);

  public setIdUsuarioSeleccionado(id: string | null) {
    this.idUsuarioSeleccionado.set(id);
  }
}

