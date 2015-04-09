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
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var keyMirror = require('keyMirror');
var insetsDiffer = require('insetsDiffer');
var merge = require('merge');

var PropTypes = React.PropTypes;
var RCTWebViewManager = require('NativeModules').WebViewManager;

var invariant = require('invariant');

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
    NavigationType: NavigationType,
  },

  propTypes: {
    url: PropTypes.string,
    html: PropTypes.string,
    renderError: PropTypes.func, // view to show if there's an error
    renderLoading: PropTypes.func, // loading indicator to show
    automaticallyAdjustContentInsets: PropTypes.bool,
    shouldInjectAJAXHandler: PropTypes.bool,
    contentInset: EdgeInsetsPropType,
    onNavigationStateChange: PropTypes.func,
    startInLoadingState: PropTypes.bool, // force WebView to show loadingView on first load
    style: View.propTypes.style,
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
        html={this.props.html}
        shouldInjectAJAXHandler={this.props.shouldInjectAJAXHandler}
        contentInset={this.props.contentInset}
        automaticallyAdjustContentInsets={this.props.automaticallyAdjustContentInsets}
        onLoadingStart={this.onLoadingStart}
        onLoadingFinish={this.onLoadingFinish}
        onLoadingError={this.onLoadingError}
      />;

    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  },

  goForward: function() {
    RCTWebViewManager.goForward(this.getWebWiewHandle());
  },

  goBack: function() {
    RCTWebViewManager.goBack(this.getWebWiewHandle());
  },

  reload: function() {
    RCTWebViewManager.reload(this.getWebWiewHandle());
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

  getWebWiewHandle: function(): any {
    return this.refs[RCT_WEBVIEW_REF].getNodeHandle();
  },

  onLoadingStart: function(event: Event) {
    this.updateNavigationState(event);
  },

  onLoadingError: function(event: Event) {
    event.persist(); // persist this event because we need to store it
    console.error("encountered an error loading page", event.nativeEvent);

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

var RCTWebView = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView, {
    url: true,
    html: true,
    contentInset: {diff: insetsDiffer},
    automaticallyAdjustContentInsets: true,
    shouldInjectAJAXHandler: true
  }),
  uiViewClassName: 'RCTWebView',
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
});

module.exports = WebView;
