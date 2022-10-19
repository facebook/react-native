/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use-strict';

import {assertGenericTypeAnnotationHasExactlyOneTypeParameter} from '../parsers-commons';

const {
  wrapNullable,
  unwrapNullable,
  emitMixedTypeAnnotation,
} = require('../parsers-commons.js');

describe('wrapNullable', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = wrapNullable(true, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = wrapNullable(false, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('unwrapNullable', () => {
  describe('when type annotation is nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable({
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        true,
      ];

      expect(result).toEqual(expected);
    });
  });
  describe('when type annotation is not nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable({
        type: 'BooleanTypeAnnotation',
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        false,
      ];

      expect(result).toEqual(expected);
    });
  });
});

describe('assertGenericTypeAnnotationHasExactlyOneTypeParameter', () => {
  const moduleName = 'testModuleName';

  it("doesn't throw any Error when typeAnnotation has exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        type: 'TypeParameterInstantiation',
        params: [1],
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        'Flow',
      ),
    ).not.toThrow();
  });

  it('throws an IncorrectlyParameterizedGenericParserError if typeParameters is null', () => {
    const typeAnnotation = {
      typeParameters: null,
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        'Flow',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have type parameters."`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not TypeParameterInstantiation when language is Flow', () => {
    const flowTypeAnnotation = {
      typeParameters: {
        type: 'wrongType',
        params: [1],
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        flowTypeAnnotation,
        'Flow',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'"`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not TSTypeParameterInstantiation when language is TypeScript', () => {
    const typeScriptTypeAnnotation = {
      typeParameters: {
        type: 'wrongType',
        params: [1],
      },
      typeName: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeScriptTypeAnnotation,
        'TypeScript',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TSTypeParameterInstantiation'"`,
    );
  });

  it("throws an IncorrectlyParameterizedGenericParserError if typeParameters don't have 1 exactly parameter", () => {
    const typeAnnotationWithTwoParams = {
      typeParameters: {
        params: [1, 2],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithTwoParams,
        'Flow',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );

    const typeAnnotationWithNoParams = {
      typeParameters: {
        params: [],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithNoParams,
        'Flow',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });
});

describe('emitMixedTypeAnnotation', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = emitMixedTypeAnnotation(true);
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'MixedTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = emitMixedTypeAnnotation(false);
      const expected = {
        type: 'MixedTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});
