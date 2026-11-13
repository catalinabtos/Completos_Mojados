import './ui/styles.css';
import { App } from './ui/app';

const app = new App(document.getElementById('app')!);
// Solo en desarrollo: acceso para pruebas desde la consola.
if (import.meta.env.DEV) (window as unknown as { app: App }).app = app;
// Espera la tipografía para que el primer cuadro no salte.
void document.fonts.load('20px "Jersey 15"').finally(() => app.start());
