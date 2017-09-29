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
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const siteConfig = require(process.cwd() + "/siteConfig.js");

class Help extends React.Component {
  render() {
    const supportLinks = [
      {
        content:
          "Find what you're looking for in our detailed documentation and guides.\n\n- [Getting Started](./docs/getting-started.html)\n- [The Basics Tutorial](./docs/tutorial.html)\n- [Components and APIs](./docs/components-and-apis.html)\n- [Integrating with Existing Apps](./docs/integration-with-existing-apps.html)",
        title: "Browse the docs"
      },
      {
        content:
          "Connect with other React Native developers. Show off your project, or ask how other people solved similar problems.\n\n- [Stack Overflow](http://stackoverflow.com/questions/tagged/react-native?sort=frequent)\n- [React Native Community](https://www.facebook.com/groups/react.native.community)\n- [Reactiflux Chat](https://discord.gg/0ZcbPKXt5bZjGY5n)",
        title: "Join the community"
      },
      {
        content:
          "Find out what's happening in the world of React Native.\n\n- [React Native on Twitter](https://twitter.com/reactnative)\n- [The React Native Blog](http://facebook.github.io/react-native/blog/)\n- [Release notes](https://github.com/facebook/react-native/releases)",
        title: "Stay up to date"
      }
    ];

    return (
      <div className="pageContainer">
        <Container>
            <h1>Community Resources</h1>
            <p>
              At Facebook, there are dozens of engineers who work on React
              Native full-time. But there are far more people in the community
              who make key contributions and fix things. So if you need help
              with your React Native app, the right place to go depends on the
              type of help that you need.
            </p>
        </Container>
        <Container className="mainContainer">
          <h2>Browse the docs</h2>
          <p>
            Find what you're looking for in our detailed documentation and guides.
          </p>
          <ul>
            <li>
              <a href={siteConfig.baseUrl + "docs/getting-started.html"}>Getting Started</a>
            </li>
            <li>
              <a href={siteConfig.baseUrl + "docs/tutorial.html"}>Learn the Basics</a>
            </li>
            <li>
              <a href={siteConfig.baseUrl + "docs/components.html"}>Components and APIs</a>
            </li>
            <li>
              <a href={siteConfig.baseUrl + "docs/integration-with-existing-apps.html"}>Integrating with Existing Apps</a>
            </li>
          </ul>
          <h2>Join the community</h2>
          <p>
            Connect with other React Native developers. Show off your project, or ask how other people solved similar problems.
          </p>
          <ul>
            <li>
              <a href="http://stackoverflow.com/questions/tagged/react-native?sort=frequent">Stack Overflow</a>
            </li>
            <li>
              <a href="https://www.facebook.com/groups/react.native.community">React Native Community</a>
            </li>
            <li>
              <a href="https://discord.gg/0ZcbPKXt5bZjGY5n">Reactiflux Chat</a>
            </li>
          </ul>
          <h2>Stay up to date</h2>
          <p>
            Find out what's happening in the world of React Native.
          </p>
          <ul>
            <li>
              <a href="https://twitter.com/reactnative">React Native on Twitter</a>
            </li>
            <li>
              <a href="http://facebook.github.io/react-native/blog/">The React Native Blog</a>
            </li>
            <li>
              <a href="https://github.com/facebook/react-native/releases">Release notes</a>
            </li>
          </ul>          
        </Container>
        <Container padding={["bottom"]}>
          <h2>Contributing to React Native</h2>
          <p>
            React Native is <a href="https://github.com/facebook/react-native">open source</a>! If you want to contribute, read the <a href="http://facebook.github.io/react-native/docs/contributing.html">Contributor's Guide</a>, then take a look at the <a href="https://github.com/facebook/react-native/wiki/Roadmap">Roadmap</a> to learn more about what people are working on, or check out the list of <a href="https://react-native.canny.io/feature-requests">most popular features</a> requested by the community.
          </p>
        </Container>
      </div>
    );
  }
}

Help.defaultProps = {
  language: "en"
};

module.exports = Help;
