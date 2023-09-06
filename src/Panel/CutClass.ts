import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { MixerClass } from './MixerClass.js';
import { Duration } from 'vscript';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { CUT_BUTTON_COLOUR, CUT_BUTTON_TEXT } from '../utils/global.js';

export class CutClass extends PanelElementClass {
  constructor(socket: Socket, key_code: number, panel_model: SK_MODEL) {
    super(socket, key_code, CUT_BUTTON_COLOUR, CUT_BUTTON_TEXT, 'cut', panel_model);
    this.init_panel_element();
  }

  async cut_handler(activeMixer: MixerClass) {
    const video_mixer = activeMixer.video_mixer;
    if (activeMixer.mode === 'MIXER') {
      await video_mixer.mixer.fader0.transition.write({ target: 0, time: new Duration(0, 's') });
      const src_0 = await video_mixer.v_src0.command.read();
      const src_1 = await video_mixer.v_src1.command.read();
      await video_mixer.v_src1.command.write(src_0);
      await video_mixer.v_src0.command.write(src_1);
    }

    if (activeMixer.mode === 'LUMA_KEYER') {
      let current = await video_mixer.luma_keyer.opacity.current.read();
      await video_mixer.luma_keyer.opacity.transition.write({
        target: current === 1 ? 0 : 1,
        time: new Duration(0, 's'),
      });
    }
  }
}
