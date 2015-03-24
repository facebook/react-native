/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var Prism = require('Prism');
var React = require('React');
var Site = require('Site');

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>React Native</strong></div>
            <div className="minitext">
              Build native apps using React
            </div>
          </div>
        </div>

        <section className="content wrap">
          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/getting-started.html#content" className="button">Learn more about React Native</a>
            </div>
          </section>

          <h2>Native iOS Components</h2>
          <p>With React Native, you can use the platform components such as iOS UITabBar and UINavigationController.</p>
          <Prism>
{`var React = require('react-native');
var { TabBarIOS, NavigatorIOS } = React;
module.exports = React.createClass({
  render: function() {
    return (
      <TabBarIOS>
        <TabBarIOS.Item title="React Native" selected={true}>
          <NavigatorIOS initialRoute={{ title: 'React Native' }} />
        </TabBarIOS.Item>
      </TabBarIOS>
    );
  },
});`}
          </Prism>

          <h2>Async</h2>

          <p>Decoding images off of the main thread... Asynchronous bridge, Chrome Dev Tools...</p>

          <h2>Touch Handling</h2>
          <p>iOS has a very powerful system called Responder to handle touches which the web lacks. React Native implements iOS responder system and provides high level components such as TouchableHighlight that work well right off the bat.</p>

          <Prism>
{`var React = require('react-native');
var { ScrollView, TouchableHighlight, Text } = React;
module.exports = React.createClass({
  render: function() {
    return (
      <ScrollView>
        <TouchableHighlight underlayColor="#cccccc">
          <Text>Proper Touch Handling</Text>
        </TouchableHighlight>
      </ScrollView>
    );
  },
});`}
          </Prism>

          <h2>Flexbox</h2>
          <p>Laying out views should be easy</p>

          <Prism>
{`var React = require('react-native');
var { Image, StyleSheet, Text, View } = React;
module.exports = React.createClass({
  render: function() {
    return (
      <View style={styles.row}>
        <Image
          source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
          style={styles.image}
        />
        <View style={styles.text}>
          <Text style={styles.title}>React Native</Text>
          <Text style={styles.subtitle}>Build high quality mobile apps using React</Text>
        </View>
      </View>
    );
  },
});
var styles = StyleSheet.create({
  row: { flexDirection: 'row', margin: 40 },
  image: { width: 40, height: 40, marginRight: 10 },
  text: { flex: 1, justifyContent: 'center'},
  title: { fontSize: 11, fontWeight: 'bold' },
  subtitle: { fontSize: 10 },
});`}
          </Prism>

          <h2>Polyfills</h2>
          <p>React Native attempts to innovate on the view layer, for the rest, it polyfills web standards. You can use npm to install JavaScript dependencies, XMLHttpRequest, requestAnimationFrame, navigator.geolocation...</p>

        </section>
      </Site>
    );
  }
});

module.exports = index;
