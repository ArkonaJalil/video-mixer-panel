import * as VAPI from 'vapi';
import { AT1101, AT1130, VideoMixer } from 'vapi';
import {
  OLD_ESSENCE_ENTRY,
  MIXER_CONFIG_ENTRY,
  PANEL_CONFIG,
  PROGRAM_PREVIEW_KEYER_MIXER_SET,
  VIDEO_MIXER_ENTRY,
  ESSENCE_TYPES,
} from './utils/types.js';
import { enforce_nonnull } from 'vscript';

// SECTION NEW
export async function connectMachine(ip: string) {
  try {
    // TODO login credentials
    const vm = await VAPI.VM.open({
      ip: ip,
      towel: '',
      login: {
        user: '',
        password: '',
      },
    });
    return vm;
  } catch {
    console.log(`Error: Could not connect to ${ip}!`);
    return null;
  }
}

export function getVsrc(vm: VAPI.VM.Any, essenceType: ESSENCE_TYPES, essenceIndex: number) {
  let timedSource: AT1130.Video.TimedSource | AT1101.Video.TimedSource = {
    source: null,
    switch_time: null,
  };

  if (vm instanceof AT1101.Root) {
    switch (essenceType) {
      case 'r_t_p_receiver':
        timedSource.source = enforce_nonnull(vm.r_t_p_receiver).video_receivers.row(
          essenceIndex,
        ).media_specific.output.video;
        break;
      case 're_play':
        timedSource.source = enforce_nonnull(vm.re_play)
          .video.delays.row(essenceIndex)
          .outputs.row(0).video;
        break;
      default:
        console.log(`Error: ${essenceType} essence type for AT1101 is not available! (getVsrc)`);
    }
  }

  if (vm instanceof AT1130.Root) {
    switch (essenceType) {
      case 'r_t_p_receiver':
        timedSource.source = enforce_nonnull(vm.r_t_p_receiver).video_receivers.row(essenceIndex)
          .media_specific.output.video as AT1130.Video.Essence;
        break;
      case 're_play':
        timedSource.source = enforce_nonnull(vm.re_play)
          .video.delays.row(essenceIndex)
          .outputs.row(0).video as AT1130.Video.Essence;
        break;
      default:
        console.log(`Error: ${essenceType} essence type for AT1130 is not available! (getVsrc)`);
    }
  }
  return timedSource;
}

