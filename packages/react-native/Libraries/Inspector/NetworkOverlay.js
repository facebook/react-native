/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RenderItemProps} from '@react-native/virtualized-lists';

const ScrollView = require('../Components/ScrollView/ScrollView');
const TouchableHighlight = require('../Components/Touchable/TouchableHighlight');
const View = require('../Components/View/View');
const FlatList = require('../Lists/FlatList');
const XHRInterceptor = require('../Network/XHRInterceptor');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Text = require('../Text/Text');
const WebSocketInterceptor = require('../WebSocket/WebSocketInterceptor');
const React = require('react');

const LISTVIEW_CELL_HEIGHT = 15;

// Global id for the intercepted XMLHttpRequest objects.
let nextXHRId = 0;

type NetworkRequestInfo = {
  id: number,
  type?: string,
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
  closeReason?: string,
  messages?: string,
  serverClose?: Object,
  serverError?: Object,
  ...
};

type Props = $ReadOnly<{||}>;
type State = {|
  detailRowId: ?number,
  requests: Array<NetworkRequestInfo>,
|};

function getStringByValue(value: any): string {
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string' && value.length > 500) {
    return String(value)
      .slice(0, 500)
      .concat('\n***TRUNCATED TO 500 CHARACTERS***');
  }
  return value;
}

function getTypeShortName(type: any): string {
  if (type === 'XMLHttpRequest') {
    return 'XHR';
  } else if (type === 'WebSocket') {
    return 'WS';
  }

  return '';
}

function keyExtractor(request: NetworkRequestInfo): string {
  return String(request.id);
}

/**
 * Show all the intercepted network requests over the InspectorPanel.
 */
class NetworkOverlay extends React.Component<Props, State> {
  _requestsListView: ?React.ElementRef<Class<FlatList<NetworkRequestInfo>>>;
  _detailScrollView: ?React.ElementRef<typeof ScrollView>;

  // Metrics are used to decide when if the request list should be sticky, and
  // scroll to the bottom as new network requests come in, or if the user has
  // intentionally scrolled away from the bottom - to instead flash the scroll bar
  // and keep the current position
  _requestsListViewScrollMetrics: {
    contentLength: number,
    offset: number,
    visibleLength: number,
  } = {
    offset: 0,
    visibleLength: 0,
    contentLength: 0,
  };

  // Map of `socketId` -> `index in `this.state.requests`.
  _socketIdMap: {[string]: number} = {};
  // Map of `xhr._index` -> `index in `this.state.requests`.
  _xhrIdMap: {[key: number]: number, ...} = {};

  state: State = {
    detailRowId: null,
    requests: [],
  };

  _enableXHRInterception(): void {
    if (XHRInterceptor.isInterceptorEnabled()) {
      return;
    }
    // Show the XHR request item in listView as soon as it was opened.
    XHRInterceptor.setOpenCallback((method, url, xhr) => {
      // Generate a global id for each intercepted xhr object, add this id
      // to the xhr object as a private `_index` property to identify it,
      // so that we can distinguish different xhr objects in callbacks.
      xhr._index = nextXHRId++;
      const xhrIndex = this.state.requests.length;
      this._xhrIdMap[xhr._index] = xhrIndex;

      const _xhr: NetworkRequestInfo = {
        id: xhrIndex,
        type: 'XMLHttpRequest',
        method: method,
        url: url,
      };
      this.setState(
        {
          requests: this.state.requests.concat(_xhr),
        },
        this._indicateAdditionalRequests,
      );
    });

    XHRInterceptor.setRequestHeaderCallback((header, value, xhr) => {
      // $FlowFixMe[prop-missing]
      const xhrIndex = this._getRequestIndexByXHRID(xhr._index);
      if (xhrIndex === -1) {
        return;
      }

      this.setState(({requests}) => {
        const networkRequestInfo = requests[xhrIndex];
        if (!networkRequestInfo.requestHeaders) {
          networkRequestInfo.requestHeaders = ({}: {[any]: any});
        }
        networkRequestInfo.requestHeaders[header] = value;
        return {requests};
      });
    });

    XHRInterceptor.setSendCallback((data, xhr) => {
      // $FlowFixMe[prop-missing]
      const xhrIndex = this._getRequestIndexByXHRID(xhr._index);
      if (xhrIndex === -1) {
        return;
      }

      this.setState(({requests}) => {
        const networkRequestInfo = requests[xhrIndex];
        networkRequestInfo.dataSent = data;
        return {requests};
      });
    });

    XHRInterceptor.setHeaderReceivedCallback(
      (type, size, responseHeaders, xhr) => {
        // $FlowFixMe[prop-missing]
        const xhrIndex = this._getRequestIndexByXHRID(xhr._index);
        if (xhrIndex === -1) {
          return;
        }

        this.setState(({requests}) => {
          const networkRequestInfo = requests[xhrIndex];
          networkRequestInfo.responseContentType = type;
          networkRequestInfo.responseSize = size;
          networkRequestInfo.responseHeaders = responseHeaders;
          return {requests};
        });
      },
    );

    XHRInterceptor.setResponseCallback(
      (status, timeout, response, responseURL, responseType, xhr) => {
        // $FlowFixMe[prop-missing]
        const xhrIndex = this._getRequestIndexByXHRID(xhr._index);
        if (xhrIndex === -1) {
          return;
        }

        this.setState(({requests}) => {
          const networkRequestInfo = requests[xhrIndex];
          networkRequestInfo.status = status;
          networkRequestInfo.timeout = timeout;
          networkRequestInfo.response = response;
          networkRequestInfo.responseURL = responseURL;
          networkRequestInfo.responseType = responseType;

          return {requests};
        });
      },
    );

    // Fire above callbacks.
    XHRInterceptor.enableInterception();
  }

