import { Component, effect, inject } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolService } from './shared/services/tool.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [ConfirmDialogModule, ToastModule, ProgressSpinnerModule, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  private readonly toolService = inject(ToolService);

  readonly isLoading = this.toolService.isLoading;

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }
}
