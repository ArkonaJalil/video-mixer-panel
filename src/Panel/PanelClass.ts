import { VM } from 'vapi';
import { Socket } from 'net';
import { Duration, enforce_nonnull, pause } from 'vscript';
import { ENCODER_TYPE, KEY_ALIAS, ME_LEVEL, PANEL_LAYOUT } from '../utils/types.js';
import { SK_MODEL, get_key_collection } from '../utils/key_collection/key_collection.js';
import { XbarClass } from './XbarClass.js';
import { KeyerClass } from './KeyerClass.js';
import { CutClass } from './CutClass.js';
import { AutoClass } from './AutoClass.js';
import { SliderClass } from './SliderClass.js';
import { EncoderClass } from './EncoderClass.js';
import { ShiftClass } from './ShiftClass.js';
import { MixerClass } from './MixerClass.js';
import { PanelElementClass, button_handler } from './PanelElementClass.js';
import { hardResetPanel, resetPanel, set_no_connection_mode } from '../utils/hwc_utils.js';
import { DisplayStatusClass } from './DisplayStatusClass.js';
import { ip_slicer } from '../utils/panel_utils.js';
import { VM_CHECK_ALIVE_INTERVAL } from '../utils/global.js';
import { RouteOutClass } from './RouteOutClass.js';
import { RouteInClass } from './RouteInClass.js';

type panel_element =
  | MixerClass
  | KeyerClass
  | DisplayStatusClass
  | CutClass
  | AutoClass
  | SliderClass
  | ShiftClass
  | EncoderClass;
type xbar_panel_element = PanelElementClass;

export class PanelClass {
  // private debug_num: number = 0;
  private init_panel_status: boolean = true;
  private socket: Socket;
  private panel_port: number;
  private panel_ip: string;
  private panel_model: SK_MODEL;
  private vm: VM.Any;

  public machine_uncheck_flag = false;
  private machine_connection_status: boolean = false;
  public socket_destroy_status: boolean = false;

  private key_initialising_status: boolean = false;
  public key_collection: KEY_ALIAS[] = [];
  public panel_element_collection: {
    panel_elements: panel_element[];
    xbar_panel_elements: xbar_panel_element[];
  } = { panel_elements: [], xbar_panel_elements: [] };
  public layout_collection: ME_LEVEL[] = [];
  public active_layout_index: number = 0;
  public active_mixer_index: number = 0;
  public active_mixer_class: MixerClass | null = null;
  private active_route_out_element: RouteOutClass | null = null;

  //KEYS WITH JSON
  private xbarElementCollection: XbarClass[] = [];
  private keyerElementCollection: KeyerClass[] = [];
  private mixerElementCollection: MixerClass[] = [];

  private routeOutElementCollection: RouteOutClass[] = [];
  private routeInElementCollection: RouteInClass[] = [];

  //KEYS NO JSON
  // private statusElement: DisplayStatusClass;
  private vmStatusElement: DisplayStatusClass;
  private meStatusElement: DisplayStatusClass;
  private cutElement: CutClass;
  private autoElement: AutoClass;
  private sliderElement: SliderClass;
  private shiftElement: ShiftClass;
  private encoderElementCollection: EncoderClass[] = [];

