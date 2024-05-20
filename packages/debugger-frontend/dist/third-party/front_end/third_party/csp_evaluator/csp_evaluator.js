/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author lwe@google.com (Lukas Weichselbaum)
 */
class e{type;description;severity;directive;value;constructor(e,s,t,o,i){this.type=e,this.description=s,this.severity=t,this.directive=o,this.value=i}static getHighestSeverity(e){if(0===e.length)return s.NONE;return e.map((e=>e.severity)).reduce(((e,s)=>e<s?e:s),s.NONE)}equals(s){return s instanceof e&&(s.type===this.type&&s.description===this.description&&s.severity===this.severity&&s.directive===this.directive&&s.value===this.value)}}var s,t,o,i,n;!function(e){e[e.HIGH=10]="HIGH",e[e.SYNTAX=20]="SYNTAX",e[e.MEDIUM=30]="MEDIUM",e[e.HIGH_MAYBE=40]="HIGH_MAYBE",e[e.STRICT_CSP=45]="STRICT_CSP",e[e.MEDIUM_MAYBE=50]="MEDIUM_MAYBE",e[e.INFO=60]="INFO",e[e.NONE=100]="NONE"}(s||(s={})),function(e){e[e.MISSING_SEMICOLON=100]="MISSING_SEMICOLON",e[e.UNKNOWN_DIRECTIVE=101]="UNKNOWN_DIRECTIVE",e[e.INVALID_KEYWORD=102]="INVALID_KEYWORD",e[e.NONCE_CHARSET=106]="NONCE_CHARSET",e[e.MISSING_DIRECTIVES=300]="MISSING_DIRECTIVES",e[e.SCRIPT_UNSAFE_INLINE=301]="SCRIPT_UNSAFE_INLINE",e[e.SCRIPT_UNSAFE_EVAL=302]="SCRIPT_UNSAFE_EVAL",e[e.PLAIN_URL_SCHEMES=303]="PLAIN_URL_SCHEMES",e[e.PLAIN_WILDCARD=304]="PLAIN_WILDCARD",e[e.SCRIPT_ALLOWLIST_BYPASS=305]="SCRIPT_ALLOWLIST_BYPASS",e[e.OBJECT_ALLOWLIST_BYPASS=306]="OBJECT_ALLOWLIST_BYPASS",e[e.NONCE_LENGTH=307]="NONCE_LENGTH",e[e.IP_SOURCE=308]="IP_SOURCE",e[e.DEPRECATED_DIRECTIVE=309]="DEPRECATED_DIRECTIVE",e[e.SRC_HTTP=310]="SRC_HTTP",e[e.STRICT_DYNAMIC=400]="STRICT_DYNAMIC",e[e.STRICT_DYNAMIC_NOT_STANDALONE=401]="STRICT_DYNAMIC_NOT_STANDALONE",e[e.NONCE_HASH=402]="NONCE_HASH",e[e.UNSAFE_INLINE_FALLBACK=403]="UNSAFE_INLINE_FALLBACK",e[e.ALLOWLIST_FALLBACK=404]="ALLOWLIST_FALLBACK",e[e.IGNORED=405]="IGNORED",e[e.REQUIRE_TRUSTED_TYPES_FOR_SCRIPTS=500]="REQUIRE_TRUSTED_TYPES_FOR_SCRIPTS",e[e.REPORTING_DESTINATION_MISSING=600]="REPORTING_DESTINATION_MISSING",e[e.REPORT_TO_ONLY=601]="REPORT_TO_ONLY"}(t||(t={}));
/**
 * @fileoverview CSP definitions and helper functions.
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class a{directives={};clone(){const e=new a;for(const[s,t]of Object.entries(this.directives))t&&(e.directives[s]=[...t]);return e}convertToString(){let e="";for(const[s,t]of Object.entries(this.directives)){if(e+=s,void 0!==t)for(let s,o=0;s=t[o];o++)e+=" ",e+=s;e+="; "}return e}getEffectiveCsp(i,a){const c=a||[],l=this.clone(),u=l.getEffectiveDirective(n.SCRIPT_SRC),d=this.directives[u]||[],m=l.directives[u];if(m&&(l.policyHasScriptNonces()||l.policyHasScriptHashes()))if(i>=r.CSP2)d.includes(o.UNSAFE_INLINE)&&(f(m,o.UNSAFE_INLINE),c.push(new e(t.IGNORED,"unsafe-inline is ignored if a nonce or a hash is present. (CSP2 and above)",s.NONE,u,o.UNSAFE_INLINE)));else for(const e of d)(e.startsWith("'nonce-")||e.startsWith("'sha"))&&f(m,e);if(m&&this.policyHasStrictDynamic())if(i>=r.CSP3)for(const i of d)i.startsWith("'")&&i!==o.SELF&&i!==o.UNSAFE_INLINE||(f(m,i),c.push(new e(t.IGNORED,"Because of strict-dynamic this entry is ignored in CSP3 and above",s.NONE,u,i)));else f(m,o.STRICT_DYNAMIC);return i<r.CSP3&&(delete l.directives[n.REPORT_TO],delete l.directives[n.WORKER_SRC],delete l.directives[n.MANIFEST_SRC],delete l.directives[n.TRUSTED_TYPES],delete l.directives[n.REQUIRE_TRUSTED_TYPES_FOR]),l}getEffectiveDirective(e){return!(e in this.directives)&&c.includes(e)?n.DEFAULT_SRC:e}getEffectiveDirectives(e){return[...new Set(e.map((e=>this.getEffectiveDirective(e))))]}policyHasScriptNonces(){const e=this.getEffectiveDirective(n.SCRIPT_SRC);return(this.directives[e]||[]).some((e=>S(e)))}policyHasScriptHashes(){const e=this.getEffectiveDirective(n.SCRIPT_SRC);return(this.directives[e]||[]).some((e=>_(e)))}policyHasStrictDynamic(){const e=this.getEffectiveDirective(n.SCRIPT_SRC);return(this.directives[e]||[]).includes(o.STRICT_DYNAMIC)}}!function(e){e.SELF="'self'",e.NONE="'none'",e.UNSAFE_INLINE="'unsafe-inline'",e.UNSAFE_EVAL="'unsafe-eval'",e.WASM_EVAL="'wasm-eval'",e.WASM_UNSAFE_EVAL="'wasm-unsafe-eval'",e.STRICT_DYNAMIC="'strict-dynamic'",e.UNSAFE_HASHED_ATTRIBUTES="'unsafe-hashed-attributes'",e.UNSAFE_HASHES="'unsafe-hashes'",e.REPORT_SAMPLE="'report-sample'",e.BLOCK="'block'",e.ALLOW="'allow'"}(o||(o={})),function(e){e.SCRIPT="'script'"}(i||(i={})),function(e){e.CHILD_SRC="child-src",e.CONNECT_SRC="connect-src",e.DEFAULT_SRC="default-src",e.FONT_SRC="font-src",e.FRAME_SRC="frame-src",e.IMG_SRC="img-src",e.MEDIA_SRC="media-src",e.OBJECT_SRC="object-src",e.SCRIPT_SRC="script-src",e.SCRIPT_SRC_ATTR="script-src-attr",e.SCRIPT_SRC_ELEM="script-src-elem",e.STYLE_SRC="style-src",e.STYLE_SRC_ATTR="style-src-attr",e.STYLE_SRC_ELEM="style-src-elem",e.PREFETCH_SRC="prefetch-src",e.MANIFEST_SRC="manifest-src",e.WORKER_SRC="worker-src",e.BASE_URI="base-uri",e.PLUGIN_TYPES="plugin-types",e.SANDBOX="sandbox",e.DISOWN_OPENER="disown-opener",e.FORM_ACTION="form-action",e.FRAME_ANCESTORS="frame-ancestors",e.NAVIGATE_TO="navigate-to",e.REPORT_TO="report-to",e.REPORT_URI="report-uri",e.BLOCK_ALL_MIXED_CONTENT="block-all-mixed-content",e.UPGRADE_INSECURE_REQUESTS="upgrade-insecure-requests",e.REFLECTED_XSS="reflected-xss",e.REFERRER="referrer",e.REQUIRE_SRI_FOR="require-sri-for",e.TRUSTED_TYPES="trusted-types",e.REQUIRE_TRUSTED_TYPES_FOR="require-trusted-types-for",e.WEBRTC="webrtc"}(n||(n={}));const c=[n.CHILD_SRC,n.CONNECT_SRC,n.DEFAULT_SRC,n.FONT_SRC,n.FRAME_SRC,n.IMG_SRC,n.MANIFEST_SRC,n.MEDIA_SRC,n.OBJECT_SRC,n.SCRIPT_SRC,n.SCRIPT_SRC_ATTR,n.SCRIPT_SRC_ELEM,n.STYLE_SRC,n.STYLE_SRC_ATTR,n.STYLE_SRC_ELEM,n.WORKER_SRC];var r;function l(e){return Object.values(n).includes(e)}function u(e){return Object.values(o).includes(e)}function d(e){return new RegExp("^[a-zA-Z][+a-zA-Z0-9.-]*:$").test(e)}!function(e){e[e.CSP1=1]="CSP1",e[e.CSP2=2]="CSP2",e[e.CSP3=3]="CSP3"}(r||(r={}));const m=new RegExp("^'nonce-[a-zA-Z0-9+/_-]+[=]{0,2}'$"),p=new RegExp("^'nonce-(.+)'$");function S(e,s){return(s?m:p).test(e)}const E=new RegExp("^'(sha256|sha384|sha512)-[a-zA-Z0-9+/]+[=]{0,2}'$"),g=new RegExp("^'(sha256|sha384|sha512)-(.+)'$");function _(e,s){return(s?E:g).test(e)}Error;function f(e,s){if(e.includes(s)){const t=e.findIndex((e=>s===e));e.splice(t,1)}}
/**
 * @fileoverview Collection of CSP parser checks which can be used to find
 * common syntax mistakes like missing semicolons, invalid directives or
 * invalid keywords.
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Collection of popular sites/CDNs hosting Angular.
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const R=["//gstatic.com/fsn/angular_js-bundle1.js","//www.gstatic.com/fsn/angular_js-bundle1.js","//www.googleadservices.com/pageadimg/imgad","//yandex.st/angularjs/1.2.16/angular-cookies.min.js","//yastatic.net/angularjs/1.2.23/angular.min.js","//yuedust.yuedu.126.net/js/components/angular/angular.js","//art.jobs.netease.com/script/angular.js","//csu-c45.kxcdn.com/angular/angular.js","//elysiumwebsite.s3.amazonaws.com/uploads/blog-media/rockstar/angular.min.js","//inno.blob.core.windows.net/new/libs/AngularJS/1.2.1/angular.min.js","//gift-talk.kakao.com/public/javascripts/angular.min.js","//ajax.googleapis.com/ajax/libs/angularjs/1.2.0rc1/angular-route.min.js","//master-sumok.ru/vendors/angular/angular-cookies.js","//ayicommon-a.akamaihd.net/static/vendor/angular-1.4.2.min.js","//pangxiehaitao.com/framework/angular-1.3.9/angular-animate.min.js","//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.16/angular.min.js","//96fe3ee995e96e922b6b-d10c35bd0a0de2c718b252bc575fdb73.ssl.cf1.rackcdn.com/angular.js","//oss.maxcdn.com/angularjs/1.2.20/angular.min.js","//reports.zemanta.com/smedia/common/angularjs/1.2.11/angular.js","//cdn.shopify.com/s/files/1/0225/6463/t/1/assets/angular-animate.min.js","//parademanagement.com.s3-website-ap-southeast-1.amazonaws.com/js/angular.min.js","//cdn.jsdelivr.net/angularjs/1.1.2/angular.min.js","//eb2883ede55c53e09fd5-9c145fb03d93709ea57875d307e2d82e.ssl.cf3.rackcdn.com/components/angular-resource.min.js","//andors-trail.googlecode.com/git/AndorsTrailEdit/lib/angular.min.js","//cdn.walkme.com/General/EnvironmentTests/angular/angular.min.js","//laundrymail.com/angular/angular.js","//s3-eu-west-1.amazonaws.com/staticancpa/js/angular-cookies.min.js","//collade.demo.stswp.com/js/vendor/angular.min.js","//mrfishie.github.io/sailor/bower_components/angular/angular.min.js","//askgithub.com/static/js/angular.min.js","//services.amazon.com/solution-providers/assets/vendor/angular-cookies.min.js","//raw.githubusercontent.com/angular/code.angularjs.org/master/1.0.7/angular-resource.js","//prb-resume.appspot.com/bower_components/angular-animate/angular-animate.js","//dl.dropboxusercontent.com/u/30877786/angular.min.js","//static.tumblr.com/x5qdx0r/nPOnngtff/angular-resource.min_1_.js","//storage.googleapis.com/assets-prod.urbansitter.net/us-sym/assets/vendor/angular-sanitize/angular-sanitize.min.js","//twitter.github.io/labella.js/bower_components/angular/angular.min.js","//cdn2-casinoroom.global.ssl.fastly.net/js/lib/angular-animate.min.js","//www.adobe.com/devnet-apps/flashshowcase/lib/angular/angular.1.1.5.min.js","//eternal-sunset.herokuapp.com/bower_components/angular/angular.js","//cdn.bootcss.com/angular.js/1.2.0/angular.min.js"],h=["//vk.com/swf/video.swf","//ajax.googleapis.com/ajax/libs/yui/2.8.0r4/build/charts/assets/charts.swf"],I=["googletagmanager.com","www.googletagmanager.com","www.googleadservices.com","google-analytics.com","ssl.google-analytics.com","www.google-analytics.com"],C=["//bebezoo.1688.com/fragment/index.htm","//www.google-analytics.com/gtm/js","//googleads.g.doubleclick.net/pagead/conversion/1036918760/wcm","//www.googleadservices.com/pagead/conversion/1070110417/wcm","//www.google.com/tools/feedback/escalation-options","//pin.aliyun.com/check_audio","//offer.alibaba.com/market/CID100002954/5/fetchKeyword.do","//ccrprod.alipay.com/ccr/arriveTime.json","//group.aliexpress.com/ajaxAcquireGroupbuyProduct.do","//detector.alicdn.com/2.7.3/index.php","//suggest.taobao.com/sug","//translate.google.com/translate_a/l","//count.tbcdn.cn//counter3","//wb.amap.com/channel.php","//translate.googleapis.com/translate_a/l","//afpeng.alimama.com/ex","//accounts.google.com/o/oauth2/revoke","//pagead2.googlesyndication.com/relatedsearch","//yandex.ru/soft/browsers/check","//api.facebook.com/restserver.php","//mts0.googleapis.com/maps/vt","//syndication.twitter.com/widgets/timelines/765840589183213568","//www.youtube.com/profile_style","//googletagmanager.com/gtm/js","//mc.yandex.ru/watch/24306916/1","//share.yandex.net/counter/gpp/","//ok.go.mail.ru/lady_on_lady_recipes_r.json","//d1f69o4buvlrj5.cloudfront.net/__efa_15_1_ornpba.xekq.arg/optout_check","//www.googletagmanager.com/gtm/js","//api.vk.com/method/wall.get","//www.sharethis.com/get-publisher-info.php","//google.ru/maps/vt","//pro.netrox.sc/oapi/h_checksite.ashx","//vimeo.com/api/oembed.json/","//de.blog.newrelic.com/wp-admin/admin-ajax.php","//ajax.googleapis.com/ajax/services/search/news","//ssl.google-analytics.com/gtm/js","//pubsub.pubnub.com/subscribe/demo/hello_world/","//pass.yandex.ua/services","//id.rambler.ru/script/topline_info.js","//m.addthis.com/live/red_lojson/100eng.json","//passport.ngs.ru/ajax/check","//catalog.api.2gis.ru/ads/search","//gum.criteo.com/sync","//maps.google.com/maps/vt","//ynuf.alipay.com/service/um.json","//securepubads.g.doubleclick.net/gampad/ads","//c.tiles.mapbox.com/v3/texastribune.tx-congress-cvap/6/15/26.grid.json","//rexchange.begun.ru/banners","//an.yandex.ru/page/147484","//links.services.disqus.com/api/ping","//api.map.baidu.com/","//tj.gongchang.com/api/keywordrecomm/","//data.gongchang.com/livegrail/","//ulogin.ru/token.php","//beta.gismeteo.ru/api/informer/layout.js/120x240-3/ru/","//maps.googleapis.com/maps/api/js/GeoPhotoService.GetMetadata","//a.config.skype.com/config/v1/Skype/908_1.33.0.111/SkypePersonalization","//maps.beeline.ru/w","//target.ukr.net/","//www.meteoprog.ua/data/weather/informer/Poltava.js","//cdn.syndication.twimg.com/widgets/timelines/599200054310604802","//wslocker.ru/client/user.chk.php","//community.adobe.com/CommunityPod/getJSON","//maps.google.lv/maps/vt","//dev.virtualearth.net/REST/V1/Imagery/Metadata/AerialWithLabels/26.318581","//awaps.yandex.ru/10/8938/02400400.","//a248.e.akamai.net/h5.hulu.com/h5.mp4","//nominatim.openstreetmap.org/","//plugins.mozilla.org/en-us/plugins_list.json","//h.cackle.me/widget/32153/bootstrap","//graph.facebook.com/1/","//fellowes.ugc.bazaarvoice.com/data/reviews.json","//widgets.pinterest.com/v3/pidgets/boards/ciciwin/hedgehog-squirrel-crafts/pins/","//www.linkedin.com/countserv/count/share","//se.wikipedia.org/w/api.php","//cse.google.com/api/007627024705277327428/cse/r3vs7b0fcli/queries/js","//relap.io/api/v2/similar_pages_jsonp.js","//c1n3.hypercomments.com/stream/subscribe","//maps.google.de/maps/vt","//books.google.com/books","//connect.mail.ru/share_count","//tr.indeed.com/m/newjobs","//www-onepick-opensocial.googleusercontent.com/gadgets/proxy","//www.panoramio.com/map/get_panoramas.php","//client.siteheart.com/streamcli/client","//www.facebook.com/restserver.php","//autocomplete.travelpayouts.com/avia","//www.googleapis.com/freebase/v1/topic/m/0344_","//mts1.googleapis.com/mapslt/ft","//api.twitter.com/1/statuses/oembed.json","//fast.wistia.com/embed/medias/o75jtw7654.json","//partner.googleadservices.com/gampad/ads","//pass.yandex.ru/services","//gupiao.baidu.com/stocks/stockbets","//widget.admitad.com/widget/init","//api.instagram.com/v1/tags/partykungen23328/media/recent","//video.media.yql.yahoo.com/v1/video/sapi/streams/063fb76c-6c70-38c5-9bbc-04b7c384de2b","//ib.adnxs.com/jpt","//pass.yandex.com/services","//www.google.de/maps/vt","//clients1.google.com/complete/search","//api.userlike.com/api/chat/slot/proactive/","//www.youku.com/index_cookielist/s/jsonp","//mt1.googleapis.com/mapslt/ft","//api.mixpanel.com/track/","//wpd.b.qq.com/cgi/get_sign.php","//pipes.yahooapis.com/pipes/pipe.run","//gdata.youtube.com/feeds/api/videos/WsJIHN1kNWc","//9.chart.apis.google.com/chart","//cdn.syndication.twitter.com/moments/709229296800440320","//api.flickr.com/services/feeds/photos_friends.gne","//cbks0.googleapis.com/cbk","//www.blogger.com/feeds/5578653387562324002/posts/summary/4427562025302749269","//query.yahooapis.com/v1/public/yql","//kecngantang.blogspot.com/feeds/posts/default/-/Komik","//www.travelpayouts.com/widgets/50f53ce9ada1b54bcc000031.json","//i.cackle.me/widget/32586/bootstrap","//translate.yandex.net/api/v1.5/tr.json/detect","//a.tiles.mapbox.com/v3/zentralmedia.map-n2raeauc.jsonp","//maps.google.ru/maps/vt","//c1n2.hypercomments.com/stream/subscribe","//rec.ydf.yandex.ru/cookie","//cdn.jsdelivr.net"];
/**
 * @fileoverview Collection of popular sites/CDNs hosting flash with user
 * provided JS.
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Utils for CSP evaluator.
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function T(e){return e=(e=e.replace(/^\w[+\w.-]*:\/\//i,"")).replace(/^\/\//,"")}function w(e){const s=new URL("https://"+T(e).replace(":*","").replace("*","wildcard_placeholder")).hostname.replace("wildcard_placeholder","*"),t=/^\[[\d:]+\]/;return T(e).match(t)&&!s.match(t)?"["+s+"]":s}function N(e){return e.startsWith("//")?e.replace("//","https://"):e}function v(e,s){const t=new URL(N(e.replace(":*","").replace("*","wildcard_placeholder"))),o=s.map((e=>new URL(N(e)))),i=t.hostname.toLowerCase(),n=i.startsWith("wildcard_placeholder."),a=i.replace(/^\wildcard_placeholder/i,""),c=t.pathname,r="/"!==c;for(const e of o){const s=e.hostname;if(s.endsWith(a)&&(n||i===s)){if(r)if(c.endsWith("/")){if(!e.pathname.startsWith(c))continue}else if(e.pathname!==c)continue;return e}}return null}function A(e,s){const t=Object.keys(e.directives);for(const o of t){const t=e.directives[o];t&&s(o,t)}}
/**
 * @fileoverview Collection of CSP evaluation checks.
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const b=[n.SCRIPT_SRC,n.OBJECT_SRC,n.BASE_URI],O=["data:","http:","https:"];function P(o){let i=[];return n.OBJECT_SRC in o.directives?i=o.directives[n.OBJECT_SRC]:n.DEFAULT_SRC in o.directives&&(i=o.directives[n.DEFAULT_SRC]),void 0!==i&&i.length>=1?[]:[new e(t.MISSING_DIRECTIVES,"Missing object-src allows the injection of plugins which can execute JavaScript. Can you set it to 'none'?",s.HIGH,n.OBJECT_SRC)]}function L(o){return n.SCRIPT_SRC in o.directives||n.DEFAULT_SRC in o.directives?[]:[new e(t.MISSING_DIRECTIVES,"script-src directive is missing.",s.HIGH,n.SCRIPT_SRC)]}function y(o){return function(o){const i=e=>e.policyHasScriptNonces()||e.policyHasScriptHashes()&&e.policyHasStrictDynamic(),a=e=>n.BASE_URI in e.directives;if(o.some(i)&&!o.some(a)){const o="Missing base-uri allows the injection of base tags. They can be used to set the base URL for all relative (script) URLs to an attacker controlled domain. Can you set it to 'none' or 'self'?";return[new e(t.MISSING_DIRECTIVES,o,s.HIGH,n.BASE_URI)]}return[]}([o])}const D=[function(i){const a=i.getEffectiveDirective(n.SCRIPT_SRC);return(i.directives[a]||[]).includes(o.UNSAFE_INLINE)?[new e(t.SCRIPT_UNSAFE_INLINE,"'unsafe-inline' allows the execution of unsafe in-page scripts and event handlers.",s.HIGH,a,o.UNSAFE_INLINE)]:[]},function(i){const a=i.getEffectiveDirective(n.SCRIPT_SRC);return(i.directives[a]||[]).includes(o.UNSAFE_EVAL)?[new e(t.SCRIPT_UNSAFE_EVAL,"'unsafe-eval' allows the execution of code injected into DOM APIs such as eval().",s.MEDIUM_MAYBE,a,o.UNSAFE_EVAL)]:[]},function(o){const i=[],n=o.getEffectiveDirectives(b);for(const a of n){const n=o.directives[a]||[];for(const o of n)O.includes(o)&&i.push(new e(t.PLAIN_URL_SCHEMES,o+" URI in "+a+" allows the execution of unsafe scripts.",s.HIGH,a,o))}return i},function(o){const i=[],n=o.getEffectiveDirectives(b);for(const a of n){const n=o.directives[a]||[];for(const o of n){"*"!==T(o)||i.push(new e(t.PLAIN_WILDCARD,a+" should not allow '*' as source",s.HIGH,a,o))}}return i},function(e){return[...P(e),...L(e),...y(e)]},function(i){const a=[],c=i.getEffectiveDirective(n.SCRIPT_SRC),r=i.directives[c]||[];if(r.includes(o.NONE))return a;for(const i of r){if(i===o.SELF){a.push(new e(t.SCRIPT_ALLOWLIST_BYPASS,"'self' can be problematic if you host JSONP, AngularJS or user uploaded files.",s.MEDIUM_MAYBE,c,i));continue}if(i.startsWith("'"))continue;if(d(i)||-1===i.indexOf("."))continue;const n="//"+T(i),l=v(n,R);let u=v(n,C);if(u){const e=I.includes(u.hostname),s=r.includes(o.UNSAFE_EVAL);e&&!s&&(u=null)}if(u||l){let o="",n="";u&&(o=u.hostname,n=" JSONP endpoints"),l&&(o=l.hostname,n+=""===n.trim()?"":" and",n+=" Angular libraries"),a.push(new e(t.SCRIPT_ALLOWLIST_BYPASS,o+" is known to host"+n+" which allow to bypass this CSP.",s.HIGH,c,i))}else a.push(new e(t.SCRIPT_ALLOWLIST_BYPASS,"No bypass found; make sure that this URL doesn't serve JSONP replies or Angular libraries.",s.MEDIUM_MAYBE,c,i))}return a},function(i){const a=[],c=i.getEffectiveDirective(n.OBJECT_SRC),r=i.directives[c]||[],l=i.directives[n.PLUGIN_TYPES];if(l&&!l.includes("application/x-shockwave-flash"))return[];for(const i of r){if(i===o.NONE)return[];const r=v("//"+T(i),h);r?a.push(new e(t.OBJECT_ALLOWLIST_BYPASS,r.hostname+" is known to host Flash files which allow to bypass this CSP.",s.HIGH,c,i)):c===n.OBJECT_SRC&&a.push(new e(t.OBJECT_ALLOWLIST_BYPASS,"Can you restrict object-src to 'none' only?",s.MEDIUM_MAYBE,c,i))}return a},function(o){const i=[];return A(o,((o,n)=>{for(const c of n){const n=w(c);((a=n).startsWith("[")&&a.endsWith("]")||/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(a))&&("127.0.0.1"===n?i.push(new e(t.IP_SOURCE,o+" directive allows localhost as source. Please make sure to remove this in production environments.",s.INFO,o,c)):i.push(new e(t.IP_SOURCE,o+" directive has an IP-Address as source: "+n+" (will be ignored by browsers!). ",s.INFO,o,c)))}var a})),i},function(o){const i=new RegExp("^'nonce-(.+)'$"),n=[];return A(o,((o,a)=>{for(const c of a){const a=c.match(i);if(!a)continue;a[1].length<8&&n.push(new e(t.NONCE_LENGTH,"Nonces should be at least 8 characters long.",s.MEDIUM,o,c)),S(c,!0)||n.push(new e(t.NONCE_CHARSET,"Nonces should only use the base64 charset.",s.INFO,o,c))}})),n},function(o){const i=[];return A(o,((o,a)=>{for(const c of a){const a=o===n.REPORT_URI?"Use HTTPS to send violation reports securely.":"Allow only resources downloaded over HTTPS.";c.startsWith("http://")&&i.push(new e(t.SRC_HTTP,a,s.MEDIUM,o,c))}})),i},function(o){const i=[];return n.REFLECTED_XSS in o.directives&&i.push(new e(t.DEPRECATED_DIRECTIVE,"reflected-xss is deprecated since CSP2. Please, use the X-XSS-Protection header instead.",s.INFO,n.REFLECTED_XSS)),n.REFERRER in o.directives&&i.push(new e(t.DEPRECATED_DIRECTIVE,"referrer is deprecated since CSP2. Please, use the Referrer-Policy header instead.",s.INFO,n.REFERRER)),n.DISOWN_OPENER in o.directives&&i.push(new e(t.DEPRECATED_DIRECTIVE,"disown-opener is deprecated since CSP3. Please, use the Cross Origin Opener Policy header instead.",s.INFO,n.DISOWN_OPENER)),i},function(o){const i=[];for(const n of Object.keys(o.directives))l(n)||(n.endsWith(":")?i.push(new e(t.UNKNOWN_DIRECTIVE,"CSP directives don't end with a colon.",s.SYNTAX,n)):i.push(new e(t.UNKNOWN_DIRECTIVE,'Directive "'+n+'" is not a known CSP directive.',s.SYNTAX,n)));return i},function(o){const i=[];for(const[n,a]of Object.entries(o.directives))if(void 0!==a)for(const o of a)l(o)&&i.push(new e(t.MISSING_SEMICOLON,'Did you forget the semicolon? "'+o+'" seems to be a directive, not a value.',s.SYNTAX,n,o));return i},function(a){const c=[],r=Object.values(o).map((e=>e.replace(/'/g,"")));for(const[o,l]of Object.entries(a.directives))if(void 0!==l)for(const a of l)if(r.some((e=>e===a))||a.startsWith("nonce-")||a.match(/^(sha256|sha384|sha512)-/))c.push(new e(t.INVALID_KEYWORD,'Did you forget to surround "'+a+'" with single-ticks?',s.SYNTAX,o,a));else if(a.startsWith("'")){if(o===n.REQUIRE_TRUSTED_TYPES_FOR){if(a===i.SCRIPT)continue}else if(o===n.TRUSTED_TYPES){if("'allow-duplicates'"===a||"'none'"===a)continue}else if(u(a)||_(a)||S(a))continue;c.push(new e(t.INVALID_KEYWORD,a+" seems to be an invalid CSP keyword.",s.SYNTAX,o,a))}return c}],j=[
/**
 * @fileoverview Collection of "strict" CSP and backward compatibility checks.
 * A "strict" CSP is based on nonces or hashes and drops the allowlist.
 * These checks ensure that 'strict-dynamic' and a CSP nonce/hash are present.
 * Due to 'strict-dynamic' any allowlist will get dropped in CSP3.
 * The backward compatibility checks ensure that the strict nonce/hash based CSP
 * will be a no-op in older browsers by checking for presence of 'unsafe-inline'
 * (will be dropped in newer browsers if a nonce or hash is present) and for
 * prsensence of http: and https: url schemes (will be droped in the presence of
 * 'strict-dynamic' in newer browsers).
 *
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function(i){const a=i.getEffectiveDirective(n.SCRIPT_SRC),c=i.directives[a]||[];return c.some((e=>!e.startsWith("'")))&&!c.includes(o.STRICT_DYNAMIC)?[new e(t.STRICT_DYNAMIC,"Host allowlists can frequently be bypassed. Consider using 'strict-dynamic' in combination with CSP nonces or hashes.",s.STRICT_CSP,a)]:[]},function(i){const a=i.getEffectiveDirective(n.SCRIPT_SRC);return!(i.directives[a]||[]).includes(o.STRICT_DYNAMIC)||i.policyHasScriptNonces()||i.policyHasScriptHashes()?[]:[new e(t.STRICT_DYNAMIC_NOT_STANDALONE,"'strict-dynamic' without a CSP nonce/hash will block all scripts.",s.INFO,a)]},function(i){if(!i.policyHasScriptNonces()&&!i.policyHasScriptHashes())return[];const a=i.getEffectiveDirective(n.SCRIPT_SRC);return(i.directives[a]||[]).includes(o.UNSAFE_INLINE)?[]:[new e(t.UNSAFE_INLINE_FALLBACK,"Consider adding 'unsafe-inline' (ignored by browsers supporting nonces/hashes) to be backward compatible with older browsers.",s.STRICT_CSP,a)]},function(i){const a=i.getEffectiveDirective(n.SCRIPT_SRC),c=i.directives[a]||[];return c.includes(o.STRICT_DYNAMIC)?c.some((e=>["http:","https:","*"].includes(e)||e.includes(".")))?[]:[new e(t.ALLOWLIST_FALLBACK,"Consider adding https: and http: url schemes (ignored by browsers supporting 'strict-dynamic') to be backward compatible with older browsers.",s.STRICT_CSP,a)]:[]},function(o){const a=o.getEffectiveDirective(n.REQUIRE_TRUSTED_TYPES_FOR);return(o.directives[a]||[]).includes(i.SCRIPT)?[]:[new e(t.REQUIRE_TRUSTED_TYPES_FOR_SCRIPTS,"Consider requiring Trusted Types for scripts to lock down DOM XSS injection sinks. You can do this by adding \"require-trusted-types-for 'script'\" to your policy.",s.INFO,n.REQUIRE_TRUSTED_TYPES_FOR)]}
/**
 * @author lwe@google.com (Lukas Weichselbaum)
 *
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */];var U=Object.freeze({__proto__:null,CspEvaluator:class{version;csp;findings=[];constructor(e,s){this.version=s||r.CSP3,this.csp=e}evaluate(e,s){this.findings=[];const t=s||D,o=this.csp.getEffectiveCsp(this.version,this.findings);if(e)for(const s of e)this.findings=this.findings.concat(s(this.csp));for(const e of t)this.findings=this.findings.concat(e(o));return this.findings}},DEFAULT_CHECKS:D,STRICTCSP_CHECKS:j});
/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author lwe@google.com (Lukas Weichselbaum)
 */function k(e){const s=(e=e.trim()).toLowerCase();return u(s)||d(e)?s:e}const M={normalizeDirectiveValue:k};var F=Object.freeze({__proto__:null,CspParser:class{csp;constructor(e){this.csp=new a,this.parse(e)}parse(e){this.csp=new a;const s=e.split(";");for(let e=0;e<s.length;e++){const t=s[e].trim().match(/\S+/g);if(Array.isArray(t)){const e=t[0].toLowerCase();if(e in this.csp.directives)continue;l(e);const s=[];for(let e,o=1;e=t[o];o++)e=k(e),s.includes(e)||s.push(e);this.csp.directives[e]=s}}return this.csp}},TEST_ONLY:M});export{U as CspEvaluator,F as CspParser};
