/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var Prism = require('Prism');
var React = require('React');
var Site = require('Site');

var apps = [
  {
    name: 'Facebook',
    icon: 'https://lh3.googleusercontent.com/ZZPdzvlpK9r_Df9C3M7j1rNRi7hhHRvPhlklJ3lfi5jk86Jd1s0Y5wcQ1QgbVaAP5Q=w300',
    infoLink: 'https://itunes.apple.com/app/facebook/id284882215',
  },
  {
    name: 'Facebook Ads Manager',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/9e/16/86/9e1686ef-cc55-805a-c977-538ddb5e6832/mzl.gqbhwitj.png',
    infoLink: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
  },
  {
    name: 'Facebook Groups',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple69/v4/57/f8/4c/57f84c0c-793d-5f9a-95ee-c212d0369e37/mzl.ugjwfhzx.png',
    infoLink: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
  },
  {
    name: 'Instagram',
    icon: 'http://a4.mzstatic.com/us/r30/Purple62/v4/1f/8d/f9/1f8df910-8ec7-3b8e-0104-d44e869f4d65/icon175x175.jpeg',
    infoLink: 'https://www.instagram.com/',
  },
  {
    name: 'Airbnb',
    icon: 'https://a2.muscache.com/airbnb/static/icons/apple-touch-icon-180x180-bcbe0e3960cd084eb8eaf1353cf3c730.png',
    infoLink: 'https://www.airbnb.com/mobile',
  },
  {
    name: 'Baidu(手机百度)',
    icon: 'http://a3.mzstatic.com/us/r30/Purple62/v4/90/7c/9b/907c9b4e-556d-1a45-45d4-0ea801719abd/icon175x175.png',
    infoLink: 'http://baike.baidu.com/link?url=TW8YhcVN4tO_Jz5VqMclCjGhf12EEqMD_TeVC6efe2REZlx80r6T0dX96hdmNl36XogLyExXzrvFU9rFeqxg_K',
  },
  {
    name: 'Discord',
    icon: 'http://a5.mzstatic.com/us/r30/Purple5/v4/c1/2f/4c/c12f4cba-1d9a-f6bf-2240-04085d3470ec/icon175x175.jpeg',
    infoLink: 'https://itunes.apple.com/us/app/discord-chat-for-gamers/id985746746?mt=8',
  },
  {
    name: 'Gyroscope',
    icon: 'https://media.gyrosco.pe/images/magneto/180x180.png',
    infoLink: 'https://itunes.apple.com/app/apple-store/id1104085053?pt=117927205&ct=website&mt=8',
  },
  {
    name: 'li.st',
    icon: 'https://lh3.googleusercontent.com/tXt0HgJ7dCgOnuQ-lQr1P7E57mnOYfwXhRsV9lGcPwHPVvrDAN6YmpLVFgy88qKrkFI=w300',
    infoLink: 'https://play.google.com/store/apps/details?id=st.li.listapp',
  },
  {
    name: 'QQ',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6633_1461768893/96',
    infoLink: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.mobileqq',
  },
  {
    name: 'Townske',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/8b/42/20/8b4220af-5165-91fd-0f05-014332df73ef/icon175x175.png',
    infoLink: 'https://itunes.apple.com/us/app/townske-stunning-city-guides/id1018136179?ls=1&mt=8',
  },
  {
    name: 'Vogue',
    icon: 'http://a2.mzstatic.com/us/r30/Purple30/v4/06/24/92/0624927f-a389-746c-27f9-e2466d59e55b/icon175x175.jpeg',
    infoLink: 'https://itunes.apple.com/app/apple-store/id1087973225?pt=45076&ct=site-promo&mt=8',
  }
];

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
        {this._renderIcon(app)}
      </div>
    );
  },

  _renderIcon: function(app) {
    return (
      <a href={app.infoLink}>
        <img src={app.icon} alt={app.name} />
      </a>
    );
  },

  _renderTitle: function(app) {
    return (
      <a href={app.infoLink}>
        <h3>{app.name}</h3>
      </a>
    );
  },
});

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>React Native</strong></div>
            <div className="minitext">
              Learn once, write anywhere: Build mobile apps with React
            </div>
          </div>

          <div className="buttons-unit">
            <a href="docs/getting-started.html#content" className="button">Get started with React Native</a>
          </div>
        </div>

        <section className="content wrap">

          <div style={{margin: '40px auto', maxWidth: 800}}>

            <h2>Build Native Mobile Apps using JavaScript and React</h2>
            <p>
              React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.
            </p>

            <Prism>

{`import React, { Component } from 'react';
import { Text, View } from 'react-native';

class WhyReactNativeIsSoGreat extends Component {
  render() {
    return (
      <View>
        <Text>
          If you like React on the web, you'll like React Native.
        </Text>
        <Text>
          You just use native components like 'View' and 'Text',
          instead of web components like 'div' and 'span'.
        </Text>
      </View>
    );
  }
}`}
            </Prism>

            <h2>A React Native App is a Real Mobile App</h2>
            <p>
              With React Native, you don't build a “mobile web app”, an “HTML5 app”, or a “hybrid app”. You build a real mobile app that's indistinguishable from an app built using Objective-C or Java. React Native uses the same fundamental UI building blocks as regular iOS and Android apps. You just put those building blocks together using JavaScript and React.
            </p>

            <Prism>
{`import React, { Component } from 'react';
import { Image, ScrollView, Text } from 'react-native';

class AwkwardScrollingImageWithText extends Component {
  render() {
    return (
      <ScrollView>
        <Image source={{uri: 'https://i.chzbgr.com/full/7345954048/h7E2C65F9/'}} />
        <Text>
          On iOS, a React Native ScrollView uses a native UIScrollView.
          On Android, it uses a native ScrollView.

          On iOS, a React Native Image uses a native UIImageView.
          On Android, it uses a native ImageView.

          React Native wraps the fundamental native components, giving you
          the performance of a native app, plus the clean design of React.
        </Text>
      </ScrollView>
    );
  }
}`}
            </Prism>

            <h2>Don't Waste Time Recompiling</h2>
            <p>
              React Native lets you build your app faster. Instead of recompiling, you can reload your app instantly. With hot reloading, you can even run new code while retaining your application state. Give it a try - it's a magical experience.
            </p>
            <br />
            <img src='https://media.giphy.com/media/13WZniThXy0hSE/giphy.gif' />

            <h2>Use Native Code When You Need To</h2>
            <p>
              React Native combines smoothly with components written in Objective-C, Java, or Swift. It's simple to drop down to native code if you need to optimize a few aspects of your application. It's also easy to build part of your app in React Native, and part of your app using native code directly - that's how the Facebook app works.
            </p>

            <Prism>
{`import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { TheGreatestComponentInTheWorld } from './your-native-code';

class SomethingFast extends Component {
  render() {
    return (
      <View>
        <TheGreatestComponentInTheWorld />
        <Text>
          TheGreatestComponentInTheWorld could use native Objective-C,
          Java, or Swift - the product development process is the same.
        </Text>
      </View>
    );
  }
}`}
            </Prism>
          </div>

          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/getting-started.html#content" className="button">Get started with React Native</a>
            </div>
          </section>

          <section className="home-showcase-section">
            <h2>Who's using React Native?</h2>
            <p>
              Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!
            </p>
            <AppList apps={apps} />
            <p className="footnote">
              Some of these are hybrid native/React Native apps.
            </p>
            <div className="buttons-unit">
              <a href="/react-native/showcase.html" className="button">More React Native apps</a>
            </div>
          </section>
        </section>
      </Site>
    );
  }
});

module.exports = index;
