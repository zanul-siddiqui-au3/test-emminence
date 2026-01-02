import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss']
})
export class BalanceComponent implements OnInit {
  balance: number = 0;
  balanceSummary: any = null;
  currentUser: User | null = null;
  myChildren: User[] = [];
  
  // Recharge form
  rechargeAmount: number = 0;
  rechargeDescription: string = '';
  showRechargeForm: boolean = false;
  
  // Credit form
  creditUserId: string = '';
  creditAmount: number = 0;
  creditDescription: string = '';
  showCreditForm: boolean = false;
  
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private walletService: WalletService,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadBalance();
    this.loadBalanceSummary();
    this.loadMyChildren();
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadBalance(): void {
    this.walletService.getBalance().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.balance = response.data.walletBalance;
        }
      },
      error: (error) => {
        console.error('Error loading balance:', error);
      }
    });
  }

  loadBalanceSummary(): void {
    this.walletService.getBalanceSummary().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.balanceSummary = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading balance summary:', error);
      }
    });
  }

  loadMyChildren(): void {
    this.userService.getMyChildren().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.myChildren = response.data.children;
        }
      },
      error: (error) => {
        console.error('Error loading children:', error);
      }
    });
  }

  canRecharge(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.parentId === null;
  }

  toggleRechargeForm(): void {
    this.showRechargeForm = !this.showRechargeForm;
    this.showCreditForm = false;
    this.clearMessages();
  }

  toggleCreditForm(): void {
    this.showCreditForm = !this.showCreditForm;
    this.showRechargeForm = false;
    this.clearMessages();
  }

  recharge(): void {
    if (this.rechargeAmount <= 0) {
      this.error = 'Amount must be greater than 0';
      return;
    }

    this.loading = true;
    this.clearMessages();

    this.walletService.rechargeWallet(this.rechargeAmount, this.rechargeDescription).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.success = 'Wallet recharged successfully!';
          this.loadBalance();
          this.loadBalanceSummary();
          this.rechargeAmount = 0;
          this.rechargeDescription = '';
          this.showRechargeForm = false;
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to recharge wallet';
      }
    });
  }

  creditToChild(): void {
    if (!this.creditUserId) {
      this.error = 'Please select a user';
      return;
    }

    if (this.creditAmount <= 0) {
      this.error = 'Amount must be greater than 0';
      return;
    }

    if (this.creditAmount > this.balance) {
      this.error = 'Insufficient balance';
      return;
    }

    this.loading = true;
    this.clearMessages();

    this.walletService.creditToChild(this.creditUserId, this.creditAmount, this.creditDescription).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.success = 'Balance credited successfully!';
          this.loadBalance();
          this.loadBalanceSummary();
          this.creditUserId = '';
          this.creditAmount = 0;
          this.creditDescription = '';
          this.showCreditForm = false;
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to credit balance';
      }
    });
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
