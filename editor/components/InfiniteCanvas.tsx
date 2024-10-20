"use client";

import { useRef, useEffect, useState } from "react";
import { Application, Assets, Sprite } from "pixi.js";

const PixiComponent = () => {
  const ref = useRef<any>(null);
  const [rotation, setRotation] = useState<number>(0.1);

  useEffect(() => {
    if (!ref.current) return;
    (async () => {
      ref.current = new Application();

      await ref.current.init({ background: "#1099bb", resizeTo: window });
      document.body.appendChild(ref.current.view);
      const texture = await Assets.load("https://pixijs.com/assets/bunny.png");

      const bunny = new Sprite(texture);

      ref.current.stage.addChild(bunny);

      bunny.anchor.set(0.5);

      bunny.x = ref.current.screen.width / 2;
      bunny.y = ref.current.screen.height / 2;
      ref.current.ticker.add((time) => {
        bunny.rotation += 0.1 * time.deltaTime;
      });
    })();

    return () => {};
  }, []);

  useEffect(() => {
    if (ref.current) {
      (async () => {
        const texture = await Assets.load(
          "https://pixijs.com/assets/bunny.png"
        );

        const bunny = new Sprite(texture);

        ref.current.stage.addChild(bunny);

        bunny.anchor.set(0.5);

        bunny.x = ref.current.screen.width / 2;
        bunny.y = ref.current.screen.height / 2;
        ref.current.ticker.add((time) => {
          bunny.rotation += rotation * time.deltaTime;
        });
      })();
    }
  }, [rotation]);

  return (
    <>
      <button onClick={() => setRotation((prev) => prev + 0.1)}>
        increment
      </button>
      <button onClick={() => setRotation((prev) => prev - 0.1)}>
        decrement
      </button>
      <div ref={ref} />
    </>
  );
};

export default PixiComponent;
