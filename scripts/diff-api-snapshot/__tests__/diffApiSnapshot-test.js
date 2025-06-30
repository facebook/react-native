/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

const {Result, diffApiSnapshot} = require('../diffApiSnapshot');

describe('diffApiSnapshot', () => {
  test('should detect breaking change when a statement is deleted', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      export declare const DeletedExport: string;
    `;
    const newSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.BREAKING);
    expect(res.changedApis).toEqual(['DeletedExport']);
  });

  test('should detect breaking change when a statement is changed', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
    `;
    const newSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_3; // Changed from AccessibilityInfo_2 to AccessibilityInfo_3
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.BREAKING);
    expect(res.changedApis).toEqual(['AccessibilityInfo']);
  });

  test('should detect potentially not breaking change when a statement is added', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
    `;
    const newSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      export declare const NewExport: string; // New export added
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.POTENTIALLY_NON_BREAKING);
    expect(res.changedApis).toEqual(['NewExport']);
  });

  test('should detect not breaking change when nothing is changed', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
    `;

    const res = diffApiSnapshot(prevSnapshot, prevSnapshot);
    expect(res.result).toBe(Result.NON_BREAKING);
    expect(res.changedApis).toEqual([]);
  });

  test('should handle complex type declarations', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export declare type ComplexType = {
        prop1: string;
        prop2: number;
        prop3: {
          nestedProp1: boolean;
          nestedProp2: Array<string>;
        };
      };
    `;
    const newSnapshot = `
      import * as React from 'react';
      export declare type ComplexType = {
        prop1: string;
        prop2: number;
        prop3: {
          nestedProp1: boolean;
          nestedProp2: Array<string>;
          nestedProp3: number; // Added property
        };
      };
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.BREAKING);
    expect(res.changedApis).toEqual(['ComplexType']);
  });

  test('should handle interface declarations', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export interface TestInterface {
        method1(): void;
        property1: string;
      }
    `;
    const newSnapshot = `
      import * as React from 'react';
      export interface TestInterface {
        method1(): void;
        property1: string;
        method2(): number; // Added method
      }
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.BREAKING);
    expect(res.changedApis).toEqual(['TestInterface']);
  });

  test('should handle const and type of the same name', () => {
    const prevSnapshot = `
      import * as React from 'react';
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      export declare type AccessibilityInfo = typeof AccessibilityInfo;
    `;

    const newSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityInfo = typeof AccessibilityInfo;
      export declare const AccessibilityInfo: typeof AccessibilityInfo_2;
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.NON_BREAKING);
    expect(res.changedApis).toEqual([]);
  });
});
