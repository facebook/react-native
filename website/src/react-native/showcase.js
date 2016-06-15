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

var featured = [
  {
    name: 'Facebook Groups',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple69/v4/57/f8/4c/57f84c0c-793d-5f9a-95ee-c212d0369e37/mzl.ugjwfhzx.png',
    link: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
    author: 'Facebook',
  },
  {
    name: 'Facebook Ads Manager',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/9e/16/86/9e1686ef-cc55-805a-c977-538ddb5e6832/mzl.gqbhwitj.png',
    linkAppStore: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.adsmanager',
    author: 'Facebook',
    blogs: [
      "https://code.facebook.com/posts/1014532261909640/react-native-bringing-modern-web-techniques-to-mobile/",
      "https://code.facebook.com/posts/1189117404435352/react-native-for-android-how-we-built-the-first-cross-platform-react-native-app/",
      "https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/",
    ],
  },
  {
    name: 'F8',
    icon: 'https://raw.githubusercontent.com/fbsamples/f8app/master/ios/F8v2/Images.xcassets/AppIcon.appiconset/AppIcon%402x.png',
    linkAppStore: 'https://itunes.apple.com/us/app/f8/id853467066?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.f8',
    author: 'Facebook',
    blogs: [
      "http://makeitopen.com/tutorials/building-the-f8-app/planning/",
      "http://makeitopen.com/tutorials/building-the-f8-app/design/",
      "http://makeitopen.com/tutorials/building-the-f8-app/data/",
      "http://makeitopen.com/tutorials/building-the-f8-app/testing/",
    ],
  },
  {
    name: 'AIGA Design Conference 2015',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/b0/4b/29/b04b2939-88d2-f61f-dec9-24fae083d8b3/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/aiga-design-conference-2015/id1038145272?ls=1&mt=8',
    author: 'W&Co',
  },
  {
    name: 'Discord',
    icon: 'http://a5.mzstatic.com/us/r30/Purple5/v4/c1/2f/4c/c12f4cba-1d9a-f6bf-2240-04085d3470ec/icon175x175.jpeg',
    link:  'https://itunes.apple.com/us/app/discord-chat-for-gamers/id985746746?mt=8',
    author: 'Hammer & Chisel',
    blogs: [
      "https://discord.engineering/react-native-deep-dive-91fd5e949933#.5jnqftgof",
    ],
  },
  {
    name: 'Discovery VR',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/d1/d5/f4/d1d5f437-9f6b-b5aa-5fe7-47bd19f934bf/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/discovery-vr/id1030815031?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.discovery.DiscoveryVR',
    author: 'Discovery Communications',
    blog: [
      "https://medium.com/ios-os-x-development/an-ios-developer-on-react-native-1f24786c29f0",
    ],
  },
  {
    name: 'Exponent',
    icon: 'http://a1.mzstatic.com/us/r30/Purple20/v4/b0/26/72/b02672b5-d347-6df1-e20f-de5f5c039664/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/exponent/id982107779?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=host.exp.exponent',
    author: 'Exponent',
  },
  {
    name: 'Helium',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/df/a6/22/dfa622c4-e29c-c720-f32e-3fec99d14337/icon175x175.png',
    link:  'https://itunes.apple.com/app/id1071378510',
    author: 'Helium',
  },
  {
    name: 'li.st',
    icon: 'https://lh3.googleusercontent.com/tXt0HgJ7dCgOnuQ-lQr1P7E57mnOYfwXhRsV9lGcPwHPVvrDAN6YmpLVFgy88qKrkFI=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=st.li.listapp',
    author: 'li.st + Exponent',
  },
  {
    name: 'Lrn',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple1/v4/41/a9/e9/41a9e9b6-7801-aef7-2400-2eca14923321/mzl.adyswxad.png',
    link: 'https://itunes.apple.com/us/app/lrn-learn-to-code-at-your/id1019622677',
    author: 'Lrn Labs, Inc',
  },
  {
    name: 'Movie Trailers by MovieLaLa',
    icon: 'https://lh3.googleusercontent.com/16aug4m_6tvJB7QZden9w1SOMqpZgNp7rHqDhltZNvofw1a4V_ojGGXUMPGiK0dDCqzL=w300',
    linkAppStore: 'https://itunes.apple.com/us/app/movie-trailers-by-movielala/id1001416601?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.movielala.trailers',
    author: 'MovieLaLa'
  },
  {
    name: 'Myntra',
    icon: 'http://a5.mzstatic.com/us/r30/Purple6/v4/9c/78/df/9c78dfa6-0061-1af2-5026-3e1d5a073c94/icon350x350.png',
    link: 'https://itunes.apple.com/in/app/myntra-fashion-shopping-app/id907394059',
    author: 'Myntra Designs',
  },
  {
    name: 'Noodler',
    icon: 'http://a5.mzstatic.com/us/r30/Purple6/v4/d9/9a/69/d99a6919-7f11-35ad-76ea-f1741643d875/icon175x175.png',
    link: 'http://www.noodler-app.com/',
    author: 'Michele Humes & Joshua Sierles',
  },
  {
    name: 'React Native Playground',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/20/ec/8e/20ec8eb8-9e12-6686-cd16-7ac9e3ef1d52/mzl.ngvuoybx.png',
    linkAppStore: 'https://itunes.apple.com/us/app/react-native-playground/id1002032944?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=org.rnplay.playground',
    author: 'Joshua Sierles',
  },
  {
    name: 'Round - A better way to remember your medicine',
    icon: 'https://s3.mzstatic.com/us/r30/Purple69/v4/d3/ee/54/d3ee54cf-13b6-5f56-0edc-6c70ac90b2be/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/round-beautiful-medication/id1059591124?mt=8',
    author: 'Circadian Design',
  },
  {
    name: 'Running',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/33/eb/4f/33eb4f73-c7e3-8659-9285-f758e403485b/icon175x175.jpeg',
    link: 'https://gyrosco.pe/running/',
    author: 'Gyroscope Innovations',
    blogs: [
      'https://blog.gyrosco.pe/the-making-of-gyroscope-running-a4ad10acc0d0',
    ],
  },
  {
    name: 'SoundCloud Pulse',
    icon: 'https://i1.sndcdn.com/artworks-000149203716-k5je96-original.jpg',
    link: 'https://itunes.apple.com/us/app/soundcloud-pulse-for-creators/id1074278256?mt=8',
    author: 'SoundCloud',
  },
  {
    name: 'Spero for Cancer',
    icon: 'https://s3-us-west-1.amazonaws.com/cancerspot/site_images/Spero1024.png',
    link: 'https://geo.itunes.apple.com/us/app/spero-for-cancer/id1033923573?mt=8',
    author: 'Spero.io',
    videos: [
      'https://www.youtube.com/watch?v=JImX3L6qnj8',
    ],
  },
  {
    name: 'Squad',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/e8/5b/3f/e85b3f52-72f3-f427-a32e-a73efe2e9682/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/squad-snaps-for-groups-friends/id1043626975?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.tackk.squad',
    author: 'Tackk Inc.',
    blogs: [
      'https://medium.com/@rpastorelle/building-3-react-native-apps-in-one-summer-dcd0c31454ff#.z0fh9dehn',
    ],
  },
  {
    name: 'Start - medication manager for depression',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/de/9b/6f/de9b6fe8-84ea-7a12-ba2c-0a6d6c7b10b0/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/start-medication-manager-for/id1012099928?mt=8',
    author: 'Iodine Inc.',
  },
  {
    name: 'Taxfyle - taxes filed on-demand via licensed CPA',
    icon: 'https://s3.amazonaws.com/taxfyle-public/images/taxfyle-icon-1024px.png',
    link: 'https://itunes.apple.com/us/app/taxfyle/id1058033104?mt=8',
    author: 'Taxfyle',
  },
  {
    name: 'This AM',
    icon: 'http://s3.r29static.com//bin/public/efe/x/1542038/image.png',
    link: 'https://itunes.apple.com/us/app/refinery29-this-am-top-breaking/id988472315?mt=8',
    author: 'Refinery29',
  },
  {
    name: 'Townske',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/8b/42/20/8b4220af-5165-91fd-0f05-014332df73ef/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/townske-stunning-city-guides/id1018136179?ls=1&mt=8',
    author: 'Townske PTY LTD',
  },
  {
    name: 'Tucci',
    icon: 'http://a3.mzstatic.com/us/r30/Purple3/v4/c0/0c/95/c00c95ce-4cc5-e516-db77-5c5164b89189/icon175x175.jpeg',
    link: 'https://itunes.apple.com/app/apple-store/id1039661754?mt=8',
    author: 'Clay Allsopp & Tiffany Young',
    blogs: [
      'https://medium.com/@clayallsopp/making-tucci-what-is-it-and-why-eaa2bf94c1df#.lmm3dmkaf',
      'https://medium.com/@clayallsopp/making-tucci-the-technical-details-cc7aded6c75f#.wf72nq372',
    ],
  },
  {
    name: 'WPV',
    icon: 'http://a2.mzstatic.com/us/r30/Purple49/v4/a8/26/d7/a826d7bf-337b-c6b8-488d-aca98027754d/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/wpv/id725222647?mt=8',
    author: 'Yamill Vallecillo',
  },
  {
    name: 'Zhopout',
    icon: 'http://zhopout.com/Content/Images/zhopout-logo-app-3.png',
    link: 'https://play.google.com/store/apps/details?id=com.zhopout',
    author: 'Jarvis Software Private Limited ',
    blogs: [
      "https://medium.com/@murugandurai/how-we-developed-our-mobile-app-in-30-days-using-react-native-45affa6449e8#.29nnretsi",
    ],
  },
  {
    name: '蜂鸟众包',
    icon: 'http://img.wdjimg.com/mms/icon/v1/7/fd/b017c4a3eda1330f6b2561ec57cb0fd7_256_256.png',
    linkAppStore: 'https://itunes.apple.com/cn/app/feng-niao-zhong-bao-jian-zhi/id1061034377?l=en&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=me.ele.crowdsource',
    author: 'Eleme',
  }
];

