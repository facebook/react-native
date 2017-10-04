/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const Marked = CompLibrary.Marked; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;
const Prism = require("../../core/Prism.js"); // replace with CompLibrary.Prism when docusaurus is updated in npm

const siteConfig = require(process.cwd() + "/siteConfig.js");

const pinnedApps = siteConfig.users.filter(app => {
  return app.pinned;
});

class Button extends React.Component {
  render() {
    return (
      <a className="big-button" href={this.props.href} target={this.props.target}>
        {this.props.children}
      </a>
    );
  }
}

class HomeCallToAction extends React.Component {
  render() {
    return (
      <div>
        <Button
          href={siteConfig.baseUrl + "docs/getting-started.html"}
          target="_self"
        >
          Get Started
        </Button>
        <Button
          href={siteConfig.baseUrl + "docs/tutorial.html"}
          target="_self"
        >
          Learn the Basics
        </Button>
      </div>
    );
  }
}

class Hero extends React.Component {
  render() {
    return (
      <div className="hero">
        {this.props.children}
      </div>
    );
  }
}

class HeaderHero extends React.Component {
  render() {
    return (
      <Hero>
        <div className="text">
          React Native
        </div>
        <div className="minitext">
          Build native mobile apps using JavaScript and React
        </div>
        <div className="buttons-unit">
          <HomeCallToAction />
        </div>
      </Hero>
    );
  }
}

class ShowcaseAppIcon extends React.Component {
  render() {
    return (
      <a href={this.props.linkUri}>
        <img src={this.props.iconUri} alt={this.props.name} />
      </a>
    );
  }
}

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

class Features extends React.Component {
  render () {
    return (
      <div>
        <Container>
          <div className="blockElement">
            <div className="blockContent">
              <h2>Build native mobile apps using JavaScript and React</h2>
              <Marked>
                React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.
              </Marked>
            </div>
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
          </div>
        </Container>
        <Container>
          <div className="blockElement">
            <div className="blockContent">
              <h2>
                A React Native app is a real mobile app
              </h2>
              <Marked>
                With React Native, you don't build a "mobile web app", an "HTML5 app", or a "hybrid app". You build a real mobile app that's indistinguishable from an app built using Objective-C or Java. React Native uses the same fundamental UI building blocks as regular iOS and Android apps. You just put those building blocks together using JavaScript and React.
              </Marked>
            </div>
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
          </div>
        </Container>
        <Container>
          <div className="blockElement">
            <div className="blockContent">
              <h2>
              Don't waste time recompiling
              </h2>
              <div>
                <Marked>
                React Native lets you build your app faster. Instead of recompiling, you can reload your app instantly. With [Hot Reloading](http://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html), you can even run new code while retaining your application state. Give it a try - it's a magical experience.
                </Marked>
              </div>
            </div>
            <img src="https://media.giphy.com/media/13WZniThXy0hSE/giphy.gif" />
          </div>
        </Container>
        <Container>
          <div className="blockElement">
            <div className="blockContent">
              <h2>
                Use native code when you need to
              </h2>
              <div>
                <Marked>
                  React Native combines smoothly with components written in Objective-C, Java, or Swift. It's simple to drop down to native code if you need to optimize a few aspects of your application. It's also easy to build part of your app in React Native, and part of your app using native code directly - that's how the Facebook app works.
                </Marked>
              </div>
            </div>
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
        </Container>
      </div>
    );
  }
}

class MiniShowcase extends React.Component {
  render() {
    return (
      <div className="home-showcase-section">
        <h2>
          Who's using React Native?
        </h2>
        <p>
          Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. 
          If you're curious to see what can be accomplished with React Native, <a href={siteConfig.baseUrl + "users.html"}>check out these apps</a>!
        </p>
        <div className="logos">
          <AppList apps={pinnedApps} />
        </div>
      </div>
    );
  }
}

class Index extends React.Component {
  render() {
    return (
      <div className="pageContainer">
        <HeaderHero />
        <Features />
        <MiniShowcase />
        <Hero>
          <HomeCallToAction />
        </Hero>
      </div>
    );
  }
}

module.exports = Index;
