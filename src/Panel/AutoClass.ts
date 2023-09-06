import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { MixerClass } from './MixerClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import {
  AUTO_BUTTON_COLOUR,
  AUTO_BUTTON_TEXT,
  AUTO_DIRECT_TRANSITION,
  AUTO_TRANSITION_DURATION,
  AUTO_DELAYED_TRANSITION,
} from '../utils/global.js';

export class AutoClass extends PanelElementClass {
  public block_auto: boolean = false;
  constructor(socket: Socket, key_code: number, panel_model: SK_MODEL) {
    super(socket, key_code, AUTO_BUTTON_COLOUR, AUTO_BUTTON_TEXT, 'auto', panel_model);
    this.init_panel_element();
  }

  async auto_handler(activeMixer: MixerClass) {
    if (activeMixer == null) return;
    const { mode, video_mixer } = activeMixer;

    //this.block is already active
    if (this.block_auto) {
      if (mode === 'MIXER') {
        const current_range = await video_mixer.mixer.fader0.current.read();
        await video_mixer.mixer.fader0.transition.write({
          target: current_range,
          time: AUTO_DIRECT_TRANSITION,
        });
      }
      if (mode === 'LUMA_KEYER') {
        const current_range = await video_mixer.luma_keyer.opacity.current.read();
        await video_mixer.luma_keyer.opacity.transition.write({
          target: current_range,
          time: AUTO_DIRECT_TRANSITION,
        });
      }
      this.button_dimm();
      this.block_auto = false;
      return;
    }

    this.block_auto = true;
    if (this.button_status !== 'BlinkingRedQuick') this.button_blinking_red_quick();

    if (activeMixer.mode === 'MIXER') {
      const current = await video_mixer.mixer.fader0.current.read();
      const desired_value = current === 1 ? 0 : 1;
      await video_mixer.mixer.fader0.transition.write({
        target: desired_value,
        time: AUTO_TRANSITION_DURATION,
      });

      await video_mixer.mixer.anc_input
        .wait_until((p) => p === desired_value, {
          timeout: AUTO_DELAYED_TRANSITION,
        })
        .catch(() => {});

      if (this.block_auto) {
        this.button_dimm();
        this.block_auto = false;
      }
    }

    if (activeMixer.mode === 'LUMA_KEYER') {
      const current = await video_mixer.luma_keyer.opacity.current.read();
      const desired_value = current === 1 ? 0 : 1;
      await video_mixer.luma_keyer.opacity.transition.write({
        target: current === 1 ? 0 : 1,
        time: AUTO_TRANSITION_DURATION,
      });

      await video_mixer.luma_keyer.opacity.current
        .wait_until(
          (p) => {
            if (p === desired_value) return true;
            return false;
          },
          {
            timeout: AUTO_DELAYED_TRANSITION,
          },
        )
        .catch(() => {});

      if (this.block_auto) {
        this.button_dimm();
        this.block_auto = false;
      }
    }
  }
}
