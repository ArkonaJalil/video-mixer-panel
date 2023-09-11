import { VM, AT1130, AT1101 } from 'vapi';
import { enforce_nonnull } from 'vscript';
import { ESSENCE_ENTRY, VIDEO_ESSENCE } from './types';

//SECTION getVideoEssences
export function getVideoEssence(vm: VM.Any, essenceEntry: ESSENCE_ENTRY): VIDEO_ESSENCE {
  const { essenceType: type, essenceIndex: index } = essenceEntry;
  switch (type) {
    case 'video_mixer':
      return getMixerEssence(vm, index);
    case 'r_t_p_receiver':
      return getRtpVideoRxEssence(vm, index);
    case 'video_signal_generator':
      return getVideoSignalGeneratorEssence(vm, index);
    case 're_play':
      return getReplayEssence(vm, index);
    case 'sdi':
      return getSdiOutputEssence(vm, index);
    case 'color_correction':
      return getColorCorrection(vm, index);
    default:
      return null;
  }
}

function getColorCorrection(vm: VM.Any, index: number) {
  const color_correction = enforce_nonnull(vm.color_correction);
  if (color_correction.cc1d.row(index) == null) return null;
  return color_correction.cc1d.row(index).output;
}

function getReplayEssence(vm: VM.Any, index: number) {
  const re_play = enforce_nonnull(vm.re_play);
  if (re_play.video.players.row(index) == null) return null;
  return re_play.video.players.row(index).output.video;
}

function getMixerEssence(vm: VM.Any, index: number) {
  const mixer = enforce_nonnull(vm.video_mixer);
  if (mixer.instances.row(index) == null) return null;
  return mixer.instances.row(index).output;
}

function getRtpVideoRxEssence(vm: VM.Any, index: number) {
  const rtp_receiver = enforce_nonnull(vm.r_t_p_receiver);
  if (rtp_receiver.video_receivers.row(index) == null) return null;
  return rtp_receiver.video_receivers.row(index).media_specific.output.video;
}

function getVideoSignalGeneratorEssence(vm: VM.Any, index: number) {
  const signal_generator = enforce_nonnull(vm.video_signal_generator);
  if (signal_generator.instances.row(index) == null) return null;
  return signal_generator.instances.row(index).output;
}

function getSdiOutputEssence(vm: VM.Any, index: number) {
  const i_o_module = enforce_nonnull(vm.i_o_module);
  if (i_o_module.input.row(index) == null) return null;
  return i_o_module.input.row(index).sdi.output.video;
}

export function parse_video_essence(
  essence: AT1130.Video.Essence | AT1101.Video.Essence | undefined | null,
): ESSENCE_ENTRY {
  if (essence == null) return { essenceType: 'N/A', essenceIndex: -1 };
  let kwl = essence.raw.kwl;
  let obj = kwl.match(/^(.*?)\.(.*)/);
  if (obj == null) return { essenceType: 'N/A', essenceIndex: -1 };
  let type = obj[1];
  let suffix = obj[2];
  if (type == null || suffix == null) return { essenceType: 'N/A', essenceIndex: -1 };
  // console.log('parseVideoEssence', type);
  switch (type) {
    case 'r_t_p_receiver':
      let rtpIndexString = suffix.match(/(\d+)/);
      if (rtpIndexString == null) return { essenceType: 'r_t_p_receiver', essenceIndex: -1 };
      return {
        essenceType: 'r_t_p_receiver',
        essenceIndex: parseInt(rtpIndexString[0] == null ? '-1' : rtpIndexString[0]),
      };
    case 'color_correction':
      let colorIndexString = suffix.match(/cc1d\[(\d+)\].output/);
      if (colorIndexString == null || colorIndexString[1] == null)
        return { essenceType: 'color_correction', essenceIndex: -1 };
      return {
        essenceType: 'color_correction',
        essenceIndex: parseInt(colorIndexString[0] == null ? '-1' : colorIndexString[1]),
      };
    case 'video_mixer':
      let videoMixerIndexString = suffix.match(/(\d+)/);
      if (videoMixerIndexString == null) return { essenceType: 'video_mixer', essenceIndex: -1 };
      return {
        essenceType: 'video_mixer',
        essenceIndex: parseInt(videoMixerIndexString[0] == null ? '-1' : videoMixerIndexString[0]),
      };
    case 'video_signal_generator':
      let signalGeneratorIndexString = suffix.match(/(\d+)/);
      if (signalGeneratorIndexString == null)
        return { essenceType: 'video_signal_generator', essenceIndex: -1 };
      return {
        essenceType: 'video_signal_generator',
        essenceIndex: parseInt(
          signalGeneratorIndexString[0] == null ? '-1' : signalGeneratorIndexString[0],
        ),
      };
    case 're_play':
      let videoDelayIndexString = suffix.match(/(\d+)/);
      if (videoDelayIndexString == null) return { essenceType: 're_play', essenceIndex: -1 };
      return {
        essenceType: 're_play',
        essenceIndex: parseInt(videoDelayIndexString[0] == null ? '-1' : videoDelayIndexString[0]),
      };
    case 'i_o_module': // NOTE this is for type sdi
      let sdiIndexString = suffix.match(/(\d+)/);
      if (sdiIndexString == null) return { essenceType: 'sdi', essenceIndex: -1 };
      return {
        essenceType: 'sdi',
        essenceIndex: parseInt(sdiIndexString[0] == null ? '-1' : sdiIndexString[0]),
      };
    default:
      // console.log(`Error: ${type} is not implemented inside parseVideoEssence!`);
      return { essenceType: 'N/A', essenceIndex: -1 };
  }
}
