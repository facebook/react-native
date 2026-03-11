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

jest.mock('../NativeAccessibilityManager', () => ({
  __esModule: true,
  default: mockNativeAccessibilityManagerDefault,
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

  afterEach(() => {
    mockNativeAccessibilityManagerDefault.getCurrentPrefersCrossFadeTransitionsState =
      mockGetCurrentPrefersCrossFadeTransitionsState;
    mockNativeAccessibilityManagerDefault.getCurrentDarkerSystemColorsState =
      mockGetCurrentDarkerSystemColorsState;
    /* $FlowFixMe[incompatible-type] */
    Platform.OS = originalPlatform;
  });
});
