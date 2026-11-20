import { Injectable } from '@angular/core';

// Tipos

export type EstadoPieza = 'Sano' | 'Caries' | 'Obturado' | 'Endodoncia' | 'Corona' | 'Implante' | 'Extraído' | 'Ausente';

export interface Antecedentes {
  alergias: string;
  enfermedades: string;
  medicamentos: string;
  cirugias: string;
  habitos: string;
}

export interface Paciente {
  id: number;
  cedula: string;
  nombre: string;
  fechaNacimiento: string;                      
  telefono: string;
  correo: string;
  fechaApertura: Date;
  antecedentes: Antecedentes;
  odontograma: Record<number, EstadoPieza>;      
}

export interface Atencion {
  id: number;
  pacienteId: number;
  fecha: Date;
  odontologo: string;
  motivo: string;
  pieza: number | null;                          
  diagnostico: string;
  procedimiento: string;
  planTratamiento: string;
}

export interface DatosPaciente {
  cedula: string;
  nombre: string;
  fechaNacimiento: string;
  telefono: string;
  correo: string;
}

export interface DatosAtencion {
  motivo: string;
  pieza: number | null;
  diagnostico: string;
  procedimiento: string;
  planTratamiento: string;
}

export interface Resultado {
  ok: boolean;
  mensaje: string;
  paciente?: Paciente;
}

// Catálogos

export const ESTADOS_PIEZA: { nombre: EstadoPieza; color: string }[] = [
  { nombre: 'Sano',       color: '#ffffff' },
  { nombre: 'Caries',     color: '#f87171' },
  { nombre: 'Obturado',   color: '#60a5fa' },
  { nombre: 'Endodoncia', color: '#c084fc' },
  { nombre: 'Corona',     color: '#fbbf24' },
  { nombre: 'Implante',   color: '#34d399' },
  { nombre: 'Extraído',   color: '#9ca3af' },
  { nombre: 'Ausente',    color: '#e5e7eb' }
];

//FDI
export const PIEZAS_SUPERIORES = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const PIEZAS_INFERIORES = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

@Injectable({ providedIn: 'root' })
export class HistoriaService {

  private siguientePaciente = 100;
  private siguienteAtencion = 100;

  private pacientes: Paciente[] = this.crearPacientesIniciales();
  private atenciones: Atencion[] = this.crearAtencionesIniciales();

  // Consultas

