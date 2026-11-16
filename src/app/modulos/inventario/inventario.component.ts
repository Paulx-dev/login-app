import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AuthService } from '../../servicios/auth.service';
import { Insumo, InsumoService } from '../../servicios/insumo.service';
import { DialogoInsumoComponent } from './dialogo-insumo/dialogo-insumo.component';

@Component({
  imports: [CurrencyPipe, MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  selector: 'app-inventario',
  styleUrl: './inventario.component.css',
  templateUrl: './inventario.component.html',
})
export class InventarioComponent implements OnInit {
  private servicio = inject(InsumoService);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);

  columnas = ['codigo', 'nombre', 'categoria', 'stock', 'proveedor', 'precio', 'acciones'];
  dataSource = new MatTableDataSource<Insumo>([]);

  get puedeEditar(): boolean {
    return this.auth.rol !== 'odontologo';
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.dataSource.data = this.servicio.listar();
  }

  filtrar(texto: string): void {
    this.dataSource.filter = texto.trim().toLowerCase();
  }

  nuevo(): void {
    this.dialog.open(DialogoInsumoComponent, { width: '420px', data: null })
      .afterClosed().subscribe((res?: Insumo) => {
        if (res) { this.servicio.agregar(res); this.cargar(); }
      });
  }

  modificar(insumo: Insumo): void {
    this.dialog.open(DialogoInsumoComponent, { width: '420px', data: insumo })
      .afterClosed().subscribe((res?: Insumo) => {
        if (res) { this.servicio.modificar(res); this.cargar(); }
      });
  }

  eliminar(insumo: Insumo): void {
    if (confirm(`¿Eliminar "${insumo.nombre}"?`)) {
      this.servicio.eliminar(insumo.id);
      this.cargar();
    }
  }
}