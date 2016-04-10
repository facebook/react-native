var apps = [
  {
    name: 'Accio',
    icon: 'http://a3.mzstatic.com/us/r30/Purple3/v4/03/a1/5b/03a15b9f-04d7-a70a-620a-9c9850a859aa/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/accio-on-demand-delivery/id1047060673?mt=8',
    author: 'Accio Delivery Inc.',
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
    name: 'Codementor - Live 1:1 Expert Developer Help',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/db/cf/35/dbcf3523-bac7-0f54-c6a8-a80bf4f43c38/icon175x175.jpeg',
    link: 'https://www.codementor.io/downloads',
    author: 'Codementor',
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
    link: 'https://itunes.apple.com/us/app/hackerweb/id1084209377?mt=8',
    author: 'Lim Chee Aun',
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
    name: 'Kakapo',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple3/v4/12/ab/2a/12ab2a01-3a3c-9482-b8df-ab38ad281165/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/kakapo/id1046673139?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.kakaponative',
    author: 'Daniel Levitt',
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
    name: 'Nalathe Kerala',
    icon: 'https://lh3.googleusercontent.com/5N0WYat5WuFbhi5yR2ccdbqmiZ0wbTtKRG9GhT3YK7Z-qRvmykZyAgk0HNElOxD2JOPr=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.rhyble.nalathekerala',
    author: 'Rhyble',
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
    name: 'Okanagan News',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/aa/93/17/aa93171e-d0ed-7e07-54a1-be27490e210c/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/okanagan-news-reader-for-viewing/id1049147148?mt=8',
    author: 'Levi Cabral',
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
    name: 'Raindrop.io',
    icon: 'http://a5.mzstatic.com/us/r30/Purple3/v4/f0/a4/57/f0a4574e-4a59-033f-05ff-5c421f0a0b00/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/raindrop.io-keep-your-favorites/id1021913807',
    author: 'Mussabekov Rustem',
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
    name: 'SG Toto 4d',
    icon: 'http://a4.mzstatic.com/us/r30/Purple7/v4/d2/bc/46/d2bc4696-84d6-9681-a49f-7f660d6b04a7/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/sg-toto-4d/id1006371481?mt=8',
    author: 'Steve Ng'
  },
  {
    name: 'ShareHows',
    icon: 'http://a4.mzstatic.com/us/r30/Purple5/v4/78/1c/83/781c8325-a1e1-4afc-f106-a629bcf3c6ef/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/kr/app/sweeohauseu-sesang-ui-modeun/id1060914858?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=kr.dobbit.sharehows',
    author: 'Dobbit Co., Ltd.'
  },
  {
    name: 'sneat: réservez les meilleurs restaurants de Paris',
    icon: 'http://a3.mzstatic.com/eu/r30/Purple49/v4/71/71/df/7171df47-6e03-8619-19a8-07f52186b0ed/icon175x175.jpeg',
    link: 'https://itunes.apple.com/fr/app/sneat-reservez-les-meilleurs/id1062510079?l=en&mt=8',
    author: 'sneat'
  },
  {
    name: 'Software Interview Preparation',
    icon: 'https://lh3.googleusercontent.com/11AuzaeCnxrRnIp1E_a_6WWiQIRRoWhrvFr20eCRJX4ZMW6O3tGjZLiUw3thKUgGaC8X=w300',
    link: 'https://play.google.com/store/apps/details?id=com.SoftwareInterview',
    author: 'Andrew F. Ly',
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
    name: 'Tong Xing Wang',
    icon: 'http://a3.mzstatic.com/us/r30/Purple1/v4/7d/52/a7/7d52a71f-9532-82a5-b92f-87076624fdb2/icon175x175.jpeg',
    link: 'https://itunes.apple.com/cn/app/tong-xing-wang/id914254459?mt=8',
    author: 'Ho Yin Tsun Eugene',
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
    name: 'Veggies in Season',
    icon: 'https://s3.amazonaws.com/veggies-assets/icon175x175.png',
    link: 'https://itunes.apple.com/es/app/veggies-in-season/id1088215278?mt=8',
    author: 'Victor Delgado',
  },
  {
    name: 'WEARVR',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/4f/5a/28/4f5a2876-9530-ef83-e399-c5ef5b2dab80/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/wearvr/id1066288171?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.wearvr.app',
    author: 'WEARVR LLC',
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
    name: 'WOOP',
    icon: 'http://a4.mzstatic.com/us/r30/Purple6/v4/b0/44/f9/b044f93b-dbf3-9ae5-0f36-9b4956628cab/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/woop-app/id790247988?mt=8',
    author: 'Moritz Schwörer (@mosch)',
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
    name: 'Spatula',
    icon: 'https://lh3.googleusercontent.com/26xtcDsloLCAOpqgH_87sDxaSJsLuSN--oj-z5Frcdsaq4ta2GQlktF5ktTNWrRHyqo=w300-rw',
    linkAppStore: 'https://itunes.apple.com/us/app/spatula/id1090496189?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.usespatula',
    author: 'Kushal Dave'
  }
];

module.exports = apps;
