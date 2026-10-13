import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ToolService } from '../../services/tool.service';

/**
 * Overlay de progreso global. Se muestra automáticamente mientras hay alguna
 * operación en curso (ToolService.isLoading) — cargas, búsquedas y guardados
 * envueltos en ToolService.execute(). Montado una sola vez en el AdminLayout.
 */
@Component({
  selector: 'app-progress-overlay',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div class="progress-overlay" *ngIf="toolService.isLoading()" role="alert" aria-busy="true">
      <div class="progress-card">
        <p-progressSpinner
          styleClass="progress-spinner"
          strokeWidth="4"
          animationDuration=".8s"
        ></p-progressSpinner>
        <span class="progress-text">{{ toolService.loadingMessage() }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .progress-overlay {
        position: fixed;
        inset: 0;
        z-index: 2000;
        background: rgb(15 23 42 / 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: po-fade 0.15s ease-out;
      }
      .progress-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        background: var(--color-bg-card, #fff);
        border-radius: var(--radius-xl, 16px);
        box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);
        padding: 2rem 2.5rem;
        min-width: 220px;
      }
      .progress-text {
        font-size: var(--text-base, 0.95rem);
        font-weight: var(--fw-semibold, 600);
        color: var(--color-text-heading, #1e293b);
        text-align: center;
      }
      :host ::ng-deep .progress-spinner {
        width: 48px;
        height: 48px;
      }
      @keyframes po-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class ProgressOverlay {
  protected readonly toolService = inject(ToolService);
}
