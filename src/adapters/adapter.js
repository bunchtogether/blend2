// @flow

export interface AdapterType {
  initialize(): *,
  pair(data: Object): Promise<*>,
  setPower(power: boolean): Promise<boolean>,
  setVolume(volume: number): Promise<number>,
  setSource(source: string): Promise<string>,
  setMute(mute: boolean): Promise<boolean>,
  toggleCC(): Promise<void>,
  getDevice(): Promise<*>,
  close(): Promise<*>,
}

(x: AbstractAdapter) => (x: AdapterType); // eslint-disable-line no-unused-expressions
class AbstractAdapter {
  static async discover(): Promise<*> {
    throw new Error('Static method discover is not implemented.');
  }

  initialize(): * { // eslint-disable-line no-unused-vars
    throw new Error('Method initialize is not implemented.');
  }

  pair(data: Object): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method pair is not implemented.');
  }

  setPower(power: boolean): Promise<boolean> { // eslint-disable-line no-unused-vars
    throw new Error('Method setPower is not implemented.');
  }

  setVolume(volume: number): Promise<number> { // eslint-disable-line no-unused-vars
    throw new Error('Method setVolume is not implemented.');
  }

  setSource(source: string): Promise<string> { // eslint-disable-line no-unused-vars
    throw new Error('Method setSource is not implemented.');
  }

  setMute(mute: boolean): Promise<boolean> { // eslint-disable-line no-unused-vars
    throw new Error('Method setMute is not implemented.');
  }

  toggleCC(): Promise<void> { // eslint-disable-line no-unused-vars
    throw new Error('Method toggleCC is not implemented.');
  }

  getDevice(): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method pair is not implemented.');
  }

  close(): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method close is not implemented.');
  }
}

module.exports = AbstractAdapter;
