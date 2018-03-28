/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule WebViewExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  WebView
} = ReactNative;

var HEADER = '#3b5998';
var BGWASH = 'rgba(255,255,255,0.8)';
var DISABLED_WASH = 'rgba(255,255,255,0.25)';

var TEXT_INPUT_REF = 'urlInput';
var WEBVIEW_REF = 'webview';
var DEFAULT_URL = 'https://m.facebook.com';

class WebViewExample extends React.Component<{}, $FlowFixMeState> {
  state = {
    url: DEFAULT_URL,
    status: 'No Page Loaded',
    backButtonEnabled: false,
    forwardButtonEnabled: false,
    loading: true,
    scalesPageToFit: true,
  };

  inputText = '';

  handleTextInputChange = (event) => {
    var url = event.nativeEvent.text;
    if (!/^[a-zA-Z-_]+:/.test(url)) {
      url = 'http://' + url;
    }
    this.inputText = url;
  };

  render() {
    this.inputText = this.state.url;

    return (
      <View style={[styles.container]}>
        <View style={[styles.addressBarRow]}>
          <TouchableOpacity
            onPress={this.goBack}
            style={this.state.backButtonEnabled ? styles.navButton : styles.disabledButton}>
            <Text>
               {'<'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.goForward}
            style={this.state.forwardButtonEnabled ? styles.navButton : styles.disabledButton}>
            <Text>
              {'>'}
            </Text>
          </TouchableOpacity>
          <TextInput
            ref={TEXT_INPUT_REF}
            autoCapitalize="none"
            defaultValue={this.state.url}
            onSubmitEditing={this.onSubmitEditing}
            onChange={this.handleTextInputChange}
            clearButtonMode="while-editing"
            style={styles.addressBarTextInput}
          />
          <TouchableOpacity onPress={this.pressGoButton}>
            <View style={styles.goButton}>
              <Text>
                 Go!
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <WebView
          ref={WEBVIEW_REF}
          automaticallyAdjustContentInsets={false}
          style={styles.webView}
          source={{uri: this.state.url}}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          decelerationRate="normal"
          onNavigationStateChange={this.onNavigationStateChange}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
          startInLoadingState={true}
          scalesPageToFit={this.state.scalesPageToFit}
        />
        <View style={styles.statusBar}>
          <Text style={styles.statusBarText}>{this.state.status}</Text>
        </View>
      </View>
    );
  }

  goBack = () => {
    this.refs[WEBVIEW_REF].goBack();
  };

  goForward = () => {
    this.refs[WEBVIEW_REF].goForward();
  };

  reload = () => {
    this.refs[WEBVIEW_REF].reload();
  };

  onShouldStartLoadWithRequest = (event) => {
    // Implement any custom loading logic here, don't forget to return!
    return true;
  };

  onNavigationStateChange = (navState) => {
    this.setState({
      backButtonEnabled: navState.canGoBack,
      forwardButtonEnabled: navState.canGoForward,
      url: navState.url,
      status: navState.title,
      loading: navState.loading,
      scalesPageToFit: true
    });
  };

  onSubmitEditing = (event) => {
    this.pressGoButton();
  };

  pressGoButton = () => {
    var url = this.inputText.toLowerCase();
    if (url === this.state.url) {
      this.reload();
    } else {
      this.setState({
        url: url,
      });
    }
    // dismiss keyboard
    this.refs[TEXT_INPUT_REF].blur();
  };
}

