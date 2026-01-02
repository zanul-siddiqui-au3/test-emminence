import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.mode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  getCaptcha(): Observable<ApiResponse<{ sessionId: string; svg: string }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/auth/captcha`);
  }

  // Register
  register(data: any): Observable<ApiResponse<{ user: User }>> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/register`, data);
  }

  login(data: any): Observable<ApiResponse<{ user: User }>> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
      })
    );
  }

  getProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/auth/profile`).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  private loadCurrentUser(): void {
    this.http.get<ApiResponse>(`${this.apiUrl}/auth/profile`).subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.currentUserSubject.next(response.data.user);
        }
      },
      error: () => {
        this.currentUserSubject.next(null);
      }
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}