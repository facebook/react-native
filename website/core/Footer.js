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

class Footer extends React.Component {
  render() {
    return (
      <p className="edit-page-block">
        <a target="_blank" href={getGitHubPath(this.props.path)}>Improve this page</a> by sending a pull request!
      </p>
    );
  }
}

module.exports = Footer;
