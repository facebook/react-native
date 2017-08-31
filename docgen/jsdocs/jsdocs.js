/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*jslint node: true */
'use strict';

var flowParser = require('flow-parser');
var fs = require('fs');
var Syntax = require('./syntax');

var findExportDefinition = require('./findExportDefinition');
var genericTransform = require('./generic-function-visitor');
var genericVisitor = genericTransform.visitorList[0];
var traverseFlat = require('./traverseFlat');
var parseTypehint = require('./TypeExpressionParser').parse;
var util = require('util');

// Don't save object properties source code that is longer than this
var MAX_PROPERTY_SOURCE_LENGTH = 1000;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * If the expression is an identifier, it is resolved in the scope chain.
 * If it is an assignment expression, it resolves to the right hand side.
 *
 * In all other cases the expression itself is returned.
 *
 * Since the scope chain constructed by the traverse function is very simple
 * (it doesn't take into account *changes* to the variable through assignment
 * statements), this function doesn't return the correct value in every
 * situation. But it's good enough for how it is used in the parser.
 *
 * @param {object} expr
 * @param {array} scopeChain
 *
 * @return {object}
 */
function resolveToValue(expr, scopeChain) {
  switch (expr.type) {
    case Syntax.AssignmentExpression:
      if (expr.operator === '=') {
        return resolveToValue(expr.right, scopeChain);
      }
      break;
    case Syntax.Identifier:
      var value;
      scopeChain.some(function(scope, i) {
        if (hasOwnProperty.call(scope, expr.name) && scope[expr.name]) {
          value = resolveToValue(scope[expr.name], scopeChain.slice(i));
          return true;
        }
      });
      return value;
  }
  return expr;
}

/**
 * Strips the "static upstream" warning from the docblock.
 *
 * @param {?string} docblock
 * @return {?string}
 */
function stripStaticUpstreamWarning(docblock) {
  if (!docblock) {
    return docblock;
  }
  // The parser strips out the starting and ending tokens, so add them back
  docblock = '/*' + docblock + '*/\n';
  return docblock;
}

/**
 * Parse a typehint into the 'nice' form, if possible.
 */
function safeParseTypehint(typehint) {
  if (!typehint) {
    return null;
  }
  try {
    return JSON.stringify(parseTypehint(typehint));
  } catch (e) {
    return typehint;
  }
}

/**
 * Gets the docblock for the file
 *
 * @param {array<object>} commentsForFile
 * @return {?string}
 */
function getFileDocBlock(commentsForFile) {
  var docblock;
  commentsForFile.some(function(comment, i) {
    if (comment.loc.start.line === 1) {
      var lines = comment.value.split('\n');
      var inCopyrightBlock = false;
      var filteredLines = lines.filter(function(line) {
        if (!!line.match(/^\s*\*\s+Copyright \(c\)/)) {
          inCopyrightBlock = true;
        }

        var hasProvidesModule = !!line.match(/^\s*\*\s+@providesModule/);
        var hasFlow = !!line.match(/^\s*\*\s+@flow/);

        if (hasFlow || hasProvidesModule) {
          inCopyrightBlock = false;
        }

        return !inCopyrightBlock && !hasFlow && !hasProvidesModule;
      });
      docblock = filteredLines.join('\n');
      return true;
    }
  });
  return stripStaticUpstreamWarning(docblock);
}

/**
 * Gets the docblock for a given node.
 *
 * @param {object} Node to get docblock for
 * @param {array<object>} commentsForFile
 * @param {array<string>} linesForFile
 * @return {?string}
 */
function getDocBlock(node, commentsForFile, linesForFile) {
  if (node.isSynthesized === true) {
    return '';
  }
  var docblock;
  var prevLine = node.loc.start.line - 1;
  // skip blank lines
  while (linesForFile[prevLine - 1].trim() === '') {
    prevLine--;
  }

  commentsForFile.some(function(comment, i) {
    if (comment.loc.end.line === prevLine) {
      if (comment.type === 'Line') {
        // Don't accept line comments that are separated
        if (prevLine !== node.loc.start.line - 1) {
          return true;
        }
        var line = prevLine;
        docblock = '';
        for (var ii = i; ii >= 0; ii--) {
          var lineComment = commentsForFile[ii];
          if (lineComment.loc.end.line === line) {
            docblock = '//' + lineComment.value +
              (docblock ? '\n' + docblock : '');
            line--;
          } else {
            break;
          }
        }
      } else {
        docblock = stripStaticUpstreamWarning(comment.value);
      }
      return true;
    }
  });
  return docblock;
}

/**
 * Given the comments for a file, return the module name (by looking for
 * @providesModule).
 *
 * @param {array<object>}
 * @return {?string}
 */
function getModuleName(commentsForFile) {
  var moduleName;
  commentsForFile.forEach(function(comment) {
    if (comment.type === 'Block') {
      var matches = comment.value.match(/@providesModule\s+(\S*)/);
      if (matches && matches[1]) {
        moduleName = matches[1];
      }
    }
  });
  return moduleName;
}

