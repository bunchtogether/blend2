// @flow

export const downloadFile = (name:string, text:string, mimetype:string) => {
  if (window && window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'undefined') {
    const encodedUri = encodeURI(`data:${mimetype};charset=utf-8,${text}`);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', name);
    const body = document.body;
    if (body) {
      body.appendChild(link);
      link.click();
      body.removeChild(link);
    }
  } else { // IE-specific code
    const charCodeArray = new Array(text.length);
    for (let i = 0; i < text.length; ++i) { // eslint-disable-line no-plusplus
      const charCode = text.charCodeAt(i);
      charCodeArray[i] = charCode;
    }
    const blob = new Blob([new Uint8Array(charCodeArray)], { type: mimetype });
    window.navigator.msSaveOrOpenBlob(blob, name);
  }
};