export function isReadyStatus(vm: VAPI.VM.Any) {
  return vm.raw.is_ready();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//SECTION OLD SHIT

//checking for connection
export function connectionCheck(panelConfig: PANEL_CONFIG) {
  if (panelConfig.avp_info.vSocket == null) {
    panelConfig.avp_info.isConnected = false;
  }
  if (panelConfig.avp_info.vSocket != null) {
    panelConfig.avp_info.isConnected = panelConfig.avp_info.vSocket.is_ready();
  }
  return panelConfig.avp_info.isConnected;
}

export async function initAvpMachine(ip: string, ppSet: PROGRAM_PREVIEW_KEYER_MIXER_SET) {
  const { mixerConfigCollection } = ppSet;
  const AVP = await connectMachine(ip);

  let panelConfig: PANEL_CONFIG = {
    avp_info: {
      ip: ip,
      vSocket: null,
      isConnected: false,
      isSelected: false,
    },
    faderDirection0: null,
    mixerCollection: [],
    videoEssenceCollection: [],
    selectedMixer: 1,
    liveView: AVP?.monitoring?.live_view == null ? null : AVP.monitoring.live_view,
    ppSet: ppSet,
  };
  if (AVP == null) {
    console.log(`Error: ${ip} could not connect!`);
    panelConfig.avp_info.isConnected = false;
    return panelConfig;
  }
  panelConfig.avp_info.vSocket = AVP.raw;
  //collect Video essences
  panelConfig.videoEssenceCollection = await gather_video_essences(AVP);
  //collect mixerCollection
  panelConfig.mixerCollection = await gather_video_mixer_collection(AVP, mixerConfigCollection);
  return panelConfig;
}

export async function gather_video_essences(vm: VAPI.VM.Any) {
  let VideoEssenceCollectionT: OLD_ESSENCE_ENTRY[] = [];

  // //color_correction
  // if(vm.color_correction != null){
  //   for(let e of await vm.color_correction.pool.rows()){
  //     VideoEssenceCollectionT.push({type:"color_correction",index:e.index,essence:e.output})
  //   }
  // }

  //video_mixer
  // vm.video_mixer.bslk.row(5).output
  if (vm.video_mixer?.instances != null) {
    // if(vm.video_mixer?.bslk !=null){
    for (let e of await vm.video_mixer.instances.rows()) {
      VideoEssenceCollectionT.push({ type: 'video_mixer', index: e.index, essence: e.output });
    }
  }

  //rtp_receiver
  if (vm.r_t_p_receiver?.video_receivers != null) {
    for (let e of await vm.r_t_p_receiver.video_receivers.rows()) {
      VideoEssenceCollectionT.push({
        type: 'r_t_p_receiver',
        index: e.index,
        essence: e.media_specific.output.video,
      });
    }
  }

  //delay player
  if (vm.re_play?.video.players != null) {
    for (let e of await vm.re_play?.video.players.rows()) {
      VideoEssenceCollectionT.push({
        type: 're_play',
        index: e.index,
        essence: e.output.video,
      });
    }
  }

  //video signal generator
  if (vm.video_signal_generator != null) {
    VideoEssenceCollectionT.push({
      type: 'video_signal_generator',
      index: 0,
      essence: vm.video_signal_generator.instances.row(0).output,
    });
  }
  return VideoEssenceCollectionT;
}

function getMixerConfigEntry(index: number, mixerConfigCollection: MIXER_CONFIG_ENTRY[]) {
  const FOUND_ENTRY = mixerConfigCollection.find((el) => el.index === index);
  return FOUND_ENTRY == null ? null : FOUND_ENTRY;
}

function getMixerModeShortcut(mode: VideoMixer.BSLKMode) {
  switch (mode) {
    case 'LUMA_KEYER':
      return 'Luma';
    case 'LUMA_KEYER_ADDITIVE':
      return 'Luma+';
    case 'MIXER':
    case 'MIXER_INDEPENDENT':
      return 'Mixer';
    default:
      console.log(`Error: ${mode} is unknwon! (getMixerModeShortcut)`);
      return 'UNKNWN';
  }
}
export async function gather_video_mixer_collection(
  vm: VAPI.VM.Any,
  mixerConfigCollection: MIXER_CONFIG_ENTRY[],
) {
  let VideoMixerCollection: VIDEO_MIXER_ENTRY[] = [];

  //just for debugging
  for (let i = 0; i < 8; i++) {
    await vm.video_mixer?.instances.create_row({
      allow_reuse_row: true,
      index: i,
    });
  }

  if (vm.video_mixer == null) return VideoMixerCollection;
  for (const MIXER of await vm.video_mixer.instances.rows()) {
    const MIXER_CONFIG = getMixerConfigEntry(MIXER.index, mixerConfigCollection);
    if (MIXER_CONFIG == null) {
      await MIXER.mode.write('MIXER');
      VideoMixerCollection.push({
        name: `Mixer ${MIXER.index}`,
        mode: 'MIXER',
        index: MIXER.index,
        mixer: MIXER,
        lumaKeyerIdCollection: [],
        ftbMode: 'OFF',
        ftbIsLocked: false,
        autoIsLocked: false,
        autoInterrupt: false,
        faderValue: -1,
        faderDirection: 'NEUTRAL',
      });
      continue;
    }

    const LUMA_KEYER_BELONGINGS = mixerConfigCollection
      .filter((el) => el.belongingIndex === MIXER.index)
      .map((el) => el.index);
    await MIXER.mode.write(MIXER_CONFIG.mode);
    //NOTE here comes the cascading thing if needed
    if (MIXER_CONFIG.mode === 'LUMA_KEYER') {
      //do the cascading thing
      if (MIXER_CONFIG.cascadingIndex != null) {
        let mixerSrc = vm.video_mixer.instances.row(MIXER_CONFIG.cascadingIndex);
        await MIXER.v_src0.command.write(mixerSrc.output);
      }
    }
    VideoMixerCollection.push({
      name:
        MIXER_CONFIG.name === ''
          ? `${getMixerModeShortcut(MIXER_CONFIG.mode)} ${MIXER.index}`
          : MIXER_CONFIG.name,
      mode: MIXER_CONFIG.mode,
      index: MIXER.index,
      mixer: MIXER,
      lumaKeyerIdCollection: LUMA_KEYER_BELONGINGS,
      ftbMode: 'OFF',
      ftbIsLocked: false,
      autoIsLocked: false,
      autoInterrupt: false,
      faderValue: -1,
      faderDirection: 'NEUTRAL',
    });
  }

  return VideoMixerCollection;
}

export function getSelectedMixer(panelConfig: PANEL_CONFIG) {
  const { selectedMixer, mixerCollection } = panelConfig;
  let mixer = mixerCollection.find((el) => el.index === selectedMixer);
  return mixer;
}

// export function setSelectedMixer(mixerIndex:number,panelConfig:PANEL_CONFIG){
//   panelConfig.selectedMixer=mixerIndex;
// }

//this to translate for panel which sources need to be highlighted
export function parseVideoEssence(
  essence: AT1130.Video.Essence | AT1101.Video.Essence | undefined | null,
): OLD_ESSENCE_ENTRY | null {
  if (essence == null) return null;
  let kwl = essence.raw.kwl;
  let obj = kwl.match(/^(.*?)\.(.*)/);
  if (obj == null) return null;
  let type = obj[1];
  let suffix = obj[2];
  if (type == null || suffix == null) return null;
  switch (type) {
    case 'r_t_p_receiver':
      let rtpIndexString = suffix.match(/(\d+)/);
      if (rtpIndexString == null) return null;
      return {
        type: 'r_t_p_receiver',
        index: parseInt(rtpIndexString[0] == null ? '-1' : rtpIndexString[0]),
        essence,
      };
    case 'color_correction':
      let colorIndexString = suffix.match(/(\d+)/);
      if (colorIndexString == null) return null;
      return {
        type: 'color_correction',
        index: parseInt(colorIndexString[0] == null ? '-1' : colorIndexString[0]),
        essence,
      };
    case 'video_mixer':
      let videoMixerIndexString = suffix.match(/(\d+)/);
      if (videoMixerIndexString == null) return null;
      return {
        type: 'video_mixer',
        index: parseInt(videoMixerIndexString[0] == null ? '-1' : videoMixerIndexString[0]),
        essence,
      };
    case 'video_signal_generator':
      let signalGeneratorIndexString = suffix.match(/(\d+)/);
      if (signalGeneratorIndexString == null) return null;
      return {
        type: 'video_signal_generator',
        index: parseInt(
          signalGeneratorIndexString[0] == null ? '-1' : signalGeneratorIndexString[0],
        ),
        essence,
      };
    case 're_play':
      let videoDelayIndexString = suffix.match(/(\d+)/);
      if (videoDelayIndexString == null) return null;
      return {
        type: 're_play',
        index: parseInt(videoDelayIndexString[0] == null ? '-1' : videoDelayIndexString[0]),
        essence,
      };
    default:
      console.log(`Error: ${type} is not implemented inside parseVideoEssence!`);
      return null;
  }
}
