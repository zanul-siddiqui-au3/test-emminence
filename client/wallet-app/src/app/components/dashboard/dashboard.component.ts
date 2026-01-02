import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  balance: number = 0;
  loading = true;

  constructor(
    private authService: AuthService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadBalance();
  }

  loadBalance(): void {
    this.walletService.getBalance().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.balance = response.data.walletBalance;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}