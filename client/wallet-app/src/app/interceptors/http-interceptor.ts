import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const modifiedRequest = request.clone({
      withCredentials: true
    });

    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Don't try to refresh on login, register, captcha, refresh, or profile endpoints
          if (request.url.includes('/auth/login') || 
              request.url.includes('/auth/register') || 
              request.url.includes('/auth/captcha') ||
              request.url.includes('/auth/refresh') ||
              request.url.includes('/auth/profile')) {
            // For profile endpoint, just let the error through (guard will handle redirect)
            if (request.url.includes('/auth/profile')) {
              return throwError(() => error);
            }
            // For other auth endpoints, redirect to login
            this.router.navigate(['/login']);
            return throwError(() => error);
          }

          // Try to refresh the token for other endpoints
          return this.handleRefershToken(modifiedRequest, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handleRefershToken(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response);
          return next.handle(request);
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(result => result !== null),
        take(1),
        switchMap(() => next.handle(request))
      );
    }
  }
}