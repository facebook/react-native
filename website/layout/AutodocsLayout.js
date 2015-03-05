/**
 * @providesModule AutodocsLayout
 * @jsx React.DOM
 */

var DocsSidebar = require('DocsSidebar');
var Header = require('Header');
var Marked = require('Marked');
var React = require('React');
var Site = require('Site');


var Autodocs = React.createClass({
  renderProp: function(name, prop) {
    return (
      <div className="prop">
        <Header level={4} className="propTitle" toSlug={name}>
          {name}
          {' '}
          {prop.type && <span className="propType">{prop.type.name}</span>}
        </Header>
        {prop.description && <Marked>{prop.description}</Marked>}
      </div>
    );
  },
  renderProps: function(props) {
    var result = Object.keys(props).sort().map((name) =>
      this.renderProp(name, props[name])
    );

    return <div className="props">{result}</div>;
  },
  render: function() {
    var metadata = this.props.metadata;
    var content = JSON.parse(this.props.children);
    return (
      <Site section="docs">
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <h1>{metadata.title}</h1>
            <Marked>
              {content.description}
            </Marked>
            {this.renderProps(content.props)}
            <Marked>
              {content.fullDescription}
            </Marked>
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = Autodocs;
