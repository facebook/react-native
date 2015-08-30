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

var apps = [
  {
    name: 'Beetroot',
    icon: 'http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/66/fd/dd/66fddd70-f848-4fc5-43ee-4d52197ccab8/pr_source.png',
    link: 'https://itunes.apple.com/us/app/beetroot/id1016159001?ls=1&mt=8',
    author: 'Alex Duckmanton',
  },
  {
    name: 'Discovery VR',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/d1/d5/f4/d1d5f437-9f6b-b5aa-5fe7-47bd19f934bf/icon175x175.png',
    link:  'https://itunes.apple.com/us/app/discovery-vr/id1030815031?mt=8',
    author: 'Discovery Communications',
  },
  {
    name: 'DropBot',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/fb/df/73/fbdf73e0-22d2-c936-3115-1defa195acba/icon175x175.png',
    link:  'https://itunes.apple.com/us/app/dropbot-phone-replacement/id1000855694?mt=8',
    author: 'Peach Labs',
  },
  {
    name: 'F8',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple5/v4/bf/d9/50/bfd9504e-a1bd-67c5-b50b-24e97016dae9/pr_source.jpg',
    link: 'https://itunes.apple.com/us/app/f8/id853467066?mt=8',
    author: 'Facebook',
  },
  {
    name: 'Facebook Groups',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple69/v4/57/f8/4c/57f84c0c-793d-5f9a-95ee-c212d0369e37/mzl.ugjwfhzx.png',
    link: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
    author: 'Facebook',
  },
  {
    name: 'FB Ads Manager - Android',
    icon: 'https://lh3.googleusercontent.com/ODKlFYm7BaNiLMEEDO2b4DOCU-hmS1-Fg3_x_lLUaJZ0ssFsxciSoX1dYERaWDJuEs8=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.facebook.adsmanager',
    author: 'Facebook',
  },
  {
    name: 'Facebook Ads Manager - iOS',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/9e/16/86/9e1686ef-cc55-805a-c977-538ddb5e6832/mzl.gqbhwitj.png',
    link: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
    author: 'Facebook',
  },
  {
    name: 'HSK Level 1 Chinese Flashcards',
    icon: 'http://is2.mzstatic.com/image/pf/us/r30/Purple1/v4/b2/4f/3a/b24f3ae3-2597-cc70-1040-731b425a5904/mzl.amxdcktl.jpg',
    link: 'https://itunes.apple.com/us/app/hsk-level-1-chinese-flashcards/id936639994',
    author: 'HS Schaaf',
  },
  {
    name: 'Lrn',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple1/v4/41/a9/e9/41a9e9b6-7801-aef7-2400-2eca14923321/mzl.adyswxad.png',
    link: 'https://itunes.apple.com/us/app/lrn-learn-to-code-at-your/id1019622677',
    author: 'Lrn Labs, Inc',
  },
  {
    name: 'Lumpen Radio',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/46/43/00/464300b1-fae3-9640-d4a2-0eb050ea3ff2/mzl.xjjawige.png',
    link: 'https://itunes.apple.com/us/app/lumpen-radio/id1002193127?mt=8',
    author: 'Joshua Habdas',
  },
  {
    name: 'MinTrain',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/51/51/68/51516875-1323-3100-31a8-cd1853d9a2c0/mzl.gozwmstp.png',
    link: 'https://itunes.apple.com/us/app/mintrain/id1015739031?mt=8',
    author: 'Peter Cottle',
  },
  {
    name: 'Mr. Dapper',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple4/v4/e8/3f/7c/e83f7cb3-2602-f8e8-de9a-ce0a775a4a14/mzl.hmdjhfai.png',
    link: 'https://itunes.apple.com/us/app/mr.-dapper-men-fashion-app/id989735184?ls=1&mt=8',
    author: 'wei ping woon',
  },
  {
    name: 'Ncredible',
    icon: 'http://a3.mzstatic.com/us/r30/Purple2/v4/a9/00/74/a9007400-7ccf-df10-553b-3b6cb67f3f5f/icon350x350.png',
    link: 'https://itunes.apple.com/ca/app/ncredible/id1019662810?mt=8',
    author: 'NBC News Digital, LLC',
  },
  {
    name: 'Night Light',
    icon: 'http://is3.mzstatic.com/image/pf/us/r30/Purple7/v4/5f/50/5f/5f505fe5-0a30-6bbf-6ed9-81ef09351aba/mzl.lkeqxyeo.png',
    link: 'https://itunes.apple.com/gb/app/night-light-feeding-light/id1016843582?mt=8',
    author: 'Tian Yuan',
  },
  {
    name: 'ReactTo36',
    icon: 'http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/e3/c8/79/e3c87934-70c6-4974-f20d-4adcfc68d71d/mzl.wevtbbkq.png',
    link: 'https://itunes.apple.com/us/app/reactto36/id989009293?mt=8',
    author: 'Jonathan Solichin',
  },
  {
    name: 'RN Playground',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/20/ec/8e/20ec8eb8-9e12-6686-cd16-7ac9e3ef1d52/mzl.ngvuoybx.png',
    link: 'https://itunes.apple.com/us/app/react-native-playground/id1002032944?mt=8',
    author: 'Joshua Sierles',
  },
  {
    name: 'Start - medication manager for depression',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/de/9b/6f/de9b6fe8-84ea-7a12-ba2c-0a6d6c7b10b0/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/start-medication-manager-for/id1012099928?mt=8',
    author: 'Iodine Inc.',
  },
  {
    name: 'Tong Xing Wang',
    icon: 'http://a3.mzstatic.com/us/r30/Purple1/v4/7d/52/a7/7d52a71f-9532-82a5-b92f-87076624fdb2/icon175x175.jpeg',
    link: 'https://itunes.apple.com/cn/app/tong-xing-wang/id914254459?mt=8',
    author: 'Ho Yin Tsun Eugene',
  },
  {
    name: 'youmeyou',
    icon: 'http://is1.mzstatic.com/image/pf/us/r30/Purple7/v4/7c/42/30/7c423042-8945-7733-8af3-1523468706a8/mzl.qlecxphf.png',
    link: 'https://itunes.apple.com/us/app/youmeyou/id949540333?mt=8',
    author: 'youmeyou, LLC',
  },
];

var showcase = React.createClass({
  render: function() {
    return (
      <Site section="showcase" title="Showcase">
        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content showcaseHeader">
            <h1>Apps using React Native</h1>
            <div className="subHeader"></div>
            <p>
              Here is a list of apps using <strong>React Native</strong>. Submit a pull request on <a href="https://github.com/facebook/react-native">GitHub</a> to list your app.
            </p>
          </div>
          {
            apps.map((app, i) => {
              return (
                <a href={app.link} className="showcase" key={i} target="blank">
                  <img src={app.icon} alt={app.name} />
                  <h3>{app.name}</h3>
                  <p>By {app.author}</p>
                </a>
              );
            })
          }
        </section>
      </Site>
    );
  }
});

module.exports = showcase;
