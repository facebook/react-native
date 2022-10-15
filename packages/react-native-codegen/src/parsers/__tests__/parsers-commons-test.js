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

import {IncorrectlyParameterizedGenericParserError} from '../errors';
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
  it('throws an IncorrectlyParameterizedGenericParserError if typeParameters is null', () => {
    const moduleName = 'testModuleName';
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
    ).toThrow(IncorrectlyParameterizedGenericParserError);
  });

  it("throws an error if typeAnnotation.typeParameters.type doesn't have the correct value depending on language", () => {
    const moduleName = 'testModuleName';
    const flowTypeAnnotation = {
      typeParameters: {
        type: 'TypeParameterInstantiation',
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
    ).toThrow(Error);

    const typeScriptTypeAnnotation = {
      typeParameters: {
        type: 'TypeParameterInstantiation',
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
    ).toThrow(Error);
  });

  it("throws an IncorrectlyParameterizedGenericParserError if typeParameters don't have 1 exactly parameter", () => {
    const moduleName = 'testModuleName';
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
    ).toThrow(IncorrectlyParameterizedGenericParserError);

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
    ).toThrow(IncorrectlyParameterizedGenericParserError);
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
