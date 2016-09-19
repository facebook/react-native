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
    const algoliaVersion = version === 'next' ? 'master' : version;
    var basePath = '/react-native/' + (path ? path + '/' : '');
    var currentYear = (new Date()).getFullYear();

    var title = this.props.title ? this.props.title : 'React Native | A framework for building native apps using React';

    var twitterCardType = this.props.image? 'summary_large_image' : 'summary';

    var metaTags = [
      { charSet: "utf-8" },
      {
        httpEquiv: "X-UA-Compatible",
        content: "IE=edge,chrome=1",
      },
      {
        name: "viewport",
        content: "width=device-width",
      },
      // Facebook
      { property: "fb:app_id", content: "1677033832619985", },
      { property: "fb:admins", content: "121800083", },
      // Open Graph
      {
        property: "og:site_name",
        content: "React Native",
      },
      {
        property: "og:title",
        content: title,
      },
      {
        property: "og:url",
        content: "https://facebook.github.io/react-native/" + (this.props.path ? this.props.path : "index.html"),
      },
      {
        property: "og:image",
        content: this.props.image ? this.props.image : "http://facebook.github.io/react-native/img/opengraph.png",
      },
      {
        property: "og:description",
        content: this.props.description ? this.props.description : "A framework for building native apps using React",
      },
      // Twitter Cards
      {
        name: "twitter:site",
        content: "@reactnative",
      },
      {
        name: "twitter:card",
        content: twitterCardType,
      },
    ];

    var typeTags = [{
      property: "og:type",
      content: "website",
    }];
    if (this.props.author) {
      typeTags = [{
        property: "og:type",
        content: "article",
      }, {
        property: "article:author",
        content: this.props.author,
      }];
    }
    metaTags.push(...typeTags);

    if (this.props.authorTwitter) {
      metaTags.push({
        name: "twitter:creator",
        content: "@" + this.props.authorTwitter,
      });
    }

    return (
      <html>
        <head>
          <title>{title}</title>
          {
            metaTags.map((tag, index) =>
              <meta key={index} {...tag} />)
          }

          <base href={basePath} />

          <link rel="stylesheet" href="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.css" />

          <link rel="shortcut icon" href="img/favicon.png?2" />
          <link rel="stylesheet" href="css/react-native.css" />

          <script type="text/javascript" src="//use.typekit.net/vqa1hcx.js"></script>
          <script type="text/javascript">{'try{Typekit.load();}catch(e){}'}</script>
        </head>
        <body>
          <script dangerouslySetInnerHTML={{__html: `window.fbAsyncInit = function() {FB.init({appId:'1677033832619985',xfbml:true,version:'v2.7'});};(function(d, s, id){var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) {return;}js = d.createElement(s); js.id = id;js.src = '//connect.facebook.net/en_US/sdk.js';fjs.parentNode.insertBefore(js, fjs);}(document, 'script','facebook-jssdk'));`}} />
          <script dangerouslySetInnerHTML={{__html: `window.twttr=(function(d,s, id){var js,fjs=d.getElementsByTagName(s)[0],t=window.twttr||{};if(d.getElementById(id))return t;js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js, fjs);t._e = [];t.ready = function(f) {t._e.push(f);};return t;}(document, "script", "twitter-wjs"));`}} />
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
          <script type="text/javascript" src="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.js"></script>
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

            docsearch({
              apiKey: '2c98749b4a1e588efec53b2acec13025',
              indexName: 'react-native-versions',
              inputSelector: '#algolia-doc-search',
              algoliaOptions: { facetFilters: [ "tags:${algoliaVersion}" ], hitsPerPage: 5 }
            });
          `}} />
          <script src="js/scripts.js" />
        </body>
      </html>
    );
  }
});

module.exports = Site;
