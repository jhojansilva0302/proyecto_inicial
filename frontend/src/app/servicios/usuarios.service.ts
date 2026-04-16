import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.cargarUsuariosGlobaes();
  }

  private getAuthHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  public usuarios = signal<any[]>([]);

  cargarUsuariosGlobaes() {
    this.http.get<any[]>(`${this.apiUrl}/usuarios?_t=${new Date().getTime()}`).subscribe({
      next: (data) => this.usuarios.set(data.reverse()),
      error: (e) => console.error('Error al cargar perfiles globales', e)
    });
  }

  obtenerUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios?_t=${new Date().getTime()}`);
  }

  crearUsuario(nombre: string, avatar?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, { nombre, avatar }, { headers: this.getAuthHeaders() });
  }

  editarUsuario(id: string, nombre: string, avatar?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, { nombre, avatar }, { headers: this.getAuthHeaders() });
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { headers: this.getAuthHeaders() });
  }
}
