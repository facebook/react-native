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
var Footer = require('Footer');
var Header = require('Header');
var Marked = require('Marked');
var Metadata = require('Metadata');
var Prism = require('Prism');
var React = require('React');
const PropTypes = require('prop-types');
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
  const baseType = renderBaseType(type);
  return type.nullable ? <span>?{baseType}</span> : baseType;
}

function spanJoinMapper(elements, callback, separator) {
  return <span>{elements.map((rawElement, ii) => {
    const el = callback(rawElement);
    return (ii + 1 < elements.length) ? <span>{el}{separator}</span> : el;
  })}</span>;
}

function renderBaseType(type) {
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
    return <span>{'{'}{spanJoinMapper(
      Object.keys(type.value),
      (key) => <span>{key + ': '}{renderType(type.value[key])}</span>,
      ', '
    )}{'}'}</span>;
  }

  if (type.name === 'union') {
    if (type.value) {
      return spanJoinMapper(type.value, renderType, ', ');
    }
    return spanJoinMapper(type.elements, renderType, ' | ');
  }

  if (type.name === 'arrayOf') {
    return <span>[{renderType(type.value)}]</span>;
  }

  if (type.name === 'instanceOf') {
    return type.value;
  }

  if (type.name === 'custom') {
    if (styleReferencePattern.test(type.raw)) {
      var name = type.raw.substring(0, type.raw.indexOf('.'));
      return <a href={'docs/' + slugify(name) + '.html#style'}>{name}#style</a>;
    }
    if (type.raw === 'ColorPropType') {
      return <a href={'docs/colors.html'}>color</a>;
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

  return type.raw || type.name;
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
  return <a href={docPath + '#' + typeNameLower}>{typeName}</a>;
}

function renderTypeWithLinks(type, docTitle, namedTypes) {
  if (!type || !type.names) {
    return null;
  }

  const docPath = docTitle ? 'docs/' + docTitle.toLowerCase() + '.html' : 'docs/';
  return (
    <div>
      {
        type.names.map((typeName, index, array) => {
          const separator = index < array.length - 1 && ' | ';
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
  const namedTypes = {};
  typedefs && typedefs.forEach(typedef => {
    if (typedef.name) {
      const type = typedef.name.toLowerCase();
      namedTypes[type] = 1;
    }
  });
  return namedTypes;
}

class ComponentDoc extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.extractPlatformFromProps = this.extractPlatformFromProps.bind(this);
    this.renderCompose = this.renderCompose.bind(this);
    this.renderStylesheetProp = this.renderStylesheetProp.bind(this);
    this.renderStylesheetProps = this.renderStylesheetProps.bind(this);
    this.renderMethod = this.renderMethod.bind(this);
    this.renderMethods = this.renderMethods.bind(this);
    this.renderProp = this.renderProp.bind(this);
    this.renderProps = this.renderProps.bind(this);
    this.renderTypeDef = this.renderTypeDef.bind(this);
    this.renderTypeDefs = this.renderTypeDefs.bind(this);
  }

  renderProp(name, prop) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          {prop.platforms && prop.platforms.map(platform =>
            <span className="platform">{platform}</span>
          )}
          {name}
          {prop.required ? ': ' : '?: '}
          {(prop.type || prop.flowType) && <span className="propType">
            {renderType(prop.flowType || prop.type)}
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
  }

  renderCompose(name) {
    return (
      <div className="prop" key={name}>
        <Header level={4} className="propTitle" toSlug={name}>
          <a href={'docs/' + slugify(name) + '.html#props'}>{name} props...</a>
        </Header>
      </div>
    );
  }

  renderStylesheetProp(name, prop) {
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
  }

  renderStylesheetProps(stylesheetName) {
    var style = this.props.content.styles[stylesheetName];
    this.extractPlatformFromProps(style.props);
    return (
      <div className="compactProps">
        {(style.composes || []).map((name) => {
          var link;
          if (name === 'LayoutPropTypes') {
            name = 'Layout Props';
            link =
              <a href={'docs/' + slugify(name) + '.html#props'}>{name}...</a>;
          } else if (name === 'ShadowPropTypesIOS') {
            name = 'Shadow Props';
            link =
              <a href={'docs/' + slugify(name) + '.html#props'}>{name}...</a>;
          } else if (name === 'TransformPropTypes') {
            name = 'Transforms';
            link =
              <a href={'docs/' + slugify(name) + '.html#props'}>{name}...</a>;
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
  }

  renderProps(props, composes) {
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
  }

  extractPlatformFromProps(props) {
    for (var key in props) {
      var prop = props[key];
      var description = prop.description || '';
      var platforms = description.match(/\@platform (.+)/);
      platforms = platforms && platforms[1].replace(/ /g, '').split(',');
      description = description.replace(/\@platform (.+)/, '');

      prop.description = description;
      prop.platforms = platforms;
    }
  }

  renderMethod(method, namedTypes) {
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
        entityName={this.props.componentName}
      />
    );
  }

  renderMethods(methods, namedTypes) {
    if (!methods || !methods.length) {
      return null;
    }
    return (
      <span>
        <Header level={3}>Methods</Header>
        <div className="props">
          {methods.filter((method) => {
            return method.name[0] !== '_';
          }).map(method => this.renderMethod(method, namedTypes))}
        </div>
      </span>
    );
  }

  renderTypeDef(typedef, namedTypes) {
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
  }

  renderTypeDefs(typedefs, namedTypes) {
    if (!typedefs || !typedefs.length) {
      return null;
    }
    return (
      <span>
        <Header level={3}>Type Definitions</Header>
        <div className="props">
          {typedefs.map((typedef) => {
            return this.renderTypeDef(typedef, namedTypes);
          })}
        </div>
      </span>
    );
  }

  render() {
    var content = this.props.content;
    this.extractPlatformFromProps(content.props);
    const namedTypes = getNamedTypes(content.typedef);
    return (
      <div>
        <Marked>
          {content.description}
        </Marked>
        <Header level={3}>Props</Header>
        {this.renderProps(content.props, content.composes)}
        {this.renderMethods(content.methods, namedTypes)}
        {this.renderTypeDefs(content.typedef, namedTypes)}
      </div>
    );
  }
}

class APIDoc extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.renderMethod = this.renderMethod.bind(this);
    this.renderMethods = this.renderMethods.bind(this);
    this.renderProperty = this.renderProperty.bind(this);
    this.renderProperties = this.renderProperties.bind(this);
    this.renderClasses = this.renderClasses.bind(this);
    this.renderTypeDef = this.renderTypeDef.bind(this);
    this.renderTypeDefs = this.renderTypeDefs.bind(this);
    this.renderMainDescription = this.renderMainDescription.bind(this);
  }

  renderMethod(method, namedTypes) {
    return (
      <Method
        key={method.name}
        name={method.name}
        description={method.description || method.docblock && removeCommentsFromDocblock(method.docblock)}
        params={method.params}
        modifiers={method.scope ? [method.scope] : method.modifiers}
        examples={method.examples}
        entityName={this.props.apiName}
        namedTypes={namedTypes}
      />
    );
  }

  renderMethods(methods, namedTypes) {
    if (!methods.length) {
      return null;
    }
    return (
      <span>
        <Header level={3}>Methods</Header>
        <div className="props">
          {methods.filter((method) => {
            return method.name[0] !== '_';
          }).map(method => this.renderMethod(method, namedTypes))}
        </div>
      </span>
    );
  }

  renderProperty(property) {
    return (
      <div className="prop" key={property.name}>
        <Header level={4} className="propTitle" toSlug={property.name}>
          {property.name}
          {(property.type || property.flowType) &&
            <span className="propType">
              {': ' + renderType(property.flowType || property.type)}
            </span>
          }
        </Header>
        {property.docblock && <Marked>
          {removeCommentsFromDocblock(property.docblock)}
        </Marked>}
      </div>
    );
  }

  renderProperties(properties) {
    if (!properties || !properties.length) {
      return null;
    }
    return (
      <span>
        <Header level={3}>Properties</Header>
        <div className="props">
          {properties.filter((property) => {
            return property.name[0] !== '_';
          }).map(this.renderProperty)}
        </div>
      </span>
    );
  }

  renderClasses(classes, namedTypes) {
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
                <div>
                  {cls.docblock && <Marked>
                    {removeCommentsFromDocblock(cls.docblock)}
                  </Marked>}
                  {this.renderMethods(cls.methods, namedTypes)}
                  {this.renderProperties(cls.properties)}
                </div>
              </span>
            );
          })}
        </div>
      </span>
    );
  }

  renderTypeDef(typedef, namedTypes) {
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
  }

  renderTypeDefs(typedefs, namedTypes) {
    if (!typedefs || !typedefs.length) {
      return null;
    }
    return (
      <span>
        <Header level={3}>Type Definitions</Header>
        <div className="props">
          {typedefs.map((typedef) => {
            return this.renderTypeDef(typedef, namedTypes);
          })}
        </div>
      </span>
    );
  };

  renderMainDescription(content) {
    if (content.docblock) {
      return (
        <Marked>
          {removeCommentsFromDocblock(content.docblock)}
        </Marked>
      );
    }
    if (content.class && content.class.length && content.class[0].description) {
      return (
        <Marked>
          {content.class[0].description}
        </Marked>
      );
    }
    return null;
  }

  render() {
    var content = this.props.content;
    if (!content.methods) {
      throw new Error(
        'No component methods found for ' + content.componentName
      );
    }
    const namedTypes = getNamedTypes(content.typedef);
    return (
      <div>
        {this.renderMainDescription(content)}
        {this.renderMethods(content.methods, namedTypes)}
        {this.renderProperties(content.properties)}
        {this.renderClasses(content.classes, namedTypes)}
        {this.renderTypeDefs(content.typedef, namedTypes)}
      </div>
    );
  }
}

