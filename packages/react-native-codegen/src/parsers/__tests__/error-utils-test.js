/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @oncall react_native
 */

'use strict';

const {
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfModuleInterfaceIsMisnamed,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfModuleTypeIsUnsupported,
  throwIfUntypedModule,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfArrayElementTypeAnnotationIsUnsupported,
} = require('../error-utils');
const {
  UnsupportedModulePropertyParserError,
  ModuleInterfaceNotFoundParserError,
  MoreThanOneModuleRegistryCallsParserError,
  MisnamedModuleInterfaceParserError,
  UnusedModuleInterfaceParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UntypedModuleRegistryCallParserError,
  MoreThanOneModuleInterfaceParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
} = require('../errors');
const {FlowParser} = require('../flow/parser');
const {TypeScriptParser} = require('../typescript/parser');

describe('throwIfModuleInterfaceIsMisnamed', () => {
  it("don't throw error if module interface name is Spec", () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Spec'};
    const parserType = 'Flow';

    expect(() => {
      throwIfModuleInterfaceIsMisnamed(nativeModuleName, specId, parserType);
    }).not.toThrow(MisnamedModuleInterfaceParserError);
  });
  it('throw error if module interface is misnamed', () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Name'};
    const parserType = 'TypeScript';

    expect(() => {
      throwIfModuleInterfaceIsMisnamed(nativeModuleName, specId, parserType);
    }).toThrow(MisnamedModuleInterfaceParserError);
  });
});

describe('throwIfModuleInterfaceNotFound', () => {
  it('throw error if there are zero module specs', () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Name'};
    const parserType = 'TypeScript';

    expect(() => {
      throwIfModuleInterfaceNotFound(0, nativeModuleName, specId, parserType);
    }).toThrow(ModuleInterfaceNotFoundParserError);
  });

  it("don't throw error if there is at least one module spec", () => {
    const nativeModuleName = 'moduleName';
    const specId = {name: 'Spec'};
    const parserType = 'Flow';

    expect(() => {
      throwIfModuleInterfaceNotFound(1, nativeModuleName, specId, parserType);
    }).not.toThrow(ModuleInterfaceNotFoundParserError);
  });
});

describe('throwIfMoreThanOneModuleRegistryCalls', () => {
  it('throw error if module registry calls more than one', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [
      {name: 'callExpression1'},
      {name: 'callExpression2'},
    ];

    expect(() => {
      throwIfMoreThanOneModuleRegistryCalls(
        nativeModuleName,
        callExpressions,
        callExpressions.length,
      );
    }).toThrow(MoreThanOneModuleRegistryCallsParserError);
  });
  it("don't throw error if single module registry call", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];

    expect(() => {
      throwIfMoreThanOneModuleRegistryCalls(
        nativeModuleName,
        callExpressions,
        callExpressions.length,
      );
    }).not.toThrow(MoreThanOneModuleRegistryCallsParserError);
  });
});

describe('throwIfUnusedModuleInterfaceParserError', () => {
  it('throw error if unused module', () => {
    const nativeModuleName = 'moduleName';
    const callExpressions: Array<$FlowFixMe> = [];
    const spec = {name: 'Spec'};
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
      );
    }).toThrow(UnusedModuleInterfaceParserError);
  });

  it("don't throw error if module is used", () => {
    const nativeModuleName = 'moduleName';
    const callExpressions = [{name: 'callExpression1'}];
    const spec = {name: 'Spec'};
    expect(() => {
      throwIfUnusedModuleInterfaceParserError(
        nativeModuleName,
        spec,
        callExpressions,
      );
    }).not.toThrow(UnusedModuleInterfaceParserError);
  });
});

describe('throwErrorIfWrongNumberOfCallExpressionArgs', () => {
  it('throw error if wrong number of call expression args is used', () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression: {argument: Array<$FlowFixMe>} = {argument: []};
    const methodName = 'methodName';
    const numberOfCallExpressionArgs = flowCallExpression.argument.length;
    expect(() => {
      throwIfWrongNumberOfCallExpressionArgs(
        nativeModuleName,
        flowCallExpression,
        methodName,
        numberOfCallExpressionArgs,
      );
    }).toThrow(IncorrectModuleRegistryCallArityParserError);
  });

  it("don't throw error if correct number of call expression args is used", () => {
    const nativeModuleName = 'moduleName';
    const flowCallExpression = {argument: ['argument']};
    const methodName = 'methodName';
    const numberOfCallExpressionArgs = flowCallExpression.argument.length;
    expect(() => {
      throwIfWrongNumberOfCallExpressionArgs(
        nativeModuleName,
        flowCallExpression,
        methodName,
        numberOfCallExpressionArgs,
      );
    }).not.toThrow(IncorrectModuleRegistryCallArityParserError);
  });
});

