import { Injectable } from '@angular/core';                          // Permite marcar la clase como "servicio"
import { BehaviorSubject } from 'rxjs';                              // Guarda un valor y avisa a quien se suscriba cuando cambia

export type EstadoCita = 'Pendiente' | 'Confirmada' | 'Atendida' | 'Cancelada' | 'No asistió'; // Estados de la tabla EstadoCita
export type OrigenCita = 'Paciente' | 'Recepcion' | 'Odontologo';    // Quién registró la cita
export type CanalRecordatorio = 'Correo' | 'SMS' | 'WhatsApp';       // Por dónde se envía el recordatorio

export interface Odontologo {                                        // Odontólogos que atienden en la clínica
  id: number;
  nombre: string;
  especialidad: string;
}

export interface Cita {                                              // Una cita (campos tomados de la tabla Cita del diseño)
  id: number;
  paciente: string;
  odontologoId: number;
  odontologo: string;
  consultorio: string;
  inicio: Date;                                                      // Fecha y hora de inicio
  fin: Date;                                                         // Fecha y hora de fin (inicio + 30 min)
  motivo: string;
  estado: EstadoCita;
  origen: OrigenCita;
  motivoCancelacion?: string;
  idCitaOriginal?: number;                                           // Si es una reprogramación, apunta a la cita anterior
}

export interface Bloqueo {                                           // Horario bloqueado de un odontólogo (tabla BloqueoHorario)
  id: number;
  odontologoId: number;
  odontologo: string;
  inicio: Date;
  fin: Date;
  motivo: string;                                                    // Vacaciones, reunión, mantenimiento...
}

export interface Recordatorio {                                      // Recordatorio de una cita (tabla RecordatorioCita)
  id: number;
  citaId: number;
  programada: Date;                                                  // Cuándo se debe enviar
  canal: CanalRecordatorio;
  enviado: boolean;
  fechaEnvio?: Date;
}

export interface DatosCita {                                         // Lo que se necesita para pedir una cita
  paciente: string;
  odontologoId: number;
  inicio: Date;
  motivo: string;
}

export interface Resultado {                                         // Respuesta de las operaciones (ok o mensaje de error)
  ok: boolean;
  mensaje: string;
}

// Estado de un espacio de 30 minutos en el calendario
export interface EspacioCalendario {
  tipo: 'pasado' | 'libre' | 'ocupado' | 'bloqueado';
  cita?: Cita;                                                       // Si está ocupado por una cita
  bloqueo?: Bloqueo;                                                 // Si está bloqueado
}

export const DURACION_MINUTOS = 30;                                  // Duración de cada cita

// Catálogos quemados
export const ODONTOLOGOS: Odontologo[] = [
  { id: 1, nombre: 'Dr. Luis Mora',     especialidad: 'Odontología general' },  // Es el odontólogo con usuario de prueba
  { id: 2, nombre: 'Dra. Carla Ruiz',   especialidad: 'Ortodoncia' },
  { id: 3, nombre: 'Dr. Andrés Salazar', especialidad: 'Endodoncia' }
];

export const PACIENTES: string[] = ['Ana Pérez', 'María Pérez', 'Juan Mora', 'Luis Bravo', 'Ana Vera'];

// Consultorios que el sistema puede asignar solos (la sala de cirugía la asigna solo el personal, por eso no está aquí)
const CONSULTORIOS: string[] = ['Consultorio 1', 'Consultorio 2'];

// Horario laboral (lunes a viernes): 08:00-12:00 y 14:00-18:00
const BLOQUES_HORARIO: [number, number][] = [[8, 12], [14, 18]];

@Injectable({ providedIn: 'root' })                                  // UNA sola copia compartida en toda la app
export class CitaService {

  private siguienteId = 100;                                         // Para numerar las citas nuevas
  private siguienteBloqueo = 100;
  private siguienteRecordatorio = 100;

  private citas: Cita[] = this.crearCitasIniciales();                // Lista interna de citas
  private bloqueos: Bloqueo[] = this.crearBloqueosIniciales();       // Lista interna de bloqueos
  private recordatorios: Recordatorio[] = this.crearRecordatoriosIniciales(); // Lista interna de recordatorios

  object: any = {};                                                  // Cita seleccionada (vacía al inicio)

  // Cita seleccionada en la pantalla (mismo patrón que usa el profesor con BehaviorSubject)
  public citaSeleccionada$ = new BehaviorSubject<any>(this.object);