  constructor(
    panel_ip: string,
    panel_port: number,
    vm: VM.Any,
    panel_layout: PANEL_LAYOUT,
    panel_model: SK_MODEL,
  ) {
    // constructor(client: Socket, vm: VM.Any, panel_layout: PANEL_LAYOUT, panel_model: SK_MODEL) {
    this.panel_ip = panel_ip;
    this.panel_port = panel_port;
    //here connect to client
    this.socket = this.getSocketClient();

    this.key_collection = get_key_collection(panel_model);
    this.panel_model = panel_model;
    this.vm = vm;
    this.layout_collection = panel_layout.meLevel;
    // this.active_layout_index = panel_layout.activeIndex;

    //default init of some buttons
    this.cutElement = new CutClass(
      this.socket,
      parseInt(enforce_nonnull(this.key_collection.find((el) => el.group === 'cut')).code),
      this.panel_model,
    );
    this.autoElement = new AutoClass(
      this.socket,
      parseInt(enforce_nonnull(this.key_collection.find((el) => el.group === 'auto')).code),
      this.panel_model,
    );
    this.sliderElement = new SliderClass(
      this.socket,
      parseInt(enforce_nonnull(this.key_collection.find((el) => el.group === 'slider')).code),
      parseInt(
        enforce_nonnull(this.key_collection.find((el) => el.group === 'slider_display')).code,
      ),
      this.panel_model,
    );
    this.shiftElement = new ShiftClass(
      this.socket,
      parseInt(enforce_nonnull(this.key_collection.find((el) => el.group === 'shift')).code),
      this.panel_model,
    );

    this.vmStatusElement = new DisplayStatusClass(
      this.socket,
      parseInt(enforce_nonnull(this.key_collection.find((el) => el.group === 'vm_display')).code),
      this.panel_model,
      'vm_display',
      'Disconnected',
      `N/A`,
    );

    this.meStatusElement = new DisplayStatusClass(
      this.socket,
      parseInt(enforce_nonnull(this.key_collection.find((el) => el.group === 'me_display')).code),
      this.panel_model,
      'me_display',
      `ME ${this.active_layout_index}`,
    );
  }

  setSocket(client: Socket) {
    this.socket = client;
  }

  getSocketClient(): Socket {
    const client = new Socket();

    client.connect(this.panel_port, this.panel_ip, () => {
      console.log('Connected to panel');
      client.write(`ping\n`);
      client.write(`SleepTimer=0\n`);
      client.write('clear\n');
    });

    client.on('close', async () => {
      // console.log('Connection closed, attempting to reconnect...');
      //reconnection happens outside
    });

    client.on('error', (err) => {
      console.error('Socket error:', err);
    });
    return client;
  }

  async init_keys() {
    this.key_initialising_status = true;
    resetPanel(this.socket, this.panel_model);
    //reset all collections & remove subscriptions
    for (let el of this.mixerElementCollection) {
      el.unsubscribe_mixer_srcs();
    }
    this.xbarElementCollection = [];
    this.mixerElementCollection = [];
    // this.keyerElementCollection = [];

    let panel_pause = new Duration(this.panel_model === 'SK_AIRFLYPROV3' ? 0 : 0.1, 's');
    resetPanel(this.socket, this.panel_model);
    await pause(new Duration(this.panel_model === 'SK_AIRFLYPROV3' ? 0 : 1, 's'));
    //set by json file
    await this.set_xbar_elements(panel_pause);
    await this.set_mixer_elements(panel_pause);
    await this.set_route_in_elements(panel_pause);
    await this.set_route_out_elements(panel_pause);
    await this.set_encoder_elements(panel_pause);
    // this.set_keyer_elements();
    // already set in key collection
    await this.set_cut_element(panel_pause);
    await this.set_auto_element(panel_pause);
    await this.set_slider_element(panel_pause);
    await this.set_shift_element(panel_pause);
    await this.set_display_status_element(panel_pause);
    //set first mixer active
    let findDefaultMixer = this.mixerElementCollection[this.active_mixer_index];
    await findDefaultMixer?.button_down_handler(
      this.mixerElementCollection,
      this.xbarElementCollection,
      this.keyerElementCollection,
      this.encoderElementCollection,
    );
    if (findDefaultMixer != null) this.active_mixer_class = findDefaultMixer;

    this.key_initialising_status = false;
    this.collect_all_panel_elements();

    //resetting also activer
    if (this.active_route_out_element != null) {
      await this.active_route_out_element.route_out_handler(
        this.routeOutElementCollection,
        this.routeInElementCollection,
      );
    }
  }

  async set_route_in_elements(pause_time: Duration) {
    const current_layout = this.layout_collection[this.active_layout_index];
    if (current_layout == null) return;
    const { routeInElements } = current_layout;
    const vm = enforce_nonnull(this.vm);
    for (let el of routeInElements) {
      this.routeInElementCollection.push(new RouteInClass(this.socket, vm, el, this.panel_model));
      await pause(pause_time);
    }
  }

