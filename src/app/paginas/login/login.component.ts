import { Component, inject } from '@angular/core';                 // Component y inject (para pedir servicios)
import { FormsModule } from '@angular/forms';                      // Necesario para usar [(ngModel)] en los inputs
import { Router } from '@angular/router';                          // Para redirigir a otra página por código
import { AuthService } from '../../servicios/auth.service';        // Servicio que valida las credenciales

@Component({
  selector: 'app-login',                                           // Etiqueta HTML de este componente
  imports: [FormsModule],                                          // Habilita ngModel en el HTML
  templateUrl: './login.component.html',                           // Archivo HTML
  styleUrl: './login.component.css'                                // Archivo CSS
})
export class LoginComponent {
  private auth = inject(AuthService);                              // Trae el servicio de autenticación
  private router = inject(Router);                                 // Trae el router

  usuario = '';                                                    // Guarda lo que se escribe en "Usuario"
  clave = '';                                                      // Guarda lo que se escribe en "Clave"

  aceptar(): void {                                                // Se ejecuta al presionar "Aceptar"
    const correcto = this.auth.validar(this.usuario, this.clave);  // Pide al servicio validar usuario y clave
    if (correcto) {                                                // Si las credenciales son correctas...
      alert('Acceso concedido');                                   // ...muestra el mensaje de éxito
      this.router.navigate(['/inicio']);                           // ...y redirige a la página principal
    } else {                                                       // Si son incorrectas...
      alert('Error en credenciales');                              // ...muestra el mensaje de error
      this.clave = '';                                             // ...y limpia la clave para reintentar
    }
  }
}