/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global exports:true*/
'use strict';

var Syntax = require('esprima-fb').Syntax;

function toObject(/*array*/ array) /*object*/ {
  var object = {};
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    object[value] = value;
  }
  return object;
}

function reverseObject(/*object*/ object) /*object*/ {
  var reversed = {};
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      reversed[object[key]] = key;
    }
  }
  return reversed;
}

function getTagName(string) {
  if (string === 'A') {
    return 'Anchor';
  }
  if (string === 'IMG') {
    return 'Image';
  }
  return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
}

var TOKENS = {
  STRING: 'string',
  OPENGENERIC: '<',
  CLOSEGENERIC: '>',
  COMMA: ',',
  OPENPAREN: '(',
  CLOSEPAREN: ')',
  COLON: ':',
  BAR: '|',
  NULLABLE: '?',
  EOL: 'eol',
  OPENSEGMENT: '{',
  CLOSESEGMENT: '}'
};
var TOKENMAP = reverseObject(TOKENS);

var SYMBOLS = {
  SIMPLE: 'simple',
  UNION: 'union',
  GENERIC: 'generic',
  FUNCTION: 'function',
  SEGMENT: 'segment'
};

var PARSERS = {
  SIMPLE: 1,
  UNION: 2,
  GENERIC: 4,
  FUNCTION: 8,
  SEGMENT: 16
};

/*----- tokenizer-----*/

function createTokenStream(source) {
  var stream = [], string, pos = 0;

  do {
    var character = source.charAt(pos);
    if (character && /\w/.test(character)) {
      string = string ? string + character : character;
    } else {
      if (string) {
        stream.push({ type: TOKENS.STRING, value: string });
        string = null;
      }

      if (character) {
        if (character in TOKENMAP) {
          stream.push({ type: character });
        } else {
          throwError('Invalid character: ' + character + ' at pos: ' + pos);
        }
      } else {
        stream.push({ type: TOKENS.EOL });
        break;
      }
    }
  } while (++pos);

  return stream;
}

/*----- parser-----*/

var SIMPLETYPES = toObject([
  'string',
  'number',
  'regexp',
  'boolean',
  'object',
  'function',
  'array',
  'date',
  'blob',
  'file',
  'int8array',
  'uint8array',
  'int16array',
  'uint16array',
  'int32array',
  'uint32array',
  'float32array',
  'float64array',
  'filelist',
  'promise',
  'map',
  'set'
]);

// types typically used in legacy docblock
var BLACKLISTED = toObject([
  'Object',
  'Boolean',
  'bool',
  'Number',
  'String',
  'int',
  'Node',
  'Element',
]);

function createAst(type, value, length) {
  return { type: type, value: value, length: length };
}

function nullable(fn) {
  return function(stream, pos) {
    var nullable = stream[pos].type == '?' && ++pos;
    var ast = fn(stream, pos);
    if (ast && nullable) {
      ast.nullable = true;
      ast.length++;
    }
    return ast;
  };
}

var parseSimpleType = nullable(function(stream, pos) {
  if (stream[pos].type == TOKENS.STRING) {
    var value = stream[pos].value;
    if ((/^[a-z]/.test(value) && !(value in SIMPLETYPES))
        || value in BLACKLISTED) {
      throwError('Invalid type ' + value + ' at pos: ' + pos);
    }
    return createAst(SYMBOLS.SIMPLE, stream[pos].value, 1);
  }
});

var parseUnionType = nullable(function(stream, pos) {
  var parsers =
    PARSERS.SIMPLE | PARSERS.GENERIC | PARSERS.FUNCTION | PARSERS.SEGMENT;
  var list = parseList(stream, pos, TOKENS.BAR, parsers);

  if (list.value.length > 1) {
    return createAst(SYMBOLS.UNION, list.value, list.length);
  }
});

