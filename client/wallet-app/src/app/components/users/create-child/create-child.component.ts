import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-child',
  templateUrl: './create-child.component.html',
  styleUrls: ['./create-child.component.scss'],
  standalone: false
})
export class CreateChildComponent implements OnInit {
  createForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.createForm.invalid) {
      return;
    }

    this.loading = true;
    this.userService.createChildUser(this.createForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.snackBar.open('Child user created successfully!', 'Close', { duration: 3000 });
          this.router.navigate(['/users/my-children']);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Failed to create user';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      }
    });
  }
}