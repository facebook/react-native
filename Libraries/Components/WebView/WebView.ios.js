/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebView
 * @flow
 */
'use strict';

var ActivityIndicatorIOS = require('ActivityIndicatorIOS');
var EdgeInsetsPropType = require('EdgeInsetsPropType');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');

var invariant = require('invariant');
var keyMirror = require('keyMirror');
var requireNativeComponent = require('requireNativeComponent');

var PropTypes = React.PropTypes;
var RCTWebViewManager = require('NativeModules').WebViewManager;

var BGWASH = 'rgba(255,255,255,0.8)';
var RCT_WEBVIEW_REF = 'webview';

var WebViewState = keyMirror({
  IDLE: null,
  LOADING: null,
  ERROR: null,
});

var NavigationType = {
  click: RCTWebViewManager.NavigationType.LinkClicked,
  formsubmit: RCTWebViewManager.NavigationType.FormSubmitted,
  backforward: RCTWebViewManager.NavigationType.BackForward,
  reload: RCTWebViewManager.NavigationType.Reload,
  formresubmit: RCTWebViewManager.NavigationType.FormResubmitted,
  other: RCTWebViewManager.NavigationType.Other,
};

var JSNavigationScheme = RCTWebViewManager.JSNavigationScheme;

type ErrorEvent = {
  domain: any;
  code: any;
  description: any;
}

type Event = Object;

var defaultRenderLoading = () => (
  <View style={styles.loadingView}>
    <ActivityIndicatorIOS />
  </View>
);
var defaultRenderError = (errorDomain, errorCode, errorDesc) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTextTitle}>
      Error loading page
    </Text>
    <Text style={styles.errorText}>
      {'Domain: ' + errorDomain}
    </Text>
    <Text style={styles.errorText}>
      {'Error Code: ' + errorCode}
    </Text>
    <Text style={styles.errorText}>
      {'Description: ' + errorDesc}
    </Text>
  </View>
);

var WebView = React.createClass({
  statics: {
    JSNavigationScheme: JSNavigationScheme,
    NavigationType: NavigationType,
  },

  propTypes: {
    url: PropTypes.string,
    html: PropTypes.string,
    renderError: PropTypes.func, // view to show if there's an error
    renderLoading: PropTypes.func, // loading indicator to show
    bounces: PropTypes.bool,
    scrollEnabled: PropTypes.bool,
    automaticallyAdjustContentInsets: PropTypes.bool,
    contentInset: EdgeInsetsPropType,
    onNavigationStateChange: PropTypes.func,
    startInLoadingState: PropTypes.bool, // force WebView to show loadingView on first load
    style: View.propTypes.style,
    /**
     * Used for android only, JS is enabled by default for WebView on iOS
     */
    javaScriptEnabledAndroid: PropTypes.bool,
    /**
     * Sets the JS to be injected when the webpage loads.
     */
    injectedJavaScript: PropTypes.string,

    /**
     * Used for iOS only, sets whether the webpage scales to fit the view and the
     * user can change the scale
     */
    scalesPageToFit: PropTypes.bool,
  },

  getInitialState: function() {
    return {
      viewState: WebViewState.IDLE,
      lastErrorEvent: (null: ?ErrorEvent),
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
      otherView = (this.props.renderLoading || defaultRenderLoading)();
    } else if (this.state.viewState === WebViewState.ERROR) {
      var errorEvent = this.state.lastErrorEvent;
      invariant(
        errorEvent != null,
        'lastErrorEvent expected to be non-null'
      );
      otherView = (this.props.renderError || defaultRenderError)(
        errorEvent.domain,
        errorEvent.code,
        errorEvent.description
      );
    } else if (this.state.viewState !== WebViewState.IDLE) {
      console.error(
        'RCTWebView invalid state encountered: ' + this.state.loading
      );
    }

    var webViewStyles = [styles.container, styles.webView, this.props.style];
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
        html={this.props.html}
        injectedJavaScript={this.props.injectedJavaScript}
        bounces={this.props.bounces}
        scrollEnabled={this.props.scrollEnabled}
        contentInset={this.props.contentInset}
        automaticallyAdjustContentInsets={this.props.automaticallyAdjustContentInsets}
        onLoadingStart={this.onLoadingStart}
        onLoadingFinish={this.onLoadingFinish}
        onLoadingError={this.onLoadingError}
        scalesPageToFit={this.props.scalesPageToFit}
      />;

    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  },

  goForward: function() {
    RCTWebViewManager.goForward(this.getWebViewHandle());
  },

  goBack: function() {
    RCTWebViewManager.goBack(this.getWebViewHandle());
  },

  reload: function() {
    RCTWebViewManager.reload(this.getWebViewHandle());
  },

  /**
   * We return an event with a bunch of fields including:
   *  url, title, loading, canGoBack, canGoForward
   */
  updateNavigationState: function(event: Event) {
    if (this.props.onNavigationStateChange) {
      this.props.onNavigationStateChange(event.nativeEvent);
    }
  },

  getWebViewHandle: function(): any {
    return React.findNodeHandle(this.refs[RCT_WEBVIEW_REF]);
  },

  onLoadingStart: function(event: Event) {
    this.updateNavigationState(event);
  },

  onLoadingError: function(event: Event) {
    event.persist(); // persist this event because we need to store it
    console.warn('Encountered an error loading page', event.nativeEvent);

    this.setState({
      lastErrorEvent: event.nativeEvent,
      viewState: WebViewState.ERROR
    });
  },

  onLoadingFinish: function(event: Event) {
    this.setState({
      viewState: WebViewState.IDLE,
    });
    this.updateNavigationState(event);
  },
});

var RCTWebView = requireNativeComponent('RCTWebView', WebView, {
  nativeOnly: {
    onLoadingStart: true,
    onLoadingError: true,
    onLoadingFinish: true,
  },
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BGWASH,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  errorTextTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  hidden: {
    height: 0,
    flex: 0, // disable 'flex:1' when hiding a View
  },
  loadingView: {
    backgroundColor: BGWASH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    backgroundColor: '#ffffff',
  }
});

module.exports = WebView;
