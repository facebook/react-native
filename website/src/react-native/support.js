/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require('React');
var Site = require('Site');
var center = require('center');
var H2 = require('H2');

var support = React.createClass({
  childContextTypes: {
    permalink: React.PropTypes.string
  },

  getChildContext: function() {
    return {permalink: 'support.html'};
  },
  render: function() {
    return (
      <Site section="support" title="Support">

        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content">
            <h1>Need help?</h1>
            <div className="subHeader"></div>
            <p>
              At Facebook, there are dozens of engineers who work on React Native full-time. But there are far more people in the community who make key contributions and fix things. So if you need help with your React Native app, the right place to go depends on the type of help that you need.
            </p>

            <H2>Technical Questions</H2>
            <p>If you're wondering how to solve a specific technical problem in React Native, the best place to ask is on Stack Overflow. You can check <a href="http://stackoverflow.com/questions/tagged/react-native">existing questions</a> tagged with react-native, <a href="http://stackoverflow.com/questions/ask">ask your own</a>, or just Google it and click on the Stack Overflow answer that will inevitably come up.</p>

            <H2>Random Questions</H2>
            <p>If you have an open-ended question or you just want to get a general sense of what React Native folks talk about, check out the <a href="https://www.facebook.com/groups/react.native.community">React Native Community</a> Facebook group. It has thousands of developers and almost all posts get a response.</p>

            <H2>Urgent Questions</H2>
            <p>If you need an answer right away, check out #react-native on the <a href="https://discord.gg/0ZcbPKXt5bZjGY5n">Reactiflux chat</a>. There are usually a number of React Native experts there who can help out or point you to somewhere you might want to look.</p>

            <H2>Feature Requests</H2>
            <p>React Native uses <a href="https://productpains.com/product/react-native/">Product Pains</a> for feature requests. It has a voting system to surface which issues are most important to the community. So if you have a feature request, add it or upvote a similar one.</p>

            <iframe
              width="100%"
              height="600px"
              scrolling="yes"
              src="https://productpains.com/widget.html?token=3b929306-e0f7-5c94-7d7c-ecc05d059748"
              />

            <H2>Bug Reports</H2>
            <p>If you have discovered a bug in React Native, keep in mind that it's an open source project. Take a look at the <a href="https://github.com/facebook/react-native/">code on GitHub</a>, and see if it's something you could fix yourself. If you don't think you can fix it yourself, you can file it as a GitHub issue. Be sure to providing a crisp description and reproduction of the bug, to improve the chance that someone will be able to help you out.</p>
          </div>
        </section>

      </Site>
    );
  }
});

module.exports = support;
