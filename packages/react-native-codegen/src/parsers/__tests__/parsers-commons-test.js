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

import {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  wrapNullable,
  unwrapNullable,
} from '../parsers-commons';
import type {ParserType} from '../errors';

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

import {MockedParser} from '../parserMock';
import {TypeScriptParser} from '../typescript/parser';

const parser = new MockedParser();
const typeScriptParser = new TypeScriptParser();

const flowTranslateTypeAnnotation = require('../flow/modules/index');
const typeScriptTranslateTypeAnnotation = require('../typescript/modules/index');

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
      // $FlowFixMe[incompatible-call]
      const result = unwrapNullable<{
        type: 'NullableTypeAnnotation',
        typeAnnotation: {type: 'BooleanTypeAnnotation'},
      }>({
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
      const result = unwrapNullable<{type: 'BooleanTypeAnnotation'}>({
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
        parser,
      ),
    ).not.toThrow();
  });

  it('throws a MissingTypeParameterGenericParserError if typeParameters is null', () => {
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
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have type parameters."`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not equal to parser.typeParameterInstantiation', () => {
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
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'"`,
    );
  });

  it("throws a MoreThanOneTypeParameterGenericParserError if typeParameters don't have 1 exactly parameter", () => {
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
        parser,
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
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });
});

describe('isObjectProperty', () => {
  const propertyStub = {
    /* type: 'notObjectTypeProperty', */
    typeAnnotation: {
      typeAnnotation: 'wrongTypeAnnotation',
    },
    value: 'wrongValue',
    name: 'wrongName',
  };

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("returns 'true' if 'property.type' is 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'ObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'notObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("returns 'true' if 'property.type' is 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'TSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'notTSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });
});

describe('parseObjectProperty', () => {
  const moduleName = 'testModuleName';
  const types = {['wrongName']: 'wrongType'};
  const aliasMap = {};
  const tryParse = () => null;
  const cxxOnly = false;
  const nullable = true;

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'ObjectTypeProperty'.", () => {
      const property = {
        type: 'notObjectTypeProperty',
        typeAnnotation: {
          type: 'notObjectTypeProperty',
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          property,
          moduleName,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          nullable,
          flowTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'TSPropertySignature'.", () => {
      const property = {
        type: 'notTSPropertySignature',
        typeAnnotation: {
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          property,
          moduleName,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          nullable,
          typeScriptTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });
});
