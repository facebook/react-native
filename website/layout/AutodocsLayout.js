/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AutodocsLayout
 */

var DocsSidebar = require('DocsSidebar');
var H = require('Header');
var Header = require('Header');
var HeaderWithGithub = require('HeaderWithGithub');
var Marked = require('Marked');
var Prism = require('Prism');
var React = require('React');
var Site = require('Site');
var slugify = require('slugify');

var styleReferencePattern = /^[^.]+\.propTypes\.style$/;

function renderEnumValue(value) {
  // Use single quote strings even when we are given double quotes
  if (value.match(/^"(.+)"$/)) {
    return "'" + value.slice(1, -1) + "'";
  }
  return value;
}

function renderType(type) {
  if (type.name === 'enum') {
    if (typeof type.value === 'string') {
      return type.value;
    }
    return 'enum(' + type.value.map((v) => renderEnumValue(v.value)).join(', ') + ')';
  }

  if (type.name === 'shape') {
    return '{' + Object.keys(type.value).map((key => key + ': ' + renderType(type.value[key]))).join(', ') + '}';
  }

  if (type.name == 'union') {
    return type.value.map(renderType).join(', ');
  }

  if (type.name === 'arrayOf') {
    return '[' + renderType(type.value) + ']';
  }

  if (type.name === 'instanceOf') {
    return type.value;
  }

  if (type.name === 'custom') {
    if (styleReferencePattern.test(type.raw)) {
      var name = type.raw.substring(0, type.raw.indexOf('.'));
      return <a href={slugify(name) + '.html#style'}>{name}#style</a>
    }
    if (type.raw === 'ColorPropType') {
      return <a href={'colors.html'}>color</a>
    }
    if (type.raw === 'EdgeInsetsPropType') {
      return '{top: number, left: number, bottom: number, right: number}';
    }
    return type.raw;
  }

  if (type.name === 'stylesheet') {
    return 'style';
  }

  if (type.name === 'func') {
    return 'function';
  }
  return type.name;
}

function sortByPlatform(props, nameA, nameB) {
  var a = props[nameA];
  var b = props[nameB];

  if (a.platforms && !b.platforms) {
    return 1;
  }
  if (b.platforms && !a.platforms) {
    return -1;
  }

  // Cheap hack: use < on arrays of strings to compare the two platforms
  if (a.platforms < b.platforms) {
    return -1;
  }
  if (a.platforms > b.platforms) {
    return 1;
  }

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
}

