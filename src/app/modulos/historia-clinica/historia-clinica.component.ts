import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../servicios/auth.service';
import {
  Antecedentes, Atencion, DatosAtencion, DatosPaciente, ESTADOS_PIEZA, EstadoPieza,
  HistoriaService, Paciente, PIEZAS_INFERIORES, PIEZAS_SUPERIORES, Resultado
} from '../../servicios/historia.service';

@Component({
  imports: [DatePipe, FormsModule, MatTabsModule],
  selector: 'app-historia-clinica',
  styleUrl: './historia-clinica.component.css',
  templateUrl: './historia-clinica.component.html',
})
export class HistoriaClinicaComponent implements OnInit {
  private servicio = inject(HistoriaService);
  private auth = inject(AuthService);

  // Catálogos para el odontograma
  estados = ESTADOS_PIEZA;
  superiores = PIEZAS_SUPERIORES;
  inferiores = PIEZAS_INFERIORES;
  todasLasPiezas = [...PIEZAS_SUPERIORES, ...PIEZAS_INFERIORES].sort((a, b) => a - b);

  pacientes: Paciente[] = [];                        
  seleccionado: Paciente | null = null;              
  atenciones: Atencion[] = [];                       

  texto = '';                                        
  pestana = 0;                                       
  mensaje: Resultado | null = null;                  

  // Formularios
  mostrarNueva = false;                              
  nueva: DatosPaciente = this.fichaVacia();
  antecedentes: Antecedentes = this.antecedentesVacios();
  estadoElegido: EstadoPieza = 'Caries';             
  atencion: DatosAtencion = this.atencionVacia();

  // rol

  get esPaciente(): boolean {                        
    return this.auth.rol === 'paciente';
  }

  get puedeEditar(): boolean {                       // Odontólogo y administrador editan; el paciente solo lee
    return this.auth.rol === 'odontologo' || this.auth.rol === 'administrador';
  }

  //  Carga

  ngOnInit(): void {
    if (this.esPaciente) {
      const ficha = this.servicio.pacientePorNombre(this.auth.usuarioActual);
      if (ficha) { this.seleccionar(ficha); }
    } else {
      this.cargarLista();
    }
  }

  cargarLista(): void {
    const t = this.texto.trim().toLowerCase();
    this.pacientes = this.servicio.listarPacientes()
      .filter(p => !t || `${p.nombre} ${p.cedula}`.toLowerCase().includes(t));
  }

  buscar(texto: string): void {
    this.texto = texto;
    this.cargarLista();
  }

  seleccionar(p: Paciente): void {
    this.seleccionado = p;
    this.antecedentes = { ...p.antecedentes };       
    this.atencion = this.atencionVacia();
    this.mensaje = null;
    this.pestana = 0;
    this.actualizarHistorial();
  }

  private actualizarHistorial(): void {
    this.atenciones = this.seleccionado ? this.servicio.atencionesDe(this.seleccionado.id) : [];
  }

  edad(p: Paciente): number {
    return this.servicio.edad(p.fechaNacimiento);
  }
  //  Apertura de ficha
  abrirFicha(): void {
    const res = this.servicio.abrirFicha(this.nueva);
    this.mensaje = res;
    if (res.ok && res.paciente) {
      this.mostrarNueva = false;
      this.nueva = this.fichaVacia();
      this.cargarLista();
      this.seleccionar(res.paciente);
      this.mensaje = res;                            
    }
  }
  // Antecedentes
  guardarAntecedentes(): void {
    if (!this.seleccionado || !this.puedeEditar) { return; }
    this.mensaje = this.servicio.guardarAntecedentes(this.seleccionado, this.antecedentes);
  }
  // Odontograma
  estadoDe(pieza: number): EstadoPieza {
    return this.seleccionado ? this.servicio.estadoPieza(this.seleccionado, pieza) : 'Sano';
  }

  colorDe(pieza: number): string {
    return this.servicio.colorEstado(this.estadoDe(pieza));
  }

  marcar(pieza: number): void {                      // Clic en una pieza: le pone el estado elegido
    if (!this.seleccionado || !this.puedeEditar) { return; }
    this.mensaje = this.servicio.marcarPieza(this.seleccionado, pieza, this.estadoElegido);
  }

  get piezasConProblema(): { pieza: number; estado: EstadoPieza }[] {   // Resumen debajo del odontograma
    if (!this.seleccionado) { return []; }
    return Object.entries(this.seleccionado.odontograma)
      .map(([pieza, estado]) => ({ pieza: Number(pieza), estado }))
      .filter(x => x.estado !== 'Sano')
      .sort((a, b) => a.pieza - b.pieza);
  }
  // Atenciones
  registrarAtencion(): void {
    if (!this.seleccionado || !this.puedeEditar) { return; }
    const res = this.servicio.registrarAtencion(this.seleccionado, this.atencion, this.auth.usuarioActual);
    this.mensaje = res;
    if (res.ok) {
      this.atencion = this.atencionVacia();
      this.actualizarHistorial();
      this.pestana = 2;                             
    }
  }
  //  Auxiliares
  private fichaVacia(): DatosPaciente {
    return { cedula: '', nombre: '', fechaNacimiento: '', telefono: '', correo: '' };
  }

  private antecedentesVacios(): Antecedentes {
    return { alergias: '', enfermedades: '', medicamentos: '', cirugias: '', habitos: '' };
  }

  private atencionVacia(): DatosAtencion {
    return { motivo: '', pieza: null, diagnostico: '', procedimiento: '', planTratamiento: '' };
  }
}