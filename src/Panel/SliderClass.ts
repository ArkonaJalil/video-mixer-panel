import { AT1130, AT1101 } from 'vapi';
import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { MixerClass } from './MixerClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import {
  SLIDER_BUTTON_COLOUR,
  SLIDER_BUTTON_DISPLAY,
  SLIDER_TOLERANCE,
  SLIDER_TIME_DURATION,
} from '../utils/global.js';

export class SliderClass extends PanelElementClass {
  public display_element: PanelElementClass;

  public slider_value: number = -1;
  // public last_slider_value: number = -1;
  constructor(socket: Socket, key_code: number, display_key_code: number, panel_model: SK_MODEL) {
    super(socket, key_code, SLIDER_BUTTON_COLOUR, SLIDER_BUTTON_DISPLAY, 'slider', panel_model);
    this.socket = socket;
    this.display_element = new PanelElementClass(
      socket,
      display_key_code,
      SLIDER_BUTTON_COLOUR,
      'T-Bar display',
      'slider_display',
      panel_model,
    );
    this.init_panel_element();
  }

  parse_input(input: string): number {
    const slider_regex = /Abs:(\d+)/;
    let match = input.match(slider_regex);
    if (match == null || match[1] == null) return 0;
    let result = parseInt((parseInt(match[1]) / 10).toFixed(0));
    return result;
  }

  slider_check(slider_value: number, current_range: number) {
    //ignore if its not in the same range then allow it back up
    let check_value = parseFloat((slider_value / 100).toFixed(2));
    let check_max = check_value + SLIDER_TOLERANCE;
    let check_min = check_value - SLIDER_TOLERANCE;
    let slider_check = check_max >= current_range && check_min <= current_range;
    // console.log(' %s max %d  min %d current %d', slider_check, check_max, check_min, current_range);
    return slider_check;
  }

  async slider_handler(input: string, mixer_class: MixerClass) {
    const { mode, video_mixer } = mixer_class;
    let slider_value = this.parse_input(input);
    this.slider_value = slider_value;

    if (!mixer_class.slider_check) {
      const current_range =
        mode === 'LUMA_KEYER'
          ? (await video_mixer.luma_keyer.opacity.transition.read()).target
          : await video_mixer.mixer.fader0.current.read();
      let slider_check_status = this.slider_check(this.slider_value, current_range);
      // console.log('=============Check for release===============', slider_check_status);
      if (slider_check_status) mixer_class.slider_check = true;
      return;
    }

    if (mode === 'LUMA_KEYER') await this.slider_handler_luma_keyer(slider_value, video_mixer);
    if (mode === 'MIXER') await this.slider_handler_mixer(slider_value, video_mixer);
  }

  async slider_handler_luma_keyer(
    input: number,
    video_mixer: AT1101.VideoMixer.BSLKAsNamedTableRow | AT1130.VideoMixer.BSLKAsNamedTableRow,
  ) {
    let new_slider_value = parseFloat((input / 100).toFixed(2));
    await video_mixer.luma_keyer.opacity.transition.write({
      target: new_slider_value,
      time: SLIDER_TIME_DURATION,
    });
  }

  async slider_handler_mixer(
    input: number,
    video_mixer: AT1101.VideoMixer.BSLKAsNamedTableRow | AT1130.VideoMixer.BSLKAsNamedTableRow,
  ) {
    let new_slider_value = parseFloat((input / 100).toFixed(2));
    await video_mixer.mixer.fader0.transition.write({
      target: new_slider_value,
      time: SLIDER_TIME_DURATION,
    });
    // console.log('slider_handler_mixer', new_slider_value);
  }
}
