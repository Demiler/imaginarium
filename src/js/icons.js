import { svg } from 'lit-html'
import SVGperson from '../../assets/icons/person-fill.svg'
import SVGmute from '../../assets/icons/volume-mute-fill.svg'
import SVGvolumehigh from '../../assets/icons/volume-up-fill.svg'
import SVGvolumelow from '../../assets/icons/volume-down-fill.svg'
import SVGvolumeoff from '../../assets/icons/volume-off-fill.svg'
import SVGdoor from '../../assets/icons/door-open-fill.svg'
import SVGgear from '../../assets/icons/gear-fill.svg'
import SVGchvronright from '../../assets/icons/chevron-right.svg'

export const person = svg([SVGperson]);
export const mute = svg([SVGmute]);
export const volumeHigh = svg([SVGvolumehigh]);
export const volume = volumeHigh;
export const volumeLow = svg([SVGvolumelow]);
export const volumeOff = svg([SVGvolumeoff]);
export const door = svg([SVGdoor]);
export const gear = svg([SVGgear]);
export const chvronRight = svg([SVGchvronright]);

