/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global exports:true*/
/*jslint node:true*/
'use strict';

var util = require('util');

var Syntax = require('./syntax');
var utils = require('jstransform/src/utils');

// Transforms
var meta = require('./meta');
var type = require('./type');

var typeHintExp = /^\??[\w<>|:(),?]+$/;
var paramRe = /\*\s+@param\s+{?([^\s*{}.]+)}?(\s+([\w\$]+))?/g;
var returnRe = /\*\s+@return(s?)\s+{?([^\s*{}.]+)}?/;

var nameToTransforms = {
  'sourcemeta': meta,
  'typechecks': type,
};

var excludes = [];

function getTypeHintsFromDocBlock(node, docBlocksByLine) {
  var comments = docBlocksByLine[node.loc.start.line - 1];
  if (!comments) {
    return {
      params: null,
      returns: null
    };
  }

  var params = [];
  if (node.params) {
    var paramNames = node.params.reduce(function(map, param) {
      map[param.name] = true;
      return map;
    }, {});

    var param;
    while(param = paramRe.exec(comments.value)) {

      if (!param[1]) {
        continue;
      }

      var functionName = node.id
        ? '`' + node.id.name + '\''
        : '<anonymous>';

      if (!param[3]) {
        throw new Error(util.format('Lines: %s-%s: Your @param declaration in' +
          ' function %s is missing the parameter\'s name,' +
          ' i.e. "@param {string} name"',
          comments.loc.start.line, comments.loc.end.line, functionName));
      }

      // TODO(ostrulovich) if we're really nice, we should probably check edit
      // distance and suggest the right name the user meant
      if (!(param[3] in paramNames)) {
        throw new Error(util.format('Lines: %s-%s: `%s\' is not a valid ' +
          'formal parameter of function %s. Must be one of: %s',
          comments.loc.start.line, comments.loc.end.line, param[3],
          functionName, Object.keys(paramNames).join(', ')));
      }

      params.push([param[3], param[1]]);
    }
  }
  var returnType = returnRe.exec(comments.value);
  if (returnType && returnType[1]) {
    throw new Error(util.format('Lines: %s-%s: Your @return declaration in' +
      ' function %s is incorrectly written as @returns. Remove the trailing'+
      ' \'s\'.',
      comments.loc.start.line, comments.loc.end.line, functionName));
  }
  return {
    params: params.length ? params : null,
    returns: returnType ? returnType[2] : null
  };
}

function getTypeHintFromInline(node, commentsByLine) {
  var key = node.loc.start.column - 1;
  var comments = commentsByLine[node.loc.start.line];
  if (!comments || !(key in comments)) {
    return null;
  }
  // annotate the node
  node.typeHint = comments[key].value;
  return node.typeHint;
}

/**
 * Parses out comments from AST
 * and populates commentsByLine and docBlocksByLine
 */
function parseComments(programNode, state) {
  programNode.comments.forEach(function(c) {
    if (c.type !== 'Block') return;

    var comments;
    if (c.loc.start.line === c.loc.end.line &&
        typeHintExp.test(c.value)) {
      // inline comments
      comments = state.commentsByLine[c.loc.start.line] ||
        (state.commentsByLine[c.loc.start.line] = {});
      comments[c.loc.end.column] = c;

      comments = state.commentsByLine[c.loc.end.line] ||
        (state.commentsByLine[c.loc.start.line] = {});
      comments[c.loc.end.column] = c;
    } else {
      // docblocks
      state.docBlocksByLine[c.loc.end.line] = c;
    }
  });
}

function getTypeHintParams(node, state) {
  // First look for typehints in the docblock.
  var typeHints = getTypeHintsFromDocBlock(node, state.docBlocksByLine);

  // If not found, look inline.
  if (!typeHints.params && node.params) {
    typeHints.params = node.params.map(function(param, index) {
      return [param.name, getTypeHintFromInline(param, state.commentsByLine)];
    }).filter(function(param) {
      return param[1];
    });
  }
  if (!typeHints.returns) {
    typeHints.returns = getTypeHintFromInline(node.body, state.commentsByLine);
  }

  return typeHints;
}

/**
 * Get parameters needed for the dynamic typehint checks.
 */
function normalizeTypeHintParams(node, state, typeHints) {
  var preCond = [];
  if (typeHints.params.length > 0) {
    typeHints.params.forEach(function(typeHint) {
      if (typeHint[1]) {
        preCond.push([
          typeHint[0],
          '\''+ type.parseAndNormalize(typeHint[1], typeHint[0], node) +'\'',
          '\''+ typeHint[0] +'\''
        ]);
      }
    });
  }

  var postCond = null;
  if (typeHints.returns) {
    postCond = type.parseAndNormalize(typeHints.returns, 'return', node);
  }

  // If static-only, then we don't need to pass the type hint
  // params since we're not going to do any dynamic checking.
  var pragmas = utils.getDocblock(state);
  if ('static-only' in pragmas) {
    return null;
  }

  var typeHintParams = {};
  if (preCond.length > 0) {
    typeHintParams.params = preCond;
  }
  if (postCond) {
    typeHintParams.returns = postCond;
  }
  return (preCond.length || postCond) ? typeHintParams : null;
}