var parseGenericType = nullable(function(stream, pos, ast) {
  var genericAst, typeAst;
  if ((genericAst = parseSimpleType(stream, pos)) &&
      stream[pos + genericAst.length].type == TOKENS.OPENGENERIC &&
      (typeAst = parseAnyType(stream, pos += genericAst.length + 1))) {

    if (stream[pos + typeAst.length].type != TOKENS.CLOSEGENERIC) {
      throwError('Missing ' + TOKENS.CLOSEGENERIC +
        ' at pos: ' + pos + typeAst.length);
    }

    return createAst(SYMBOLS.GENERIC, [genericAst, typeAst],
      genericAst.length + typeAst.length + 2);
  }
});

var parseFunctionType = nullable(function(stream, pos) {
  if (stream[pos].type == TOKENS.STRING &&
      stream[pos].value == 'function' &&
      stream[++pos].type == TOKENS.OPENPAREN) {

    var list = stream[pos + 1].type != TOKENS.CLOSEPAREN
      ? parseList(stream, pos + 1, TOKENS.COMMA)
      : {value: [], length: 0};

    pos += list.length + 1;

    if (stream[pos].type == TOKENS.CLOSEPAREN) {
      var length = list.length + 3, returnAst;

      if (stream[++pos].type == TOKENS.COLON) {
        returnAst = parseAnyType(stream, ++pos);
        if (!returnAst) {
          throwError('Could not parse return type at pos: ' + pos);
        }
        length += returnAst.length + 1;
      }
      return createAst(SYMBOLS.FUNCTION, [list.value, returnAst || null],
        length);
    }
  }
});

function parseSegmentType(stream, pos) {
  var segmentAst;
  if (stream[pos].type == TOKENS.OPENSEGMENT &&
      (segmentAst = parseAnyType(stream, ++pos))) {
    pos += segmentAst.length
    if (stream[pos].type == TOKENS.CLOSESEGMENT) {
      return createAst(SYMBOLS.SEGMENT, segmentAst, segmentAst.length + 2);
    }
  }
}

function parseAnyType(stream, pos, parsers) {
  if (!parsers) parsers =
    PARSERS.SEGMENT | PARSERS.SIMPLE | PARSERS.UNION | PARSERS.GENERIC
    | PARSERS.FUNCTION;

  var ast =
    (parsers & PARSERS.UNION && parseUnionType(stream, pos)) ||
    (parsers & PARSERS.SEGMENT && parseSegmentType(stream, pos)) ||
    (parsers & PARSERS.GENERIC && parseGenericType(stream, pos)) ||
    (parsers & PARSERS.FUNCTION && parseFunctionType(stream, pos)) ||
    (parsers & PARSERS.SIMPLE && parseSimpleType(stream, pos));
  if (!ast) {
    throwError('Could not parse ' + stream[pos].type);
  }
  return ast;
}

function parseList(stream, pos, separator, parsers) {
  var symbols = [], childAst, length = 0, separators = 0;
  while (true) {
    if (childAst = parseAnyType(stream, pos, parsers)) {
      symbols.push(childAst);
      length += childAst.length;
      pos += childAst.length;

      if (stream[pos].type == separator) {
        length++;
        pos++;
        separators++;
        continue;
      }
    }
    break;
  }

  if (symbols.length && symbols.length != separators + 1) {
    throwError('Malformed list expression');
  }

  return {
    value: symbols,
    length: length
  };
}

var _source;
function throwError(msg) {
  throw new Error(msg + '\nSource: ' + _source);
}


function parse(source) {
  _source = source;
  var stream = createTokenStream(source);
  var ast = parseAnyType(stream, 0);
  if (ast) {
    if (ast.length + 1 != stream.length) {
      console.log(ast);
      throwError('Could not parse ' + stream[ast.length].type +
      ' at token pos:' + ast.length);
    }
    return ast;
  } else {
    throwError('Failed to parse the source');
  }
}

exports.createTokenStream = createTokenStream;
exports.parse = parse;
exports.parseList = parseList;

/*----- compiler -----*/

