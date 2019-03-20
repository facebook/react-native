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

describe('Geolocation', () => {
  let Geolocation;
  const NativeModules = require('NativeModules');

  beforeEach(() => {
    jest.resetModules();
    Geolocation = jest.requireActual('Geolocation');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set the location observer configuration', () => {
    Geolocation.setRNConfiguration({skipPermissionRequests: true});
    expect(
      NativeModules.LocationObserver.setConfiguration.mock.calls.length,
    ).toEqual(1);
  });

  it('should request authorization for location requests', () => {
    Geolocation.requestAuthorization();
    expect(
      NativeModules.LocationObserver.requestAuthorization.mock.calls.length,
    ).toEqual(1);
  });

  it('should get the current position and pass it to the given callback', () => {
    const callback = () => {};
    Geolocation.getCurrentPosition(callback);
    expect(
      NativeModules.LocationObserver.getCurrentPosition.mock.calls.length,
    ).toEqual(1);
    expect(
      NativeModules.LocationObserver.getCurrentPosition.mock.calls[0][1],
    ).toBe(callback);
  });

  it('should add a success listener to the geolocation', () => {
    const watchID = Geolocation.watchPosition(() => {});
    expect(watchID).toEqual(0);
    expect(NativeModules.LocationObserver.addListener.mock.calls[0][0]).toBe(
      'geolocationDidChange',
    );
  });

  it('should add an error listener to the geolocation', () => {
    const watchID = Geolocation.watchPosition(() => {}, () => {});
    expect(watchID).toEqual(0);
    expect(NativeModules.LocationObserver.addListener.mock.calls[1][0]).toBe(
      'geolocationError',
    );
  });

  it('should clear the listeners associated with a watchID', () => {
    const watchID = Geolocation.watchPosition(() => {}, () => {});
    Geolocation.clearWatch(watchID);
    expect(NativeModules.LocationObserver.stopObserving.mock.calls.length).toBe(
      1,
    );
  });

  it('should correctly assess if all listeners have been cleared', () => {
    const watchID = Geolocation.watchPosition(() => {}, () => {});
    Geolocation.watchPosition(() => {}, () => {});
    Geolocation.clearWatch(watchID);
    expect(NativeModules.LocationObserver.stopObserving.mock.calls.length).toBe(
      0,
    );
  });

  it('should not fail if the watchID one wants to clear does not exist', () => {
    Geolocation.watchPosition(() => {}, () => {});
    Geolocation.clearWatch(42);
    expect(NativeModules.LocationObserver.stopObserving.mock.calls.length).toBe(
      0,
    );
  });

  it('should stop observing and warn about removing existing subscriptions', () => {
    const warningCallback = jest.fn();
    jest.mock('fbjs/lib/warning', () => warningCallback);
    Geolocation.watchPosition(() => {}, () => {});
    Geolocation.stopObserving();
    expect(NativeModules.LocationObserver.stopObserving.mock.calls.length).toBe(
      1,
    );
    expect(warningCallback.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
