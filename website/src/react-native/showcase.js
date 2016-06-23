/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
*/

/*
Thousands of applications use React Native, so we can't list all of them
in our showcase. To be useful to someone looking through the showcase,
either the app must be something that a significant number of readers would recognize, or the makers of the application must have posted something valuable technically about the making of the app. So, one of the following should hold:

1/ The app is branded with a public company brand
2/ The app received some publicity in top-tier news
3/ The app is made by a funded startup
4/ A popular piece of developer content discusses this app

For each app in the showcase, use infoLink and infoTitle to reference content that would be relevant to a React Native developer learning about this app.
*/

var React = require('React');
var Site = require('Site');

var featured = [
  {
    name: 'Facebook',
    icon: 'https://lh3.googleusercontent.com/ZZPdzvlpK9r_Df9C3M7j1rNRi7hhHRvPhlklJ3lfi5jk86Jd1s0Y5wcQ1QgbVaAP5Q=w300',
    linkAppStore: 'https://itunes.apple.com/app/facebook/id284882215',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.katana&hl=en',
    infoLink: 'https://code.facebook.com/posts/895897210527114/dive-into-react-native-performance/',
    infoTitle: 'Using React Native in the Facebook App',
  },
  {
    name: 'Facebook Groups',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple69/v4/57/f8/4c/57f84c0c-793d-5f9a-95ee-c212d0369e37/mzl.ugjwfhzx.png',
    linkAppStore: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
    infoLink: 'https://code.facebook.com/posts/1014532261909640/react-native-bringing-modern-web-techniques-to-mobile/',
    infoTitle: 'React Native: Bringing Modern Web Techniques to Mobile',
  },
  {
    name: 'Facebook Ads Manager',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/9e/16/86/9e1686ef-cc55-805a-c977-538ddb5e6832/mzl.gqbhwitj.png',
    linkAppStore: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.adsmanager',
    infoLink: 'https://code.facebook.com/posts/1189117404435352/react-native-for-android-how-we-built-the-first-cross-platform-react-native-app/',
    infoTitle: 'How We Built the First Cross-Platform React Native App',
  },
  {
    name: 'F8',
    icon: 'https://raw.githubusercontent.com/fbsamples/f8app/master/ios/F8v2/Images.xcassets/AppIcon.appiconset/AppIcon%402x.png',
    linkAppStore: 'https://itunes.apple.com/us/app/f8/id853467066?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.f8',
    infoLink: 'http://makeitopen.com/tutorials/building-the-f8-app/planning/',
    infoTitle: 'Building the F8 App',
  },
  {
    name: 'Discord',
    icon: 'http://a5.mzstatic.com/us/r30/Purple5/v4/c1/2f/4c/c12f4cba-1d9a-f6bf-2240-04085d3470ec/icon175x175.jpeg',
    linkAppStore:  'https://itunes.apple.com/us/app/discord-chat-for-gamers/id985746746?mt=8',
    infoLink: 'https://discord.engineering/react-native-deep-dive-91fd5e949933#.5jnqftgof',
    infoTitle: 'Using React Native: One Year Later',
  },
  {
    name: 'Discovery VR',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/d1/d5/f4/d1d5f437-9f6b-b5aa-5fe7-47bd19f934bf/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/discovery-vr/id1030815031?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.discovery.DiscoveryVR',
    infoLink: 'https://medium.com/ios-os-x-development/an-ios-developer-on-react-native-1f24786c29f0',
    infoTitle: '"I may never write an iOS app in Objective-C or Swift again."',
  },
  {
    name: 'Movie Trailers by MovieLaLa',
    icon: 'https://lh3.googleusercontent.com/16aug4m_6tvJB7QZden9w1SOMqpZgNp7rHqDhltZNvofw1a4V_ojGGXUMPGiK0dDCqzL=w300',
    linkAppStore: 'https://itunes.apple.com/us/app/movie-trailers-by-movielala/id1001416601?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.movielala.trailers',
    infoLink: 'http://variety.com/2016/digital/news/movielala-1-4-million-seed-round-hollywood-angel-investors-1201678139/',
    infoTitle: 'MovieLaLa Closes $1.4 Million Seed Round',
  },
  {
    name: 'Myntra',
    icon: 'http://a5.mzstatic.com/us/r30/Purple6/v4/9c/78/df/9c78dfa6-0061-1af2-5026-3e1d5a073c94/icon350x350.png',
    linkAppStore: 'https://itunes.apple.com/in/app/myntra-fashion-shopping-app/id907394059',
    infoLink: 'https://techcrunch.com/2014/05/22/flipkart-myntra-acqusition/',
    infoTitle: 'Flipkart Buys Fashion E-tailer Myntra To Fight Amazon',
  },
  {
    name: 'SoundCloud Pulse',
    icon: 'https://i1.sndcdn.com/artworks-000149203716-k5je96-original.jpg',
    linkAppStore: 'https://itunes.apple.com/us/app/soundcloud-pulse-for-creators/id1074278256?mt=8',
    infoLink: 'https://blog.soundcloud.com/2016/02/23/soundcloud-pulse-now-on-iphone/',
    infoTitle: 'SoundCloud Pulse: now on iPhone',
  },
  {
    name: 'Start - medication manager for depression',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/de/9b/6f/de9b6fe8-84ea-7a12-ba2c-0a6d6c7b10b0/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/start-medication-manager-for/id1012099928?mt=8',
    infoLink: 'http://www.nytimes.com/2014/09/24/technology/to-gather-drug-information-a-health-start-up-turns-to-consumers.html?_r=0',
    infoTitle: 'NYT: A Health Startup Turns to Consumers',
  },
  {
    name: 'Taxfyle - taxes filed on-demand via licensed CPA',
    icon: 'https://s3.amazonaws.com/taxfyle-public/images/taxfyle-icon-1024px.png',
    linkAppStore: 'https://itunes.apple.com/us/app/taxfyle/id1058033104?mt=8',
    infoLink: 'http://www.techinsider.io/taxfyle-wants-to-be-the-uber-for-taxes-2016-4',
    infoTitle: 'Taxfyle: the Uber for filing taxes',
  },
  {
    name: 'This AM',
    icon: 'http://s3.r29static.com//bin/public/efe/x/1542038/image.png',
    linkAppStore: 'https://itunes.apple.com/us/app/refinery29-this-am-top-breaking/id988472315?mt=8',
    infoLink: 'https://techcrunch.com/2016/02/01/refinery29-debuts-its-first-app-a-morning-news-round-up-called-refinery29-am/',
    infoTitle: 'Refinery29 debuts its first app',
  },
  {
    name: 'Bitt Wallet',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/5b/00/34/5b003497-cc85-a0d0-0d3e-4fb3bc6f95cd/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/bitt-wallet/id1081954916?mt=8',
    infoLink: 'https://bitcoinmagazine.com/articles/overstock-invests-in-bitt-to-launch-official-digital-currencies-in-the-caribbean-islands-1459961581',
    infoTitle: 'Overstock invests in Bitt to launch digital currencies',
  },
  {
    name: 'Calor - Field Pro',
    icon: 'http://rnfdigital.com/wp-content/uploads/2016/04/FieldProIcon.png',
    infoLink: 'http://rnfdigital.com/react-native-a-game-changer-for-enterprise-mobile-development/',
    infoTitle: 'React Native: a game changer for Enterprise Mobile Development',
  },
  {
    name: 'CBS Sports Franchise Football',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/7b/0c/a0/7b0ca007-885a-7cfc-9fa2-2ec4394c2ecc/icon175x175.png',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.cbssports.fantasy.franchisefootball2015',
    infoLink: 'http://www.cbssports.com/fantasy/football/games/franchise/2015',
    infoTitle: 'The award winning Fantasy Football league manager.',
  },
  {
    name: 'Codementor - Live 1:1 Expert Developer Help',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/db/cf/35/dbcf3523-bac7-0f54-c6a8-a80bf4f43c38/icon175x175.jpeg',
    infoLink: 'https://techcrunch.com/2015/08/26/codementor-live-classes/',
    infoTitle: 'Codementor, a Learning Platform for Developers',
  },
  {
    name: 'Coiney窓口',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/c9/bc/3a/c9bc3a29-9c11-868f-b960-ca46d5fcd509/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/jp/app/coiney-chuang-kou/id1069271336?mt=8',
    infoLink: 'https://www.techinasia.com/japan-startup-coiney-aims-for-ipo',
    infoTitle: 'Japanese startup Coiney aims for IPO',
  },
  {
    name: 'Convoy Driver',
    icon: 'http://a1.mzstatic.com/us/r30/Purple30/v4/5a/74/56/5a74567d-4491-a298-65cd-722c8a7211ac/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/convoy-driver/id1045368390?mt=8',
    infoLink: 'http://www.theverge.com/2015/10/27/9620352/convoy-uber-for-trucking',
    infoTitle: 'Convoy, a Seattle-based "Uber for trucking"',
  },
  {
    name: 'Fixt',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/46/bc/66/46bc66a2-7775-4d24-235d-e1fe28d55d7f/icon175x175.png',
    linkAppStore:  'https://itunes.apple.com/us/app/dropbot-phone-replacement/id1000855694?mt=8',
    linkPlayStore:  'https://play.google.com/store/apps/details?id=co.fixt',
    infoLink: 'http://www.phonearena.com/news/Fixt-is-an-app-that-promises-a-hassle-free-smartphone-repairy-service_id81069',
    infoTitle: 'A hassle-free smartphone repair service',
  },
  {
    name: 'Leanpub',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/9f/4a/6f/9f4a6f8c-8951-ed89-4083-74ace23df9ef/icon350x350.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/leanpub/id913517110?ls=1&mt=8',
    infoLink: 'http://techland.time.com/2011/06/23/how-to-turn-your-blog-into-an-instant-e-book/',
    infoTitle: 'Leanpub: How to Turn Your Blog into an Instant E-Book',
  },
  {
    name: 'li.st',
    icon: 'https://lh3.googleusercontent.com/tXt0HgJ7dCgOnuQ-lQr1P7E57mnOYfwXhRsV9lGcPwHPVvrDAN6YmpLVFgy88qKrkFI=w300',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=st.li.listapp',
    infoLink: 'https://www.youtube.com/watch?v=cI9bDvDEsYE',
    infoTitle: 'Building li.st for Android with React Native',
  },
  {
    name: 'Lugg – Your On-Demand Mover',
    icon: 'https://lh3.googleusercontent.com/EV9z7kRRME2KPMBRNHnje7bBNEl_Why2CFq-MfKzBC88uSFJTYr1HO3-nPt-JuVJwKFb=w300',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.lugg',
    infoLink: 'https://techcrunch.com/2015/08/26/lugg-an-app-for-on-demand-short-distance-moves-raises-3-8-million/',
    infoTitle: 'Lugg, An App for Short-Distance Moves, Raises $3.8 Million',
  },
  {
    name: 'Pimmr',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/99/da/0e/99da0ee6-bc87-e1a6-1d95-7027c78f50e1/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/nl/app/pimmr/id1023343303?mt=8',
    infoLink: 'https://www.crunchbase.com/organization/pimmr#/entity',
    infoTitle: 'Pimmr helps you find the needle in the haystack',
  },
  {
    name: 'Project September',
    icon: 'http://a4.mzstatic.com/us/r30/Purple30/v4/95/51/b7/9551b72a-d80a-5b1c-5c6d-7fc77d745d31/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/project-september/id1074075331?ls=1&mt=8&_branch_match_id=273849075056044546',
    infoLink: 'http://fortune.com/2016/04/14/project-september-alexis-maybank/',
    infoTitle: 'Former Gilt CEO Launches New Mobile App',
  },
  {
    name: 'QQ',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6633_1461768893/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.mobileqq',
    infoLink: 'https://en.wikipedia.org/wiki/Tencent_QQ',
    infoTitle: 'QQ is a Chinese messaging service with 829 million active accounts',
  },
  {
    name: 'QQ空间',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_9959_1460036593/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.qzone',
    infoLink: 'https://en.wikipedia.org/wiki/Qzone',
    infoTitle: 'Qzone is a Chinese social network with over 600 million users',
  },
  {
    name: 'QQ音乐',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6259_1462429453/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.qqmusic',
    infoLink: 'http://www.wsj.com/articles/tencent-customers-come-for-the-music-stay-for-the-perks-1433869369',
    infoTitle: 'Internet giant tries to get people to pay for digital music',
  },
  {
    name: 'Samanage',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/ed/e9/ff/ede9ff34-a9f6-5eb6-2a23-fcb014b326f2/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/samanage/id1033018362',
    infoLink: 'https://techcrunch.com/2015/05/20/samanage-raises-16m-as-asset-management-business-grows/',
    infoTitle: 'Samanage raises $16M as Asset Management Expands',
  },
  {
    name: 'ShareWis',
    icon: 'https://s3-ap-northeast-1.amazonaws.com/sw-misc/sharewis3_app.png',
    linkAppStore: 'https://itunes.apple.com/jp/app/id585517208',
    infoLink: 'https://www.crunchbase.com/organization/sharewis#/entity',
    infoTitle: 'The concept is to turn learning into an adventure',
  },
  {
    name: 'sneat',
    icon: 'http://a3.mzstatic.com/eu/r30/Purple49/v4/71/71/df/7171df47-6e03-8619-19a8-07f52186b0ed/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/fr/app/sneat-reservez-les-meilleurs/id1062510079?l=en&mt=8',
    infoLink: 'http://www.internetsansfrontieres.com/sneat-application-mobile-reserver-restaurant/',
    infoTitle: 'Application mobile pour réserver un restaurant',
  },
  {
    name: 'Ticketea',
    icon: 'http://f.cl.ly/items/0n3g3x2t0W0a0d0b1F0C/tkt-icon.png',
    linkAppStore: 'https://itunes.apple.com/es/app/entradas-teatro-y-conciertos/id1060067658?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.ticketea.geminis',
    infoLink: 'https://techcrunch.com/2013/05/27/ticket-to-ride/',
    infoTitle: 'Ticketea raises $4 Million to Beat Ticketmaster',
  },
  {
    name: 'Townske',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/8b/42/20/8b4220af-5165-91fd-0f05-014332df73ef/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/townske-stunning-city-guides/id1018136179?ls=1&mt=8',
    infoLink: 'https://hackernoon.com/townske-app-in-react-native-6ad557de7a7c',
    infoTitle: '"I would recommend React Native in a heartbeat."',
  },
  {
    name: 'uSwitch - Energy switching app',
    icon: 'https://lh3.googleusercontent.com/NpkGlwFWdj7VsK2ueVwlgdrrBrNJ-yN-4TkEHjjSjDUu7NpMcfyAp10p97f0zci0CSFQ=w300',
    linkAppStore: 'https://itunes.apple.com/gb/app/uswitch-compare-switch-save/id935325621?mt=8&ct=react',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.uswitchmobileapp',
    infoLink: 'https://en.wikipedia.org/wiki/USwitch',
    infoTitle: 'uSwitch: a UK-based price comparison service',
  },
  {
    name: 'WEARVR',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/4f/5a/28/4f5a2876-9530-ef83-e399-c5ef5b2dab80/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/wearvr/id1066288171?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.wearvr.app',
    infoLink: 'http://venturebeat.com/2015/04/07/virtual-reality-app-store-wear-vr-secures-1-5m-in-funding/',
    infoTitle: 'Wear VR secures $1.5M in funding',
  },
  {
    name: 'wego concerts',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/03/91/2d/03912daa-fae7-6a25-5f11-e6b19290b3f4/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/wego-concerts-follow-friends/id869478093?mt=8',
    infoLink: 'http://www.nydailynews.com/life-style/wego-concerts-app-links-music-fans-article-1.2066776',
    infoTitle: 'Wego Concerts: Like the love child of Tinder and StubHub',
  },
];