/**
 * The parser includes the leading colon (and possibly spaces) as part of
 * the typehint, so we have to strip those out.
 */
function sanitizeTypehint(string) {
  for (var i = 0; i < string.length; i++) {
    if (string[i] != ' ' && string[i] != ':') {
      return string.substring(i);
    }
  }
  return null;
}

/**
 * @param {object} node
 * @param {object} docNode  Node used for location/docblock purposes
 * @param {object} state
 * @param {string} source
 * @param {array<object>} commentsForFile
 * @param {array<string>} linesForFile
 * @return {object}
 */
function getFunctionData(
  node,
  docNode,
  state,
  source,
  commentsForFile,
  linesForFile
) {
  var params = [];
  var typechecks = commentsForFile.typechecks;
  var typehintsFromBlock = null;
  if (typechecks) {
    // The parser has trouble with some params so ignore them (e.g. $__0)
    if (!node.params.some(function(param) { return !param.name; })) {
      try {
        typehintsFromBlock = genericTransform.getTypeHintsFromDocBlock(
          node,
          state.docBlocksByLine
        );
      } catch (e) {
      }
    }
  }
  node.params.forEach(function(param) {
    // TODO: Handle other things like Syntax.ObjectPattern
    if (param.type === Syntax.Identifier) {
      var typehint;
      if (param.typeAnnotation) {
        typehint = sanitizeTypehint(source.substring(
          param.typeAnnotation.range[0],
          param.typeAnnotation.range[1]
        ));
      } else if (typehintsFromBlock && typehintsFromBlock.params) {
        typehintsFromBlock.params.some(function(paramTypehint) {
          if (paramTypehint[0] === param.name) {
            typehint = paramTypehint[1];
            return true;
          }
        });
      }
      if (!typehint && typechecks) {
        try {
          typehint = genericTransform.getTypeHintFromInline(
            param,
            state.commentsByLine
          );
        } catch (e) {
        }
      }
      params.push({
        typehint: safeParseTypehint(typehint),
        name: param.name + (param.optional ? '?' : ''),
      });
    } else if (param.type === Syntax.TypeAnnotatedIdentifier) {
      params.push({
        typehint: sanitizeTypehint(source.substring(
          param.annotation.range[0],
          param.annotation.range[1]
        )),
        name: param.id.name
      });
    }
  });
  var returnTypehint = null;
  if (node.returnType) {
    returnTypehint = sanitizeTypehint(source.substring(
      node.returnType.range[0],
      node.returnType.range[1]
    ));
  } else if (typehintsFromBlock) {
    returnTypehint = typehintsFromBlock.returns;
  }
  var tparams = null;
  if (node.typeParameters) {
    tparams = node.typeParameters.params.map(function(x) {
      return x.name;
    });
  }
  return {
    line: docNode.loc.start.line,
    source: source.substring.apply(source, node.range),
    docblock: getDocBlock(docNode, commentsForFile, linesForFile),
    modifiers: [],
    params: params,
    tparams: tparams,
    returntypehint: safeParseTypehint(returnTypehint)
  };
}

/**
 * @param {object} node
 * @param {object} state
 * @param {string} source
 * @param {array<object>} commentsForFile
 * @param {array<string>} linesForFile
 * @return {object}
 */
function getObjectData(node, state, source, scopeChain,
    commentsForFile, linesForFile) {
  var methods = [];
  var properties = [];
  var classes = [];
  var superClass = null;
  node.properties.forEach(function(property) {
    if (property.type === Syntax.SpreadProperty) {
      if (property.argument.type === Syntax.Identifier) {
        superClass = property.argument.name;
      }
      return;
    }

    switch (property.value.type) {
    case Syntax.FunctionExpression:
      var methodData = getFunctionData(property.value, property, state, source,
        commentsForFile, linesForFile);
      methodData.name = property.key.name || property.key.value;
      methodData.source = source.substring.apply(source, property.range);
      methodData.modifiers.push('static');
      methods.push(methodData);
      break;
    case Syntax.Identifier:
      var expr = resolveToValue(
        property.value,
        scopeChain
      );
      if (expr) {
        if (expr.type === Syntax.FunctionDeclaration ||
            expr.type === Syntax.FunctionExpression) {
          var functionData =
            getFunctionData(expr, property, state, source, commentsForFile,
              linesForFile);
          functionData.name = property.key.name || property.key.value;
          functionData.modifiers.push('static');
          methods.push(functionData);
          break;
        } else {
          property.value = expr;
        }
      }
      /* falls through */
    default:
      var propertySource = '';
      var valueRange = property.value.range;
      if (valueRange[1] - valueRange[0] < MAX_PROPERTY_SOURCE_LENGTH) {
        propertySource = source.substring.apply(source, valueRange);
      }
      var docBlock = getDocBlock(property, commentsForFile, linesForFile);
      /* CodexVarDef: modifiers, type, name, default, docblock */
      if (property.value.type === Syntax.ClassDeclaration) {
        var type = {name: property.value.id.name};
        var classData = getClassData(property.value, state, source, commentsForFile, linesForFile);
        classData.ownerProperty = property.key.name;
        classes.push(classData);
      } else {
        var type = {name: property.value.type};
      }
      var propertyData = {
        // Cast to String because this can be a Number
        // Could also be a String literal (e.g. "key") hence the value
        name: String(property.key.name || property.key.value),
        type,
        docblock: docBlock || '',
        source: source.substring.apply(source, property.range),
        modifiers: ['static'],
        propertySource,
      };
      properties.push(propertyData);
      break;
    }
  });
  return {
    methods: methods,
    properties: properties,
    classes: classes,
    superClass: superClass
  };
}

