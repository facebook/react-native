/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Footer
 */
'use strict';

var React = require('React');

function getGitHubPath(path) {
  return 'https://github.com/facebook/react-native/blob/master/' + path;
}

var Footer = React.createClass({
  render: function() {
    return (
      <p className="edit-page-block">
        You can <a target="_blank" href={getGitHubPath(this.props.path)}>edit the content above on GitHub</a> and send us a pull request!
      </p>
    );
  }
});

module.exports = Footer;
