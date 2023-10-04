import { AT1101, AT1130, VideoMixer } from 'vapi';
import { VSocket } from 'vscript';
import { SK_MODEL } from './key_collection/key_collection';

//SECTION NEW SHIT
export type ENCODER_TYPE = 'CLIP' | 'GAIN';
export type PROGRAM_PRESET_ENTRY = {
  program_entry: ESSENCE_ENTRY | null;
  preset_entry: ESSENCE_ENTRY | null;
};

export type Configuration = {
  panel_ip: string;
  panel_port: number;
  machine_ip: string;
  panel_layout: PANEL_LAYOUT;
  panel_model: SK_MODEL;
};
export type PANEL_LAYOUT = {
  meLevel: ME_LEVEL[];
};

export type ME_LEVEL = {
  xbarElements: XBAR_ELEMENT[];
  mixerElements: MIXER_ELEMENT[];
  keyerElements: KEYER_ELEMENT[];
  routeOutElements: ROUTE_OUT_ELEMENT[];
  routeInElements: ROUTE_IN_ELEMENT[];
};

export type ROUTE_OUT_ELEMENT = {
  buttonIndex: number;
  outputType: ROUTE_OUTPUT_TYPE;
  outputIndex: number;
  name: string;
};

export type ROUTE_IN_ELEMENT = {
  buttonIndex: number;
  essenceType: ESSENCE_TYPES;
  essenceIndex: number;
  name: string;
};

export type XBAR_ELEMENT = {
  buttonIndex: number;
  essenceType: ESSENCE_TYPES;
  essenceIndex: number;
  name: string;
};
export type KEYER_ELEMENT = {
  buttonIndex: number;
  fill_key: ESSENCE_ENTRY;
  signal_key: ESSENCE_ENTRY;
  name: string;
};

// export declare type ESSENCE_TYPE =
//   | 'N/A'
//   | 'r_t_p_receiver'
//   | 'video_mixer'
//   | 'video_signal_generator'
//   | 'i_o_module'
//   | 're_play'; //re_play.video.players[x]

export type MIXER_ELEMENT = {
  buttonIndex: number;
  rootMixerIndex: number;
  index: number;
  name: string;
};

export declare type ESSENCE_ENTRY = {
  essenceType: ESSENCE_TYPES;
  essenceIndex: number;
};

export declare type VIDEO_ESSENCE = AT1130.Video.Essence | AT1101.Video.Essence | null;

export declare type SrcInformation = {
  buttonIndex: number;
  color: string;
  index: number;
  name: string;
  secondname: string;
  essenceType: ESSENCE_TYPES;
};

export declare type COLOR_MODE = 'Shuffled' | 'White' | 'Random' | 'Red';

export declare type COLOR_CODE = {
  name: string;
  colorCode: string;
};

export declare type SCALE_TYPE = 'STRENGTH_BAR' | 'CENTERED_MARKER' | 'CENTERED_BAR';
export declare type SCALE_TYPE_ENTRY = {
  name: SCALE_TYPE;
  value: number;
};

export declare type FORMAT_NAME =
  | 'Integer'
  | 'Float32'
  | 'Percent'
  | 'dB'
  | 'Frames'
  | '1/X'
  | 'Kelvin'
  | 'Hidden'
  | 'Float33'
  | 'Float22'
  | 'Text1'
  | 'Text2';

export declare type FORMAT_ENTRY = {
  name: FORMAT_NAME;
  value: number;
};

//SECTION OLD SHIT

export declare type CONFIG = {
  panel_details: PANEL_DETAILS;
  ppkm_collection: PROGRAM_PREVIEW_KEYER_MIXER_SET[];
};

export declare type PANEL_DETAILS = {
  ip: string;
  port: number;
};

export declare type ESSENCE_TYPES =
  | 'video_mixer'
  | 'video_signal_generator'
  | 'r_t_p_receiver'
  | 'N/A'
  | 'sdi'
  | 'delay'
  | 'player'
  | 'cc3d'
  | 'cc1d';

export type ROUTE_OUTPUT_TYPE = 'sdi_output' | 'live_view' | 'rtp_tx';

export declare type OLD_VIDEO_ESSENCE = AT1130.Video.Essence | AT1101.Video.Essence;

export declare type OLD_ESSENCE_ENTRY = {
  type: ESSENCE_TYPES;
  index: number;
  essence: OLD_VIDEO_ESSENCE;
};

export declare type VIDEO_MIXER_TYPES =
  | AT1101.VideoMixer.BSLKAsNamedTableRow
  | AT1130.VideoMixer.BSLKAsNamedTableRow
  | null;

// export declare type
//SECTION PANEL_UTILS
export declare type OLD_COLOR_CODE = {
  name: string;
  colorCode: string;
};

export declare type OLD_SCALE_TYPE = 'STRENGTH_BAR' | 'CENTERED_MARKER' | 'CENTERED_BAR';
export declare type OLD_SCALE_TYPE_ENTRY = {
  name: OLD_SCALE_TYPE;
  value: number;
};

