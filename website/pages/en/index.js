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
const Prism = CompLibrary.Prism;

const siteConfig = require(process.cwd() + "/siteConfig.js");

const pinnedApps = siteConfig.users.filter(app => {
  return app.pinned;
});

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    );
  }
}

Button.defaultProps = {
  target: "_self"
};

class Hero extends React.Component {
  render() {
    return (
      <div className="hero">
        <div className="wrap">
          <div className="text">
            {this.props.title}
          </div>
          <div className="minitext">
            {this.props.subtitle}
          </div>
        </div>
        {this.props.children}
      </div>
    );
  }
}

class HomeSplash extends React.Component {
  render() {
    return (
      <div className="homeContainer">
        <Hero
          title="React Native"
          subtitle="Build native mobile apps using JavaScript and React"
        >
          <div className="buttons-unit">
            <a href="docs/getting-started.html" className="button">
              Get Started
            </a>
            <a href="docs/tutorial.html" className="button">
              Learn the Basics
            </a>
          </div>
        </Hero>
      </div>
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

class Index extends React.Component {
  render() {
    let language = this.props.language || "en";

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <div
            className="productShowcaseSection paddingBottom"
            style={{ textAlign: "center" }}
          >
            <Container>
              <GridBlock
                align="center"
                contents={[{
                    title: 'Learn once, write anywhere',
                    content: 'React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.'
                  }, {
                    title: 'Build real mobile apps',
                    content: 'With React Native, you don\'t build a "mobile web app", an "HTML5 app", or a "hybrid app". React Native uses the same fundamental UI building blocks as regular iOS and Android apps.'
                  }, {
                    title: 'Don\'t waste time recompiling',
                    content: 'Instead of recompiling, you can reload your app instantly. With [Hot Reloading](http://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html), you can even run new code while retaining your application state. Give it a try - it\'s a magical experience.'
                  }]
                }
                layout="fourColumn"
              />
            </Container>

          </div>
          <Container>
            <div className="blockElement imageAlignSide twoByGridBlock">
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

          <Container padding={['bottom', 'top']}>
            <div className="blockElement imageAlignSide twoByGridBlock">
              <div className="blockContent">
                <h2>
                  A React Native app is a real mobile app
                </h2>
                <div>
                  <Marked>
                    With React Native, you don't build a "mobile web app", an "HTML5 app", or a "hybrid app". You build a real mobile app that's indistinguishable from an app built using Objective-C or Java. React Native uses the same fundamental UI building blocks as regular iOS and Android apps. You just put those building blocks together using JavaScript and React.
                  </Marked>
                </div>
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
          <Container padding={['bottom', 'top']} background="light">
            <div className="blockElement imageAlignSide twoByGridBlock">
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
          <Container padding={['bottom', 'top']}>
            <div className="blockElement imageAlignSide twoByGridBlock">
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
          <div className="home-showcase-section paddingBottom">
            <h2>
              Who's using React Native?
            </h2>
            <p>Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!</p>
            <div className="logos">
              <AppList apps={pinnedApps} />
            </div>
            <div className="more-users">
              <a
                className="button"
                href={
                  siteConfig.baseUrl + this.props.language + "/" + "users.html"
                }
                target="_self"
              >
                More React Native Apps
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Index;
