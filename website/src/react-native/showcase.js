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

var featured = require('./showcaseData').featured;
var pinned = require('./showcaseData').pinned;

featured.sort(function(a, b) {
  return a.name.localeCompare(b.name);
});
var apps = pinned.concat(featured);

var AppList = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    );
  },

  _renderApp: function(app, i) {
    var inner = (
      <div>
        {this._renderIcon(app)}
        {this._renderTitle(app)}
        {this._renderLinks(app)}
        {this._renderInfo(app)}
      </div>
    );

    if (app.linkAppStore && app.linkPlayStore) {
      return (<div className="showcase" key={i}>{inner}</div>);
    }

    var className = "showcase";
    if (app.pinned) {
      // className = "showcase pinned";
    }

    return (
      <div className={className} key={i}>
        {inner}
      </div>
    );
  },

  _renderIcon: function(app) {
    var icon = (
      <img src={app.icon} alt={app.name} />
    );

    return (
      {icon}
    );
  },

  _renderTitle: function(app) {
    // if (app.pinned) {
    //   return;
    // }

    var title = (
      <h3>{app.name}</h3>
    );

    return (
      {title}
    );
  },

  _renderInfo: function(app) {
    // if (app.pinned) {
    //   return;
    // }

    if (!app.infoLink) {
      return;
    }

    return (
      <p><a href={app.infoLink} target="_blank">{app.infoTitle}</a></p>
    );
  },

  _renderLinks: function(app) {
    if (app.pinned) {
      return;
    }

    if (!app.linkAppStore && !app.linkPlayStore) {
      return;
    }

    var linkAppStore = app.linkAppStore ? <a href={app.linkAppStore} target="_blank">iOS</a> : '';
    var linkPlayStore = app.linkPlayStore ? <a href={app.linkPlayStore} target="_blank">Android</a> : '';

    return (
      <p>
        {linkAppStore}
        {linkAppStore && linkPlayStore ? ' · ' : ''}
        {linkPlayStore}
      </p>
    );
  },
});

var showcase = React.createClass({
  render: function() {
    return (
      <Site section="showcase" title="Showcase">
        <section className="content wrap documentationContent nosidebar showcaseSection">
          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>Who's using React Native?</h1>
            <div className="subHeader"></div>
            <p>Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!</p>

            <div className="inner-content">
              <AppList apps={apps} />
            </div>

            <p className="footnote">
              Some of these are hybrid native/React Native apps.
            </p>

            <div className="inner-content">
              <p>If you built a popular application using React Native, we'd love to have your app on this showcase. Check out the <a href="https://github.com/facebook/react-native/blob/master/website/src/react-native/showcaseData.js">guidelines on GitHub</a> to update this page.</p>
            </div>

          </div>

        </section>
      </Site>
    );
  }
});

module.exports = showcase;
