/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const babel = require('babel-core');
const deepAssign = require('deep-assign');
const docgen = require('react-docgen');
const docgenHelpers = require('./docgenHelpers');
const docsList = require('./docsList');
const fs = require('fs');
const jsDocs = require('../jsdocs/jsdocs.js');
const jsdocApi = require('jsdoc-api');
const path = require('path');
const recast = require('recast');
const slugify = require('../core/slugify');

const ANDROID_SUFFIX = 'android';
const CROSS_SUFFIX = 'cross';
const IOS_SUFFIX = 'ios';

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function removeExtName(filepath) {
  let ext = path.extname(filepath);
  while (ext) {
    filepath = path.basename(filepath, ext);
    ext = path.extname(filepath);
  }
  return filepath;
}

function getNameFromPath(filepath) {
  filepath = removeExtName(filepath);
  if (filepath === 'LayoutPropTypes') {
    return 'Layout Props';
  } else if (filepath === 'ShadowPropTypesIOS') {
    return 'Shadow Props';
  } else if (filepath === 'TransformPropTypes') {
    return 'Transforms';
  } else if (filepath === 'TabBarItemIOS') {
    return 'TabBarIOS.Item';
  } else if (filepath === 'AnimatedImplementation') {
    return 'Animated';
  }
  return filepath;
}

function getPlatformFromPath(filepath) {
  filepath = removeExtName(filepath);
  if (endsWith(filepath, 'Android')) {
    return ANDROID_SUFFIX;
  } else if (endsWith(filepath, 'IOS')) {
    return IOS_SUFFIX;
  }
  return CROSS_SUFFIX;
}

function getExamplePaths(componentName, componentPlatform) {
  const componentExample = '../Examples/UIExplorer/js/' + componentName + 'Example.';
  const pathsToCheck = [
    componentExample + 'js',
    componentExample + componentPlatform + '.js',
  ];
  if (componentPlatform === CROSS_SUFFIX) {
    pathsToCheck.push(
      componentExample + IOS_SUFFIX + '.js',
      componentExample + ANDROID_SUFFIX + '.js'
    );
  }
  const paths = [];
  pathsToCheck.map((p) => {
    if (fs.existsSync(p)) {
      paths.push(p);
    }
  });
  return paths;
}

