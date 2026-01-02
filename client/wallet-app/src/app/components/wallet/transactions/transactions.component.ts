import { Component, OnInit } from '@angular/core';
import { WalletService } from '../../../services/wallet.service';
import { Transaction } from '../../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  balanceStatement: any = null;
  transactions: any[] = [];
  
  loading: boolean = false;
  error: string = '';

  constructor(private walletService: WalletService) { }

  ngOnInit(): void {
    this.loadBalanceStatement();
  }

  loadBalanceStatement(): void {
    this.loading = true;
    this.error = '';

    this.walletService.getBalanceStatement().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success' && response.data) {
          this.balanceStatement = response.data;
          this.transactions = response.data.transactions || [];
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to load balance statement';
        console.error('Error loading balance statement:', error);
      }
    });
  }

  getTransactionClass(transaction: any): string {
    return transaction.transactionType === 'CREDIT' ? 'text-success' : 'text-danger';
  }

  getTransactionIcon(transaction: any): string {
    return transaction.transactionType === 'CREDIT' ? '↓' : '↑';
  }
}
