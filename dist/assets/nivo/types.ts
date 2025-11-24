export interface SlideData {
  id: string;
  src: string;
  alt?: string;
  captionTitle?: string;
  captionText?: string;
  buttonText?: string;
  buttonLink?: string;
}

export type NivoEffectType = 
  | 'random'
  | 'fade'
  | 'fold'
  | 'sliceDown'
  | 'sliceDownRight'
  | 'sliceUp'
  | 'sliceUpDown'
  | 'sliceUpDownLeft'
  | 'boxRain'
  | 'boxRainGrow'
  | 'zoomOut' // Modern addition
  | 'slideLeft'; // Modern addition

export interface NivoSettings {
  slices: number;
  boxCols: number;
  boxRows: number;
  animSpeed: number;
  pauseTime: number;
  effect: NivoEffectType;
  randomStart: boolean;
}