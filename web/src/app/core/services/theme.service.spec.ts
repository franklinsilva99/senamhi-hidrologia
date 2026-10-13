import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeService } from './theme.service';

const STORAGE_KEY = 'app-dark-mode';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('sh-dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('sh-dark');
  });

  it('arranca en modo claro cuando no hay preferencia guardada', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.darkMode()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(document.documentElement.classList.contains('sh-dark')).toBe(false);
  });

  it('restaura el modo oscuro guardado en localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'true');

    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.darkMode()).toBe(true);
    expect(document.documentElement.classList.contains('sh-dark')).toBe(true);
  });

  it('trata cualquier valor guardado distinto de "true" como modo claro', () => {
    localStorage.setItem(STORAGE_KEY, 'TRUE');

    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    expect(service.darkMode()).toBe(false);
    expect(document.documentElement.classList.contains('sh-dark')).toBe(false);
  });

  it('toggleDarkMode alterna el modo y sincroniza persistencia y clase CSS', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();

    service.toggleDarkMode();
    TestBed.tick();
    expect(service.darkMode()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    expect(document.documentElement.classList.contains('sh-dark')).toBe(true);

    service.toggleDarkMode();
    TestBed.tick();
    expect(service.darkMode()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(document.documentElement.classList.contains('sh-dark')).toBe(false);
  });
});
