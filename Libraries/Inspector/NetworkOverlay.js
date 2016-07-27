/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NetworkOverlay
 * @flow
 */
'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');
const XHRInterceptor = require('XHRInterceptor');

type NetworkRequestInfo = {
  url?: string,
  method?: string,
  status?: number,
  dataSent?: any,
  responseContentType?: string,
  responseSize?: number,
  requestHeaders?: Object,
  responseHeaders?: string,
  response?: Object | string,
  responseURL?: string,
  responseType?: string,
  timeout?: number,
};

/**
 * Show all the intercepted network requests over the InspectorPanel.
 */
class NetworkOverlay extends React.Component {
  _requests: Array<NetworkRequestInfo>;

  constructor(props: Object) {
    super(props);
    this._requests = [];
  }

  _enableInterception(): void {
    if (XHRInterceptor.isInterceptorEnabled()) {
      return;
    }
    // Show the network request item in listView as soon as it was opened.
    XHRInterceptor.setOpenCallback(function(method, url, xhr) {
      // Add one private `_index` property to identify the xhr object,
      // so that we can distinguish different xhr objects in callbacks.
      xhr._index = this._requests.length;
      const _xhr: NetworkRequestInfo = {'method': method, 'url': url};
      this._requests = this._requests.concat(_xhr);
    }.bind(this));

    XHRInterceptor.setRequestHeaderCallback(function(header, value, xhr) {
      if (!this._requests[xhr._index].requestHeaders) {
        this._requests[xhr._index].requestHeaders = {};
      }
      this._requests[xhr._index].requestHeaders[header] = value;
    }.bind(this));

    XHRInterceptor.setSendCallback(function(data, xhr) {
      this._requests[xhr._index].dataSent = data;
    }.bind(this));

    XHRInterceptor.setHeaderReceivedCallback(
      function(type, size, responseHeaders, xhr) {
        this._requests[xhr._index].responseContentType = type;
        this._requests[xhr._index].responseSize = size;
        this._requests[xhr._index].responseHeaders = responseHeaders;
      }.bind(this)
    );

    XHRInterceptor.setResponseCallback(
      function(
        status,
        timeout,
        response,
        responseURL,
        responseType,
        xhr,
      ) {
        this._requests[xhr._index].status = status;
        this._requests[xhr._index].timeout = timeout;
        this._requests[xhr._index].response = response;
        this._requests[xhr._index].responseURL = responseURL;
        this._requests[xhr._index].responseType = responseType;
      }.bind(this)
    );

    // Fire above callbacks.
    XHRInterceptor.enableInterception();
  }

  componentDidMount() {
    this._enableInterception();
  }

  componentWillUnmount() {
    XHRInterceptor.disableInterception();
  }

  render() {
    return (
      <View style={styles.container}>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    paddingRight: 5,
  },
});

module.exports = NetworkOverlay;
