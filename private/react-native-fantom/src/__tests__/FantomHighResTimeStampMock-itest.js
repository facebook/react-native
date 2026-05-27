/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode dev
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HighResTimeStampMock} from '../HighResTimeStampMock';

import * as Fantom from '@react-native/fantom';

const pendingMocks: Set<HighResTimeStampMock> = new Set();

function installHighResTimeStampMock(): HighResTimeStampMock {
  const mock = Fantom.installHighResTimeStampMock();
  pendingMocks.add(mock);
  return mock;
}

describe('Fantom HighResTimeStamp mocks', () => {
  afterEach(() => {
    for (const mock of pendingMocks) {
      mock.uninstall();
    }
    pendingMocks.clear();
  });

  it('sets a default value', () => {
    expect(performance.now()).toBeGreaterThan(0);

    installHighResTimeStampMock();

    expect(performance.now()).toBe(0);
  });

  it('sets custom values', () => {
    const mock = installHighResTimeStampMock();

    expect(performance.now()).toBe(0);

    mock.setTime(50);

    expect(performance.now()).toBe(50);

    mock.setTime(70);

    expect(performance.now()).toBe(70);

    mock.advanceTimeBy(5);

    expect(performance.now()).toBe(75);

    mock.setTime(90);

    expect(performance.now()).toBe(90);
  });

  it('throws an error when trying to set a time in the past', () => {
    const mock = installHighResTimeStampMock();

    expect(performance.now()).toBe(0);

    mock.setTime(50);

    expect(performance.now()).toBe(50);

    expect(() => {
      mock.setTime(40);
    }).toThrow('The mocked time cannot be decreased');

    expect(performance.now()).toBe(50);

    expect(() => {
      mock.advanceTimeBy(-1);
    }).toThrow('The mocked time cannot be decreased');

    expect(performance.now()).toBe(50);
  });

  it('allows uninstalling', () => {
    expect(performance.now()).toBeGreaterThan(0);

    const mock = installHighResTimeStampMock();

    expect(performance.now()).toBe(0);

    mock.uninstall();

    expect(performance.now()).toBeGreaterThan(0);
  });

  it('does nothing when uninstalling multiple times', () => {
    expect(performance.now()).toBeGreaterThan(0);

    const mock = installHighResTimeStampMock();

    expect(performance.now()).toBe(0);

    mock.uninstall();
    mock.uninstall();
    mock.uninstall();

    expect(performance.now()).toBeGreaterThan(0);
  });

  it('throws an error when installing multiple mocks at the same time', () => {
    installHighResTimeStampMock();
    expect(() => installHighResTimeStampMock()).toThrow(
      'Cannot install HighResTimeStamp mock because there is another mock installed already. Reuse the same mock or uninstall the previous one first.',
    );
  });

  it('does not uninstall other mocks', () => {
    const initialMock = installHighResTimeStampMock();

    expect(performance.now()).toBe(0);

    initialMock.uninstall();

    expect(performance.now()).toBeGreaterThan(0);

    installHighResTimeStampMock();

    expect(performance.now()).toBe(0);

    initialMock.uninstall();

    // Has no effect on the current mock
    expect(performance.now()).toBe(0);
  });
});
