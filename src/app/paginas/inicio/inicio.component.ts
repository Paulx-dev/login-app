import { Component, inject } from '@angular/core';                 // Component e inject
import { RouterLink } from '@angular/router';                      // Permite usar routerLink en el HTML
import { AuthService } from '../../servicios/auth.service';        // Para saber quién y con qué rol entró
import { MODULOS, Rol } from '../../modulos.config';               // Módulos y roles

interface Dato { etiqueta: string; valor: string; icono: string; }           // Tarjeta de resumen
interface Aviso { tipo: 'info' | 'warning' | 'danger'; texto: string; }      // Alerta de color
interface Accion { texto: string; ruta: string; }                            // Botón grande de acción
interface PanelRol {                                                         // Todo lo que cambia según el rol
  titulo: string; subtitulo: string; datos: Dato[]; avisos: Aviso[]; accion?: Accion;
}

// Datos quemados de la pantalla de inicio de cada rol (según el flujo del proyecto)
const PANELES: Record<Rol, PanelRol> = {
  paciente: {
    titulo: 'Mi panel', subtitulo: 'Tu próxima cita y tu resumen',
    datos: [
      { etiqueta: 'Próxima cita', valor: '15/11/2026 · 10:00 · Dr. Luis Mora · Confirmada', icono: 'bi-calendar-check' },
      { etiqueta: 'Saldo pendiente', valor: '$120.50', icono: 'bi-cash-coin' }
    ],
    avisos: [{ tipo: 'warning', texto: 'Tienes un presupuesto pendiente de aprobar.' }],
    accion: { texto: 'Agendar cita', ruta: '/citas' }
  },
  odontologo: {
    titulo: 'Mi agenda de hoy', subtitulo: 'Tus citas y pendientes del día',
    datos: [
      { etiqueta: 'Próximo paciente', valor: '09:00 · María Pérez · Limpieza', icono: 'bi-person-check' },
      { etiqueta: 'Citas de hoy', valor: '6', icono: 'bi-calendar-day' },
      { etiqueta: 'Pacientes con control pendiente', valor: '3', icono: 'bi-clipboard-check' },
      { etiqueta: 'Presupuestos sin aprobar', valor: '2', icono: 'bi-hourglass-split' }
    ],
    avisos: []
  },
  recepcionista: {
    titulo: 'Recepción', subtitulo: 'Movimiento del día',
    datos: [
      { etiqueta: 'Citas de hoy', valor: '8', icono: 'bi-calendar-day' },
      { etiqueta: 'Citas nuevas solicitadas', valor: '3', icono: 'bi-calendar-plus' },
      { etiqueta: 'Recordatorios por enviar', valor: '5', icono: 'bi-bell' },
      { etiqueta: 'Pacientes con saldo pendiente', valor: '4', icono: 'bi-cash-coin' }
    ],
    avisos: []
  },
  inventario: {
    titulo: 'Inventario', subtitulo: 'Alertas y movimientos recientes',
    datos: [
      { etiqueta: 'Últimos movimientos', valor: '12', icono: 'bi-arrow-left-right' },
      { etiqueta: 'Compras recientes', valor: '3', icono: 'bi-bag-check' }
    ],
    avisos: [
      { tipo: 'danger', texto: '4 insumos están por debajo del stock mínimo.' },
      { tipo: 'warning', texto: '2 lotes vencen en los próximos 30 días.' }
    ]
  },
  administrador: {
    titulo: 'Panel de control', subtitulo: 'Indicadores del mes',
    datos: [
      { etiqueta: 'Citas del mes', valor: '126', icono: 'bi-calendar-check' },
      { etiqueta: 'Ingresos', valor: '$8,450', icono: 'bi-graph-up-arrow' },
      { etiqueta: 'Pacientes nuevos', valor: '18', icono: 'bi-person-plus' },
      { etiqueta: 'Tratamiento más realizado', valor: 'Limpieza dental', icono: 'bi-star' }
    ],
    avisos: [
      { tipo: 'danger', texto: 'Alerta de inventario: 4 insumos bajo el stock mínimo.' },
      { tipo: 'warning', texto: '7 pacientes inactivos.' }
    ]
  }
};

@Component({
  selector: 'app-inicio',                                          // Etiqueta HTML del componente
  imports: [RouterLink],                                           // Habilita routerLink
  templateUrl: './inicio.component.html',                          // Archivo HTML
  styleUrl: './inicio.component.css'                               // Archivo CSS
})
export class InicioComponent {
  public auth = inject(AuthService);                               // Servicio con el usuario y su rol

  get panel(): PanelRol | null {                                   // Panel que corresponde al rol actual
    return this.auth.rol ? PANELES[this.auth.rol] : null;
  }

  get modulos() {                                                  // Solo los módulos que el rol puede ver, con su título propio
    const rol = this.auth.rol;
    if (!rol) { return []; }
    return MODULOS
      .filter(m => !!m.porRol[rol])
      .map(m => ({ ruta: m.ruta, icono: m.icono, ...m.porRol[rol]! }));
  }
}
