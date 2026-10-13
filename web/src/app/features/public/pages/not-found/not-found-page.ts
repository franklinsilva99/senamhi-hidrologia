import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/** Página 404: la URL no coincide con ninguna ruta declarada (comodín `**` del routing). */
@Component({
  selector: 'app-not-found-page',
  standalone: true,
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  private readonly router = inject(Router);

  homepage(): void {
    this.router.navigateByUrl('/');
  }
}