var compilers = {};

compilers[SYMBOLS.SIMPLE] = function(ast) {
  switch (ast.value) {
    case 'DOMElement': return 'HTMLElement';
    case 'FBID':       return 'string';
    default:           return ast.value;
  }
};

compilers[SYMBOLS.UNION] = function(ast) {
  return ast.value.map(function(symbol) {
    return compile(symbol);
  }).join(TOKENS.BAR);
};

compilers[SYMBOLS.GENERIC] = function(ast) {
  var type = compile(ast.value[0]);
  var parametricType = compile(ast.value[1]);
  if (type === 'HTMLElement') {
     return 'HTML' + getTagName(parametricType) + 'Element';
  }
  return type + '<' + parametricType + '>';
};

compilers[SYMBOLS.FUNCTION] = function(ast) {
  return 'function(' + ast.value[0].map(function(symbol) {
    return compile(symbol);
  }).join(TOKENS.COMMA) + ')' +
  (ast.value[1] ? ':' + compile(ast.value[1]) : '');
};

function compile(ast) {
  return (ast.nullable ? '?' : '') + compilers[ast.type](ast);
}

exports.compile = compile;

/*----- normalizer -----*/

function normalize(ast) {
  if (ast.type === SYMBOLS.UNION) {
    return ast.value.map(normalize).reduce(function(list, nodes) {
      return list ? list.concat(nodes) : nodes;
    });
  }

  var valueNodes = ast.type === SYMBOLS.GENERIC
      ? normalize(ast.value[1])
      : [ast.value];

  return valueNodes.map(function(valueNode) {
    return createAst(
      ast.type,
      ast.type === SYMBOLS.GENERIC
        ? [ast.value[0], valueNode]
        : valueNode,
      ast.length);
  });
}

exports.normalize = function(ast) {
  var normalized = normalize(ast);
  normalized =  normalized.length === 1
    ? normalized[0]
    : createAst(SYMBOLS.UNION, normalized, normalized.length);
  if (ast.nullable) {
    normalized.nullable = true;
  }
  return normalized;
};

/*----- Tracking TypeAliases -----*/

function initTypeAliasTracking(state) {
  state.g.typeAliasScopes = [];
}

function pushTypeAliases(state, typeAliases) {
  state.g.typeAliasScopes.unshift(typeAliases);
}

function popTypeAliases(state) {
  state.g.typeAliasScopes.shift();
}

function getTypeAlias(id, state) {
  var typeAliasScopes = state.g.typeAliasScopes;
  for (var ii = 0; ii < typeAliasScopes.length; ii++) {
    var typeAliasAnnotation = typeAliasScopes[ii][id.name];
    if (typeAliasAnnotation) {
      return typeAliasAnnotation;
    }
  }
  return null;
}

exports.initTypeAliasTracking = initTypeAliasTracking;
exports.pushTypeAliases = pushTypeAliases;
exports.popTypeAliases = popTypeAliases;

/*----- Tracking which TypeVariables are in scope -----*/
// Counts how many scopes deep each type variable is

function initTypeVariableScopeTracking(state) {
  state.g.typeVariableScopeDepth = {};
}

function pushTypeVariables(node, state) {
  var parameterDeclaration = node.typeParameters, scopeHistory;

  if (parameterDeclaration != null
      && parameterDeclaration.type === Syntax.TypeParameterDeclaration) {
    parameterDeclaration.params.forEach(function (id) {
      scopeHistory = state.g.typeVariableScopeDepth[id.name] || 0;
      state.g.typeVariableScopeDepth[id.name] = scopeHistory + 1;
    });
  }
}

function popTypeVariables(node, state) {
  var parameterDeclaration = node.typeParameters, scopeHistory;

  if (parameterDeclaration != null
      && parameterDeclaration.type === Syntax.TypeParameterDeclaration) {
    parameterDeclaration.params.forEach(function (id) {
      scopeHistory = state.g.typeVariableScopeDepth[id.name];
      state.g.typeVariableScopeDepth[id.name] = scopeHistory - 1;
    });
  }
}

