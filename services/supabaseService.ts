
import { Student, Teacher, Payment, CashTransaction, MatchSquad, SchoolSettings } from '../types';

export class SupabaseService {
  private url: string;
  private key: string;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  private async request(table: string, method: string, body?: any, query: string = '') {
    if (!this.url || !this.key) throw new Error("Credenciales de Supabase no configuradas");
    
    // Limpiar URL para evitar dobles barras
    const cleanUrl = this.url.replace(/\/$/, "");

    const options: RequestInit = {
      method,
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    if (body) options.body = JSON.stringify(body);

    try {
      const response = await fetch(`${cleanUrl}/rest/v1/${table}${query}`, options);
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errBody = await response.json();
          errorMessage = errBody.message || errorMessage;
        } catch (e) {
          // Si no es JSON, capturar el texto
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (e: any) {
      console.error(`Supabase Request Error [${table}]:`, e);
      throw e;
    }
  }

  async testConnection() {
    // Intenta leer la tabla students para verificar conexión y existencia
    try {
      await this.request('students', 'GET', undefined, '?select=id&limit=1');
      return { success: true, message: "¡Conexión exitosa! Las tablas existen y las credenciales son correctas." };
    } catch (e: any) {
      if (e.message.includes("404")) {
        return { success: false, message: "Error 404: Las tablas no existen en tu base de datos. Debes ejecutar el script SQL." };
      }
      return { success: false, message: e.message };
    }
  }

  async fetchAll(table: string) {
    return this.request(table, 'GET', undefined, '?select=*');
  }

  async upsertStudent(data: Student) { 
    return this.request('students', 'POST', data, '?on_conflict=id'); 
  }
  async upsertTeacher(data: Teacher) { return this.request('teachers', 'POST', data, '?on_conflict=id'); }
  async upsertPayment(data: Payment) { return this.request('payments', 'POST', data, '?on_conflict=id'); }
  async upsertCashFlow(data: CashTransaction) { return this.request('cash_flow', 'POST', data, '?on_conflict=id'); }
  
  async downloadEverything() {
    const [students, teachers, cashFlow, payments] = await Promise.all([
      this.fetchAll('students').catch(() => []),
      this.fetchAll('teachers').catch(() => []),
      this.fetchAll('cash_flow').catch(() => []),
      this.fetchAll('payments').catch(() => [])
    ]);
    return { students, teachers, cashFlow, payments };
  }
}
