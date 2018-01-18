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
var ActivityIndicator = require('ActivityIndicator');
var React = require('React');
var PropTypes = require('prop-types');
var ReactNative = require('ReactNative');
var StyleSheet = require('StyleSheet');
var UIManager = require('UIManager');
var View = require('View');
var ViewPropTypes = require('ViewPropTypes');

var deprecatedPropType = require('deprecatedPropType');
var keyMirror = require('fbjs/lib/keyMirror');
var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');

var RCT_WEBVIEW_REF = 'webview';

var WebViewState = keyMirror({
  IDLE: null,
  LOADING: null,
  ERROR: null,
});

var defaultRenderLoading = () => (
  <View style={styles.loadingView}>
    <ActivityIndicator
      style={styles.loadingProgressBar}
    />
  </View>
);

/**
 * Renders a native WebView.
 */
class WebView extends React.Component {
  static get extraNativeComponentConfig() {
    return {
      nativeOnly: {
        messagingEnabled: PropTypes.bool,
      },
    };
  }

  static propTypes = {
    ...ViewPropTypes,
    renderError: PropTypes.func,
    renderLoading: PropTypes.func,
    onLoad: PropTypes.func,
    onLoadEnd: PropTypes.func,
    onLoadStart: PropTypes.func,
    onError: PropTypes.func,
    automaticallyAdjustContentInsets: PropTypes.bool,
    contentInset: EdgeInsetsPropType,
    onNavigationStateChange: PropTypes.func,
    onMessage: PropTypes.func,
    onContentSizeChange: PropTypes.func,
    startInLoadingState: PropTypes.bool, // force WebView to show loadingView on first load
    style: ViewPropTypes.style,

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
         * The URI to load in the WebView. Can be a local or remote file.
         */
        uri: PropTypes.string,
        /*
         * The HTTP Method to use. Defaults to GET if not specified.
         * NOTE: On Android, only GET and POST are supported.
         */
        method: PropTypes.oneOf(['GET', 'POST']),
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
     * Used on Android only, JS is enabled by default for WebView on iOS
     * @platform android
     */
    javaScriptEnabled: PropTypes.bool,

    /**
     * Used on Android Lollipop and above only, third party cookies are enabled
     * by default for WebView on Android Kitkat and below and on iOS
     * @platform android
     */
    thirdPartyCookiesEnabled: PropTypes.bool,

    /**
     * Used on Android only, controls whether DOM Storage is enabled or not
     * @platform android
     */
    domStorageEnabled: PropTypes.bool,

    /**
     * Sets the JS to be injected when the webpage loads.
     */
    injectedJavaScript: PropTypes.string,

    /**
     * Sets whether the webpage scales to fit the view and the user can change the scale.
     */
    scalesPageToFit: PropTypes.bool,

    /**
     * Sets the user-agent for this WebView. The user-agent can also be set in native using
     * WebViewConfig. This prop will overwrite that config.
     */
    userAgent: PropTypes.string,

    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,

    /**
     * Determines whether HTML5 audio & videos require the user to tap before they can
     * start playing. The default value is `false`.
     */
    mediaPlaybackRequiresUserAction: PropTypes.bool,

    /**
     * Boolean that sets whether JavaScript running in the context of a file
     * scheme URL should be allowed to access content from any origin.
     * Including accessing content from other file scheme URLs
     * @platform android
     */
    allowUniversalAccessFromFileURLs: PropTypes.bool,

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
     * Used on Android only, controls whether form autocomplete data should be saved
     * @platform android
     */
    saveFormDataDisabled: PropTypes.bool,

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
    /*
     * Used on Android only, controls whether the given list of URL prefixes should
     * make {@link com.facebook.react.views.webview.ReactWebViewClient} to launch a
     * default activity intent for those URL instead of loading it within the webview.
     * Use this to list URLs that WebView cannot handle, e.g. a PDF url.
     * @platform android
     */
    urlPrefixesForDefaultIntent: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    javaScriptEnabled : true,
    thirdPartyCookiesEnabled: true,
    scalesPageToFit: true,
    saveFormDataDisabled: false
  };

  state = {
    viewState: WebViewState.IDLE,
    lastErrorEvent: null,
    startInLoadingState: true,
  };

  componentWillMount() {
    if (this.props.startInLoadingState) {
      this.setState({viewState: WebViewState.LOADING});
    }
  }

