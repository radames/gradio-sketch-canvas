<script lang="ts">
  import { nanoid } from "nanoid";
  import ColorPicker from "svelte-awesome-color-picker";
  import PxBrush from "px-brush";
  import { onMount } from "svelte";
  import type { Brush, Color, RGB } from "../types";
  import UndoIcon from "./Icons/Undo.svelte";
  import { selectedImage, currentCanvas, drawingLayers } from "./store";

  let rgb = { r: 0, g: 0, b: 0, a: 1 };
  let canvas: HTMLCanvasElement;
  let brush: HTMLCanvasElement;
  let canvasRootEl: HTMLDivElement;

  let canvasSize = { width: 512, height: 512 };
  $: brushColor = `rgb(${rgb.r},${rgb.g},${rgb.b})` as RGB;
  let brushSize: number = 40;

  let brushCtx: CanvasRenderingContext2D;
  let ctx: CanvasRenderingContext2D;
  let startPosition: { x: number; y: number } = { x: 0, y: 0 };
  let pxBrush: PxBrush;

  $: {
    if (brushCtx && brushSize && brushColor && rgb) {
      //   selectedBrush.color = `rgb(${rgb.r},${rgb.g},${rgb.b})` as RGB;
      setBrush({ size: brushSize, color: brushColor });
      brush.style.top = `${10 + brushSize / 2}px`;
      brush.style.left = `${10 + brushSize / 2}px`;
    }
  }
  $: {
    if ($selectedImage) {
      drawImage(ctx, $selectedImage);
      $drawingLayers = new Map();
    }
  }

  onMount(() => {
    canvasRootEl = document.getElementById("canvas-root") as HTMLDivElement;
    if (!canvasRootEl._data) canvasRootEl._data = { colors: [], image: null };

    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    brushCtx = brush.getContext("2d") as CanvasRenderingContext2D;
    window.devicePixelRatio = 1;
    pxBrush = new PxBrush(canvas);
    canvas.style.height = "auto";
    canvas.style.width = "auto";
    $currentCanvas = canvas;
    clearCanvas(ctx);
    window._updateCanvas = updateCanvas;
  });
  function updateCanvas(width, height) {
    canvasSize = { width, height };
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    clearCanvas(ctx);
  }

  function updateGlobalColors() {
    if (!canvasRootEl._data) canvasRootEl._data = { colors: [], image: null };
    canvasRootEl._data.colors = [
      ...new Set([...$drawingLayers.values()].map((e) => e.brush.color)),
    ];
    canvasRootEl._data.image = canvas.toDataURL();
  }

  let mouseDown: boolean = false;
  let currLayerId: string;
  function pointerEnter() {
    brush.hidden = false;
    updateGlobalColors();
  }
  function pointerOut() {
    brush.hidden = true;
    mouseDown = false;
    updateGlobalColors();
  }
  function pointerDown(e: MouseEvent) {
    mouseDown = true;
    startPosition = getPosition(canvas, e);
    pxBrush.draw({
      from: startPosition,
      to: startPosition,
      size: brushSize,
      color: brushColor,
    });

    currLayerId = nanoid();
    drawingLayers.update((map) => {
      map.set(currLayerId, {
        brush: { size: brushSize, color: brushColor },
        points: [{ from: startPosition, to: startPosition }],
      });
      return map;
    });
    updateGlobalColors();
  }
  function pointerMove(e: MouseEvent) {
    const position = getPosition(canvas, e);
    brush.style.top = `${e.offsetY}px`;
    brush.style.left = `${e.offsetX}px`;
    if (!mouseDown) {
      return;
    }
    pxBrush.draw({
      from: startPosition,
      to: position,
      size: brushSize,
      color: brushColor,
    });

    drawingLayers.update((map) => {
      const currentLayer = map.get(currLayerId);
      currentLayer?.points.push({
        from: startPosition,
        to: position,
      });
      return map;
    });
    startPosition = position;
  }
  function getPosition(canvas: HTMLCanvasElement, event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  function setBrush(sBrush: Brush) {
    const { size, color } = sBrush;
    brush.width = size;
    brush.height = size;
    // brushCtx.clearRect(0, 0, brush.width, brush.height);
    // brushCtx.beginPath();
    brushCtx.fillStyle = color;
    brushCtx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    brushCtx.fill();
  }

  function clearCanvas(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function drawImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLCanvasElement
  ) {
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  function rollBack() {
    if ($drawingLayers.size <= 0) {
      return;
    }
    // clear current layer
    const ids = Array.from($drawingLayers.keys());
    drawingLayers.update((map) => {
      map.delete(ids[ids.length - 1]);
      return map;
    });
    drawLayers(ctx);
    updateGlobalColors();
  }
  function drawLayers(ctx: CanvasRenderingContext2D) {
    const tempcanvas = document.createElement("canvas");
    tempcanvas.width = canvasSize.width;
    tempcanvas.height = canvasSize.height;
    window.devicePixelRatio = 1;
    const pxBrush = new PxBrush(tempcanvas);
    clearCanvas(ctx);
    if ($selectedImage) {
      drawImage(ctx, $selectedImage);
    }
    Array.from($drawingLayers.values()).forEach((layer) => {
      // clear temp canvas
      layer.points.forEach((point, i) => {
        pxBrush.draw({
          from: point.from,
          to: point.to,
          size: layer.brush.size,
          color: layer.brush.color,
        });
      });
    });
    requestAnimationFrame(() => {
      drawImage(ctx, tempcanvas);
    });
  }
</script>

<div>
  <div class="relative overflow-clip">
    <canvas
      bind:this={canvas}
      class="canvas"
      on:touchmove={(e) => e.preventDefault()}
      on:pointerenter={pointerEnter}
      on:pointerup={pointerOut}
      on:pointerleave={pointerOut}
      on:pointercancel={pointerOut}
      on:pointerout={pointerOut}
      on:pointermove={pointerMove}
      on:pointerdown={pointerDown}
    />
    <canvas bind:this={brush} class="brush" width="10" height="10" />
    <button
      class="absolute bottom-0 left-0 !m-0 !p-3 "
      on:click|preventDefault={() => rollBack()}
      disabled={$drawingLayers.size <= 0}
      ><UndoIcon classNames={"!text-black"} /></button
    >
  </div>
  <div class="flex  gap-2 p-1">
    <span class="color-picker px-3 drop-shadow-2xl bg-gray-100 rounded-xl">
      <ColorPicker bind:rgb label="Color" isAlpha={false} />
    </span>
    <div
      class="flex items-center gap-2 !text-black px-3 drop-shadow-2xl bg-gray-100 rounded-xl"
    >
      <input
        bind:value={brushSize}
        class="w-full !m-0"
        min="1"
        max="100"
        step="1"
        type="range"
      />
      <label for="brush" class="min-w-[4ch] !text-black">{brushSize} </label>
    </div>
  </div>
</div>

<style lang="postcss" scoped>
  .canvas {
    @apply max-w-full w-full z-0 border dark:border-gray-300 border-gray-500 aspect-square;
  }
  .brush {
    @apply z-10 absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 dark:text-white;
  }
  .color-picker :global(*) {
    color: black !important;
  }
</style>
