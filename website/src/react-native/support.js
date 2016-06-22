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
var H2 = require('H2');

var support = React.createClass({
  childContextTypes: {
    permalink: React.PropTypes.string
  },

  getChildContext: function() {
    return {permalink: 'support.html'};
  },
  render: function() {
    return (
      <Site section="support" title="Support">

        <section className="content wrap documentationContent nosidebar">
          <div className="inner-content">
            <h1>Need help?</h1>
            <div className="subHeader"></div>
            <p>
              <strong>React Native</strong> is worked on full-time by Facebook&#39;s
              product infrastructure user interface
              engineering teams. They&#39;re often around and available for
              questions.
            </p>

            <H2>Community translation</H2>
            <p>The following is a list of translated docs offered by community volunteers. Send a pull request to fill the list!</p>
            <ul>
              <li><a href="http://reactnative.cn">Chinese</a> (<a href="https://github.com/reactnativecn/react-native-docs-cn">source</a>)</li>
            </ul>

            <H2>Stack Overflow</H2>
            <p>Many members of the community use Stack Overflow to ask questions. Read through the <a href="http://stackoverflow.com/questions/tagged/react-native">existing questions</a> tagged with <strong>react-native</strong> or <a href="http://stackoverflow.com/questions/ask">ask your own</a>!</p>

            <H2>Chat</H2>
            <p>Join us in <strong><a href="https://discord.gg/0ZcbPKXt5bZjGY5n">#react-native on Reactiflux</a></strong>.</p>

            <H2>Product Pains</H2>
            <p>React Native uses <a href="https://productpains.com/product/react-native/">Product Pains</a> for feature requests. It has a voting system to surface which issues are most important to the community. GitHub issues should only be used for bugs.</p>

            <iframe
              width="100%"
              height="600px"
              scrolling="yes"
              src="https://productpains.com/widget.html?token=3b929306-e0f7-5c94-7d7c-ecc05d059748"
            />

            <H2>Twitter</H2>
            <p><a href="https://twitter.com/search?q=%23reactnative"><strong>#reactnative</strong> hash tag on Twitter</a> is used to keep up with the latest React Native news.</p>

            <p><center><a className="twitter-timeline" data-dnt="true" data-chrome="nofooter noheader transparent" href="https://twitter.com/search?q=%23reactnative" data-widget-id="565960513457098753"></a></center></p>

            <h2>Newsletter</h2>
            <p>Community member Brent Vatne runs an occasional <a href="http://reactnative.cc/">React Native newsletter</a> with news and happenings from the world of React Native.</p>

            <h2>Audio and Video</h2>
            <p>Check out various audio and video of those speaking about React Native at conferences, in podcasts, etc.</p>
            <h3>React.js Conf 2016</h3>

            <iframe width="650" height="315" src="//www.youtube.com/embed/2Zthnq-hIXA" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/Xnqy_zkBAew" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/RBg2_uQE4KM" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/0MlT74erp60" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/B8J8xn3pLpk" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/f1Sj48rJE3I" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/uBYPqb83C7k" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/09ddrCaLo10" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/d3VVfA9hWjc" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/impQkQOCbMw" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/wuLKELLuwVk" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/Zoerbz5Mu5U" frameborder="0" allowfullscreen></iframe>


            <h3>React.js Conf 2015</h3>

            <iframe width="650" height="315" src="//www.youtube.com/embed/KVZ-P-ZI6W4" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/7rDsRXj9-cU" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/X6YbAKiLCLU" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/oWPoW0gIzvs" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/hDviGU-57lU" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/8N4f4h6SThc" frameborder="0" allowfullscreen></iframe>

            <iframe width="650" height="315" src="//www.youtube.com/embed/-XxSCi8TKuk" frameborder="0" allowfullscreen></iframe>

            <h3><a href="https://thechangelog.com/149/">The Changelog #149</a></h3>
            <p>With Christopher "vjeux" Chedeau and Spencer Ahrens</p>

            <audio src="http://fdlyr.co/d/changelog/cdn.5by5.tv/audio/broadcasts/changelog/2015/changelog-149.mp3" controls="controls" preload="none"></audio>

            <h3><a href="http://devchat.tv/js-jabber/146-jsj-react-with-christopher-chedeau-and-jordan-walke">JSJabber #146</a></h3>
            <p>With Christopher "vjeux" Chedeau and Jordan Walke</p>

            <audio controls>
            <source ng-src="http://www.podtrac.com/pts/redirect.mp3/media.devchat.tv/js-jabber/JSJ146React.mp3?player=true" type="audio/mpeg" src="http://www.podtrac.com/pts/redirect.mp3/media.devchat.tv/js-jabber/JSJ146React.mp3?player=true" />
            <p>
            This player is only available in HTML5 enabled browsers. Please update your browser or
            <a download="146-jsj-react-with-christopher-chedeau-and-jordan-walke.mp3" href="http://www.podtrac.com/pts/redirect.mp3/media.devchat.tv/js-jabber/JSJ146React.mp3?download=true?download=true">download the episode</a>
            </p>
            </audio>
          </div>
        </section>

      </Site>
    );
  }
});

module.exports = support;