  async set_route_out_elements(pause_time: Duration) {
    const current_layout = this.layout_collection[this.active_layout_index];
    if (current_layout == null) return;
    const { routeOutElements } = current_layout;
    const vm = enforce_nonnull(this.vm);
    for (let el of routeOutElements) {
      this.routeOutElementCollection.push(new RouteOutClass(this.socket, vm, el, this.panel_model));
      await pause(pause_time);
    }
  }

  async set_xbar_elements(pause_time: Duration) {
    const current_layout = this.layout_collection[this.active_layout_index];
    if (current_layout == null) return;
    const { xbarElements } = current_layout;
    const vm = enforce_nonnull(this.vm);
    for (let el of xbarElements) {
      this.xbarElementCollection.push(new XbarClass(this.socket, vm, el, this.panel_model));
      await pause(pause_time);
    }
  }
  async set_keyer_elements(pause_time: Duration) {
    const current_layout = this.layout_collection[this.active_layout_index];
    if (current_layout == null) return;
    const { keyerElements } = current_layout;
    const vm = enforce_nonnull(this.vm);
    for (let el of keyerElements) {
      this.keyerElementCollection.push(new KeyerClass(this.socket, vm, el, this.panel_model));
      await pause(pause_time);
    }
  }
  async set_mixer_elements(pause_time: Duration) {
    const current_layout = this.layout_collection[this.active_layout_index];
    if (current_layout == null) return;
    const { mixerElements } = current_layout;
    const vm = enforce_nonnull(this.vm);
    for (let el of mixerElements) {
      this.mixerElementCollection.push(new MixerClass(this.socket, vm, el, this.panel_model));
      await pause(pause_time);
    }
  }

  async set_encoder_elements(pause_time: Duration) {
    //NOTE Quick hack for different encoders CLIP GAIN
    let encoders = this.key_collection.filter(
      (el) => el.group === 'encoder' && (el.alias === 'CLIP' || el.alias === 'GAIN'),
    );

    for (let el of encoders) {
      let encoder_type = el.alias as ENCODER_TYPE;
      this.encoderElementCollection.push(
        new EncoderClass(this.socket, parseInt(el.code), encoder_type, this.panel_model),
      );
      await pause(pause_time);
    }
  }

  async set_cut_element(pause_time: Duration) {
    let { code } = enforce_nonnull(this.key_collection.find((el) => el.group === 'cut'));
    this.cutElement = new CutClass(this.socket, parseInt(code), this.panel_model);
    await pause(pause_time);
  }

  async set_auto_element(pause_time: Duration) {
    let { code } = enforce_nonnull(this.key_collection.find((el) => el.group === 'auto'));
    this.autoElement = new AutoClass(this.socket, parseInt(code), this.panel_model);
    await pause(pause_time);
  }

  async set_slider_element(pause_time: Duration) {
    let slider = enforce_nonnull(this.key_collection.find((el) => el.group === 'slider'));
    let display = enforce_nonnull(this.key_collection.find((el) => el.group === 'slider_display'));
    this.sliderElement = new SliderClass(
      this.socket,
      parseInt(slider.code),
      parseInt(display.code),
      this.panel_model,
    );
    await pause(pause_time);
  }

  async set_shift_element(pause_time: Duration) {
    let { code } = enforce_nonnull(this.key_collection.find((el) => el.group === 'shift'));
    this.shiftElement = new ShiftClass(this.socket, parseInt(code), this.panel_model);
    await pause(pause_time);
  }

