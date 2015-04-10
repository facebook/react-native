/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebView
 */
'use strict';

var EdgeInsetsPropType = require('EdgeInsetsPropType');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var keyMirror = require('keyMirror');
var merge = require('merge');

var PropTypes = React.PropTypes;
var RCTUIManager = require('NativeModules').UIManager;

var RCT_WEBVIEW_REF = 'webview';

var WebViewState = keyMirror({
  IDLE: null,
  LOADING: null,
  ERROR: null,
});

var WebView = React.createClass({

  propTypes: {
    renderError: PropTypes.func, // view to show if there's an error
    renderLoading: PropTypes.func, // loading indicator to show
    url: PropTypes.string.isRequired,
    automaticallyAdjustContentInsets: PropTypes.bool,
    contentInset: EdgeInsetsPropType,
    onNavigationStateChange: PropTypes.func,
    startInLoadingState: PropTypes.bool, // force WebView to show loadingView on first load
    style: View.propTypes.style,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  },

  getInitialState: function() {
    return {
      viewState: WebViewState.IDLE,
      lastErrorEvent: null,
      startInLoadingState: true,
    };
  },

  componentWillMount: function() {
    if (this.props.startInLoadingState) {
      this.setState({viewState: WebViewState.LOADING});
    }
  },

  render: function() {
    var otherView = null;

   if (this.state.viewState === WebViewState.LOADING) {
      otherView = this.props.renderLoading && this.props.renderLoading();
    } else if (this.state.viewState === WebViewState.ERROR) {
      var errorEvent = this.state.lastErrorEvent;
      otherView = this.props.renderError && this.props.renderError(
        errorEvent.domain,
        errorEvent.code,
        errorEvent.description);
    } else if (this.state.viewState !== WebViewState.IDLE) {
      console.error("RCTWebView invalid state encountered: " + this.state.loading);
    }

    var webViewStyles = [styles.container, this.props.style];
    if (this.state.viewState === WebViewState.LOADING ||
      this.state.viewState === WebViewState.ERROR) {
      // if we're in either LOADING or ERROR states, don't show the webView
      webViewStyles.push(styles.hidden);
    }

    var webView =
      <RCTWebView
        ref={RCT_WEBVIEW_REF}
        key="webViewKey"
        style={webViewStyles}
        url={this.props.url}
        contentInset={this.props.contentInset}
        automaticallyAdjustContentInsets={this.props.automaticallyAdjustContentInsets}
        onLoadingStart={this.onLoadingStart}
        onLoadingFinish={this.onLoadingFinish}
        onLoadingError={this.onLoadingError}
        testID={this.props.testID}
      />;

    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  },

  goForward: function() {
    RCTUIManager.webViewGoForward(this.getWebWiewHandle());
  },

  goBack: function() {
    RCTUIManager.webViewGoBack(this.getWebWiewHandle());
  },

  reload: function() {
    RCTUIManager.webViewReload(this.getWebWiewHandle());
  },

  /**
   * We return an event with a bunch of fields including:
   *  url, title, loading, canGoBack, canGoForward
   */
  updateNavigationState: function(event) {
    if (this.props.onNavigationStateChange) {
      this.props.onNavigationStateChange(event.nativeEvent);
    }
  },

  getWebWiewHandle: function() {
    return this.refs[RCT_WEBVIEW_REF].getNodeHandle();
  },

  onLoadingStart: function(event) {
    this.updateNavigationState(event);
  },

  onLoadingError: function(event) {
    event.persist(); // persist this event because we need to store it
    console.error("encountered an error loading page", event.nativeEvent);

    this.setState({
      lastErrorEvent: event.nativeEvent,
      viewState: WebViewState.ERROR
    });
  },

  onLoadingFinish: function(event) {
    this.setState({
      viewState: WebViewState.IDLE,
    });
    this.updateNavigationState(event);
  },
});

var RCTWebView = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView, {
    url: true,
  }),
  uiViewClassName: 'RCTWebView',
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    height: 0,
    flex: 0, // disable 'flex:1' when hiding a View
  },
});

module.exports = WebView;
