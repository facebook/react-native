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
'use strict';

var HeaderLinks = require('HeaderLinks');
var Metadata = require('Metadata');
var React = require('React');

var Site = React.createClass({
  render: function() {
    const path = Metadata.config.RN_DEPLOYMENT_PATH;
    const version = Metadata.config.RN_VERSION;
    const algoliaVersion = version === 'next' ? 'master' : version;
    var basePath = '/react-native/' + (path ? path + '/' : '');
    var currentYear = new Date().getFullYear();

    var title = this.props.title
      ? this.props.title
      : 'React Native | A framework for building native apps using React';

    var metaTags = [
      { charSet: 'utf-8' },
      {
        httpEquiv: 'X-UA-Compatible',
        content: 'IE=edge,chrome=1',
      },
      {
        name: 'viewport',
        content: 'width=device-width',
      },
      // Facebook
      { property: 'fb:app_id', content: '1677033832619985' },
      { property: 'fb:admins', content: '121800083' },
      // Open Graph
      {
        property: 'og:site_name',
        content: 'React Native',
      },
      {
        property: 'og:title',
        content: title,
      },
      {
        property: 'og:url',
        content: 'https://facebook.github.io/react-native/' +
          (this.props.path ? this.props.path : 'index.html'),
      },
      {
        property: 'og:image',
        content: this.props.image
          ? this.props.image
          : 'https://facebook.github.io/react-native/img/opengraph.png',
      },
      {
        property: 'og:description',
        content: this.props.description
          ? this.props.description
          : 'A framework for building native apps using React',
      },
      // Twitter Cards
      {
        name: 'twitter:site',
        content: '@reactnative',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ];

    var typeTags = [
      {
        property: 'og:type',
        content: 'website',
      },
    ];
    if (this.props.author) {
      typeTags = [
        {
          property: 'og:type',
          content: 'article',
        },
        {
          property: 'article:author',
          content: this.props.author,
        },
      ];
    }
    metaTags.push(...typeTags);

    if (this.props.authorTwitter) {
      metaTags.push({
        name: 'twitter:creator',
        content: '@' + this.props.authorTwitter,
      });
    }

    return (
      <html>
        <head>
          <title>{title}</title>
          {metaTags.map((tag, index) => <meta key={index} {...tag} />)}

          <base href={basePath} />

          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.css"
          />

          <link rel="shortcut icon" href="img/favicon.png?2" />
          <link rel="stylesheet" href="css/react-native.css" />

          <link
            rel="alternate"
            type="application/rss+xml"
            title="React Native Blog"
            href="https://facebook.github.io/react-native/blog/feed.xml"
          />
          <link
            href="//cdn-images.mailchimp.com/embedcode/horizontal-slim-10_7.css"
            rel="stylesheet"
            type="text/css"
          />

          <script type="text/javascript" src="//use.typekit.net/vqa1hcx.js" />
          <script type="text/javascript">
            {'try{Typekit.load();}catch(e){}'}
          </script>
        </head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: "window.fbAsyncInit = function() {FB.init({appId:'1677033832619985',xfbml:true,version:'v2.7'});};(function(d, s, id){var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) {return;}js = d.createElement(s); js.id = id;js.src = '//connect.facebook.net/en_US/sdk.js';fjs.parentNode.insertBefore(js, fjs);}(document, 'script','facebook-jssdk'));",
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: "window.twttr=(function(d,s, id){var js,fjs=d.getElementsByTagName(s)[0],t=window.twttr||{};if(d.getElementById(id))return t;js=d.createElement(s);js.id=id;js.src='https://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js, fjs);t._e = [];t.ready = function(f) {t._e.push(f);};return t;}(document, 'script', 'twitter-wjs'));",
            }}
          />
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

            <footer className="nav-footer">
              <section className="sitemap">
                <a href="/react-native" className="nav-home">
                  <img
                    src="img/header_logo.png"
                    alt="React Native"
                    width="66"
                    height="58"
                  />
                </a>
                <div>
                  <h5><a href="docs/">Docs</a></h5>
                  <a href="docs/getting-started.html">Getting Started</a>
                  <a href="docs/tutorial.html">Tutorial</a>
                  <a href="docs/integration-with-existing-apps.html">
                    Integration With Existing Apps
                  </a>
                  <a href="docs/more-resources.html">More Resources</a>
                </div>
                <div>
                  <h5><a href="/react-native/support.html">Community</a></h5>
                  <a href="/react-native/showcase.html">Showcase</a>
                  <a
                    href="http://www.meetup.com/topics/react-native/"
                    target="_blank">
                    Upcoming Events
                  </a>
                  <a
                    href="https://www.facebook.com/groups/react.native.community"
                    target="_blank">
                    Facebook Group
                  </a>
                  <a href="https://twitter.com/reactnative" target="_blank">
                    Twitter
                  </a>
                </div>
                <div>
                  <h5><a href="/react-native/support.html">Help</a></h5>
                  <a
                    href="http://stackoverflow.com/questions/tagged/react-native"
                    target="_blank">
                    Stack Overflow
                  </a>
                  <a href="https://discord.gg/0ZcbPKXt5bZjGY5n">
                    Reactiflux Chat
                  </a>
                  <a href="/react-native/versions.html" target="_blank">
                    Latest Releases
                  </a>
                  <a
                    href="https://react-native.canny.io/feature-requests"
                    target="_blank">
                    Feature Requests
                  </a>
                </div>
                <div>
                  <h5>More</h5>
                  <a href="/react-native/blog">Blog</a>
                  <a
                    href="https://github.com/facebook/react-native"
                    target="_blank">
                    GitHub
                  </a>
                  <a href="http://facebook.github.io/react/" target="_blank">
                    React
                  </a>
                </div>
              </section>
              <section className="newsletter">
                <div id="mc_embed_signup">
                  <form
                    action="//reactnative.us10.list-manage.com/subscribe/post?u=db0dd948e2b729ee62625b1a8&amp;id=47cd41008f"
                    method="post"
                    id="mc-embedded-subscribe-form"
                    name="mc-embedded-subscribe-form"
                    className="validate"
                    target="_blank"
                    noValidate>
                    <div id="mc_embed_signup_scroll">
                      <label htmlFor="mce-EMAIL">
                        <h5>Get the React Native Newsletter</h5>
                      </label>
                      <input
                        type="email"
                        value=""
                        name="EMAIL"
                        className="email"
                        id="mce-EMAIL"
                        placeholder="email address"
                        required
                      />
                      <div
                        style={{ position: 'absolute', left: '-5000px' }}
                        aria-hidden="true">
                        <input
                          type="text"
                          name="b_db0dd948e2b729ee62625b1a8_47cd41008f"
                          tabIndex="-1"
                          value=""
                        />
                      </div>
                      <div className="clear">
                        <input
                          type="submit"
                          value="Sign up"
                          name="subscribe"
                          id="mc-embedded-subscribe"
                          className="button"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              <a
                href="https://code.facebook.com/projects/"
                target="_blank"
                className="fbOpenSource">
                <img
                  src="img/oss_logo.png"
                  alt="Facebook Open Source"
                  width="170"
                  height="45"
                />
              </a>
              <section className="copyright">
                Copyright © {currentYear} Facebook Inc.
              </section>
            </footer>
          </div>

          <div id="fb-root" />
          <script
            type="text/javascript"
            src="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.js"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
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
          `,
            }}
          />
          <script src="js/scripts.js" />
          {/* Mailchimp Inline form-submission script for the React Native newsletter sign up form */}
          <script
            type="text/javascript"
            src="//s3.amazonaws.com/downloads.mailchimp.com/js/mc-validate.js"
          />
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: "(function($) {window.fnames = new Array(); window.ftypes = new Array();fnames[0]='EMAIL';ftypes[0]='email';fnames[1]='FNAME';ftypes[1]='text';fnames[2]='LNAME';ftypes[2]='text';}(jQuery));var $mcj = jQuery.noConflict(true);",
            }}
          />
          <script type="text/javascript" src="https://snack.expo.io/embed.js" />
        </body>
      </html>
    );
  },
});
module.exports = Site;
