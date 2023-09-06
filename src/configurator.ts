import * as fs from 'fs';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import Ajv, { DefinedError } from 'ajv';
import { Configuration } from './utils/types';

const path = process.argv[2];
const configpath = path ? path : `${__dirname}/../configurations/config.json`;
const data = JSON.parse(fs.readFileSync(configpath, 'utf-8')) as Configuration;
const schema = JSON.parse(fs.readFileSync(`./configurations/types/schema.json`, 'utf-8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);

export function getConfig() {
  if (validate(data)) {
    return data as Configuration;
  } else {
    // The type cast is needed to allow user-defined keywords and errors
    // You can extend this type to include your error types as needed.
    for (const err of validate.errors as DefinedError[]) {
      let path = err.schemaPath.split('/').join(' > ');
      console.log(`Your configuration in ${path} ${err.message}`.toLocaleUpperCase());
      console.error(err);

      // switch (err.keyword) {
      //   case "minimum":
      //     // err type is narrowed here to have "minimum" error params properties
      //     console.log(err.params.limit)
      //     break
      //   // ...
      // }
    }
    process.exit();
  }
}
export const CONFIGURATION = getConfig() as Configuration;
