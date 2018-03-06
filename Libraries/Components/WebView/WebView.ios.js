/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule WebView
 * @noflow
 */
'use strict';

const ActivityIndicator = require('ActivityIndicator');
const EdgeInsetsPropType = require('EdgeInsetsPropType');
const React = require('React');
const PropTypes = require('prop-types');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const UIManager = require('UIManager');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');
const ScrollView = require('ScrollView');

const deprecatedPropType = require('deprecatedPropType');
const invariant = require('fbjs/lib/invariant');
const keyMirror = require('fbjs/lib/keyMirror');
const processDecelerationRate = require('processDecelerationRate');
const requireNativeComponent = require('requireNativeComponent');
const resolveAssetSource = require('resolveAssetSource');

const RCTWebViewManager = require('NativeModules').WebViewManager;

const BGWASH = 'rgba(255,255,255,0.8)';
const RCT_WEBVIEW_REF = 'webview';

const WebViewState = keyMirror({
  IDLE: null,
  LOADING: null,
  ERROR: null,
});

const NavigationType = keyMirror({
  click: true,
  formsubmit: true,
  backforward: true,
  reload: true,
  formresubmit: true,
  other: true,
});

const JSNavigationScheme = 'react-js-navigation';

type ErrorEvent = {
  domain: any,
  code: any,
  description: any,
}

type Event = Object;

const DataDetectorTypes = [
  'phoneNumber',
  'link',
  'address',
  'calendarEvent',
  'none',
  'all',
];

