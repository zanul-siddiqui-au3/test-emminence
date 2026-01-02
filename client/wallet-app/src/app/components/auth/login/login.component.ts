import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  captchaSvg: SafeHtml = '';
  captchaSessionId: string = '';
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      captchaText: ['', Validators.required]
    });

    this.loadCaptcha();
  }

  loadCaptcha(): void {
    this.authService.getCaptcha().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.captchaSessionId = response.data.sessionId;
          this.captchaSvg = this.sanitizer.bypassSecurityTrustHtml(response.data.svg);
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to load CAPTCHA', 'Close', { duration: 3000 });
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.loginForm.value;

    this.authService.login({
      username: formValue.username,
      password: formValue.password,
      captchaSessionId: this.captchaSessionId,
      captchaText: formValue.captchaText
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Login failed';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.loadCaptcha(); // Reload CAPTCHA
        this.loginForm.patchValue({ captchaText: '' });
      }
    });
  }
}