var ComponentDoc = React.createClass({
  renderProp: function(name, prop) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          {prop.platforms && prop.platforms.map(platform =>
            <span className="platform">{platform}</span>
          )}
          {name}
          {' '}
          {prop.type && <span className="propType">
            {renderType(prop.type)}
          </span>}
        </Header>
        {prop.deprecationMessage && <div className="deprecated">
          <div className="deprecatedTitle">
            <img className="deprecatedIcon" src="img/Warning.png" />
            <span>Deprecated</span>
          </div>
          <div className="deprecatedMessage">
            <Marked>{prop.deprecationMessage}</Marked>
          </div>
        </div>}
        {prop.type && prop.type.name === 'stylesheet' &&
          this.renderStylesheetProps(prop.type.value)}
        {prop.description && <Marked>{prop.description}</Marked>}
      </div>
    );
  },

  renderCompose: function(name) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          <a href={slugify(name) + '.html#props'}>{name} props...</a>
        </Header>
      </div>
    );
  },

  renderStylesheetProp: function(name, prop) {
    return (
      <div className="prop" key={name}>
        <h6 className="propTitle">
          {prop.platforms && prop.platforms.map(platform =>
            <span className="platform">{platform}</span>
          )}
          {name}
          {' '}
          {prop.type && <span className="propType">
            {renderType(prop.type)}
          </span>}
          {' '}
          {prop.description && <Marked>{prop.description}</Marked>}
        </h6>
      </div>
    );
  },

  renderStylesheetProps: function(stylesheetName) {
    var style = this.props.content.styles[stylesheetName];
    this.extractPlatformFromProps(style.props);
    return (
      <div className="compactProps">
        {(style.composes || []).map((name) => {
          var link;
          if (name === 'LayoutPropTypes') {
            name = 'Flexbox';
            link =
              <a href={'docs/' + slugify(name) + '.html#proptypes'}>{name}...</a>;
          } else if (name === 'TransformPropTypes') {
            name = 'Transforms';
            link =
              <a href={'docs/' + slugify(name) + '.html#proptypes'}>{name}...</a>;
          } else {
            name = name.replace('StylePropTypes', '');
            link =
              <a href={'docs/' + slugify(name) + '.html#style'}>{name}#style...</a>;
          }
          return (
            <div className="prop" key={name}>
              <h6 className="propTitle">{link}</h6>
            </div>
          );
        })}
        {Object.keys(style.props)
          .sort(sortByPlatform.bind(null, style.props))
          .map((name) => this.renderStylesheetProp(name, style.props[name]))
        }
      </div>
    );
  },

  renderProps: function(props, composes) {
    return (
      <div className="props">
        {(composes || []).map((name) =>
          this.renderCompose(name)
        )}
        {Object.keys(props)
          .sort(sortByPlatform.bind(null, props))
          .map((name) => this.renderProp(name, props[name]))
        }
      </div>
    );
  },

  extractPlatformFromProps: function(props) {
    for (var key in props) {
      var prop = props[key];
      var description = prop.description || '';
      var platforms = description.match(/\@platform (.+)/);
      platforms = platforms && platforms[1].replace(/ /g, '').split(',');
      description = description.replace(/\@platform (.+)/, '');

      prop.description = description;
      prop.platforms = platforms;
    }
  },

  render: function() {
    var content = this.props.content;
    this.extractPlatformFromProps(content.props);
    return (
      <div>
        <Marked>
          {content.description}
        </Marked>
        <H level={3}>Props</H>
        {this.renderProps(content.props, content.composes)}
      </div>
    );
  }
});

var APIDoc = React.createClass({
  removeCommentsFromDocblock: function(docblock) {
    return docblock
      .trim('\n ')
      .replace(/^\/\*+/, '')
      .replace(/\*\/$/, '')
      .split('\n')
      .map(function(line) {
        return line.trim().replace(/^\* ?/, '');
      })
      .join('\n');
  },

  renderTypehintRec: function(typehint) {
    if (typehint.type === 'simple') {
      return typehint.value;
    }

    if (typehint.type === 'generic') {
      return this.renderTypehintRec(typehint.value[0]) + '<' + this.renderTypehintRec(typehint.value[1]) + '>';
    }

    return JSON.stringify(typehint);

  },

  renderTypehint: function(typehint) {
    try {
      var typehint = JSON.parse(typehint);
    } catch(e) {
      return typehint;
    }

    return this.renderTypehintRec(typehint);
  },

  renderMethod: function(method) {
    return (
      <div className="prop" key={method.name}>
        <Header level={4} className="propTitle" toSlug={method.name}>
          {method.modifiers.length && <span className="propType">
            {method.modifiers.join(' ') + ' '}
          </span> || ''}
          {method.name}
          <span className="propType">
            ({method.params
              .map((param) => {
                var res = param.name;
                if (param.typehint) {
                  res += ': ' + this.renderTypehint(param.typehint);
                }
                return res;
              })
              .join(', ')})
          </span>
        </Header>
        {method.docblock && <Marked>
          {this.removeCommentsFromDocblock(method.docblock)}
        </Marked>}
      </div>
    );
  },

  renderMethods: function(methods) {
    if (!methods.length) {
      return null;
    }
    return (
      <span>
        <H level={3}>Methods</H>
        <div className="props">
          {methods.filter((method) => {
            return method.name[0] !== '_';
          }).map(this.renderMethod)}
        </div>
      </span>
    );
  },

  renderProperty: function(property) {
    return (
      <div className="prop" key={property.name}>
        <Header level={4} className="propTitle" toSlug={property.name}>
          {property.name}
          {property.type &&
            <span className="propType">
              {': ' + renderType(property.type)}
            </span>
          }
        </Header>
        {property.docblock && <Marked>
          {this.removeCommentsFromDocblock(property.docblock)}
        </Marked>}
      </div>
    );
  },

  renderProperties: function(properties) {
    if (!properties || !properties.length) {
      return null;
    }
    return (
      <span>
        <H level={3}>Properties</H>
        <div className="props">
          {properties.filter((property) => {
            return property.name[0] !== '_';
          }).map(this.renderProperty)}
        </div>
      </span>
    );
  },

  renderClasses: function(classes) {
    if (!classes || !classes.length) {
      return null;
    }
    return (
      <span>
        <div>
          {classes.filter((cls) => {
            return cls.name[0] !== '_' && cls.ownerProperty[0] !== '_';
          }).map((cls) => {
            return (
              <span key={cls.name}>
                <Header level={2} toSlug={cls.name}>
                  class {cls.name}
                </Header>
                <ul>
                  {cls.docblock && <Marked>
                    {this.removeCommentsFromDocblock(cls.docblock)}
                  </Marked>}
                  {this.renderMethods(cls.methods)}
                  {this.renderProperties(cls.properties)}
                </ul>
              </span>
            );
          })}
        </div>
      </span>
    );
  },

  render: function() {
    var content = this.props.content;
    if (!content.methods) {
      throw new Error(
        'No component methods found for ' + content.componentName
      );
    }
    return (
      <div>
        <Marked>
          {this.removeCommentsFromDocblock(content.docblock)}
        </Marked>
        {this.renderMethods(content.methods)}
        {this.renderProperties(content.properties)}
        {this.renderClasses(content.classes)}
      </div>
    );
  }
});

