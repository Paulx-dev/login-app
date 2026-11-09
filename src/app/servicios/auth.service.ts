import { Injectable } from '@angular/core';          // Permite marcar la clase como "servicio"

@Injectable({ providedIn: 'root' })                  // 'root' = existe UNA sola copia compartida en toda la app
export class AuthService {

  public usuarioValido = 'admin';                    // Usuario correcto (variable pública pedida en la tarea)
  public claveValida = '1234';                       // Clave correcta (variable pública pedida en la tarea)

  public logueado = false;                           // Indica si hay una sesión iniciada
  public usuarioActual = '';                         // Guarda el nombre del usuario que inició sesión

  validar(usuario: string, clave: string): boolean { // Recibe lo escrito en el login y devuelve true/false
    if (usuario === this.usuarioValido && clave === this.claveValida) { // Compara ambos datos con los válidos
      this.logueado = true;                          // Marca que la sesión está iniciada
      this.usuarioActual = usuario;                  // Guarda el nombre del usuario logueado
      return true;                                   // Credenciales correctas
    }
    return false;                                    // Si no coinciden, credenciales incorrectas
  }

  cerrarSesion(): void {                             // Se ejecuta al presionar "Cerrar Sesión"
    this.logueado = false;                           // Ya no hay sesión
    this.usuarioActual = '';                         // Borra el nombre del usuario
  }
}