//Aqui se crean los roles
export type Rol = 'paciente' | 'odontologo' | 'recepcionista' | 'inventario' | 'administrador';

// Nombre legible de cada rol para mostrarlos en la cabecera
export const ETIQUETA_ROL: Record<Rol, string> = {
  paciente: 'Paciente',
  odontologo: 'Odontólogo',
  recepcionista: 'Recepcionista',
  inventario: 'Encargado de inventario',
  administrador: 'Administrador'
};

// Cómo se ve un módulo para un rol concreto (el título y la descripción cambian según quién entra)
export interface ModuloRol {
  titulo: string;
  descripcion: string;
}

// Un módulo de la app. "porRol" dice QUÉ roles pueden entrar y CÓMO lo ven.
// Si un rol no aparece en "porRol", no ve la tarjeta y el guardia le bloquea la ruta.
export interface Modulo {
  ruta: string;
  icono: string;
  porRol: Partial<Record<Rol, ModuloRol>>;
}

export const MODULOS: Modulo[] = [
  {
    ruta: '/citas', icono: 'bi-calendar-check',                       // Módulo 1
    porRol: {
      paciente:      { titulo: 'Mis citas', descripcion: 'Agenda una cita, revisa tus próximas e históricas y cancela las futuras.' },
      odontologo:    { titulo: 'Mi agenda', descripcion: 'Calendario de tus citas y marcado de citas atendidas.' },
      recepcionista: { titulo: 'Citas', descripcion: 'Agenda, confirma, reprograma y cancela. Calendario por odontólogo.' },
      administrador: { titulo: 'Gestión de citas', descripcion: 'Acceso completo a todas las citas.' }
    }
  },
  {
    ruta: '/historia-clinica', icono: 'bi-file-medical',               // Módulo 2
    porRol: {
      paciente:      { titulo: 'Mi historial', descripcion: 'Tus atenciones, diagnósticos y odontograma (solo lectura).' },
      odontologo:    { titulo: 'Pacientes e historia clínica', descripcion: 'Antecedentes, atenciones, odontograma y plan de tratamiento.' },
      administrador: { titulo: 'Historia clínica', descripcion: 'Acceso completo a las historias clínicas.' }
    }
  },
  {
    ruta: '/tratamientos', icono: 'bi-clipboard2-pulse',              // Módulo 3
    porRol: {
      paciente:      { titulo: 'Mis presupuestos', descripcion: 'Revisa el detalle y el total de tus presupuestos y apruébalos.' },
      odontologo:    { titulo: 'Presupuestos', descripcion: 'Crea y edita presupuestos desde el plan de tratamiento y aplica descuentos.' },
      administrador: { titulo: 'Tratamientos y presupuestos', descripcion: 'Planes de tratamiento, presupuestos y catálogo de precios.' }
    }
  },
  {
    ruta: '/facturacion', icono: 'bi-receipt',                        // Módulo 4
    porRol: {
      paciente:      { titulo: 'Mis pagos', descripcion: 'Abonos, saldo pendiente y comprobantes.' },
      recepcionista: { titulo: 'Cobros', descripcion: 'Registra abonos o cuotas, emite comprobantes y revisa saldos.' },
      administrador: { titulo: 'Facturación y cobros', descripcion: 'Control completo de pagos y comprobantes.' }
    }
  },
  {
    ruta: '/inventario', icono: 'bi-box-seam',                        // Módulo 5
    porRol: {
      odontologo:    { titulo: 'Inventario', descripcion: 'Consulta del stock de insumos (solo lectura).' },
      inventario:    { titulo: 'Insumos y kardex', descripcion: 'Insumos, proveedores, compras con lote, kardex y ajustes.' },
      administrador: { titulo: 'Inventario de insumos', descripcion: 'Control completo de stock y reportes de inventario.' }
    }
  }
];