const defaultRenderLoading = () => (
  <View style={styles.loadingView}>
    <ActivityIndicator />
  </View>
);
const defaultRenderError = (errorDomain, errorCode, errorDesc) => (
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

/**
 * `WebView` renders web content in a native view.
 *
 *```
 * import React, { Component } from 'react';
 * import { WebView } from 'react-native';
 *
 * class MyWeb extends Component {
 *   render() {
 *     return (
 *       <WebView
 *         source={{uri: 'https://github.com/facebook/react-native'}}
 *         style={{marginTop: 20}}
 *       />
 *     );
 *   }
 * }
 *```
 *
 * You can use this component to navigate back and forth in the web view's
 * history and configure various properties for the web content.
 */
class WebView extends React.Component {
  static JSNavigationScheme = JSNavigationScheme;
  static NavigationType = NavigationType;
  static get extraNativeComponentConfig() {
    return {
      nativeOnly: {
        onLoadingStart: true,
        onLoadingError: true,
        onLoadingFinish: true,
        onMessage: true,
        messagingEnabled: PropTypes.bool,
      },
    };
  }

  static propTypes = {
    ...ViewPropTypes,

    html: deprecatedPropType(
      PropTypes.string,
      'Use the `source` prop instead.'
    ),

    url: deprecatedPropType(
      PropTypes.string,
      'Use the `source` prop instead.'
    ),

    /**
     * Loads static html or a uri (with optional headers) in the WebView.
     */
    source: PropTypes.oneOfType([
      PropTypes.shape({
        /*
         * The URI to load in the `WebView`. Can be a local or remote file.
         */
        uri: PropTypes.string,
        /*
         * The HTTP Method to use. Defaults to GET if not specified.
         * NOTE: On Android, only GET and POST are supported.
         */
        method: PropTypes.string,
        /*
         * Additional HTTP headers to send with the request.
         * NOTE: On Android, this can only be used with GET requests.
         */
        headers: PropTypes.object,
        /*
         * The HTTP body to send with the request. This must be a valid
         * UTF-8 string, and will be sent exactly as specified, with no
         * additional encoding (e.g. URL-escaping or base64) applied.
         * NOTE: On Android, this can only be used with POST requests.
         */
        body: PropTypes.string,
      }),
      PropTypes.shape({
        /*
         * A static HTML page to display in the WebView.
         */
        html: PropTypes.string,
        /*
         * The base URL to be used for any relative links in the HTML.
         */
        baseUrl: PropTypes.string,
      }),
      /*
       * Used internally by packager.
       */
      PropTypes.number,
    ]),

    /**
     * Function that returns a view to show if there's an error.
     */
    renderError: PropTypes.func, // view to show if there's an error
    /**
     * Function that returns a loading indicator.
     */
    renderLoading: PropTypes.func,
    /**
     * Function that is invoked when the `WebView` has finished loading.
     */
    onLoad: PropTypes.func,
    /**
     * Function that is invoked when the `WebView` load succeeds or fails.
     */
    onLoadEnd: PropTypes.func,
    /**
     * Function that is invoked when the `WebView` starts loading.
     */
    onLoadStart: PropTypes.func,
    /**
     * Function that is invoked when the `WebView` load fails.
     */
    onError: PropTypes.func,
    /**
     * Boolean value that determines whether the web view bounces
     * when it reaches the edge of the content. The default value is `true`.
     * @platform ios
     */
    bounces: PropTypes.bool,
    /**
     * A floating-point number that determines how quickly the scroll view
     * decelerates after the user lifts their finger. You may also use the
     * string shortcuts `"normal"` and `"fast"` which match the underlying iOS
     * settings for `UIScrollViewDecelerationRateNormal` and
     * `UIScrollViewDecelerationRateFast` respectively:
     *
     *   - normal: 0.998
     *   - fast: 0.99 (the default for iOS web view)
     * @platform ios
     */
    decelerationRate: ScrollView.propTypes.decelerationRate,
    /**
     * Boolean value that determines whether scrolling is enabled in the
     * `WebView`. The default value is `true`.
     * @platform ios
     */
    scrollEnabled: PropTypes.bool,
    /**
     * Controls whether to adjust the content inset for web views that are
     * placed behind a navigation bar, tab bar, or toolbar. The default value
     * is `true`.
     */
    automaticallyAdjustContentInsets: PropTypes.bool,
    /**
     * The amount by which the web view content is inset from the edges of
     * the scroll view. Defaults to {top: 0, left: 0, bottom: 0, right: 0}.
     * @platform ios
     */
    contentInset: EdgeInsetsPropType,
    /**
     * Function that is invoked when the `WebView` loading starts or ends.
     */
    onNavigationStateChange: PropTypes.func,
    /**
     * A function that is invoked when the webview calls `window.postMessage`.
     * Setting this property will inject a `postMessage` global into your
     * webview, but will still call pre-existing values of `postMessage`.
     *
     * `window.postMessage` accepts one argument, `data`, which will be
     * available on the event object, `event.nativeEvent.data`. `data`
     * must be a string.
     */
    onMessage: PropTypes.func,
    /**
     * Boolean value that forces the `WebView` to show the loading view
     * on the first load.
     */
    startInLoadingState: PropTypes.bool,
    /**
     * The style to apply to the `WebView`.
     */
    style: ViewPropTypes.style,

    /**
     * Determines the types of data converted to clickable URLs in the web view's content.
     * By default only phone numbers are detected.
     *
     * You can provide one type or an array of many types.
     *
     * Possible values for `dataDetectorTypes` are:
     *
     * - `'phoneNumber'`
     * - `'link'`
     * - `'address'`
     * - `'calendarEvent'`
     * - `'none'`
     * - `'all'`
     *
     * @platform ios
     */
    dataDetectorTypes: PropTypes.oneOfType([
      PropTypes.oneOf(DataDetectorTypes),
      PropTypes.arrayOf(PropTypes.oneOf(DataDetectorTypes)),
    ]),

    /**
     * Boolean value to enable JavaScript in the `WebView`. Used on Android only
     * as JavaScript is enabled by default on iOS. The default value is `true`.
     * @platform android
     */
    javaScriptEnabled: PropTypes.bool,

    /**
     * Boolean value to enable third party cookies in the `WebView`. Used on
     * Android Lollipop and above only as third party cookies are enabled by
     * default on Android Kitkat and below and on iOS. The default value is `true`.
     * @platform android
     */
    thirdPartyCookiesEnabled: PropTypes.bool,

    /**
     * Boolean value to control whether DOM Storage is enabled. Used only in
     * Android.
     * @platform android
     */
    domStorageEnabled: PropTypes.bool,

    /**
     * Set this to provide JavaScript that will be injected into the web page
     * when the view loads.
     */
    injectedJavaScript: PropTypes.string,

    /**
     * Sets the user-agent for the `WebView`.
     * @platform android
     */
    userAgent: PropTypes.string,

    /**
     * Boolean that controls whether the web content is scaled to fit
     * the view and enables the user to change the scale. The default value
     * is `true`.
     */
    scalesPageToFit: PropTypes.bool,

    /**
     * Function that allows custom handling of any web view requests. Return
     * `true` from the function to continue loading the request and `false`
     * to stop loading.
     * @platform ios
     */
    onShouldStartLoadWithRequest: PropTypes.func,

    /**
     * Boolean that determines whether HTML5 videos play inline or use the
     * native full-screen controller. The default value is `false`.
     *
     * **NOTE** : In order for video to play inline, not only does this
     * property need to be set to `true`, but the video element in the HTML
     * document must also include the `webkit-playsinline` attribute.
     * @platform ios
     */
    allowsInlineMediaPlayback: PropTypes.bool,

    /**
     * Boolean that determines whether HTML5 audio and video requires the user
     * to tap them before they start playing. The default value is `true`.
     */
    mediaPlaybackRequiresUserAction: PropTypes.bool,

    /**
     * Function that accepts a string that will be passed to the WebView and
     * executed immediately as JavaScript.
     */
    injectJavaScript: PropTypes.func,

    /**
     * Specifies the mixed content mode. i.e WebView will allow a secure origin to load content from any other origin.
     *
     * Possible values for `mixedContentMode` are:
     *
     * - `'never'` (default) - WebView will not allow a secure origin to load content from an insecure origin.
     * - `'always'` - WebView will allow a secure origin to load content from any other origin, even if that origin is insecure.
     * - `'compatibility'` -  WebView will attempt to be compatible with the approach of a modern web browser with regard to mixed content.
     * @platform android
     */
    mixedContentMode: PropTypes.oneOf([
      'never',
      'always',
      'compatibility'
    ]),

    /**
     * Override the native component used to render the WebView. Enables a custom native
     * WebView which uses the same JavaScript as the original WebView.
     */
    nativeConfig: PropTypes.shape({
      /*
       * The native component used to render the WebView.
       */
      component: PropTypes.any,
      /*
       * Set props directly on the native component WebView. Enables custom props which the
       * original WebView doesn't pass through.
       */
      props: PropTypes.object,
      /*
       * Set the ViewManager to use for communcation with the native side.
       * @platform ios
       */
      viewManager: PropTypes.object,
    }),
  };

  static defaultProps = {
    scalesPageToFit: true,
  };

  state = {
    viewState: WebViewState.IDLE,
    lastErrorEvent: (null: ?ErrorEvent),
    startInLoadingState: true,
  };

  UNSAFE_componentWillMount() {
    if (this.props.startInLoadingState) {
      this.setState({viewState: WebViewState.LOADING});
    }
  }

  render() {
    let otherView = null;

    if (this.state.viewState === WebViewState.LOADING) {
      otherView = (this.props.renderLoading || defaultRenderLoading)();
    } else if (this.state.viewState === WebViewState.ERROR) {
      const errorEvent = this.state.lastErrorEvent;
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

    const webViewStyles = [styles.container, styles.webView, this.props.style];
    if (this.state.viewState === WebViewState.LOADING ||
      this.state.viewState === WebViewState.ERROR) {
      // if we're in either LOADING or ERROR states, don't show the webView
      webViewStyles.push(styles.hidden);
    }

    const nativeConfig = this.props.nativeConfig || {};

    const viewManager = nativeConfig.viewManager || RCTWebViewManager;

    const onShouldStartLoadWithRequest = this.props.onShouldStartLoadWithRequest && ((event: Event) => {
      const shouldStart = this.props.onShouldStartLoadWithRequest &&
        this.props.onShouldStartLoadWithRequest(event.nativeEvent);
      viewManager.startLoadWithResult(!!shouldStart, event.nativeEvent.lockIdentifier);
    });

    const decelerationRate = processDecelerationRate(this.props.decelerationRate);

    const source = this.props.source || {};
    if (this.props.html) {
      source.html = this.props.html;
    } else if (this.props.url) {
      source.uri = this.props.url;
    }

    const messagingEnabled = typeof this.props.onMessage === 'function';

    const NativeWebView = nativeConfig.component || RCTWebView;

    const webView =
      <NativeWebView
        ref={RCT_WEBVIEW_REF}
        key="webViewKey"
        style={webViewStyles}
        source={resolveAssetSource(source)}
        injectedJavaScript={this.props.injectedJavaScript}
        bounces={this.props.bounces}
        scrollEnabled={this.props.scrollEnabled}
        decelerationRate={decelerationRate}
        contentInset={this.props.contentInset}
        automaticallyAdjustContentInsets={this.props.automaticallyAdjustContentInsets}
        onLoadingStart={this._onLoadingStart}
        onLoadingFinish={this._onLoadingFinish}
        onLoadingError={this._onLoadingError}
        messagingEnabled={messagingEnabled}
        onMessage={this._onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        scalesPageToFit={this.props.scalesPageToFit}
        allowsInlineMediaPlayback={this.props.allowsInlineMediaPlayback}
        mediaPlaybackRequiresUserAction={this.props.mediaPlaybackRequiresUserAction}
        dataDetectorTypes={this.props.dataDetectorTypes}
        {...nativeConfig.props}
      />;

    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  }

  /**
   * Go forward one page in the web view's history.
   */
  goForward = () => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.goForward,
      null
    );
  };

  /**
   * Go back one page in the web view's history.
   */
  goBack = () => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.goBack,
      null
    );
  };

  /**
   * Reloads the current page.
   */
  reload = () => {
    this.setState({viewState: WebViewState.LOADING});
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.reload,
      null
    );
  };

  /**
   * Stop loading the current page.
   */
  stopLoading = () => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.stopLoading,
      null
    );
  };

  /**
   * Posts a message to the web view, which will emit a `message` event.
   * Accepts one argument, `data`, which must be a string.
   *
   * In your webview, you'll need to something like the following.
   *
   * ```js
   * document.addEventListener('message', e => { document.title = e.data; });
   * ```
   */
  postMessage = (data) => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.postMessage,
      [String(data)]
    );
  };

  /**
  * Injects a javascript string into the referenced WebView. Deliberately does not
  * return a response because using eval() to return a response breaks this method
  * on pages with a Content Security Policy that disallows eval(). If you need that
  * functionality, look into postMessage/onMessage.
  */
  injectJavaScript = (data) => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.injectJavaScript,
      [data]
    );
  };

  /**
   * We return an event with a bunch of fields including:
   *  url, title, loading, canGoBack, canGoForward
   */
  _updateNavigationState = (event: Event) => {
    if (this.props.onNavigationStateChange) {
      this.props.onNavigationStateChange(event.nativeEvent);
    }
  };

  /**
   * Returns the native `WebView` node.
   */
  getWebViewHandle = (): any => {
    return ReactNative.findNodeHandle(this.refs[RCT_WEBVIEW_REF]);
  };

  _onLoadingStart = (event: Event) => {
    const onLoadStart = this.props.onLoadStart;
    onLoadStart && onLoadStart(event);
    this._updateNavigationState(event);
  };

  _onLoadingError = (event: Event) => {
    event.persist(); // persist this event because we need to store it
    const {onError, onLoadEnd} = this.props;
    onError && onError(event);
    onLoadEnd && onLoadEnd(event);
    console.warn('Encountered an error loading page', event.nativeEvent);

    this.setState({
      lastErrorEvent: event.nativeEvent,
      viewState: WebViewState.ERROR
    });
  };

  _onLoadingFinish = (event: Event) => {
    const {onLoad, onLoadEnd} = this.props;
    onLoad && onLoad(event);
    onLoadEnd && onLoadEnd(event);
    this.setState({
      viewState: WebViewState.IDLE,
    });
    this._updateNavigationState(event);
  };

  _onMessage = (event: Event) => {
    const {onMessage} = this.props;
    onMessage && onMessage(event);
  }
}

const RCTWebView = requireNativeComponent('RCTWebView', WebView, WebView.extraNativeComponentConfig);

const styles = StyleSheet.create({
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
    height: 100,
  },
  webView: {
    backgroundColor: '#ffffff',
  }
});

module.exports = WebView;
