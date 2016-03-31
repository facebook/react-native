"use strict";
var docgen = require('react-docgen');

function stylePropTypeHandler(documentation, path) {
  var propTypesPath = docgen.utils.getMemberValuePath(path, 'propTypes');
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
    var valuePath = docgen.utils.resolveToValue(propertyPath.get('value'));
    // If it's a call to StyleSheetPropType, do stuff
    if (valuePath.node.type !== 'CallExpression' ||
        valuePath.node.callee.name !== 'StyleSheetPropType') {
      return;
    }
    // Get type of style sheet
    var styleSheetModule = docgen.utils.resolveToModule(
      valuePath.get('arguments', 0)
    );
    if (styleSheetModule) {
      var propDescriptor = documentation.getPropDescriptor('style');
      propDescriptor.type = {name: 'stylesheet', value: styleSheetModule};
    }
  });
}

function deprecatedPropTypeHandler(documentation, path) {
  var propTypesPath = docgen.utils.getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }

  propTypesPath = docgen.utils.resolveToValue(propTypesPath);
  if (!propTypesPath || propTypesPath.node.type !== 'ObjectExpression') {
    return;
  }

  // Checks for deprecatedPropType function and add deprecation info.
  propTypesPath.get('properties').each(function(propertyPath) {
    var valuePath = docgen.utils.resolveToValue(propertyPath.get('value'));
    // If it's a call to deprecatedPropType, do stuff
    if (valuePath.node.type !== 'CallExpression' ||
        valuePath.node.callee.name !== 'deprecatedPropType') {
      return;
    }
    var propDescriptor = documentation.getPropDescriptor(
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

function findExportedOrFirst(node, recast) {
  return docgen.resolver.findExportedComponentDefinition(node, recast) ||
    docgen.resolver.findAllComponentDefinitions(node, recast)[0];
}

function findExportedObject(ast, recast) {
  var objPath;
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
    var b = recast.types.builders;
    var nt = recast.types.namedTypes;
    var obj = objPath.node;

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
      var firstArg = objPath.node.arguments[0];
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

exports.stylePropTypeHandler = stylePropTypeHandler;
exports.deprecatedPropTypeHandler = deprecatedPropTypeHandler;
exports.findExportedOrFirst = findExportedOrFirst;
exports.findExportedObject = findExportedObject;
