/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

const Metadata = require('Metadata');
const React = require('React');
const ShowcaseAppIcon = require('ShowcaseAppIcon');
const Site = require('Site');

/*
 * Please don't send pull requests to showcase.json. For consistency the
 * Showcase is now managed by people on the open source team at Facebook.
 *
 * Thousands of applications use React Native, so we can't list all of them
 * in our showcase. To be useful to someone looking through the showcase the
 * app must be something that most readers would recognize.
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

class AppList extends React.Component {
  constructor(props, context) {
    super(props, context);

    this._renderApp = this._renderApp.bind(this);
    this._renderAppIcon = this._renderAppIcon.bind(this);
    this._renderAppName = this._renderAppName.bind(this);
    this._renderInfo = this._renderInfo.bind(this);
    this._renderLinks = this._renderLinks.bind(this);
  }

  render() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    );
  }

  _renderApp(app, i) {
    return (
      <div className="showcase" key={i}>
        <div>
          <ShowcaseAppIcon
            iconUri={app.icon}
            name={app.name}
            linkUri={app.infoLink} />
          {this._renderAppName(app.name)}
          {this._renderLinks(app)}
          {this._renderInfo(app.infoTitle, app.infoLink)}
        </div>
      </div>
    );
  }

  _renderAppIcon(app) {
    return <img src={app.icon} alt={app.name} />;
  }

  _renderAppName(name) {
    return <h3>{name}</h3>;
  }

  _renderInfo(title, uri) {
    let info = null;
    if (uri) {
      info = <p><a href={uri} target="_blank">{title}</a></p>;
    }

    return (
      {info}
    );
  }

  _renderLinks(app) {
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
  }
}

class showcase extends React.Component {
  render() {
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
              <p>
                Some of these are hybrid native/React Native apps.
              </p>
            </div>

            <div className="inner-content">
              <p>
                A curated list of <a href="https://github.com/ReactNativeNews/React-Native-Apps">open source React Native apps</a> is also being kept by React Native News.
              </p>
            </div>

          </div>

        </section>
      </Site>
    );
  }
}

module.exports = showcase;
