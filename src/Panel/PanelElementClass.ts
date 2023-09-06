import { Socket } from 'net';
import { BUTTON_STATUS, KEY_GROUPS } from '../utils/types.js';
import { setButton } from '../utils/panel_utils.js';
import {
  setHwcColor,
  setHwcDisplayLabel1Label2,
  setHwcDisplayTitleLabel,
  setHwcDisplayTitleLabel1Label2,
} from '../utils/hwc_utils.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';

export class PanelElementClass {
  public socket: Socket;
  public button_key_code: number = -1;
  public button_status: BUTTON_STATUS = 'Off';
  public button_colour: string = 'white';
  public display_name: string = '';
  public key_group: KEY_GROUPS = 'none';
  public panel_model: SK_MODEL = 'SK_AIRFLYPROV3';
  constructor(
    socket: Socket,
    button_key_code: number,
    button_colour: string,
    display_name: string,
    key_group: KEY_GROUPS,
    panel_model: SK_MODEL,
  ) {
    this.socket = socket;
    this.button_colour = button_colour;
    this.display_name = display_name;
    this.button_key_code = button_key_code;
    this.key_group = key_group;
    this.panel_model = panel_model;
    this.init_panel_element();
    this.init_panel_display(this.display_name);
  }

  set_button_status(status: BUTTON_STATUS, init: boolean) {
    setButton(
      this.socket,
      this.panel_model,
      {
        keyCode: `${this.button_key_code}`,
        color: this.button_colour,
        text1: this.display_name,
        text2: '',
        buttonStatus: status,
      },
      init,
    );
  }

  set_button_color(color: string) {
    this.button_colour = color;
    setHwcColor(this.socket, this.panel_model, `${this.button_key_code}`, color, false);
  }

  set_display_text(text: string, init: boolean) {
    setHwcDisplayLabel1Label2(
      this.socket,
      this.panel_model,
      `${this.button_key_code}`,
      {
        label1: text,
        label2: '',
      },
      init,
    );
  }

  set_display_title_label(title: string, label: string, init: boolean) {
    setHwcDisplayTitleLabel(
      this.socket,
      this.panel_model,
      `${this.button_key_code}`,
      { title: title, label: label, isLabel: false },
      init,
    );
  }

  set_display_title_label1_label2(
    title: string,
    label1: string,
    label2: string,
    isLabel: boolean,
    init: boolean,
  ) {
    setHwcDisplayTitleLabel1Label2(
      this.socket,
      this.panel_model,
      `${this.button_key_code}`,
      { title: title, label1, label2, isLabel },
      init,
    );
  }

  init_panel_display(text: string) {
    this.set_display_text(text, true);
  }

  init_panel_element() {
    this.set_button_status('Dimmed', true);
    this.button_status = 'Dimmed';
  }

  button_dimm() {
    if (this.button_status === 'Dimmed') return;
    this.set_button_status('Dimmed', false);
    this.button_status = 'Dimmed';
  }

  button_on() {
    if (this.button_status === 'On') return;
    this.set_button_status('On', false);
    this.button_status = 'On';
  }

  button_off() {
    if (this.button_status === 'Off') return;
    this.set_button_status('Off', false);
    this.button_status = 'Off';
  }

  button_blinking_red() {
    if (this.button_status === 'BlinkingRed') return;
    this.set_button_status('BlinkingRed', false);
    this.button_status = 'BlinkingRed';
  }

  button_blinking_red_quick() {
    if (this.button_status === 'BlinkingRedQuick') return;
    this.set_button_status('BlinkingRedQuick', false);
    this.button_status = 'BlinkingRedQuick';
  }

  button_blinking_quick() {
    if (this.button_status === 'BlinkingQuick') return;
    this.set_button_status('BlinkingQuick', false);
    this.button_status = 'BlinkingQuick';
  }

  button_blinking() {
    if (this.button_status === 'Blinking') return;
    this.set_button_status('Blinking', false);
    this.button_status = 'Blinking';
  }
}

export function button_handler(el: PanelElementClass, button_status: BUTTON_STATUS) {
  switch (button_status) {
    case 'BlinkingRed':
      el.button_blinking_red();
      break;
    case 'Off':
      el.button_off();
      break;
    case 'Dimmed':
      el.button_dimm();
      break;
    case 'Blinking':
      el.button_blinking();
      break;
    case 'BlinkingRedQuick':
      el.button_blinking_red_quick();
      break;
    case 'BlinkingQuick':
      el.button_blinking_quick();
      break;
    case 'On':
      el.button_on();
      break;
    default:
      console.log(`[PanelElementClass]button_handler(): Unknown button_status ${button_status}!`);
  }
}
