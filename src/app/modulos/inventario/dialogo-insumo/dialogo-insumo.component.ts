import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Insumo } from '../../../servicios/insumo.service';

@Component({
  selector: 'app-dialogo-insumo',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ insumo.id ? 'Modificar insumo' : 'Nuevo insumo' }}</h2>
    <mat-dialog-content class="d-flex flex-column pt-2">
      <mat-form-field appearance="outline">
        <mat-label>Código</mat-label>
        <input matInput [(ngModel)]="insumo.codigo">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput [(ngModel)]="insumo.nombre">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Categoría</mat-label>
        <input matInput [(ngModel)]="insumo.categoria">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Stock</mat-label>
        <input matInput type="number" [(ngModel)]="insumo.stock">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Proveedor</mat-label>
        <input matInput [(ngModel)]="insumo.proveedor">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Precio</mat-label>
        <input matInput type="number" [(ngModel)]="insumo.precio">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button (click)="guardar()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class DialogoInsumoComponent {
  private ref = inject(MatDialogRef<DialogoInsumoComponent>);
  private data = inject<Insumo | null>(MAT_DIALOG_DATA);

  insumo: Insumo = this.data
    ? { ...this.data }
    : { id: 0, codigo: '', nombre: '', categoria: '', stock: 0, proveedor: '', precio: 0 };

  cancelar(): void { this.ref.close(); }
  guardar(): void { this.ref.close(this.insumo); }
}