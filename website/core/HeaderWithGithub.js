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

var H = require('Header');
var React = require('React');

function getVersionedGithubPath(path, version='next') {
  return [
    'https://github.com/facebook/react-native/blob',
    version === 'next' ? 'master' : version + '-stable',
    path
    ].join('/')
}

var HeaderWithGithub = React.createClass({

  contextTypes: {
    version: React.PropTypes.string
  },

  render: function() {
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
                href={getVersionedGithubPath(this.props.path, this.context.version)}>
                Edit on GitHub
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }
});

module.exports = HeaderWithGithub;
