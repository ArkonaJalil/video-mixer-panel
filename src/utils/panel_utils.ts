import { Socket } from 'net';
import { setHwcColor, setHwcStatus, setHwcDisplayLabel1Label2 } from './hwc_utils.js';
import { BUTTON_STATUS } from './types.js';
import { SK_MODEL } from './key_collection/key_collection.js';

// export async function createClient(connectionInfo: { host: string; port: number }) {
//   const { host, port } = connectionInfo;
//   const client = new Socket({});
//   client.connect({ port, host }, async () => {
//     console.log({ action: 'connecting to server', port, host });
//     client.write(`ping\n`);
//     client.write('clear\n');
//     // client.write(`SendPanelInfo\n`);
//     // client.write(`list`);
//   });
//   return client;
// }

//SECTION build the layout

export function setButton(
  c: Socket,
  panel_model: SK_MODEL,
  opts: {
    keyCode: string;
    color: string;
    text1: string;
    text2: string;
    buttonStatus: BUTTON_STATUS;
  },
  initText: boolean,
) {
  const { keyCode, color, text1, text2, buttonStatus } = opts;
  if (initText) {
    // if(text2 ==="") setHwcDisplayInitText(c,keyCode,{text:text1});
    setHwcDisplayLabel1Label2(c, panel_model, keyCode, { label1: text1, label2: text2 });
  }
  // setHwcDisplayTitleLabel(c,code, {title:alias,isLabel:true,label:"döner"})
  setHwcColor(c, panel_model, keyCode, color);
  setHwcStatus(c, panel_model, keyCode, buttonStatus);
}

export function ip_slicer(ip_address: string) {
  let result = {
    first_part: 'invalid',
    second_part: 'ip',
  };
  const ip_regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip_address.match(ip_regex);

  if (match == null) return result;
  const firstNumber = match[1];
  const secondNumber = match[2];
  const thirdNumber = match[3];
  const fourthNumber = match[4];
  result.first_part = `${firstNumber}.${secondNumber}`;
  result.second_part = `${thirdNumber}.${fourthNumber}`;
  return result;
}
