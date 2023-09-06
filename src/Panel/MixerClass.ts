import { AT1130, AT1101, VM } from 'vapi';
import { BUTTON_STATUS, ESSENCE_ENTRY, MIXER_ELEMENT } from '../utils/types.js';
import { Socket } from 'net';
import { PanelElementClass, button_handler } from './PanelElementClass.js';
import { XbarClass } from './XbarClass.js';
import { KeyerClass } from './KeyerClass.js';
import { BSLKMode } from 'vapi/VideoMixer.js';
import { Watcher, enforce_nonnull } from 'vscript';
import { EncoderClass } from './EncoderClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import { parse_video_essence } from '../utils/video_essence_utils.js';
import {
  MIXER_SK_AIRFLYPROV3_OFFSET,
  MIXER_SK_MASTERKEYONE_OFFSET,
  MIXER_BUTTON_COLOUR,
  MIXER_SK_MASTERKEYONE_DISPLAY_ADD,
  MIXER_KEYER_BUTTON_COLOUR,
  MIXER_RED_KEYER_BUTTON_COLOUR,
} from '../utils/global.js';

export class MixerClass extends PanelElementClass {
  public slider_check: boolean = false;
  public vm: VM.Any;
  public mode: BSLKMode = 'MIXER';
  public mixerIndex: number = -1;
  public rootMixerIndex: number = -1;
  public display_element: PanelElementClass;
  public root_video_mixer:
    | AT1101.VideoMixer.BSLKAsNamedTableRow
    | AT1130.VideoMixer.BSLKAsNamedTableRow;
  public video_mixer: AT1101.VideoMixer.BSLKAsNamedTableRow | AT1130.VideoMixer.BSLKAsNamedTableRow;

  public watcherCollection: Watcher[] = [];
  public anc_input: number = 0;
  public preset_essence_entry: ESSENCE_ENTRY = { essenceType: 'N/A', essenceIndex: -1 };
  public program_essence_entry: ESSENCE_ENTRY = { essenceType: 'N/A', essenceIndex: -1 };
  public fill_key_entry: ESSENCE_ENTRY = { essenceType: 'N/A', essenceIndex: -1 };
  public signal_key_entry: ESSENCE_ENTRY = { essenceType: 'N/A', essenceIndex: -1 };

  constructor(socket: Socket, vm: VM.Any, el: MIXER_ELEMENT, panel_model: SK_MODEL) {
    //WARNING key code button offset can be another one
    super(
      socket,
      panel_model === 'SK_AIRFLYPROV3'
        ? MIXER_SK_AIRFLYPROV3_OFFSET + el.buttonIndex
        : MIXER_SK_MASTERKEYONE_OFFSET + el.buttonIndex,
      MIXER_BUTTON_COLOUR,
      el.name,
      'mixer',
      panel_model,
    );
    this.display_element = new PanelElementClass(
      socket,
      panel_model === 'SK_AIRFLYPROV3'
        ? el.buttonIndex + MIXER_SK_AIRFLYPROV3_OFFSET
        : +MIXER_SK_MASTERKEYONE_OFFSET + MIXER_SK_MASTERKEYONE_DISPLAY_ADD + el.buttonIndex,
      MIXER_BUTTON_COLOUR,
      el.name,
      'display',
      panel_model,
    );
    this.display_element.init_panel_display(el.name);
    this.socket = socket;
    this.vm = vm;
    this.mixerIndex = el.index;
    this.rootMixerIndex = el.rootMixerIndex;
    this.root_video_mixer = enforce_nonnull(vm.video_mixer).instances.row(el.rootMixerIndex);
    this.video_mixer = enforce_nonnull(vm.video_mixer).instances.row(el.index);
    this.set_mode();
    this.init_panel_element();
  }

  async set_mode() {
    this.mode = await this.video_mixer.mode.read();
    if (this.mode === 'LUMA_KEYER') {
      this.set_button_color(
        (await this.video_mixer.luma_keyer.opacity.current.read()) === 1
          ? MIXER_KEYER_BUTTON_COLOUR
          : MIXER_RED_KEYER_BUTTON_COLOUR,
      );
    }
  }

