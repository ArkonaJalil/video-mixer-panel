import { VM } from 'vapi';
import { ESSENCE_ENTRY, KEYER_ELEMENT, VIDEO_ESSENCE } from '../utils/types.js';
import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { MixerClass } from './MixerClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { getVideoEssence } from '../utils/video_essence_utils.js';

//TODO if it will be used then need to do some work
// const KEYER_BUTTON_COLOUR = 'blue';
// const SK_AIRFLYPROV3_OFFSET = 1;
// const SK_MASTERKEYONE_OFFSET = 1;
// const SK_MASTERKEYONE_DISPLAY_ADD = 30;
export class KeyerClass extends PanelElementClass {
  private vm: VM.Any;
  public fill_key: ESSENCE_ENTRY;
  public signal_key: ESSENCE_ENTRY;
  public fill_key_essence: VIDEO_ESSENCE = null;
  public signal_key_essence: VIDEO_ESSENCE = null;
  constructor(socket: Socket, vm: VM.Any, el: KEYER_ELEMENT, panel_model: SK_MODEL) {
    super(
      socket,
      panel_model === 'SK_AIRFLYPROV3' ? 63 + el.buttonIndex : 25 + el.buttonIndex,
      'blue',
      el.name,
      'keyer',
      panel_model,
    );
    this.vm = vm;
    this.fill_key = el.fill_key;
    this.signal_key = el.signal_key;

    this.fill_key_essence = getVideoEssence(
      this.vm,
      this.fill_key.essenceType,
      this.fill_key.essenceIndex,
    );
    this.signal_key_essence = getVideoEssence(
      this.vm,
      this.signal_key.essenceType,
      this.signal_key.essenceIndex,
    );
    this.init_panel_element();
  }

  async keyer_handler(mixer_class: MixerClass, keyer_collection: KeyerClass[]) {
    const { video_mixer, mode } = mixer_class;
    if (mode !== 'LUMA_KEYER') return;
    for (let el of keyer_collection) el.button_dimm();

    await video_mixer.v_src1.command.write(this.fill_key_essence);
    await video_mixer.luma_keyer.v_src.command.write(this.signal_key_essence);
    this.button_on();
  }
}
