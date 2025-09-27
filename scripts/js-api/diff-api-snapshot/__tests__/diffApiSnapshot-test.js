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
      declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      declare const DeletedExport: string;
      export {
        AccessibilityActionEvent, // 00000001
        AccessibilityInfo, // 00000002
        DeletedExport, // 00000003
      }
    `;
    const newSnapshot = `
      import * as React from 'react';
      declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      export {
        AccessibilityActionEvent, // 00000001
        AccessibilityInfo, // 00000002
      }
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
      export declare const Foo: string;
      export {
        AccessibilityActionEvent, // 00000001
        Foo, // 00000002
      }
    `;
    const newSnapshot = `
      import * as React from 'react';
      export declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      export declare const Foo: number;
      export {
        AccessibilityActionEvent, // 00000001
        Foo, // 00000003
      }
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.BREAKING);
    expect(res.changedApis).toEqual(['Foo']);
  });

  test('should detect potentially not breaking change when a statement is added', () => {
    const prevSnapshot = `
      import * as React from 'react';
      declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      export {
        AccessibilityActionEvent, // 00000001
        AccessibilityInfo, // 00000002
      }
    `;
    const newSnapshot = `
      import * as React from 'react';
      declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      declare const AccessibilityInfo: typeof AccessibilityInfo_2;
      declare const NewExport: string; // New export added
      export {
        AccessibilityActionEvent, // 00000001
        AccessibilityInfo, // 00000002
        NewExport, // 00000003
      }
    `;

    const res = diffApiSnapshot(prevSnapshot, newSnapshot);
    expect(res.result).toBe(Result.POTENTIALLY_NON_BREAKING);
    expect(res.changedApis).toEqual(['NewExport']);
  });

  test('should detect not breaking change when nothing is changed', () => {
    const prevSnapshot = `
      import * as React from 'react';
      declare type AccessibilityActionEvent = NativeSyntheticEvent<
        Readonly<{
          actionName: string;
        }>
      >;
      declare const AccessibilityInfo: typeof AccessibilityInfo_2;

      export {
        AccessibilityActionEvent, // 00000001
        AccessibilityInfo, // 00000002
      }
    `;

    const res = diffApiSnapshot(prevSnapshot, prevSnapshot);
    expect(res.result).toBe(Result.NON_BREAKING);
    expect(res.changedApis).toEqual([]);
  });
});
