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
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
} = require('../error-utils');

const {
  IncorrectModuleRegistryCallTypeParameterParserError,
} = require('../errors');

describe('throwIfIncorrectModuleRegistryCallTypeParameterParserError', () => {
  const nativeModuleName = 'moduleName';
  const methodName = 'methodName';
  const moduleName = 'moduleName';
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

    const parserType = 'Flow';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params length is not 1', () => {
    const flowTypeArguments = {
      type: 'TypeParameterInstantiation',
      params: [],
    };

    const parserType = 'Flow';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
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

    const parserType = 'Flow';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
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

    const parserType = 'Flow';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('dont throw error if flowTypeArguments are correct', () => {
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

    const parserType = 'Flow';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).not.toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });
  it('throw error if flowTypeArguments type not correct', () => {
    const flowTypeArguments = {
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

    const parserType = 'TypeScript';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params length is not equal to 1', () => {
    const flowTypeArguments = {
      type: 'TSTypeParameterInstantiation',
      params: [],
    };

    const parserType = 'TypeScript';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params type is not TSTypeReference', () => {
    const flowTypeArguments = {
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

    const parserType = 'TypeScript';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('throw error if flowTypeArguments params typeName name is not Spec', () => {
    const flowTypeArguments = {
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

    const parserType = 'TypeScript';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });

  it('dont throw error if typeArguments are correct', () => {
    const flowTypeArguments = {
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

    const parserType = 'TypeScript';

    expect(() => {
      throwIfIncorrectModuleRegistryCallTypeParameterParserError(
        nativeModuleName,
        flowTypeArguments,
        methodName,
        moduleName,
        parserType,
      );
    }).not.toThrow(IncorrectModuleRegistryCallTypeParameterParserError);
  });
});
