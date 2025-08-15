/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  ComparisonResult,
  FunctionComparisonResult,
  MembersComparisonResult,
  NullableComparisonResult,
  PositionalComparisonResult,
  PropertiesComparisonResult,
} from './ComparisonResult';
import type {
  DiffSet,
  DiffSummary,
  ErrorCode,
  ErrorStore,
  IncompatiblityReport,
  NativeSpecErrorStore,
  ObjectTypeChangeStore,
  SchemaDiff,
} from './DiffResults';
import type {
  CompleteTypeAnnotation,
  ComponentSchema,
  NamedShape,
  NativeModuleSchema,
  SchemaType,
} from '@react-native/codegen/src/CodegenSchema';

import {
  memberComparisonError,
  positionalComparisonError,
  propertyComparisonError,
  typeAnnotationComparisonError,
  typeInformationComparisonError,
} from './ComparisonResult.js';
import convertPropToBasicTypes from './convertPropToBasicTypes';
import * as codegenTypeDiffing from './TypeDiffing';

type BoundaryDirection = 'toNative' | 'fromNative' | 'both';

type checkerType = (
  propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  nullableChange: ?NullableComparisonResult,
  memberChange: ?MembersComparisonResult,
  typeName: string,
) => Array<ErrorStore>;

function nestedPropertiesCheck(
  typeName: string,
  result: ComparisonResult,
  check: checkerType,
  inverseCheck: checkerType,
): Array<ErrorStore> {
  const nestedMap =
    (mid: string, end: string) =>
    /* $FlowFixMe[missing-local-annot] The type annotation(s) required by
     * Flow's LTI update could not be added via codemod */
    ([propertyName, comparisonResult]) =>
      nestedPropertiesCheck(
        typeName + mid + propertyName + end,
        comparisonResult,
        check,
        inverseCheck,
      );
  switch (result.status) {
    case 'error':
    case 'matching':
    case 'skipped':
      throw new Error(
        'Internal error: nested property change ' + result.status,
      );
    case 'properties':
      let finalResult = check(result.propertyLog, null, null, null, typeName);
      if (result.propertyLog.nestedPropertyChanges) {
        finalResult = combine(
          finalResult,
          result.propertyLog.nestedPropertyChanges.map(nestedMap('.', '')),
        );
      }
      if (result.propertyLog.madeOptional) {
        const furtherNestedProps = result.propertyLog.madeOptional.filter(
          optionalProp => optionalProp.furtherChanges,
        );
        if (furtherNestedProps && furtherNestedProps.length > 0) {
          const localNestedMap = nestedMap('.', '');
          const mappedProps = furtherNestedProps.map(optionalProp => {
            if (optionalProp.furtherChanges) {
              return localNestedMap([
                optionalProp.property,
                optionalProp.furtherChanges,
              ]);
            }
            throw new Error('Internal error, filter failed');
          });
          finalResult = combine(finalResult, mappedProps);
        }
      }
      return finalResult;
    case 'members':
      return check(null, null, null, result.memberLog, typeName);
    case 'functionChange':
      let returnTypeResult: Array<ErrorStore> = [];
      if (result.functionChangeLog.returnType) {
        returnTypeResult = nestedPropertiesCheck(
          typeName,
          result.functionChangeLog.returnType,
          check,
          inverseCheck,
        );
      }
      if (result.functionChangeLog.parameterTypes) {
        return combine(
          returnTypeResult,
          result.functionChangeLog.parameterTypes.nestedChanges.map(
            ([_oldParameterNumber, newParameterNumber, comparisonResult]) =>
              nestedPropertiesCheck(
                typeName + ' parameter ' + newParameterNumber,
                comparisonResult,
                inverseCheck,
                check,
              ),
          ),
        );
      }
      return returnTypeResult;
    case 'positionalTypeChange':
      const changeLog = result.changeLog;
      const currentPositionalCheck = check(
        null,
        changeLog,
        null,
        null,
        typeName,
      );
      return combine(
        currentPositionalCheck,
        changeLog.nestedChanges.map(([_oldIndex, newIndex, nestedChange]) =>
          nestedMap(
            ' element ',
            ' of ' + changeLog.typeKind,
          )([newIndex.toString(), nestedChange]),
        ),
      );
    case 'nullableChange':
      const currentCheck = check(
        null,
        null,
        result.nullableLog,
        null,
        typeName,
      );
      if (result.nullableLog.interiorLog) {
        const interiorLog = result.nullableLog.interiorLog;
        switch (interiorLog.status) {
          case 'matching':
            return currentCheck;
          case 'properties':
          case 'functionChange':
          case 'positionalTypeChange':
          case 'nullableChange':
            return combine(currentCheck, [
              nestedPropertiesCheck(typeName, interiorLog, check, inverseCheck),
            ]);
          default:
            throw new Error(
              'Internal error: nested with error or skipped status',
            );
        }
      }
      return currentCheck;
    default:
      (result.status: empty);
      return [];
  }
}