class Method extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.renderTypehint = this.renderTypehint.bind(this);
    this.renderTypehintRec = this.renderTypehintRec.bind(this);
    this.renderMethodExamples = this.renderMethodExamples.bind(this);
    this.renderMethodParameters = this.renderMethodParameters.bind(this);
  }
  renderTypehintRec(typehint) {
    if (typehint.type === 'simple') {
      return typehint.value;
    }

    if (typehint.type === 'generic') {
      return this.renderTypehintRec(typehint.value[0]) + '<' + this.renderTypehintRec(typehint.value[1]) + '>';
    }

    return JSON.stringify(typehint);
  }

  renderTypehint(typehint) {
    if (typeof typehint === 'object' && typehint.name) {
      return renderType(typehint);
    }
    try {
      var typehint = JSON.parse(typehint);
    } catch (e) {
      return typehint;
    }

    return this.renderTypehintRec(typehint);
  }

  renderMethodExamples(examples) {
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
        <div>
          <br/>
          {caption}
          <Prism>
            {code}
          </Prism>
        </div>
      );
    });
  };

  renderMethodParameters(params) {
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
      <div>
        <strong>Parameters:</strong>
          <table className="params">
            <thead>
              <tr>
                <th>Name and Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param) => {
                return (
                  <tr>
                    <td>
                      {param.optional ? '[' + param.name + ']' : param.name}
                      <br/><br/>
                      {renderTypeWithLinks(param.type, this.props.entityName, this.props.namedTypes)}
                    </td>
                    <td className="description"><Marked>{param.description}</Marked></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
    );
  }

  render() {
    return (
      <div className="prop">
        <Header level={4} className="methodTitle" toSlug={this.props.name}>
          {this.props.modifiers && this.props.modifiers.length && <span className="methodType">
            {this.props.modifiers.join(' ') + ' '}
          </span> || ''}
          {this.props.name}
          <span className="methodType">
            ({(this.props.params && this.props.params.length && this.props.params
              .map((param) => {
                var res = param.name;
                res += param.optional ? '?' : '';
                param.type && param.type.names && (res += ': ' + param.type.names.join(', '));
                return res;
              })
              .join(', ')) || ''})
              {this.props.returns && ': ' + this.renderTypehint(this.props.returns.type)}
          </span>
        </Header>
        {this.props.description && <Marked>
          {this.props.description}
        </Marked>}
        {this.renderMethodParameters(this.props.params)}
        {this.renderMethodExamples(this.props.examples)}
      </div>
    );
  }
}