/**
 * Takes in all the various params on the function in the docblock or inline
 * comments and converts them into the format the bodyWrapper transform is
 * expecting. If there are no params needed, returns null.
 *
 * For example, for a docblock like so
 * @param {string} x
 * @param {number} y
 * @return {number}
 * the resulting params object would contain
 * {
 *   params: [ [ 'x', 'number' ], [ 'y', 'number' ] ],
 *   returns: 'number'
 * }
 *
 * However the bodyWrapper transform expects input like
 * {
 *   params:
 *     [ [ 'x', '\'number\'', '\'x\'' ],
 *       [ 'y', '\'number\'', '\'y\'' ] ],
 *   returns: 'number'
 * }
 */
function formatBodyParams(node, state, params) /*?object*/ {
  return normalizeTypeHintParams(node, state, params);
}

/**
 * Takes in all the various params on the function in the docblock or inline
 * comments and converts them into the format the annotator transform is
 * expecting. If there are no params needed, returns null.
 *
 * For example, for a docblock like so
 * @param {string} x
 * @param {number} y
 * @return {number}
 * the resulting params object would contain
 * {
 *   params: [ [ 'x', 'number' ], [ 'y', 'number' ] ],
 *   returns: 'number'
 * }
 *
 * However the bodyWrapper transform expects input like
 * {
 *   params: [ 'number', 'number' ],
 *   returns: 'number'
 * }
 */
function formatAnnotatorParams(params) /*?object*/ {
  if ((!params.params || params.params.length === 0) && !params.returns) {
    return null;
  }
  var annotatorParams = {};
  if (params.params && params.params.length > 0) {
    var paramTypes = [];
    params.params.forEach(function(paramArray) {
      paramTypes.push(paramArray[1]);
    });
    annotatorParams.params = paramTypes;
  }

  if (params.returns) {
    annotatorParams.returns = params.returns;
  }

  return annotatorParams;
}

/**
 * Function used for determining how the params will be inlined
 * into the function transform. We can't just use utils.format
 * with %j because the way the data is stored in params vs
 * formatted is different.
 */
function renderParams(/*?object*/ params) /*string*/ {
  if (params == null) {
    return null;
  }

  var formattedParams = [];
  if (params.params && params.params.length > 0) {
    var preCond = params.params;
    var joined = preCond.map(function(cond) {
      return '[' + cond.join(', ') + ']';
    }).join(', ');
    var paramString = '\"params\":' + '[' + joined + ']';
    formattedParams.push(paramString);
  }

  if (params.returns) {
    var returnParam = '\"returns\":' + '\'' + params.returns + '\'';
    formattedParams.push(returnParam);
  }
  return '{' + formattedParams.join(',') + '}';
}

function getModuleName(state) {
  var docblock = utils.getDocblock(state);
  return docblock.providesModule || docblock.providesLegacy;
}

function getFunctionMetadata(node, state) {
  var funcMeta = {
    module: getModuleName(state),
    line: node.loc.start.line,
    column: node.loc.start.column,
    name: node.id && node.id.name
  };
  if (!funcMeta.name) {
    delete funcMeta.name;
  }
  return funcMeta;
}

function getNameToTransforms() {
  var filtered = {};
  Object.keys(nameToTransforms).forEach(function(name) {
    if (excludes.indexOf(name) == -1) {
      filtered[name] = nameToTransforms[name];
    }
  });
  return filtered;
}

/**
 * Returns true if there are any transforms that would want to modify the
 * current source. Usually we can rule out some transforms because the top
 * pragma may say @nosourcemeta or there isn't a @typechecks. This function is
 * used to rule out sources where no transform applies.
 *
 * @param {object} state
 * @param {object} pragmas
 * @return {bool}
 */
function shouldTraverseFile(state, pragmas) {
  var t = false;
  var nameToTransforms = getNameToTransforms();
  Object.keys(nameToTransforms).forEach(function(value) {
    var transform = nameToTransforms[value];
    t = t || transform.shouldTraverseFile(state, pragmas);
  });
  return t;
}

/**
 * Collects all the necessary information from the docblock and inline comments
 * that may be useful to a transform. Currently only the type transform has
 * information like @param and @return or the inline comments.
 */
function getAllParams(node, state) {
  if (type.shouldTransformFile(state, utils.getDocblock(state))) {
    return getTypeHintParams(node, state);
  }
  return {};
}

/**
 * Returns an array of transforms that return true when shouldTransformFile is
 * called.
 */
function getTransformsForFile(state, pragmas) {
  var transforms = [];
  var nameToTransforms = getNameToTransforms();
  Object.keys(nameToTransforms).forEach(function(value) {
    var transform = nameToTransforms[value];
    if (transform.shouldTransformFile(state, pragmas)) {
      transforms.push(transform);
    }
  });
  return transforms;
}

/**
 * Returns an array of trasnforms that return true when
 * shouldTransformFunction is called.
 */
