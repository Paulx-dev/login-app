import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CitaService, Odontologo } from '../../../servicios/cita.service';

// Lo que devuelve el diálogo
export interface DatosBloqueo {
  odontologoId: number;
  inicio: Date;
  fin: Date;
  motivo: string;
}

@Component({
  selector: 'app-dialogo-bloqueo',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Bloquear horario</h2>
    <mat-dialog-content class="d-flex flex-column pt-2">
      <mat-form-field appearance="outline">
        <mat-label>Odontólogo</mat-label>
        <mat-select [(ngModel)]="odontologoId">
          @for (o of odontologos; track o.id) { <mat-option [value]="o.id">{{ o.nombre }}</mat-option> }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Desde</mat-label>
        <input matInput type="datetime-local" [(ngModel)]="desde">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hasta</mat-label>
        <input matInput type="datetime-local" [(ngModel)]="hasta">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Motivo</mat-label>
        <input matInput [(ngModel)]="motivo" maxlength="200" placeholder="Vacaciones, reunión, mantenimiento...">
      </mat-form-field>

      @if (error) { <div class="alert alert-danger py-2 mb-0">{{ error }}</div> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button (click)="guardar()">Bloquear</button>
    </mat-dialog-actions>
  `
})
export class DialogoBloqueoComponent {
  private ref = inject(MatDialogRef<DialogoBloqueoComponent>);
  private servicio = inject(CitaService);

  odontologos: Odontologo[] = this.servicio.odontologos();
  odontologoId = 0;
  desde = '';                                                        // 'yyyy-MM-ddTHH:mm' (lo que entrega datetime-local)
  hasta = '';
  motivo = '';
  error = '';

  cancelar(): void { this.ref.close(); }

  guardar(): void {
    if (!this.odontologoId || !this.desde || !this.hasta) {
      this.error = 'Completa odontólogo, desde y hasta.';
      return;
    }
    const resultado: DatosBloqueo = {
      odontologoId: this.odontologoId,
      inicio: new Date(this.desde),                                  // Sin zona horaria: se interpreta como hora local
      fin: new Date(this.hasta),
      motivo: this.motivo
    };
    this.ref.close(resultado);
  }
}
