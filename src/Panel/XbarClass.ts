import { VM } from 'vapi';
import { ESSENCE_TYPES, VIDEO_ESSENCE, XBAR_ELEMENT } from '../utils/types.js';
import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { MixerClass } from './MixerClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { getVideoEssence } from '../utils/video_essence_utils.js';
import {
  XBAR_SK_MASTERKEYONE_DISPLAY_ADD,
  XBAR_PROGRAM_KEY_COLOR,
  XBAR_SK_MASTERKEYONE_OFFSET,
  XBAR_SK_AIRFLYPROV3_OFFSET,
  XBAR_PRESET_KEY_COLOR,
} from '../utils/global.js';

export class XbarClass {
  private vm: VM.Any;
  public essenceType: ESSENCE_TYPES = 'N/A';
  public essenceIndex: number = -1;
  public video_essence: VIDEO_ESSENCE = null;
  public programElement: PanelElementClass;
  public presetElement: PanelElementClass;
  public displayElement: PanelElementClass;

  constructor(socket: Socket, vm: VM.Any, el: XBAR_ELEMENT, panel_model: SK_MODEL) {
    const program_key_code_offset = panel_model === 'SK_MASTERKEYONE' ? 13 : 13;
    const program_key_code = program_key_code_offset + el.buttonIndex;
    this.displayElement = new PanelElementClass(
      socket,
      panel_model === 'SK_MASTERKEYONE'
        ? XBAR_SK_MASTERKEYONE_DISPLAY_ADD + program_key_code
        : program_key_code,
      XBAR_PROGRAM_KEY_COLOR,
      el.name,
      'display',
      panel_model,
    );
    this.programElement = new PanelElementClass(
      socket,
      program_key_code,
      XBAR_PROGRAM_KEY_COLOR,
      el.name,
      'program',
      panel_model,
    );
    const preset_key_code_offset =
      panel_model === 'SK_MASTERKEYONE' ? XBAR_SK_MASTERKEYONE_OFFSET : XBAR_SK_AIRFLYPROV3_OFFSET;
    const preset_key_code = preset_key_code_offset + el.buttonIndex;
    this.presetElement = new PanelElementClass(
      socket,
      preset_key_code,
      XBAR_PRESET_KEY_COLOR,
      el.name,
      'preset',
      panel_model,
    );

    this.vm = vm;
    this.essenceIndex = el.essenceIndex;
    this.essenceType = el.essenceType;
    this.video_essence = getVideoEssence(this.vm, {
      essenceIndex: this.essenceIndex,
      essenceType: this.essenceType,
    });
  }

  async program_handler(mixer_class: MixerClass, xbar_collection: XbarClass[]) {
    console.log('program_handler', mixer_class.rootMixerIndex, mixer_class.mixerIndex);
    const { root_video_mixer, anc_input } = mixer_class;
    for (let el of xbar_collection) el.programElement.button_dimm();
    const program_src = anc_input === 0 ? root_video_mixer.v_src0 : root_video_mixer.v_src1;
    await program_src.command.write(this.video_essence);
    this.programElement.button_on();
  }

  async preset_handler(mixer_class: MixerClass, xbar_collection: XbarClass[]) {
    const { root_video_mixer, anc_input } = mixer_class;
    for (let el of xbar_collection) el.presetElement.button_dimm();
    const preset_src = anc_input === 1 ? root_video_mixer.v_src0 : root_video_mixer.v_src1;
    await preset_src.command.write(this.video_essence);
    this.presetElement.button_on();
  }
}