class TypeDef extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.renderProperties = this.renderProperties.bind(this);
    this.renderValues = this.renderValues.bind(this);
  }

  renderProperties(properties) {
    if (!properties || !properties.length) {
      return null;
    }
    if (!properties[0].type || !properties[0].type.names) {
      return null;
    }
    return (
      <div>
        <br/>
        <strong>Properties:</strong>
          <table className="params">
            <thead>
              <tr>
                <th>Name and Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => {
                return (
                  <tr>
                    <td>
                      {property.optional ? '[' + property.name + ']' : property.name}
                      <br/><br/>
                      {renderTypeWithLinks(property.type, this.props.apiName, this.props.namedTypes)}
                    </td>
                    <td className="description"><Marked>{property.description}</Marked></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
    );
  }

  renderValues(values) {
    if (!values || !values.length) {
      return null;
    }
    if (!values[0].type || !values[0].type.names) {
      return null;
    }
    return (
      <div>
        <br/>
        <strong>Constants:</strong>
        <table className="params">
          <thead>
            <tr>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {values.map((value) => {
              return (
                <tr>
                  <td>
                    {value.name}
                  </td>
                  <td className="description"><Marked>{value.description}</Marked></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    return (
      <div className="prop">
        <Header level={4} className="propTitle" toSlug={this.props.name}>
          {this.props.name}
        </Header>
        {this.props.description && <Marked>
          {this.props.description}
        </Marked>}
        <strong>Type:</strong>
        <br/>
        {this.props.type.names.join(' | ')}
        {this.renderProperties(this.props.properties)}
        {this.renderValues(this.props.values)}
      </div>
    );
  }
}

class Autodocs extends React.Component {
  contsructor(props, context) {
    super(props, context);

    this.renderFullDescription = this.renderFullDescription.bind(this);
  }

  getChildContext() {
    return {
      permalink: this.props.metadata.permalink,
      version: Metadata.config.RN_VERSION || 'next'
    };
  }

  renderFullDescription(docs) {
    if (!docs.fullDescription) {
      return;
    }
    return (
      <div>
        <Header level={1}>Description</Header>
        <Marked>
          {docs.fullDescription}
        </Marked>
        <Footer path={'docs/' + docs.componentName + '.md'} />
      </div>
    );
  }

  render() {
    var metadata = this.props.metadata;
    var docs = JSON.parse(this.props.children);
    var content  = docs.type === 'component' || docs.type === 'style'
      ? <ComponentDoc content={docs} componentName={metadata.title} />
      : <APIDoc content={docs} apiName={metadata.title} />;

    return (
      <Site
        section="docs"
        title={metadata.title} >
        <section className="content wrap documentationContent">
          <DocsSidebar metadata={metadata} />
          <div className="inner-content">
            <a id="content" />
            <Header level={1}>{metadata.title}</Header>
            {content}
            <Footer path={metadata.path} />
            {this.renderFullDescription(docs)}
            <div className="docs-prevnext">
              {metadata.previous && <a className="docs-prev" href={'docs/' + metadata.previous + '.html#content'}>&larr; Prev</a>}
              {metadata.next && <a className="docs-next" href={'docs/' + metadata.next + '.html#content'}>Next &rarr;</a>}
            </div>
          </div>
        </section>
      </Site>
    );
  }
}

Autodocs.childContextTypes = {
  permalink: PropTypes.string,
  version: PropTypes.string
};

module.exports = Autodocs;
