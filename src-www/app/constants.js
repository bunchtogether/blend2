// @flow

export const TYPE_VIZIO = 'vizio';
export const TYPE_SAMSUNG = 'samsung';
export const TYPE_NEC = 'nec';

export const DISPLAYS = [TYPE_SAMSUNG, TYPE_NEC, TYPE_VIZIO];

export const PORT_NAMES = {
  [TYPE_SAMSUNG]: 'EX-LINK',
  [TYPE_NEC]: 'RS-232',
  [TYPE_VIZIO]: null,
};
export const DISPLAY_NAMES = {
  [TYPE_SAMSUNG]: 'Samsung',
  [TYPE_NEC]: 'NEC',
  [TYPE_VIZIO]: 'Vizio',
};
