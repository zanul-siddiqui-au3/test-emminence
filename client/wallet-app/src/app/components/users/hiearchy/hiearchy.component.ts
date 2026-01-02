import { Component, OnInit } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { UserService } from '../../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-hiearchy',
  templateUrl: './hiearchy.component.html',
  styleUrls: ['./hiearchy.component.scss'],
  standalone: false
})
export class HieearchyComponent implements OnInit {
  hierarchy: any = null;
  totalDownline = 0;
  loading = true;

  treeControl = new NestedTreeControl<any>(node => node.children);
  dataSource = new MatTreeNestedDataSource<any>();

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadHierarchy();
  }

  loadHierarchy(): void {
    this.userService.getMyHierarchy().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.hierarchy = response.data.hierarchy;
          this.totalDownline = response.data.totalDownline;
          // Set data source
          this.dataSource.data = [this.hierarchy];
          // Expand root node by default
          if (this.hierarchy) {
            this.treeControl.expand(this.hierarchy);
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load hierarchy', 'Close', { duration: 3000 });
      }
    });
  }
  

  hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;
}