  // Tablas: se actualizan solas cada vez que algo cambia
  public citasTabla$ = new BehaviorSubject<Cita[]>(this.citas);
  public bloqueosTabla$ = new BehaviorSubject<Bloqueo[]>(this.bloqueos);
  public recordatoriosTabla$ = new BehaviorSubject<Recordatorio[]>(this.recordatorios);

  // ---------------------------------------------------------------- Consultas

  odontologos(): Odontologo[] {
    return [...ODONTOLOGOS];
  }

  pacientes(): string[] {
    return [...PACIENTES];
  }

  // Los espacios (hora y minuto) en que empieza cada cita durante un día laboral
  espaciosDelDia(): { hora: number; minuto: number }[] {
    const espacios: { hora: number; minuto: number }[] = [];
    for (const [desde, hasta] of BLOQUES_HORARIO) {
      for (let m = desde * 60; m + DURACION_MINUTOS <= hasta * 60; m += DURACION_MINUTOS) {
        espacios.push({ hora: Math.floor(m / 60), minuto: m % 60 });
      }
    }
    return espacios;
  }

  // Horarios libres de un odontólogo en una fecha ('yyyy-MM-dd'). Ignora la cita "excluirId" (útil al reprogramar).
  horariosDisponibles(odontologoId: number, fecha: string, excluirId = 0): Date[] {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    if (!anio || !mes || !dia) { return []; }

    const diaSemana = new Date(anio, mes - 1, dia).getDay();         // 0 = domingo ... 6 = sábado
    if (diaSemana === 0 || diaSemana === 6) { return []; }           // Solo se atiende de lunes a viernes

    const libres: Date[] = [];
    for (const e of this.espaciosDelDia()) {
      const inicio = new Date(anio, mes - 1, dia, e.hora, e.minuto);
      const fin = this.sumarMinutos(inicio, DURACION_MINUTOS);
      if (inicio > new Date()
        && !this.odontologoOcupado(odontologoId, inicio, fin, excluirId)
        && !this.odontologoBloqueado(odontologoId, inicio, fin)
        && this.consultorioLibre(inicio, fin, excluirId)) {
        libres.push(inicio);
      }
    }
    return libres;
  }

  // Cómo está un espacio de 30 minutos de un odontólogo (para pintar el calendario)
  espacio(odontologoId: number, inicio: Date): EspacioCalendario {
    const fin = this.sumarMinutos(inicio, DURACION_MINUTOS);

    const cita = this.citas.find(c => this.estaActiva(c) && c.odontologoId === odontologoId && this.cruzan(inicio, fin, c.inicio, c.fin));
    if (cita) { return { tipo: 'ocupado', cita }; }

    const bloqueo = this.bloqueos.find(b => b.odontologoId === odontologoId && this.cruzan(inicio, fin, b.inicio, b.fin));
    if (bloqueo) { return { tipo: 'bloqueado', bloqueo }; }

    if (inicio <= new Date()) { return { tipo: 'pasado' }; }
    if (!this.consultorioLibre(inicio, fin, 0)) { return { tipo: 'ocupado' }; }   // Sin consultorio libre
    return { tipo: 'libre' };
  }

  // -------------------------------------------------------------- Operaciones

  // Solicita una cita. Queda PENDIENTE hasta que recepción la confirme.
  solicitar(datos: DatosCita, origen: OrigenCita, idCitaOriginal?: number, excluirId = 0): Resultado {
    const odontologo = ODONTOLOGOS.find(o => o.id === datos.odontologoId);
    if (!odontologo) { return { ok: false, mensaje: 'Selecciona un odontólogo.' }; }
    if (!datos.paciente) { return { ok: false, mensaje: 'Selecciona un paciente.' }; }
    if (datos.inicio <= new Date()) { return { ok: false, mensaje: 'La fecha y hora de la cita deben ser futuras.' }; }

    const fin = this.sumarMinutos(datos.inicio, DURACION_MINUTOS);
    const dentroDeHorario = this.horariosDisponibles(datos.odontologoId, this.aTexto(datos.inicio), excluirId)
      .some(h => h.getTime() === datos.inicio.getTime());
    if (!dentroDeHorario) {
      return { ok: false, mensaje: 'Ese horario no está disponible (fuera de horario, bloqueado o ya ocupado).' };
    }

    const consultorio = CONSULTORIOS.find(c => !this.consultorioOcupado(c, datos.inicio, fin, excluirId));
    if (!consultorio) { return { ok: false, mensaje: 'No hay consultorios disponibles en ese horario.' }; }

    this.citas.push({
      id: this.siguienteId++,
      paciente: datos.paciente,
      odontologoId: odontologo.id,
      odontologo: odontologo.nombre,
      consultorio,
      inicio: datos.inicio,
      fin,
      motivo: datos.motivo.trim(),
      estado: 'Pendiente',
      origen,
      idCitaOriginal
    });
    this.emitir();
    return { ok: true, mensaje: 'Cita registrada. Queda pendiente hasta que recepción la confirme.' };
  }