  _enableWebSocketInterception(): void {
    if (WebSocketInterceptor.isInterceptorEnabled()) {
      return;
    }
    // Show the WebSocket request item in listView when 'connect' is called.
    WebSocketInterceptor.setConnectCallback(
      (url, protocols, options, socketId) => {
        const socketIndex = this.state.requests.length;
        this._socketIdMap[socketId] = socketIndex;
        const _webSocket: NetworkRequestInfo = {
          id: socketIndex,
          type: 'WebSocket',
          url: url,
          protocols: protocols,
        };
        this.setState(
          {
            requests: this.state.requests.concat(_webSocket),
          },
          this._indicateAdditionalRequests,
        );
      },
    );

    WebSocketInterceptor.setCloseCallback(
      (statusCode, closeReason, socketId) => {
        const socketIndex = this._socketIdMap[socketId];
        if (socketIndex === undefined) {
          return;
        }
        if (statusCode !== null && closeReason !== null) {
          this.setState(({requests}) => {
            const networkRequestInfo = requests[socketIndex];
            networkRequestInfo.status = statusCode;
            networkRequestInfo.closeReason = closeReason;
            return {requests};
          });
        }
      },
    );

    WebSocketInterceptor.setSendCallback((data, socketId) => {
      const socketIndex = this._socketIdMap[socketId];
      if (socketIndex === undefined) {
        return;
      }

      this.setState(({requests}) => {
        const networkRequestInfo = requests[socketIndex];

        if (!networkRequestInfo.messages) {
          networkRequestInfo.messages = '';
        }
        networkRequestInfo.messages += 'Sent: ' + JSON.stringify(data) + '\n';

        return {requests};
      });
    });

    WebSocketInterceptor.setOnMessageCallback((socketId, message) => {
      const socketIndex = this._socketIdMap[socketId];
      if (socketIndex === undefined) {
        return;
      }

      this.setState(({requests}) => {
        const networkRequestInfo = requests[socketIndex];

        if (!networkRequestInfo.messages) {
          networkRequestInfo.messages = '';
        }
        networkRequestInfo.messages +=
          'Received: ' + JSON.stringify(message) + '\n';

        return {requests};
      });
    });

    WebSocketInterceptor.setOnCloseCallback((socketId, message) => {
      const socketIndex = this._socketIdMap[socketId];
      if (socketIndex === undefined) {
        return;
      }

      this.setState(({requests}) => {
        const networkRequestInfo = requests[socketIndex];
        networkRequestInfo.serverClose = message;

        return {requests};
      });
    });

    WebSocketInterceptor.setOnErrorCallback((socketId, message) => {
      const socketIndex = this._socketIdMap[socketId];
      if (socketIndex === undefined) {
        return;
      }

      this.setState(({requests}) => {
        const networkRequestInfo = requests[socketIndex];
        networkRequestInfo.serverError = message;

        return {requests};
      });
    });

    // Fire above callbacks.
    WebSocketInterceptor.enableInterception();
  }

  componentDidMount() {
    this._enableXHRInterception();
    this._enableWebSocketInterception();
  }

  componentWillUnmount() {
    XHRInterceptor.disableInterception();
    WebSocketInterceptor.disableInterception();
  }