var apps = [
  {
    name: 'Accio',
    icon: 'http://a3.mzstatic.com/us/r30/Purple3/v4/03/a1/5b/03a15b9f-04d7-a70a-620a-9c9850a859aa/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/accio-on-demand-delivery/id1047060673?mt=8',
    author: 'Accio Delivery Inc.',
  },
  {
    name: 'AirPoPo',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/47/1a/07/471a07e1-50d9-a432-060b-76f32df8c345/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/airpopo/id1100540816',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.airpopo.client',
    author: 'DingTaxi',
  },
  {
    name: 'ArcChat.com',
    icon: 'https://lh3.googleusercontent.com/mZJjidMobu3NAZApdtp-vdBBzIWzCNTaIcKShbGqwXRRzL3B9bbi6E0eRuykgT6vmg=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.arcchat',
    author: 'Lukas Liesis',
  },
  {
    name: 'Azendoo',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/b8/d0/d6/b8d0d66e-1a87-8ff2-f843-0ddce8b535e1/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/azendoo-tasks-conversations/id581907820?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.azendoo.azmobile',
    author: 'Azendoo',
    blogs: [
      "http://blog.azendoo.com/azendoo-mobile-v2-release/",
    ],
  },
  {
    name: 'Beetroot',
    icon: 'http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/66/fd/dd/66fddd70-f848-4fc5-43ee-4d52197ccab8/pr_source.png',
    link: 'https://itunes.apple.com/us/app/beetroot/id1016159001?ls=1&mt=8',
    author: 'Alex Duckmanton',
  },
  {
    name: 'Bhagavad Gita Lite',
    icon: 'https://s3-us-west-2.amazonaws.com/bhagavadgitaapp/gita-free.png',
    link: 'https://itunes.apple.com/us/app/bhagavad-gita-lite/id1071711190?ls=1&mt=8',
    author: 'Tom Goldenberg & Nick Brown'
  },
  {
    name: 'Bionic eStore',
    icon: 'http://a5.mzstatic.com/us/r30/Purple7/v4/c1/9a/3f/c19a3f82-ecc3-d60b-f983-04acc203705f/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/bionic-estore/id994537615?mt=8',
    author: 'Digidemon',
  },
  {
    name: 'Bitt Wallet',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/5b/00/34/5b003497-cc85-a0d0-0d3e-4fb3bc6f95cd/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/bitt-wallet/id1081954916?mt=8',
    author: 'Bitt',
  },
  {
    name: 'Blueprint',
    icon: 'http://blueprintalpha.com/static/blueprint_appicon.svg',
    linkAppStore: 'https://itunes.apple.com/us/app/blueprint-alpha/id1058584745?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.blueprintnative',
    author: 'Tom Hayden'
  },
  {
    name: 'breathe Meditation Timer',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple49/v4/09/21/d2/0921d265-087a-98f0-58ce-bbf9d44b114d/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/de/app/breathe-meditation-timer/id1087354227?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.idearockers.breathe',
    author: 'idearockers UG',
  },
  {
    name: 'Bulut Filo Yönetimi',
    icon: 'http://a2.mzstatic.com/us/r30/Purple49/v4/a2/6b/b5/a26bb5b5-e67b-8ecc-55eb-c33232ee3c5e/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/tr/app/bulut-filo-yonetimi/id1090955364?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bulutfilo',
    author: 'Macellan.net',
  },
  {
    name: 'Calor - Field Pro',
    icon: 'http://rnfdigital.com/wp-content/uploads/2016/04/FieldProIcon.png',
    link: 'http://rnfdigital.com/react-native-a-game-changer-for-enterprise-mobile-development/',
    author: 'RNF Digital',
  },
  {
    name: 'camigo - the camping app',
    icon: 'http://cdn.socialbit.de/default/0001/01/thumb_988_default_original.png',
    linkAppStore: 'https://itunes.apple.com/de/app/camigo/id1088876278?l=de&ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.mobileemotion.camigo',
    author: 'Socialbit GmbH',
  },
  {
    name: 'CANDDi',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple7/v4/c4/e4/85/c4e48546-7127-a133-29f2-3e2e1aa0f9af/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/canddi/id1018168131?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.canddi',
    author: 'CANDDi LTD.',
  },
  {
    name: 'CaratLane',
    icon: 'https://lh3.googleusercontent.com/wEN-Vvpbnw_n89dbXPxWkNnXB7sALKBKvpX_hbzrWbuC4tFi5tVkWHq8k5TAvdbf5UQ=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.caratlane.android&hl=en',
    author: 'CaratLane',
  },
  {
    name: 'CBS Sports Franchise Football',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/7b/0c/a0/7b0ca007-885a-7cfc-9fa2-2ec4394c2ecc/icon175x175.png',
    link: 'https://play.google.com/store/apps/details?id=com.cbssports.fantasy.franchisefootball2015',
    author: 'CBS Sports',
  },
  {
    name: 'Chemin de Fer de Provence',
    icon: 'https://lh3.googleusercontent.com/p80a9ZFgDd9EgKxViAOu3PF22GiEc2FaMxxlOib6SpvLR-M6wN1OSMuyzMcjIaNI4Jc=w300',
    linkAppStore: 'https://itunes.apple.com/fr/app/chemins-de-fer-de-provence/id1107542956?l=fr&ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.cheminsdeferdeprovence&hl=fr',
    author: 'Actigraph'
  },
  {
    name: 'Chillin\'',
    icon: 'http://www.chillin.io/img/logo175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/chillin/id1059803303?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.chillinmobile',
    author: 'Chillin LLC',
  },
  {
    name: 'Choke - Rap Battle With Friends',
    icon: 'http://a3.mzstatic.com/us/r30/Purple49/v4/3e/83/85/3e8385d8-140f-da38-a100-1393cef3e816/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/choke-rap-battle-with-friends/id1077937445?ls=1&mt=8',
    author: 'Henry Kirkness',
  },
  {
    name: 'clapit',
    icon: 'http://a4.mzstatic.com/us/r30/Purple60/v4/1a/42/5b/1a425b56-848a-91f5-8078-9f5473c9021f/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/clapit/id1062124740?mt=8',
    author: 'Refined Edge Solutions, LLC'
  },
  {
    name: 'Codementor - Live 1:1 Expert Developer Help',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/db/cf/35/dbcf3523-bac7-0f54-c6a8-a80bf4f43c38/icon175x175.jpeg',
    link: 'https://www.codementor.io/downloads',
    author: 'Codementor',
  },
  {
    name: 'Coiney窓口',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/c9/bc/3a/c9bc3a29-9c11-868f-b960-ca46d5fcd509/icon175x175.jpeg',
    link: 'https://itunes.apple.com/jp/app/coiney-chuang-kou/id1069271336?mt=8',
    author: 'Coiney, Inc.'
  },
  {
    name: 'Collegiate - Learn Anywhere',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/17/a9/60/17a960d3-8cbd-913a-9f08-ebd9139c116c/icon175x175.png',
    link: 'https://itunes.apple.com/app/id1072463482',
    author: 'Gaurav Arora',
  },
  {
    name: 'Company name search',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/fd/47/53/fd47537c-5861-e208-d1d1-1e26b5e45a36/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/company-name-search/id1043824076',
    author: 'The Formations Factory Ltd',
    blogs: [
      'https://medium.com/formations-factory/creating-company-name-search-app-with-react-native-36a049b0848d',
    ],
  },
  {
    name: 'Convoy Driver',
    icon: 'http://a1.mzstatic.com/us/r30/Purple30/v4/5a/74/56/5a74567d-4491-a298-65cd-722c8a7211ac/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/convoy-driver/id1045368390?mt=8',
    author: 'Convoy',
  },
  {
    name: 'DareU',
    icon: 'http://a3.mzstatic.com/us/r30/Purple6/v4/10/fb/6a/10fb6a50-57c8-061a-d865-503777bf7f00/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/dareu-dare-your-friends-dare/id1046434563?mt=8',
    author: 'Rishabh Mehan',
  },
  {
    name: 'Deskbookers',
    icon: 'http://a4.mzstatic.com/eu/r30/Purple69/v4/be/61/7d/be617d63-88f5-5629-7ac0-bc2c9eb4802a/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/nl/app/deskbookers/id964447401?mt=8',
    author: 'Emilio Rodriguez'
  },
  {
    name: 'D.I.T.',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/1b/ad/7f/1bad7f52-85e6-3f49-5593-93ab73d15fc8/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/d.i.t./id1065482319?mt=8',
    author: 'Pavlo Tkach & Mykhailo Kovalevskyi'
  },
  {
    name: 'DockMan',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/91/b5/75/91b57552-d9bc-d8bc-10a1-617de920aaa6/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/app/dockman/id1061469696',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.s21g.DockMan',
    blogs: [
      'http://www.s21g.com/DockMan.html',
    ],
    author: 'Genki Takiuchi (s21g Inc.)',
  },
  {
    name: 'Dohop Flights',
    icon: 'http://a5.mzstatic.com/us/r30/Purple60/v4/3e/94/e9/3e94e9b3-f9a0-7b27-1824-b3da732ec967/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/dohop-flights-your-new-flight/id964170399',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.dohop',
    author: 'Dohop',
  },
  {
    name: 'DONUT chatrooms for communities',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple49/v4/d4/2d/e5/d42de510-6802-2694-1b60-ca80ffa1e2cb/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/fr/app/donut-chat/id1067579321',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=me.donut.mobile',
    author: 'Damien Brugne',
  },
  {
    name: 'Due',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/a2/41/5d/a2415d5f-407a-c565-ffb4-4f27f23d8ac2/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/due-countdown-reminders-for/id1050909468?mt=8',
    author: 'Dotan Nahum',
  },
  {
    name: 'Eat or Not',
    icon: 'http://a3.mzstatic.com/us/r30/Purple5/v4/51/be/34/51be3462-b015-ebf2-11c5-69165b37fadc/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/eat-or-not/id1054565697?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.eon',
    author: 'Sharath Prabhal',
  },
  {
    name: 'Emoj3 - The emoji only social network',
    icon: 'https://emoj3.com/images/favicon/apple-touch-icon-152x152.png',
    linkAppStore: 'https://itunes.apple.com/us/app/emoj3/id1078999427?mt=8',
    link: 'https://emoj3.com',
    author: 'Waffle and Toast'
  },
  {
    name: 'Emoji Poetry',
    icon: 'http://a5.mzstatic.com/us/r30/Purple49/v4/31/b5/09/31b509b2-aaec-760f-ccec-2ce72fe7134e/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/emoji-poetry/id1068972506?l=en&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.arzamasemoji',
    author: 'forforce.com',
    blogs: [
      'http://arzamas.academy/special/emoji/english',
    ],
  },
  {
    name: 'Fan of it',
    icon: 'http://a4.mzstatic.com/us/r30/Purple3/v4/c9/3f/e8/c93fe8fb-9332-e744-f04a-0f4f78e42aa8/icon350x350.png',
    link: 'https://itunes.apple.com/za/app/fan-of-it/id1017025530?mt=8',
    author: 'Fan of it (Pty) Ltd',
  },
  {
    name: 'FastPaper',
    icon: 'http://a2.mzstatic.com/us/r30/Purple5/v4/72/b4/d8/72b4d866-90d2-3aad-d1dc-0315f2d9d045/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/fast-paper/id1001174614',
    author: 'Liubomyr Mykhalchenko (@liubko)',
  },
  {
    name: 'Feline for Product Hunt',
    icon: 'https://lh3.googleusercontent.com/MCoiCCwUan0dxzqRR_Mrr7kO308roYdI2aTsIpUGYWzUmpJT1-R2_J04weQKFEd3Mg=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.arjunkomath.product_hunt&hl=en',
    author: 'Arjun Komath',
  },
  {
    name: 'Finance',
    icon: 'https://lh3.googleusercontent.com/3VIk0kX6WyaHdQkNJVdFqW6Kn-O-rZ1RUwvu1tjQamRC33ThMIGh3dkRALpSRPjUIw=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.kfpun.finance&hl=en',
    author: 'kf (@7kfpun)',
  },
  {
    name: 'Fixt',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/46/bc/66/46bc66a2-7775-4d24-235d-e1fe28d55d7f/icon175x175.png',
    linkAppStore:  'https://itunes.apple.com/us/app/dropbot-phone-replacement/id1000855694?mt=8',
    linkPlayStore:  'https://play.google.com/store/apps/details?id=co.fixt',
    author: 'Fixt',
  },
  {
    name: 'Foodstand',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/33/c1/3b/33c13b88-8ec2-23c1-56bb-712ad9938290/icon350x350.jpeg',
    link: 'https://www.thefoodstand.com/download',
    author: 'Foodstand, Inc.',
  },
  {
    name: 'Go Fire',
    icon: 'http://a2.mzstatic.com/us/r30/Purple5/v4/42/50/5a/42505a8d-3c7a-e49a-16e3-422315f24cf1/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/gou-huo/id1001476888?ls=1&mt=8',
    author: 'beijing qingfengyun Technology Co., Ltd.',
  },
  {
    name: 'HackerWeb',
    icon: 'http://a5.mzstatic.com/us/r30/Purple49/v4/5a/bd/39/5abd3951-782c-ef12-8e40-33ebe1e43768/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/id1084209377',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=cheeaun.hackerweb',
    author: 'Lim Chee Aun',
    blogs: [
      'http://cheeaun.com/blog/2016/03/building-hackerweb-ios/',
      'http://cheeaun.com/blog/2016/05/building-hackerweb-android/',
    ],
  },
  {
    name: 'Harmonizome',
    icon: 'http://is1.mzstatic.com/image/thumb/Purple6/v4/18/a9/bc/18a9bcde-d2d9-7574-2664-e82fff7b7208/pr_source.png/350x350-75.png',
    link: 'https://itunes.apple.com/us/app/harmonizome/id1046990905?mt=8',
    author: 'Michael McDermott (@_mgmcdermott)',
  },
  {
    name: 'Hashley',
    icon: 'http://a2.mzstatic.com/us/r30/Purple4/v4/5f/19/fc/5f19fc13-e7af-cd6b-6749-cedabdaeee7d/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/hashtag-by-hashley-ironic/id1022724462?mt=8',
    author: 'Elephant, LLC',
  },
  {
    name: 'hello dating',
    icon: 'http://a3.mzstatic.com/us/r30/Purple49/v4/54/29/59/54295932-f821-35db-8556-ba4006098ee9/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/apple-store/id1072062348?pt=815680&ct=reactshowcase&mt=8',
    author: 'Gertler Davidov communication'
  },
  {
    name: 'Hey, Neighbor!',
    icon: 'https://raw.githubusercontent.com/scrollback/io.scrollback.neighborhoods/master/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    link: 'https://play.google.com/store/apps/details?id=io.scrollback.neighborhoods',
    author: 'Scrollback',
  },
  {
    name: 'Honest Reviews',
    icon: 'http://honestreviews.techulus.com/icon.png',
    link: 'https://play.google.com/store/apps/details?id=com.techulus.honestreviews&hl=en',
    author: 'Arjun Komath',
  },
  {
    name: 'Hover',
    icon: 'http://a5.mzstatic.com/us/r30/Purple3/v4/ba/55/e6/ba55e6ee-71cf-b843-f592-0917c9b6c645/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/hover-1-drone-uav-pilot-app!/id947641516?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.analyticadevelopment.android.hover',
    author: 'KevinEJohn',
  },
  {
    name: 'HSK Level 1 Chinese Flashcards',
    icon: 'http://is2.mzstatic.com/image/pf/us/r30/Purple1/v4/b2/4f/3a/b24f3ae3-2597-cc70-1040-731b425a5904/mzl.amxdcktl.jpg',
    link: 'https://itunes.apple.com/us/app/hsk-level-1-chinese-flashcards/id936639994',
    author: 'HS Schaaf',
  },
  {
    name: 'Hubhopper',
    icon: 'http://hubhopper.com/images/h_logo.jpg',
    link: 'https://play.google.com/store/apps/details?id=com.hubhopper',
    author: 'Soch Technologies',
  },
  {
    name: 'Jukebox',
    icon: 'https://s3.amazonaws.com/theartistunion-production/Jukebox-logo.png',
    link: 'https://itunes.apple.com/us/app/jukebox-offline-music-player/id1072583255?ls=1&mt=8',
    author: 'The Beat Drop Inc'
  },
  {
    name: 'JS Air',
    icon: 'http://a1.mzstatic.com/eu/r30/Purple60/v4/56/94/66/56946608-34ac-dd5a-622f-75ef0073a7cd/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/fr/app/js-air/id1112141070?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.jsair',
    author: 'Erwan DATIN',
  },
  {
    name: 'Kakapo',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple3/v4/12/ab/2a/12ab2a01-3a3c-9482-b8df-ab38ad281165/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/kakapo/id1046673139?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.kakaponative',
    author: 'Daniel Levitt',
  },
  {
    name: 'Kiwiship',
    icon: 'http://a1.mzstatic.com/us/r30/Purple4/v4/c2/92/d0/c292d053-72fd-c429-dd58-5b0ae9d75af1/icon175x175.jpeg',
    link: 'https://www.kiwiship.com',
    author: 'Kiwiship'
  },
  {
    name: 'Koza Gujarati Dictionary',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/77/95/83/77958377-05ae-4754-684a-3c9dbb67b517/icon175x175.jpeg',
    link: 'https://itunes.apple.com/in/app/koza-english-to-gujarati-dictionary/id982752928?mt=8',
    author: 'KozaApps',
  },
  {
    name: 'Leanpub',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/9f/4a/6f/9f4a6f8c-8951-ed89-4083-74ace23df9ef/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/leanpub/id913517110?ls=1&mt=8',
    author: 'Leanpub',
  },
  {
    name: 'LoadDocs',
    icon: 'http://a2.mzstatic.com/us/r30/Purple3/v4/b5/ca/78/b5ca78ca-392d-6874-48bf-762293482d42/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/loaddocs/id1041596066',
    author: 'LoadDocs',
  },
  {
    name: 'Lugg – Your On-Demand Mover',
    icon: 'http://lh3.googleusercontent.com/EV9z7kRRME2KPMBRNHnje7bBNEl_Why2CFq-MfKzBC88uSFJTYr1HO3-nPt-JuVJwKFb=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.lugg',
    author: 'Lugg',
  },
  {
    name: 'Lumpen Radio',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/46/43/00/464300b1-fae3-9640-d4a2-0eb050ea3ff2/mzl.xjjawige.png',
    link: 'https://itunes.apple.com/us/app/lumpen-radio/id1002193127?mt=8',
    author: 'Joshua Habdas',
  },
  {
    name: 'Makerist Mediathek',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple3/v4/fa/5f/4c/fa5f4ce8-5aaa-5a4b-ddcc-a0c6f681d08a/icon175x175.png',
    link: 'https://itunes.apple.com/de/app/makerist-mediathek/id1019504544',
    author: 'Railslove',
  },
  {
    name: 'MaxReward - Android',
    icon: 'https://lh3.googleusercontent.com/yynCUCdEnyW6T96xCto8KzWQr4Yeiy0M6c2p8auYMIyFgAZVBsjf4JCEX7QkPijhBg=w175-rw',
    linkAppStore: 'https://itunes.apple.com/us/app/maxreward/id1050479192?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bitstrek.maxreward&hl=en',
    author: 'Neil Ma',
  },
  {
    name: 'MinTrain',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/51/51/68/51516875-1323-3100-31a8-cd1853d9a2c0/mzl.gozwmstp.png',
    link: 'https://itunes.apple.com/us/app/mintrain/id1015739031?mt=8',
    author: 'Peter Cottle',
  },
  {
    name: 'Mobabuild',
    icon: 'http://mobabuild.co/images/applogo.png',
    linkAppStore: 'https://itunes.apple.com/tr/app/mobabuild-builds-for-league/id1059193502?l=tr&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.sercanov.mobabuild',
    author: 'Sercan Demircan ( @sercanov )',
  },
  {
    name: 'MockingBot',
    icon: 'https://s3.cn-north-1.amazonaws.com.cn/modao/downloads/images/MockingBot175.png',
    link: 'https://itunes.apple.com/cn/app/mockingbot/id1050565468?l=en&mt=8',
    author: 'YuanYi Zhang (@mockingbot)',
  },
  {
    name: 'MoneyLion',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/d7/9d/ad/d79daddc-8d67-8a6c-61e2-950425946dd2/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/moneylion/id1064677082?mt=8',
    author: 'MoneyLion LLC',
  },
  {
    name: 'Mr. Dapper',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple4/v4/e8/3f/7c/e83f7cb3-2602-f8e8-de9a-ce0a775a4a14/mzl.hmdjhfai.png',
    link: 'https://itunes.apple.com/us/app/mr.-dapper-men-fashion-app/id989735184?ls=1&mt=8',
    author: 'wei ping woon',
  },
  {
    name: 'My IP',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/a2/61/58/a261584d-a4cd-cbfa-cf9d-b5f1f15a7139/icon175x175.jpeg',
    link: 'https://itunes.apple.com/app/id1031729525?mt=8&at=11l7ss&ct=reactnativeshowcase',
    author: 'Josh Buchea',
  },
  {
    name: 'MyMuesli',
    icon: 'https://lh3.googleusercontent.com/1dCCeiyjuWRgY-Cnv-l-lOA1sVH3Cn0vkVWWZnaBQbhHOhsngLcnfy68WEerudPUysc=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.mymuesli',
    author: 'Shawn Khameneh (@shawnscode), 3DWD'
  },
  {
    name: 'MyPED',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/88/1f/fb/881ffb3b-7986-d427-7fcf-eb5920a883af/icon175x175.png',
    link: 'https://itunes.apple.com/it/app/myped/id1064907558?ls=1&mt=8',
    author: 'Impronta Advance',
  },
  {
    name: 'Nabava.net',
    icon: 'http://a1.mzstatic.com/us/r30/Purple18/v4/85/ef/4d/85ef4d52-f752-c059-48c1-baa507d1f936/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/bm/app/nabava.net-usporedi-cijene/id1100660049?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.nabava_net',
    author: 'Ars Futura'
  },
  {
    name: 'Nalathe Kerala',
    icon: 'https://lh3.googleusercontent.com/5N0WYat5WuFbhi5yR2ccdbqmiZ0wbTtKRG9GhT3YK7Z-qRvmykZyAgk0HNElOxD2JOPr=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.rhyble.nalathekerala',
    author: 'Rhyble',
  },
  {
    name: 'NeoReader',
    icon: 'http://firicon.fir.im/a4c5f1e8c52d9d98e7b990e5098a161a8f698653',
    linkAppStore: 'https://itunes.apple.com/cn/app/niu-du-neoreader/id1111443079?l=cn&mt=8',
    linkPlayStore: 'http://fir.im/neoreader',
    author: 'Neo Nie',
  },
  {
    name: 'New Music - listen to recent albums, EPs & singles',
    icon: 'http://a5.mzstatic.com/us/r30/Purple60/v4/fa/d9/be/fad9be3d-474c-4380-6391-37f234a81901/icon175x175.png',
    link: 'https://itunes.apple.com/app/new-music-keep-track-latest/id1104646834',
    author: 'Alexey Ledak',
  },
	{
    name: 'No Fluff: Hiragana',
    icon: 'https://lh3.googleusercontent.com/kStXwjpbPsu27E1nIEU1gfG0I8j9t5bAR_20OMhGZvu0j2vab3EbBV7O_KNZChjflZ_O',
    link: 'https://play.google.com/store/apps/details?id=com.hiragana',
    author: 'Matthias Sieber',
    source: 'https://github.com/manonthemat/no-fluff-hiragana'
  },
  {
    name: 'Night Light',
    icon: 'http://is3.mzstatic.com/image/pf/us/r30/Purple7/v4/5f/50/5f/5f505fe5-0a30-6bbf-6ed9-81ef09351aba/mzl.lkeqxyeo.png',
    link: 'https://itunes.apple.com/gb/app/night-light-feeding-light/id1016843582?mt=8',
    author: 'Tian Yuan',
  },
  {
    name: ':nth',
    icon: 'http://a5.mzstatic.com/us/r30/Purple49/v4/d1/92/de/d192decd-ff97-e108-eaa0-c51be79261c6/icon175x175.jpeg',
    link:  'https://itunes.apple.com/us/app/nth/id1102663176?mt=8',
    author: 'Omar Carpinteyro',
  },
  {
    name: 'Okanagan News',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/aa/93/17/aa93171e-d0ed-7e07-54a1-be27490e210c/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/okanagan-news-reader-for-viewing/id1049147148?mt=8',
    author: 'Levi Cabral',
  },
  {
    name: 'passpoints',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple1/v4/8c/a0/72/8ca072ac-2304-1bf6-16e5-701e71921f42/icon350x350.png',
    linkAppStore: 'https://itunes.apple.com/app/passpoints/id930988932',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.passpointsreactnative',
    author: 'passpoints.de',
  },
  {
    name: 'PermisPts',
    icon: 'http://a3.mzstatic.com/eu/r30/Purple20/v4/02/62/ee/0262eef2-170e-4ca2-8f8a-8079482a393b/icon175x175.png',
    link: 'https://itunes.apple.com/fr/app/permispts/id950595671?mt=8',
    author: 'Erwan DATIN',
  },
  {
    name: 'Pimmr',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/99/da/0e/99da0ee6-bc87-e1a6-1d95-7027c78f50e1/icon175x175.jpeg',
    link: 'https://itunes.apple.com/nl/app/pimmr/id1023343303?mt=8',
    author: 'Pimmr'
  },
  {
    name: 'Posyt - Tinder for ideas',
    icon: 'http://a3.mzstatic.com/us/r30/Purple6/v4/a5/b3/86/a5b38618-a5e9-6089-7425-7fa51ecd5d30/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/posyt-anonymously-meet-right/id1037842845?mt=8',
    author: 'Posyt.com',
  },
  {
    name: 'Project September',
    icon: 'http://a2.mzstatic.com/us/r30/Purple49/v4/88/0f/3b/880f3b7f-8aa0-de64-6b6f-f0ec6d6591e4/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/project-september/id1074075331?ls=1&mt=8',
    author: 'ProjectSeptember.com',
  },
  {
    name: 'QQ',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6633_1461768893/96',
    link: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.mobileqq',
    author: '邱俊',
  },
  {
    name: 'QQ空间',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_9959_1460036593/96',
    link: 'http://android.myapp.com/myapp/detail.htm?apkName=com.qzone',
    author: '薛丰',
  },
  {
    name: 'QQ音乐',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6259_1462429453/96',
    link: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.qqmusic',
    author: '石玉磊',
  },
  {
    name: 'Raindrop.io',
    icon: 'http://a5.mzstatic.com/us/r30/Purple3/v4/f0/a4/57/f0a4574e-4a59-033f-05ff-5c421f0a0b00/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/raindrop.io-keep-your-favorites/id1021913807',
    author: 'Mussabekov Rustem',
  },
  {
    name: 'Reach24',
    icon: 'http://a4.mzstatic.com/us/r30/Purple49/v4/35/0e/c8/350ec8b4-c725-4b03-3e9e-131b85e72166/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/reach24x7/id962380755?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.vantage.reachtwo&hl=en',
    author: 'Spritle Software',
  },
  {
    name: 'ReactTo36',
    icon: 'http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/e3/c8/79/e3c87934-70c6-4974-f20d-4adcfc68d71d/mzl.wevtbbkq.png',
    link: 'https://itunes.apple.com/us/app/reactto36/id989009293?mt=8',
    author: 'Jonathan Solichin',
  },
  {
    name: 'Reading',
    icon: 'http://7xr0xq.com1.z0.glb.clouddn.com/about_logo.png',
    link: 'http://www.wandoujia.com/apps/com.reading',
    author: 'RichardCao',
    blogs: [
      'http://richard-cao.github.io/2016/02/06/Reading-App-Write-In-React-Native/',
    ],
  },
  {
    name: 'Readzi',
    icon: 'http://a3.mzstatic.com/us/r30/Purple18/v4/b9/32/99/b9329992-1677-9ee2-5d04-e901e4bbb2b7/icon175x175.png',
    link: 'https://readzi.io',
    author: 'Kevin Kennedy',
    blogs: [
      'https://strazi.org/journal/building-readzi/',
    ],
  },
  {
    name: 'RenovationFind',
    icon: 'http://a2.mzstatic.com/us/r30/Purple3/v4/4f/89/af/4f89af72-9733-2f59-6876-161983a0ee82/icon175x175.png',
    link: 'https://itunes.apple.com/ca/app/renovationfind/id1040331641?mt=8',
    author: 'Christopher Lord'
  },
  {
    name: 'RepairShopr',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/fa/96/ee/fa96ee57-c5f0-0c6f-1a34-64c9d3266b86/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/repairshopr-payments-lite/id1023262888?mt=8',
    author: 'Jed Tiotuico',
  },
  {
    name: 'Rota Employer - Hire On Demand',
    link: 'https://itunes.apple.com/us/app/rota-employer-hire-on-demand/id1042270305?mt=8',
    icon: 'https://avatars2.githubusercontent.com/u/15051833?v=3&s=200',
    author: 'Rota',
  },
  {
    name: 'Rota Worker - Shifts On Demand',
    icon: 'http://a5.mzstatic.com/us/r30/Purple3/v4/51/ca/49/51ca4924-61c8-be1d-ab6d-afa510b1d393/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/rota-worker-shifts-on-demand/id1042111289?mt=8',
    author: 'Rota',
  },
  {
    name: 'RWpodPlayer - audio player for RWpod podcast',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/a8/c0/b1/a8c0b130-e44b-742d-6458-0c89fcc15b6b/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/rwpodplayer/id1053885042?mt=8',
    author: 'Alexey Vasiliev aka leopard',
  },
  {
    name: 'Samanage',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/ed/e9/ff/ede9ff34-a9f6-5eb6-2a23-fcb014b326f2/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/samanage/id1033018362',
    author: 'Samanage'
  },
  {
    name: 'SG Toto 4d',
    icon: 'http://a4.mzstatic.com/us/r30/Purple7/v4/d2/bc/46/d2bc4696-84d6-9681-a49f-7f660d6b04a7/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/sg-toto-4d/id1006371481?mt=8',
    author: 'Steve Ng'
  },
  {
    name: '쉐어하우스',
    icon: 'http://a4.mzstatic.com/us/r30/Purple5/v4/78/1c/83/781c8325-a1e1-4afc-f106-a629bcf3c6ef/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/kr/app/sweeohauseu-sesang-ui-modeun/id1060914858?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=kr.dobbit.sharehows',
    author: 'Dobbit Co., Ltd.'
  },
  {
    name: 'SAY',
    icon: 'http://a1.mzstatic.com/us/r30/Purple30/v4/ee/d8/b3/eed8b3e5-c55d-bc97-7228-2bfb4323ddef/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/id1069693851',
    author: 'beijing qingfengyun Technology Co., Ltd.',
  },
  {
    name: 'ShareWis',
    icon: 'https://s3-ap-northeast-1.amazonaws.com/sw-misc/sharewis3_app.png',
    link: 'https://itunes.apple.com/jp/app/id585517208',
    author: 'ShareWis Inc.'
  },
  {
    name: 'sneat: réservez les meilleurs restaurants de Paris',
    icon: 'http://a3.mzstatic.com/eu/r30/Purple49/v4/71/71/df/7171df47-6e03-8619-19a8-07f52186b0ed/icon175x175.jpeg',
    link: 'https://itunes.apple.com/fr/app/sneat-reservez-les-meilleurs/id1062510079?l=en&mt=8',
    author: 'sneat'
  },
  {
    name: 'SCTV Sports',
    icon: 'https://farm8.staticflickr.com/7353/27553089935_a3928f2097_o.png',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.sctvsport.bongdatructuyen',
    author: 'SCTV Digital',
  },  
  {
    name: 'Software Interview Preparation',
    icon: 'https://lh3.googleusercontent.com/11AuzaeCnxrRnIp1E_a_6WWiQIRRoWhrvFr20eCRJX4ZMW6O3tGjZLiUw3thKUgGaC8X=w300',
    link: 'https://play.google.com/store/apps/details?id=com.SoftwareInterview',
    author: 'Andrew F. Ly',
  },
  {
    name: 'Spatula',
    icon: 'https://lh3.googleusercontent.com/26xtcDsloLCAOpqgH_87sDxaSJsLuSN--oj-z5Frcdsaq4ta2GQlktF5ktTNWrRHyqo=w300-rw',
    linkAppStore: 'https://itunes.apple.com/us/app/spatula/id1090496189?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.usespatula',
    author: 'Kushal Dave'
  },
  {
    name: 'Splash: On-Demand Auto Detailing',
    icon: 'http://a2.mzstatic.com/us/r30/Purple30/v4/c3/14/74/c314748f-ff16-c7ec-77c5-1a84657d9154/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/splash-on-demand-auto-detailing/id1111109177',
    author: 'Alex Leventer'
  },
  {
    name: 'Spero for Cancer',
    icon: 'https://s3-us-west-1.amazonaws.com/cancerspot/site_images/Spero1024.png',
    link: 'https://geo.itunes.apple.com/us/app/spero-for-cancer/id1033923573?mt=8',
    author: 'Spero.io',
  },
  {
    name: 'Tabtor Parent',
    icon: 'http://a1.mzstatic.com/us/r30/Purple4/v4/80/50/9d/80509d05-18f4-a0b8-0cbb-9ba927d04477/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/tabtor-math/id1018651199?utm_source=ParentAppLP',
    author: 'PrazAs Learning Inc.',
  },
  {
    name: 'TeamWarden',
    icon: 'http://a1.mzstatic.com/eu/r30/Purple69/v4/09/37/61/0937613a-46e3-3278-5457-5de49a4ee9ab/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/teamwarden/id1052570507?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.teamwarden',
    author: 'nittygritty.net',
  },
  {
    name: 'Text Blast',
    icon: 'http://a3.mzstatic.com/us/r30/Purple49/v4/4f/29/58/4f2958a1-7f35-9260-6340-c67ac29d7740/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/text-blast-2016/id1023852862?mt=8',
    author: 'Sesh',
  },
  {
    name: 'Thai Tone',
    icon: 'http://a5.mzstatic.com/us/r30/Purple2/v4/b1/e6/2b/b1e62b3d-6747-0d0b-2a21-b6ba316a7890/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/thai-tone/id1064086189?mt=8',
    author: 'Alexey Ledak',
  },
  {
    name: 'Ticketea',
    icon: 'http://f.cl.ly/items/0n3g3x2t0W0a0d0b1F0C/tkt-icon.png',
    linkAppStore: 'https://itunes.apple.com/es/app/entradas-teatro-y-conciertos/id1060067658?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.ticketea.geminis',
    author: 'Ticketea (@ticketeaeng)',
  },
  {
    name: 'Tong Xing Wang',
    icon: 'http://a3.mzstatic.com/us/r30/Purple1/v4/7d/52/a7/7d52a71f-9532-82a5-b92f-87076624fdb2/icon175x175.jpeg',
    link: 'https://itunes.apple.com/cn/app/tong-xing-wang/id914254459?mt=8',
    author: 'Ho Yin Tsun Eugene',
  },
  {
    name: 'Trump Blocker - That Filters Every Link',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/e7/91/4c/e7914cbd-c405-8411-2173-e8ed59a901bd/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/trump-blocker-that-filters/id1071733244?mt=8',
    author: 'Footbits, Inc.',
  },
  {
    name: 'uSwitch - Energy switching app',
    icon: 'https://lh3.googleusercontent.com/NpkGlwFWdj7VsK2ueVwlgdrrBrNJ-yN-4TkEHjjSjDUu7NpMcfyAp10p97f0zci0CSFQ=w300-rw',
    linkAppStore: 'https://itunes.apple.com/gb/app/uswitch-compare-switch-save/id935325621?mt=8&ct=react',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.uswitchmobileapp',
    author: 'uSwitch Ltd',
    videos: [
      'https://www.youtube.com/watch?v=YgJtAEZJN28',
    ],
  },
  {
    name: 'Veckopengen – för barn och föräldrar',
    icon: 'https://is5-ssl.mzstatic.com/image/thumb/Purple49/v4/0a/63/f1/0a63f16c-f0f3-6316-0f9d-1682b04c595d/mzl.sswtnsav.jpg/340x340bb-80.png',
    linkAppStore: 'https://itunes.apple.com/se/app/veckopengen-for-barn-och-foraldrar/id935778197',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=se.veckopengen.app',
    author: 'Barnpengar AB',
    videos: [
      'https://www.youtube.com/watch?v=tzsXFGmqJec',
    ],
  },
  {
    name: 'Veggies in Season',
    icon: 'https://s3.amazonaws.com/veggies-assets/icon175x175.png',
    link: 'https://itunes.apple.com/es/app/veggies-in-season/id1088215278?mt=8',
    author: 'Victor Delgado',
  },
  {
    name: 'Vorterix',
    icon: 'http://a2.mzstatic.com/us/r30/Purple49/v4/3a/f0/b4/3af0b475-f0e8-e81d-eb38-1ec1dfa9b2f4/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/ar/app/vorterix/id577990518?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.vorterix',
    author: 'Dift & underscope.io',
  },
  {
    name: 'WEARVR',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/4f/5a/28/4f5a2876-9530-ef83-e399-c5ef5b2dab80/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/wearvr/id1066288171?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.wearvr.app',
    author: 'WEARVR LLC',
  },
  {
    name: 'WeatherEh - Canada weather',
    icon: 'http://a2.mzstatic.com/us/r30/Purple18/v4/39/cf/84/39cf8411-acc3-f7d6-3923-39973c2eb511/icon175x175.jpeg',
    link: 'https://itunes.apple.com/app/id1112813447',
    author: 'Zhao Han',
  },
  {
    name: 'wego concerts',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/03/91/2d/03912daa-fae7-6a25-5f11-e6b19290b3f4/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/wego-concerts-follow-friends/id869478093?mt=8',
    author: 'Wego, LLC',
  },
  {
    name: 'Whammy',
    icon: 'http://a4.mzstatic.com/us/r30/Purple49/v4/8f/1c/21/8f1c2158-c7fb-1bbb-94db-e77b867aad1a/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/whammy/id899759777',
    author: 'Play Company',
  },
  {
    name: 'Whisky Journal',
    icon: 'http://cdn.whiskyjournal.co/files/icon350x350.png',
    link: 'https://itunes.apple.com/au/app/whiskyjournal/id1097713368',
    author: 'Matt Mcnamee',
  },
  {
    name: 'WOOP',
    icon: 'http://a4.mzstatic.com/us/r30/Purple6/v4/b0/44/f9/b044f93b-dbf3-9ae5-0f36-9b4956628cab/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/woop-app/id790247988?mt=8',
    author: 'Moritz Schwörer (@mosch)',
  },
  {
    name: 'YAMU',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/a2/d0/08/a2d0089d-326e-4402-dba2-fd5385e3de65/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/yamu/id686819827?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=org.farook.yamu',
    author: 'YAMU (Private) Limited (@yamulk)',
  },
  {
    name: 'Yoloci',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple7/v4/fa/e5/26/fae52635-b97c-bd53-2ade-89e2a4326745/icon175x175.jpeg',
    link: 'https://itunes.apple.com/de/app/yoloci/id991323225?mt=8',
    author: 'Yonduva GmbH (@PhilippKrone)',
  },
  {
    name: 'youmeyou',
    icon: 'http://is1.mzstatic.com/image/pf/us/r30/Purple7/v4/7c/42/30/7c423042-8945-7733-8af3-1523468706a8/mzl.qlecxphf.png',
    link: 'https://itunes.apple.com/us/app/youmeyou/id949540333?mt=8',
    author: 'youmeyou, LLC',
  },
  {
    name: 'Ziliun',
    icon: 'https://lh3.googleusercontent.com/c6ot13BVlU-xONcQi-llFmKXZCLRGbfrCv1RnctWtOELtPYMc0A52srXAfkU897QIg=w300',
    link: 'https://play.google.com/store/apps/details?id=com.ziliunapp',
    author: 'Sonny Lazuardi',
  },
  {
    name: 'YazBoz',
    icon: 'http://a4.mzstatic.com/us/r30/Purple6/v4/80/4f/43/804f431d-2828-05aa-2593-99cfb0475351/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/yazboz-batak-esli-batak-okey/id1048620855?ls=1&mt=8',
    author: 'Melih Mucuk',
  },
  {
    name: 'ZBNF - Zero Budget Natural Farming',
    icon: 'https://lh3.googleusercontent.com/gnEBtkUTy89wgbRlEmbETJN9qzHgAAkcvCknWhZbomDRexFAjkU8W-DQFtFygTGeLtA=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.zbnf',
    author: 'Chandra Sekhar Kode',
  },
  {
    name: '天才段子手',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_12236104_1451810987/96',
    linkAppStore: 'https://itunes.apple.com/us/app/tian-cai-duan-zi-shou-shen/id992312701?l=zh&ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.geniusJokeWriter.app',
    author: 'Ran Zhao&Ji Zhao'
  },
  {
    name: '你造么',
    icon: 'http://7xk1ez.com2.z0.glb.qiniucdn.com/logo-mobile-0114logo_welcom.png',
    link: 'https://itunes.apple.com/us/app/ni-zao-me/id1025294933?l=zh&ls=1&mt=8',
    author: 'Scott Chen(@NZAOM)'
  },
  {
    name: 'うたよみん',
    icon: 'http://a4.mzstatic.com/jp/r30/Purple69/v4/19/8f/fa/198ffafe-66a6-d682-c8d1-47faf2b0badb/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/jp/app/minnano-duan-ge-tou-gaokomyuniti/id675671254?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.plasticaromantica.utayomin',
    author: 'Takayuki IMAI'
  },
  {
    name: '烘焙帮',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/79/85/ba/7985ba1d-a807-7c34-98f1-e9e2ed5d2cb5/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/cn/app/hong-bei-bang-hai-liang-hong/id1007812319?mt=8',
    author: 'Hongbeibang'
  },
  {
    name: '找找',
    icon: 'https://lh3.googleusercontent.com/H0SILVHcDUxSMoSQwMb2QYtLjTBCqvK5ZEjOEwKQQ-2qnRV6Hd9Hn-gtSGPaoIOPwA=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.biideal.biichat',
    author: 'biideal Inc.'
  },
  {
    name: '饿小闲',
    icon: 'https://xiaoxian.ele.me/download/images/share_page/ic_launcher.png',
    linkAppStore: 'https://itunes.apple.com/cn/app/e-xiao-xian/id1092025196',
    author: 'Eleme',
  },
  {
    name: '全民K歌',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_10966186_1460087288/96',
    link: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.karaoke',
    author: '石玉磊',
  },
  {
    name: 'Emberall',
    icon: 'http://assets.emberall.com/images/app/icons/medium.png',
    link: 'https://emberall.com/',
    author: 'Kyle Corbitt',
  },
  {
    name: '鉅亨財經新聞',
    icon: 'http://a4.mzstatic.com/us/r30/Purple18/v4/1e/b1/dd/1eb1dd6e-0d9e-03cf-22f9-1b6fd816814d/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/ju-heng-cai-jing-xin-wen/id1071014509?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.cnyes.android',
    author: '鉅亨網',
  },
];

var AppList = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    )
  },

  _renderApp: function(app, i) {
    var inner = (
      <div>
        <img src={app.icon} alt={app.name} />
        <h3>{app.name}</h3>
        {app.linkAppStore || app.linkPlayStore ? this._renderLinks(app) : null}
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