  listarPacientes(): Paciente[] {
    return [...this.pacientes].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  pacientePorNombre(nombre: string): Paciente | undefined {     // Lo usa el paciente que entra: busca SU ficha
    return this.pacientes.find(p => p.nombre === nombre);
  }

  estadoPieza(paciente: Paciente, pieza: number): EstadoPieza {
    return paciente.odontograma[pieza] ?? 'Sano';
  }

  colorEstado(estado: EstadoPieza): string {
    return ESTADOS_PIEZA.find(e => e.nombre === estado)?.color ?? '#ffffff';
  }

  atencionesDe(pacienteId: number): Atencion[] {                // La más reciente primero
    return this.atenciones
      .filter(a => a.pacienteId === pacienteId)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  edad(fechaNacimiento: string): number {
    const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
    if (!anio || !mes || !dia) { return 0; }
    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) { edad--; }
    return edad;
  }
  // Operaciones
  abrirFicha(datos: DatosPaciente): Resultado {
    const nombre = datos.nombre.trim();
    const cedula = datos.cedula.trim();
    if (!nombre) { return { ok: false, mensaje: 'Escribe el nombre del paciente.' }; }
    if (!/^\d{10}$/.test(cedula)) { return { ok: false, mensaje: 'La cédula debe tener 10 números.' }; }
    if (!datos.fechaNacimiento || new Date(datos.fechaNacimiento) > new Date()) {
      return { ok: false, mensaje: 'Indica una fecha de nacimiento válida.' };
    }
    if (this.pacientes.some(p => p.cedula === cedula)) {
      return { ok: false, mensaje: 'Ya existe una ficha con esa cédula.' };
    }

    const paciente: Paciente = {
      id: this.siguientePaciente++, cedula, nombre,
      fechaNacimiento: datos.fechaNacimiento,
      telefono: datos.telefono.trim(), correo: datos.correo.trim(),
      fechaApertura: new Date(),
      antecedentes: { alergias: '', enfermedades: '', medicamentos: '', cirugias: '', habitos: '' },
      odontograma: {}
    };
    this.pacientes.push(paciente);
    return { ok: true, mensaje: 'Ficha abierta correctamente.', paciente };
  }

  guardarAntecedentes(paciente: Paciente, antecedentes: Antecedentes): Resultado {
    paciente.antecedentes = { ...antecedentes };
    return { ok: true, mensaje: 'Antecedentes guardados.' };
  }

  marcarPieza(paciente: Paciente, pieza: number, estado: EstadoPieza): Resultado {
    paciente.odontograma = { ...paciente.odontograma, [pieza]: estado };
    return { ok: true, mensaje: `Pieza ${pieza} marcada como "${estado}".` };
  }

  registrarAtencion(paciente: Paciente, datos: DatosAtencion, odontologo: string): Resultado {
    if (!datos.motivo.trim()) { return { ok: false, mensaje: 'Escribe el motivo de la consulta.' }; }
    if (!datos.diagnostico.trim()) { return { ok: false, mensaje: 'Escribe el diagnóstico.' }; }

    this.atenciones.push({
      id: this.siguienteAtencion++,
      pacienteId: paciente.id,
      fecha: new Date(),
      odontologo,
      motivo: datos.motivo.trim(),
      pieza: datos.pieza,
      diagnostico: datos.diagnostico.trim(),
      procedimiento: datos.procedimiento.trim(),
      planTratamiento: datos.planTratamiento.trim()
    });
    return { ok: true, mensaje: 'Atención registrada en la historia clínica.' };
  }
  private crearPacientesIniciales(): Paciente[] {
    const vacios: Antecedentes = { alergias: '', enfermedades: '', medicamentos: '', cirugias: '', habitos: '' };
    const hace = (dias: number): Date => { const f = new Date(); f.setDate(f.getDate() - dias); return f; };

    return [
      {
        id: 1, cedula: '0912345678', nombre: 'Ana Pérez', fechaNacimiento: '1992-04-15',
        telefono: '0991234567', correo: 'ana.perez@correo.com', fechaApertura: hace(120),
        antecedentes: { alergias: 'Penicilina', enfermedades: 'Ninguna', medicamentos: 'Ninguno', cirugias: 'Apendicectomía (2015)', habitos: 'Ninguno' },
        odontograma: { 16: 'Obturado', 26: 'Caries', 36: 'Corona', 48: 'Extraído' }
      },
      {
        id: 2, cedula: '0923456789', nombre: 'María Pérez', fechaNacimiento: '1988-09-02',
        telefono: '0982345678', correo: 'maria.perez@correo.com', fechaApertura: hace(90),
        antecedentes: { ...vacios, enfermedades: 'Hipertensión', medicamentos: 'Enalapril' },
        odontograma: { 14: 'Endodoncia', 37: 'Caries' }
      },
      {
        id: 3, cedula: '0934567890', nombre: 'Juan Mora', fechaNacimiento: '1975-12-20',
        telefono: '0973456789', correo: 'juan.mora@correo.com', fechaApertura: hace(60),
        antecedentes: { ...vacios, enfermedades: 'Diabetes tipo 2', habitos: 'Fumador' },
        odontograma: { 46: 'Caries', 11: 'Corona', 21: 'Corona', 18: 'Ausente' }
      },
      {
        id: 4, cedula: '0945678901', nombre: 'Luis Bravo', fechaNacimiento: '2001-06-30',
        telefono: '0964567890', correo: 'luis.bravo@correo.com', fechaApertura: hace(30),
        antecedentes: { ...vacios, alergias: 'Látex' },
        odontograma: { 25: 'Endodoncia' }
      },
      {
        id: 5, cedula: '0956789012', nombre: 'Ana Vera', fechaNacimiento: '1999-02-11',
        telefono: '0955678901', correo: 'ana.vera@correo.com', fechaApertura: hace(10),
        antecedentes: { ...vacios },
        odontograma: { 38: 'Caries' }
      }
    ];
  }

  private crearAtencionesIniciales(): Atencion[] {
    const hace = (dias: number, hora: number): Date => {
      const f = new Date(); f.setDate(f.getDate() - dias); f.setHours(hora, 0, 0, 0); return f;
    };
    return [
      { id: 1, pacienteId: 1, fecha: hace(120, 9), odontologo: 'Dr. Luis Mora', motivo: 'Primera consulta',
        pieza: 16, diagnostico: 'Caries profunda en pieza 16', procedimiento: 'Obturación con resina',
        planTratamiento: 'Control en 6 meses' },
      { id: 2, pacienteId: 1, fecha: hace(30, 9), odontologo: 'Dr. Luis Mora', motivo: 'Limpieza dental',
        pieza: null, diagnostico: 'Placa y sarro generalizado', procedimiento: 'Profilaxis y flúor',
        planTratamiento: 'Tratar caries de la pieza 26' },
      { id: 3, pacienteId: 2, fecha: hace(90, 10), odontologo: 'Dr. Luis Mora', motivo: 'Dolor al masticar',
        pieza: 14, diagnostico: 'Pulpitis irreversible', procedimiento: 'Inicio de endodoncia',
        planTratamiento: 'Terminar endodoncia y colocar corona' },
      { id: 4, pacienteId: 3, fecha: hace(60, 8), odontologo: 'Dr. Luis Mora', motivo: 'Dolor en molar',
        pieza: 46, diagnostico: 'Caries en pieza 46', procedimiento: 'Limpieza de la cavidad',
        planTratamiento: 'Obturación de la pieza 46' }
    ];
  }
}