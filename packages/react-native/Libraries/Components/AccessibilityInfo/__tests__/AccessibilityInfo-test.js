/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

jest.unmock('../AccessibilityInfo');

const mockGetCurrentPrefersCrossFadeTransitionsState = jest.fn(
  (onSuccess, onError) => onSuccess(true),
);
const mockGetCurrentDarkerSystemColorsState = jest.fn((onSuccess, onError) =>
  onSuccess(true),
);
const mockNativeAccessibilityManagerDefault: {
  getCurrentPrefersCrossFadeTransitionsState: JestMockFn<
    [
      onSuccess: (prefersCrossFadeTransitions: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
  getCurrentDarkerSystemColorsState: JestMockFn<
    [
      onSuccess: (isDarkerSystemColorsEnabled: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
} = {
  getCurrentPrefersCrossFadeTransitionsState:
    mockGetCurrentPrefersCrossFadeTransitionsState,
  getCurrentDarkerSystemColorsState: mockGetCurrentDarkerSystemColorsState,
};

const mockIsHighTextContrastEnabled = jest.fn(onSuccess => onSuccess(true));
const mockNativeAccessibilityInfo: {
  isHighTextContrastEnabled: JestMockFn<
    [onSuccess: (isHighTextContrastEnabled: boolean) => void],
    void,
  > | null,
} = {
  isHighTextContrastEnabled: mockIsHighTextContrastEnabled,
};

jest.mock('../NativeAccessibilityManager', () => ({
  __esModule: true,
  default: mockNativeAccessibilityManagerDefault,
}));

jest.mock('../NativeAccessibilityInfo', () => ({
  __esModule: true,
  default: mockNativeAccessibilityInfo,
}));

const Platform = require('../../../Utilities/Platform').default;
const AccessibilityInfo = require('../AccessibilityInfo').default;
const invariant = require('invariant');

describe('AccessibilityInfo', () => {
  let originalPlatform;

  beforeEach(() => {
    originalPlatform = Platform.OS;
    mockGetCurrentPrefersCrossFadeTransitionsState.mockClear();
    mockGetCurrentDarkerSystemColorsState.mockClear();
    mockIsHighTextContrastEnabled.mockClear();
  });

  describe('prefersCrossFadeTransitions', () => {
    describe('Android', () => {
      it('should return immediately', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const prefersCrossFadeTransitions =
          await AccessibilityInfo.prefersCrossFadeTransitions();

        expect(prefersCrossFadeTransitions).toBe(false);
      });
    });

    describe('iOS', () => {
      it('should call getCurrentPrefersCrossFadeTransitionsState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const prefersCrossFadeTransitions =
          await AccessibilityInfo.prefersCrossFadeTransitions();

        expect(
          mockGetCurrentPrefersCrossFadeTransitionsState,
        ).toHaveBeenCalled();
        expect(prefersCrossFadeTransitions).toBe(true);
      });

      it('should throw error if getCurrentPrefersCrossFadeTransitionsState is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        mockNativeAccessibilityManagerDefault.getCurrentPrefersCrossFadeTransitionsState =
          null;

        const result: mixed =
          await AccessibilityInfo.prefersCrossFadeTransitions().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected prefersCrossFadeTransitions to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS.getCurrentPrefersCrossFadeTransitionsState is not available',
        );
      });
    });
  });

  describe('isDarkerSystemColorsEnabled', () => {
    describe('Android', () => {
      it('should return immediately', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isDarkerSystemColorsEnabled =
          await AccessibilityInfo.isDarkerSystemColorsEnabled();

        expect(isDarkerSystemColorsEnabled).toBe(false);
      });
    });

    describe('iOS', () => {
      it('should call getCurrentDarkerSystemColorsState if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isDarkerSystemColorsEnabled =
          await AccessibilityInfo.isDarkerSystemColorsEnabled();

        expect(mockGetCurrentDarkerSystemColorsState).toHaveBeenCalled();
        expect(isDarkerSystemColorsEnabled).toBe(true);
      });

      it('should throw error if getCurrentDarkerSystemColorsState is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        mockNativeAccessibilityManagerDefault.getCurrentDarkerSystemColorsState =
          null;

        const result: mixed =
          await AccessibilityInfo.isDarkerSystemColorsEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isDarkerSystemColorsEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityManagerIOS.getCurrentDarkerSystemColorsState is not available',
        );
      });
    });
  });

  describe('isHighTextContrastEnabled', () => {
    describe('Android', () => {
      it('should call isHighTextContrastEnabled if available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        const isHighTextContrastEnabled =
          await AccessibilityInfo.isHighTextContrastEnabled();

        expect(mockIsHighTextContrastEnabled).toHaveBeenCalled();
        expect(isHighTextContrastEnabled).toBe(true);
      });

      it('should throw error if isHighTextContrastEnabled is not available', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'android';

        mockNativeAccessibilityInfo.isHighTextContrastEnabled = null;

        const result: mixed =
          await AccessibilityInfo.isHighTextContrastEnabled().catch(e => e);

        invariant(
          result instanceof Error,
          'Expected isHighTextContrastEnabled to reject',
        );
        expect(result.message).toEqual(
          'NativeAccessibilityInfoAndroid.isHighTextContrastEnabled is not available',
        );
      });
    });

    describe('iOS', () => {
      it('should return false', async () => {
        /* $FlowFixMe[incompatible-type] */
        Platform.OS = 'ios';

        const isHighTextContrastEnabled =
          await AccessibilityInfo.isHighTextContrastEnabled();

        expect(isHighTextContrastEnabled).toBe(false);
      });
    });
  });

  afterEach(() => {
    mockNativeAccessibilityManagerDefault.getCurrentPrefersCrossFadeTransitionsState =
      mockGetCurrentPrefersCrossFadeTransitionsState;
    mockNativeAccessibilityManagerDefault.getCurrentDarkerSystemColorsState =
      mockGetCurrentDarkerSystemColorsState;
    mockNativeAccessibilityInfo.isHighTextContrastEnabled =
      mockIsHighTextContrastEnabled;
    /* $FlowFixMe[incompatible-type] */
    Platform.OS = originalPlatform;
  });
});