class Button extends React.Component<$FlowFixMeProps> {
  _handlePress = () => {
    if (this.props.enabled !== false && this.props.onPress) {
      this.props.onPress();
    }
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={this._handlePress}>
        <View style={styles.button}>
          <Text>{this.props.text}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

class ScaledWebView extends React.Component<{}, $FlowFixMeState> {
  state = {
    scalingEnabled: true,
  };

  render() {
    return (
      <View>
        <WebView
          style={{
            backgroundColor: BGWASH,
            height: 200,
          }}
          source={{uri: 'https://facebook.github.io/react/'}}
          scalesPageToFit={this.state.scalingEnabled}
        />
        <View style={styles.buttons}>
        { this.state.scalingEnabled ?
          <Button
            text="Scaling:ON"
            enabled={true}
            onPress={() => this.setState({scalingEnabled: false})}
          /> :
          <Button
            text="Scaling:OFF"
            enabled={true}
            onPress={() => this.setState({scalingEnabled: true})}
          /> }
        </View>
      </View>
    );
  }
}

class MessagingTest extends React.Component<{}, $FlowFixMeState> {
  webview = null

  state = {
    messagesReceivedFromWebView: 0,
    message: '',
  }

  onMessage = e => this.setState({
    messagesReceivedFromWebView: this.state.messagesReceivedFromWebView + 1,
    message: e.nativeEvent.data,
  })

  postMessage = () => {
    if (this.webview) {
      this.webview.postMessage('"Hello" from React Native!');
    }
  }

  render(): React.Node {
    const {messagesReceivedFromWebView, message} = this.state;

    return (
      <View style={[styles.container, { height: 200 }]}>
        <View style={styles.container}>
          <Text>Messages received from web view: {messagesReceivedFromWebView}</Text>
          <Text>{message || '(No message)'}</Text>
          <View style={styles.buttons}>
            <Button text="Send Message to Web View" enabled onPress={this.postMessage} />
          </View>
        </View>
        <View style={styles.container}>
          <WebView
            ref={webview => { this.webview = webview; }}
            style={{
              backgroundColor: BGWASH,
              height: 100,
            }}
            source={require('./messagingtest.html')}
            onMessage={this.onMessage}
          />
        </View>
      </View>
    );
  }
}

class InjectJS extends React.Component<{}> {
  webview = null;
  injectJS = () => {
    const script = 'document.write("Injected JS ")';
    if (this.webview) {
      this.webview.injectJavaScript(script);
    }
  }
  render() {
    return (
      <View>
        <WebView
          ref={webview => { this.webview = webview; }}
          style={{
            backgroundColor: BGWASH,
            height: 300,
          }}
          source={{uri: 'https://www.facebook.com'}}
          scalesPageToFit={true}
        />
        <View style={styles.buttons}>
          <Button text="Inject JS" enabled onPress={this.injectJS} />
        </View>
    </View>
    );
  }
}


var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HEADER,
  },
  addressBarRow: {
    flexDirection: 'row',
    padding: 8,
  },
  webView: {
    backgroundColor: BGWASH,
    height: 350,
  },
  addressBarTextInput: {
    backgroundColor: BGWASH,
    borderColor: 'transparent',
    borderRadius: 3,
    borderWidth: 1,
    height: 24,
    paddingLeft: 10,
    paddingTop: 3,
    paddingBottom: 3,
    flex: 1,
    fontSize: 14,
  },
  navButton: {
    width: 20,
    padding: 3,
    marginRight: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BGWASH,
    borderColor: 'transparent',
    borderRadius: 3,
  },
  disabledButton: {
    width: 20,
    padding: 3,
    marginRight: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DISABLED_WASH,
    borderColor: 'transparent',
    borderRadius: 3,
  },
  goButton: {
    height: 24,
    padding: 3,
    marginLeft: 8,
    alignItems: 'center',
    backgroundColor: BGWASH,
    borderColor: 'transparent',
    borderRadius: 3,
    alignSelf: 'stretch',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    height: 22,
  },
  statusBarText: {
    color: 'white',
    fontSize: 13,
  },
  spinner: {
    width: 20,
    marginRight: 6,
  },
  buttons: {
    flexDirection: 'row',
    height: 30,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    flex: 0.5,
    width: 0,
    margin: 5,
    borderColor: 'gray',
    borderWidth: 1,
    backgroundColor: 'gray',
  },
});

const HTML = `
<!DOCTYPE html>\n
<html>
  <head>
    <title>Hello Static World</title>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=320, user-scalable=no">
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        font: 62.5% arial, sans-serif;
        background: #ccc;
      }
      h1 {
        padding: 45px;
        margin: 0;
        text-align: center;
        color: #33f;
      }
    </style>
  </head>
  <body>
    <h1>Hello Static World</h1>
  </body>
</html>
`;

exports.displayName = (undefined: ?string);
exports.title = '<WebView>';
exports.description = 'Base component to display web content';
exports.examples = [
  {
    title: 'Simple Browser',
    render(): React.Element<any> { return <WebViewExample />; }
  },
  {
    title: 'Scale Page to Fit',
    render(): React.Element<any> { return <ScaledWebView/>; }
  },
  {
    title: 'Bundled HTML',
    render(): React.Element<any> {
      return (
        <WebView
          style={{
            backgroundColor: BGWASH,
            height: 100,
          }}
          source={require('./helloworld.html')}
          scalesPageToFit={true}
        />
      );
    }
  },
  {
    title: 'Static HTML',
    render(): React.Element<any> {
      return (
        <WebView
          style={{
            backgroundColor: BGWASH,
            height: 100,
          }}
          source={{html: HTML}}
          scalesPageToFit={true}
        />
      );
    }
  },
  {
    title: 'POST Test',
    render(): React.Element<any> {
      return (
        <WebView
          style={{
            backgroundColor: BGWASH,
            height: 100,
          }}
          source={{
            uri: 'http://www.posttestserver.com/post.php',
            method: 'POST',
            body: 'foo=bar&bar=foo'
          }}
          scalesPageToFit={false}
        />
      );
    }
  },
  {
    title: 'Messaging Test',
    render(): React.Element<any> { return <MessagingTest />; }
  },
  {
    title: 'Inject JavaScript',
    render(): React.Element<any> { return <InjectJS />; }
  },
];
