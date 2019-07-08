// @flow

export interface AdapterType {
  initialize(): Promise<*>,
  pair(data: Object): Promise<*>,
  setPower(power: boolean): Promise<*>,
  setVolume(volume: number): Promise<*>,
  setSource(source: string): Promise<*>,
  getDevice(): Promise<*>,
}

(x: AbstractAdapter) => (x: AdapterType); // eslint-disable-line no-unused-expressions
class AbstractAdapter {
  static async discover(): Promise<*> {
    throw new Error('Static method discover is not implemented.');
  }

  initialize(): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method initialize is not implemented.');
  }

  pair(data: Object): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method pair is not implemented.');
  }

  setPower(power: boolean): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method setPower is not implemented.');
  }

  setVolume(volume: number): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method setVolume is not implemented.');
  }

  setSource(source: string): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method setSource is not implemented.');
  }

  getDevice(): Promise<*> { // eslint-disable-line no-unused-vars
    throw new Error('Method pair is not implemented.');
  }
}

module.exports = AbstractAdapter;