var EmbeddedSimulator = React.createClass({
  render: function() {
    if (!this.props.shouldRender) {
      return null;
    }

    var metadata = this.props.metadata;

    return (
      <div className="column-left">
        <p><a className="modal-button-open"><strong>Run this example</strong></a></p>
        <div className="modal-button-open modal-button-open-img">
          <img alt="Run example in simulator" width="170" height="358" src="img/alertIOS.png" />
        </div>
        <Modal />
      </div>
    );
  }
});

var Modal = React.createClass({
  render: function() {
    var appParams = {route: 'AlertIOS'};
    var encodedParams = encodeURIComponent(JSON.stringify(appParams));
    var url = `https://appetize.io/embed/bypdk4jnjra5uwyj2kzd2aenv4?device=iphone5s&scale=70&autoplay=false&orientation=portrait&deviceColor=white&params=${encodedParams}`;

    return (
      <div>
        <div className="modal">
          <div className="modal-content">
            <button className="modal-button-close">&times;</button>
            <div className="center">
              <iframe className="simulator" src={url} width="256" height="550" frameborder="0" scrolling="no"></iframe>
              <p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p>
            </div>
          </div>
        </div>
        <div className="modal-backdrop" />
      </div>
    );
  }
});

var Autodocs = React.createClass({
  renderFullDescription: function(docs) {
    if (!docs.fullDescription) {
      return;
    }
    return (
      <div>
        <HeaderWithGithub
          title="Description"
          path={'docs/' + docs.componentName + '.md'}
        />
        <Marked>
          {docs.fullDescription}
        </Marked>
      </div>
    );
  },

  renderExample: function(docs, metadata) {
    if (!docs.example) {
      return;
    }

    return (
      <div>
        <HeaderWithGithub
          title="Examples"
          path={docs.example.path}
          metadata={metadata}
        />
        <Prism>
          {docs.example.content.replace(/^[\s\S]*?\*\//, '').trim()}
        </Prism>
      </div>
    );
  },

  render: function() {
    var metadata = this.props.metadata;
    var docs = JSON.parse(this.props.children);
    var content  = docs.type === 'component' || docs.type === 'style' ?
      <ComponentDoc content={docs} /> :
      <APIDoc content={docs} apiName={metadata.title} />;

    return (
      <Site section="docs" title={metadata.title}>
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <HeaderWithGithub
              title={metadata.title}
              level={1}
              path={metadata.path}
            />
            {content}
            {this.renderFullDescription(docs)}
            {this.renderExample(docs, metadata)}
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </div>

          <EmbeddedSimulator shouldRender={metadata.runnable} metadata={metadata} />

        </section>
      </Site>
    );
  }
});

module.exports = Autodocs;
