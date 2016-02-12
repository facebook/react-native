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
var Metadata = require('Metadata');

var versions = React.createClass({
  render: function() {

    var availableDocs = (Metadata.config.RN_AVAILABLE_DOCS_VERSIONS || '').split(',');
    var versions = [
      {
        title: 'next',
        path: '/react-native/releases/next',
      },
      {
        title: 'stable',
        path: '/react-native',
      },
    ].concat(availableDocs.map((version) => {
      return {
        title: version,
        path: '/react-native/releases/' + version
      }
    }));
    var versionsLi = versions.map((version) =>
      <li><a href={version.path}>{version.title}</a></li>
    );
    return (
      <Site section="versions" title="Documentation archive">
        <section className="content wrap versions documentationContent">
          <h1>Documentation archive</h1>
          <ul>
            {versionsLi}
          </ul>
        </section>
      </Site>
    );
  }
});

module.exports = versions;
