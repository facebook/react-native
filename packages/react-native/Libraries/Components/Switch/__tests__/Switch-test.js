/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const Switch = require('../Switch').default;
const {create} = require('@react-native/jest-preset/jest/renderer');
const React = require('react');

// Jest renders the iOS branch of Switch; Switch-itest.js covers Android.
describe('Switch', () => {
  it('reflects the disabled state via accessibilityState', async () => {
    const component = await create(<Switch value={false} disabled={true} />);

    expect(component.toJSON()?.props.accessibilityState).toEqual({
      disabled: true,
    });
  });

  it('lets disabled override accessibilityState.disabled', async () => {
    const component = await create(
      <Switch
        value={false}
        disabled={false}
        accessibilityState={{disabled: true, busy: true}}
      />,
    );

    expect(component.toJSON()?.props.accessibilityState).toEqual({
      disabled: false,
      busy: true,
    });
  });

  it('does not set accessibilityState when disabled is not set', async () => {
    const component = await create(<Switch value={false} />);

    expect(component.toJSON()?.props.accessibilityState).toBeUndefined();
  });
});
