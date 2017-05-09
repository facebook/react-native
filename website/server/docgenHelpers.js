/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
const docgen = require('react-docgen');

function stylePropTypeHandler(documentation, path) {
  let propTypesPath = docgen.utils.getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }

  propTypesPath = docgen.utils.resolveToValue(propTypesPath);
  if (!propTypesPath || propTypesPath.node.type !== 'ObjectExpression') {
    return;
  }

  // Check if the there is a style prop
  propTypesPath.get('properties').each(function(propertyPath) {
    if (propertyPath.node.type !== 'Property' ||
        docgen.utils.getPropertyName(propertyPath) !== 'style') {
      return;
    }
    const valuePath = docgen.utils.resolveToValue(propertyPath.get('value'));
    // If it's a call to StyleSheetPropType, do stuff
    if (valuePath.node.type !== 'CallExpression' ||
        valuePath.node.callee.name !== 'StyleSheetPropType') {
      return;
    }
    // Get type of style sheet
    const styleSheetModule = docgen.utils.resolveToModule(
      valuePath.get('arguments', 0)
    );
    if (styleSheetModule) {
      const propDescriptor = documentation.getPropDescriptor('style');
      propDescriptor.type = {name: 'stylesheet', value: styleSheetModule};
    }
  });
}

function deprecatedPropTypeHandler(documentation, path) {
  let propTypesPath = docgen.utils.getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }

  propTypesPath = docgen.utils.resolveToValue(propTypesPath);
  if (!propTypesPath || propTypesPath.node.type !== 'ObjectExpression') {
    return;
  }

  // Checks for deprecatedPropType function and add deprecation info.
  propTypesPath.get('properties').each(function(propertyPath) {
    const valuePath = docgen.utils.resolveToValue(propertyPath.get('value'));
    // If it's a call to deprecatedPropType, do stuff
    if (valuePath.node.type !== 'CallExpression' ||
        valuePath.node.callee.name !== 'deprecatedPropType') {
      return;
    }
    const propDescriptor = documentation.getPropDescriptor(
      docgen.utils.getPropertyName(propertyPath)
    );
    // The 2nd argument of deprecatedPropType is the deprecation message.
    // Used printValue to get the string otherwise there was issues with template
    // strings.
    propDescriptor.deprecationMessage = docgen.utils
      .printValue(valuePath.get('arguments', 1))
      // Remove the quotes printValue adds.
      .slice(1, -1);

    // Get the actual prop type.
    propDescriptor.type = docgen.utils.getPropType(
      valuePath.get('arguments', 0)
    );
  });
}

function typedefHandler(documentation, path) {
  const declarationPath = path.get('declaration');
  const typePath = declarationPath.get('right');

  // Name, type, description of the typedef
  const name = declarationPath.value.id.name;
  const type = { names: [typePath.node.id ? typePath.node.id.name : typePath.node.type] };
  const description = docgen.utils.docblock.getDocblock(path);

  // Get the properties for the typedef
  let paramsDescriptions = [];
  let paramsTypes;
  if (typePath.node.typeParameters) {
    const paramsPath = typePath.get('typeParameters').get('params', 0);
    if (paramsPath) {
      const properties = paramsPath.get('properties');
      // Get the descriptions inside each property (are inline leading comments)
      paramsDescriptions =
        properties.map(property => docgen.utils.docblock.getDocblock(property));
      // Get the property type info
      paramsTypes = docgen.utils.getFlowType(paramsPath);
    }
  }
  // Get the property type, description and value info
  let values = [];
  if (paramsTypes && paramsTypes.signature && paramsTypes.signature.properties &&
    paramsTypes.signature.properties.length !== 0) {
    values = paramsTypes.signature.properties.map((property, index) => {
      return {
        type: { names: [property.value.name] },
        description: paramsDescriptions[index],
        name: property.key,
      };
    });
  }

  const typedef = {
    name: name,
    description: description,
    type: type,
    values: values,
  };
  documentation.set('typedef', typedef);
}

function getTypeName(type) {
  let typeName;
  switch (type.name) {
    case 'signature':
      typeName = type.type;
      break;
    case 'union':
      typeName = type.elements.map(getTypeName);
      break;
    default:
      typeName = type.alias ? type.alias : type.name;
      break;
  }
  return typeName;
}

function jsDocFormatType(entities) {
  const modEntities = entities;
  if (entities) {
    if (typeof entities === 'object' && entities.length) {
      entities.map((entity, entityIndex) => {
        if (entity.type) {
          const typeNames = [].concat(getTypeName(entity.type));
          modEntities[entityIndex].type = { names: typeNames };
        }
      });
    } else {
      modEntities.type = [].concat(getTypeName(entities));
    }
  }
  return modEntities;
}

function jsDocFormatHandler(documentation, path) {
  const methods = documentation.get('methods');
  if (!methods || methods.length === 0) {
    return;
  }
  const modMethods = methods;
  methods.map((method, methodIndex) => {
    modMethods[methodIndex].params = jsDocFormatType(method.params);
    modMethods[methodIndex].returns = jsDocFormatType(method.returns);
  });
  documentation.set('methods', modMethods);
}

function findExportedOrFirst(node, recast) {
  return docgen.resolver.findExportedComponentDefinition(node, recast) ||
    docgen.resolver.findAllComponentDefinitions(node, recast)[0];
}

function findExportedObject(ast, recast) {
  let objPath;
  recast.visit(ast, {
    visitAssignmentExpression: function(path) {
      if (!objPath && docgen.utils.isExportsOrModuleAssignment(path)) {
        objPath = docgen.utils.resolveToValue(path.get('right'));
      }
      return false;
    }
  });

  if (objPath) {
    // Hack: This is easier than replicating the default propType
    // handler.
    // This converts any expression, e.g. `foo` to an object expression of
    // the form `{propTypes: foo}`
    const b = recast.types.builders;
    const nt = recast.types.namedTypes;
    let obj = objPath.node;

    // Hack: This is converting calls like
    //
    //    Object.apply(Object.create(foo), { bar: 42 })
    //
    // to an AST representing an object literal:
    //
    //    { ...foo, bar: 42 }
    if (nt.CallExpression.check(obj) &&
        recast.print(obj.callee).code === 'Object.assign') {
      obj = objPath.node.arguments[1];
      let firstArg = objPath.node.arguments[0];
      if (recast.print(firstArg.callee).code === 'Object.create') {
        firstArg = firstArg.arguments[0];
      }
      obj.properties.unshift(
        b.spreadProperty(firstArg)
      );
    }

    objPath.replace(b.objectExpression([
      b.property('init', b.literal('propTypes'), obj)
    ]));
  }
  return objPath;
}

function findExportedType(ast, recast) {
  const types = recast.types.namedTypes;
  let definitions;
  recast.visit(ast, {
    visitExportNamedDeclaration: function(path) {
      if (path.node.declaration) {
        if (types.TypeAlias.check(path.node.declaration)) {
          if (!definitions) {
            definitions = [];
          }
          definitions.push(path);
        }
      }
      return false;
    }
  });
  return definitions;
}

exports.stylePropTypeHandler = stylePropTypeHandler;
exports.deprecatedPropTypeHandler = deprecatedPropTypeHandler;
exports.typedefHandler = typedefHandler;
exports.jsDocFormatHandler = jsDocFormatHandler;
exports.findExportedOrFirst = findExportedOrFirst;
exports.findExportedObject = findExportedObject;
exports.findExportedType = findExportedType;