  render() {
    var otherView = null;

   if (this.state.viewState === WebViewState.LOADING) {
      otherView = (this.props.renderLoading || defaultRenderLoading)();
    } else if (this.state.viewState === WebViewState.ERROR) {
      var errorEvent = this.state.lastErrorEvent;
      otherView = this.props.renderError && this.props.renderError(
        errorEvent.domain,
        errorEvent.code,
        errorEvent.description);
    } else if (this.state.viewState !== WebViewState.IDLE) {
      console.error('RCTWebView invalid state encountered: ' + this.state.loading);
    }

    var webViewStyles = [styles.container, this.props.style];
    if (this.state.viewState === WebViewState.LOADING ||
      this.state.viewState === WebViewState.ERROR) {
      // if we're in either LOADING or ERROR states, don't show the webView
      webViewStyles.push(styles.hidden);
    }

    var source = this.props.source || {};
    if (this.props.html) {
      source.html = this.props.html;
    } else if (this.props.url) {
      source.uri = this.props.url;
    }

    if (source.method === 'POST' && source.headers) {
      console.warn('WebView: `source.headers` is not supported when using POST.');
    } else if (source.method === 'GET' && source.body) {
      console.warn('WebView: `source.body` is not supported when using GET.');
    }

    const nativeConfig = this.props.nativeConfig || {};

    let NativeWebView = nativeConfig.component || RCTWebView;

    var webView =
      <NativeWebView
        ref={RCT_WEBVIEW_REF}
        key="webViewKey"
        style={webViewStyles}
        source={resolveAssetSource(source)}
        scalesPageToFit={this.props.scalesPageToFit}
        injectedJavaScript={this.props.injectedJavaScript}
        userAgent={this.props.userAgent}
        javaScriptEnabled={this.props.javaScriptEnabled}
        thirdPartyCookiesEnabled={this.props.thirdPartyCookiesEnabled}
        domStorageEnabled={this.props.domStorageEnabled}
        messagingEnabled={typeof this.props.onMessage === 'function'}
        onMessage={this.onMessage}
        contentInset={this.props.contentInset}
        automaticallyAdjustContentInsets={this.props.automaticallyAdjustContentInsets}
        onContentSizeChange={this.props.onContentSizeChange}
        onLoadingStart={this.onLoadingStart}
        onLoadingFinish={this.onLoadingFinish}
        onLoadingError={this.onLoadingError}
        testID={this.props.testID}
        mediaPlaybackRequiresUserAction={this.props.mediaPlaybackRequiresUserAction}
        allowUniversalAccessFromFileURLs={this.props.allowUniversalAccessFromFileURLs}
        mixedContentMode={this.props.mixedContentMode}
        saveFormDataDisabled={this.props.saveFormDataDisabled}
        urlPrefixesForDefaultIntent={this.props.urlPrefixesForDefaultIntent}
        {...nativeConfig.props}
      />;

    return (
      <View style={styles.container}>
        {webView}
        {otherView}
      </View>
    );
  }

  goForward = () => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.goForward,
      null
    );
  };

  goBack = () => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.goBack,
      null
    );
  };

  reload = () => {
    this.setState({
      viewState: WebViewState.LOADING
    });
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.reload,
      null
    );
  };

  stopLoading = () => {
    UIManager.dispatchViewManagerCommand(
      this.getWebViewHandle(),
      UIManager.RCTWebView.Commands.stopLoading,
      null
    );
  };

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
  updateNavigationState = (event) => {
    if (this.props.onNavigationStateChange) {
      this.props.onNavigationStateChange(event.nativeEvent);
    }
  };

  getWebViewHandle = () => {
    return ReactNative.findNodeHandle(this.refs[RCT_WEBVIEW_REF]);
  };

  onLoadingStart = (event) => {
    var onLoadStart = this.props.onLoadStart;
    onLoadStart && onLoadStart(event);
    this.updateNavigationState(event);
  };

  onLoadingError = (event) => {
    event.persist(); // persist this event because we need to store it
    var {onError, onLoadEnd} = this.props;
    onError && onError(event);
    onLoadEnd && onLoadEnd(event);
    console.warn('Encountered an error loading page', event.nativeEvent);

    this.setState({
      lastErrorEvent: event.nativeEvent,
      viewState: WebViewState.ERROR
    });
  };

  onLoadingFinish = (event) => {
    var {onLoad, onLoadEnd} = this.props;
    onLoad && onLoad(event);
    onLoadEnd && onLoadEnd(event);
    this.setState({
      viewState: WebViewState.IDLE,
    });
    this.updateNavigationState(event);
  };

  onMessage = (event: Event) => {
    var {onMessage} = this.props;
    onMessage && onMessage(event);
  }
}

var RCTWebView = requireNativeComponent('RCTWebView', WebView, WebView.extraNativeComponentConfig);

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    height: 0,
    flex: 0, // disable 'flex:1' when hiding a View
  },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingProgressBar: {
    height: 20,
  },
});

module.exports = WebView;
