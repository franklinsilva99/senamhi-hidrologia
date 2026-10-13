import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { IMAGE_LOADER, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';
import { es } from 'primelocale/js/es.js';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ToolService } from './shared/services/tool.service';
import { customImageLoader } from './shared/config/image-loader';
import { serverUnavailableInterceptor } from './core/interceptors/server-unavailable.interceptor';

registerLocaleData(localeEsPe, 'es-PE');

const Senamhi = definePreset(Aura, {
  semantic: {
    primary: {
      '50': '#e6eeff',
      '100': '#c0d3ff',
      '200': '#99b8ff',
      '300': '#729cff',
      '400': '#4a80ff',
      '500': '#002259',
      '600': '#001d4c',
      '700': '#00183e',
      '800': '#001231',
      '900': '#000c23',
      '950': '#000616',
    },
    secondary: {
      '50': '#fffbeb',
      '100': '#fef3c7',
      '200': '#fde68a',
      '300': '#fcd34d',
      '400': '#fbbf24',
      '500': '#f59e0b',
      '600': '#d97706',
      '700': '#b45309',
      '800': '#92400e',
      '900': '#78350f',
      '950': '#451a03',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
      },
      dark: {
        primary: {
          color: '{secondary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{secondary.600}',
          activeColor: '{secondary.700}',
        },
      },
    },
  },
  components: {
    tabs: {
      tabpanel: {
        padding: '1rem 0 0 0',
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    // El proyecto no incluye zone.js: sin este provider, los manejadores de
    // eventos (click, etc.) ejecutan su código pero no disparan la detección de
    // cambios, por lo que la vista no se actualiza hasta el siguiente evento
    // ("el primer clic no hace nada"). Causa raíz de las navegaciones/menús que
    // parecían no responder.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // El de disponibilidad va primero (más externo): cada reintento vuelve a
    // pasar por el de sesión y lleva el token vigente.
    provideHttpClient(withInterceptors([serverUnavailableInterceptor])),
    {
      provide: LOCALE_ID,
      useValue: 'es-PE',
    },
    {
      provide: IMAGE_LOADER,
      useValue: customImageLoader,
    },
    providePrimeNG({
      translation: es,
      ripple: false,
      theme: {
        preset: Senamhi,
        options: {
          darkModeSelector: '.sh-dark',
        },
      },
    }),
    ConfirmationService,
    MessageService,
    DialogService,
    ToolService,
  ],
};
