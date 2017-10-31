/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const React = require("react");

const CompLibrary = require("../core/CompLibrary.js");
const Container = CompLibrary.Container;

const siteConfig = require(process.cwd() + "/siteConfig.js");

const showcaseApps = siteConfig.users;
const pinnedApps = showcaseApps.filter(app => {
  return app.pinned;
});
const featuredApps = showcaseApps.filter(app => {
  return !app.pinned;
}).sort(function(a, b) {
  return a.name.localeCompare(b.name);
});
const apps = pinnedApps.concat(featuredApps);    

class ShowcaseAppIcon extends React.Component {
  render() {
    return (
      <a href={this.props.linkUri}>
        <img src={this.props.iconUri} alt={this.props.name} />
      </a>
    );
  }
}

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
      info
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

class Users extends React.Component {
  render() {
    return (
      <div className="pageContainer">
        <Container padding={["bottom"]}>
          <div className="showcaseSection">
            <div className="prose">
              <h1>Who's using React Native?</h1>
              <p>Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!</p>
            </div>
            <div className="logos">
              <AppList apps={apps} />
            </div>
            <p>Some of these are hybrid native/React Native apps.</p>
            <p>A curated list of <a href="https://github.com/ReactNativeNews/React-Native-Apps">open source React Native apps</a> is also being kept by React Native News.</p>
          </div>
        </Container>
      </div>
    );
  }
}

Users.defaultProps = {
  language: "en"
};

module.exports = Users;
