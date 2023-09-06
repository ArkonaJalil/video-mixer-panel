import { AT1101, AT1130 } from 'vapi';
import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { ENCODER_TYPE } from '../utils/types.js';
import { MixerClass } from './MixerClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { ENCODER_BUTTON_COLOUR, ENCODER_BUTTON_TEXT } from '../utils/global.js';

export class EncoderClass extends PanelElementClass {
  public encoder_type: ENCODER_TYPE = 'CLIP';
  constructor(socket: Socket, key_code: number, encoderType: ENCODER_TYPE, panel_model: SK_MODEL) {
    super(socket, key_code, ENCODER_BUTTON_COLOUR, ENCODER_BUTTON_TEXT, 'encoder', panel_model);
    this.encoder_type = encoderType;
    this.init_panel_element();
  }

  async encoder_handler(input: string, mixer_class: MixerClass) {
    const { mode, video_mixer } = mixer_class;
    if (mode !== 'LUMA_KEYER') return;

    const enc_regex = /Enc:([-]?\d+)/;
    let match = input.match(enc_regex);
    if (match == null || match[1] == null) return;

    let input_num = parseInt(match[1]);
    switch (this.encoder_type) {
      case 'CLIP':
        this.encoder_handler_clip(input_num, video_mixer);
        break;
      case 'GAIN':
        this.encoder_handler_gain(input_num, video_mixer);
        break;
    }
  }

  async encoder_handler_clip(
    input: number,
    video_mixer: AT1101.VideoMixer.BSLKAsNamedTableRow | AT1130.VideoMixer.BSLKAsNamedTableRow,
  ) {
    input = input / 100;
    let clip_value = await video_mixer.luma_keyer.clip.read();
    let new_clip_value = parseFloat((clip_value + input).toFixed(2));
    new_clip_value = new_clip_value > 1 ? 1 : new_clip_value < 0 ? 0 : new_clip_value;
    await video_mixer.luma_keyer.clip.write(new_clip_value);
    this.set_display_text(await this.getCurrentValueString(video_mixer), false);
  }

  async encoder_handler_gain(
    input: number,
    video_mixer: AT1101.VideoMixer.BSLKAsNamedTableRow | AT1130.VideoMixer.BSLKAsNamedTableRow,
  ) {
    input = input / 100;
    let gain_value = await video_mixer.luma_keyer.gain.read();
    let new_gain_value = parseFloat((gain_value + input).toFixed(2));
    new_gain_value = new_gain_value > 1 ? 1 : new_gain_value < 0.01 ? 0.01 : new_gain_value;
    await video_mixer.luma_keyer.gain.write(new_gain_value);
    this.set_display_text(await this.getCurrentValueString(video_mixer), false);
  }

  //also in mixer class @ subscriptions is something
  async getCurrentValueString(
    video_mixer: AT1101.VideoMixer.BSLKAsNamedTableRow | AT1130.VideoMixer.BSLKAsNamedTableRow,
  ) {
    if (this.encoder_type === 'CLIP')
      return this.build_string(await video_mixer.luma_keyer.clip.read());
    if (this.encoder_type === 'GAIN')
      return this.build_string(await video_mixer.luma_keyer.gain.read());
    return 'N/A';
  }

  build_string(input: number) {
    return `${this.encoder_type} ${(input * 100).toFixed(0)}%`;
  }
}
