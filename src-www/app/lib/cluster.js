// @flow

import NodeRSA from 'node-rsa';
import stringify from './json-stringify-deterministic';

let idCounter = 0;

export const generateId = ():string => {
  const normalizedDateString = Date.now().toString(36).padStart(9, '0');
  const idCounterString = idCounter.toString(36).padStart(2, '0');
  const randomString = Math.round(Number.MAX_SAFE_INTEGER / 2 + Number.MAX_SAFE_INTEGER * Math.random() / 2).toString(36);
  const id = (`${normalizedDateString}${idCounterString}${randomString}`).slice(0, 16);
  idCounter += 1;
  if (idCounter > 1295) {
    idCounter = 0;
  }
  return id;
};

export const generatePrivateKey = (size:number = 2048) => new NodeRSA({ b: size }).exportKey('pkcs1-private-pem');

export const generatePublicKey = (privateKey: Object) => privateKey.exportKey('pkcs1-public-pem');

export const parsePrivateKey = (s:string) => new NodeRSA(s, 'pkcs1-private-pem');

export const sign = (privateKey:NodeRSA, ...args:Array<any>) => privateKey.sign(stringify(args), 'base64', 'utf8');