  async set_display_status_element(pause_time: Duration) {
    //vm_status
    const { code: vm_button_code } = enforce_nonnull(
      this.key_collection.find((el) => el.group === 'vm_display'),
    );

    this.vmStatusElement = new DisplayStatusClass(
      this.socket,
      parseInt(vm_button_code),
      this.panel_model,
      'vm_display',
      `${this.vm.raw.is_ready() ? 'Connected' : 'Disconnected'}`,
      `${this.vm.raw.ip}`,
    );
    this.vmStatusElement.button_off();

    //me_status
    let { code: me_button_code } = enforce_nonnull(
      this.key_collection.find((el) => el.group === 'me_display'),
    );
    this.meStatusElement = new DisplayStatusClass(
      this.socket,
      parseInt(me_button_code),
      this.panel_model,
      'me_display',
      `ME ${this.active_layout_index}`,
    );
    this.meStatusElement.button_off();
    await pause(pause_time);
  }

  collect_all_panel_elements() {
    const panel_elements = [
      this.vmStatusElement,
      this.meStatusElement,
      this.cutElement,
      this.autoElement,
      this.sliderElement,
      this.shiftElement,
      ...this.encoderElementCollection,
      ...this.keyerElementCollection,
      ...this.mixerElementCollection,
      ...this.routeInElementCollection,
      ...this.routeOutElementCollection,
      // ...this.xbarElementCollection,
    ];

    const xbar_panel_elements: PanelElementClass[] = [];
    for (let el of this.xbarElementCollection) {
      xbar_panel_elements.push(el.presetElement);
      xbar_panel_elements.push(el.programElement);
      xbar_panel_elements.push(el.displayElement);
    }

    this.panel_element_collection.panel_elements = panel_elements;
    this.panel_element_collection.xbar_panel_elements = xbar_panel_elements;
    // return { panel_elements: panel_elements, xbar_panel_elements: xbar_panel_elements };
  }

  search_panel_element_collection(
    number: number,
    collection:
      | (
          | XbarClass
          | KeyerClass
          | MixerClass
          | CutClass
          | AutoClass
          | SliderClass
          | ShiftClass
          | EncoderClass
        )[]
      | PanelElementClass[],
  ) {
    let coll = collection as PanelElementClass[];

    let foundEntry = coll.find((el) => el.button_key_code === number);
    if (foundEntry) return foundEntry;
    return null;
  }

  async switch_handler_down(entry: PanelElementClass) {
    const { button_key_code, key_group } = entry;
    switch (key_group) {
      case 'auto':
        entry.button_on();
        if (this.active_mixer_class == null) return;
        this.autoElement.auto_handler(this.active_mixer_class);
        this.active_mixer_class.slider_check = false;
        break;
      case 'cut':
        entry.button_on();
        if (this.active_mixer_class == null) return;
        this.cutElement.cut_handler(this.active_mixer_class);
        this.active_mixer_class.slider_check = false;
        break;
      case 'shift':
        entry.button_on();
        // update status display
        this.active_layout_index = this.shiftElement.update_me_level(
          this.active_layout_index,
          this.layout_collection.length,
        );
        this.meStatusElement.set_display_text(`ME ${this.active_layout_index}`, true);
        await this.init_keys();

        if (this.active_mixer_class == null) return;
        // await this.active_mixer_class.trigger_srcs();
        break;
      case 'mixer':
        let mixer_element = this.mixerElementCollection.find(
          (el) => el.button_key_code === button_key_code,
        );
        if (mixer_element == null) return;
        this.active_mixer_class = mixer_element;
        mixer_element.button_down_handler(
          this.mixerElementCollection.filter((el) => el.button_key_code !== button_key_code),
          this.xbarElementCollection,
          this.keyerElementCollection,
          this.encoderElementCollection,
        );
        mixer_element.slider_check = false;
        this.active_mixer_index = this.active_mixer_class.mixerIndex;

        // console.log('active mixer index ', this.active_layout_index);
        break;
      case 'keyer':
        // let keyer_element = this.keyerElementCollection.find(
        //   (el) => el.button_key_code === button_key_code,
        // );
        // if (keyer_element == null || this.active_mixer_class == null) return;
        // keyer_element.keyer_handler(this.active_mixer_class, this.keyerElementCollection);
        // break;
        break;
      case 'preset':
        let preset_element = this.xbarElementCollection.find(
          (el) => el.presetElement.button_key_code === button_key_code,
        );
        if (this.active_mixer_class == null || preset_element == null) return;
        preset_element.preset_handler(this.active_mixer_class, this.xbarElementCollection);
        break;
      case 'program':
        let program_element = this.xbarElementCollection.find(
          (el) => el.programElement.button_key_code === button_key_code,
        );
        if (this.active_mixer_class == null || program_element == null) return;
        program_element.program_handler(this.active_mixer_class, this.xbarElementCollection);
        break;
      case 'encoder':
        console.log(button_key_code, key_group);
        break;
      case 'vm_display':
        this.init_keys();
        break;
      case 'route_in':
        entry.button_on();
        let route_in_element = this.routeInElementCollection.find(
          (el) => el.button_key_code === button_key_code,
        );
        if (route_in_element == null || this.active_route_out_element == null) return;
        route_in_element.route_in_handler(this.active_route_out_element);
        break;
      case 'route_out':
        entry.button_on();
        let route_out_element = this.routeOutElementCollection.find(
          (el) => el.button_key_code === button_key_code,
        );
        if (route_out_element == null) return;
        this.active_route_out_element = route_out_element;
        route_out_element.route_out_handler(
          this.routeOutElementCollection,
          this.routeInElementCollection,
        );
        break;
      default:
        console.log('[switch_handler_down] key_code %d  key_group %s', button_key_code, key_group);
    }
  }

