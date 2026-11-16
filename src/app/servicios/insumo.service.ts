import { Injectable } from '@angular/core';

export interface Insumo {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  proveedor: string;
  precio: number;
}

@Injectable({ providedIn: 'root' })
export class InsumoService {

  private insumos: Insumo[] = [
    { id: 1, codigo: 'INS-001', nombre: 'Anestesia Lidocaína 2%',   categoria: 'Anestesia',    stock: 40, proveedor: 'DentalPro',  precio: 1.50 },
    { id: 2, codigo: 'INS-002', nombre: 'Resina compuesta A2',      categoria: 'Restauración', stock: 15, proveedor: '3M Ecuador', precio: 28.00 },
    { id: 3, codigo: 'INS-003', nombre: 'Guantes de nitrilo (caja)', categoria: 'Bioseguridad', stock: 25, proveedor: 'MedSupply',  precio: 9.50 },
    { id: 4, codigo: 'INS-004', nombre: 'Mascarillas (caja)',       categoria: 'Bioseguridad', stock: 30, proveedor: 'MedSupply',  precio: 6.00 },
    { id: 5, codigo: 'INS-005', nombre: 'Hilo de sutura 4-0',       categoria: 'Cirugía',      stock: 50, proveedor: 'DentalPro',  precio: 2.20 },
    { id: 6, codigo: 'INS-006', nombre: 'Brackets metálicos (kit)', categoria: 'Ortodoncia',   stock: 8,  proveedor: 'OrthoMax',   precio: 45.00 }
  ];

  private siguienteId = 7;

  listar(): Insumo[] {                                   // READ
    return [...this.insumos];
  }

  agregar(datos: Omit<Insumo, 'id'>): void {             // CREATE
    this.insumos.push({ ...datos, id: this.siguienteId++ });
  }

  modificar(insumo: Insumo): void {                      // UPDATE
    const i = this.insumos.findIndex(x => x.id === insumo.id);
    if (i !== -1) { this.insumos[i] = { ...insumo }; }
  }

  eliminar(id: number): void {                           // DELETE
    this.insumos = this.insumos.filter(x => x.id !== id);
  }
}