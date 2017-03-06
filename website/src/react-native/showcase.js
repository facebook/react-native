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

/*
For each app in the showcase, use infoLink and infoTitle to reference this
content.
*/
var featured = [
  {
    name: 'Qzone (QQ空间)',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_9959_1460036593/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.qzone',
    infoLink: 'https://en.wikipedia.org/wiki/Qzone',
    infoTitle: 'Qzone is a Chinese social network with over 600 million users',
  },
  {
    name: 'QQ Music (QQ音乐)',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6259_1462429453/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.qqmusic',
    infoLink: 'http://www.wsj.com/articles/tencent-customers-come-for-the-music-stay-for-the-perks-1433869369',
    infoTitle: 'Internet giant tries to get people to pay for digital music',
  },
  {
    name: 'Classroom (腾讯课堂)',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_10927178_1479093114/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.edu',
    linkAppStore: 'https://itunes.apple.com/cn/app/teng-xun-ke-tang-zhuan-ye/id931720936?mt=8',
    infoLink: 'http://baike.baidu.com/view/13030839.htm',
    infoTitle: 'Classroom is an education app by Chinese Internet giant Tencent',
  },
  {
    name: 'F8',
    icon: 'https://raw.githubusercontent.com/fbsamples/f8app/master/ios/F8v2/Images.xcassets/AppIcon.appiconset/AppIcon%402x.png',
    linkAppStore: 'https://itunes.apple.com/us/app/f8/id853467066?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.f8',
    infoLink: 'http://makeitopen.com/tutorials/building-the-f8-app/planning/',
    infoTitle: 'Tutorial: Building the F8 2016 conference app',
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
    name: 'Movie Trailers',
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
    infoLink: 'https://developers.soundcloud.com/blog/react-native-at-soundcloud',
    infoTitle: 'Why React Native worked well for us',
  },
  {
    name: 'Start',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/de/9b/6f/de9b6fe8-84ea-7a12-ba2c-0a6d6c7b10b0/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/start-medication-manager-for/id1012099928?mt=8',
    infoLink: 'http://www.nytimes.com/2014/09/24/technology/to-gather-drug-information-a-health-start-up-turns-to-consumers.html?_r=0',
    infoTitle: 'NYT: A Health Startup Turns to Consumers',
  },
  {
    name: 'Taxfyle',
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
    infoTitle: 'Refinery29 debuts morning news roundup app created with React Native',
  },
  {
    name: 'TRED',
    icon: 'http://a1.mzstatic.com/us/r30/Purple20/v4/b0/0c/07/b00c07d2-a057-06bc-6044-9fdab97f370f/icon175x175.jpeg',
    linkAppStore:  'https://itunes.apple.com/us/app/tred-sell-my-car-for-more!/id1070071394?mt=8',
    linkPlayStore:  'https://play.google.com/store/apps/details?id=com.tredmobile&hl=en',
    infoLink: 'http://www.geekwire.com/2015/mobile-dealership-tred-raises-another-1m-to-help-used-car-owners-make-more-money/',
    infoTitle: 'Sell your car for thousands more than Craigslist or the dealer with TRED',
  },
  {
    name: 'Bitt Wallet',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/5b/00/34/5b003497-cc85-a0d0-0d3e-4fb3bc6f95cd/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/bitt-wallet/id1081954916?mt=8',
    infoLink: 'https://bitcoinmagazine.com/articles/overstock-invests-in-bitt-to-launch-official-digital-currencies-in-the-caribbean-islands-1459961581',
    infoTitle: 'Overstock invests in Bitt to launch digital currencies',
  },
  {
    name: 'CBS Sports Franchise Football',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/7b/0c/a0/7b0ca007-885a-7cfc-9fa2-2ec4394c2ecc/icon175x175.png',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.cbssports.fantasy.franchisefootball2015',
    infoLink: 'http://www.cbssports.com/fantasy/football/games/franchise/2015',
    infoTitle: 'Award winning Fantasy Football league manager',
  },
  {
    name: 'Coiney (窓口)',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/c9/bc/3a/c9bc3a29-9c11-868f-b960-ca46d5fcd509/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/jp/app/coiney-chuang-kou/id1069271336?mt=8',
    infoLink: 'https://www.techinasia.com/japan-startup-coiney-aims-for-ipo',
    infoTitle: 'Coiney provides smarphone-based credit card processing services in Japan',
  },
  {
    name: 'Convoy Driver',
    icon: 'http://a1.mzstatic.com/us/r30/Purple30/v4/5a/74/56/5a74567d-4491-a298-65cd-722c8a7211ac/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/convoy-driver/id1045368390?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.convoy.driver',
    infoLink: 'http://www.theverge.com/2015/10/27/9620352/convoy-uber-for-trucking',
    infoTitle: 'Convoy, a Seattle-based "Uber for trucking"',
  },
  {
    name: 'Fixt',
    icon: 'http://a5.mzstatic.com/us/r30/Purple62/v4/7f/b3/66/7fb366c4-79fd-34e1-3037-ffc02d8a93f7/icon350x350.png',
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
    name: 'Lugg',
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
    name: 'uSwitch',
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
    name: 'Wego Concerts',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/03/91/2d/03912daa-fae7-6a25-5f11-e6b19290b3f4/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/wego-concerts-follow-friends/id869478093?mt=8',
    infoLink: 'http://www.nydailynews.com/life-style/wego-concerts-app-links-music-fans-article-1.2066776',
    infoTitle: 'Wego Concerts: Like the love child of Tinder and StubHub',
  },
  {
    name: 'Bdsdiet',
    icon: 'http://s3.ap-northeast-2.amazonaws.com/bdsdiet-bucket/media/store-icon.png',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bdsdiet_app',
    infoLink: 'https://www.crunchbase.com/organization/bds-diet#/entity',
    infoTitle: 'Bdsdiet provides real estate brokerage services through web and live agents in Korea.',
  },
  {
    name: 'Crowdsource (蜂鸟众包)',
    icon: 'http://img.wdjimg.com/mms/icon/v1/e/6e/687b129606504cd52632a8cc4ca816ee_256_256.png',
    linkPlayStore: 'http://www.wandoujia.com/apps/me.ele.crowdsource',
    linkAppStore: 'https://itunes.apple.com/cn/app/feng-niao-zhong-bao-jian-zhi/id1061034377?mt=8',
    infoLink: 'https://elelogistics.github.io/about/Crowdsource-App-Write-In-React-Native.html',
    infoTitle: 'Fengniao Crowdsource is the largest crowdsourced logistics platform in China.',
  },
  {
    name: '昨日热推',
    icon: 'https://frontbin.com/images/apple-touch-icon.png',
    linkAppStore: 'https://itunes.apple.com/cn/app/zuo-ri-re-tui/id1137163693?l=en&mt=8',
    infoLink: 'https://www.zfanw.com/blog/developing-react-native-image-viewer-library.html',
    infoTitle: 'Developing the react-native-image-viewer library',
  },
  {
    name: 'Artsy',
    icon: 'https://raw.githubusercontent.com/artsy/eigen/master/Artsy/Resources/Images.xcassets/AppIcon.appiconset/AppIcon167.png',
    linkAppStore: 'https://itunes.apple.com/us/app/artsy-collect-bid-on-fine/id703796080?mt=8',
    infoLink: 'https://artsy.github.io/series/react-native-at-artsy/',
    infoTitle: 'React Native at Artsy',
  },
  {
    name: 'Huiseoul (惠首尔)',
    icon: 'https://cdn.huiseoul.com/icon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/hui-shou-er-ni-si-ren-mei/id1127150360?ls=1&mt=8',
    infoLink: 'https://engineering.huiseoul.com/building-a-conversational-e-commerce-app-in-6-weeks-with-react-native-c35d46637e07',
    infoTitle: 'Building a conversational E-commerce app in 6 weeks with React Native',
  },
  {
    name: 'PlaceAVote',
    icon: 'https://s12.postimg.org/nr79mplq5/pav_Icon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/placeavote/id1120628991?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.placeavote.androidapp&hl=en',
    infoLink: 'https://techcrunch.com/2016/05/10/placeavote-wants-to-give-voters-a-say-in-congress/',
    infoTitle: 'PlaceAVote wants to give voters a say in Congress',
  },
  {
    name: 'Robin Rooms',
    icon: 'http://robinpowered.s3.amazonaws.com/rooms/appicon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/robin-rooms/id947566115',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.robinpowered.rooms',
    infoLink: 'https://techcrunch.com/2016/05/31/robin-makes-the-office-smarter-with-7-million-in-new-funding/',
    infoTitle: 'Robin Rooms manages and mounts outside your conference rooms'
  },
  {
    name: 'Sleeperbot',
    icon: 'https://blitzchat.net/uploads/c8425332190a4f4b852d7770ad32e602/original.png',
    linkAppStore: 'https://itunes.apple.com/us/app/sleeperbot-fantasy-football/id987367543?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.sleeperbot&hl=en',
    infoLink: 'https://medium.com/sleeperbot-hq/switching-to-react-native-in-production-on-ios-and-android-e6b675402712#.cug6h6qhn',
    infoTitle: 'Switching to React Native in Production on iOS and Android',
  },
  {
    name: 'JD（手机京东）',
    icon: 'https://lh3.googleusercontent.com/AIIAZsqyEG0KmCFruh1Ec374-2l7n1rfv_LG5RWjdAZOzUBCu-5MRqdLbzJfBnOdSFg=w300-rw',
    linkAppStore: 'https://itunes.apple.com/cn/app/shou-ji-jing-dong-xin-ren/id414245413?mt=8',
    linkPlayStore: 'https://app.jd.com/android.html',
    infoLink: 'http://ir.jd.com/phoenix.zhtml?c=253315&p=irol-homeProfile',
    infoTitle: 'JD.com is China’s largest ecommerce company by revenue and a member of the Fortune Global 500.',
  },
  {
    name: 'Chop',
    icon: 'https://pbs.twimg.com/profile_images/656536498951446529/6zU6BvgB.png',
    linkAppStore: 'http://apple.co/2dfkYH9',
    infoLink: 'https://blog.getchop.io/how-we-built-chop-bae3d8acd131#.7y8buamrq',
    infoTitle: 'How we built Chop',
  },
  {
    name: 'Bloomberg',
    icon: 'http://is1.mzstatic.com/image/thumb/Purple71/v4/31/24/72/312472df-3d53-0acf-fc31-8a25682e528f/source/175x175bb.jpg',
    linkAppStore: 'https://itunes.apple.com/us/app/bloomberg/id281941097?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bloomberg.android.plus&hl=en',
    infoLink: 'https://www.techatbloomberg.com/blog/bloomberg-used-react-native-develop-new-consumer-app/',
    infoTitle: 'How Bloomberg Used React Native to Develop its new Consumer App',
  },
  {
    name: 'Blink',
    icon: 'https://lh3.googleusercontent.com/QaId7rFtOjAT-2tHVkKB4lebX_w4ujWiO7ZIDe3Hd99TfBmPmiZySbLbVJV65qs0ViM=w300-rw',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.witapp',
    infoLink: 'https://hashnode.com/post/what-we-learned-after-using-react-native-for-a-year-civdr8zv6058l3853wqud7hqp',
    infoTitle: 'What we learned after using React Native for a year',
  },
  {
    name: 'Delivery.com',
    icon: 'https://lh3.googleusercontent.com/ZwwQHQns9Ut2-LqbMqPcmQrsWBh3YbmbIzeDthfdavw99Ziq0unJ6EHUw8bstXUIpg=w300-rw',
    linkAppStore: 'https://itunes.apple.com/us/app/delivery.com-food-alcohol/id435168129?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.deliverycom&hl=en',
    infoLink: 'https://medium.com/delivery-com-engineering/react-native-in-an-existing-ios-app-delivered-874ba95a3c52#.37qruw6ck',
    infoTitle: 'React Native in an Existing iOS App: Getting Started'
  },
  {
    name: 'Remedy',
    icon: 'https://www.remedymedical.com/static/images/AppIconPatient.png',
    linkAppStore: 'https://itunes.apple.com/us/app/remedy-on-demand-intelligent/id1125877350?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.remedy.android',
    infoLink: 'https://techcrunch.com/2017/01/10/doctordoctorcantyouseeimburning/',
    infoTitle: 'Talk to a world-class doctor: advice, prescriptions, and care',
  },
  {
    name: 'Yeti Smart Home',
    icon: 'https://res.cloudinary.com/netbeast/image/upload/v1484303676/Android_192_loykto.png',
    linkAppStore: 'https://itunes.apple.com/us/app/yeti-smart-home/id1190638808?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.netbeast.yeti',
    infoLink: 'https://medium.com/@jesusdario/developing-beyond-the-screen-9af812b96724#.ozx0xy4lv',
    infoTitle: 'How React Native is helping us to reinvent the wheel',
  },
  {
    name: 'Jack',
    icon: 'https://s3-eu-west-1.amazonaws.com/jack-public/react-native-showcase/jack-raw-icon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/you-have-a-jack/id1019167559?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.jack45.jack',
    infoLink: 'https://medium.com/@herdani/our-switch-to-react-native-f4ada19f0f3d#.ogwjzf2tw',
    infoTitle: 'Our switch to React Native',
  },
  {
    name: 'Causr',
    icon: 'http://is2.mzstatic.com/image/thumb/Purple111/v4/9d/14/20/9d142015-3319-f613-2886-ad889609466a/source/175x175bb.jpg',
    linkAppStore: 'https://itunes.apple.com/us/app/causr-business-networking/id1129819484',
    infoLink: 'https://medium.com/causr/why-we-chose-react-native-abd7d58a18b5',
    infoTitle: 'Why we chose React Native'
  },
  {
    name: 'Flare',
    icon: 'http://x.co/FlareIcon',
    linkAppStore: 'http://x.co/Flare',
    linkPlayStore: 'http://x.co/FlareAndr',
    infoLink: 'http://x.co/FlareNews',
    infoTitle: 'Social network that connects entrepreneurs to fellow entrepreneurs, consumers, investors and experts',
  },
  {
    name: 'JadoPado',
    icon: 'https://lh3.googleusercontent.com/VX8CXya2KmFc-n9aPChiUpzIg2IkuzudWy76OmFKNMu2eQDFq9xFdDMR-U1E7Sa88eUs=w300-rw',
    linkAppStore: 'https://itunes.apple.com/ao/app/jadopado/id1149279535',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.jadopado.buyer',
    infoLink: 'https://blog.jadopado.com/product-updates-and-building-incredible-experiences/',
    infoTitle: 'Product Updates And Building Incredible Experiences',
  }
];
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
