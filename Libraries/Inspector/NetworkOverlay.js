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

const ListView = require('ListView');
const React = require('React');
const RecyclerViewBackedScrollView = require('RecyclerViewBackedScrollView');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const View = require('View');
const XHRInterceptor = require('XHRInterceptor');

const LISTVIEW_CELL_HEIGHT = 15;
const SEPARATOR_THICKNESS = 2;

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
  _listViewDataSource: ListView.DataSource;
  _listView: ?ListView;
  _listViewHighlighted: bool;
  _listViewHeight: ?number;
  _listViewOnLayout: (event: Event) => void;
  _captureRequestList: (listRef: ?ListView) => void;
  _renderRow: (
    rowData: NetworkRequestInfo,
    sectionID: number,
    rowID: number,
    highlightRow: (sectionID: number, rowID: number) => void,
  ) => ReactElement<any>;
  _renderScrollComponent: (props: Object) => ReactElement<any>;

  state: {
    dataSource: ListView.DataSource,
  };

  constructor(props: Object) {
    super(props);
    this._requests = [];
    this._listViewDataSource =
      new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      dataSource: this._listViewDataSource.cloneWithRows([]),
    };
    this._listViewHighlighted = false;
    this._listViewHeight = null;
    this._captureRequestList = this._captureRequestList.bind(this);
    this._listViewOnLayout = this._listViewOnLayout.bind(this);
    this._renderRow = this._renderRow.bind(this);
    this._renderScrollComponent = this._renderScrollComponent.bind(this);
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
      this.setState(
        {dataSource: this._listViewDataSource.cloneWithRows(this._requests)},
        this._scrollToBottom(),
      );
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

  _renderRow(
    rowData: NetworkRequestInfo,
    sectionID: number,
    rowID: number,
    highlightRow: (sectionID: number, rowID: number) => void,
  ): ReactElement<any> {
    let urlCellViewStyle = styles.urlEvenCellView;
    let methodCellViewStyle = styles.methodEvenCellView;
    if (rowID % 2 === 1) {
      urlCellViewStyle = styles.urlOddCellView;
      methodCellViewStyle = styles.methodOddCellView;
    }
    return (
      <TouchableHighlight onPress={() => {
          this._pressRow(rowID);
          highlightRow(sectionID, rowID);
        }}>
        <View>
          <View style={styles.tableRow}>
            <View style={urlCellViewStyle}>
              <Text style={styles.cellText} numberOfLines={1}>
                {rowData.url}
              </Text>
            </View>
            <View style={methodCellViewStyle}>
              <Text style={styles.cellText} numberOfLines={1}>
                {rowData.method}
              </Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }

  _renderSeperator(
    sectionID: number,
    rowID: number,
    adjacentRowHighlighted: bool): ReactElement<any> {
    return (
      <View
        key={`${sectionID}-${rowID}`}
        style={{
          height: adjacentRowHighlighted ? SEPARATOR_THICKNESS : 0,
          backgroundColor: adjacentRowHighlighted ? '#3B5998' : '#CCCCCC',
        }}
      />
    );
  }

  _scrollToBottom(): void {
    if (!!this._listView && !!this._listViewHeight) {
      const scrollResponder = this._listView.getScrollResponder();
      if (scrollResponder) {
        const scrollY = Math.max(
          this._requests.length * LISTVIEW_CELL_HEIGHT +
          (this._listViewHighlighted ? 2 * SEPARATOR_THICKNESS : 0) -
          this._listViewHeight,
          0,
        );
        scrollResponder.scrollResponderScrollTo({
          x: 0,
          y: scrollY,
          animated: true
        });
      }
    }
  }

  _captureRequestList(listRef: ?ListView): void {
    this._listView = listRef;
  }

  _listViewOnLayout(event: any): void {
    const {height} = event.nativeEvent.layout;
    this._listViewHeight = height;
  }

  _renderScrollComponent(props: Object): ReactElement<any> {
    return (
      <RecyclerViewBackedScrollView {...props} />
    );
  }

  /**
   * TODO: When item is pressed, should pop up another view to show details.
   */
  _pressRow(rowID: number): void {
    this._listViewHighlighted = true;
  }

  render() {
    return (
      <View style={styles.container}>
        {this._requests.length > 0 &&
        <View>
          <View style={styles.tableRow}>
            <View style={styles.urlTitleCellView}>
              <Text style={styles.cellText} numberOfLines={1}>URL</Text>
            </View>
            <View style={styles.methodTitleCellView}>
              <Text style={styles.cellText} numberOfLines={1}>Method</Text>
            </View>
          </View>
        </View>}
        <ListView
          style={styles.listView}
          ref={this._captureRequestList}
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          renderScrollComponent={this._renderScrollComponent}
          enableEmptySections={true}
          renderSeparator={this._renderSeperator}
          onLayout={this._listViewOnLayout}
        />
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
  listView: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    flex: 1,
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
  methodOddCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    flex: 1,
  },
  urlOddCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
    flex: 5,
    paddingLeft: 3,
  },
  methodEvenCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#888',
    flex: 1,
  },
  urlEvenCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    backgroundColor: '#888',
    flex: 5,
    paddingLeft: 3,
  },
});

module.exports = NetworkOverlay;