  async trigger_srcs() {
    await this.root_video_mixer.mixer.anc_input.read();
    await this.root_video_mixer.mixer.anc_input.read();
    await this.root_video_mixer.mixer.fader0.current.read();
    await this.root_video_mixer.v_src0.command.read();
    await this.root_video_mixer.v_src1.command.read();

    if (this.mode === 'LUMA_KEYER') {
      await this.video_mixer.v_src1.command.read();
      await this.video_mixer.luma_keyer.v_src.command.read();
      await this.video_mixer.luma_keyer.gain.read();
      await this.video_mixer.luma_keyer.clip.read();
    }
  }

  async subscribe_mixer_srcs(
    xbar_collection: XbarClass[],
    keyer_collection: KeyerClass[],
    encoder_collection: EncoderClass[],
  ) {
    //NOTE Do i need to change the srcs here manually ???
    let watcher_anc_input = await this.root_video_mixer.mixer.anc_input.watch((p) => {
      let pre_anc_input = this.anc_input;
      this.anc_input = p;
      if (pre_anc_input === this.anc_input) return;
      let pre_preset_entry = this.preset_essence_entry;
      let pre_program_entry = this.program_essence_entry;
      this.program_essence_entry = pre_preset_entry;
      this.preset_essence_entry = pre_program_entry;

      this.highlight_xbar_preset_element(xbar_collection, 'On');
      this.highlight_xbar_program_element(xbar_collection, 'On');
    });

    let watcher_current_fader = await this.root_video_mixer.mixer.fader0.current.watch((p) => {
      if (p === 0 || p === 1) {
        this.highlight_xbar_preset_element(xbar_collection, 'On');
        this.highlight_xbar_program_element(xbar_collection, 'On');
        return;
      }
      // console.log('================ HERE ===============');
      this.highlight_xbar_preset_element(xbar_collection, 'BlinkingRedQuick');
      this.highlight_xbar_program_element(xbar_collection, 'BlinkingRedQuick');
    });

    let watcher_mode = await this.root_video_mixer.mode.watch((p) => (this.mode = p));
    let watcher_src0 = await this.root_video_mixer.v_src0.command.watch((p) => {
      let essence_entry = parse_video_essence(p);
      if (this.anc_input === 0) {
        this.program_essence_entry = essence_entry;
        this.highlight_xbar_program_element(xbar_collection, 'On');
      }
      if (this.anc_input === 1) {
        this.preset_essence_entry = essence_entry;
        this.highlight_xbar_preset_element(xbar_collection, 'On');
      }
    });

    let watcher_src1 = await this.root_video_mixer.v_src1.command.watch((p) => {
      let essence_entry = parse_video_essence(p);
      if (this.anc_input === 0) {
        this.preset_essence_entry = essence_entry;
        this.highlight_xbar_preset_element(xbar_collection, 'On');
      }
      if (this.anc_input === 1) {
        this.program_essence_entry = essence_entry;
        this.highlight_xbar_program_element(xbar_collection, 'On');
      }
    });
    this.watcherCollection.push(watcher_anc_input);
    this.watcherCollection.push(watcher_mode);
    this.watcherCollection.push(watcher_src0);
    this.watcherCollection.push(watcher_src1);
    this.watcherCollection.push(watcher_current_fader);

    if (this.mode === 'LUMA_KEYER') {
      let watcher_fill_key = await this.video_mixer.v_src1.command.watch((p) => {
        let essence_entry = parse_video_essence(p);
        this.fill_key_entry = essence_entry;
        this.highlight_keyer_element(keyer_collection, 'On');
      });
      let watcher_signal_key = await this.video_mixer.luma_keyer.v_src.command.watch((p) => {
        let essence_entry = parse_video_essence(p);
        this.signal_key_entry = essence_entry;
        this.highlight_keyer_element(keyer_collection, 'On');
      });

      const encoder_clip = encoder_collection.find((el) => el.encoder_type === 'CLIP');
      if (encoder_clip != null) {
        let watcher_clip = await this.video_mixer.luma_keyer.clip.watch((p) => {
          encoder_clip.set_display_text(encoder_clip.build_string(p), false);
        });
        this.watcherCollection.push(watcher_clip);
      }

      const encoder_gain = encoder_collection.find((el) => el.encoder_type === 'GAIN');
      if (encoder_gain != null) {
        let watcher_gain = await this.video_mixer.luma_keyer.gain.watch((p) => {
          encoder_gain.set_display_text(encoder_gain.build_string(p), false);
        });
        this.watcherCollection.push(watcher_gain);
      }

      const watcher_opacity = await this.video_mixer.luma_keyer.opacity.current.watch((p) => {
        if (p === 1) return this.set_button_color(MIXER_KEYER_BUTTON_COLOUR);
        this.set_button_color('red');
      });

      this.watcherCollection.push(watcher_fill_key);
      this.watcherCollection.push(watcher_signal_key);
      this.watcherCollection.push(watcher_opacity);
    }
  }

