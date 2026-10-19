/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import getSafeAreaContentPadding, {
  getSafeAreaContentInset,
} from '../getSafeAreaContentPadding';

const INSETS = {top: 44, right: 84, bottom: 34, left: 0};

describe('getSafeAreaContentPadding', () => {
  const I18nManager =
    require('../../../../../Libraries/ReactNative/I18nManager').default;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('pads across the scrollable axis of a vertical scroll view', () => {
    expect(getSafeAreaContentPadding(null, INSETS, false)).toEqual({
      paddingStart: 0,
      paddingEnd: 84,
    });
  });

  test('pads across the scrollable axis of a horizontal scroll view', () => {
    expect(getSafeAreaContentPadding(null, INSETS, true)).toEqual({
      paddingTop: 44,
      paddingBottom: 34,
    });
  });

  test('adds to the padding the style resolves to on each edge', () => {
    expect(
      getSafeAreaContentPadding(
        [{padding: 10}, {paddingHorizontal: 12}, {paddingRight: 20}],
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 12, paddingEnd: 104});
    expect(
      getSafeAreaContentPadding({padding: 10, paddingTop: 5}, INSETS, true),
    ).toEqual({paddingTop: 49, paddingBottom: 44});
  });

  test('prefers the logical edge the style sets', () => {
    expect(
      getSafeAreaContentPadding(
        {paddingLeft: 10, paddingStart: 30},
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 30, paddingEnd: 84});
  });

  test('resolves values that are not numbers to 0', () => {
    expect(getSafeAreaContentPadding({padding: '5%'}, INSETS, false)).toEqual({
      paddingStart: 0,
      paddingEnd: 84,
    });
  });

  test('keeps physical insets on their edge in RTL', () => {
    jest.spyOn(I18nManager, 'getConstants').mockReturnValue({
      isRTL: true,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'ar',
    });
    // The right inset lands on the leading edge, which is the start in RTL,
    // and a `paddingLeft` the style sets is swapped to the physical right.
    expect(getSafeAreaContentPadding({paddingLeft: 10}, INSETS, false)).toEqual(
      {paddingStart: 94, paddingEnd: 0},
    );
  });
});

describe('getSafeAreaContentInset', () => {
  test('cancels the insets across the scrollable axis of a vertical scroll view', () => {
    expect(getSafeAreaContentInset(null, INSETS, false)).toEqual({
      left: 0,
      right: -84,
    });
  });

  test('cancels the insets across the scrollable axis of a horizontal scroll view', () => {
    expect(getSafeAreaContentInset(null, INSETS, true)).toEqual({
      top: -44,
      bottom: -34,
    });
  });

  test('keeps the caller contentInset on every edge', () => {
    expect(
      getSafeAreaContentInset(
        {top: 10, right: 20, bottom: 30, left: 40},
        INSETS,
        false,
      ),
    ).toEqual({top: 10, right: -64, bottom: 30, left: 40});
  });
});
