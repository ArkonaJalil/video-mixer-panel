import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { STATUS_BUTTON_COLOUR, STATUS_DISPLAY_NAME } from '../utils/global.js';
import { KEY_GROUPS } from '../utils/types.js';

export class DisplayStatusClass extends PanelElementClass {
  constructor(
    socket: Socket,
    key_code: number,
    panel_model: SK_MODEL,
    key_group: KEY_GROUPS,
    text1: string,
    text2?: string,
    text3?: string,
  ) {
    super(socket, key_code, STATUS_BUTTON_COLOUR, STATUS_DISPLAY_NAME, key_group, panel_model);
    // this.init_panel_element();
    this.init_panel_display(text1);
    if (text2 && !text3) {
      this.set_display_title_label(text1, text2, true);
    }
    if (text2 && text3) {
      this.set_display_title_label1_label2(text1, text2, text3, false, true);
    }
  }
}
