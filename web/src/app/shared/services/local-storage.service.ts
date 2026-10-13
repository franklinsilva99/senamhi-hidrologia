// noinspection JSUnusedGlobalSymbols

import { Injectable } from '@angular/core';
import { isValid, parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error al guardar en localStorage:`, error);
    }
  }

  getItem<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      const parsed = JSON.parse(item) as T;
      return this.convertStringsToDates<T>(parsed);
    } catch (error) {
      console.error(`Error al recuperar de localStorage:`, error);
      return defaultValue;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error al eliminar de localStorage:`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  }

  private convertStringsToDates<T>(objectInput: unknown): T {
    if (objectInput === null || objectInput === undefined) {
      return objectInput as T;
    }

    if (typeof objectInput !== 'object') {
      return objectInput as T;
    }

    if (Array.isArray(objectInput)) {
      return objectInput.map((item) => this.convertStringsToDates(item)) as T;
    }

    const converted: Record<string, unknown> = {};
    for (const key in objectInput) {
      if (Object.hasOwn(objectInput, key)) {
        const value = (objectInput as Record<string, unknown>)[key];
        if (typeof value === 'string' && this.isISODateString(value)) {
          converted[key] = parseISO(value);
        } else if (typeof value === 'object') {
          converted[key] = this.convertStringsToDates(value);
        } else {
          converted[key] = value;
        }
      }
    }
    return converted as T;
  }

  private isISODateString(stringInput: string): boolean {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!isoDateRegex.test(stringInput)) {
      return false;
    }
    return isValid(parseISO(stringInput));
  }
}
