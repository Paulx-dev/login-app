import { Injectable } from '@angular/core';                       // Permite marcar la clase como "servicio"
import { ETIQUETA_ROL, MODULOS, Rol } from '../modulos.config';   // Roles y módulos permitidos por rol

export interface Usuario {                                        // Forma de cada usuario
  usuario: string;                                                // Nombre de usuario para entrar
  clave: string;                                                  // Clave
  nombre: string;                                                 // Nombre real (se muestra en pantalla)
  rol: Rol;                                                       // Rol que decide qué vista ve
}

@Injectable({ providedIn: 'root' })                               // 'root' = UNA sola copia compartida en toda la app
export class AuthService {

  // Datos quemados: un usuario de prueba por cada rol
  private usuarios: Usuario[] = [
    { usuario: 'paciente',   clave: '1234', nombre: 'Ana Pérez',     rol: 'paciente' },
    { usuario: 'odontologo', clave: '1234', nombre: 'Dr. Luis Mora', rol: 'odontologo' },
    { usuario: 'recepcion',  clave: '1234', nombre: 'María Vera',    rol: 'recepcionista' },
    { usuario: 'inventario', clave: '1234', nombre: 'Carlos Ruiz',   rol: 'inventario' },
    { usuario: 'admin',      clave: '1234', nombre: 'Administrador', rol: 'administrador' }
  ];

  public logueado = false;                                        // Indica si hay una sesión iniciada
  public usuarioActual = '';                                      // Nombre de quien inició sesión (lo usa app.html)
  public rol: Rol | null = null;                                  // Rol de quien inició sesión

  get etiquetaRol(): string {                                     // Texto del rol para mostrar en la cabecera
    return this.rol ? ETIQUETA_ROL[this.rol] : '';
  }

  validar(usuario: string, clave: string): boolean {              // Devuelve true si usuario y clave coinciden
    const u = this.usuarios.find(x => x.usuario === usuario && x.clave === clave); // Busca en el arreglo
    if (!u) { return false; }                                     // No existe: credenciales incorrectas
    this.logueado = true;                                         // Sesión iniciada
    this.usuarioActual = u.nombre;                                // Guarda el nombre real
    this.rol = u.rol;                                             // Guarda el rol
    return true;
  }

  registrar(nombre: string, usuario: string, clave: string): boolean { // Registro público: siempre crea un paciente
    if (this.usuarios.some(x => x.usuario === usuario)) { return false; } // Ese usuario ya existe
    this.usuarios.push({ usuario, clave, nombre, rol: 'paciente' });
    return true;
  }

  puedeAcceder(ruta: string): boolean {                           // ¿El rol actual puede entrar a esta ruta?
    if (!this.logueado || !this.rol) { return false; }
    if (ruta === '/inicio') { return true; }                      // Todos los roles ven su inicio
    const modulo = MODULOS.find(m => m.ruta === ruta);            // Busca el módulo de esa ruta
    return !!modulo && !!modulo.porRol[this.rol];                 // Permitido si el rol aparece en el módulo
  }

  cerrarSesion(): void {                                          // Se ejecuta al presionar "Cerrar Sesión"
    this.logueado = false;
    this.usuarioActual = '';
    this.rol = null;
  }
}