describe('throwIfUnsupportedFunctionReturnTypeAnnotationParserError', () => {
  const returnTypeAnnotation = {
      returnType: '',
    },
    nativeModuleName = 'moduleName',
    invalidReturnType = 'FunctionTypeAnnotation';

  it('do not throw error if cxxOnly is true', () => {
    const cxxOnly = true,
      returnType = 'FunctionTypeAnnotation';

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        returnTypeAnnotation,
        invalidReturnType,
        cxxOnly,
        returnType,
      );
    }).not.toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });

  it('do not throw error if returnTypeAnnotation type is not FunctionTypeAnnotation', () => {
    const cxxOnly = false,
      returnType = '';

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        returnTypeAnnotation,
        invalidReturnType,
        cxxOnly,
        returnType,
      );
    }).not.toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });

  it('throw error if cxxOnly is false and returnTypeAnnotation type is FunctionTypeAnnotation', () => {
    const cxxOnly = false,
      returnType = 'FunctionTypeAnnotation';

    expect(() => {
      throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
        nativeModuleName,
        returnTypeAnnotation,
        invalidReturnType,
        cxxOnly,
        returnType,
      );
    }).toThrow(UnsupportedFunctionReturnTypeAnnotationParserError);
  });
});

describe('throwIfIncorrectModuleRegistryCallTypeParameterParserError', () => {
  const nativeModuleName = 'moduleName';
  const methodName = 'methodName';
  const moduleName = 'moduleName';
  const flowParser = new FlowParser();
  const typescriptParser = new TypeScriptParser();

  it('throw error if flowTypeArguments type is incorrect', () => {
    const flowTypeArguments = {
      type: '',
      params: [
        {
          type: 'GenericTypeAnnotation',
          id: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params length is not 1', () => {
    const flowTypeArguments: $FlowFixMe = {
      type: 'TypeParameterInstantiation',
      params: [],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params type is not GenericTypeAnnotation', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [
        {
          type: '',
          id: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params id name is not Spec', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [
        {
          type: 'GenericTypeAnnotation',
          id: {
            name: '',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('do not throw error if flowTypeArguments are correct', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [
        {
          type: 'GenericTypeAnnotation',
          id: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        flowParser,
      );
    }).not.toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments type not correct', () => {
    const typeScriptTypeArguments = {
      type: '',
      params: [
        {
          type: 'TSTypeReference',
          typeName: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments params length is not equal to 1', () => {
    const typeScriptTypeArguments: $FlowFixMe = {
      type: 'TSTypeParameterInstantiation',
      params: [],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments params type is not TSTypeReference', () => {
    const typeScriptTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [
        {
          type: '',
          typeName: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if typeScriptTypeArguments params typeName name is not Spec', () => {
    const typeScriptTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [
        {
          type: 'TSTypeReference',
          typeName: {
            name: '',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('do not throw error if typeScriptTypeArguments are correct', () => {
    const typeScriptTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [
        {
          type: 'TSTypeReference',
          typeName: {
            name: 'Spec',
          },
        },
      ],
    };

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        typeScriptTypeArguments,
        methodName,
        moduleName,
        typescriptParser,
      );
    }).not.toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });
});

describe('throwIfUntypedModule', () => {
  const hasteModuleName = 'moduleName';
  const methodName = 'methodName';
  const moduleName = 'moduleName';
  const callExpressions: Array<$FlowFixMe> = [];

  it('should throw error if module does not have a type', () => {
    const typeArguments = null;
    expect(() =>
      throwIfUntypedModule(
        typeArguments,
        hasteModuleName,
        callExpressions,
        methodName,
        moduleName,
      ),
    ).toThrowError(UntypedModuleRegistryCallParserError);
  });

  it('should not throw error if module have a type', () => {
    const typeArguments: $FlowFixMe = {
      type: 'TSTypeParameterInstantiations',
      params: [],
    };

    expect(() =>
      throwIfUntypedModule(
        typeArguments,
        hasteModuleName,
        callExpressions,
        methodName,
        moduleName,
      ),
    ).not.toThrowError(UntypedModuleRegistryCallParserError);
  });
});

describe('throwIfModuleTypeIsUnsupported', () => {
  const hasteModuleName = 'moduleName';
  const property = {value: 'value', key: {name: 'name'}};
  it("don't throw error if module type is FunctionTypeAnnotation in Flow", () => {
    const value = {type: 'FunctionTypeAnnotation'};
    const language = 'Flow';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it('throw error if module type is unsupported in Flow', () => {
    const value = {type: ''};
    const language = 'Flow';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).toThrow(UnsupportedModulePropertyParserError);
  });
  it("don't throw error if module type is TSFunctionType in TypeScript", () => {
    const value = {type: 'TSFunctionType'};
    const language = 'TypeScript';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it("don't throw error if module type is TSMethodSignature in TypeScript", () => {
    const value = {type: 'TSMethodSignature'};
    const language = 'TypeScript';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).not.toThrow(UnsupportedModulePropertyParserError);
  });
  it('throw error if module type is unsupported in TypeScript', () => {
    const value = {type: ''};
    const language = 'TypeScript';

    expect(() => {
      throwIfModuleTypeIsUnsupported(
        hasteModuleName,
        property.value,
        property.key.name,
        value.type,
        language,
      );
    }).toThrow(UnsupportedModulePropertyParserError);
  });
});

describe('throwIfMoreThanOneModuleInterfaceParserError', () => {
  it("don't throw error if module specs length is <= 1", () => {
    const nativeModuleName = 'moduleName';
    const moduleSpecs: $ReadOnlyArray<$FlowFixMe> = [];
    const parserType = 'Flow';

    expect(() => {
      throwIfMoreThanOneModuleInterfaceParserError(
        nativeModuleName,
        moduleSpecs,
        parserType,
      );
    }).not.toThrow(MoreThanOneModuleInterfaceParserError);
  });
  it('throw error if module specs is > 1 ', () => {
    const nativeModuleName = 'moduleName';
    const moduleSpecs = [{id: {name: 'Name-1'}}, {id: {name: 'Name-2'}}];
    const parserType = 'TypeScript';

    expect(() => {
      throwIfMoreThanOneModuleInterfaceParserError(
        nativeModuleName,
        moduleSpecs,
        parserType,
      );
    }).toThrow(MoreThanOneModuleInterfaceParserError);
  });
});

describe('throwIfUnsupportedFunctionParamTypeAnnotationParserError', () => {
  const nativeModuleName = 'moduleName';
  const languageParamTypeAnnotation = {type: 'VoidTypeAnnotation'};
  const paramName = 'paramName';
  it('throws an UnsupportedFunctionParamTypeAnnotationParserError', () => {
    const paramTypeAnnotationType = 'VoidTypeAnnotation';
    expect(() => {
      throwIfUnsupportedFunctionParamTypeAnnotationParserError(
        nativeModuleName,
        languageParamTypeAnnotation,
        paramName,
        paramTypeAnnotationType,
      );
    }).toThrow(UnsupportedFunctionParamTypeAnnotationParserError);
  });
});

describe('throwIfArrayElementTypeAnnotationIsUnsupported', () => {
  const {
    UnsupportedArrayElementTypeAnnotationParserError,
  } = require('../errors.js');
  const moduleName = 'moduleName';

  it('throws the error if it is the type is void type annotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'VoidTypeAnnotation',
      );
    }).toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });

  it('throws the error if it is the type is promise type annotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'PromiseTypeAnnotation',
      );
    }).toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });

  it('throws the error if it is the type is function type annotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'FunctionTypeAnnotation',
      );
    }).toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });

  it('does not throw the error if the type is NativeModuleTypeAnnotation', () => {
    expect(() => {
      throwIfArrayElementTypeAnnotationIsUnsupported(
        moduleName,
        undefined,
        'Array',
        'StringTypeAnnotation',
      );
    }).not.toThrow(UnsupportedArrayElementTypeAnnotationParserError);
  });
});
