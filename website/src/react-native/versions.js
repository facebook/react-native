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
        release: null
      },
    ].concat(availableDocs.map((version) => {
      const isLatest =  Metadata.config.RN_LATEST_VERSION === version;
      const isRC = Metadata.config.RN_LATEST_VERSION < version;

      var title = version;
      if (isLatest) {
        title = '(current) ' + title;
      }
      if (isRC) {
        title += '-rc';
      }

      return {
        title: title,
        path: isLatest ? '/react-native' : '/react-native/releases/' + version,
        release: 'https://github.com/facebook/react-native/releases/tag/v' + version + '.0' + (isRC ? '-rc' : '')
      }
    }));

    if (!Metadata.config.RN_LATEST_VERSION) {
      versions = [
        {
          title: 'current',
          path: '/react-native',
          release: null
        },
      ].concat(versions);
    }

    return (
      <Site section="versions" title="Documentation archive">
        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content">
            <h1>React Native Versions</h1>
            <p>React Native is following a 2-week train release. Every two weeks, a Release Candidate (rc) branch is created off of master and the previous rc branch is being officially released.</p>
            <table className="versions">
              <tbody>
                {versions.map((version) =>
                  <tr>
                    <th>{version.title}</th>
                    <td><a href={version.path}>Docs</a></td>
                    <td>{version.release && <a href={version.release}>Release Notes</a>}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = versions;
