import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.mode';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBalance(): Observable<ApiResponse<{ walletBalance: number }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/wallet/balance`);
  }

  creditToChild(userId: string, amount: number, description?: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/wallet/credit`, { userId, amount, description });
  }

  rechargeWallet(amount: number, description?: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/wallet/recharge`, { amount, description });
  }

  getBalanceSummary(): Observable<ApiResponse<{ myBalance: number; downlineBalance: number; totalBalance: number }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/wallet/summary`);
  }

  getBalanceStatement(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/wallet/statement`);
  }
}