function checkOptionalityAndSetError(
  typeName: string,
  properties: $ReadOnlyArray<NamedShape<CompleteTypeAnnotation>>,
  msg: string,
  errorCode: ErrorCode,
): Array<ErrorStore> {
  const requiredProperties = properties.filter(
    objectTypeProperty => !objectTypeProperty.optional,
  );
  if (requiredProperties.length > 0) {
    return [
      {
        typeName,
        errorCode,
        errorInformation: propertyComparisonError(
          msg,
          requiredProperties.map(property => ({
            property: property.name,
          })),
        ),
      },
    ];
  }
  return [];
}

// Exported for testing
export const removedPropertiesMessage =
  'Object removed required properties expected by native';
function checkForUnsafeRemovedProperties(
  propertyChange: ?PropertiesComparisonResult,
  _postionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (propertyChange && propertyChange.missingProperties) {
    return checkOptionalityAndSetError(
      typeName,
      propertyChange.missingProperties,
      removedPropertiesMessage,
      'removedProps',
    );
  }
  return [];
}

export const addedPropertiesMessage =
  'Object added required properties, which native will not provide';
function checkForUnsafeAddedProperties(
  propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (propertyChange && propertyChange.addedProperties) {
    return checkOptionalityAndSetError(
      typeName,
      propertyChange.addedProperties,
      addedPropertiesMessage,
      'addedProps',
    );
  }
  return [];
}

export const stricterPropertiesMessage =
  'Property made strict, but native may not provide it';
function checkForUnSafeMadeStrictProperties(
  propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    propertyChange &&
    propertyChange.madeStrict &&
    propertyChange.madeStrict.length > 0
  ) {
    const err = propertyComparisonError(
      stricterPropertiesMessage,
      propertyChange.madeStrict.map(property => ({
        property: property.property,
      })),
    );
    return [
      {
        typeName,
        errorCode: 'requiredProps',
        errorInformation: err,
      },
    ];
  }
  return [];
}

export const tooOptionalPropertiesMessage =
  'Property made optional, but native requires it';
function checkForUnSafeMadeOptionalProperties(
  propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    propertyChange &&
    propertyChange.madeOptional &&
    propertyChange.madeOptional.length > 0
  ) {
    const err = propertyComparisonError(
      tooOptionalPropertiesMessage,
      propertyChange.madeOptional.map(property => ({
        property: property.property,
      })),
    );
    return [
      {
        typeName,
        errorCode: 'optionalProps',
        errorInformation: err,
      },
    ];
  }
  return [];
}

export const removedUnionMessage =
  'Union removed items, but native may still provide them';
function checkForUnsafeRemovedUnionItems(
  _propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    positionalChange &&
    (positionalChange.typeKind === 'union' ||
      positionalChange.typeKind === 'stringUnion') &&
    positionalChange.removedElements &&
    positionalChange.removedElements.length > 0
  ) {
    return [
      {
        typeName,
        errorCode: 'removedUnionCases',
        errorInformation: positionalComparisonError(
          removedUnionMessage,
          positionalChange.removedElements,
        ),
      },
    ];
  }
  return [];
}

export const addedUnionMessage =
  'Union added items, but native will not expect/support them';
function checkForUnsafeAddedUnionItems(
  _propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    positionalChange &&
    (positionalChange.typeKind === 'union' ||
      positionalChange.typeKind === 'stringUnion') &&
    positionalChange.addedElements &&
    positionalChange.addedElements.length > 0
  ) {
    return [
      {
        typeName,
        errorCode: 'addedUnionCases',
        errorInformation: positionalComparisonError(
          addedUnionMessage,
          positionalChange.addedElements,
        ),
      },
    ];
  }
  return [];
}

