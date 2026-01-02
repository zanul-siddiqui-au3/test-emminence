import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-my-children',
  templateUrl: './my-children.component.html',
  styleUrls: ['./my-children.component.scss'],
  standalone: false
})
export class MyChildrenComponent implements OnInit {
  children: User[] = [];
  loading = true;
  displayedColumns: string[] = ['username', 'email', 'balance', 'createdAt', 'actions'];

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadChildren();
  }

  loadChildren(): void {
    this.userService.getMyChildren().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.children = response.data.children;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load children', 'Close', { duration: 3000 });
      }
    });
  }

  changePassword(child: User): void {
    const newPassword = prompt(`Enter new password for ${child.username}:`);
    if (newPassword && newPassword.length >= 6) {
      this.userService.changeChildPassword(child._id, newPassword).subscribe({
        next: () => {
          this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to change password', 'Close', { duration: 3000 });
        }
      });
    } else if (newPassword) {
      this.snackBar.open('Password must be at least 6 characters', 'Close', { duration: 3000 });
    }
  }
}