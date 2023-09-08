import { Socket } from 'net';
import { SK_MODEL, get_key_collection } from './key_collection/key_collection.js';
import {
  COLOR_CODE,
  FORMAT_ENTRY,
  FORMAT_NAME,
  KEY_ALIAS,
  BUTTON_STATUS,
  SCALE_TYPE_ENTRY,
  SCALE_TYPE,
} from './types.js';

//reset whole panel

export function hardResetPanel(c: Socket) {
  c.write('Clear\n');
}

export function filter_no_reset_codes(key_collection: KEY_ALIAS[]) {
  let filtered = key_collection.filter((el) => el.group !== 'me_display');
  filtered = key_collection.filter((el) => el.group !== 'vm_display');
  return filtered;
}

export function resetPanel(c: Socket, panel_model: SK_MODEL) {
  let key_collection = get_key_collection(panel_model);
  let filtered_key_collection = filter_no_reset_codes(key_collection);
  for (let el of filtered_key_collection) {
    resetHwc(c, panel_model, el.code);
  }
}

export function resetPanelText(c: Socket) {
  c.write('ClearDisplays\n');
}
//reset hardware component
export function resetHwcText(c: Socket, panel_model: SK_MODEL, keyCode: string) {
  let key = findKey(keyCode, panel_model);
  if (key == null) return;
  const { code } = key;
  c.write(`HWCt#${code}=\n`);
}

export function resetHwc(c: Socket, panel_model: SK_MODEL, keyCode: string) {
  let key = findKey(keyCode, panel_model);
  if (key == null) return;
  const { code } = key;
  c.write(`HWC#${code}=${0}\n`);
  c.write(`HWCt#${code}=\n`);
  c.write(`HWCc#${code}=\n`);
}

//SECTION SET HWC STATUS
export function setHwcStatus(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  mode: BUTTON_STATUS,
  initStatus?: boolean,
  _value?: string,
) {
  let key = initStatus ? findKey(keyCode, panel_model) : findKeyAlias(keyCode, panel_model);
  if (key == null) return;
  const { code } = key;
  let value =
    mode === 'Off'
      ? '0'
      : mode === 'On'
      ? '4'
      : mode === 'Dimmed'
      ? '5'
      : mode === 'Blinking' || mode === 'BlinkingWhite'
      ? '1028' //
      : mode === 'BlinkingQuick' || mode === 'BlinkingWhiteQuick'
      ? '516'
      : mode === 'BlinkingRed'
      ? '1026'
      : mode === 'BlinkingRedQuick'
      ? '514'
      : '';

  if (mode === 'BlinkingWhite' || mode === 'BlinkingWhiteQuick') {
    //sets color to white
    setHwcColor(c, panel_model, code, 'white');
  }

  //only for debugging
  value = _value == null ? value : _value;
  if (value === '') return console.log(`Error: HWC status mode ${mode} is not implemented!`);
  c.write(`HWC#${code}=${value}\n`);
}

//SECTION SET HWC COLOR
export const COLOR_CODE_COLLECTION: COLOR_CODE[] = [
  { name: 'white', colorCode: '130' },
  { name: 'warmwhite', colorCode: '131' },
  { name: 'red', colorCode: '132' },
  { name: 'rose', colorCode: '133' },
  { name: 'pink', colorCode: '134' },
  { name: 'purple', colorCode: '135' },
  { name: 'amber', colorCode: '136' },
  { name: 'yellow', colorCode: '137' },
  { name: 'darkblue', colorCode: '138' },
  { name: 'blue', colorCode: '139' },
  { name: 'ice', colorCode: '140' },
  { name: 'cyan', colorCode: '141' },
  { name: 'spring', colorCode: '142' },
  { name: 'green', colorCode: '143' },
  { name: 'mint', colorCode: '144' },
];

export function getColorCode(color: string) {
  let r = COLOR_CODE_COLLECTION.find((el) => el.name === color);
  return r == null ? { name: 'white', colorCode: '130' } : r;
}

export function setHwcColor(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  color: string,
  initStatus?: boolean,
) {
  let key = initStatus ? findKey(keyCode, panel_model) : findKeyAlias(keyCode, panel_model);
  if (key == null) return;
  const { code } = key;
  const { colorCode } = getColorCode(color);
  c.write(`HWCc#${code}=${colorCode}\n`);
}

//SECTION SET HWC DISPLAY
export const FORMAT_ENTRY_COLLECTION: FORMAT_ENTRY[] = [
  { name: 'Integer', value: 0 },
  { name: 'Float32', value: 1 },
  { name: 'Percent', value: 2 },
  { name: 'dB', value: 3 },
  { name: 'Frames', value: 4 },
  { name: '1/X', value: 5 },
  { name: 'Kelvin', value: 6 },
  { name: 'Hidden', value: 7 },
  { name: 'Float33', value: 8 },
  { name: 'Float22', value: 9 },
  { name: 'Text1', value: 10 }, //TITLE & VALUE
  { name: 'Text2', value: 11 }, //LABEL1 & LABEL2
];

const SCALE_TYPE_COLLECTION: SCALE_TYPE_ENTRY[] = [
  { name: 'STRENGTH_BAR', value: 1 },
  { name: 'CENTERED_MARKER', value: 2 },
  { name: 'CENTERED_BAR', value: 3 },
];