export const removedEnumMessage =
  'Enum removed items, but native may still provide them';
function checkForUnsafeRemovedEnumItems(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (memberChange?.missingMembers && memberChange?.missingMembers.length > 0) {
    return [
      {
        typeName,
        errorCode: 'removedEnumCases',
        errorInformation: memberComparisonError(
          removedEnumMessage,
          memberChange.missingMembers.map(member => ({
            member: member.name,
          })),
        ),
      },
    ];
  }

  return [];
}

export const addedEnumMessage =
  'Enum added items, but native will not expect/support them';
function checkForUnsafeAddedEnumItems(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (memberChange?.addedMembers && memberChange?.addedMembers.length > 0) {
    return [
      {
        typeName,
        errorCode: 'addedEnumCases',
        errorInformation: memberComparisonError(
          addedEnumMessage,
          memberChange.addedMembers.map(member => ({
            member: member.name,
          })),
        ),
      },
    ];
  }

  return [];
}

export const removedIntersectionMessage =
  'Intersection removed items, but native may still require properties contained in them';
function checkForUnsafeRemovedIntersectionItems(
  _propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    positionalChange &&
    positionalChange.typeKind === 'intersection' &&
    positionalChange.removedElements &&
    positionalChange.removedElements.length > 0
  ) {
    return [
      {
        typeName,
        errorCode: 'removedIntersectCases',
        errorInformation: positionalComparisonError(
          removedIntersectionMessage,
          positionalChange.removedElements,
        ),
      },
    ];
  }
  return [];
}

export const addedIntersectionMessage =
  'Intersection added items, but native may not provide all required attributes';
function checkForUnsafeAddedIntersectionItems(
  _propertyChange: ?PropertiesComparisonResult,
  positionalChange: ?PositionalComparisonResult,
  _nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    positionalChange &&
    positionalChange.typeKind === 'intersection' &&
    positionalChange.addedElements &&
    positionalChange.addedElements.length > 0
  ) {
    return [
      {
        typeName,
        errorCode: 'addedIntersectCases',
        errorInformation: positionalComparisonError(
          addedIntersectionMessage,
          positionalChange.addedElements,
        ),
      },
    ];
  }
  return [];
}

export const toNativeVoidChangeMessage =
  'Native may not be able to safely handle presence of type';
export const typeNullableChangeMessage =
  'Type made nullable, but native requires it';
function checkForUnsafeNullableToNativeChange(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    nullableChange &&
    !nullableChange.optionsReduced &&
    nullableChange.newType &&
    nullableChange.oldType
  ) {
    return [
      {
        typeName,
        errorCode: 'nullableOfNonNull',
        errorInformation: typeAnnotationComparisonError(
          nullableChange.typeRefined
            ? toNativeVoidChangeMessage
            : typeNullableChangeMessage,
          nullableChange.newType,
          nullableChange.oldType,
        ),
      },
    ];
  }
  return [];
}

export const fromNativeVoidChangeMessage =
  'Type set to void but native may still provide a value';
export const typeNonNullableChangeMessage =
  'Type made non-nullable, but native might provide null still';
function checkForUnsafeNullableFromNativeChange(
  _propertyChange: ?PropertiesComparisonResult,
  _positionalChange: ?PositionalComparisonResult,
  nullableChange: ?NullableComparisonResult,
  _memberChange: ?MembersComparisonResult,
  typeName: string,
): Array<ErrorStore> {
  if (
    nullableChange &&
    nullableChange.optionsReduced &&
    nullableChange.newType &&
    nullableChange.oldType
  ) {
    return [
      {
        typeName,
        errorCode: 'nonNullableOfNull',
        errorInformation: typeAnnotationComparisonError(
          nullableChange.typeRefined
            ? fromNativeVoidChangeMessage
            : typeNonNullableChangeMessage,
          nullableChange.newType,
          nullableChange.oldType,
        ),
      },
    ];
  }
  return [];
}

function chainPropertiesChecks(checks: Array<checkerType>): checkerType {
  return (
    propertyChange: ?PropertiesComparisonResult,
    positionalChange: ?PositionalComparisonResult,
    nullableChange: ?NullableComparisonResult,
    memberChange: ?MembersComparisonResult,
    typeName: string,
  ) =>
    checks.reduce(
      (errorStore, checker) =>
        errorStore.concat(
          checker(
            propertyChange,
            positionalChange,
            nullableChange,
            memberChange,
            typeName,
          ),
        ),
      [],
    );
}

