import { Duration, pause } from 'vscript';
import { connectMachine } from './api_connection.js';
// import { createClient } from './panel_utils.js';
import { CONFIGURATION } from './configurator.js';
import { PanelClass } from './Panel/PanelClass.js';
// import { createClient } from './utils/panel_utils.js';
import { Socket } from 'net';
import { PANEL_CHECK_ALIVE_INTERVAL, PANEL_CHECK_REVIVE_INTERVAL } from './utils/global.js';
// import { Duration, pause } from 'vscript';

const main = async () => {
  //SECTION NEW SHIT
  const { machine_ip, panel_ip, panel_layout, panel_port, panel_model } = CONFIGURATION;

  // const client = await createClient({ host: panel_ip, port: panel_port });

  const avp = await connectMachine(machine_ip);
  if (avp == null) throw new Error(`Error: Can not connect to ${machine_ip}`);

  // let panel = new PanelClass(client, avp, panel_layout, panel_model);

  let panel = new PanelClass(panel_ip, panel_port, avp, panel_layout, panel_model);
  console.log('panel %s %d avp %s', panel_ip, panel_port, machine_ip);

  await panel.handling_data();
  await pause(PANEL_CHECK_ALIVE_INTERVAL);
  for (let i = 0; ; i++) {
    // console.log('iteration %d', i);
    let panel_alive = await createPingRequest(panel_ip, panel_port);
    if (panel.socket_destroy_status) {
      console.log('To start the script first terminate all other connections to the panel!');
      break;
    }
    // console.log({ panel_alive, i });
    if (!panel_alive) {
      console.log('===> go to loop for reviving panel', i);
      //set machien uncheck flags to true
      panel.machine_uncheck_flag = true;
      for (let a = 0; ; a++) {
        let panel_revive = await createPingRequest(panel_ip, panel_port);
        console.log({ panel_revive, a });

        if (panel_revive) {
          console.log('===>reviving panel');
          panel.setSocket(panel.getSocketClient());
          await panel.handling_data();
          break;
        }
        await pause(PANEL_CHECK_REVIVE_INTERVAL);
      }
    }
    await pause(PANEL_CHECK_ALIVE_INTERVAL);
  }
};

async function createPingRequest(panel_ip: string, panel_port: number) {
  let ping_response = false;
  const client = new Socket();

  client.connect(panel_port, panel_ip, () => {
    // console.log(`Connected to ping`);
    client.write('ping\n');
  });

  client.on('data', () => {
    // console.log('Received data from ping:', data.toString('utf8'));
    ping_response = true;
  });

  client.on('error', () => {
    // console.error('Socket error:', err);
  });

  client.on('close', () => {
    // console.log('Ping closed');
  });

  await pause(new Duration(1, 's'));
  client.destroy();
  return ping_response;
}

main();
