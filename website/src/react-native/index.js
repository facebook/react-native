/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Hero = require('Hero');
const Metadata = require('Metadata');
const Prism = require('Prism');
const React = require('React');
const ShowcaseAppIcon = require('ShowcaseAppIcon');
const Site = require('Site');

const pinnedApps = Metadata.showcaseApps.filter(app => {
  return app.pinned;
});

class AppList extends React.Component {
  constructor(props, context) {
    super(props, context);

    this._renderApp = this._renderApp.bind(this);
  }

  render() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    );
  }

  _renderApp(app, i) {
    return (
      <div className="showcase" key={i}>
        <ShowcaseAppIcon
          iconUri={app.icon}
          name={app.name}
          linkUri={app.infoLink} />
      </div>
    );
  }
}

class index extends React.Component {
  render() {
    return (
      <Site>
        <Hero title="React Native" subtitle="Learn once, write anywhere: Build mobile apps with React">
          <div className="buttons-unit">
            <a href="docs/getting-started.html" className="button">Get Started</a>
            <a href="docs/tutorial.html" className="button">Learn the Basics</a>
          </div>
        </Hero>

        <section className="content wrap">

          <div style={{margin: '40px auto', maxWidth: 800}}>

            <h2>Build native mobile apps using JavaScript and React</h2>
            <p>
              React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.
            </p>

            <Prism>

{`import React, { Component } from 'react';
import { Text, View } from 'react-native';

class WhyReactNativeIsSoGreat extends Component {
  render() {
    return (
      <View>
        <Text>
          If you like React on the web, you'll like React Native.
        </Text>
        <Text>
          You just use native components like 'View' and 'Text',
          instead of web components like 'div' and 'span'.
        </Text>
      </View>
    );
  }
}`}
            </Prism>

            <h2>A React Native app is a real mobile app</h2>
            <p>
              With React Native, you don't build a “mobile web app”, an “HTML5 app”, or a “hybrid app”. You build a real mobile app that's indistinguishable from an app built using Objective-C or Java. React Native uses the same fundamental UI building blocks as regular iOS and Android apps. You just put those building blocks together using JavaScript and React.
            </p>

            <Prism>
{`import React, { Component } from 'react';
import { Image, ScrollView, Text } from 'react-native';

class AwkwardScrollingImageWithText extends Component {
  render() {
    return (
      <ScrollView>
        <Image
          source={{uri: 'https://i.chzbgr.com/full/7345954048/h7E2C65F9/'}}
          style={{width: 320, height:180}}
        />
        <Text>
          On iOS, a React Native ScrollView uses a native UIScrollView.
          On Android, it uses a native ScrollView.

          On iOS, a React Native Image uses a native UIImageView.
          On Android, it uses a native ImageView.

          React Native wraps the fundamental native components, giving you
          the performance of a native app, plus the clean design of React.
        </Text>
      </ScrollView>
    );
  }
}`}
            </Prism>

            <h2>Don't waste time recompiling</h2>
            <p>
              React Native lets you build your app faster. Instead of recompiling, you can reload your app instantly. With <a href="/react-native/blog/2016/03/24/introducing-hot-reloading.html">Hot Reloading</a>, you can even run new code while retaining your application state. Give it a try - it's a magical experience.
            </p>
            <br />
            <img src="https://media.giphy.com/media/13WZniThXy0hSE/giphy.gif" />

            <h2>Use native code when you need to</h2>
            <p>
              React Native combines smoothly with components written in Objective-C, Java, or Swift. It's simple to drop down to native code if you need to optimize a few aspects of your application. It's also easy to build part of your app in React Native, and part of your app using native code directly - that's how the Facebook app works.
            </p>

            <Prism>
{`import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { TheGreatestComponentInTheWorld } from './your-native-code';

class SomethingFast extends Component {
  render() {
    return (
      <View>
        <TheGreatestComponentInTheWorld />
        <Text>
          TheGreatestComponentInTheWorld could use native Objective-C,
          Java, or Swift - the product development process is the same.
        </Text>
      </View>
    );
  }
}`}
            </Prism>
          </div>

          <section className="home-get-started-section">
            <div className="buttons-unit">
              <a href="docs/getting-started.html#content" className="button">Get Started with React Native</a>
            </div>
          </section>

          <section className="home-showcase-section">
            <h2>Who's using React Native?</h2>
            <p>
              Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!
            </p>
            <AppList apps={pinnedApps} />
            <div className="buttons-unit">
              <a href="/react-native/showcase.html" className="button">More React Native apps</a>
            </div>
          </section>
        </section>
      </Site>
    );
  }
}

module.exports = index;
