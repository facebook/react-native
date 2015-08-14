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

var showcase = React.createClass({
  render: function() {
    return (
      <Site section="showcase" title="Showcase">

        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content">
            <h1>Apps using React Native</h1>
            <div className="subHeader"></div>
            <p>
              Here is a list of apps using <strong>React Native</strong>. Submit a pull request on <a href="https://github.com/facebook/react-native">GitHub</a> to list your app.
            </p>

            <div className="showcase">
              <center>  
                <img src="http://placehold.it/175x175" alt="RNAPP" />
                <h3>RN APP</h3>
                <p>By <a href="https://facebook.github.io/react-native/">RN APP</a></p>
              </center>
            </div>

            <div className="showcase">
              <center>  
                <img src="http://placehold.it/175x175" alt="RNAPP" />
                <h3>RN APP</h3>
                <p>By <a href="https://facebook.github.io/react-native/">RN APP</a></p>
              </center>
            </div>
            
          </div>
        </section>

      </Site>
    );
  }
});

module.exports = showcase;
