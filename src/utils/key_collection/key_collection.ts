import { SK_AIRFLYPROV3 } from './airflypro.js';
import { SK_MASTERKEYONE } from './masterkeyone.js';

export declare type SK_MODEL = 'SK_AIRFLYPROV3' | 'SK_MASTERKEYONE';

export function get_key_collection(model: SK_MODEL) {
  switch (model) {
    case 'SK_AIRFLYPROV3':
      return SK_AIRFLYPROV3;
    case 'SK_MASTERKEYONE':
      return SK_MASTERKEYONE;
  }
}
