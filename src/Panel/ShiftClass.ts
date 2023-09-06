import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { SHIFT_BUTTON_COLOUR, SHIFT_DISPLAY_NAME } from '../utils/global.js';

export class ShiftClass extends PanelElementClass {
  constructor(socket: Socket, key_code: number, panel_model: SK_MODEL) {
    super(socket, key_code, SHIFT_BUTTON_COLOUR, SHIFT_DISPLAY_NAME, 'shift', panel_model);

    this.init_panel_element();
  }

  update_me_level(active_index: number, collection_length: number): number {
    let nIndex = (active_index + 1) % collection_length;
    return nIndex;
  }
}