featured.sort(function(a, b) {
  return a.name.localeCompare(b.name);
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
    var inner = (
      <div>
        <img src={app.icon} alt={app.name} />
        <h3>{app.name}</h3>
        {app.linkAppStore || app.linkPlayStore ? this._renderLinks(app) : null}
        {this._renderInfo(app)}
      </div>
    );

    if (app.linkAppStore && app.linkPlayStore) {
      return (<div className="showcase" key={i}>{inner}</div>);
    }

    return (
      <div className="showcase" key={i}>
        {inner}
      </div>
    );
  },

  _renderInfo: function(app) {
    if (!app.infoLink) {
      return;
    }

    return (
      <p><a href={app.infoLink} target="_blank">{app.infoTitle}</a></p>
    );
  },

  _renderLinks: function(app) {
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
            <h1 style={{textAlign: 'center'}}>The React Native Showcase</h1>
            <div className="subHeader"></div>
            <p>Thousands of apps are using React Native in production, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!</p>

            <div className="inner-content">
              <AppList apps={featured} />
            </div>

            <div className="inner-content showcaseHeader">
              <p>If you built a popular application using React Native, we'd love to have your app on this showcase. Check out the <a href="https://github.com/facebook/react-native/blob/master/website/src/react-native/showcase.js">guidelines on GitHub</a> to update this page.</p>
            </div>
          </div>

        </section>
      </Site>
    );
  }
});

module.exports = showcase;
