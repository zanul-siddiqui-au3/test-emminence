import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import {ApiResponse} from '../models/api-response.mode';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(filters?: { role?: string; limit?: number }): Observable<ApiResponse<{ count: number; users: User[] }>> {
    let params = new HttpParams();
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ApiResponse>(`${this.apiUrl}/admin/users`, { params });
  }

  getNextLevelUsers(userId: string): Observable<ApiResponse<{ count: number; users: User[] }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/admin/users/${userId}/next-level`);
  }

  // Get user hierarchy
  getUserHierarchy(userId: string): Observable<ApiResponse<{ hierarchy: any }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/admin/users/${userId}/hierarchy`);
  }

  creditBalance(userId: string, amount: number, description?: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/admin/credit-balance`, { userId, amount, description });
  }

  getGlobalSummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/admin/global-summary`);
  }
}