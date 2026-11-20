import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Bloqueo, CitaService, Resultado } from '../../../servicios/cita.service';
import { DatosBloqueo, DialogoBloqueoComponent } from './dialogo-bloqueo.component';

@Component({
  selector: 'app-bloqueos',
  imports: [DatePipe, MatTableModule, MatButtonModule, MatDialogModule],
  templateUrl: './bloqueos.component.html'
})
export class BloqueosComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  private citaT = inject(CitaService);
  private destroyRef = inject(DestroyRef);

  resultado = output<Resultado>();                                   // Aviso al padre para mostrar el mensaje

  columnas = ['odontologo', 'desde', 'hasta', 'motivo', 'acciones'];
  dataSource = new MatTableDataSource<Bloqueo>([]);

  ngOnInit(): void {
    // Verifica los cambios en la tabla de bloqueos
    this.citaT.bloqueosTabla$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.dataSource.data = [...data].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    });
  }

  nuevo(): void {
    this.dialog.open(DialogoBloqueoComponent, { width: '440px' })
      .afterClosed().subscribe((res?: DatosBloqueo) => {
        if (res) { this.resultado.emit(this.citaT.agregarBloqueo(res.odontologoId, res.inicio, res.fin, res.motivo)); }
      });
  }

  eliminar(b: Bloqueo): void {
    if (confirm(`¿Eliminar el bloqueo de ${b.odontologo} (${b.motivo})?`)) {
      this.resultado.emit(this.citaT.eliminarBloqueo(b));
    }
  }
}