export function setHwcDisplay(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  opts?: {
    value?: number;
    format?: FORMAT_NAME;
    fine?: string;
    title?: string;
    isLabel?: boolean;
    label1?: string;
    label2?: string;
    value2?: string;
    valuesPair?: string;
    scale?: SCALE_TYPE;
    scaleRangeLow?: string;
    scaleRangeHigh?: string;
    scaleLimitLow?: string;
    scaleLimitHigh?: string;
    img?: string;
    font?: string;
    fontSize?: string;
    advancedSettings?: string;
  },
  initStatus?: boolean,
) {
  let key = initStatus ? findKey(keyCode, panel_model) : findKeyAlias(keyCode, panel_model);
  if (key == null) return;
  const { code } = key;
  const FORMAT_VALUE =
    FORMAT_ENTRY_COLLECTION.find((el) => el.name === opts?.format) == null
      ? 0
      : FORMAT_ENTRY_COLLECTION.find((el) => el.name === opts?.format)?.value;
  const SCALE_TYPE_VALUE =
    SCALE_TYPE_COLLECTION.find((el) => el.name === opts?.scale) == null
      ? 0
      : SCALE_TYPE_COLLECTION.find((el) => el.name === opts?.scale)?.value;

  c.write(
    `HWCt#${code}=${opts?.value == null ? '' : opts.value}|${FORMAT_VALUE}|${
      opts?.fine == null ? '' : opts.fine
    }|${opts?.title == null ? '' : opts.title}|${opts?.isLabel == true ? 0 : 1}|${
      opts?.label1 == null ? '' : opts.label1
    }|${opts?.label2 == null ? '' : opts?.label2}|${opts?.value2 == null ? '' : opts.value2}|${
      opts?.valuesPair == null ? '' : opts.valuesPair
    }|${opts?.scale == null ? '' : SCALE_TYPE_VALUE},|${
      opts?.scaleRangeLow == null ? '' : opts.scaleRangeLow
    }|${opts?.scaleRangeHigh == null ? '' : opts.scaleRangeHigh}|${
      opts?.scaleLimitLow == null ? '' : opts.scaleLimitLow
    }|${opts?.scaleLimitHigh == null ? '' : opts.scaleLimitHigh}|${
      opts?.img == null ? '' : opts.img
    }|${opts?.font == null ? '' : opts.font}|${opts?.fontSize == null ? '' : opts.fontSize}|${
      opts?.advancedSettings == null ? '' : opts.advancedSettings
    }\n`,
  );
}

export function setHwcDisplayTbarText(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  opts: { value: number },
) {
  const { value } = opts;
  setHwcDisplay(c, panel_model, keyCode, { scale: 'CENTERED_BAR', value: value });
  // setHwcDisplay(c,keyCode,{scale:"STRENGTH_BAR",scaleRangeHigh:"100",scaleRangeLow:"0",scaleLimitHigh:"100",scaleLimitLow:"0",value:value})
}

export function setHwcDisplayInitText(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  opts: { text: string },
  initStatus?: boolean,
) {
  const { text } = opts;
  setHwcDisplay(c, panel_model, keyCode, { format: 'Integer', label1: text }, initStatus);
}

export function setHwcDisplayTitleLabel(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  opts: { title: string; isLabel: boolean; label: string },
  initStatus?: boolean,
) {
  const { title, isLabel, label } = opts;
  setHwcDisplay(
    c,
    panel_model,
    keyCode,
    { format: 'Integer', isLabel: isLabel, title, label1: label },
    initStatus,
  );
}

export function setHwcDisplayTitleLabel1Label2(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  opts: { title: string; isLabel: boolean; label1: string; label2: string },
  initStatus?: boolean,
) {
  const { title, isLabel, label1, label2 } = opts;
  setHwcDisplay(
    c,
    panel_model,
    keyCode,
    { format: 'Integer', isLabel: isLabel, title, label1, label2 },
    initStatus,
  );
}

export function setHwcDisplayLabel1Label2(
  c: Socket,
  panel_model: SK_MODEL,
  keyCode: string,
  opts: { label1: string; label2: string },
  initStatus?: boolean,
) {
  const { label1, label2 } = opts;
  setHwcDisplay(c, panel_model, keyCode, { format: 'Integer', label1, label2 }, initStatus);
}

export function setHwcDisplaySmall(c: Socket, key_code: string, text: string) {
  c.write(`HWCt#${key_code}=||||||${text}`);
}

//SECTION KEY Interpretation
export function findKey(keyCode: string, panel_model: SK_MODEL) {
  const KEY_COLLECTION = get_key_collection(panel_model);
  const FOUND_KEY = KEY_COLLECTION.find((el) => el.alias === keyCode || el.code === keyCode);
  if (FOUND_KEY == null) return null;
  return FOUND_KEY;
}

export function findKeyAlias(keyCode: string, panel_model: SK_MODEL) {
  const KEY_COLLECTION = get_key_collection(panel_model);
  const FOUND_KEY = KEY_COLLECTION.find((el) => el.alias === keyCode || el.code === keyCode);
  if (FOUND_KEY == null || FOUND_KEY.alias === '') return null;
  return FOUND_KEY;
}

export async function sendMultiStatus(
  c: Socket,
  panel_model: SK_MODEL,
  keyCollection: KEY_ALIAS[],
  mode: BUTTON_STATUS,
  color?: string,
) {
  for (const { code } of keyCollection) {
    if (color != null) setHwcColor(c, panel_model, code, color);
    setHwcStatus(c, panel_model, code, mode);
  }
}

export function get_model_info(input: string) {
  // console.log('get_model_info', input);
  const regex = /_model=([^\s]+)/;
  const match = input.match(regex);
  if (match == null) return null;
  // console.log(match[1]);
  return match[1] as SK_MODEL;
}

export function set_no_connection_mode(c: Socket) {
  c.write('ClearDisplays\n');
  for (let i = 0; i < 126; i++) {
    c.write(`HWC#${i}=${514}\n`);
  }
}
