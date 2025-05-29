/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {HostInstance} from '../src/private/types/HostInstance';

import * as React from 'react';
import {createElement} from 'react';

let nativeTag = 1;

type MockNativeComponent<TProps: {...}> = component(
  ref?: ?React.RefSetter<HostInstance>,
  ...props: TProps
);

export default function mockNativeComponent<TProps: {...}>(
  viewName: string,
): MockNativeComponent<TProps> {
  const Component = class extends React.Component<TProps> {
    _nativeTag: number = nativeTag++;

    render(): React.Node {
      // $FlowIgnore[not-a-function]
      // $FlowIgnore[prop-missing]
      return createElement(viewName, this.props, this.props.children);
    }

    // The methods that exist on host components
    blur: () => void = jest.fn();
    focus: () => void = jest.fn();
    measure: () => void = jest.fn();
    measureInWindow: () => void = jest.fn();
    measureLayout: () => void = jest.fn();
    setNativeProps: () => void = jest.fn();
  };

  if (viewName === 'RCTView') {
    Component.displayName = 'View';
  } else {
    Component.displayName = viewName;
  }

  return Component;
}
