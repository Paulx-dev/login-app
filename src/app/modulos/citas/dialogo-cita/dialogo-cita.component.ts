import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Cita, CitaService, DatosCita, Odontologo } from '../../../servicios/cita.service';

// Datos que recibe el diálogo
export interface DatosDialogoCita {
  pacienteFijo: string | null;   // Si el que entra es un paciente, solo puede pedir citas para él mismo
  cita: Cita | null;             // Si viene una cita, el diálogo sirve para REPROGRAMARLA (solo cambia fecha y hora)
  odontologoId?: number;         // Si vienen del calendario, el odontólogo y la hora ya quedan elegidos
  inicio?: Date;
}

@Component({
  selector: 'app-dialogo-cita',
  imports: [DatePipe, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ reprogramando ? 'Reprogramar cita' : 'Solicitar cita' }}</h2>
    <mat-dialog-content class="d-flex flex-column pt-2">

      @if (data.pacienteFijo || reprogramando) {
        <mat-form-field appearance="outline">
          <mat-label>Paciente</mat-label>
          <input matInput [value]="paciente" readonly>
        </mat-form-field>
      } @else {
        <mat-form-field appearance="outline">
          <mat-label>Paciente</mat-label>
          <mat-select [(ngModel)]="paciente">
            @for (p of pacientes; track p) { <mat-option [value]="p">{{ p }}</mat-option> }
          </mat-select>
        </mat-form-field>
      }

      <mat-form-field appearance="outline">
        <mat-label>Odontólogo</mat-label>
        <mat-select [(ngModel)]="odontologoId" (selectionChange)="actualizarHorarios()" [disabled]="reprogramando">
          @for (o of odontologos; track o.id) {
            <mat-option [value]="o.id">{{ o.nombre }} · {{ o.especialidad }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Fecha</mat-label>
        <input matInput type="date" [min]="hoy" [(ngModel)]="fecha" (change)="actualizarHorarios()">
        <mat-hint>Se atiende de lunes a viernes</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="mt-3">
        <mat-label>Hora</mat-label>
        <mat-select [(ngModel)]="hora" [disabled]="horas.length === 0">
          @for (h of horas; track h.getTime()) {
            <mat-option [value]="h.getTime()">{{ h | date: 'HH:mm' }}</mat-option>
          }
        </mat-select>
        @if (fecha && odontologoId && horas.length === 0) {
          <mat-hint>No hay horarios disponibles ese día</mat-hint>
        }
      </mat-form-field>

      @if (!reprogramando) {
        <mat-form-field appearance="outline" class="mt-3">
          <mat-label>Motivo de la consulta</mat-label>
          <input matInput [(ngModel)]="motivo" maxlength="200" placeholder="Limpieza, dolor, control...">
        </mat-form-field>
      }

      @if (error) { <div class="alert alert-danger py-2 mb-0">{{ error }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button (click)="guardar()">{{ reprogramando ? 'Reprogramar' : 'Solicitar' }}</button>
    </mat-dialog-actions>
  `
})
export class DialogoCitaComponent {
  private ref = inject(MatDialogRef<DialogoCitaComponent>);
  private servicio = inject(CitaService);
  data = inject<DatosDialogoCita>(MAT_DIALOG_DATA);

  reprogramando = !!this.data.cita;                                  // true = se está reprogramando una cita existente
  pacientes: string[] = this.servicio.pacientes();
  odontologos: Odontologo[] = this.servicio.odontologos();

  paciente = this.data.cita?.paciente ?? this.data.pacienteFijo ?? '';
  odontologoId = this.data.cita?.odontologoId ?? this.data.odontologoId ?? 0;
  motivo = this.data.cita?.motivo ?? '';
  fecha = '';                                                        // 'yyyy-MM-dd' (lo que entrega <input type="date">)
  hora: number | null = null;                                        // Hora elegida (milisegundos)
  horas: Date[] = [];                                                // Horarios libres para esa fecha y odontólogo
  error = '';

  hoy = this.aTexto(new Date());                                     // Fecha mínima que se puede elegir

  constructor() {
    if (this.data.inicio && this.odontologoId) {                     // Viene del calendario: deja fecha y hora ya elegidas
      this.fecha = this.aTexto(this.data.inicio);
      this.actualizarHorarios();
      const elegida = this.data.inicio.getTime();
      if (this.horas.some(h => h.getTime() === elegida)) { this.hora = elegida; }
    }
  }

  actualizarHorarios(): void {                                       // Recalcula las horas libres al cambiar odontólogo o fecha
    this.hora = null;
    this.error = '';
    this.horas = this.odontologoId && this.fecha
      ? this.servicio.horariosDisponibles(this.odontologoId, this.fecha, this.data.cita?.id ?? 0)
      : [];
  }

  cancelar(): void { this.ref.close(); }

  guardar(): void {
    if (!this.paciente || !this.odontologoId || !this.fecha || this.hora === null) {
      this.error = 'Completa paciente, odontólogo, fecha y hora.';
      return;
    }
    const resultado: DatosCita = {
      paciente: this.paciente,
      odontologoId: this.odontologoId,
      inicio: new Date(this.hora),
      motivo: this.motivo
    };
    this.ref.close(resultado);
  }

  private aTexto(fecha: Date): string {                              // Date -> 'yyyy-MM-dd'
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
