import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../servicios/auth.service';
import { Cita, CitaService, DatosCita, EstadoCita, Odontologo, Resultado } from '../../servicios/cita.service';
import { BloqueosComponent } from './bloqueos/bloqueos.component';
import { CalendarioSemanaComponent, EspacioElegido } from './calendario-semana/calendario-semana.component';
import { DialogoCitaComponent } from './dialogo-cita/dialogo-cita.component';
import { RecordatoriosComponent } from './recordatorios/recordatorios.component';

type Accion = 'confirmar' | 'reprogramar' | 'cancelar' | 'atender' | 'noAsistio';
type Vista = 'proximas' | 'historicas' | 'todas';

@Component({
  imports: [DatePipe, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule,
    MatTabsModule, CalendarioSemanaComponent, BloqueosComponent, RecordatoriosComponent],
  selector: 'app-citas',
  styleUrl: './citas.component.css',
  templateUrl: './citas.component.html',
})
export class CitasComponent implements OnInit {
  readonly dialog = inject(MatDialog);                               // Para abrir la ventana de solicitar/reprogramar
  private destroyRef = inject(DestroyRef);                           // Para dejar de escuchar al salir de la pantalla

  columnas = ['fecha', 'hora', 'paciente', 'odontologo', 'consultorio', 'motivo', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Cita>([]);                     // Datos que muestra la tabla
  odontologos: Odontologo[] = [];                                    // Para el filtro por odontólogo
  estados: EstadoCita[] = ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada', 'No asistió'];

  private citas: Cita[] = [];                                        // Todas las citas (sin filtrar)
  citaSelect: any = {};                                              // Cita seleccionada

  // Filtros de la pantalla
  vista: Vista = 'proximas';
  texto = '';
  filtroOdontologo = 0;                                              // 0 = todos
  filtroEstado = '';                                                 // '' = todos

  mensaje: Resultado | null = null;                                  // Mensaje de éxito o error tras una acción

  constructor(private citaT: CitaService, private auth: AuthService) {}

  // ---------------------------------------------------------------- Según el rol

  get titulo(): string {                                             // El título cambia según quién entra
    switch (this.auth.rol) {
      case 'paciente': return 'Mis citas';
      case 'odontologo': return 'Mi agenda';
      default: return 'Gestión de citas';
    }
  }

  get esPersonal(): boolean {                                        // Recepción y administración ven todas las citas
    return this.auth.rol === 'recepcionista' || this.auth.rol === 'administrador';
  }

  get puedeSolicitar(): boolean {                                    // El odontólogo solo consulta y marca atendidas
    return this.auth.rol === 'paciente' || this.esPersonal;
  }

  puede(accion: Accion, c: Cita): boolean {                          // ¿Este rol puede hacer esta acción sobre esta cita?
    const rol = this.auth.rol;
    switch (accion) {
      case 'confirmar':   return this.esPersonal && c.estado === 'Pendiente';
      case 'reprogramar': return this.esPersonal && this.citaT.puedeCancelar(c);   // El paciente no reprograma: cancela y agenda otra
      case 'cancelar':    return (rol === 'paciente' || this.esPersonal) && this.citaT.puedeCancelar(c);
      case 'atender':
      case 'noAsistio':   return (rol === 'odontologo' || rol === 'administrador') && this.citaT.puedeMarcarAsistencia(c);
    }
  }

  // ---------------------------------------------------------------- Carga y filtros

  ngOnInit(): void {
    this.odontologos = this.citaT.odontologos();

    // Verifica la selección de una cita
    this.citaT.citaSeleccionada$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.citaSelect = data;
    });

    // Verifica los cambios en la tabla de citas
    this.citaT.citasTabla$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.citas = data;
      this.aplicarFiltros();
    });
  }

  aplicarFiltros(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const texto = this.texto.trim().toLowerCase();

    let lista = this.citas.filter(c => {
      // Cada rol ve solo lo suyo: el paciente sus citas y el odontólogo su agenda
      if (this.auth.rol === 'paciente' && c.paciente !== this.auth.usuarioActual) { return false; }
      if (this.auth.rol === 'odontologo' && c.odontologo !== this.auth.usuarioActual) { return false; }

      if (this.vista === 'proximas' && c.inicio < hoy) { return false; }   // "Hoy y próximas"
      if (this.vista === 'historicas' && c.inicio >= hoy) { return false; }
      if (this.filtroOdontologo && c.odontologoId !== this.filtroOdontologo) { return false; }
      if (this.filtroEstado && c.estado !== this.filtroEstado) { return false; }

      return !texto || `${c.paciente} ${c.odontologo} ${c.motivo} ${c.consultorio}`.toLowerCase().includes(texto);
    });

    lista = lista.sort((a, b) => this.vista === 'historicas'
      ? b.inicio.getTime() - a.inicio.getTime()                       // Históricas: de la más reciente a la más antigua
      : a.inicio.getTime() - b.inicio.getTime());                     // Próximas: de la más cercana a la más lejana
    this.dataSource.data = lista;
  }

  filtrarTexto(texto: string): void {
    this.texto = texto;
    this.aplicarFiltros();
  }

  // ---------------------------------------------------------------- Acciones

  nueva(): void {
    this.nuevaEn();
  }

  alElegirEspacio(e: EspacioElegido): void {                         // Clic en un espacio libre del calendario
    this.nuevaEn(e.odontologoId, e.inicio);
  }

  // Abre el diálogo para solicitar una cita (opcionalmente con odontólogo y hora ya elegidos)
  private nuevaEn(odontologoId?: number, inicio?: Date): void {
    const pacienteFijo = this.auth.rol === 'paciente' ? this.auth.usuarioActual : null;
    this.dialog.open(DialogoCitaComponent, { width: '460px', data: { pacienteFijo, cita: null, odontologoId, inicio } })
      .afterClosed().subscribe((res?: DatosCita) => {
        if (res) {
          this.mensaje = this.citaT.solicitar(res, this.auth.rol === 'paciente' ? 'Paciente' : 'Recepcion');
        }
      });
  }

  reprogramar(c: Cita): void {
    this.citaT.citaSeleccionada$.next(c);
    this.dialog.open(DialogoCitaComponent, { width: '460px', data: { pacienteFijo: null, cita: c, odontologoId: undefined, inicio: undefined } })
      .afterClosed().subscribe((res?: DatosCita) => {
        if (res) { this.mensaje = this.citaT.reprogramar(c, res.inicio); }
      });
  }

  confirmar(c: Cita): void {
    this.mensaje = this.citaT.confirmar(c);
  }

  cancelar(c: Cita): void {
    const motivo = prompt('Motivo de la cancelación (opcional):');
    if (motivo === null) { return; }                                 // Si cierra el cuadro, no se cancela nada
    this.mensaje = this.citaT.cancelar(c, motivo || (this.auth.rol === 'paciente' ? 'Cancelada por el paciente' : ''));
  }

  atender(c: Cita): void {
    this.mensaje = this.citaT.marcarAtendida(c);
  }

  noAsistio(c: Cita): void {
    this.mensaje = this.citaT.marcarNoAsistio(c);
  }

  claseEstado(estado: EstadoCita): string {                          // Color de la etiqueta de cada estado
    switch (estado) {
      case 'Confirmada': return 'bg-success';
      case 'Pendiente': return 'bg-warning text-dark';
      case 'Atendida': return 'bg-primary';
      case 'Cancelada': return 'bg-danger';
      default: return 'bg-secondary';                                // No asistió
    }
  }
}
