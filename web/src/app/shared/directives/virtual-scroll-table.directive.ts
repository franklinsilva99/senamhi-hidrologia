/**
 * Virtual Scroll Table Directive
 * Optimiza tablas grandes renderizando solo filas visibles
 * Usa Angular CDK VirtualScrollViewport
 *
 * Uso:
 * <cdk-virtual-scroll-viewport appVirtualScrollTable itemSize="50" class="table-viewport">
 *   <table>
 *     <tr *cdkVirtualFor="let row of data">
 */

import { Directive } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Directive({
  selector: '[appVirtualScrollTable]',
  standalone: true
})
export class VirtualScrollTableDirective {
  constructor(private readonly viewport: CdkVirtualScrollViewport) {}

  /**
   * Scroll a un índice específico
   */
  scrollToIndex(index: number): void {
    this.viewport.scrollToIndex(index, 'smooth');
  }

  /**
   * Scroll al inicio
   */
  scrollToStart(): void {
    this.viewport.scrollToIndex(0, 'smooth');
  }

  /**
   * Scroll al final. Sin data no hay último índice al que desplazarse.
   */
  scrollToEnd(): void {
    const total = this.viewport.getDataLength();
    if (total <= 0) {
      return;
    }
    this.viewport.scrollToIndex(total - 1, 'smooth');
  }

  /**
   * Refrescar viewport (después de cambios de data)
   */
  refresh(): void {
    this.viewport.checkViewportSize();
  }
}