  _renderItem = ({
    item,
    index,
  }: RenderItemProps<NetworkRequestInfo>): React.MixedElement => {
    const tableRowViewStyle = [
      styles.tableRow,
      index % 2 === 1 ? styles.tableRowOdd : styles.tableRowEven,
      index === this.state.detailRowId && styles.tableRowPressed,
    ];
    const urlCellViewStyle = styles.urlCellView;
    const methodCellViewStyle = styles.methodCellView;

    return (
      <TouchableHighlight
        onPress={() => {
          this._pressRow(index);
        }}>
        <View>
          <View style={tableRowViewStyle}>
            <View style={urlCellViewStyle}>
              <Text style={styles.cellText} numberOfLines={1}>
                {item.url}
              </Text>
            </View>
            <View style={methodCellViewStyle}>
              <Text style={styles.cellText} numberOfLines={1}>
                {getTypeShortName(item.type)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  };

  _renderItemDetail(id: number): React.Node {
    const requestItem = this.state.requests[id];
    const details = Object.keys(requestItem).map(key => {
      if (key === 'id') {
        return;
      }
      return (
        <View style={styles.detailViewRow} key={key}>
          <Text style={[styles.detailViewText, styles.detailKeyCellView]}>
            {key}
          </Text>
          <Text style={[styles.detailViewText, styles.detailValueCellView]}>
            {getStringByValue(requestItem[key])}
          </Text>
        </View>
      );
    });

    return (
      <View>
        <TouchableHighlight
          style={styles.closeButton}
          onPress={this._closeButtonClicked}>
          <View>
            <Text style={styles.closeButtonText}>v</Text>
          </View>
        </TouchableHighlight>
        <ScrollView
          style={styles.detailScrollView}
          ref={scrollRef => (this._detailScrollView = scrollRef)}>
          {details}
        </ScrollView>
      </View>
    );
  }

  _indicateAdditionalRequests = (): void => {
    if (this._requestsListView) {
      const distanceFromEndThreshold = LISTVIEW_CELL_HEIGHT * 2;
      const {offset, visibleLength, contentLength} =
        this._requestsListViewScrollMetrics;
      const distanceFromEnd = contentLength - visibleLength - offset;
      const isCloseToEnd = distanceFromEnd <= distanceFromEndThreshold;
      if (isCloseToEnd) {
        this._requestsListView.scrollToEnd();
      } else {
        this._requestsListView.flashScrollIndicators();
      }
    }
  };

  _captureRequestsListView = (listRef: ?FlatList<NetworkRequestInfo>): void => {
    this._requestsListView = listRef;
  };

  _requestsListViewOnScroll = (e: Object): void => {
    this._requestsListViewScrollMetrics.offset = e.nativeEvent.contentOffset.y;
    this._requestsListViewScrollMetrics.visibleLength =
      e.nativeEvent.layoutMeasurement.height;
    this._requestsListViewScrollMetrics.contentLength =
      e.nativeEvent.contentSize.height;
  };

  /**
   * Popup a scrollView to dynamically show detailed information of
   * the request, when pressing a row in the network flow listView.
   */
  _pressRow(rowId: number): void {
    this.setState({detailRowId: rowId}, this._scrollDetailToTop);
  }

  _scrollDetailToTop = (): void => {
    if (this._detailScrollView) {
      this._detailScrollView.scrollTo({
        y: 0,
        animated: false,
      });
    }
  };

  _closeButtonClicked = () => {
    this.setState({detailRowId: null});
  };

  _getRequestIndexByXHRID(index: number): number {
    if (index === undefined) {
      return -1;
    }
    const xhrIndex = this._xhrIdMap[index];
    if (xhrIndex === undefined) {
      return -1;
    } else {
      return xhrIndex;
    }
  }

  render(): React.Node {
    const {requests, detailRowId} = this.state;

    return (
      <View style={styles.container}>
        {detailRowId != null && this._renderItemDetail(detailRowId)}
        <View style={styles.listViewTitle}>
          {requests.length > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.urlTitleCellView}>
                <Text style={styles.cellText} numberOfLines={1}>
                  URL
                </Text>
              </View>
              <View style={styles.methodTitleCellView}>
                <Text style={styles.cellText} numberOfLines={1}>
                  Type
                </Text>
              </View>
            </View>
          )}
        </View>

        <FlatList
          ref={this._captureRequestsListView}
          onScroll={this._requestsListViewOnScroll}
          style={styles.listView}
          data={requests}
          renderItem={this._renderItem}
          keyExtractor={keyExtractor}
          extraData={this.state}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    paddingRight: 5,
  },
  listViewTitle: {
    height: 20,
  },
  listView: {
    flex: 1,
    height: 60,
  },
  tableRow: {
    flexDirection: 'row',
    flex: 1,
    height: LISTVIEW_CELL_HEIGHT,
  },
  tableRowEven: {
    backgroundColor: '#555',
  },
  tableRowOdd: {
    backgroundColor: '#000',
  },
  tableRowPressed: {
    backgroundColor: '#3B5998',
  },
  cellText: {
    color: 'white',
    fontSize: 12,
  },
  methodTitleCellView: {
    height: 18,
    borderColor: '#DCD7CD',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    flex: 1,
  },
  urlTitleCellView: {
    height: 18,
    borderColor: '#DCD7CD',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    backgroundColor: '#444',
    flex: 5,
    paddingLeft: 3,
  },
  methodCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  urlCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    flex: 5,
    paddingLeft: 3,
  },
  detailScrollView: {
    flex: 1,
    height: 180,
    marginTop: 5,
    marginBottom: 5,
  },
  detailKeyCellView: {
    flex: 1.3,
  },
  detailValueCellView: {
    flex: 2,
  },
  detailViewRow: {
    flexDirection: 'row',
    paddingHorizontal: 3,
  },
  detailViewText: {
    color: 'white',
    fontSize: 11,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 10,
  },
  closeButton: {
    marginTop: 5,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

module.exports = NetworkOverlay;
