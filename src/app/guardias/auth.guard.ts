import { inject } from '@angular/core';                          // Permite pedir servicios dentro de una función
import { CanActivateFn, Router } from '@angular/router';         // Tipo de guardia y el Router para redirigir
import { AuthService } from '../servicios/auth.service';         // Servicio con el estado de sesión y el rol

export const authGuard: CanActivateFn = (route) => {             // "route" trae la ruta a la que se quiere entrar
  const auth = inject(AuthService);                              // Obtiene el servicio de autenticación
  const router = inject(Router);                                 // Obtiene el router para poder redirigir

  if (!auth.logueado) {                                          // Sin sesión: al login
    return router.createUrlTree(['/login']);
  }

  const ruta = '/' + (route.routeConfig?.path ?? '');            // Ej.: 'citas' pasa a '/citas'
  return auth.puedeAcceder(ruta)                                 // ¿Su rol puede entrar a este módulo?
    ? true                                                       // Sí: deja pasar
    : router.createUrlTree(['/inicio']);                         // No: lo devuelve a su inicio
};
