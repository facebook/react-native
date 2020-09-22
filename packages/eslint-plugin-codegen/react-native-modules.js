/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react_native
 * @format
 */

'use strict';

const path = require('path');

const supportedTypes = [
  'ArrayTypeAnnotation',
  'BooleanTypeAnnotation',
  'NumberTypeAnnotation',
  'StringTypeAnnotation',
];

const supportedTypeAliases = {
  BooleanTypeAnnotation: 'boolean',
  FunctionTypeAnnotation: 'Function',
  NumberTypeAnnotation: 'number',
  StringTypeAnnotation: 'string',
  ObjectTypeAnnotation: 'object',
};

const supportedGenericTypes = [
  'Array',
  'Object',
  'RootTag',
  '$ReadOnly',
  '$ReadOnlyArray',
];

const supportedNullableTypes = [
  'ArrayTypeAnnotation',
  'BooleanTypeAnnotation',
  'FunctionTypeAnnotation',
  'NumberTypeAnnotation',
  'ObjectTypeAnnotation',
  'StringTypeAnnotation',
];

const supportedMethodReturnTypes = [
  'BooleanTypeAnnotation',
  'NumberTypeAnnotation',
  'ObjectTypeAnnotation',
  'StringTypeAnnotation',
  'VoidTypeAnnotation',
];

const errors = {
  invalidNativeModuleInterfaceName(interfaceName) {
    return (
      "NativeModule interfaces must be named 'Spec', " +
      `got '${interfaceName}'.`
    );
  },
  inexactObjectReturnType() {
    return 'Spec interface method object return type must be exact.';
  },
  invalidHasteName(hasteName) {
    return (
      'Module name for a NativeModule JS wrapper must start with ' +
      `'Native', got '${hasteName}' instead.`
    );
  },
  missingSpecInterfaceMethod() {
    return 'NativeModule Spec interface must define at least one method';
  },
  unsupportedMethodReturnType(typeName) {
    return (
      `Spec interface method has unsupported return type '${typeName}'. ` +
      'See https://fburl.com/rn-nativemodules for more details.'
    );
  },
  unsupportedType(typeName) {
    return (
      `Unsupported type '${typeName}' for Spec interface. ` +
      'See https://fburl.com/rn-nativemodules for more details.'
    );
  },
  untypedModuleRequire(requireMethodName) {
    return (
      'NativeModule require not type-safe. Please require with the NativeModule interface ' +
      `'Spec': TurboModuleRegistry.${requireMethodName}<Spec>`
    );
  },
  incorrectlyTypedModuleRequire(requireMethodName) {
    return (
      'NativeModule require incorrectly typed. Please require with the NativeModule interface identifier ' +
      `'Spec', and nothing else: TurboModuleRegistry.${requireMethodName}<Spec>`
    );
  },
  specNotDeclaredInFile() {
    return "The NativeModule interface 'Spec' wasn't declared in this NativeModule spec file.";
  },
};

function interfaceExtendsFrom(node, superInterfaceName) {
  return (
    node.type === 'InterfaceDeclaration' &&
    node.extends[0] &&
    node.extends[0].id.name === superInterfaceName
  );
}

function isSupportedFunctionParam(node) {
  if (node.type !== 'FunctionTypeParam') {
    return false;
  }

  if (node.optional) {
    return false;
  }

  return findUnsupportedType(node.typeAnnotation, true) == null;
}

