import { Component, inject } from '@angular/core';                 // Component e inject
import { RouterLink } from '@angular/router';                      // Permite usar routerLink en el HTML
import { AuthService } from '../../servicios/auth.service';        // Para mostrar el nombre del usuario

@Component({
  selector: 'app-inicio',                                          // Etiqueta HTML del componente
  imports: [RouterLink],                                           // Habilita routerLink
  templateUrl: './inicio.component.html',                          // Archivo HTML
  styleUrl: './inicio.component.css'                               // Archivo CSS
})
export class InicioComponent {
  public auth = inject(AuthService);                               // Servicio con el usuario logueado

  modulos = [                                                      // Lista (arreglo) con los 5 módulos del proyecto
    { titulo: 'Gestión de Citas', ruta: '/citas', icono: 'bi-calendar-check',
      descripcion: 'Agenda, reprograma y confirma citas de pacientes.' },            // Módulo 1
    { titulo: 'Historia Clínica', ruta: '/historia-clinica', icono: 'bi-file-medical',
      descripcion: 'Registro de antecedentes, odontograma y evolución.' },            // Módulo 2
    { titulo: 'Tratamientos y Presupuestos', ruta: '/tratamientos', icono: 'bi-clipboard2-pulse',
      descripcion: 'Planes de tratamiento y cotización para el paciente.' },          // Módulo 3
    { titulo: 'Facturación y Cobros', ruta: '/facturacion', icono: 'bi-receipt',
      descripcion: 'Emisión de facturas y control de pagos.' },                       // Módulo 4
    { titulo: 'Inventario de Insumos', ruta: '/inventario', icono: 'bi-box-seam',
      descripcion: 'Control de stock de materiales odontológicos.' }                  // Módulo 5
  ];
}