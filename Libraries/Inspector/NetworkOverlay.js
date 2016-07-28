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
const ScrollView = require('ScrollView');
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
  _listViewHeight: number;
  _scrollView: ?ScrollView;
  _detailViewItems: Array<Array<ReactElement<any>>>;
  _listViewOnLayout: (event: Event) => void;
  _captureRequestListView: (listRef: ?ListView) => void;
  _captureDetailScrollView: (scrollRef: ?ScrollView) => void;
  _renderRow: (
    rowData: NetworkRequestInfo,
    sectionID: number,
    rowID: number,
    highlightRow: (sectionID: number, rowID: number) => void,
  ) => ReactElement<any>;
  _renderScrollComponent: (props: Object) => ReactElement<any>;
  _closeButtonClicked: () => void;

  state: {
    dataSource: ListView.DataSource,
    newDetailInfo: bool,
    detailRowID: ?number,
  };

  constructor(props: Object) {
    super(props);
    this._requests = [];
    this._detailViewItems = [];
    this._listViewDataSource =
      new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      dataSource: this._listViewDataSource.cloneWithRows([]),
      newDetailInfo: false,
      detailRowID: null,
    };
    this._listViewHighlighted = false;
    this._listViewHeight = 0;
    this._captureRequestListView = this._captureRequestListView.bind(this);
    this._captureDetailScrollView = this._captureDetailScrollView.bind(this);
    this._listViewOnLayout = this._listViewOnLayout.bind(this);
    this._renderRow = this._renderRow.bind(this);
    this._renderScrollComponent = this._renderScrollComponent.bind(this);
    this._closeButtonClicked = this._closeButtonClicked.bind(this);
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
      this._requests.push(_xhr);
      this._detailViewItems.push([]);
      this._genDetailViewItem(xhr._index);
      this.setState(
        {dataSource: this._listViewDataSource.cloneWithRows(this._requests)},
        this._scrollToBottom(),
      );
    }.bind(this));

    XHRInterceptor.setRequestHeaderCallback(function(header, value, xhr) {
      const networkInfo = this._requests[xhr._index];
      if (!networkInfo.requestHeaders) {
        networkInfo.requestHeaders = {};
      }
      networkInfo.requestHeaders[header] = value;
      this._genDetailViewItem(xhr._index);
    }.bind(this));

    XHRInterceptor.setSendCallback(function(data, xhr) {
      this._requests[xhr._index].dataSent = data;
      this._genDetailViewItem(xhr._index);
    }.bind(this));

    XHRInterceptor.setHeaderReceivedCallback(
      function(type, size, responseHeaders, xhr) {
        const networkInfo = this._requests[xhr._index];
        networkInfo.responseContentType = type;
        networkInfo.responseSize = size;
        networkInfo.responseHeaders = responseHeaders;
        this._genDetailViewItem(xhr._index);
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
        const networkInfo = this._requests[xhr._index];
        networkInfo.status = status;
        networkInfo.timeout = timeout;
        networkInfo.response = response;
        networkInfo.responseURL = responseURL;
        networkInfo.responseType = responseType;
        this._genDetailViewItem(xhr._index);
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
    if (this._listView) {
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

  _captureRequestListView(listRef: ?ListView): void {
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
   * Popup a scrollView to dynamically show detailed information of
   * the request, when pressing a row in the network flow listView.
   */
  _pressRow(rowID: number): void {
    this._listViewHighlighted = true;
    this.setState(
      {detailRowID: rowID},
      this._scrollToTop(),
    );
  }

  _scrollToTop(): void {
    if (this._scrollView) {
      this._scrollView.scrollTo({
        y: 0,
        animated: false,
      });
    }
  }

  _captureDetailScrollView(scrollRef: ?ScrollView): void {
    this._scrollView = scrollRef;
  }

  _closeButtonClicked() {
    this.setState({detailRowID: null});
  }

  _getStringByValue(value: any): string {
    if (value === undefined) {
      return 'undefined';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && value.length > 500) {
      return String(value).substr(0, 500).concat('\n***TRUNCATED TO 500 CHARACTERS***');
    }
    return value;
  }

  /**
   * Generate a list of views containing network request information for
   * a XHR object, to be shown in the detail scrollview. This function
   * should be called every time there is a new update of the XHR object,
   * in order to show network request/response information in real time.
   */
  _genDetailViewItem(index: number): void {
    this._detailViewItems[index] = [];
    const detailViewItem = this._detailViewItems[index];
    const requestItem = this._requests[index];
    for (let key in requestItem) {
      detailViewItem.push(
        <View style={styles.detailViewRow} key={key}>
          <Text style={[styles.detailViewText, styles.detailKeyCellView]}>
            {key}
          </Text>
          <Text style={[styles.detailViewText, styles.detailValueCellView]}>
            {this._getStringByValue(requestItem[key])}
          </Text>
        </View>
      );
    }
    // Re-render if this network request is showing in the detail view.
    if (this.state.detailRowID != null && this.state.detailRowID == index) {
      this.setState({newDetailInfo: true});
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.detailRowID != null &&
        <TouchableHighlight
          style={styles.closeButton}
          onPress={this._closeButtonClicked}>
          <View>
            <Text style={styles.clostButtonText}>v</Text>
          </View>
        </TouchableHighlight>}
        {this.state.detailRowID != null &&
        <ScrollView
          style={styles.detailScrollView}
          ref={this._captureDetailScrollView}>
          {this._detailViewItems[this.state.detailRowID]}
        </ScrollView>}
        <View style={styles.listViewTitle}>
          {this._requests.length > 0 &&
          <View style={styles.tableRow}>
            <View style={styles.urlTitleCellView}>
              <Text style={styles.cellText} numberOfLines={1}>URL</Text>
            </View>
            <View style={styles.methodTitleCellView}>
              <Text style={styles.cellText} numberOfLines={1}>Method</Text>
            </View>
          </View>}
        </View>
        <ListView
          style={styles.listView}
          ref={this._captureRequestListView}
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
  clostButtonText: {
    color: 'white',
    fontSize: 10,
  },
  closeButton: {
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    right: 0,
  },
});

module.exports = NetworkOverlay;