function combine(
  singleton: Array<ErrorStore>,
  arrayOf: Array<Array<ErrorStore>>,
) {
  if (arrayOf.length > 0) {
    return arrayOf.reduce(
      (finalErrorArray, current) => finalErrorArray.concat(current),
      singleton,
    );
  }
  return singleton;
}

function compareFunctionTypesInContext(
  typeName: string,
  functionLog: FunctionComparisonResult,
  check: checkerType,
  inversecheck: checkerType,
  result: Array<ErrorStore>,
) {
  if (functionLog.returnType) {
    result = combine(result, [
      nestedPropertiesCheck(
        typeName,
        functionLog.returnType,
        check,
        inversecheck,
      ),
    ]);
  }
  if (
    functionLog.parameterTypes &&
    functionLog.parameterTypes.nestedChanges.length > 0
  ) {
    result = combine(
      result,
      functionLog.parameterTypes.nestedChanges.map(
        ([_oldPropertyNum, newPropertyNum, comparisonResult]) =>
          nestedPropertiesCheck(
            typeName + ' parameter ' + newPropertyNum,
            comparisonResult,
            inversecheck,
            check,
          ),
      ),
    );
  }
  return result;
}

// Deleting optional properties is safe and
// Making required properties optional is unsafe.
// Adding to unions and enums is unsafe, as is removing from intersections
// Changing nullable is similar to changing a union
const checksForTypesFlowingToNative: checkerType = chainPropertiesChecks([
  checkForUnsafeRemovedProperties,
  checkForUnSafeMadeOptionalProperties,
  checkForUnsafeAddedUnionItems,
  checkForUnsafeAddedEnumItems,
  checkForUnsafeRemovedIntersectionItems,
  checkForUnsafeNullableToNativeChange,
]);
// Adding optional properties is safe, otherwise incompatible
// Making optional properties required is unsafe.
// Removing from unions and enums is unsafe, as is adding to intersections
// Changing nullable is similar to changing a union
const checksForTypesFlowingFromNative: checkerType = chainPropertiesChecks([
  checkForUnsafeAddedProperties,
  checkForUnSafeMadeStrictProperties,
  checkForUnsafeRemovedUnionItems,
  checkForUnsafeRemovedEnumItems,
  checkForUnsafeAddedIntersectionItems,
  checkForUnsafeNullableFromNativeChange,
]);
export function assessComparisonResult(
  newTypes: Set<{
    typeName: string,
    typeInformation: CompleteTypeAnnotation,
    ...
  }>,
  deprecatedTypes: Set<{
    typeName: string,
    typeInformation: CompleteTypeAnnotation,
    ...
  }>,
  incompatibleChanges: Set<ErrorStore>,
  objectTypeChanges: Set<ObjectTypeChangeStore>,
): (
  typeName: string,
  newType: CompleteTypeAnnotation,
  oldType: ?CompleteTypeAnnotation,
  difference: ComparisonResult,
  oldDirection: BoundaryDirection,
) => void {
  return (
    typeName: string,
    newType: CompleteTypeAnnotation,
    oldType: ?CompleteTypeAnnotation,
    difference: ComparisonResult,
    oldDirection: BoundaryDirection,
  ) => {
    switch (difference.status) {
      case 'matching':
        break;
      case 'skipped':
        newTypes.add({
          typeName,
          typeInformation: newType,
        });
        break;
      case 'members':
        {
          const memberChange = difference.memberLog;

          const toNativeErrorResult = checksForTypesFlowingToNative(
            null,
            null,
            null,
            memberChange,
            typeName,
          );

          const fromNativeErrorResult = checksForTypesFlowingFromNative(
            null,
            null,
            null,
            memberChange,
            typeName,
          );

          switch (oldDirection) {
            case 'toNative':
              toNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              break;
            case 'fromNative':
              fromNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              break;
            case 'both':
              toNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              fromNativeErrorResult.forEach(error =>
                incompatibleChanges.add(error),
              );
              break;
          }
        }
        break;
      case 'properties':
        const propertyChange = difference.propertyLog;
        const unsafeForToNative = nestedPropertiesCheck(
          typeName,
          difference,
          checksForTypesFlowingToNative,
          checksForTypesFlowingFromNative,
        );
        const unsafeForFromNative = nestedPropertiesCheck(
          typeName,
          difference,
          checksForTypesFlowingFromNative,
          checksForTypesFlowingToNative,
        );

        switch (oldDirection) {
          case 'toNative':
            unsafeForToNative.forEach(error => incompatibleChanges.add(error));
            break;
          case 'fromNative':
            unsafeForFromNative.forEach(error =>
              incompatibleChanges.add(error),
            );
            break;
          case 'both':
            unsafeForToNative.forEach(error => incompatibleChanges.add(error));
            unsafeForFromNative.forEach(error =>
              incompatibleChanges.add(error),
            );
            break;
        }

        if (!oldType) {
          throw new Error('Internal error: properties change with no old type');
        }
        objectTypeChanges.add({
          typeName,
          newType,
          oldType,
          propertyChange,
        });
        break;
      case 'error':
        incompatibleChanges.add({
          typeName,
          errorCode: 'incompatibleTypes',
          errorInformation: difference.errorLog,
        });
        break;
      case 'functionChange':
        const functionLog = difference.functionChangeLog;
        let propertyErrors: Array<ErrorStore> = [];
        switch (oldDirection) {
          case 'toNative':
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              checksForTypesFlowingToNative,
              checksForTypesFlowingFromNative,
              propertyErrors,
            );
            break;
          case 'fromNative':
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              checksForTypesFlowingFromNative,
              checksForTypesFlowingToNative,
              propertyErrors,
            );
            break;
          case 'both':
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              checksForTypesFlowingToNative,
              checksForTypesFlowingFromNative,
              propertyErrors,
            );
            propertyErrors = compareFunctionTypesInContext(
              typeName,
              functionLog,
              checksForTypesFlowingFromNative,
              checksForTypesFlowingToNative,
              propertyErrors,
            );
            break;
          default:
            (oldDirection: empty);
            throw new Error(
              'Unsupported native boundary direction ' + oldDirection,
            );
        }
        propertyErrors.forEach(error => incompatibleChanges.add(error));
        break;
      case 'positionalTypeChange':
        const changeLog = difference.changeLog;
        if (
          changeLog.nestedChanges.length > 0 ||
          changeLog.addedElements ||
          changeLog.removedElements
        ) {
          const changes = changeLog.nestedChanges;
          const toNativeBase = checksForTypesFlowingToNative(
            null,
            changeLog,
            null,
            null,
            typeName,
          );
          const toNativeResult = combine(
            toNativeBase,
            changes.map(([_oldIndex, newIndex, comparisonResult]) =>
              nestedPropertiesCheck(
                `${typeName} element ${newIndex} of ${changeLog.typeKind}`,
                comparisonResult,
                checksForTypesFlowingToNative,
                checksForTypesFlowingFromNative,
              ),
            ),
          );
          const fromNativeBase = checksForTypesFlowingFromNative(
            null,
            changeLog,
            null,
            null,
            typeName,
          );
          const fromNativeResult = combine(
            fromNativeBase,
            changes.map(([_oldIndex, newIndex, comparisonResult]) =>
              nestedPropertiesCheck(
                `${typeName} element ${newIndex} of ${changeLog.typeKind}`,
                comparisonResult,
                checksForTypesFlowingFromNative,
                checksForTypesFlowingToNative,
              ),
            ),
          );
          switch (oldDirection) {
            case 'toNative':
              toNativeResult.forEach(error => incompatibleChanges.add(error));
              break;
            case 'fromNative':
              fromNativeResult.forEach(error => incompatibleChanges.add(error));
              break;
            case 'both':
              toNativeResult.forEach(error => incompatibleChanges.add(error));
              fromNativeResult.forEach(error => incompatibleChanges.add(error));
              break;
          }
        }
        break;
      case 'nullableChange':
        if (!oldType) {
          throw new Error(
            'Internal error: old type null or undefined, after nullableChange',
          );
        }
        switch (oldDirection) {
          case 'toNative':
            checkForUnsafeNullableToNativeChange(
              null,
              null,
              difference.nullableLog,
              null,
              typeName,
            ).forEach(error => incompatibleChanges.add(error));
            break;
          case 'fromNative':
            checkForUnsafeNullableFromNativeChange(
              null,
              null,
              difference.nullableLog,
              null,
              typeName,
            ).forEach(error => incompatibleChanges.add(error));
            break;
          case 'both':
            const err = typeInformationComparisonError(
              'Type may not change nullability, due to flowing to and from native',
              newType,
              oldType,
            );
            incompatibleChanges.add({
              typeName,
              errorCode: 'incompatibleTypes',
              errorInformation: err,
            });
            break;
          default:
            (oldDirection: empty);
            throw new Error('Unknown direction : ' + oldDirection);
        }
        /* $FlowFixMe[prop-missing] (>=0.68.0 site=react_native_fb) This
         * comment suppresses an error found when Flow v0.68 was deployed. To
         * see the error delete this comment and run Flow. */
        if (difference.interiorLog) {
          const log = difference.interiorLog;
          assessComparisonResult(
            newTypes,
            deprecatedTypes,
            incompatibleChanges,
            objectTypeChanges,
          )(typeName, newType, oldType, log, oldDirection);
        }
        break;
      default:
        (difference.status: empty);
        throw new Error('Unsupported status: ' + difference.status);
    }
  };
}