function isTypeVariableInScope(id, state) {
  return state.g.typeVariableScopeDepth[id.name] > 0;
}

exports.initTypeVariableScopeTracking = initTypeVariableScopeTracking;
exports.pushTypeVariables = pushTypeVariables;
exports.popTypeVariables = popTypeVariables;

/*----- FromFlowToTypechecks -----*/

function fromFlowAnnotation(/*object*/ annotation, state) /*?object*/ {
  var ast;
  switch (annotation.type) {
    case 'NumberTypeAnnotation':
      return createAst(SYMBOLS.SIMPLE, 'number', 0);
    case 'StringTypeAnnotation':
      return createAst(SYMBOLS.SIMPLE, 'string', 0);
    case 'BooleanTypeAnnotation':
      return createAst(SYMBOLS.SIMPLE, 'boolean', 0);
    case 'AnyTypeAnnotation': // fallthrough
    case 'VoidTypeAnnotation':
      return null;
    case 'NullableTypeAnnotation':
      ast = fromFlowAnnotation(annotation.typeAnnotation, state);
      if (ast) {
        ast.nullable = true;
      }
      return ast;
    case 'ObjectTypeAnnotation':
    // ObjectTypeAnnotation is always converted to a simple object type, as we
    // don't support records
      return createAst(SYMBOLS.SIMPLE, 'object', 0);
    case 'FunctionTypeAnnotation':
      var params = annotation.params
        .map(function(param) {
          return fromFlowAnnotation(param.typeAnnotation, state);
        })
        .filter(function(ast) {
          return !!ast;
        });

      var returnType = fromFlowAnnotation(annotation.returnType, state);

      // If any of the params have a type that cannot be expressed, then we have
      // to render a simple function instead of a detailed one
      if ((params.length || returnType)
           && params.length === annotation.params.length) {
        return createAst(SYMBOLS.FUNCTION, [params, returnType], 0);
      }
      return createAst(SYMBOLS.SIMPLE, 'function', 0);
    case 'GenericTypeAnnotation':
      var alias = getTypeAlias(annotation.id, state);
      if (alias) {
        return fromFlowAnnotation(alias, state);
      }

      // Qualified type identifiers are not handled by runtime typechecker,
      // so simply omit the annotation for now.
      if (annotation.id.type === 'QualifiedTypeIdentifier') {
        return null;
      }

      if (isTypeVariableInScope(annotation.id, state)) {
        return null;
      }

      var name = annotation.id.name;
      var nameLowerCased = name.toLowerCase();
      if (name !== 'Object' && BLACKLISTED.hasOwnProperty(name)) {
        return null;
      }
      if (SIMPLETYPES.hasOwnProperty(nameLowerCased)) {
        name = nameLowerCased;
      }

      var id = createAst(
        SYMBOLS.SIMPLE,
        name,
        0
      );

      switch (name) {
        case 'mixed': // fallthrough
        case '$Enum':
          // Not supported
          return null;
        case 'array': // fallthrough
        case 'promise':
          if (annotation.typeParameters) {
            var parametricAst = fromFlowAnnotation(
              annotation.typeParameters.params[0],
              state
            );
            if (parametricAst) {
              return createAst(
                SYMBOLS.GENERIC,
                [id, parametricAst],
                0
              );
            }
          }
          break;
        case '$Either':
          if (annotation.typeParameters) {
            return createAst(
              SYMBOLS.UNION,
              annotation.typeParameters.params.map(
                function (node) { return fromFlowAnnotation(node, state); }
              ),
              0
            );
          }
          return null;
      }
      return id;
  }
  return null;
}

exports.fromFlow = function(/*object*/ annotation, state) /*?string*/ {
  var ast = fromFlowAnnotation(annotation, state);
  return ast ? compile(ast) : null;
};
