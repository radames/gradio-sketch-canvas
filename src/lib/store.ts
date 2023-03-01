import { writable } from 'svelte/store';
import type { DrawingLayer } from '../types';

export const drawingLayers = writable<Map<string, DrawingLayer>>(new Map());
export const resultImage = writable<string>();
export const currentCanvas = writable<HTMLCanvasElement>();
export const selectedImage = writable<HTMLImageElement>();
export const canvasSize = writable<{ width: number; height: number }>({ width: 512, height: 512 });