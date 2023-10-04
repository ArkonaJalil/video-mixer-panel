import { VM, AT1130, AT1101 } from 'vapi';
import { enforce_nonnull } from 'vscript';
import { ESSENCE_ENTRY, ESSENCE_TYPES } from './types';

//SECTION getVideoEssences
export function getVideoEssence(vm: VM.Any, essenceType: ESSENCE_TYPES, essenceIndex: number) {
  let v_src: AT1130.Video.Essence | AT1101.Video.Essence | null = null;
  console.log('getVideoEssence', essenceType, essenceIndex);
  if (vm instanceof AT1101.Root) {
    switch (essenceType) {
      case 'r_t_p_receiver':
        v_src = enforce_nonnull(vm.r_t_p_receiver).video_receivers.row(essenceIndex).media_specific
          .output.video;
        break;
      case 'delay':
        v_src = enforce_nonnull(vm.re_play).video.delays.row(essenceIndex).outputs.row(0).video;
        break;
      case 'player':
        v_src = enforce_nonnull(vm.re_play).video.players.row(essenceIndex).output.video;
        break;
      case 'video_signal_generator':
        v_src = enforce_nonnull(vm.video_signal_generator).instances.row(essenceIndex).output;
        break;
      case 'sdi':
        v_src = enforce_nonnull(vm.i_o_module).input.row(essenceIndex).sdi.output.video;
        break;
      case 'cc1d':
        v_src = enforce_nonnull(vm.color_correction).cc1d.row(essenceIndex).output;
        break;
      case 'cc3d':
        v_src = enforce_nonnull(vm.color_correction).cc3d.row(essenceIndex).output;
        break;
      case 'video_mixer':
        v_src = enforce_nonnull(vm.video_mixer).instances.row(essenceIndex).output;
        break;
      default:
        console.log(`Error: ${essenceType} essence type for AT1101 is not available! (getVsrc)`);
    }
  }

  if (vm instanceof AT1130.Root) {
    switch (essenceType) {
      case 'r_t_p_receiver':
        v_src = enforce_nonnull(vm.r_t_p_receiver).video_receivers.row(essenceIndex).media_specific
          .output.video as AT1130.Video.Essence;
        break;
      case 'delay':
        v_src = enforce_nonnull(vm.re_play).video.delays.row(essenceIndex).outputs.row(0).video;
        break;
      case 'player':
        v_src = enforce_nonnull(vm.re_play).video.players.row(essenceIndex).output.video;
        break;
      case 'video_signal_generator':
        v_src = enforce_nonnull(vm.video_signal_generator).instances.row(essenceIndex)
          .output as AT1130.Video.Essence;
        break;
      case 'sdi':
        v_src = enforce_nonnull(vm.i_o_module).input.row(essenceIndex).sdi.output
          .video as AT1130.Video.Essence;
        break;
      case 'cc1d':
        v_src = enforce_nonnull(vm.color_correction).cc1d.row(essenceIndex).output;
        break;
      case 'cc3d':
        v_src = enforce_nonnull(vm.color_correction).cc3d.row(essenceIndex).output;
        break;
      case 'video_mixer':
        v_src = enforce_nonnull(vm.video_mixer).instances.row(essenceIndex).output;
        break;
      default:
        console.log(`Error: ${essenceType} essence type for AT1130 is not available! (getVsrc)`);
    }
  }
  return v_src;
}

export function parse_video_essence(
  essence: AT1130.Video.Essence | AT1101.Video.Essence | undefined | null,
): ESSENCE_ENTRY {
  if (essence == null) return { essenceType: 'N/A', essenceIndex: -1 };
  let kwlString = essence.raw.kwl;
  let obj = kwlString.match(/^(.*?)\.(.*)/);
  if (obj == null) return { essenceType: 'N/A', essenceIndex: -1 };
  let type = obj[1];
  let suffix = obj[2];

  switch (type) {
    case 'i_o_module':
      return i_o_module_parser(suffix);
    case 're_play':
      return re_play_parser(suffix);
    case 'r_t_p_receiver':
      return r_t_p_receiver_parser(suffix);
    case 'video_mixer':
      return video_mixer_parser(suffix);
    case 'color_correction':
      return color_correction_parser(suffix);
    default:
      console.log(`Error: ${type} is not implemented inside parseVideoEssence!`);
      return { essenceIndex: -1, essenceType: 'N/A' };
  }
}

function re_play_parser(suffix: string): ESSENCE_ENTRY {
  const regex = /(players|delays)\[(\d+)\]/;
  const match = suffix.match(regex);
  if (match == null) return { essenceIndex: -1, essenceType: 'N/A' };
  if (match[1] === 'players' && match[2])
    return { essenceIndex: parseInt(match[2]), essenceType: 'player' };
  if (match[1] === 'delays' && match[2])
    return { essenceIndex: parseInt(match[2]), essenceType: 'delay' };
  return { essenceIndex: -1, essenceType: 'N/A' };
}

function r_t_p_receiver_parser(suffix: string): ESSENCE_ENTRY {
  const regex = /video_receivers\[(\d+)\]/;
  const match = suffix.match(regex);
  if (match && match[1]) return { essenceIndex: parseInt(match[1]), essenceType: 'r_t_p_receiver' };
  return { essenceIndex: -1, essenceType: 'N/A' };
}
function i_o_module_parser(suffix: string): ESSENCE_ENTRY {
  const regex = /input\[(\d+)\]/;
  const match = suffix.match(regex);
  if (match && match[1]) return { essenceIndex: parseInt(match[1]), essenceType: 'sdi' };
  return { essenceIndex: -1, essenceType: 'N/A' };
}
function video_mixer_parser(suffix: string): ESSENCE_ENTRY {
  const regex = /instances\[(\d+)\]/;
  const match = suffix.match(regex);
  if (match && match[1]) return { essenceIndex: parseInt(match[1]), essenceType: 'video_mixer' };
  return { essenceIndex: -1, essenceType: 'N/A' };
}
function color_correction_parser(suffix: string): ESSENCE_ENTRY {
  const regex = /(cc3d|cc1d)\[(\d+)\]\.output/;
  const match = suffix.match(regex);
  if (match == null) return { essenceIndex: -1, essenceType: 'N/A' };

  if (match[1] === 'cc3d' && match[2])
    return { essenceIndex: parseInt(match[2]), essenceType: 'cc3d' };
  if (match[1] === 'cc1d' && match[2])
    return { essenceIndex: parseInt(match[2]), essenceType: 'cc1d' };
  return { essenceIndex: -1, essenceType: 'N/A' };
}
