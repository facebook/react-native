/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const InspectorAgent = require('./InspectorAgent');
const JSInspector = require('./JSInspector');
const XMLHttpRequest = require('../Network/XMLHttpRequest');

import type EventSender from './InspectorAgent';

type RequestId = string;

type LoaderId = string;
type FrameId = string;
type Timestamp = number;

type Headers = {[string]: string};

// We don't currently care about this
type ResourceTiming = null;

type ResourceType =
  | 'Document'
  | 'Stylesheet'
  | 'Image'
  | 'Media'
  | 'Font'
  | 'Script'
  | 'TextTrack'
  | 'XHR'
  | 'Fetch'
  | 'EventSource'
  | 'WebSocket'
  | 'Manifest'
  | 'Other';

type SecurityState =
  | 'unknown'
  | 'neutral'
  | 'insecure'
  | 'warning'
  | 'secure'
  | 'info';
type BlockedReason =
  | 'csp'
  | 'mixed-content'
  | 'origin'
  | 'inspector'
  | 'subresource-filter'
  | 'other';

type StackTrace = null;

type Initiator = {
  type: 'script' | 'other',
  stackTrace?: StackTrace,
  url?: string,
  lineNumber?: number,
  ...
};

type ResourcePriority = 'VeryLow' | 'Low' | 'Medium' | 'High' | 'VeryHigh';

type Request = {
  url: string,
  method: string,
  headers: Headers,
  postData?: string,
  mixedContentType?: 'blockable' | 'optionally-blockable' | 'none',
  initialPriority: ResourcePriority,
  ...
};

type Response = {
  url: string,
  status: number,
  statusText: string,
  headers: Headers,
  headersText?: string,
  mimeType: string,
  requestHeaders?: Headers,
  requestHeadersText?: string,
  connectionReused: boolean,
  connectionId: number,
  fromDiskCache?: boolean,
  encodedDataLength: number,
  timing?: ResourceTiming,
  securityState: SecurityState,
  ...
};

type RequestWillBeSentEvent = {
  requestId: RequestId,
  frameId: FrameId,
  loaderId: LoaderId,
  documentURL: string,
  request: Request,
  timestamp: Timestamp,
  initiator: Initiator,
  redirectResponse?: Response,
  // This is supposed to be optional but the inspector crashes without it,
  // see https://bugs.chromium.org/p/chromium/issues/detail?id=653138
  type: ResourceType,
  ...
};

type ResponseReceivedEvent = {
  requestId: RequestId,
  frameId: FrameId,
  loaderId: LoaderId,
  timestamp: Timestamp,
  type: ResourceType,
  response: Response,
  ...
};

type DataReceived = {
  requestId: RequestId,
  timestamp: Timestamp,
  dataLength: number,
  encodedDataLength: number,
  ...
};

type LoadingFinishedEvent = {
  requestId: RequestId,
  timestamp: Timestamp,
  encodedDataLength: number,
  ...
};

type LoadingFailedEvent = {
  requestId: RequestId,
  timestamp: Timestamp,
  type: ResourceType,
  errorText: string,
  canceled?: boolean,
  blockedReason?: BlockedReason,
  ...
};

class Interceptor {
  _agent: NetworkAgent;
  _requests: Map<string, string>;

  constructor(agent: NetworkAgent) {
    this._agent = agent;
    this._requests = new Map();
  }

  getData(requestId: string): ?string {
    return this._requests.get(requestId);
  }

  requestSent(id: number, url: string, method: string, headers: Headers) {
    const requestId = String(id);
    this._requests.set(requestId, '');

    const request: Request = {
      url,
      method,
      headers,
      initialPriority: 'Medium',
    };
    const event: RequestWillBeSentEvent = {
      requestId,
      documentURL: '',
      frameId: '1',
      loaderId: '1',
      request,
      timestamp: JSInspector.getTimestamp(),
      initiator: {
        // TODO(blom): Get stack trace
        // If type is 'script' the inspector will try to execute
        // `stack.callFrames[0]`
        type: 'other',
      },
      type: 'Other',
    };
    this._agent.sendEvent('requestWillBeSent', event);
  }

  responseReceived(id: number, url: string, status: number, headers: Headers) {
    const requestId = String(id);
    const response: Response = {
      url,
      status,
      statusText: String(status),
      headers,
      // TODO(blom) refined headers, can we get this?
      requestHeaders: {},
      mimeType: this._getMimeType(headers),
      connectionReused: false,
      connectionId: -1,
      encodedDataLength: 0,
      securityState: 'unknown',
    };

    const event: ResponseReceivedEvent = {
      requestId,
      frameId: '1',
      loaderId: '1',
      timestamp: JSInspector.getTimestamp(),
      type: 'Other',
      response,
    };
    this._agent.sendEvent('responseReceived', event);
  }

  dataReceived(id: number, data: string) {
    const requestId = String(id);
    const existingData = this._requests.get(requestId) || '';
    this._requests.set(requestId, existingData.concat(data));
    const event: DataReceived = {
      requestId,
      timestamp: JSInspector.getTimestamp(),
      dataLength: data.length,
      encodedDataLength: data.length,
    };
    this._agent.sendEvent('dataReceived', event);
  }

  loadingFinished(id: number, encodedDataLength: number) {
    const event: LoadingFinishedEvent = {
      requestId: String(id),
      timestamp: JSInspector.getTimestamp(),
      encodedDataLength: encodedDataLength,
    };
    this._agent.sendEvent('loadingFinished', event);
  }

  loadingFailed(id: number, error: string) {
    const event: LoadingFailedEvent = {
      requestId: String(id),
      timestamp: JSInspector.getTimestamp(),
      type: 'Other',
      errorText: error,
    };
    this._agent.sendEvent('loadingFailed', event);
  }

  _getMimeType(headers: Headers): string {
    const contentType = headers['Content-Type'] || '';
    return contentType.split(';')[0];
  }
}

type EnableArgs = {
  maxResourceBufferSize?: number,
  maxTotalBufferSize?: number,
  ...
};

class NetworkAgent extends InspectorAgent {
  static DOMAIN: $TEMPORARY$string<'Network'> = 'Network';

  _sendEvent: EventSender;
  _interceptor: ?Interceptor;

  enable({maxResourceBufferSize, maxTotalBufferSize}: EnableArgs) {
    this._interceptor = new Interceptor(this);
    XMLHttpRequest.setInterceptor(this._interceptor);
  }

  disable() {
    XMLHttpRequest.setInterceptor(null);
    this._interceptor = null;
  }

  getResponseBody({requestId}: {requestId: RequestId, ...}): {
    body: ?string,
    base64Encoded: boolean,
    ...
  } {
    return {body: this.interceptor().getData(requestId), base64Encoded: false};
  }

  interceptor(): Interceptor {
    if (this._interceptor) {
      return this._interceptor;
    } else {
      throw Error('_interceptor can not be null');
    }
  }
}

module.exports = NetworkAgent;