function findUnsupportedType(typeAnnotation, supportCallbacks) {
  if (supportedTypes.includes(typeAnnotation.type)) {
    return null;
  }

  if (typeAnnotation.type === 'NullableTypeAnnotation') {
    if (supportedNullableTypes.includes(typeAnnotation.typeAnnotation.type)) {
      return null;
    }
    typeAnnotation = typeAnnotation.typeAnnotation;
  }

  if (typeAnnotation.type === 'FunctionTypeAnnotation' && supportCallbacks) {
    return null;
  }

  if (typeAnnotation.type === 'GenericTypeAnnotation') {
    if (!supportedGenericTypes.includes(typeAnnotation.id.name)) {
      return typeAnnotation;
    }
    if (
      !isGenericArrayTypeAnnotation(typeAnnotation) &&
      typeAnnotation.typeParameters
    ) {
      for (const param of typeAnnotation.typeParameters.params) {
        const unsupported = findUnsupportedType(param, supportCallbacks);
        if (unsupported != null) {
          return unsupported;
        }
      }
    }
    return null;
  }

  if (typeAnnotation.type === 'ObjectTypeAnnotation') {
    for (const prop of typeAnnotation.properties) {
      const unsupported = findUnsupportedType(prop.value, supportCallbacks);
      if (unsupported != null) {
        return unsupported;
      }
    }
    return null;
  }

  return typeAnnotation;
}

function functionParamTypeName(node) {
  if (node.type !== 'FunctionTypeParam') {
    return null;
  }

  const parts = [];
  if (node.optional) {
    parts.push('optional');
  }
  parts.push(functionParamTypeAnnotationName(node.typeAnnotation));
  return parts.join(' ');
}

function functionParamTypeAnnotationName(typeAnnotation) {
  const {id, type} = typeAnnotation;
  if (type === 'GenericTypeAnnotation') {
    return id.name;
  }

  const parts = [];
  if (type === 'NullableTypeAnnotation') {
    parts.push('nullable');
    parts.push(functionParamTypeAnnotationName(typeAnnotation.typeAnnotation));
  } else {
    parts.push(supportedTypeAliases[type] || type);
  }
  return parts.join(' ');
}

function getTypeName(typeAnnotation) {
  const {id, type} = typeAnnotation;
  if (type === 'GenericTypeAnnotation') {
    return id.name;
  }
  return supportedTypeAliases[type];
}

function checkSupportedSpecProperty(context, node) {
  if (node.type !== 'FunctionTypeAnnotation') {
    const unsupportedNode = findUnsupportedType(node, false);
    if (unsupportedNode != null) {
      context.report({
        node: unsupportedNode,
        message: errors.unsupportedType(
          functionParamTypeAnnotationName(unsupportedNode),
        ),
      });
      return false;
    }
    return true;
  }

  if (!isSupportedMethodReturnTypeAnnotation(node.returnType)) {
    context.report({
      node: node.returnType,
      message: errors.unsupportedMethodReturnType(getTypeName(node.returnType)),
    });
    return false;
  }

  // Check for exact object return type.
  if (
    node.returnType.type === 'ObjectTypeAnnotation' &&
    !node.returnType.exact
  ) {
    context.report({
      node: node.returnType,
      message: errors.inexactObjectReturnType(),
    });
  }

  for (const param of node.params) {
    if (!isSupportedFunctionParam(param)) {
      context.report({
        node: param.typeAnnotation,
        message: errors.unsupportedType(functionParamTypeName(param)),
      });
      return false;
    }
  }

  return true;
}

function isPromiseTypeAnnotation(typeAnnotation) {
  return (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id &&
    typeAnnotation.id.name === 'Promise'
  );
}

function isGenericArrayTypeAnnotation(typeAnnotation) {
  return (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id &&
    typeAnnotation.id.name === 'Array'
  );
}

function isGenericObjectTypeAnnotation(typeAnnotation) {
  return (
    typeAnnotation.type === 'GenericTypeAnnotation' &&
    typeAnnotation.id &&
    typeAnnotation.id.name === 'Object'
  );
}

function isSupportedMethodReturnTypeAnnotation(typeAnnotation) {
  const resolvedType =
    typeAnnotation.type === 'NullableTypeAnnotation'
      ? typeAnnotation.typeAnnotation
      : typeAnnotation;
  return (
    supportedMethodReturnTypes.includes(resolvedType.type) ||
    isGenericArrayTypeAnnotation(resolvedType) ||
    isGenericObjectTypeAnnotation(resolvedType) ||
    isPromiseTypeAnnotation(resolvedType)
  );
}