  // Reprogramar = cancelar la cita original y agendar otra enlazada a ella (como indica el diseño de la BD)
  reprogramar(original: Cita, nuevoInicio: Date): Resultado {
    if (!this.puedeCancelar(original)) { return { ok: false, mensaje: 'Esta cita ya no se puede reprogramar.' }; }

    const resultado = this.solicitar(
      { paciente: original.paciente, odontologoId: original.odontologoId, inicio: nuevoInicio, motivo: original.motivo },
      'Recepcion', original.id, original.id                          // El horario de la cita original cuenta como libre
    );
    if (!resultado.ok) { return resultado; }

    original.estado = 'Cancelada';
    original.motivoCancelacion = 'Reprogramada';
    this.descartarPendientes(original.id);
    this.emitir();
    return { ok: true, mensaje: 'Cita reprogramada. La nueva cita queda pendiente de confirmación.' };
  }

  confirmar(cita: Cita): Resultado {
    if (cita.estado !== 'Pendiente') { return { ok: false, mensaje: 'Solo se confirman citas pendientes.' }; }
    cita.estado = 'Confirmada';
    this.programarRecordatorio(cita, 'Correo', 24);                  // Al confirmar se programa el recordatorio 24 h antes
    this.emitir();
    return { ok: true, mensaje: 'Cita confirmada. Se programó un recordatorio por correo 24 horas antes.' };
  }

  cancelar(cita: Cita, motivo: string): Resultado {
    if (!this.puedeCancelar(cita)) {
      return { ok: false, mensaje: 'No se puede cancelar: ya fue atendida, ya pasó o ya estaba cancelada.' };
    }
    cita.estado = 'Cancelada';
    cita.motivoCancelacion = motivo.trim() || 'Sin motivo indicado';
    this.descartarPendientes(cita.id);
    this.emitir();
    return { ok: true, mensaje: 'Cita cancelada. El horario vuelve a quedar libre.' };
  }

  marcarAtendida(cita: Cita): Resultado {
    if (!this.puedeMarcarAsistencia(cita)) { return { ok: false, mensaje: 'Solo se marcan citas confirmadas de hoy o de días anteriores.' }; }
    cita.estado = 'Atendida';
    this.descartarPendientes(cita.id);
    this.emitir();
    return { ok: true, mensaje: 'Cita marcada como atendida.' };
  }

  marcarNoAsistio(cita: Cita): Resultado {
    if (!this.puedeMarcarAsistencia(cita)) { return { ok: false, mensaje: 'Solo se marcan citas confirmadas de hoy o de días anteriores.' }; }
    cita.estado = 'No asistió';
    this.descartarPendientes(cita.id);
    this.emitir();
    return { ok: true, mensaje: 'Se registró que el paciente no asistió.' };
  }

  // ------------------------------------------------------------------ Bloqueos

  // Bloquea un rango de tiempo de un odontólogo (vacaciones, reunión, mantenimiento...)
  agregarBloqueo(odontologoId: number, inicio: Date, fin: Date, motivo: string): Resultado {
    const odontologo = ODONTOLOGOS.find(o => o.id === odontologoId);
    if (!odontologo) { return { ok: false, mensaje: 'Selecciona un odontólogo.' }; }
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) { return { ok: false, mensaje: 'Indica la fecha y hora de inicio y de fin.' }; }
    if (fin <= inicio) { return { ok: false, mensaje: 'La fecha de fin debe ser posterior a la de inicio.' }; }
    if (fin <= new Date()) { return { ok: false, mensaje: 'El bloqueo debe ser para un horario futuro.' }; }

    const choques = this.citas.filter(c => this.estaActiva(c) && c.odontologoId === odontologoId
      && c.fin > new Date() && this.cruzan(inicio, fin, c.inicio, c.fin)).length;
    if (choques > 0) {
      return { ok: false, mensaje: `No se puede bloquear: hay ${choques} cita(s) en ese rango. Cancélalas o reprográmalas primero.` };
    }