export declare type OLD_FORMAT_NAME =
  | 'Integer'
  | 'Float32'
  | 'Percent'
  | 'dB'
  | 'Frames'
  | '1/X'
  | 'Kelvin'
  | 'Hidden'
  | 'Float33'
  | 'Float22'
  | 'Text1'
  | 'Text2';

export declare type OLD_FORMAT_ENTRY = {
  name: OLD_FORMAT_NAME;
  value: number;
};

export declare type HWC_Types = 'B' | 'B4' | 'Tbar' | 'Enc' | 'J' | 'D' | '';

export declare type KEY_GROUPS =
  | 'mixer'
  | 'keyer'
  | 'program'
  | 'preset'
  | 'stay_blinking'
  | 'encoder'
  | 'slider'
  | 'slider_display'
  | 'status_display'
  | 'vm_display'
  | 'me_display'
  | 'display'
  | 'cut'
  | 'route_out'
  | 'route_in'
  | 'auto'
  | 'shift'
  | 'ftb'
  | 'none';

export declare type KEY_ALIAS = {
  alias: string;
  code: string;
  type: HWC_Types;
  group: KEY_GROUPS;
  isPressed: boolean;
  time: number;
};

//SECTION only for mixer collection
export declare type MIXER_CONFIG_ENTRY = {
  name: string;
  index: number;
  mode: VideoMixer.BSLKMode;
  belongingIndex: number | null;
  cascadingIndex: number | null;
};

// export declare type MIXER_OBJECT_CONFIG = {
//   avpIp:string,
//   mixerObjectCollection:MIXER_OBJECT_ENTRY[],
// }

//SECTION API_CONNECTION
export declare type VIDEO_MIXER_BSLK_MODE = VideoMixer.BSLKMode;

export declare type FTB_MODE = 'ON' | 'OFF';

export declare type VIDEO_MIXER_ENTRY = {
  name: string;
  index: number;
  mode: VIDEO_MIXER_BSLK_MODE;
  mixer: VIDEO_MIXER_TYPES;
  lumaKeyerIdCollection: number[];
  ftbMode: FTB_MODE;
  autoIsLocked: boolean;
  autoInterrupt: boolean;
  faderDirection: FADER_DIRECTION;
  ftbIsLocked: boolean;
  faderValue: number;
};

export type FADER_DIRECTION = 'UP' | 'DOWN' | 'NEUTRAL'; //null maybe

export declare type AVP_INFO = {
  ip: string;
  vSocket: VSocket | null;
  isConnected: boolean;
  isSelected: boolean;
};

declare type FADER_DIRECTION_0 = 'UP' | 'DOWN' | null;

export declare type PANEL_CONFIG = {
  avp_info: AVP_INFO;
  mixerCollection: VIDEO_MIXER_ENTRY[];
  videoEssenceCollection: OLD_ESSENCE_ENTRY[];
  selectedMixer: number;
  faderDirection0: FADER_DIRECTION_0;
  liveView: AT1130.Monitoring.LiveView | AT1101.Monitoring.LiveView | null;
  ppSet: PROGRAM_PREVIEW_KEYER_MIXER_SET;
};

//FOR THE JSON FILE
export declare type PROGRAM_PREVIEW_BUS_TYPE = 'SINGLE_ROW' | 'DOUBLE_ROW';
export declare type PROGRAM_PREVIEW_KEYER_MIXER_SET = {
  avpIp: string;
  // busType: PROGRAM_PREVIEW_BUS_TYPE,
  sourceCollection: PROGRAM_PREVIEW_KEYER_ENTRY[];
  keyerCollection: PROGRAM_PREVIEW_KEYER_ENTRY[];
  mixerConfigCollection: MIXER_CONFIG_ENTRY[];
};

export declare type PROGRAM_PREVIEW_KEYER_ENTRY = {
  isBlank: boolean;
  name: string;
  videoEssence: {
    type: ESSENCE_TYPES;
    index: number;
  };
  pos: BUTTON_POSITIONING;
};

export declare type BUTTON_POSITIONING = {
  row: number;
  shiftRow?: boolean;
};

export declare type PLACED_BUTTON_POSITIONING_ENTRY = {
  row: number;
  isPlaced: boolean;
  shiftRow?: boolean;
};

export declare type BUTTON_STATUS =
  | 'On'
  | 'Off'
  | 'Dimmed'
  | 'BlinkingRed'
  | 'BlinkingRedQuick'
  | 'Blinking'
  | 'BlinkingQuick'
  | 'BlinkingWhite'
  | 'BlinkingWhiteQuick';

export declare type OLD_COLOR_MODE = 'Shuffled' | 'White' | 'Random' | 'Red';

export declare type SET_KEYER_MODE = 'fill' | 'signal' | 'empty';
