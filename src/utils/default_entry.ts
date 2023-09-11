import { PANEL_LAYOUT } from './types';

export function createDefaultPanelLayout() {
  let newEntry: PANEL_LAYOUT = {
    meLevel: [
      {
        mixerElements: [
          { buttonIndex: 0, index: 0, rootMixerIndex: 0, name: 'BGND 0' },
          { buttonIndex: 1, index: 1, rootMixerIndex: 0, name: 'KEYER 1' },
          { buttonIndex: 2, index: 2, rootMixerIndex: 0, name: 'KEYER 2' },
          { buttonIndex: 3, index: 3, rootMixerIndex: 0, name: 'KEYER 3' },
        ],
        xbarElements: [
          { buttonIndex: 0, essenceIndex: 0, essenceType: 'r_t_p_receiver', name: 'Bike' },
          { buttonIndex: 1, essenceIndex: 1, essenceType: 'r_t_p_receiver', name: 'Drums' },
          { buttonIndex: 2, essenceIndex: 2, essenceType: 'r_t_p_receiver', name: 'Golf' },
          { buttonIndex: 3, essenceIndex: 3, essenceType: 'r_t_p_receiver', name: 'Owl' },
          { buttonIndex: 4, essenceIndex: 4, essenceType: 'r_t_p_receiver', name: 'Plane' },
          { buttonIndex: 5, essenceIndex: 5, essenceType: 'r_t_p_receiver', name: 'Sky Diving' },
          { buttonIndex: 6, essenceIndex: 6, essenceType: 'r_t_p_receiver', name: 'Paragliding' },
          { buttonIndex: 7, essenceIndex: 7, essenceType: 'r_t_p_receiver', name: 'Race' },
          { buttonIndex: 8, essenceIndex: 8, essenceType: 'r_t_p_receiver', name: 'Butterfly' },
          { buttonIndex: 9, essenceIndex: 9, essenceType: 'r_t_p_receiver', name: 'Ski' },
          { buttonIndex: 10, essenceIndex: 10, essenceType: 'r_t_p_receiver', name: 'Rallye' },
          { buttonIndex: 11, essenceIndex: 0, essenceType: 're_play', name: 'Arkona' },
        ],
        keyerElements: [],
        routeInElements: [],
        routeOutElements: [],
      },
      {
        mixerElements: [
          { buttonIndex: 0, index: 4, rootMixerIndex: 4, name: 'BGND 1' },
          { buttonIndex: 1, index: 5, rootMixerIndex: 0, name: 'KEYER 4' },
        ],
        xbarElements: [
          { buttonIndex: 0, essenceIndex: 15, essenceType: 'r_t_p_receiver', name: 'Multiviewer' },
          { buttonIndex: 1, essenceIndex: 11, essenceType: 'r_t_p_receiver', name: 'MF Rear' },
          { buttonIndex: 2, essenceIndex: 12, essenceType: 'r_t_p_receiver', name: 'MF Front' },
          { buttonIndex: 3, essenceIndex: 13, essenceType: 'r_t_p_receiver', name: 'Blade' },
          { buttonIndex: 4, essenceIndex: 14, essenceType: 'r_t_p_receiver', name: 'FPGA' },
          { buttonIndex: 5, essenceIndex: 0, essenceType: 're_play', name: 'Arkona' },
          { buttonIndex: 6, essenceIndex: 0, essenceType: 'video_signal_generator', name: 'Bars' },
          {
            buttonIndex: 7,
            essenceIndex: 1,
            essenceType: 'video_signal_generator',
            name: 'RP 198',
          },
          { buttonIndex: 8, essenceIndex: 0, essenceType: 'r_t_p_receiver', name: 'Bike' },
          { buttonIndex: 9, essenceIndex: 1, essenceType: 'r_t_p_receiver', name: 'Drums' },
          { buttonIndex: 10, essenceIndex: 2, essenceType: 'r_t_p_receiver', name: 'Golf' },
          { buttonIndex: 11, essenceIndex: 3, essenceType: 'r_t_p_receiver', name: 'Owl' },
        ],
        keyerElements: [],
        routeInElements: [],
        routeOutElements: [],
      },
      {
        mixerElements: [
          { buttonIndex: 0, index: 6, rootMixerIndex: 6, name: 'BGND 2' },
          { buttonIndex: 1, index: 7, rootMixerIndex: 6, name: 'KEYER 5' },
        ],
        xbarElements: [
          { buttonIndex: 0, essenceIndex: 0, essenceType: 're_play', name: 'Arkona' },
          { buttonIndex: 1, essenceIndex: 11, essenceType: 'r_t_p_receiver', name: 'MF Rear' },
          { buttonIndex: 2, essenceIndex: 12, essenceType: 'r_t_p_receiver', name: 'MF Front' },
          { buttonIndex: 3, essenceIndex: 13, essenceType: 'r_t_p_receiver', name: 'Blade' },
          { buttonIndex: 4, essenceIndex: 14, essenceType: 'r_t_p_receiver', name: 'FPGA' },
          { buttonIndex: 5, essenceIndex: 15, essenceType: 'r_t_p_receiver', name: 'Multiviewer' },
          { buttonIndex: 6, essenceIndex: 0, essenceType: 'video_signal_generator', name: 'Bars' },
          {
            buttonIndex: 7,
            essenceIndex: 1,
            essenceType: 'video_signal_generator',
            name: 'RP 198',
          },
          { buttonIndex: 8, essenceIndex: 0, essenceType: 'r_t_p_receiver', name: 'Bike' },
          { buttonIndex: 9, essenceIndex: 1, essenceType: 'r_t_p_receiver', name: 'Drums' },
          { buttonIndex: 10, essenceIndex: 2, essenceType: 'r_t_p_receiver', name: 'Golf' },
          { buttonIndex: 11, essenceIndex: 3, essenceType: 'r_t_p_receiver', name: 'Owl' },
        ],
        keyerElements: [],
        routeInElements: [],
        routeOutElements: [],
      },
    ],
  };
  return newEntry;
}
