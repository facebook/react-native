/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/*
 * This file is necessary to declare global functions that might also be included by `--lib dom`.
 * Due to a TypeScript bug, these cannot be placed inside a `declare global` block in index.d.ts.
 * https://github.com/Microsoft/TypeScript/issues/16430
 */

//
// Timer Functions
//
declare function clearInterval(handle: number): void;
declare function clearTimeout(handle: number): void;
declare function setInterval(handler: () => void, timeout: number): number;
declare function setInterval<Args extends any[]>(
  handler: (...args: Args) => void,
  timeout?: number,
  ...args: Args
): number;
declare function setTimeout(handler: () => void, timeout: number): number;
declare function setTimeout<Args extends any[]>(
  handler: (...args: Args) => void,
  timeout?: number,
  ...args: Args
): number;
declare function clearImmediate(handle: number): void;
declare function setImmediate(handler: () => void): number;
declare function setImmediate<Args extends any[]>(
  handler: (...args: Args) => void,
  ...args: Args
): number;

declare function cancelAnimationFrame(handle: number): void;
declare function requestAnimationFrame(
  callback: (time: number) => void,
): number;

declare function fetchBundle(
  bundleId: number,
  callback: (error?: Error | null) => void,
): void;

//
// Fetch API
//

declare interface GlobalFetch {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

declare function fetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response>;

declare interface WindowOrWorkerGlobalScope {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

interface Blob {
  readonly size: number;
  readonly type: string;
  slice(start?: number, end?: number): Blob;
}

interface BlobOptions {
  type: string;
  lastModified: number;
}

declare var Blob: {
  prototype: Blob;
  new (blobParts?: Array<Blob | string>, options?: BlobOptions): Blob;
};

type FormDataValue =
  | string
  | {name?: string | undefined; type?: string | undefined; uri: string};

type FormDataPart =
  | {
      string: string;
      headers: {[name: string]: string};
    }
  | {
      uri: string;
      headers: {[name: string]: string};
      name?: string | undefined;
      type?: string | undefined;
    };

declare class FormData {
  append(name: string, value: any): void;
  getAll(): Array<FormDataValue>;
  getParts(): Array<FormDataPart>;
}

declare interface Body {
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  json(): Promise<any>;
  text(): Promise<string>;
  formData(): Promise<FormData>;
}

declare interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  forEach(callback: Function, thisArg?: any): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
}

declare var Headers: {
  prototype: Headers;
  new (init?: HeadersInit_): Headers;
};

/**
 * React Native's implementation of fetch allows this syntax for uploading files from
 * local filesystem.
 * See https://github.com/facebook/react-native/blob/master/Libraries/Network/convertRequestBody.js#L22
 */
interface _SourceUri {
  uri: string;
  [key: string]: any;
}

type BodyInit_ =
  | _SourceUri
  | Blob
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | DataView
  | ArrayBuffer
  | FormData
  | string
  | null;

declare interface RequestInit {
  body?: BodyInit_ | undefined;
  credentials?: RequestCredentials_ | undefined;
  headers?: HeadersInit_ | undefined;
  integrity?: string | undefined;
  keepalive?: boolean | undefined;
  method?: string | undefined;
  mode?: RequestMode_ | undefined;
  referrer?: string | undefined;
  window?: any | undefined;
  signal?: AbortSignal | undefined;
}

declare interface Request extends Object, Body {
  readonly credentials: RequestCredentials_;
  readonly headers: Headers;
  readonly method: string;
  readonly mode: RequestMode_;
  readonly referrer: string;
  readonly url: string;
  clone(): Request;
}

declare var Request: {
  prototype: Request;
  new (input: Request | string, init?: RequestInit): Request;
};

declare type RequestInfo = Request | string;

declare interface ResponseInit {
  headers?: HeadersInit_ | undefined;
  status?: number | undefined;
  statusText?: string | undefined;
}

declare interface Response extends Object, Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType_;
  readonly url: string;
  readonly redirected: boolean;
  clone(): Response;
}

declare var Response: {
  prototype: Response;
  new (body?: BodyInit_, init?: ResponseInit): Response;
  error: () => Response;
  redirect: (url: string, status?: number) => Response;
};