function buildNativeModulesDiff(
  newerNativeModule: NativeModuleSchema,
  olderNativeModule: NativeModuleSchema,
): Set<NativeSpecErrorStore> {
  const moduleErrors = new Set<NativeSpecErrorStore>();

  const nativeModuleName = newerNativeModule.moduleName;
  if (olderNativeModule.moduleName !== newerNativeModule.moduleName) {
    // old was removed
    moduleErrors.add({
      nativeSpecName: olderNativeModule.moduleName,
      omitted: true,
      errorCode: 'removedModule',
    });
  }

  const newTypes = new Set<{
    typeInformation: CompleteTypeAnnotation,
    typeName: string,
    ...
  }>();
  const deprecatedTypes = new Set<{
    typeInformation: CompleteTypeAnnotation,
    typeName: string,
    ...
  }>();
  const incompatibleChanges = new Set<ErrorStore>();
  const objectTypeChanges = new Set<ObjectTypeChangeStore>();
  const localAssessComparison = assessComparisonResult(
    newTypes,
    deprecatedTypes,
    incompatibleChanges,
    objectTypeChanges,
  );

  const newType: CompleteTypeAnnotation = {
    type: 'ObjectTypeAnnotation',
    properties: [
      ...newerNativeModule.spec.methods,
      ...newerNativeModule.spec.eventEmitters,
    ],
  };
  const oldType: CompleteTypeAnnotation = {
    type: 'ObjectTypeAnnotation',
    properties: [
      ...olderNativeModule.spec.methods,
      ...olderNativeModule.spec.eventEmitters,
    ],
  };

  const difference = codegenTypeDiffing.compareTypes(
    newType,
    olderNativeModule.moduleName === newerNativeModule.moduleName
      ? oldType
      : null,
    newerNativeModule.aliasMap,
    olderNativeModule.aliasMap,
    newerNativeModule.enumMap,
    olderNativeModule.enumMap,
  );

  localAssessComparison(
    nativeModuleName,
    newType,
    oldType,
    difference,
    // Since we are explicitly checking the native module, we know it is starting as fromNative
    'fromNative',
  );

  const typeUpdate = {
    newTypes,
    deprecatedTypes,
    incompatibleChanges,
    objectTypeChanges,
  };
  if (hasCodegenUpdatesTypes(typeUpdate)) {
    moduleErrors.add({
      nativeSpecName: nativeModuleName,
      omitted: false,
      errorCode: 'incompatibleTypes',
      changeInformation: typeUpdate,
    });
  }

  return moduleErrors;
}

