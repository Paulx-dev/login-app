import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { combineLatest } from 'rxjs';
import { CanalRecordatorio, Cita, CitaService, Recordatorio, Resultado } from '../../../servicios/cita.service';

interface FilaRecordatorio {                                         // Un recordatorio junto con los datos de su cita
  recordatorio: Recordatorio;
  cita: Cita;
  estado: 'Enviado' | 'Por enviar' | 'Programado';
}

@Component({
  selector: 'app-recordatorios',
  imports: [DatePipe, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './recordatorios.component.html'
})
export class RecordatoriosComponent implements OnInit {
  private citaT = inject(CitaService);
  private destroyRef = inject(DestroyRef);

  resultado = output<Resultado>();                                   // Aviso al padre para mostrar el mensaje

  columnas = ['programada', 'paciente', 'cita', 'canal', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<FilaRecordatorio>([]);

  canales: CanalRecordatorio[] = ['Correo', 'SMS', 'WhatsApp'];
  anticipaciones = [{ horas: 2, texto: '2 horas antes' }, { horas: 24, texto: '24 horas antes' }, { horas: 48, texto: '48 horas antes' }];

  citasFuturas: Cita[] = [];                                         // Citas para las que se puede programar un recordatorio
  citaId = 0;                                                        // Formulario: cita elegida
  canal: CanalRecordatorio = 'Correo';
  horas = 24;

  ngOnInit(): void {
    // Se actualiza sola cuando cambian las citas o los recordatorios
    combineLatest([this.citaT.citasTabla$, this.citaT.recordatoriosTabla$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([citas, recordatorios]) => {
        this.citasFuturas = citas.filter(c => this.citaT.puedeCancelar(c))
          .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

        const ahora = new Date();
        const filas: FilaRecordatorio[] = [];
        for (const r of recordatorios) {
          const cita = citas.find(c => c.id === r.citaId);
          if (!cita) { continue; }
          filas.push({ recordatorio: r, cita, estado: r.enviado ? 'Enviado' : r.programada <= ahora ? 'Por enviar' : 'Programado' });
        }
        this.dataSource.data = filas.sort((a, b) => a.recordatorio.programada.getTime() - b.recordatorio.programada.getTime());
      });
  }

  programar(): void {
    const cita = this.citasFuturas.find(c => c.id === this.citaId);
    if (!cita) {
      this.resultado.emit({ ok: false, mensaje: 'Selecciona la cita para el recordatorio.' });
      return;
    }
    this.resultado.emit(this.citaT.programarRecordatorio(cita, this.canal, this.horas));
  }

  enviar(f: FilaRecordatorio): void {
    this.resultado.emit(this.citaT.marcarRecordatorioEnviado(f.recordatorio));
  }

  claseEstado(estado: FilaRecordatorio['estado']): string {
    return estado === 'Enviado' ? 'bg-success' : estado === 'Por enviar' ? 'bg-danger' : 'bg-warning text-dark';
  }
}
