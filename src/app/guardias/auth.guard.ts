import { inject } from '@angular/core';                          // Permite pedir servicios dentro de una función
import { CanActivateFn, Router } from '@angular/router';         // Tipo de guardia y el Router para redirigir
import { AuthService } from '../servicios/auth.service';         // Nuestro servicio con el estado de sesión

export const authGuard: CanActivateFn = () => {                  // Función que decide si se puede entrar a una ruta
  const auth = inject(AuthService);                              // Obtiene el servicio de autenticación
  const router = inject(Router);                                 // Obtiene el router para poder redirigir
  return auth.logueado ? true : router.createUrlTree(['/login']); // Si hay sesión deja pasar; si no, manda al login
};