function buildNativeComponentsDiff(
  newerNativeSchema: ComponentSchema,
  olderNativeSchema: ComponentSchema,
): Set<NativeSpecErrorStore> {
  const componentErrors = new Set<NativeSpecErrorStore>();

  Object.entries(newerNativeSchema.components).forEach(
    ([newerComponentName, newerComponent]) => {
      const olderComponent = olderNativeSchema.components[newerComponentName];

      const newTypes = new Set<{
        typeInformation: CompleteTypeAnnotation,
        typeName: string,
        ...
      }>();
      const deprecatedTypes = new Set<{
        typeInformation: CompleteTypeAnnotation,
        typeName: string,
        ...
      }>();
      const incompatibleChanges = new Set<ErrorStore>();
      const objectTypeChanges = new Set<ObjectTypeChangeStore>();
      const localAssessComparison = assessComparisonResult(
        newTypes,
        deprecatedTypes,
        incompatibleChanges,
        objectTypeChanges,
      );

      /* Commands */
      // We are intentionally allowing new commands to be added
      // even though they could result in an OTA issue if the command
      // is called immediately and the native side throws on unrecognized
      // commands. There is no way to do feature detection of commands
      // today to protect against that.
      // We are choosing to allow this change to be made since we previously
      // had no protection for commands at all.
      // See https://fb.workplace.com/groups/615693552291894/posts/1905124013348835
      // for more information.
      newerComponent.commands.forEach(command => {
        const oldCommand = olderComponent.commands?.find(
          olderCommand => olderCommand.name === command.name,
        );

        const newCommands: CompleteTypeAnnotation = {
          type: 'ObjectTypeAnnotation',
          properties: [command],
        };
        const oldCommands: ?CompleteTypeAnnotation =
          oldCommand != null
            ? {
                type: 'ObjectTypeAnnotation',
                properties: [oldCommand],
              }
            : null;

        const difference = codegenTypeDiffing.compareTypes(
          newCommands,
          oldCommands,
          {},
          {},
          {},
          {},
        );

        localAssessComparison(
          newerComponentName,
          newCommands,
          oldCommands,
          difference,
          // Since we are explicitly checking the native module, we know it is starting as fromNative
          'fromNative',
        );
      });

      olderComponent.commands?.forEach(command => {
        const newCommand = newerComponent.commands.find(
          newerCommand => newerCommand.name === command.name,
        );

        if (newCommand == null) {
          deprecatedTypes.add({
            typeName: command.name,
            typeInformation: {
              type: 'ObjectTypeAnnotation',
              properties: [command],
            },
          });
        }
      });
      /* End Commands */

      // We have to do this to remove the .defaults from the props and get it into
      // standard JavaScript shapes.
      const newConvertedProps: CompleteTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        properties: newerComponent.props.map(prop => ({
          name: prop.name,
          optional: prop.optional,
          typeAnnotation: convertPropToBasicTypes(prop.typeAnnotation),
        })),
      };
      const oldConvertedProps: CompleteTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        properties: olderComponent.props.map(prop => ({
          name: prop.name,
          optional: prop.optional,
          typeAnnotation: convertPropToBasicTypes(prop.typeAnnotation),
        })),
      };

      const propDifference = codegenTypeDiffing.compareTypes(
        newConvertedProps,
        oldConvertedProps,
        {},
        {},
        {},
        {},
      );

      localAssessComparison(
        newerComponentName,
        newConvertedProps,
        oldConvertedProps,
        propDifference,
        'toNative',
      );

      const typeUpdate = {
        newTypes,
        deprecatedTypes,
        incompatibleChanges,
        objectTypeChanges,
      };
      if (hasCodegenUpdatesTypes(typeUpdate)) {
        componentErrors.add({
          nativeSpecName: newerComponentName,
          omitted: false,
          errorCode: 'incompatibleTypes',
          changeInformation: typeUpdate,
        });
      }
    },
  );

  Object.keys(olderNativeSchema.components).forEach(olderComponentName => {
    const newerComponent = newerNativeSchema.components[olderComponentName];

    if (newerComponent == null) {
      // Component is missing in new schema
      componentErrors.add({
        nativeSpecName: olderComponentName,
        omitted: true,
        errorCode: 'removedComponent',
      });
    }
  });

  return componentErrors;
}

