/**
 * @providesModule AutodocsLayout
 * @jsx React.DOM
 */

var DocsSidebar = require('DocsSidebar');
var Header = require('Header');
var Marked = require('Marked');
var React = require('React');
var Site = require('Site');
var slugify = require('slugify');


var Autodocs = React.createClass({
  renderType: function(type) {
    if (type.name === 'enum') {
      return 'enum(' + type.value.map((v => v.value)).join(', ') + ')';
    }

    if (type.name === 'shape') {
      return '{' + Object.keys(type.value).map((key => key + ': ' + this.renderType(type.value[key]))).join(', ') + '}';
    }

    if (type.name === 'arrayOf') {
      return '[' + this.renderType(type.value) + ']';
    }

    if (type.name === 'instanceOf') {
      return type.value;
    }

    if (type.name === 'custom') {
      return type.raw;
    }

    return type.name;
  },
  renderProp: function(name, prop) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          {name}
          {' '}
          {prop.type && <span className="propType">
            {this.renderType(prop.type)}
          </span>}
        </Header>
        {prop.description && <Marked>{prop.description}</Marked>}
      </div>
    );
  },
  renderCompose: function(name) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          <a href={slugify(name) + '.html#proptypes'}>{name} props...</a>
        </Header>
      </div>
    );
  },
  renderProps: function(props, composes) {
    return (
      <div className="props">
        {(composes || []).map((name) =>
          this.renderCompose(name)
        )}
        {Object.keys(props).sort().map((name) =>
          this.renderProp(name, props[name])
        )}
      </div>
    );
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
            {this.renderProps(content.props, content.composes)}
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