type HeadersInit_ = Headers | string[][] | {[key: string]: string};
type RequestCredentials_ = 'omit' | 'same-origin' | 'include';
type RequestMode_ = 'navigate' | 'same-origin' | 'no-cors' | 'cors';
type ResponseType_ =
  | 'basic'
  | 'cors'
  | 'default'
  | 'error'
  | 'opaque'
  | 'opaqueredirect';

//
// XMLHttpRequest
//

declare interface ProgressEvent<T extends EventTarget = EventTarget>
  extends Event {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
  readonly target: T | null;
}

interface XMLHttpRequestEventMap extends XMLHttpRequestEventTargetEventMap {
  readystatechange: Event;
}

interface XMLHttpRequest extends EventTarget, XMLHttpRequestEventTarget {
  //  msCaching: string;
  onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;
  readonly readyState: number;
  readonly response: any;
  readonly responseText: string;
  responseType: XMLHttpRequestResponseType;
  readonly responseURL: string;
  readonly responseXML: Document | null;
  readonly status: number;
  readonly statusText: string;
  timeout: number;
  readonly upload: XMLHttpRequestUpload;
  withCredentials: boolean;
  abort(): void;
  getAllResponseHeaders(): string;
  getResponseHeader(header: string): string | null;
  //  msCachingEnabled(): boolean;
  open(
    method: string,
    url: string,
    async?: boolean,
    user?: string | null,
    password?: string | null,
  ): void;
  overrideMimeType(mime: string): void;
  send(data?: any): void;
  setRequestHeader(header: string, value: string): void;
  readonly DONE: 4;
  readonly HEADERS_RECEIVED: 2;
  readonly LOADING: 3;
  readonly OPENED: 1;
  readonly UNSENT: 0;
  addEventListener<K extends keyof XMLHttpRequestEventMap>(
    type: K,
    listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
  ): void;
  //  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener<K extends keyof XMLHttpRequestEventMap>(
    type: K,
    listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
  ): void;
  //  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

declare var XMLHttpRequest: {
  prototype: XMLHttpRequest;
  new (): XMLHttpRequest;
  readonly DONE: 4;
  readonly HEADERS_RECEIVED: 2;
  readonly LOADING: 3;
  readonly OPENED: 1;
  readonly UNSENT: 0;
};

interface XMLHttpRequestEventTargetEventMap {
  abort: ProgressEvent;
  error: ProgressEvent;
  load: ProgressEvent;
  loadend: ProgressEvent;
  loadstart: ProgressEvent;
  progress: ProgressEvent;
  timeout: ProgressEvent;
}

interface XMLHttpRequestEventTarget {
  onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
    type: K,
    listener: (
      this: XMLHttpRequestEventTarget,
      ev: XMLHttpRequestEventTargetEventMap[K],
    ) => any,
  ): void;
  //  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
    type: K,
    listener: (
      this: XMLHttpRequestEventTarget,
      ev: XMLHttpRequestEventTargetEventMap[K],
    ) => any,
  ): void;
  //  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface XMLHttpRequestUpload extends EventTarget, XMLHttpRequestEventTarget {
  addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
    type: K,
    listener: (
      this: XMLHttpRequestUpload,
      ev: XMLHttpRequestEventTargetEventMap[K],
    ) => any,
  ): void;
  //  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(
    type: K,
    listener: (
      this: XMLHttpRequestUpload,
      ev: XMLHttpRequestEventTargetEventMap[K],
    ) => any,
  ): void;
  //  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

declare var XMLHttpRequestUpload: {
  prototype: XMLHttpRequestUpload;
  new (): XMLHttpRequestUpload;
};

declare type XMLHttpRequestResponseType =
  | ''
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text';

/**
 * Based on definition from lib.dom but using class syntax.
 * The properties are mutable to support users that use a `URL` polyfill, but the implementation
 * built into React Native (as of 0.63) does not implement all the properties.
 */
declare class URL {
  static createObjectURL(blob: Blob): string;
  static revokeObjectURL(url: string): void;

  constructor(url: string, base?: string);

  href: string;
  readonly origin: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  readonly searchParams: URLSearchParams;
  hash: string;

  toJSON(): string;
}

/**
 * Based on definitions of lib.dom and lib.dom.iterable
 */
declare class URLSearchParams {
  constructor(
    init?: string[][] | Record<string, string> | string | URLSearchParams,
  );

  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  forEach(
    callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
    thisArg?: any,
  ): void;
  [Symbol.iterator](): IterableIterator<[string, string]>;

  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
}

