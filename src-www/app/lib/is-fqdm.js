// @flow

const regex = /^(?!:\/\/)(?!.{256,})(([a-z0-9][a-z0-9_-]*?\.)+?[a-z]{2,16}?)$/i;

export default (hostname: string) => regex.test(hostname);
