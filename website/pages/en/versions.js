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

class Versions extends React.Component {
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
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer documentContainer postContainer">
          <div className="post">
            <header className="postHeader">
              <h2>React Native Versions</h2>
            </header>
            <p>
              React Native follows a monthly release train. Every month, a new
              branch created off master enters the Release Candidate phase, and
              the previous Release Candidate branch is released and considered
              stable.
            </p>
            <p>
              If you have an existing project that uses React Native, read the
              release notes to learn about new features and fixes. You can
              follow <a href="/react-native/docs/upgrading.html">our guide to upgrade your app to the latest version</a>.
            </p>
            <h2>Current version (Stable)</h2>
            <p>This is the version that is configured automatically when you create a new project using <code>react-native init</code>.</p>
            <h2>Pre-release versions</h2>
            <p>To see what changes are coming and provide better feedback to React Native contributors, use the latest release candidate when possible. By the time a release candidate is released, the changes it contains will have been shipped in production Facebook apps for over two weeks.</p>
            <h2>Past versions</h2>
            <p>You can find past versions of React Native on GitHub. The release notes can be useful if you would like to learn when a specific feature or fix was released.</p>
            <p>You can also view the docs for a particular version of React Native by clicking on the Docs link next to the release in this page. You can come back to this page and switch the version of the docs you're reading at any time by clicking on the version number at the top of the page.</p>
          </div>
        </Container>
      </div>
    );
  }
}

Versions.defaultProps = {
  language: "en"
};

module.exports = Versions;