  switch_handler_up(entry: PanelElementClass) {
    const { key_group, button_key_code } = entry;

    switch (key_group) {
      case 'auto':
        break;
      case 'cut':
        entry.button_dimm();
        break;
      case 'shift':
        entry.button_dimm();
        break;
      case 'keyer':
      case 'preset':
      case 'program':
      case 'mixer':
      case 'vm_display':
      case 'encoder':
      case 'route_in':
      case 'route_out':
        break;
      default:
        console.log('[switch_handler_up] key_code %d  key_group %s', button_key_code, key_group);
    }
  }

  switch_handler_number(entry: PanelElementClass, status: string) {
    const { button_key_code, key_group } = entry;
    switch (key_group) {
      case 'encoder':
        let encoder_element = this.encoderElementCollection.find(
          (el) => el.button_key_code === button_key_code,
        );
        if (encoder_element == null || this.active_mixer_class == null) return;
        encoder_element.encoder_handler(status, this.active_mixer_class);
        break;
      case 'slider':
        if (this.active_mixer_class == null) return;
        this.sliderElement.slider_handler(status, this.active_mixer_class);
        break;
      default:
        console.log(
          '[switch_handler_number] key_code %d  key_group %s',
          button_key_code,
          key_group,
        );
    }
  }

  async check_machine_connection() {
    let ip = this.vm.raw.ip;
    for (let i = 0; ; i++) {
      let rdy = this.vm.raw.is_ready();
      if (rdy && !this.machine_connection_status) {
        hardResetPanel(this.socket);
        await this.init_keys();
      }

      if (!rdy && this.machine_connection_status) {
        set_no_connection_mode(this.socket);
        if (this.panel_model === 'SK_AIRFLYPROV3') {
          this.vmStatusElement.set_display_title_label('Reconnecting', ip, true);
        }
        if (this.panel_model === 'SK_MASTERKEYONE') {
          const { first_part, second_part } = ip_slicer(this.vm.raw.ip);
          this.vmStatusElement.set_display_title_label1_label2(
            'Reconnecting',
            first_part,
            second_part,
            false,
            true,
          );
        }
      }

      this.machine_connection_status = rdy;
      // console.log('vm %s  alive %s %d', ip, rdy, i);

      if (this.socket_destroy_status) break;
      if (this.machine_uncheck_flag) break;
      await pause(VM_CHECK_ALIVE_INTERVAL);
      if (this.socket_destroy_status) break;
      if (this.machine_uncheck_flag) break;
    }
    //directly set back to false
    this.machine_uncheck_flag = false;
  }