  //how do i do this
  async unsubscribe_mixer_srcs() {
    for (let w of this.watcherCollection) {
      w.unwatch();
    }
    this.watcherCollection = [];
  }

  highlight_xbar_program_element(xbar_collection: XbarClass[], button_status: BUTTON_STATUS) {
    for (let el of xbar_collection) el.programElement.button_dimm();

    let find_program = xbar_collection.find(
      (el) =>
        el.essenceIndex === this.program_essence_entry.essenceIndex &&
        el.essenceType === this.program_essence_entry.essenceType,
    );
    if (find_program == null) return;
    button_handler(find_program.programElement, button_status);
  }

  highlight_xbar_preset_element(xbar_collection: XbarClass[], button_status: BUTTON_STATUS) {
    for (let el of xbar_collection) el.presetElement.button_dimm();

    let find_preset = xbar_collection.find(
      (el) =>
        el.essenceIndex === this.preset_essence_entry.essenceIndex &&
        el.essenceType === this.preset_essence_entry.essenceType,
    );

    if (find_preset == null) return;
    // console.log('preset', button_status);
    button_handler(find_preset.presetElement, button_status);
  }

  highlight_keyer_element(keyer_collection: KeyerClass[], button_status: BUTTON_STATUS) {
    for (let el of keyer_collection) el.button_dimm();

    let find_keyer = keyer_collection.find(
      (el) =>
        el.fill_key.essenceIndex === this.fill_key_entry.essenceIndex &&
        el.fill_key.essenceType === this.fill_key_entry.essenceType &&
        el.signal_key.essenceIndex === this.signal_key_entry.essenceIndex &&
        el.signal_key.essenceType === this.signal_key_entry.essenceType,
    );
    if (find_keyer == null) return;
    button_handler(find_keyer, button_status);
  }

  async button_down_handler(
    mixer_collection: MixerClass[],
    xbar_collection: XbarClass[],
    keyer_collection: KeyerClass[],
    encoder_collection: EncoderClass[],
  ) {
    //dimm all other buttons
    for (let el of mixer_collection) {
      el.button_dimm();
      el.unsubscribe_mixer_srcs();
    }
    //set this button on
    this.button_on();
    this.subscribe_mixer_srcs(xbar_collection, keyer_collection, encoder_collection);
    if (this.mode === 'MIXER') {
      this.set_keyer_collection_status('Off', keyer_collection);
      this.set_encoder_collection_status('Off', encoder_collection);
    }
    if (this.mode === 'LUMA_KEYER') {
      this.set_keyer_collection_status('Dimmed', keyer_collection);
      this.set_encoder_collection_status('Dimmed', encoder_collection);
    }

    this.trigger_srcs();
  }

  set_keyer_collection_status(status: BUTTON_STATUS, keyer_collection: KeyerClass[]) {
    for (let el of keyer_collection) {
      switch (status) {
        case 'Off':
          el.button_off();
          el.set_display_text('', false);
          break;
        case 'Dimmed':
          el.button_dimm();
          el.set_display_text(el.display_name, false);
          break;
      }
    }
  }

  async set_encoder_collection_status(status: BUTTON_STATUS, encoder_collection: EncoderClass[]) {
    for (let el of encoder_collection) {
      switch (status) {
        case 'Off':
          el.button_off();
          el.set_display_text('', false);
          break;
        case 'Dimmed':
          el.button_dimm();
          el.set_display_text(await el.getCurrentValueString(this.video_mixer), false);
          break;
      }
    }
  }
}