const VALID_SPEC_NAMES = /^Native\S+$/;

function isModuleRequire(node) {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const callExpression = node;

  if (callExpression.callee.type !== 'MemberExpression') {
    return false;
  }

  const memberExpression = callExpression.callee;
  if (
    !(
      memberExpression.object.type === 'Identifier' &&
      memberExpression.object.name === 'TurboModuleRegistry'
    )
  ) {
    return false;
  }

  if (
    !(
      memberExpression.property.type === 'Identifier' &&
      (memberExpression.property.name === 'get' ||
        memberExpression.property.name === 'getEnforcing')
    )
  ) {
    return false;
  }
  return true;
}

function isGeneratedFile(context) {
  return (
    context
      .getSourceCode()
      .getText()
      .indexOf('@' + 'generated SignedSource<<') !== -1
  );
}

/**
 * A lint rule to guide best practices in writing type safe React NativeModules.
 */
function rule(context) {
  const filename = context.getFilename();

  if (isGeneratedFile(context)) {
    return {};
  }

  const sourceCode = context.getSourceCode().getText();
  if (!sourceCode.includes('TurboModuleRegistry')) {
    return {};
  }

  const specIdentifierUsages = [];
  const declaredModuleInterfaces = [];

  return {
    'Program:exit': function() {
      if (
        specIdentifierUsages.length > 0 &&
        declaredModuleInterfaces.length === 0
      ) {
        specIdentifierUsages.forEach(specNode => {
          context.report({
            node: specNode,
            message: errors.specNotDeclaredInFile(),
          });
        });
      }
    },
    CallExpression(node) {
      if (!isModuleRequire(node)) {
        return;
      }

      /**
       * Validate that NativeModule requires are typed
       */

      const {typeArguments} = node;

      if (typeArguments == null) {
        const methodName = node.callee.property.name;
        context.report({
          node,
          message: errors.untypedModuleRequire(methodName),
        });
        return;
      }

      if (typeArguments.type !== 'TypeParameterInstantiation') {
        return;
      }

      const [param] = typeArguments.params;

      /**
       * Validate that NativeModule requires are correctly typed
       */

      if (
        typeArguments.params.length !== 1 ||
        param.type !== 'GenericTypeAnnotation' ||
        param.id.name !== 'Spec'
      ) {
        const methodName = node.callee.property.name;
        context.report({
          node,
          message: errors.incorrectlyTypedModuleRequire(methodName),
        });
        return;
      }

      specIdentifierUsages.push(param);
      return true;
    },
    InterfaceDeclaration(node) {
      if (
        !interfaceExtendsFrom(node, 'DEPRECATED_RCTExport') &&
        !interfaceExtendsFrom(node, 'TurboModule')
      ) {
        return;
      }

      const basename = path.basename(filename, '.js');
      if (
        basename &&
        basename !== 'RCTExport' &&
        !VALID_SPEC_NAMES.test(basename)
      ) {
        context.report({
          loc: {start: {line: 0, column: 0}},
          message: errors.invalidHasteName(basename),
        });
      }

      if (node.id.name !== 'Spec') {
        context.report({
          node,
          message: errors.invalidNativeModuleInterfaceName(node.id.name),
          fix: fixer => fixer.replaceText(node.id, 'Spec'),
        });
        return;
      }

      declaredModuleInterfaces.push(node);

      if (!node.body.properties.length) {
        context.report({
          node: node.body,
          message: errors.missingSpecInterfaceMethod(),
        });
        return;
      }

      let hasUnsupportedProp = false;
      node.body.properties.forEach(prop => {
        if (hasUnsupportedProp) {
          return;
        }
        if (!checkSupportedSpecProperty(context, prop.value)) {
          hasUnsupportedProp = true;
        }
      });
    },
  };
}

rule.errors = errors;

module.exports = rule;
