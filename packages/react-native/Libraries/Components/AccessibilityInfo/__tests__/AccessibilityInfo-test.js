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
const mockNativeAccessibilityManagerDefault: {
  getCurrentPrefersCrossFadeTransitionsState: JestMockFn<
    [
      onSuccess: (prefersCrossFadeTransitions: boolean) => void,
      onError: (error: Error) => void,
    ],
    void,
  > | null,
} = {
  getCurrentPrefersCrossFadeTransitionsState:
    mockGetCurrentPrefersCrossFadeTransitionsState,
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

  afterEach(() => {
    mockNativeAccessibilityManagerDefault.getCurrentPrefersCrossFadeTransitionsState =
      mockGetCurrentPrefersCrossFadeTransitionsState;
    /* $FlowFixMe[incompatible-type] */
    Platform.OS = originalPlatform;
  });
});
