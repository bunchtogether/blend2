declare class dgram$Socket extends events$EventEmitter {
  addMembership(multicastAddress: string, multicastInterface?: string): void;
  address(): net$Socket$address;
  bind(port?: number, address?: string, callback?: () => void): void;
  bind(options: { 
    port?:number,
    address?:string,
    exclusive?:boolean,
    fd?: number
  }, callback?: () => void): void;
  close(): void;
  dropMembership(multicastAddress: string, multicastInterface?: string): void;
  ref(): void;
  send(
    msg: Buffer,
    port: number,
    address: string,
    callback?: (err: ?Error, bytes: any) => mixed,
  ): void;
  send(
    msg: Buffer,
    offset: number,
    length: number,
    port: number,
    address: string,
    callback?: (err: ?Error, bytes: any) => mixed,
  ): void;
  setBroadcast(flag: boolean): void;
  setMulticastLoopback(flag: boolean): void;
  setMulticastTTL(ttl: number): void;
  setTTL(ttl: number): void;
  unref(): void;
};

declare module "dgram" {
  declare function createSocket(
    options: string | { type: string },
    callback?: () => void
  ): dgram$Socket;
}