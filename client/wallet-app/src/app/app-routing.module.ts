import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { MyChildrenComponent } from './components/users/my-children/my-children.component';
import { CreateChildComponent } from './components/users/create-child/create-child.component';
import { HieearchyComponent } from './components/users/hiearchy/hiearchy.component';
import { BalanceComponent } from './components/wallet/balance/balance.component';
import { TransactionsComponent } from './components/wallet/transactions/transactions.component';
import { DashboardComponent as AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'users/my-children', component: MyChildrenComponent, canActivate: [AuthGuard] },
  { path: 'users/create-child', component: CreateChildComponent, canActivate: [AuthGuard] },
  { path: 'users/hierarchy', component: HieearchyComponent, canActivate: [AuthGuard] },
  { path: 'wallet/balance', component: BalanceComponent, canActivate: [AuthGuard] },
  { path: 'wallet/transactions', component: TransactionsComponent, canActivate: [AuthGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }