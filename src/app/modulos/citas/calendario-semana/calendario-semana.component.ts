import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest } from 'rxjs';
import { AuthService } from '../../../servicios/auth.service';
import { CitaService, Odontologo } from '../../../servicios/cita.service';

interface Celda {                                                    // Un espacio de 30 minutos en el calendario
  inicio: Date;
  clase: string;                                                     // Color según el estado del espacio
  texto: string;
  detalle: string;                                                   // Texto secundario (estado de la cita, motivo del bloqueo)
  titulo: string;                                                    // Tooltip
  seleccionable: boolean;                                            // Si se puede hacer clic para pedir la cita
}

interface Fila {                                                     // Una fila = una hora del día
  hora: Date;
  celdas: Celda[];
}

export interface EspacioElegido {                                    // Lo que se envía al hacer clic en un espacio libre
  odontologoId: number;
  inicio: Date;
}

@Component({
  selector: 'app-calendario-semana',
  imports: [DatePipe, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './calendario-semana.component.html',
  styleUrl: './calendario-semana.component.css'
})
export class CalendarioSemanaComponent implements OnInit {
  private citaT = inject(CitaService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  elegir = output<EspacioElegido>();                                 // Aviso al padre: "quieren agendar en este espacio"

  odontologos: Odontologo[] = this.citaT.odontologos();
  odontologoId = this.odontologos[0].id;
  lunes = this.lunesInicial();                                       // Lunes de la semana que se muestra
  nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];                 // Nombres en español (el pipe date los daría en inglés)
  dias: Date[] = [];                                                 // De lunes a viernes
  filas: Fila[] = [];

  get esOdontologo(): boolean {                                      // El odontólogo solo ve SU calendario
    return this.auth.rol === 'odontologo';
  }

  get puedeSolicitar(): boolean {                                    // El odontólogo no pide citas; los demás sí
    return this.auth.rol !== 'odontologo';
  }

  get esPaciente(): boolean {
    return this.auth.rol === 'paciente';
  }

  ngOnInit(): void {
    if (this.esOdontologo) {                                         // Selecciona al odontólogo que inició sesión
      const yo = this.odontologos.find(o => o.nombre === this.auth.usuarioActual);
      if (yo) { this.odontologoId = yo.id; }
    }

    // El calendario se redibuja solo cuando cambian las citas o los bloqueos
    combineLatest([this.citaT.citasTabla$, this.citaT.bloqueosTabla$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.construir());
  }

  cambiarSemana(semanas: number): void {
    const nuevo = new Date(this.lunes);
    nuevo.setDate(nuevo.getDate() + semanas * 7);
    this.lunes = nuevo;
    this.construir();
  }

  irAHoy(): void {
    this.lunes = this.lunesInicial();
    this.construir();
  }

  elegirEspacio(c: Celda): void {
    if (c.seleccionable) { this.elegir.emit({ odontologoId: this.odontologoId, inicio: c.inicio }); }
  }

  construir(): void {
    this.dias = [0, 1, 2, 3, 4].map(i => {
      const d = new Date(this.lunes);
      d.setDate(d.getDate() + i);
      return d;
    });

    this.filas = this.citaT.espaciosDelDia().map(e => ({
      hora: new Date(2000, 0, 1, e.hora, e.minuto),                  // Solo se usa para mostrar la hora
      celdas: this.dias.map(d => this.crearCelda(new Date(d.getFullYear(), d.getMonth(), d.getDate(), e.hora, e.minuto)))
    }));
  }

  private crearCelda(inicio: Date): Celda {
    const espacio = this.citaT.espacio(this.odontologoId, inicio);
    const celda: Celda = { inicio, clase: 'pasado', texto: '', detalle: '', titulo: '', seleccionable: false };

    switch (espacio.tipo) {
      case 'libre':
        celda.clase = 'libre';
        celda.texto = 'Libre';
        celda.seleccionable = this.puedeSolicitar;
        celda.titulo = this.puedeSolicitar ? 'Clic para agendar una cita' : 'Horario disponible';
        break;

      case 'bloqueado':
        celda.clase = 'bloqueado';
        celda.texto = 'Bloqueado';
        celda.detalle = this.esPaciente ? '' : espacio.bloqueo?.motivo ?? '';   // El paciente no ve el motivo
        celda.titulo = this.esPaciente ? 'No disponible' : `Bloqueado: ${espacio.bloqueo?.motivo}`;
        break;

      case 'ocupado': {
        const cita = espacio.cita;
        if (!cita) {                                                 // Hay odontólogo libre, pero no consultorios
          celda.clase = 'ocupado';
          celda.texto = 'Ocupado';
          celda.titulo = 'No hay consultorios libres';
        } else if (this.esPaciente && cita.paciente !== this.auth.usuarioActual) {
          celda.clase = 'ocupado';                                   // El paciente no ve los datos de otros pacientes
          celda.texto = 'Ocupado';
          celda.titulo = 'Horario ocupado';
        } else {
          celda.clase = `cita-${cita.estado === 'No asistió' ? 'noasistio' : cita.estado.toLowerCase()}`;
          celda.texto = this.esPaciente ? 'Tu cita' : cita.paciente;
          celda.detalle = cita.estado;
          celda.titulo = `${cita.paciente} · ${cita.motivo} · ${cita.consultorio} · ${cita.estado}`;
        }
        break;
      }
    }
    return celda;
  }

  private lunesInicial(): Date {                                     // Lunes de esta semana (si es fin de semana, el de la próxima)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dia = hoy.getDay();                                        // 0 = domingo ... 6 = sábado
    const desplazamiento = dia === 0 ? 1 : dia === 6 ? 2 : -(dia - 1);
    hoy.setDate(hoy.getDate() + desplazamiento);
    return hoy;
  }
}
