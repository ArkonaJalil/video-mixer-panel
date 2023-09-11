import { Socket } from 'net';
import { PanelElementClass, button_handler } from './PanelElementClass.js';
import { SK_MODEL } from '../utils/key_collection/key_collection.js';
import {
  ROUTE_OUT_AIRFLYPROV3_OFFSET,
  ROUTE_OUT_MASTERONE_OFFSET,
  ROUTE_OUT_BUTTON_COLOUR,
} from '../utils/global.js';
import { RouteInClass } from './RouteInClass.js';
import { ROUTE_OUTPUT_TYPE, ROUTE_OUT_ELEMENT } from '../utils/types.js';
import { Watcher, enforce_nonnull } from 'vscript';
import { VM, AT1101, AT1130 } from 'vapi';
import { parse_video_essence } from '../utils/video_essence_utils.js';

//AIR 38 -42
//99 -103
export class RouteOutClass extends PanelElementClass {
  public output_type: ROUTE_OUTPUT_TYPE = 'sdi_output';
  public output_number: number = -1;
  public watcherCollection: Watcher[] = [];
  public vm: VM.Any;
  constructor(socket: Socket, vm: VM.Any, el: ROUTE_OUT_ELEMENT, panel_model: SK_MODEL) {
    super(
      socket,
      panel_model === 'SK_AIRFLYPROV3'
        ? el.buttonIndex + ROUTE_OUT_AIRFLYPROV3_OFFSET
        : el.buttonIndex + ROUTE_OUT_MASTERONE_OFFSET,
      ROUTE_OUT_BUTTON_COLOUR,
      el.name,
      'route_out',
      panel_model,
    );
    this.vm = vm;
    this.output_number = el.outputIndex;
    this.output_type = el.outputType;
    this.init_panel_element();
  }

  async route_out_handler(
    route_out_collection: RouteOutClass[],
    route_in_collection: RouteInClass[],
  ) {
    for (let el of route_out_collection) {
      button_handler(el, 'Dimmed');
      el.unsubscirbe_route_in_srcs();
    }
    button_handler(this, 'On');
    await this.subscribe_routin_srcs(route_in_collection);

    //trigger
    await this.sub_trigger();
  }

  async sub_trigger() {
    if (this.output_type === 'live_view') {
      await enforce_nonnull(this.vm.monitoring).live_view.v_src.command.read();
    }

    if (this.output_type === 'sdi_output') {
      await enforce_nonnull(this.vm.i_o_module)
        .output.row(this.output_number)
        .sdi.v_src.command.read();
    }

    if (this.output_type === 'rtp_tx') {
      await enforce_nonnull(this.vm.r_t_p_transmitter)
        .video_transmitters.row(this.output_number)
        .v_src.command.read();
    }
  }

  get_output() {
    switch (this.output_type) {
      case 'sdi_output':
        let sdi_out = enforce_nonnull(this.vm.i_o_module).output.row(this.output_number);
        return sdi_out;
      case 'live_view':
        let live_view = enforce_nonnull(this.vm.monitoring).live_view;
        return live_view;
      case 'rtp_tx':
        // let rtp_tx = enforce_nonnull(this.vm.r_t_p_transmitter).sessions.row(this.output_number);
        let rtp_tx = enforce_nonnull(this.vm.r_t_p_transmitter).video_transmitters.row(
          this.output_number,
        );
        return rtp_tx;
      default:
        return null;
    }
  }

  async subscribe_routin_srcs(collection: RouteInClass[]) {
    let output = this.get_output();
    if (output == null) return;
    if (this.output_type === 'sdi_output') {
      let casted_output = output as AT1101.IOModule.Output | AT1130.IOModule.Output;
      const watcher_output_v_src = await casted_output.sdi.v_src.command.watch(async (p) => {
        let parsed_source = parse_video_essence(p.source);
        // seafch inside collection
        let findEntry = collection.find(
          (el) =>
            el.essenceIndex === parsed_source.essenceIndex &&
            el.essenceType === parsed_source.essenceType,
        );
        if (findEntry == null) return;
        for (let el of collection) el.button_dimm();
        findEntry.button_on();
      });

      this.watcherCollection.push(watcher_output_v_src);
    }

    if (this.output_type === 'live_view') {
      let casted_output = output as AT1101.Monitoring.LiveView | AT1130.Monitoring.LiveView;
      const watcher_output_v_src = await casted_output.v_src.command.watch(async (p) => {
        let parsed_source = parse_video_essence(p);

        for (let el of collection) el.button_dimm();
        // seafch inside collection
        let findEntry = collection.find(
          (el) =>
            el.essenceIndex === parsed_source.essenceIndex &&
            el.essenceType === parsed_source.essenceType,
        );
        if (findEntry == null) return;
        findEntry.button_on();
      });

      this.watcherCollection.push(watcher_output_v_src);
    }

    if (this.output_type === 'rtp_tx') {
      //TODO here
      const casted_output = output as
        | AT1101.RTPTransmitter.VideoStreamerAsNamedTableRow
        | AT1130.RTPTransmitter.VideoStreamerAsNamedTableRow;

      const watcher_output_v_src = await casted_output.v_src.command.watch(async (p) => {
        let parsed_source = parse_video_essence(p.source);

        // seafch inside collection
        let findEntry = collection.find(
          (el) =>
            el.essenceIndex === parsed_source.essenceIndex &&
            el.essenceType === parsed_source.essenceType,
        );
        if (findEntry == null) return;
        for (let el of collection) el.button_dimm;
        findEntry.button_on();
      });
      this.watcherCollection.push(watcher_output_v_src);
    }
  }
  unsubscirbe_route_in_srcs() {
    for (let w of this.watcherCollection) {
      w.unwatch();
    }
    this.watcherCollection = [];
  }
}
