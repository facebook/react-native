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
        title: 'master',
        path: '/react-native/releases/next',
      },
    ].concat(availableDocs.map((version) => {
      const isLatest =  Metadata.config.RN_LATEST_VERSION === version;
      return {
        title: isLatest ? `${version} + (current)` : version,
        path: isLatest ? '/react-native' : '/react-native/releases/' + version
      }
    }));

    if (!Metadata.config.RN_LATEST_VERSION) {
      versions = [
        {
          title: 'current',
          path: '/react-native',
        },
      ].concat(versions);
    }

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