export function hasUpdatesTypes(diff: DiffSet): boolean {
  return (
    diff.newTypes.size > 0 ||
    diff.deprecatedTypes.size > 0 ||
    diff.objectTypeChanges.size > 0 ||
    diff.incompatibleChanges.size > 0
  );
}

export function hasCodegenUpdatesTypes(diff: DiffSet): boolean {
  return (
    diff.newTypes.size > 0 ||
    diff.deprecatedTypes.size > 0 ||
    diff.objectTypeChanges.size > 0 ||
    diff.incompatibleChanges.size > 0
  );
}

export function buildSchemaDiff(
  newerSchemaSet: SchemaType,
  olderSchemaSet: SchemaType,
): Set<SchemaDiff> {
  const diff: Set<SchemaDiff> = new Set();
  const newerSchema = newerSchemaSet.modules;
  const olderSchema = olderSchemaSet.modules;

  Object.keys(newerSchema).forEach(hasteModuleName => {
    const schemaEntry = newerSchema[hasteModuleName];
    const olderSchemaEntry = olderSchema[hasteModuleName];
    const framework = 'ReactNative';

    if (schemaEntry.type === 'Component') {
      if (olderSchemaEntry?.type === 'Component') {
        const incompatibleComponents = buildNativeComponentsDiff(
          schemaEntry,
          olderSchemaEntry,
        );
        const hasIncompatibleComponents = incompatibleComponents?.size > 0;
        if (hasIncompatibleComponents) {
          diff.add({
            name: hasteModuleName,
            framework: framework,
            status: {
              incompatibleSpecs: incompatibleComponents,
            },
          });
        }
      }
    }

    if (schemaEntry.type === 'NativeModule') {
      if (olderSchemaEntry?.type === 'NativeModule') {
        // Both native modules
        const incompatibleModules = buildNativeModulesDiff(
          schemaEntry,
          olderSchemaEntry,
        );

        const hasIncompatibleModules =
          incompatibleModules != null && incompatibleModules.size;

        if (hasIncompatibleModules) {
          diff.add({
            name: hasteModuleName,
            framework: framework,
            status: {
              incompatibleSpecs: incompatibleModules,
            },
          });
        }
      }
    }

    if (olderSchemaEntry == null) {
      diff.add({
        name: hasteModuleName,
        framework: framework,
        status: 'new',
      });
    }
  });

  Object.keys(olderSchema).forEach(hasteModuleName => {
    const newSchemaEntry = newerSchema[hasteModuleName];
    const oldSchemaEntry = olderSchema[hasteModuleName];
    const framework = 'ReactNative';

    if (oldSchemaEntry != null && newSchemaEntry == null) {
      diff.add({
        name: hasteModuleName,
        framework: framework,
        status: 'deprecated',
      });
    }
  });

  return diff;
}

