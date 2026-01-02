import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';

interface HierarchyNode {
  _id: string;
  username: string;
  email: string;
  walletBalance: number;
  role: string;
  children?: HierarchyNode[];
  childrenCount?: number;
  expanded?: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  globalSummary: any = null;
  allUsers: User[] = [];
  nextLevelUsers: User[] = [];
  selectedUser: User | null = null;
  hierarchyData: any = null;
  hierarchyTree: HierarchyNode[] = [];
  
  // Credit form
  showCreditForm: boolean = false;
  creditUserId: string = '';
  creditAmount: number = 0;
  creditDescription: string = '';
  
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  // View state
  currentView: 'summary' | 'users' | 'hierarchy' = 'summary';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadGlobalSummary();
    this.loadAllUsers();
  }

  loadGlobalSummary(): void {
    this.adminService.getGlobalSummary().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.globalSummary = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading global summary:', error);
      }
    });
  }

  loadAllUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers({ limit: 1000 }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success' && response.data) {
          this.allUsers = response.data.users;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  viewUserNextLevel(user: User): void {
    this.selectedUser = user;
    this.currentView = 'users';
    this.loading = true;
    this.error = '';

    this.adminService.getNextLevelUsers(user._id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success' && response.data) {
          this.nextLevelUsers = response.data.users;
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to load next-level users';
      }
    });
  }

  viewUserHierarchy(user: User): void {
    this.selectedUser = user;
    this.currentView = 'hierarchy';
    this.loading = true;
    this.error = '';

    this.adminService.getUserHierarchy(user._id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success' && response.data) {
          this.hierarchyData = response.data.hierarchy;
          this.hierarchyTree = this.hierarchyData.downlineTree || [];
          this.initializeHierarchy(this.hierarchyTree);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to load hierarchy';
      }
    });
  }

  initializeHierarchy(nodes: HierarchyNode[]): void {
    nodes.forEach(node => {
      node.expanded = false;
      if (node.children && node.children.length > 0) {
        this.initializeHierarchy(node.children);
      }
    });
  }

  toggleNode(node: HierarchyNode): void {
    node.expanded = !node.expanded;
  }

  showCreditFormForUser(userId: string): void {
    this.creditUserId = userId;
    this.showCreditForm = true;
    this.clearMessages();
  }

  adminCreditBalance(): void {
    if (!this.creditUserId || this.creditAmount <= 0) {
      this.error = 'Please provide valid user and amount';
      return;
    }

    this.loading = true;
    this.clearMessages();

    this.adminService.creditBalance(this.creditUserId, this.creditAmount, this.creditDescription).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.status === 'success') {
          this.success = 'Balance credited successfully (deducted from parent)!';
          this.creditUserId = '';
          this.creditAmount = 0;
          this.creditDescription = '';
          this.showCreditForm = false;
          
          // Refresh data
          this.loadGlobalSummary();
          if (this.selectedUser) {
            if (this.currentView === 'hierarchy') {
              this.viewUserHierarchy(this.selectedUser);
            } else if (this.currentView === 'users') {
              this.viewUserNextLevel(this.selectedUser);
            }
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to credit balance';
      }
    });
  }

  backToSummary(): void {
    this.currentView = 'summary';
    this.selectedUser = null;
    this.clearMessages();
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
