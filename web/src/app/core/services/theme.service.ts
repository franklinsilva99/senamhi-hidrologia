import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app-dark-mode';
  darkMode = signal<boolean>(localStorage.getItem(this.STORAGE_KEY) === 'true');

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      localStorage.setItem(this.STORAGE_KEY, isDark.toString());
      if (isDark) {
        document.documentElement.classList.add('sh-dark');
      } else {
        document.documentElement.classList.remove('sh-dark');
      }
    });
  }

  toggleDarkMode() {
    this.darkMode.update((prev) => !prev);
  }
}