function getExamples(componentName, componentPlatform) {
  const paths = getExamplePaths(componentName, componentPlatform);
  if (paths) {
    const examples = [];
    paths.map((p) => {
      const platform = p.match(/Example\.(.*)\.js$/);
      let title = '';
      if ((componentPlatform === CROSS_SUFFIX) && (platform !== null)) {
        title = platform[1].toUpperCase();
      }
      examples.push(
        {
          path: p.replace(/^\.\.\//, ''),
          title: title,
          content: fs.readFileSync(p).toString(),
        }
      );
    });
    return examples;
  }
  return;
}

// Add methods that should not appear in the components documentation.
const methodsBlacklist = [
  // Native methods mixin.
  'getInnerViewNode',
  'setNativeProps',
  // Touchable mixin.
  'touchableHandlePress' ,
  'touchableHandleActivePressIn',
  'touchableHandleActivePressOut',
  'touchableHandleLongPress',
  'touchableGetPressRectOffset',
  'touchableGetHitSlop',
  'touchableGetHighlightDelayMS',
  'touchableGetLongPressDelayMS',
  'touchableGetPressOutDelayMS',
  // Scrollable mixin.
  'getScrollableNode',
  'getScrollResponder',
];

function filterMethods(method) {
  return method.name[0] !== '_' && methodsBlacklist.indexOf(method.name) === -1;
}

// Determines whether a component should have a link to a runnable example

function isRunnable(componentName, componentPlatform) {
  const paths = getExamplePaths(componentName, componentPlatform);
  if (paths && paths.length > 0) {
    return true;
  } else {
    return false;
  }
}

// Hide a component from the sidebar by making it return false from
// this function
const HIDDEN_COMPONENTS = [
  'Transforms',
  'ListViewDataSource',
];

function shouldDisplayInSidebar(componentName) {
  return HIDDEN_COMPONENTS.indexOf(componentName) === -1;
}

function getNextComponent(idx) {
  if (all[idx + 1]) {
    const nextComponentName = getNameFromPath(all[idx + 1]);

    if (shouldDisplayInSidebar(nextComponentName)) {
      return slugify(nextComponentName);
    } else {
      return getNextComponent(idx + 1);
    }
  }
  return null;
}

function getPreviousComponent(idx) {
  if (all[idx - 1]) {
    const previousComponentName = getNameFromPath(all[idx - 1]);

    if (shouldDisplayInSidebar(previousComponentName)) {
      return slugify(previousComponentName);
    } else {
      return getPreviousComponent(idx - 1);
    }
  }
  return null;
}

function componentsToMarkdown(type, json, filepath, idx, styles) {
  const componentName = getNameFromPath(filepath);
  const componentPlatform = getPlatformFromPath(filepath);
  const docFilePath = '../docs/' + componentName + '.md';

  if (fs.existsSync(docFilePath)) {
    json.fullDescription = fs.readFileSync(docFilePath).toString();
  }
  json.type = type;
  json.filepath = filepath.replace(/^\.\.\//, '');
  json.componentName = componentName;
  json.componentPlatform = componentPlatform;
  if (styles) {
    json.styles = styles;
  }
  json.examples = getExamples(componentName, componentPlatform);

  if (json.methods) {
    json.methods = json.methods.filter(filterMethods);
  }

  if (type === 'api') {
    type = 'API';
  }
  // Put styles (e.g. Flexbox) into the API category
  const category = (type === 'style' ? 'APIs' : type + 's');
  const next = getNextComponent(idx);
  const previous = getPreviousComponent(idx);

  const res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: autodocs',
    'category: ' + category,
    'permalink: docs/' + slugify(componentName) + '.html',
    'platform: ' + componentPlatform,
    'next: ' + next,
    'previous: ' + previous,
    'sidebar: ' + shouldDisplayInSidebar(componentName),
    'runnable:' + isRunnable(componentName, componentPlatform),
    'path:' + json.filepath,
    '---',
    JSON.stringify(json, null, 2),
  ].filter(function(line) { return line; }).join('\n');
  return res;
}

let componentCount;

function getTypedef(filepath, fileContent, json) {
  let typedefDocgen;
  try {
    typedefDocgen = docgen.parse(
      fileContent,
      docgenHelpers.findExportedType,
      [docgenHelpers.typedefHandler]
    ).map((type) => type.typedef);
  } catch (e) {
    // Ignore errors due to missing exported type definitions
    if (e.message.indexOf(docgen.ERROR_MISSING_DEFINITION) !== -1) {
      console.error('Cannot parse file', filepath, e);
    }
  }
  if (!json) {
    return typedefDocgen;
  }
  const typedef = typedefDocgen;
  if (json.typedef && json.typedef.length !== 0) {
    json.typedef.forEach(def => {
      const typedefMatch = typedefDocgen.find(t => t.name === def.name);
      if (typedefMatch) {
        typedef.name = Object.assign(typedefMatch, def);
      } else {
        typedef.push(def);
      }
    });
  }
  return typedef;
}

/**
 * Load and parse ViewPropTypes data.
 * This method returns a Documentation object that's empty except for 'props'.
 * It should be merged with a component Documentation object.
 */
function getViewPropTypes() {
  // Finds default export of ViewPropTypes (the propTypes object expression).
  function viewPropTypesResolver(ast, recast) {
    let definition;
    recast.visit(ast, {
      visitAssignmentExpression: function(astPath) {
        if (!definition && docgen.utils.isExportsOrModuleAssignment(astPath)) {
          definition = docgen.utils.resolveToValue(astPath.get('right'));
        }
        return false;
      }
    });
    return definition;
  }

  // Wrap ViewPropTypes export in a propTypes property inside of a fake class.
  // This way the default docgen handlers will parse the properties and docs.
  // The alternative would be to duplicate more of the parsing logic here.
  function viewPropTypesConversionHandler(documentation, astPath) {
    const builders = recast.types.builders;

    // This is broken because babylon@7 and estree introduced SpreadElement, and ast-types has not been updated to support it
    // (we are broken by react-docgen broken by recast broken by ast-types)
    astPath.get('properties').value.forEach(n => {
      if (n.type === 'SpreadElement') {
        n.type = 'SpreadProperty';
      }
    });

    const FauxView = builders.classDeclaration(
      builders.identifier('View'),
      builders.classBody(
        [builders.classProperty(
          builders.identifier('propTypes'),
          builders.objectExpression(
            astPath.get('properties').value
          ),
          null, // TypeAnnotation
          true // static
        )]
      )
    );
    astPath.replace(FauxView);
  }

  return docgen.parse(
    fs.readFileSync(docsList.viewPropTypes),
    viewPropTypesResolver,
    [
      viewPropTypesConversionHandler,
      ...docgen.defaultHandlers,
    ]
  );
}

function renderComponent(filepath) {
  try {
    const fileContent = fs.readFileSync(filepath);
    const handlers = docgen.defaultHandlers.concat([
      docgenHelpers.stylePropTypeHandler,
      docgenHelpers.deprecatedPropTypeHandler,
      docgenHelpers.jsDocFormatHandler,
    ]);

    const json = docgen.parse(
      fileContent,
      docgenHelpers.findExportedOrFirst,
      handlers
    );
    json.typedef = getTypedef(filepath, fileContent);

    // ReactNative View component imports its propTypes from ViewPropTypes.
    // This trips up docgen though since it expects them to be defined on View.
    // We need to wire them up by manually importing and parsing ViewPropTypes.
    if (filepath.match(/View\/View\.js/)) {
      const viewPropTypesJSON = getViewPropTypes();
      json.props = viewPropTypesJSON.props;
    }

    return componentsToMarkdown('component', json, filepath, componentCount++, styleDocs);
  } catch (e) {
    console.log('error in renderComponent for', filepath);
    throw e;
  }
}

function isJsDocFormat(fileContent) {
  const reComment = /\/\*\*[\s\S]+?\*\//g;
  const comments = fileContent.match(reComment);
  if (!comments) {
    return false;
  }
  return !!comments[0].match(/\s*\*\s+@jsdoc/);
}

function parseAPIJsDocFormat(filepath, fileContent) {
  const fileName = path.basename(filepath);
  const babelRC = {
    'filename': fileName,
    'sourceFileName': fileName,
    'plugins': [
      'transform-flow-strip-types',
      'babel-plugin-syntax-trailing-function-commas',
    ]
  };
  // Babel transform
  const code = babel.transform(fileContent, babelRC).code;
  // Parse via jsdoc-api
  let jsonParsed = jsdocApi.explainSync({
    source: code,
    configure: './jsdocs/jsdoc-conf.json'
  });
  // Clean up jsdoc-api return
  jsonParsed = jsonParsed.filter(i => {
    return !i.undocumented && !/package|file/.test(i.kind);
  });
  jsonParsed = jsonParsed.map((identifier) => {
    delete identifier.comment;
    return identifier;
  });
  jsonParsed.forEach((identifier, index) => {
    identifier.order = index;
  });
  // Group by "kind"
  const json = {};
  jsonParsed.forEach((identifier, index) => {
    let kind = identifier.kind;
    if (kind === 'function') {
      kind = 'methods';
    }
    if (!json[kind]) {
      json[kind] = [];
    }
    delete identifier.kind;
    json[kind].push(identifier);
  });
  json.typedef = getTypedef(filepath, fileContent, json);
  return json;
}

function parseAPIInferred(filepath, fileContent) {
  let json;
  try {
    json = jsDocs(fileContent);
    if (!json) {
      throw new Error('parseSource returned falsy');
    }
  } catch (e) {
    console.error('Cannot parse file', filepath, e);
    json = {};
  }
  return json;
}

function getTypeName(type) {
  let typeName;
  switch (type.name) {
    case 'signature':
      typeName = type.type;
      break;
    case 'union':
      typeName = type.value ?
        type.value.map(getTypeName) :
        type.elements.map(getTypeName);
      break;
    case 'enum':
      if (typeof type.value === 'string') {
        typeName = type.value;
      } else {
        typeName = 'enum';
      }
      break;
    case '$Enum':
      if (type.elements[0].signature.properties) {
        typeName = type.elements[0].signature.properties.map(p => p.key);
      }
      break;
    case 'arrayOf':
      typeName = getTypeName(type.value);
      break;
    case 'instanceOf':
      typeName = type.value;
      break;
    case 'func':
      typeName = 'function';
      break;
    default:
      typeName = type.alias ? type.alias : type.name;
      break;
  }
  return typeName;
}

function getTypehintRec(typehint) {
  if (typehint.type === 'simple') {
    return typehint.value;
  }
  if (typehint.type === 'generic') {
    return getTypehintRec(typehint.value[0]) +
      '<' + getTypehintRec(typehint.value[1]) + '>';
  }
  return JSON.stringify(typehint);
}

function getTypehint(typehint) {
  if (typeof typehint === 'object' && typehint.name) {
    return getTypeName(typehint);
  }
  try {
    var typehint = JSON.parse(typehint);
  } catch (e) {
    return typehint.toString().split('|').map(type => type.trim());
  }
  return getTypehintRec(typehint);
}

function getJsDocFormatType(entities) {
  const modEntities = entities;
  if (entities) {
    if (typeof entities === 'object' && entities.length) {
      entities.map((entity, entityIndex) => {
        if (entity.typehint) {
          const typeNames = [].concat(getTypehint(entity.typehint));
          modEntities[entityIndex].type = { names: typeNames };
          delete modEntities[entityIndex].typehint;
        }
        if (entity.name) {
          const regexOptionalType = /\?$/;
          if (regexOptionalType.test(entity.name)) {
            modEntities[entityIndex].optional = true;
            modEntities[entityIndex].name =
              entity.name.replace(regexOptionalType, '');
          }
        }
      });
    } else {
      const typeNames = [].concat(getTypehint(entities));
      return { type: { names : typeNames } };
    }
  }
  return modEntities;
}

function renderAPI(filepath, type) {
  try {
    const fileContent = fs.readFileSync(filepath).toString();
    let json = parseAPIInferred(filepath, fileContent);
    if (isJsDocFormat(fileContent)) {
      const jsonJsDoc = parseAPIJsDocFormat(filepath, fileContent);
      // Combine method info with jsdoc formatted content
      const methods = json.methods;
      if (methods && methods.length) {
        const modMethods = methods;
        methods.map((method, methodIndex) => {
          modMethods[methodIndex].params = getJsDocFormatType(method.params);
          modMethods[methodIndex].returns =
          getJsDocFormatType(method.returntypehint);
          delete modMethods[methodIndex].returntypehint;
        });
        json.methods = modMethods;
        // Use deep Object.assign so duplicate properties are overwritten.
        deepAssign(jsonJsDoc.methods, json.methods);
      }
      json = jsonJsDoc;
    }
    return componentsToMarkdown(type, json, filepath, componentCount++);
  } catch (e) {
    console.log('error in renderAPI for', filepath);
    throw e;
  }
}

function renderStyle(filepath) {
  const json = docgen.parse(
    fs.readFileSync(filepath),
    docgenHelpers.findExportedObject,
    [
      docgen.handlers.propTypeHandler,
      docgen.handlers.propDocBlockHandler,
    ]
  );

  // Remove deprecated transform props from docs
  if (filepath === '../Libraries/StyleSheet/TransformPropTypes.js') {
    ['rotation', 'scaleX', 'scaleY', 'translateX', 'translateY'].forEach(function(key) {
      delete json.props[key];
    });
  }

  return componentsToMarkdown('style', json, filepath, componentCount++);
}

const all = docsList.components
  .concat(docsList.apis)
  .concat(docsList.stylesWithPermalink);

const styleDocs = docsList.stylesForEmbed.reduce(function(docs, filepath) {
  docs[path.basename(filepath).replace(path.extname(filepath), '')] =
    docgen.parse(
      fs.readFileSync(filepath),
      docgenHelpers.findExportedObject,
      [
        docgen.handlers.propTypeHandler,
        docgen.handlers.propTypeCompositionHandler,
        docgen.handlers.propDocBlockHandler,
      ]
    );

  return docs;
}, {});

function extractDocs() {
  componentCount = 0;
  var components = docsList.components.map(renderComponent);
  var apis = docsList.apis.map((filepath) => {
    return renderAPI(filepath, 'api');
  });
  var styles = docsList.stylesWithPermalink.map(renderStyle);
  return [].concat(
    components,
    apis,
    styles
  );
}

module.exports = extractDocs;
