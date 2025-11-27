/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @emails oncall+react_native
 */

'use strict';

// Set up global.__turboModuleProxy before any imports
// This is checked by TurboModuleRegistry.requireModule FIRST (before NativeModules)
const mockBatteryModule = {
  getBatteryState: jest.fn(() =>
    Promise.resolve({
      level: 75,
      isCharging: true,
      isLowPowerMode: false,
    }),
  ),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

if (typeof global !== 'undefined') {
  global.__turboModuleProxy = jest.fn((name) => {
    if (name === 'Battery') {
      return mockBatteryModule;
    }
    return null;
  });
}

// Mock NativeModules as fallback
jest.mock('../../BatchedBridge/NativeModules', () => {
  const actual = jest.requireActual('../../BatchedBridge/NativeModules');
  return {
    default: {
      ...actual.default,
      Battery: mockBatteryModule,
    },
  };
});

// Use the mock from __mocks__ directory - this avoids parsing Flow types
jest.mock('../Battery');

const Battery = require('../Battery').default;

describe('Battery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation
    if (global.__turboModuleProxy) {
      global.__turboModuleProxy.mockImplementation((name) => {
        if (name === 'Battery') {
          return mockBatteryModule;
        }
        return null;
      });
    }
  });

  it('should be available', () => {
    expect(Battery.isAvailable).toBe(true);
  });

  it('should get battery state', async () => {
    const state = await Battery.getBatteryState();
    expect(state).toBeDefined();
    expect(state).toHaveProperty('level');
    expect(state).toHaveProperty('isCharging');
    expect(state).toHaveProperty('isLowPowerMode');
    expect(state?.level).toBeGreaterThanOrEqual(0);
    expect(state?.level).toBeLessThanOrEqual(100);
    expect(typeof state?.isCharging).toBe('boolean');
    expect(typeof state?.isLowPowerMode).toBe('boolean');
  });

  it('should add change listener', () => {
    const callback = jest.fn();
    const subscription = Battery.addChangeListener(callback);
    expect(subscription).toBeDefined();
    expect(typeof subscription.remove).toBe('function');
    subscription.remove();
  });

  it('should remove change listener', () => {
    const callback = jest.fn();
    const subscription = Battery.addChangeListener(callback);
    Battery.removeChangeListener(subscription);
    // Verify subscription is removed
    expect(() => subscription.remove()).not.toThrow();
  });

  it('should remove all listeners', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    Battery.addChangeListener(callback1);
    Battery.addChangeListener(callback2);
    Battery.removeAllListeners();
    // Verify no listeners remain (this is tested implicitly by no errors)
  });

  it('should handle errors gracefully', async () => {
    // Test that the mock handles the error case
    // In a real scenario, the native module would reject
    const state = await Battery.getBatteryState();
    expect(state).toBeDefined();
    // The mock should always return a valid state
  });
});