function getTransformsForFunction(transformsForFile, node, state, pragmas,
    params) {
  var transforms = [];
  transformsForFile.forEach(function(transform) {
    if (transform.shouldTransformFunction(node, state, pragmas, params)) {
      transforms.push(transform);
    }
  });
  return transforms;
}

/**
 * This function will perform any checks over the JS source that doesn't
 * require injecting in source code. For example the typechecks transform
 * has a mode called static-only that does not add any extra code.
 */
function processStaticOnly(node, state) {
  var pragmas = utils.getDocblock(state);
  if (pragmas.typechecks === 'static-only') {
    var params = getTypeHintParams(node, state);
    normalizeTypeHintParams(node, state, params);
  }
}

function shouldWrapBody(transformsForFile) {
  var t = false;
  transformsForFile.forEach(function(transform) {
    t = t || transform.wrapsBody();
  });
  return t;
}

function shouldAnnotate(transformsForFile) {
  var t = false;
  transformsForFile.forEach(function(transform) {
    t = t || transform.annotates();
  });
  return t;
}

/**
 * Gets the trailing arguments string that should be appended to
 *   __annotator(foo,
 * and does not include a semicolon.
 */
function getTrailingAnnotatorArguments(funcMeta, annotatorParams) {
  if (annotatorParams === null) {
    return util.format(', %j)', funcMeta);
  }
  return util.format(', %j, %j)', funcMeta, annotatorParams);
}

/**
 * This is the main entry point into the generic function transforming.
 */
function genericFunctionTransformer(traverse, node, path, state) {
  // The typechecks transform has a static-only mode that doesn't actually
  // perform a transform but validates the types.
  processStaticOnly(node, state, params);

  var params = getAllParams(node, state);
  var transformsForFile = getTransformsForFile(state, utils.getDocblock(state));
  var transformsForFunction =
    getTransformsForFunction(
       transformsForFile,
       node,
       state,
       utils.getDocblock(state),
       params
    );

  if (transformsForFunction.length === 0) {
    traverse(node.body, path, state);
    return;
  }

  var wrapBody = shouldWrapBody(transformsForFunction);
  var annotate = shouldAnnotate(transformsForFunction);

  // There are two different objects containing the params for the wrapper
  // vs annotator because the type param information only makes sense inside
  // the body wrapper like [x, 'number', 'x']. During execution the body wrapper
  // will be passed the correct values whereas during the annotator the
  // arguments don't exist yet.
  var bodyParams = wrapBody ? formatBodyParams(node, state, params) : null;
  var annotatorParams = annotate ? formatAnnotatorParams(params) : null;
  var funcMeta = getFunctionMetadata(node, state);

  // If there are no params to pass to the body, then don't wrap the
  // body function.
  wrapBody = wrapBody && bodyParams !== null;
  var renderedBodyParams = renderParams(bodyParams);

  if (node.type === Syntax.FunctionExpression && annotate) {
    utils.append('__annotator(', state);
  }

  // Enter function body.
  utils.catchup(node.body.range[0] + 1, state);

  // Insert a function that wraps the function body.
  if (wrapBody) {
    utils.append(
      'return __bodyWrapper(this, arguments, function() {',
      state
    );
  }

  // Recurse down into the child.
  traverse(node.body, path, state);
  // Move the cursor to the end of the function body.
  utils.catchup(node.body.range[1] - 1, state);

  // Close the inserted function.
  if (wrapBody) {
    utils.append(util.format('}, %s);', renderedBodyParams), state);
  }

  // Write the closing } of the function.
  utils.catchup(node.range[1], state);

  if (!annotate) {
    return;
  }

  if (node.type === Syntax.FunctionExpression) {
    utils.append(
      getTrailingAnnotatorArguments(funcMeta, annotatorParams),
      state
    );
  } else if (node.type === Syntax.FunctionDeclaration) {
    utils.append(
      util.format(
        '__annotator(%s',
        node.id.name
      ) + getTrailingAnnotatorArguments(funcMeta, annotatorParams) + ';',
      state
    );
  }
}

function visitFunction(traverse, node, path, state) {
  if (node.type === Syntax.Program) {
    state.docBlocksByLine = {};
    state.commentsByLine = {};
    parseComments(node, state);
    return;
  }

  genericFunctionTransformer(traverse, node, path, state);
  return false;
}
visitFunction.test = function(node, path, state) {
  var pragmas = utils.getDocblock(state);
  if (!shouldTraverseFile(state, pragmas)) {
    return false;
  }

  switch (node.type) {
    case Syntax.Program:
    case Syntax.FunctionExpression:
    case Syntax.FunctionDeclaration:
      return true;
    default:
      return false;
  }
};

function setExcludes(excl) {
  excludes = excl;
}

exports.visitorList = [visitFunction];
exports.setExcludes = setExcludes;
exports.formatAnnotatorParams = formatAnnotatorParams;
exports.getTrailingAnnotatorArguments = getTrailingAnnotatorArguments;
exports.getTypeHintsFromDocBlock = getTypeHintsFromDocBlock;
exports.getTypeHintFromInline = getTypeHintFromInline;
