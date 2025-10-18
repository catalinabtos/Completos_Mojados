import { Application, Container } from 'pixi.js';

export interface PixiLayers {
  app: Application;
  background: Container;
  entities: Container;
  overlay: Container;
}

export async function createPixiApp(mount: HTMLElement): Promise<PixiLayers> {
  const app = new Application();
  await app.init({
    backgroundAlpha: 0,
    antialias: true,
    resizeTo: mount
  });

  mount.innerHTML = '';
  mount.appendChild(app.canvas);

  const background = new Container();
  const entities = new Container();
  const overlay = new Container();

  app.stage.addChild(background);
  app.stage.addChild(entities);
  app.stage.addChild(overlay);

  const handleResize = () => {
    const { clientWidth, clientHeight } = mount;
    app.renderer.resize(clientWidth, clientHeight);
  };
  handleResize();
  window.addEventListener('resize', handleResize);

  return { app, background, entities, overlay };
}