  async handling_data() {
    this.check_machine_connection();

    const boot_time = new Duration(this.panel_model === 'SK_AIRFLYPROV3' ? 0 : 2, 's');
    await this.init_keys();
    this.collect_all_panel_elements();
    const four_way_button_regex = /HWC#(\d+)..=(.+)/;
    const encoder_button_regex = /HWC#(\d+)\.\d+=(.+)/;
    const button_regex = /HWC#(\d+)\.?=(.+)/;
    const connection_regex = /(\d+\.\d+\.\d+\.\d+)/g;
    const socket = enforce_nonnull(this.socket);

    console.log('=== handling data ===');
    let startup = true;

    this.socket.write('Connections?\n');

    socket.on('data', async (data: Buffer) => {
      let obj = data.toString('utf8');
      if (this.key_initialising_status) {
        // console.log('abort keypress: initialising keys');
        return;
      }
      if (startup) {
        console.log('starting panel ...');
        // socket.write('Connections?\n');
        startup = false;
        await pause(boot_time);
        console.log('panel is up and ready');
        this.init_panel_status = false;
      }
      let connection_match = obj.match(connection_regex);
      if (connection_match != null) {
        if (connection_match.length > 1) {
          let connection_string = 'Panel is already connected [\n';
          for (let el of connection_match) {
            connection_string += `   host: ${el} \n`;
          }
          connection_string += ` ]\n`;
          if (!this.init_panel_status) return;
          console.log(connection_string);
          // console.log(connection_match);
          this.socket_destroy_status = true;
          socket.destroy();
          this.vm.close();
        }
        return;
      }
      this.machine_connection_status = this.vm.raw.is_ready();
      if (!this.machine_connection_status) {
        return;
      }

      const button_match = obj.match(button_regex);
      const four_way_button_match = obj.match(four_way_button_regex);
      const encoder_button_match = obj.match(encoder_button_regex);
      if (four_way_button_match != null) {
        const number = enforce_nonnull(four_way_button_match[1]);
        const status = enforce_nonnull(four_way_button_match[2]);

        let entry = this.search_panel_element_collection(
          parseInt(number),
          this.panel_element_collection.panel_elements,
        );
        if (entry == null)
          entry = this.search_panel_element_collection(
            parseInt(number),
            this.panel_element_collection.xbar_panel_elements,
          );
        //if nothing is found
        if (entry == null) return;
        if (status === 'Up') this.switch_handler_up(entry);
        if (status === 'Down') this.switch_handler_down(entry);

        if (entry.key_group === 'slider' || entry.key_group === 'encoder')
          this.switch_handler_number(entry, status);

        return;
      }

      if (encoder_button_match != null) {
        const number = enforce_nonnull(encoder_button_match[1]);
        const status = enforce_nonnull(encoder_button_match[2]);

        let entry = this.search_panel_element_collection(
          parseInt(number),
          this.panel_element_collection.panel_elements,
        );
        if (entry == null)
          entry = this.search_panel_element_collection(
            parseInt(number),
            this.panel_element_collection.xbar_panel_elements,
          );

        //if nothing is found
        if (entry == null) return;
        if (status === 'Up') this.switch_handler_up(entry);
        if (status === 'Down') this.switch_handler_down(entry);
        if (entry.key_group === 'slider' || entry.key_group === 'encoder')
          this.switch_handler_number(entry, status);

        return;
      }

      if (button_match != null) {
        const number = enforce_nonnull(button_match[1]);
        const status = enforce_nonnull(button_match[2]);
        let entry = this.search_panel_element_collection(
          parseInt(number),
          this.panel_element_collection.panel_elements,
        );

        if (entry == null)
          entry = this.search_panel_element_collection(
            parseInt(number),
            this.panel_element_collection.xbar_panel_elements,
          );

        //if nothing is found
        if (entry == null) return;
        if (status === 'Up') this.switch_handler_up(entry);
        if (status === 'Down') this.switch_handler_down(entry);

        if (entry.key_group === 'slider' || entry.key_group === 'encoder')
          this.switch_handler_number(entry, status);
        return;
      }
    });
  }
}