    this.bloqueos.push({
      id: this.siguienteBloqueo++, odontologoId, odontologo: odontologo.nombre,
      inicio, fin, motivo: motivo.trim() || 'Sin motivo indicado'
    });
    this.emitir();
    return { ok: true, mensaje: 'Horario bloqueado. Ya no aparece como disponible.' };
  }

  eliminarBloqueo(bloqueo: Bloqueo): Resultado {
    this.bloqueos = this.bloqueos.filter(b => b.id !== bloqueo.id);
    this.emitir();
    return { ok: true, mensaje: 'Bloqueo eliminado. El horario vuelve a estar disponible.' };
  }

  // ------------------------------------------------------------- Recordatorios

  // Programa un recordatorio "horasAntes" horas antes de la cita
  programarRecordatorio(cita: Cita, canal: CanalRecordatorio, horasAntes: number): Resultado {
    if ((cita.estado !== 'Pendiente' && cita.estado !== 'Confirmada') || cita.inicio <= new Date()) {
      return { ok: false, mensaje: 'Solo se programan recordatorios para citas futuras pendientes o confirmadas.' };
    }
    let programada = new Date(cita.inicio.getTime() - horasAntes * 3600000);
    if (programada < new Date()) { programada = new Date(); }        // Si ya pasó ese momento, queda para enviar ahora

    const repetido = this.recordatorios.some(r => r.citaId === cita.id && r.canal === canal && !r.enviado
      && Math.abs(r.programada.getTime() - programada.getTime()) < 60000);
    if (repetido) { return { ok: false, mensaje: 'Ya existe ese recordatorio para la cita.' }; }

    this.recordatorios.push({ id: this.siguienteRecordatorio++, citaId: cita.id, programada, canal, enviado: false });
    this.emitir();
    return { ok: true, mensaje: 'Recordatorio programado.' };
  }

  // No se envía nada real (no hay servidor): solo se registra que ya se envió
  marcarRecordatorioEnviado(r: Recordatorio): Resultado {
    if (r.enviado) { return { ok: false, mensaje: 'Ese recordatorio ya fue enviado.' }; }
    r.enviado = true;
    r.fechaEnvio = new Date();
    this.emitir();
    return { ok: true, mensaje: `Recordatorio enviado por ${r.canal}.` };
  }

  citaPorId(id: number): Cita | undefined {
    return this.citas.find(c => c.id === id);
  }

  // ------------------------------------------------------------------- Reglas

  puedeCancelar(cita: Cita): boolean {                               // Pendiente o confirmada, y que aún no ocurre
    return (cita.estado === 'Pendiente' || cita.estado === 'Confirmada') && cita.inicio > new Date();
  }

  puedeMarcarAsistencia(cita: Cita): boolean {                       // Confirmada, de hoy o de días anteriores
    const finDeHoy = new Date();
    finDeHoy.setHours(23, 59, 59, 999);
    return cita.estado === 'Confirmada' && cita.inicio <= finDeHoy;
  }

  // ---------------------------------------------------------------- Internos

  private emitir(): void {                                           // Avisa a las pantallas que algo cambió
    this.citasTabla$.next([...this.citas]);
    this.bloqueosTabla$.next([...this.bloqueos]);
    this.recordatoriosTabla$.next([...this.recordatorios]);
  }

  private descartarPendientes(citaId: number): void {                // Una cita cancelada o terminada ya no necesita recordatorios por enviar
    this.recordatorios = this.recordatorios.filter(r => r.citaId !== citaId || r.enviado);
  }

  private estaActiva(c: Cita): boolean {                             // Las canceladas y las "no asistió" liberan el horario
    return c.estado !== 'Cancelada' && c.estado !== 'No asistió';
  }

  private cruzan(a1: Date, a2: Date, b1: Date, b2: Date): boolean {  // ¿[a1, a2) se cruza con [b1, b2)?
    return a1 < b2 && a2 > b1;
  }

  private odontologoOcupado(odontologoId: number, inicio: Date, fin: Date, excluirId: number): boolean {
    return this.citas.some(c => c.id !== excluirId && this.estaActiva(c)
      && c.odontologoId === odontologoId && this.cruzan(inicio, fin, c.inicio, c.fin));
  }

  private odontologoBloqueado(odontologoId: number, inicio: Date, fin: Date): boolean {
    return this.bloqueos.some(b => b.odontologoId === odontologoId && this.cruzan(inicio, fin, b.inicio, b.fin));
  }

  private consultorioOcupado(consultorio: string, inicio: Date, fin: Date, excluirId: number): boolean {
    return this.citas.some(c => c.id !== excluirId && this.estaActiva(c)
      && c.consultorio === consultorio && this.cruzan(inicio, fin, c.inicio, c.fin));
  }

  private consultorioLibre(inicio: Date, fin: Date, excluirId: number): boolean {
    return CONSULTORIOS.some(c => !this.consultorioOcupado(c, inicio, fin, excluirId));
  }

  private sumarMinutos(fecha: Date, minutos: number): Date {
    return new Date(fecha.getTime() + minutos * 60000);
  }

  private aTexto(fecha: Date): string {                              // Date -> 'yyyy-MM-dd'
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  // Citas de ejemplo calculadas a partir de HOY, así siempre hay pasadas, de hoy y futuras para probar
  private crearCitasIniciales(): Cita[] {
    const crear = (id: number, paciente: string, odontologoId: number, consultorio: string,
                   dias: number, hora: number, minuto: number, motivo: string,
                   estado: EstadoCita, origen: OrigenCita, motivoCancelacion?: string): Cita => {
      const inicio = new Date();
      inicio.setDate(inicio.getDate() + dias);
      inicio.setHours(hora, minuto, 0, 0);
      return {
        id, paciente, odontologoId, odontologo: ODONTOLOGOS.find(o => o.id === odontologoId)!.nombre,
        consultorio, inicio, fin: this.sumarMinutos(inicio, DURACION_MINUTOS),
        motivo, estado, origen, motivoCancelacion
      };
    };

    return [
      crear(1, 'Ana Pérez',   1, 'Consultorio 1', -30,  9,  0, 'Limpieza dental',        'Atendida',   'Recepcion'),
      crear(2, 'Ana Pérez',   2, 'Consultorio 2', -10, 15,  0, 'Control de ortodoncia',  'Cancelada',  'Paciente', 'Cancelada por el paciente'),
      crear(3, 'María Pérez', 1, 'Consultorio 1',  -3, 10,  0, 'Revisión general',       'No asistió', 'Recepcion'),
      crear(4, 'Juan Mora',   1, 'Consultorio 2',   0,  8,  0, 'Dolor en molar',         'Confirmada', 'Recepcion'),
      crear(5, 'Luis Bravo',  3, 'Consultorio 1',   0,  8, 30, 'Endodoncia',             'Confirmada', 'Paciente'),
      crear(6, 'Ana Vera',    1, 'Consultorio 1',   0, 14,  0, 'Extracción',             'Pendiente',  'Paciente'),
      crear(7, 'Ana Pérez',   1, 'Consultorio 1',   2, 10,  0, 'Limpieza dental',        'Confirmada', 'Paciente'),
      crear(8, 'María Pérez', 2, 'Consultorio 2',   3, 11,  0, 'Ajuste de brackets',     'Pendiente',  'Paciente'),
      crear(9, 'Juan Mora',   3, 'Consultorio 1',   5, 16,  0, 'Control de endodoncia',  'Confirmada', 'Recepcion')
    ];
  }

  // Bloqueos de ejemplo (calculados desde hoy)
  private crearBloqueosIniciales(): Bloqueo[] {
    const rango = (id: number, odontologoId: number, desdeDias: number, hDesde: number,
                   hastaDias: number, hHasta: number, motivo: string): Bloqueo => {
      const inicio = new Date(); inicio.setDate(inicio.getDate() + desdeDias); inicio.setHours(hDesde, 0, 0, 0);
      const fin = new Date();    fin.setDate(fin.getDate() + hastaDias);       fin.setHours(hHasta, 0, 0, 0);
      return { id, odontologoId, odontologo: ODONTOLOGOS.find(o => o.id === odontologoId)!.nombre, inicio, fin, motivo };
    };
    return [
      rango(1, 3, 4, 14, 4, 18, 'Reunión de capacitación'),
      rango(2, 2, 6, 8, 8, 18, 'Vacaciones')
    ];
  }

  // Recordatorios de ejemplo: uno por cada cita confirmada, 24 h antes
  private crearRecordatoriosIniciales(): Recordatorio[] {
    const lista: Recordatorio[] = [];
    let id = 1;
    for (const c of this.citas.filter(x => x.estado === 'Confirmada')) {
      const programada = new Date(c.inicio.getTime() - 24 * 3600000);
      const enviado = programada < new Date();
      lista.push({ id: id++, citaId: c.id, programada, canal: 'Correo', enviado, fechaEnvio: enviado ? programada : undefined });
    }
    const cita7 = this.citas.find(c => c.id === 7);
    if (cita7) {
      lista.push({ id: id++, citaId: 7, programada: new Date(cita7.inicio.getTime() - 2 * 3600000), canal: 'WhatsApp', enviado: false });
    }
    return lista;
  }
}