function summarizeSchemaDiff(diff: SchemaDiff): DiffSummary {
  switch (diff.status) {
    case 'new':
      return {status: 'patchable', incompatibilityReport: {}};
    case 'deprecated':
      // TODO add check that a component can be removed
      return {status: 'ok', incompatibilityReport: {}};
    default:
      // differs case
      const differs = diff.status;
      if (!differs.incompatibleSpecs) {
        return {status: 'patchable', incompatibilityReport: {}};
      } else {
        const incompatibleObject: IncompatiblityReport = {};
        if (differs.incompatibleSpecs) {
          const withErrors = Array.from(differs.incompatibleSpecs).filter(
            specError =>
              specError.errorInformation ||
              (specError.changeInformation &&
                specError.changeInformation.incompatibleChanges.size > 0),
          );
          if (withErrors.length > 0) {
            if (incompatibleObject[diff.name]) {
              incompatibleObject[diff.name].incompatibleSpecs = withErrors;
            } else {
              incompatibleObject[diff.name] = {
                framework: diff.framework,
                incompatibleSpecs: withErrors,
              };
            }
          }
        }
        const incompatibleUnchanged =
          Object.keys(incompatibleObject).length === 0;
        return {
          status: incompatibleUnchanged ? 'ok' : 'incompatible',
          incompatibilityReport: incompatibleObject,
        };
      }
  }
}

function combineSummaries(
  finalSummary: DiffSummary,
  setSummary: DiffSummary,
): DiffSummary {
  switch (setSummary.status) {
    case 'ok':
      return finalSummary;
    case 'patchable':
      if (finalSummary.status === 'ok') {
        return setSummary;
      } else {
        return finalSummary;
      }
    default:
      switch (finalSummary.status) {
        case 'ok':
        case 'patchable':
          return setSummary;
        default:
          Object.keys(setSummary.incompatibilityReport).forEach(
            differingSchemaName =>
              (finalSummary.incompatibilityReport[differingSchemaName] =
                setSummary.incompatibilityReport[differingSchemaName]),
          );
          return finalSummary;
      }
  }
}

export function summarizeDiffSet(diffs: Set<SchemaDiff>): DiffSummary {
  if (diffs.size === 0) {
    return {status: 'ok', incompatibilityReport: {}};
  }
  const summary: Array<DiffSummary> = [];
  diffs.forEach(schemaDiff => summary.push(summarizeSchemaDiff(schemaDiff)));
  return summary.reduce(combineSummaries, summary[0]);
}
