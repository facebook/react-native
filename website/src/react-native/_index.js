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
          <p></p>
        </section>
      </Site>
    );
  }
});

module.exports = index;
