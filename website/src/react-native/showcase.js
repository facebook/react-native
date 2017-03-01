/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

var React = require('React');
var Site = require('Site');
var Metadata = require('Metadata');

/*
 * Thousands of applications use React Native, so we can't list all of them
 * in our showcase. To be useful to someone looking through the showcase,
 * either the app must be something that most readers would recognize, or the
 * makers of the application must have posted useful technical content about the
 * making of the app. It also must be useful considering that the majority of
 * readers only speak English. So, each app in the showcase should link to
 * either:
 *
 * 1/ An English-language news article discussing the app, built either by a
 *    funded startup or for a public company
 * 2/ An English-language technical post on a funded startup or public company
 *    blog discussing React Native
 *
 * The app should be available for download in the App Store or Play Store.
 *
 * If you believe your app meets the above critera, add it to the end of the
 * array in the `../../showcase.json` file in this repository and open a pull
 * request. PRs that do not follow these guidelines may be closed without
 * comment.
 *
 * Use the 'infoLink' and 'infoTitle' keys to reference the news article or
 * technical post. Your app icon should be hosted on a CDN and be no smaller
 * than 200px by 200px. Use the `icon` key to reference your app icon.
 *
 * Please use the following format when adding your app to the showcase:
 *
 * {
 *   name: 'App Name in English (Non-English name inside parenthesis, if any)',
 *   icon: 'CDN URL to your app icon'
 *   linkAppStore: 'https://itunes.apple.com/app/XXXXX'
 *   linkPlayStore: "https://play.google.com/store/apps/details?id=XXXXX",
 *   infoLink: 'Link to content that satisfies critera above',
 *   infoTitle: 'Short title for the infoLink',
 *   pinned: false,
 * }
 *
 * Do not set 'pinned' to true as the pinned list is reserved for a small number
 * of hand picked apps.
 */
const showcaseApps = Metadata.showcaseApps;

const pinnedApps = showcaseApps.filter(app => {
  return app.pinned;
});

const featuredApps = showcaseApps.filter(app => {
  return !app.pinned;
}).sort(function(a, b) {
  return a.name.localeCompare(b.name);
});

const apps = pinnedApps.concat(featuredApps);

var AppIcon = React.createClass({
  render: function() {
    return <img src={this.props.icon} alt={this.props.appName} />;
  }
});

var AppList = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    );
  },

  _renderApp: function(app, i) {
    return (
      <div className="showcase" key={i}>
        <div>
          {this._renderAppIcon(app)}
          {this._renderAppName(app)}
          {this._renderLinks(app)}
          {this._renderInfo(app)}
        </div>
      </div>
    );
  },

  _renderAppIcon: function(app) {
    return <img src={app.icon} alt={app.name} />;
  },

  _renderAppName: function(app) {
    return <h3>{app.name}</h3>;
  },

  _renderInfo: function(app) {
    let info = null;
    if (app.infoLink) {
      info = <p><a href={app.infoLink} target="_blank">{app.infoTitle}</a></p>;
    }

    return (
      {info}
    );
  },

  _renderLinks: function(app) {
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
            <div className="subHeader" />
            <p>Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!</p>

            <div className="inner-content">
              <AppList apps={apps} />
            </div>

            <div className="inner-content">
              <p>Some of these are hybrid native/React Native apps. If you built a popular application using React Native, we'd love to have your app on this showcase. Check out the <a href="https://github.com/facebook/react-native/blob/master/website/src/react-native/showcase.js">guidelines on GitHub</a> to update this page.</p>
            </div>

            <div className="inner-content">
              <p>Also, <a href="https://github.com/ReactNativeNews/React-Native-Apps">a curated list of open source React Native apps</a> is being kept by React Native News.</p>
            </div>

          </div>

        </section>
      </Site>
    );
  }
});

module.exports = showcase;
