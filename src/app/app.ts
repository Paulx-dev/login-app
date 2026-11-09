import { Component, inject } from '@angular/core';                 // Component define el componente; inject pide servicios
import { Router, RouterLink, RouterOutlet } from '@angular/router'; // Herramientas para navegar entre páginas
import { AuthService } from './servicios/auth.service';            // Servicio con los datos de sesión

@Component({
  selector: 'app-root',                                            // Nombre de la etiqueta HTML de este componente
  imports: [RouterOutlet, RouterLink],                             // Lo que el HTML puede usar: <router-outlet> y routerLink
  templateUrl: './app.html',                                       // Archivo HTML del componente
  styleUrl: './app.css'                                            // Archivo CSS del componente
})
export class App {
  public auth = inject(AuthService);                               // Trae el servicio (público para usarlo en el HTML)
  private router = inject(Router);                                 // Trae el router para redirigir por código

  empresa = 'DentalCare S.A.';                                     // Nombre de la empresa (se muestra en cabecera y pie)
  anio = new Date().getFullYear();                                 // Año actual para el copyright

  acercaDe(): void {                                               // Se ejecuta al presionar "Acerca de"
    alert('DentalCare S.A. - Sistema integral de gestión de salud dental.'); // Muestra una alerta con información
  }

  cerrarSesion(): void {                                           // Se ejecuta al presionar "Cerrar Sesión"
    this.auth.cerrarSesion();                                      // Borra la sesión en el servicio
    this.router.navigate(['/login']);                              // Redirige al login
  }
}