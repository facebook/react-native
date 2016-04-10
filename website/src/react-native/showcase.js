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
var center = require('center');

var apps = require('./showcase/apps');
var featured = require('./showcase/featured');
var openSource = require('./showcase/openSource');

var AppList = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.apps.sort(function (a, b) {
          return a.name.localeCompare(b.name);
        }).map(this._renderApp)}
      </div>
    )
  },

  _renderApp: function(app, i) {
    var inner = (
      <div>
        <img src={app.icon} alt={app.name} />
        <h3>{app.name}</h3>
        {app.linkAppStore && app.linkPlayStore ? this._renderLinks(app) : null}
        <p>By {app.author}</p>
        {this._renderBlogPosts(app)}
				{this._renderSourceLink(app)}
        {this._renderVideos(app)}
      </div>
    );

    if (app.linkAppStore && app.linkPlayStore) {
      return (<div className="showcase" key={i}>{inner}</div>);
    }

    return (
      <div className="showcase" key={i}>
        <a href={app.link} target="_blank">
          {inner}
        </a>
      </div>
    );
  },

  _renderBlogPosts: function(app) {
    if (!app.blogs) {
      return;
    }

    if (app.blogs.length === 1) {
      return (
        <p><a href={app.blogs[0]} target="_blank">Blog post</a></p>
      );
    } else if (app.blogs.length > 1) {
      return (
        <p>Blog posts: {app.blogs.map(this._renderBlogPost)}</p>
      );
    }
  },

  _renderBlogPost: function(url, i) {
    return (
      <a href={url} target="_blank">
        {i + 1}&nbsp;
      </a>
    );
  },

	_renderSourceLink: function(app) {
    if (!app.source) {
      return;
    }

    return (
      <p><a href={app.source} target="_blank">Source</a></p>
    );
  },

  _renderVideos: function(app) {
    if (!app.videos) {
      return;
    }

    if (app.videos.length === 1) {
      return (
        <p><a href={app.videos[0]} target="_blank">Video</a></p>
      );
    } else if (app.videos.length > 1) {
      return (
        <p>Videos: {app.videos.map(this._renderVideo)}</p>
      );
    }
  },

  _renderVideo: function(url, i) {
    return (
      <a href={url} target="_blank">
        {i + 1}&nbsp;
      </a>
    );
  },

  _renderLinks: function(app) {
    return (
      <p>
        <a href={app.linkAppStore} target="_blank">iOS</a> -
        <a href={app.linkPlayStore} target="_blank">Android</a>
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
            <h1 style={{textAlign: 'center'}}>Apps using React Native</h1>
            <div className="subHeader"></div>
            <p>The following is a list of some of the public apps using <strong>React Native</strong> and are published on the Apple App Store or the Google Play Store. Not all are implemented 100% in React Native -- many are hybrid native/React Native. Can you tell which parts are which? :)</p>
            <p>Want to add your app? Found an app that no longer works or no longer uses React Native? Please submit a pull request on <a href="https://github.com/facebook/react-native">GitHub</a> to update this page!</p>
          </div>

          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>Featured Apps</h1>
            <div className="subHeader"></div>
            <p>These are some of the most well-crafted React Native apps that we have come across.<br/>Be sure to check them out to get a feel for what React Native is capable of!</p>
          </div>
          <div className="inner-content">
            <AppList apps={featured} />
          </div>

          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>Open Source Apps</h1>
            <p>These are apps, which are completely open source. If you need some inspiration how to solve a given problem with react-native, they may be a good place for research, more examples may be found at the curated list of <a href="https://github.com/jondot/awesome-react-native#examples">awesome-react-native</a>.</p>
          </div>
          <div className="inner-content">
            <AppList apps={openSource} />
          </div>

          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>All Apps</h1>
            <p>Not all apps can be featured, otherwise we would have to create some other category like &quot;super featured&quot; and that's just silly. But that doesn't mean you shouldn't check these apps out!</p>
          </div>
          <div className="inner-content">
            <AppList apps={apps} />
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = showcase;
