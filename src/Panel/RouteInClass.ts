import { Socket } from 'net';
import { PanelElementClass } from './PanelElementClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import {
  ROUTE_IN_AIRFLYPROV3_OFFSET,
  ROUTE_IN_BUTTON_COLOUR,
  ROUTE_IN_MASTERONE_OFFSET,
} from '../utils/global.js';
import { ESSENCE_TYPES, ROUTE_IN_ELEMENT } from '../utils/types.js';
import { RouteOutClass } from './RouteOutClass.js';
import { AT1101, AT1130, VM } from 'vapi';
import { getVideoEssence } from '../utils/video_essence_utils.js';

//AIR 57 - 62
//MASTER 115 -120
export class RouteInClass extends PanelElementClass {
  public essenceType: ESSENCE_TYPES = 'N/A';
  public essenceIndex: number = -1;
  private vm: VM.Any;
  constructor(socket: Socket, vm: VM.Any, el: ROUTE_IN_ELEMENT, panel_model: SK_MODEL) {
    super(
      socket,
      panel_model === 'SK_AIRFLYPROV3'
        ? el.buttonIndex + ROUTE_IN_AIRFLYPROV3_OFFSET
        : el.buttonIndex + ROUTE_IN_MASTERONE_OFFSET,
      ROUTE_IN_BUTTON_COLOUR,
      el.name,
      'route_in',
      panel_model,
    );
    this.vm = vm;
    this.essenceIndex = el.essenceIndex;
    this.essenceType = el.essenceType;
    this.init_panel_element();
  }
  async route_in_handler(active_out: RouteOutClass) {
    //set here inside this output
    const { output_type } = active_out;

    if (output_type === 'live_view') {
      let casted_output = active_out.get_output() as
        | AT1101.Monitoring.LiveView
        | AT1130.Monitoring.LiveView;

      let video_essence = getVideoEssence(this.vm, this.essenceType, this.essenceIndex);
      await casted_output.v_src.command.write(video_essence);
    }
    if (output_type === 'sdi_output') {
      if (this.vm instanceof AT1101.Root) {
        let casted_output = active_out.get_output() as AT1101.IOModule.Output;
        let video_essence = getVideoEssence(
          this.vm,
          this.essenceType,
          this.essenceIndex,
        ) as AT1101.Video.Essence;
        await casted_output.sdi.v_src.command.write({ source: video_essence, switch_time: null });
      }

      if (this.vm instanceof AT1130.Root) {
        let casted_output = active_out.get_output() as AT1130.IOModule.Output;
        let video_essence = getVideoEssence(
          this.vm,
          this.essenceType,
          this.essenceIndex,
        ) as AT1130.Video.Essence;
        await casted_output.sdi.v_src.command.write({ source: video_essence, switch_time: null });
      }
    }

    if (output_type === 'rtp_tx') {
      if (this.vm instanceof AT1101.Root) {
        let casted_output =
          active_out.get_output() as AT1101.RTPTransmitter.VideoStreamerAsNamedTableRow;
        let video_essence = getVideoEssence(
          this.vm,
          this.essenceType,
          this.essenceIndex,
        ) as AT1101.Video.Essence;
        await casted_output.v_src.command.write({ source: video_essence, switch_time: null });
      }

      if (this.vm instanceof AT1130.Root) {
        let casted_output =
          active_out.get_output() as AT1130.RTPTransmitter.VideoStreamerAsNamedTableRow;
        let video_essence = getVideoEssence(
          this.vm,
          this.essenceType,
          this.essenceIndex,
        ) as AT1130.Video.Essence;
        await casted_output.v_src.command.write({ source: video_essence, switch_time: null });
      }
    }
  }
}
