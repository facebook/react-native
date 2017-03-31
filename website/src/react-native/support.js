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
var Site = require('Site');

var support = React.createClass({
  childContextTypes: {
    permalink: React.PropTypes.string
  },

  getChildContext: function() {
    return {permalink: 'support.html'};
  },
  render: function() {
    return (
      <Site section="support" title="Help">

        <section className="content wrap documentationContent helpSection nosidebar">
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
                    <a href="/react-native/docs/getting-started.html">Getting Started</a>
                  </li>
                  <li className="help-list-entry">
                    <a href="/react-native/docs/tutorial.html">The Basics Tutorial</a>
                  </li>
                  <li className="help-list-entry">
                    <a href="/react-native/docs/integration-with-existing-apps.html">Integration With Existing Apps</a>
                  </li>
                </ul>
                <h2>Explore samples</h2>
                <p>
                  Take apart these fully built applications, and get some inspiration for your own.
                </p>

                <ul>
                  <li className="help-list-entry">
                    <a href="http://makeitopen.com/">Building the F8 2016 App</a>
                  </li>
                  <li className="help-list-entry">
                    <a href="https://github.com/facebook/react-native/tree/master/Examples/UIExplorer">UIExplorer</a>
                  </li>
                  <li className="help-list-entry">
                    <a href="https://github.com/facebook/react-native/tree/master/Examples/Movies">Movies</a>
                  </li>
                </ul>

                <h2>Stay up to date</h2>
                <p>
                  Find out what's happening in the world of React Native.
                </p>

                <ul>
                  <li className="help-list-entry">
                    <a href="https://twitter.com/reactnative">React Native on Twitter</a>
                  </li>
                  <li className="help-list-entry">
                    <a href="/react-native/blog/">News and Updates</a>
                  </li>
                  <li className="help-list-entry">
                    <a href="https://github.com/facebook/react-native/releases">Latest Releases</a>
                  </li>
                </ul>
              </div>

              <div className="help-col">
                <h2>Join the community</h2>
                <p>
                  Connect with other React Native developers. Show off your project, or ask how other people solved similar problems.
                </p>

                <ul className="help-list">
                  <li className="help-list-entry">
                    <h3>Frequently Asked Questions</h3>
                    <p>
                      Many React Native users are active on Stack Overflow. Browse <a href="http://stackoverflow.com/questions/tagged/react-native">existing questions</a>, or ask your own technical question.
                    </p>
                  </li>
                  <li className="help-list-entry">
                    <h3>React Native Community</h3>
                    <p>
                      If you have an open-ended question or you just want to get a general sense of what React Native folks talk about, check out the <a href="https://www.facebook.com/groups/react.native.community">React Native Community</a> Facebook group. It has thousands of developers and almost all posts get a response.
                    </p>
                  </li>
                  <li className="help-list-entry">
                    <h3>Reactiflux Chat</h3>
                    <p>
                      If you need an answer right away, check out the <a href="https://discord.gg/0ZcbPKXt5bZjGY5n">#react-native</a> channel. There are usually a number of React Native experts there who can help out or point you to somewhere you might want to look.
                    </p>
                  </li>
                </ul>
              </div>

              <div className="help-col">
                <h2>Contribute</h2>
                <p>
                  React Native is open source! Issues and pull requests are welcome.
                </p>

                <ul className="help-list">
                  <li className="help-list-entry">
                    <h3>Get Involved</h3>
                    <p>
                      If you want to contribute, take a look at the list of <a href="https://github.com/facebook/react-native/issues?q=is%3Aopen+is%3Aissue+label%3A%22Good+First+Task%22">good first tasks</a> on GitHub.
                    </p>
                  </li>

                  <li className="help-list-entry">
                    <h3>Feature Requests</h3>
                    <p>
                      If you have a feature request, <a href="https://react-native.canny.io/feature-requests">add it to the list</a> or upvote a similar one. The voting system helps surface which issues are most important to the community.
                    </p>
                  </li>

                  <li className="help-list-entry">
                    <h3>Report a Bug</h3>
                    <p>
                      If you have discovered a bug in React Native, consider submitting a <a href="https://github.com/facebook/react-native/">pull request</a> with a fix. If you don't think you can fix it yourself, you can <a href="https://github.com/facebook/react-native/issues">open an issue</a> on GitHub.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

      </Site>
    );
  }
});

module.exports = support;
