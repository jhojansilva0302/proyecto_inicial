import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  // Usamos una signal para que el resto de la app reaccione a los cambios de estado (Modo Lectura / Admin)
  public isLoggedIn = signal<boolean>(false);
  public currentAdmin = signal<string | null>(null);

  constructor(private http: HttpClient) { 
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkToken(), 0);
    }
  }

  // Verifica si el token existe en localStorage al iniciar
  private checkToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      if (token && username) {
        this.isLoggedIn.set(true);
        this.currentAdmin.set(username);
      }
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((res: any) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('username', res.username);
        }
        this.isLoggedIn.set(true);
        this.currentAdmin.set(res.username);
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    }
    this.isLoggedIn.set(false);
    this.currentAdmin.set(null);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }

  crearAdministrador(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin`, { username, password });
  }

  actualizarPerfil(password: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/perfil`, { password });
  }

  obtenerAdministradores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin`);
  }

  eliminarAdministrador(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/${id}`);
  }
}
