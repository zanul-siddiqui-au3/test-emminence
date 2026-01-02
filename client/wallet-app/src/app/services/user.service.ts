import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.mode';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Create child user
  createChildUser(data: { username: string; email: string; password: string }): Observable<ApiResponse<{ user: User }>> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/users/create-child`, data);
  }

  // Get my children
  getMyChildren(): Observable<ApiResponse<{ count: number; children: User[] }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/users/my-children`);
  }

  // Get my hierarchy
  getMyHierarchy(): Observable<ApiResponse<{ totalDownline: number; hierarchy: any }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/users/my-hierarchy`);
  }

  // Get user details
  getUserDetails(userId: string): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/users/${userId}`);
  }

  // Change child password
  changeChildPassword(userId: string, newPassword: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/users/${userId}/change-password`, { newPassword });
  }
}