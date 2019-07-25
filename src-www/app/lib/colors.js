// @flow

import { pink, purple, deepPurple, indigo, blue, lightBlue, cyan, teal, green, lightGreen, lime, amber, orange, deepOrange } from '@material-ui/core/colors';

const colors = [pink[500], purple[500], deepPurple[500], indigo[500], blue[500], lightBlue[500], cyan[500], teal[500], green[500], lightGreen[500], lime[500], amber[500], orange[500], deepOrange[500]];

const colorGenerator = (function* ():Generator<*, *, *> {
  let i = 0;
  while (true) { // eslint-disable-line no-constant-condition
    yield colors[i % colors.length];
    i += 1;
  }
}());

const assignedColors = {};

const getColor = function (group:string, index:number | string):string {
  if (assignedColors[group] && assignedColors[group][index]) {
    return assignedColors[group][index];
  }
  assignedColors[group] = assignedColors[group] || {};
  assignedColors[group][index] = assignedColors[group][index] || {};
  assignedColors[group][index] = colorGenerator.next().value;
  return assignedColors[group][index];
};


// https://stackoverflow.com/questions/1664140/js-function-to-calculate-complementary-colour

/* hexToComplimentary : Converts hex value to HSL, shifts
 * hue by 180 degrees and then converts hex, giving complimentary color
 * as a hex value
 * @param  [String] hex : hex value
 * @return [String] : complimentary color as hex value
 */
export function hexToComplimentary(hexInput:string, shift?:number = 180) {
  const hex = hexInput.replace('#', '');

  const match = hex.match(new RegExp(`(.{${hex.length / 3}})`, 'g'));

  if (!match) {
    return hex;
  }

  // Convert hex to rgb
  // Credit to Denis http://stackoverflow.com/a/36253499/4939630
  let rgb = `rgb(${match.map((l) => parseInt(hex.length % 2 ? l + l : l, 16)).join(',')})`;

  // Get array of RGB values
  rgb = rgb.replace(/[^\d,]/g, '').split(',');

  let r = parseInt(rgb[0], 10);
  let g = parseInt(rgb[1], 10);
  let b = parseInt(rgb[2], 10);

  // Convert RGB to HSL
  // Adapted from answer by 0x000f http://stackoverflow.com/a/34946092/4939630
  r /= 255.0;
  g /= 255.0;
  b /= 255.0;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2.0;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = (l > 0.5 ? d / (2.0 - max - min) : d / (max + min));

    if (max === r && g >= b) {
      h = 1.0472 * (g - b) / d;
    } else if (max === r && g < b) {
      h = 1.0472 * (g - b) / d + 6.2832;
    } else if (max === g) {
      h = 1.0472 * (b - r) / d + 2.0944;
    } else {
      h = 1.0472 * (r - g) / d + 4.1888;
    }
  }

  h = h / 6.2832 * 360.0 + 0;

  // Shift hue to opposite side of wheel and convert to [0-1] value
  h += shift;

  if (h > 360) {
    h -= 360;
  }

  h /= 360;

  // Convert h s and l values into r g and b values
  // Adapted from answer by Mohsen http://stackoverflow.com/a/9493060/4939630
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) {
        t += 1; // eslint-disable-line no-param-reassign
      }
      if (t > 1) {
        t -= 1; // eslint-disable-line no-param-reassign
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  r = Math.round(r * 255);
  g = Math.round(g * 255);
  b = Math.round(b * 255);

  // Convert r b and g values to hex
  rgb = b | (g << 8) | (r << 16);
  return `#${(0x1000000 | rgb).toString(16).substring(1)}`;
}

export default getColor;
