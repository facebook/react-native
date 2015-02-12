/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var center = require('center');
var H2 = require('H2');

var support = React.createClass({
  render: function() {
    return (
      <Site section="support">

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

            <H2>Stack Overflow</H2>
            <p>Many members of the community use Stack Overflow to ask questions. Read through the <a href="http://stackoverflow.com/questions/tagged/reactnative">existing questions</a> tagged with <strong>reactnative</strong> or <a href="http://stackoverflow.com/questions/ask">ask your own</a>!</p>

            <H2>IRC</H2>
            <p>Many developers and users idle on Freenode.net&#39;s IRC network in <strong><a href="irc://chat.freenode.net/reactnative">#reactnative on freenode</a></strong>.</p>

            <H2>Twitter</H2>
            <p><a href="https://twitter.com/search?q=%23reactnative"><strong>#reactnative</strong> hash tag on Twitter</a> is used to keep up with the latest React Native news.</p>

            <p><center><a className="twitter-timeline" data-dnt="true" data-chrome="nofooter noheader transparent" href="https://twitter.com/search?q=%23reactnative" data-widget-id="565960513457098753"></a></center></p>
          </div>
        </section>

      </Site>
    );
  }
});

module.exports = support;
