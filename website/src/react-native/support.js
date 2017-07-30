/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var React = require('React');
var PropTypes = require('prop-types');
var Site = require('Site');

class support extends React.Component {
  getChildContext() {
    return { permalink: 'support.html' };
  }

  render() {
    return (
      <Site section="support" title="Help">

        <section
          className="content wrap documentationContent helpSection nosidebar"
        >
          <div className="helpSection inner-content">
            <h1>Need help?</h1>
            <p>
              At Facebook, there are dozens of engineers who work on React Native full-time. But there are far more people in the community who make key contributions and fix things. So if you need help with your React Native app, the right place to go depends on the type of help that you need.
            </p>

            <div className="help-row">
              <div className="help-col">

                <h2>Browse the docs</h2>
                <p>
                  Find what you're looking for in our detailed documentation and guides.
                </p>

                <ul>
                  <li className="help-list-entry">
                    <a
                      href="/react-native/docs/getting-started.html"
                    >
                      Getting Started
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a
                      href="/react-native/docs/tutorial.html"
                    >
                      The Basics Tutorial
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a
                      href="/react-native/docs/components-and-apis.html"
                    >
                      Components and APIs
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a
                      href="/react-native/docs/integration-with-existing-apps.html"
                    >
                      Integration With Existing Apps
                    </a>
                  </li>
                </ul>
              </div>

              <div className="help-col">
                <h2>Join the community</h2>
                <p>
                  Connect with other React Native developers. Show off your project, or ask how other people solved similar problems.
                </p>

                <ul>
                  <li className="help-list-entry">
                    <a
                      href="http://stackoverflow.com/questions/tagged/react-native?sort=frequent"
                    >
                      Stack Overflow
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a
                      href="https://www.facebook.com/groups/react.native.community"
                    >
                      React Native Community
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a
                      href="https://discord.gg/0ZcbPKXt5bZjGY5n"
                    >
                      Reactiflux Chat
                    </a>
                  </li>
                </ul>
              </div>

              <div className="help-col">
                <h2>Stay up to date</h2>
                <p>
                  Find out what's happening in the world of React Native.
                </p>

                <ul>
                  <li className="help-list-entry">
                    <a
                      href="https://twitter.com/reactnative"
                    >
                      React Native on Twitter
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a href="/react-native/blog/">
                      The React Native Blog
                    </a>
                  </li>
                  <li className="help-list-entry">
                    <a
                      href="https://github.com/facebook/react-native/releases"
                    >
                      Release notes
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <p>
              React Native is
              {' '}
              <a
                href="https://github.com/facebook/react-native"
              >
                open source
              </a>
              ! If you want to contribute, read the <a href="/react-native/docs/contributing.html">Contributor's Guide</a>, then take a look at the
              {' '}
              <a
                href="https://github.com/facebook/react-native/wiki/Roadmap"
              >
                Roadmap
              </a>
              {' '}
              to learn more about what people are working on, or check out the list of
              {' '}
              <a
                href="https://react-native.canny.io/feature-requests"
              >
                most popular features
              </a>
              {' '}
              requested by the community.
              {' '}
            </p>

          </div>
        </section>

      </Site>
    );
  }
}

support.childContextTypes = {
  permalink: PropTypes.string,
};

module.exports = support;
