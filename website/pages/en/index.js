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
const Prism = require("../../core/Prism.js");
const Marked = CompLibrary.Marked; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(process.cwd() + "/siteConfig.js");

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
          subtitle="Learn once, write anywhere: Build mobile apps with React"
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

class Index extends React.Component {
  render() {
    let language = this.props.language || "en";
    const showcase = siteConfig.users
      .filter(user => {
        return user.pinned;
      })
      .map(user => {
        return (
          <a href={user.infoLink}>
            <img src={user.image} title={user.caption} />
          </a>
        );
      });

    return (
      <div>
        <HomeSplash language={language} />
        <div className="mainContainer">
          <Container padding={["bottom", "top"]}>
            <GridBlock
              align="left"
              contents={[
                {
                  content:
                    "React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.",
                  imageAlign: "right",
                  code: `import React, { Component } from 'react';
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
}`,
                  title: "Build native mobile apps using JavaScript and React"
                },
                {
                  content:
                    "With React Native, you don't build a “mobile web app”, an “HTML5 app”, or a “hybrid app”. You build a real mobile app that's indistinguishable from an app built using Objective-C or Java. React Native uses the same fundamental UI building blocks as regular iOS and Android apps. You just put those building blocks together using JavaScript and React.",
                  imageAlign: "left",
                  code: `import React, { Component } from 'react';
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
}`,
                  title: "A React Native app is a real mobile app"
                },
                {
                  title: "Don't waste time recompiling",
                  content:
                    "React Native lets you build your app faster. Instead of recompiling, you can reload your app instantly. With [Hot Reloading](), you can even run new code while retaining your application state. Give it a try - it's a magical experience.",
                  imageAlign: "right",
                  image:
                    "https://media.giphy.com/media/13WZniThXy0hSE/giphy.gif"
                },
                {
                  title: "Use native code when you need to",
                  content:
                    "React Native combines smoothly with components written in Objective-C, Java, or Swift. It's simple to drop down to native code if you need to optimize a few aspects of your application. It's also easy to build part of your app in React Native, and part of your app using native code directly - that's how the Facebook app works.",
                  imageAlign: "left",
                  code: `import React, { Component } from 'react';
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
}`
                }
              ]}
              layout="twoColumn"
            />
          </Container>
          <div
            className="productShowcaseSection paddingBottom"
            style={{ textAlign: "center" }}
          >
            <h2>Feature Callout</h2>
            <Marked>These are features of this project</Marked>
          </div>
          TODO: Move the gridblock above, to down here
          <section className="home-get-started-section">
            <div className="buttons-unit">
              <a href="docs/getting-started.html#content" className="button">
                Get Started with React Native
              </a>
            </div>
          </section>
          <Container padding={["bottom", "top"]} id="try">
            <GridBlock
              contents={[
                {
                  content: "Talk about trying this out",
                  image: "/test-site/img/docusaurus.svg",
                  imageAlign: "left",
                  title: "Try it Out"
                }
              ]}
            />
          </Container>
          <Container padding={["bottom", "top"]} background="dark">
            <GridBlock
              contents={[
                {
                  content:
                    "This is another description of how this project is useful",
                  image: "/test-site/img/docusaurus.svg",
                  imageAlign: "right",
                  title: "Description"
                }
              ]}
            />
          </Container>
          <div className="productShowcaseSection paddingBottom">
            <h2>
              {"Who's Using This?"}
            </h2>
            <p>This project is used by all these people</p>
            <div className="logos">
              {showcase}
            </div>
            <div className="more-users">
              <a
                className="button"
                href={
                  siteConfig.baseUrl + this.props.language + "/" + "users.html"
                }
                target="_self"
              >
                More "Docusaurus" Users
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Index;
