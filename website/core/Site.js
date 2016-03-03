/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Site
 */

var React = require('React');
var HeaderLinks = require('HeaderLinks');
var Metadata = require('Metadata');

var Site = React.createClass({
  render: function() {
    const path = Metadata.config.RN_DEPLOYMENT_PATH;
    const version = Metadata.config.RN_VERSION;
    var basePath = '/react-native/' + (path ? path + '/' : '');
    var title = this.props.title ? this.props.title + ' – ' : '';
    var currentYear = (new Date()).getFullYear();
    title += 'React Native | A framework for building native apps using React';
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <title>{title}</title>
          <meta name="viewport" content="width=device-width" />
          <meta property="og:title" content={title} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="http://facebook.github.io/react-native/index.html" />
          <meta property="og:image" content="http://facebook.github.io/react-native/img/opengraph.png?2" />
          <meta property="og:description" content="A framework for building native apps using React" />

          <base href={basePath} />

          <link rel="stylesheet" href="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.css" />

          <link rel="shortcut icon" href="img/favicon.png?2" />
          <link rel="stylesheet" href="css/react-native.css" />

          <script type="text/javascript" src="//use.typekit.net/vqa1hcx.js"></script>
          <script type="text/javascript">{'try{Typekit.load();}catch(e){}'}</script>
        </head>
        <body>

          <div className="container">
            <div className="nav-main">
              <div className="wrap">
                <a className="nav-home" href="">
                  <img src="img/header_logo.png" />
                  React Native
                </a>
                <a className="nav-version" href="/react-native/versions.html">
                  {version}
                </a>
                <HeaderLinks section={this.props.section} />
              </div>
            </div>

            {this.props.children}

            <footer className="wrap">
              <div className="center">© {currentYear} Facebook Inc.</div>
            </footer>
          </div>

          <div id="fb-root" />
          <script dangerouslySetInnerHTML={{__html: `
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
            ga('create', 'UA-41298772-2', 'facebook.github.io');
            ga('send', 'pageview');

            !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)
            ){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
          `}} />
          <script type="text/javascript" src="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.js"></script>
          <script src="js/scripts.js" />
        </body>
      </html>
    );
  }
});

module.exports = Site;