/**
 * @param {object} node
 * @param {object} state
 * @param {string} source
 * @param {array<object>} commentsForFile
 * @param {array<string>} linesForFile
 * @return {object}
 */
function getClassData(node, state, source, commentsForFile, linesForFile) {
  var methods = [];
  invariant(node.body.type === Syntax.ClassBody, 'Expected ClassBody');
  node.body.body.forEach(function(bodyItem) {
    if (bodyItem.type === Syntax.MethodDefinition) {
      if (bodyItem.value.type === Syntax.FunctionExpression) {
        var methodData =
          getFunctionData(bodyItem.value, bodyItem, state, source,
            commentsForFile, linesForFile);
        methodData.name = bodyItem.key.name;
        methodData.source = source.substring.apply(source, bodyItem.range);
        if (bodyItem.static) {
          methodData.modifiers.push('static');
        }
        methods.push(methodData);
      }
    }
  });
  var data = {
    name: node.id.name,
    docblock: getDocBlock(node, commentsForFile, linesForFile),
    methods: methods,
  };
  if (node.superClass && node.superClass.type === Syntax.Identifier) {
    data.superClass = node.superClass.name;
  }
  if (node.typeParameters) {
    data.tparams = node.typeParameters.params.map(function(x) {
      return x.name;
    });
  }
  return data;
}


/**
 * Finds all the requires
 *
 * @param {object} ast
 * @return {array<object>}
 */
function findRequires(ast) {
  var requires = [];
  traverseFlat(ast, function(node, scopeChain) {
    var requireData = getRequireData(node);
    if (requireData) {
      requires.push(requireData);
    }
    return !requireData;
  });
  return requires;
}

/**
 * If the given node is a 'require' statement, returns a list of following data
 *  {
 *    name: string
 *  }
 *
 * @return ?object
 */
function getRequireData(node) {
  if (!node || node.type !== Syntax.CallExpression) {
    return null;
  }

  var callee = node.callee;
  if (callee.type !== Syntax.Identifier
    || (callee.name !== 'require')) {
    return null;
  }
  var args = node['arguments'];
  if (args.length === 0) {
    return null;
  }
  var firstArgument = args[0];
  if (firstArgument.type !== Syntax.Literal) {
    return null;
  }

  return {
    name: firstArgument.value
  };
}

/**
 * Given the source of a file, this returns the data about the module's exported
 * value.
 *
 * @param {string} source
 * @return {?object} data
 */
function parseSource(source) {
  var lines = source.split('\n');
  var ast = flowParser.parse(source, {
    loc: true,
    comment: true,
    range: true,
    sourceType: 'nonStrictModule',
  });

  /**
   * This sets up genericTransform so that it can be queried above.
   */
  var _state = {
    g: {
      source: source
    }
  };
  if (genericVisitor.test(ast, [], _state)) {
    // HACK: Mark that this file has typechecks on the comments object.
    ast.comments.typechecks = true;
    // This fills out the data for genericTransform.
    genericVisitor(function() {}, ast, [], _state);
  }
  var result = findExportDefinition(ast.body);
  if (result) {
    var definition = result.definition;
    var scopeChain = result.scopeChain;
    var data;
    var moduleName = getModuleName(ast.comments);
    if (!moduleName) {
      return null;
    }
    if (definition.type === Syntax.NewExpression &&
        definition.callee.type === Syntax.Identifier) {
      var name = definition.callee.name;
      // If the class is defined in the scopeChain, export that instead.
      scopeChain.some(function(scope) {
        if (hasOwnProperty.call(scope, name) &&
            scope[name].type === Syntax.ClassDeclaration) {
          definition = scope[name];
          return true;
        }
      });
    }

    switch (definition.type) {
      case Syntax.ClassDeclaration:
        data = getClassData(definition, _state, source, ast.comments, lines);
        data.type = 'class';
        break;
      case Syntax.ObjectExpression:
        data = getObjectData(definition, _state, source, scopeChain,
          ast.comments, lines);
        data.type = 'object';
        break;
      case Syntax.FunctionDeclaration:
      case Syntax.FunctionExpression:
        data = getFunctionData(definition, definition, _state, source,
          ast.comments, lines);
        data.type = 'function';
        break;
      default:
        data = {type: 'module'};
        break;
    }
    if (data) {
      data.line = definition.loc.start.line;
      data.name = moduleName;
      data.docblock =
        getDocBlock(definition, ast.comments, lines) ||
        getFileDocBlock(ast.comments);
      data.requires = findRequires(ast.body);
      return data;
    }
  }
  return null;
}


module.exports = parseSource;
