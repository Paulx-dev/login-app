import { Component, inject } from '@angular/core';                 // Component e inject
import { FormsModule } from '@angular/forms';                      // Para [(ngModel)]
import { Router, RouterLink } from '@angular/router';              // Redirigir y enlace de regreso al login
import { AuthService } from '../../servicios/auth.service';        // Servicio que guarda el nuevo paciente

@Component({
  selector: 'app-registro',                                        // Etiqueta HTML del componente
  imports: [FormsModule, RouterLink],                              // Habilita ngModel y routerLink
  templateUrl: './registro.component.html',                        // Archivo HTML
  styleUrl: './registro.component.css'                             // Archivo CSS
})
export class RegistroComponent {
  private auth = inject(AuthService);                              // Servicio de autenticación
  private router = inject(Router);                                 // Router

  nombre = '';                                                     // Nombre completo
  usuario = '';                                                    // Usuario deseado
  clave = '';                                                      // Clave
  confirmar = '';                                                  // Repetir la clave

  registrar(): void {                                              // Se ejecuta al presionar "Crear cuenta"
    if (!this.nombre || !this.usuario || !this.clave) {            // Todos los campos son obligatorios
      alert('Completa todos los campos');
      return;
    }
    if (this.clave !== this.confirmar) {                           // Las claves deben coincidir
      alert('Las claves no coinciden');
      return;
    }
    if (this.auth.registrar(this.nombre, this.usuario, this.clave)) { // Guarda el paciente en el servicio
      alert('Cuenta creada. Ahora puedes iniciar sesión.');
      this.router.navigate(['/login']);                            // Lo manda al login
    } else {
      alert('Ese usuario ya existe');                              // Usuario repetido
    }
  }
}
