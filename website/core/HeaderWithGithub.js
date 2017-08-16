/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HeaderWithGithub
 */
'use strict';

var H = require('Header');
var React = require('React');

var PropTypes = require('prop-types');

function getGitHubPath(path) {
  return  'https://github.com/facebook/react-native/blob/master/' + path;
}

class HeaderWithGithub extends React.Component {
  render() {
    return (
      <table width="100%">
        <tbody>
          <tr>
            <td>
              <H level={this.props.level || 3} toSlug={this.props.title}>
                {this.props.title}
              </H>
            </td>
            <td style={{textAlign: 'right'}}>
              <a
                target="_blank"
                href={getGitHubPath(this.props.path)}>
                Edit on GitHub
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
}

HeaderWithGithub.contextTypes = {
  version: PropTypes.string
};

module.exports = HeaderWithGithub;