interface WebSocketMessageEvent extends Event {
  data?: any | undefined;
}
interface WebSocketErrorEvent extends Event {
  message: string;
}
interface WebSocketCloseEvent extends Event {
  code?: number | undefined;
  reason?: string | undefined;
  message?: string | undefined;
}

type WebsocketMessageEventListener = (
  event: 'message',
  handler: (e: WebSocketMessageEvent) => void,
) => void;
type WebsocketErrorEventListener = (
  event: 'error',
  handler: (e: WebSocketErrorEvent) => void,
) => void;
type WebsocketOpenEventListener = (event: 'open', handler: () => void) => void;
type WebsocketCloseEventListener = (
  event: 'close',
  handler: (e: WebSocketCloseEvent) => void,
) => void;

type WebsocketEventListener = WebsocketMessageEventListener &
  WebsocketErrorEventListener &
  WebsocketOpenEventListener &
  WebsocketCloseEventListener;

interface WebSocket extends EventTarget {
  readonly readyState: number;
  send(data: string | ArrayBuffer | ArrayBufferView | Blob): void;
  close(code?: number, reason?: string): void;
  onopen: (() => void) | null;
  onmessage: ((event: WebSocketMessageEvent) => void) | null;
  onerror: ((event: WebSocketErrorEvent) => void) | null;
  onclose: ((event: WebSocketCloseEvent) => void) | null;
  addEventListener: WebsocketEventListener;
  removeEventListener: WebsocketEventListener;
}

declare var WebSocket: {
  prototype: WebSocket;
  new (
    uri: string,
    protocols?: string | string[] | null,
    options?: {
      headers: {[headerName: string]: string};
      [optionName: string]: any;
    } | null,
  ): WebSocket;
  readonly CLOSED: number;
  readonly CLOSING: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
};

//
// Abort Controller
//

interface AbortEvent extends Event {
  type: 'abort';
}

declare class AbortSignal implements EventTarget {
  /**
   * AbortSignal cannot be constructed directly.
   */
  constructor();
  /**
   * Returns `true` if this `AbortSignal`'s `AbortController` has signaled to abort, and `false` otherwise.
   */
  readonly aborted: boolean;

  onabort: (event: AbortEvent) => void;

  addEventListener: (
    type: 'abort',
    listener: (this: AbortSignal, event: any) => any,
    options?:
      | boolean
      | {
          capture?: boolean | undefined;
          once?: boolean | undefined;
          passive?: boolean | undefined;
        },
  ) => void;

  removeEventListener: (
    type: 'abort',
    listener: (this: AbortSignal, event: any) => any,
    options?:
      | boolean
      | {
          capture?: boolean | undefined;
        },
  ) => void;
}

declare class AbortController {
  /**
   * Initialize this controller.
   */
  constructor();
  /**
   * Returns the `AbortSignal` object associated with this object.
   */
  readonly signal: AbortSignal;
  /**
   * Abort and signal to any observers that the associated activity is to be aborted.
   */
  abort(): void;
}

interface FileReaderEventMap {
  abort: ProgressEvent<FileReader>;
  error: ProgressEvent<FileReader>;
  load: ProgressEvent<FileReader>;
  loadend: ProgressEvent<FileReader>;
  loadstart: ProgressEvent<FileReader>;
  progress: ProgressEvent<FileReader>;
}

interface FileReader extends EventTarget {
  readonly error: Error | null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  onloadstart:
    | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
    | null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  readonly readyState: number;
  readonly result: string | ArrayBuffer;
  abort(): void;
  readAsArrayBuffer(blob: Blob): void;
  // readAsBinaryString(blob: Blob): void;
  readAsDataURL(blob: Blob): void;
  readAsText(blob: Blob, encoding?: string): void;
  readonly DONE: 2;
  readonly EMPTY: 0;
  readonly LOADING: 1;
  addEventListener<K extends keyof FileReaderEventMap>(
    type: K,
    listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
    options?: boolean,
  ): void;
  // addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof FileReaderEventMap>(
    type: K,
    listener: (this: FileReader, ev: FileReaderEventMap[K]) => any,
    options?: boolean,
  ): void;
  // removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var FileReader: {
  prototype: FileReader;
  new (): FileReader;
  readonly DONE: 2;
  readonly EMPTY: 0;
  readonly LOADING: 1;
};
