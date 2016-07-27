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

'use strict';

var DocsSidebar = require('DocsSidebar');
var H = require('Header');
var Header = require('Header');
var HeaderWithGithub = require('HeaderWithGithub');
var Marked = require('Marked');
var Prism = require('Prism');
var React = require('React');
var Site = require('Site');
var slugify = require('slugify');
var Metadata = require('Metadata');
var sequentialKey = require('sequentialKey');

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

  if (type.name === '$Enum') {
    if (type.elements[0].signature.properties) {
      return type.elements[0].signature.properties.map(p => `'${p.key}'`).join(' | ');
    }
    return type.name;
  }

  if (type.name === 'shape') {
    return '{' + Object.keys(type.value).map((key => key + ': ' + renderType(type.value[key]))).join(', ') + '}';
  }

  if (type.name === 'union') {
    if (type.value) {
      return type.value.map(renderType).join(', ');
    }
    return type.elements.map(renderType).join(' | ');
  }

  if (type.name === 'arrayOf') {
    return <span key={sequentialKey()}>[{renderType(type.value)}]</span>;
  }

  if (type.name === 'instanceOf') {
    return type.value;
  }

  if (type.name === 'custom') {
    if (styleReferencePattern.test(type.raw)) {
      var name = type.raw.substring(0, type.raw.indexOf('.'));
      return <a key={sequentialKey()} href={'docs/' + slugify(name) + '.html#style'}>{name}#style</a>;
    }
    if (type.raw === 'ColorPropType') {
      return <a key={sequentialKey()} href={'docs/colors.html'}>color</a>;
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

  if (type.name === 'signature') {
    return type.raw;
  }

  return type.name;
}

function renderTypeNameLink(typeName, docPath, namedTypes) {
  const ignoreTypes = [
    'string',
    'number',
    'boolean',
    'object',
    'function',
    'array',
  ];
  const typeNameLower = typeName.toLowerCase();
  if (ignoreTypes.indexOf(typeNameLower) !== -1 || !namedTypes[typeNameLower]) {
    return typeName;
  }
  return <a key={sequentialKey()} href={docPath + '#' + typeNameLower}>{typeName}</a>;
}

function renderTypeWithLinks(type, docTitle, namedTypes) {
  if (!type || !type.names) {
    return null;
  }

  const docPath = docTitle ? 'docs/' + docTitle.toLowerCase() + '.html' : 'docs/';
  return (
    <div key={sequentialKey()}>
      {
        type.names.map((typeName, index, array) => {
          let separator = index < array.length - 1 && ' | ';
          return (
            <span key={index}>
              {renderTypeNameLink(typeName, docPath, namedTypes)}
              {separator}
            </span>
          );
        })
      }
    </div>
  );
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

function removeCommentsFromDocblock(docblock) {
  return docblock
    .trim('\n ')
    .replace(/^\/\*+/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map(function(line) {
      return line.trim().replace(/^\* ?/, '');
    })
    .join('\n');
}

function getNamedTypes(typedefs) {
  let namedTypes = {};
  typedefs && typedefs.forEach(typedef => {
    if (typedef.name) {
      const type = typedef.name.toLowerCase();
      namedTypes[type] = 1;
    }
  });
  return namedTypes;
}

var ComponentDoc = React.createClass({
  renderProp: function(name, prop) {
    return (
      <div className="prop" key={name}>
        <Header key={sequentialKey()} level={4} className="propTitle" toSlug={name}>
          {prop.platforms && prop.platforms.map(platform =>
            <span key={sequentialKey()} className="platform">{platform}</span>
          )}
          {name}
          {' '}
          {prop.type && <span key={sequentialKey()} className="propType">
            {renderType(prop.type)}
          </span>}
        </Header>
        {prop.deprecationMessage && <div key={sequentialKey()} className="deprecated">
          <div key={sequentialKey()} className="deprecatedTitle">
            <img key={sequentialKey()} className="deprecatedIcon" src="img/Warning.png" />
            <span key={sequentialKey()}>Deprecated</span>
          </div>
          <div key={sequentialKey()} className="deprecatedMessage">
            <Marked key={sequentialKey()}>{prop.deprecationMessage}</Marked>
          </div>
        </div>}
        {prop.type && prop.type.name === 'stylesheet' &&
          this.renderStylesheetProps(prop.type.value)}
        {prop.description && <Marked key={sequentialKey()}>{prop.description}</Marked>}
      </div>
    );
  },

  renderCompose: function(name) {
    return (
      <div className="prop" key={name}>
        <Header key={sequentialKey()} level={4} className="propTitle" toSlug={name}>
          <a key={sequentialKey()} href={'docs/' + slugify(name) + '.html#props'}>{name} props...</a>
        </Header>
      </div>
    );
  },

  renderStylesheetProp: function(name, prop) {
    return (
      <div className="prop" key={name}>
        <h6 key={sequentialKey()} className="propTitle">
          {prop.platforms && prop.platforms.map(platform =>
            <span key={sequentialKey()} className="platform">{platform}</span>
          )}
          {name}
          {' '}
          {prop.type && <span key={sequentialKey()} className="propType">
            {renderType(prop.type)}
          </span>}
          {' '}
          {prop.description && <Marked key={sequentialKey()}>{prop.description}</Marked>}
        </h6>
      </div>
    );
  },

  renderStylesheetProps: function(stylesheetName) {
    var style = this.props.content.styles[stylesheetName];
    this.extractPlatformFromProps(style.props);
    return (
      <div key={sequentialKey()} className="compactProps">
        {(style.composes || []).map((name) => {
          var link;
          if (name === 'LayoutPropTypes') {
            name = 'Flexbox';
            link =
              <a key={sequentialKey()} href={'docs/' + slugify(name) + '.html#proptypes'}>{name}...</a>;
          } else if (name === 'TransformPropTypes') {
            name = 'Transforms';
            link =
              <a key={sequentialKey()} href={'docs/' + slugify(name) + '.html#proptypes'}>{name}...</a>;
          } else {
            name = name.replace('StylePropTypes', '');
            link =
              <a key={sequentialKey()} href={'docs/' + slugify(name) + '.html#style'}>{name}#style...</a>;
          }
          return (
            <div key={sequentialKey()} className="prop" key={name}>
              <h6 key={sequentialKey()} className="propTitle">{link}</h6>
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
      <div key={sequentialKey()} className="props">
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

  renderMethod: function(method, namedTypes) {
    return (
      <Method
        key={method.name}
        name={method.name}
        description={method.description}
        params={method.params}
        modifiers={method.scope ? [method.scope] : method.modifiers}
        examples={method.examples}
        returns={method.returns}
        namedTypes={namedTypes}
      />
    );
  },

  renderMethods: function(methods, namedTypes) {
    if (!methods || !methods.length) {
      return null;
    }
    return (
      <span key={sequentialKey()}>
        <H key={sequentialKey()}level={3}>Methods</H>
        <div key={sequentialKey()} className="props">
          {methods.filter((method) => {
            return method.name[0] !== '_';
          }).map(method => this.renderMethod(method, namedTypes))}
        </div>
      </span>
    );
  },

  renderTypeDef: function(typedef, namedTypes) {
    return (
      <TypeDef
        key={typedef.name}
        name={typedef.name}
        description={typedef.description}
        type={typedef.type}
        properties={typedef.properties}
        values={typedef.values}
        apiName={this.props.apiName}
        namedTypes={namedTypes}
      />
    );
  },

  renderTypeDefs: function(typedefs, namedTypes) {
    if (!typedefs || !typedefs.length) {
      return null;
    }
    return (
      <span key={sequentialKey()}>
        <H key={sequentialKey()} level={3}>Type Definitions</H>
        <div key={sequentialKey()} className="props">
          {typedefs.map((typedef) => {
            return this.renderTypeDef(typedef, namedTypes);
          })}
        </div>
      </span>
    );
  },

  render: function() {
    var content = this.props.content;
    this.extractPlatformFromProps(content.props);
    const namedTypes = getNamedTypes(content.typedef);
    return (
      <div key={sequentialKey()}>
        <Marked key={sequentialKey()}>
          {content.description}
        </Marked>
        <H key={sequentialKey()} level={3}>Props</H>
        {this.renderProps(content.props, content.composes)}
        {this.renderMethods(content.methods, namedTypes)}
        {this.renderTypeDefs(content.typedef, namedTypes)}
      </div>
    );
  }
});

var APIDoc = React.createClass({

  renderMethod: function(method, namedTypes) {
    return (
      <Method
        key={method.name}
        name={method.name}
        description={method.description || method.docblock && removeCommentsFromDocblock(method.docblock)}
        params={method.params}
        modifiers={method.scope ? [method.scope] : method.modifiers}
        examples={method.examples}
        apiName={this.props.apiName}
        namedTypes={namedTypes}
      />
    );
  },

  renderMethods: function(methods, namedTypes) {
    if (!methods.length) {
      return null;
    }
    return (
      <span key={sequentialKey()}>
        <H key={sequentialKey()} level={3}>Methods</H>
        <div key={sequentialKey()} className="props">
          {methods.filter((method) => {
            return method.name[0] !== '_';
          }).map(method => this.renderMethod(method, namedTypes))}
        </div>
      </span>
    );
  },

  renderProperty: function(property) {
    return (
      <div key={sequentialKey()} className="prop" key={property.name}>
        <Header key={sequentialKey()} level={4} className="propTitle" toSlug={property.name}>
          {property.name}
          {property.type &&
            <span key={sequentialKey()} className="propType">
              {': ' + renderType(property.type)}
            </span>
          }
        </Header>
        {property.docblock && <Marked key={sequentialKey()}>
          {removeCommentsFromDocblock(property.docblock)}
        </Marked>}
      </div>
    );
  },

  renderProperties: function(properties) {
    if (!properties || !properties.length) {
      return null;
    }
    return (
      <span key={sequentialKey()}>
        <H key={sequentialKey()} level={3}>Properties</H>
        <div key={sequentialKey()} className="props">
          {properties.filter((property) => {
            return property.name[0] !== '_';
          }).map(this.renderProperty)}
        </div>
      </span>
    );
  },

  renderClasses: function(classes, namedTypes) {
    if (!classes || !classes.length) {
      return null;
    }
    return (
      <span key={sequentialKey()}>
        <div key={sequentialKey()}>
          {classes.filter((cls) => {
            return cls.name[0] !== '_' && cls.ownerProperty[0] !== '_';
          }).map((cls) => {
            return (
              <span key={cls.name}>
                <Header key={sequentialKey()} level={2} toSlug={cls.name}>
                  class {cls.name}
                </Header>
                <ul key={sequentialKey()}>
                  {cls.docblock && <Marked key={sequentialKey()}>
                    {removeCommentsFromDocblock(cls.docblock)}
                  </Marked>}
                  {this.renderMethods(cls.methods, namedTypes)}
                  {this.renderProperties(cls.properties)}
                </ul>
              </span>
            );
          })}
        </div>
      </span>
    );
  },

  renderTypeDef: function(typedef, namedTypes) {
    return (
      <TypeDef
        key={typedef.name}
        name={typedef.name}
        description={typedef.description}
        type={typedef.type}
        properties={typedef.properties}
        values={typedef.values}
        apiName={this.props.apiName}
        namedTypes={namedTypes}
      />
    );
  },

  renderTypeDefs: function(typedefs, namedTypes) {
    if (!typedefs || !typedefs.length) {
      return null;
    }
    return (
      <span key={sequentialKey()}>
        <H key={sequentialKey()} level={3}>Type Definitions</H>
        <div key={sequentialKey()} className="props">
          {typedefs.map((typedef) => {
            return this.renderTypeDef(typedef, namedTypes);
          })}
        </div>
      </span>
    );
  },

  renderMainDescription: function(content) {
    if (content.docblock) {
      return (
        <Marked key={sequentialKey()}>
          {removeCommentsFromDocblock(content.docblock)}
        </Marked>
      );
    }
    if (content.class && content.class.length && content.class[0].description) {
      return (
        <Marked key={sequentialKey()}>
          {content.class[0].description}
        </Marked>
      );
    }
    return null;
  },

  render: function() {
    var content = this.props.content;
    if (!content.methods) {
      throw new Error(
        'No component methods found for ' + content.componentName
      );
    }
    const namedTypes = getNamedTypes(content.typedef);
    return (
      <div key={sequentialKey()}>
        {this.renderMainDescription(content)}
        {this.renderMethods(content.methods, namedTypes)}
        {this.renderProperties(content.properties)}
        {this.renderClasses(content.classes, namedTypes)}
        {this.renderTypeDefs(content.typedef, namedTypes)}
      </div>
    );
  }
});

var Method = React.createClass({
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
    if (typeof typehint === 'object' && typehint.name) {
      return renderType(typehint);
    }
    try {
      var typehint = JSON.parse(typehint);
    } catch (e) {
      return typehint;
    }

    return this.renderTypehintRec(typehint);
  },

  renderMethodExamples: function(examples) {
    if (!examples || !examples.length) {
      return null;
    }
    return examples.map((example) => {
      const re = /<caption>(.*?)<\/caption>/ig;
      const result = re.exec(example);
      const caption = result ? result[1] + ':' : 'Example:';
      const code = example.replace(/<caption>.*?<\/caption>/ig, '')
        .replace(/^\n\n/, '');
      return (
        <div key={sequentialKey()}>
          <br key={sequentialKey()} />
          {caption}
          <Prism key={sequentialKey()}>
            {code}
          </Prism>
        </div>
      );
    });
  },

  renderMethodParameters: function(params) {
    if (!params || !params.length) {
      return null;
    }
    if (!params[0].type || !params[0].type.names) {
      return null;
    }
    const foundDescription = params.find(p => p.description);
    if (!foundDescription) {
      return null;
    }
    return (
      <div key={sequentialKey()}>
        <strong key={sequentialKey()}>Parameters:</strong>
          <table key={sequentialKey()} className="params">
            <thead key={sequentialKey()}>
              <tr key={sequentialKey()}>
                <th key={sequentialKey()}>Name and Type</th>
                <th key={sequentialKey()}>Description</th>
              </tr>
            </thead>
            <tbody key={sequentialKey()}>
              {params.map((param) => {
                return (
                  <tr key={sequentialKey()}>
                    <td key={sequentialKey()}>
                      {param.optional ? '[' + param.name + ']' : param.name}
                      <br key={sequentialKey()} /><br key={sequentialKey()} />
                      {renderTypeWithLinks(param.type, this.props.apiName, this.props.namedTypes)}
                    </td>
                    <td key={sequentialKey()} className="description">
                      <Marked key={sequentialKey()}>{param.description}</Marked>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
    );
  },

  render: function() {
    return (
      <div key={sequentialKey()} className="prop">
        <Header key={sequentialKey()} level={4} className="methodTitle" toSlug={this.props.name}>
          {this.props.modifiers && this.props.modifiers.length &&
          <span key={sequentialKey()} className="methodType">
            {this.props.modifiers.join(' ') + ' '}
          </span> || ''}
          {this.props.name}
          <span key={sequentialKey()} className="methodType">
            ({this.props.params && this.props.params.length && this.props.params
              .map((param) => {
                var res = param.name;
                res += param.optional ? '?' : '';
                return res;
              })
              .join(', ')})
              {this.props.returns && ': ' + this.renderTypehint(this.props.returns.type)}
          </span>
        </Header>
        {this.props.description && <Marked key={sequentialKey()}>
          {this.props.description}
        </Marked>}
        {this.renderMethodParameters(this.props.params)}
        {this.renderMethodExamples(this.props.examples)}
      </div>
    );
  },
});

var TypeDef = React.createClass({
  renderProperties: function(properties) {
    if (!properties || !properties.length) {
      return null;
    }
    if (!properties[0].type || !properties[0].type.names) {
      return null;
    }
    return (
      <div key={sequentialKey()}>
        <br key={sequentialKey()} />
        <strong key={sequentialKey()}>Properties:</strong>
          <table key={sequentialKey()} className="params">
            <thead key={sequentialKey()}>
              <tr key={sequentialKey()}>
                <th key={sequentialKey()}>Name and Type</th>
                <th key={sequentialKey()}>Description</th>
              </tr>
            </thead>
            <tbody key={sequentialKey()}>
              {properties.map((property) => {
                return (
                  <tr key={sequentialKey()}>
                    <td key={sequentialKey()}>
                      {property.optional ? '[' + property.name + ']' : property.name}
                      <br key={sequentialKey()} /><br key={sequentialKey()} />
                      {renderTypeWithLinks(property.type, this.props.apiName, this.props.namedTypes)}
                    </td>
                    <td key={sequentialKey()} className="description">
                      <Marked key={sequentialKey()}>{property.description}</Marked>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
    );
  },

  renderValues: function(values) {
    if (!values || !values.length) {
      return null;
    }
    if (!values[0].type || !values[0].type.names) {
      return null;
    }
    return (
      <div key={sequentialKey()}>
        <br key={sequentialKey()} />
        <strong key={sequentialKey()}>Constants:</strong>
        <table key={sequentialKey()} className="params">
          <thead key={sequentialKey()}>
            <tr key={sequentialKey()}>
              <th key={sequentialKey()}>Value</th>
              <th key={sequentialKey()}>Description</th>
            </tr>
          </thead>
          <tbody key={sequentialKey()}>
            {values.map((value) => {
              return (
                <tr key={sequentialKey()}>
                  <td key={sequentialKey()}>
                    {value.name}
                  </td>
                  <td key={sequentialKey()} className="description">
                    <Marked key={sequentialKey()}>{value.description}</Marked>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },

  render: function() {
    return (
      <div key={sequentialKey()} className="prop">
        <Header key={sequentialKey()} level={4} className="propTitle" toSlug={this.props.name}>
          {this.props.name}
        </Header>
        {this.props.description && <Marked key={sequentialKey()}>
          {this.props.description}
        </Marked>}
        <strong key={sequentialKey()}>Type:</strong>
        <br key={sequentialKey()} />
        {this.props.type.names.join(' | ')}
        {this.renderProperties(this.props.properties)}
        {this.renderValues(this.props.values)}
      </div>
    );
  },
});

var EmbeddedSimulator = React.createClass({
  render: function() {
    if (!this.props.shouldRender) {
      return null;
    }

    var metadata = this.props.metadata;

    var imagePreview = metadata.platform === 'android'
      ? <img key={sequentialKey()} alt="Run example in simulator" width="170" height="338" src="img/uiexplorer_main_android.png" />
      : <img key={sequentialKey()} alt="Run example in simulator" width="170"
             height="356" src="img/uiexplorer_main_ios.png" />;

    return (
      <div key={sequentialKey()} className="embedded-simulator">
        <p key={sequentialKey()}>
          <a key={sequentialKey()}className="modal-button-open">
            <strong key={sequentialKey()}>Run this example</strong>
          </a>
        </p>
        <div key={sequentialKey()} className="modal-button-open modal-button-open-img">
          {imagePreview}
        </div>
        <Modal key={sequentialKey()} metadata={metadata} />
      </div>
    );
  }
});

var Modal = React.createClass({
  render: function() {
    var metadata = this.props.metadata;
    var appParams = {route: metadata.title};
    var encodedParams = encodeURIComponent(JSON.stringify(appParams));
    var url = metadata.platform === 'android'
      ? `https://appetize.io/embed/q7wkvt42v6bkr0pzt1n0gmbwfr?device=nexus5&scale=65&autoplay=false&orientation=portrait&deviceColor=white&params=${encodedParams}`
      : `https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&scale=60&autoplay=false&orientation=portrait&deviceColor=white&params=${encodedParams}`;

    return (
      <div key={sequentialKey()}>
        <div key={sequentialKey()} className="modal">
          <div key={sequentialKey()} className="modal-content">
            <button key={sequentialKey()} className="modal-button-close">&times;</button>
            <div key={sequentialKey()} className="center">
              <iframe key={sequentialKey()} className="simulator" src={url} width="256" height="550" frameBorder="0" scrolling="no"></iframe>
              <p key={sequentialKey()}>Powered by
                <a key={sequentialKey()} target="_blank" href="https://appetize.io">appetize.io</a>
              </p>
            </div>
          </div>
        </div>
        <div key={sequentialKey()} className="modal-backdrop" />
      </div>
    );
  }
});

var Autodocs = React.createClass({
  childContextTypes: {
    permalink: React.PropTypes.string,
    version: React.PropTypes.string
  },

  getChildContext: function() {
    return {
      permalink: this.props.metadata.permalink,
      version: Metadata.config.RN_VERSION || 'next'
    };
  },

  renderFullDescription: function(docs) {
    if (!docs.fullDescription) {
      return;
    }
    return (
      <div key={sequentialKey()}>
        <HeaderWithGithub
          key={sequentialKey()}
          title="Description"
          path={'docs/' + docs.componentName + '.md'}
        />
        <Marked key={sequentialKey()}>
          {docs.fullDescription}
        </Marked>
      </div>
    );
  },

  renderExample: function(example, metadata) {
    if (!example) {
      return;
    }

    return (
      <div key={sequentialKey()}>
        <HeaderWithGithub
          key={sequentialKey()}
          title={example.title || 'Examples'}
          level={example.title ? 4 : 3}
          path={example.path}
          metadata={metadata}
        />
        <div key={sequentialKey()} className="example-container">
          <Prism key={sequentialKey()}>
           {example.content.replace(/^[\s\S]*?\*\//, '').trim()}
          </Prism>
          <EmbeddedSimulator
            key={sequentialKey()}
            shouldRender={metadata.runnable}
            metadata={metadata}
          />
        </div>
      </div>
    );
  },

  renderExamples: function(docs, metadata) {
    if (!docs.examples || !docs.examples.length) {
      return;
    }

    return (
      <div key={sequentialKey()}>
        {(docs.examples.length > 1) ? <H key={sequentialKey()} level={3}>Examples</H> : null}
        {docs.examples.map(example => this.renderExample(example, metadata))}
      </div>
    );
  },

  render: function() {
    var metadata = this.props.metadata;
    var docs = JSON.parse(this.props.children);
    var content  = docs.type === 'component' || docs.type === 'style' ?
      <ComponentDoc key={sequentialKey()} content={docs} /> :
      <APIDoc key={sequentialKey()} content={docs} apiName={metadata.title} />;

    return (
      <Site key={sequentialKey()} section="docs" title={metadata.title}>
        <section key={sequentialKey()} className="content wrap documentationContent">
          <DocsSidebar key={sequentialKey()} metadata={metadata} />
          <div key={sequentialKey()} className="inner-content">
            <a key={sequentialKey()} id="content" />
            <HeaderWithGithub
              key={sequentialKey()}
              title={metadata.title}
              level={1}
              path={metadata.path}
            />
            {content}
            {this.renderFullDescription(docs)}
            {this.renderExamples(docs, metadata)}
            <div key={sequentialKey()} className="docs-prevnext">
              {metadata.previous &&
               <a
                 key={sequentialKey()}
                 className="docs-prev"
                 href={'docs/' + metadata.previous + '.html#content'}>&larr; Prev</a>
              }
              {metadata.next &&
               <a
                 key={sequentialKey()}
                 className="docs-next"
                 href={'docs/' + metadata.next + '.html#content'}>Next &rarr;</a>
              }
            </div>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = Autodocs;
