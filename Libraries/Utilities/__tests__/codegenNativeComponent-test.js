/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const codegenNativeComponent = require('../codegenNativeComponent').default;
const {UIManager} = require('react-native');

// We need to unmock requireNativeComponent since it's under test.
// Instead, we mock the function it calls, createReactNativeComponentClass,
// so that we don't run into issues populating the registry with the same
// component names.
jest.unmock('../../ReactNative/requireNativeComponent');
jest.mock(
  '../../Renderer/shims/createReactNativeComponentClass',
  () => componentName => componentName,
);
jest
  .spyOn(UIManager, 'getViewManagerConfig')
  .mockImplementation(componentName =>
    componentName.includes('ComponentNameDoesNotExist') ? false : true,
  );

describe('codegenNativeComponent', () => {
  it('should require component as is ', () => {
    const component = codegenNativeComponent('ComponentName');
    expect(component).toBe('ComponentName');
  });

  it('should require paperComponentName', () => {
    const component = codegenNativeComponent('ComponentName', {
      paperComponentName: 'PaperComponentName',
    });
    expect(component).toBe('PaperComponentName');
  });

  it('should fall back to requiring the deprecated paper component name', () => {
    const component = codegenNativeComponent('ComponentNameDoesNotExist', {
      paperComponentNameDeprecated: 'ComponentName',
    });
    expect(component).toBe('ComponentName');
  });

  it('should require the new component name', () => {
    const component = codegenNativeComponent('ComponentName', {
      paperComponentNameDeprecated: 'ComponentNameDoesNotExist',
    });
    expect(component).toBe('ComponentName');
  });

  it('should throw if neither component names exist', () => {
    expect(() =>
      codegenNativeComponent('ComponentNameDoesNotExistOne', {
        paperComponentNameDeprecated: 'ComponentNameDoesNotExistTwo',
      }),
    ).toThrow(
      'Failed to find native component for either ComponentNameDoesNotExistOne or ComponentNameDoesNotExistTwo',
    );
  });
});
