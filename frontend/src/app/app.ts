import { Component, signal } from '@angular/core';
import { Encabezado } from "./componentes/encabezado/encabezado";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [Encabezado, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('proyecto_inicial');
}
