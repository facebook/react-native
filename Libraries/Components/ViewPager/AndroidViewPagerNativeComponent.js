/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const requireNativeComponent = require('requireNativeComponent');

import type {SyntheticEvent} from 'CoreEventTypes';
import type {NativeComponent} from 'ReactNative';
import type {Node} from 'React';
import type {ViewStyleProp} from 'StyleSheet';

type PageScrollState = 'idle' | 'dragging' | 'settling';

type PageScrollEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
    offset: number,
  |}>,
>;

type PageScrollStateChangedEvent = SyntheticEvent<
  $ReadOnly<{|
    pageScrollState: PageScrollState,
  |}>,
>;

type PageSelectedEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
  |}>,
>;

type NativeProps = $ReadOnly<{|
  /**
   * Index of initial page that should be selected. Use `setPage` method to
   * update the page, and `onPageSelected` to monitor page changes
   */
  initialPage?: ?number,

  /**
   * Executed when transitioning between pages (ether because of animation for
   * the requested page change or when user is swiping/dragging between pages)
   * The `event.nativeEvent` object for this callback will carry following data:
   *  - position - index of first page from the left that is currently visible
   *  - offset - value from range [0,1) describing stage between page transitions.
   *    Value x means that (1 - x) fraction of the page at "position" index is
   *    visible, and x fraction of the next page is visible.
   */
  onPageScroll?: ?(e: PageScrollEvent) => void,

  /**
   * Function called when the page scrolling state has changed.
   * The page scrolling state can be in 3 states:
   * - idle, meaning there is no interaction with the page scroller happening at the time
   * - dragging, meaning there is currently an interaction with the page scroller
   * - settling, meaning that there was an interaction with the page scroller, and the
   *   page scroller is now finishing it's closing or opening animation
   */
  onPageScrollStateChanged?: ?(e: PageScrollStateChangedEvent) => void,

  /**
   * This callback will be called once ViewPager finish navigating to selected page
   * (when user swipes between pages). The `event.nativeEvent` object passed to this
   * callback will have following fields:
   *  - position - index of page that has been selected
   */
  onPageSelected?: ?(e: PageSelectedEvent) => void,

  /**
   * Blank space to show between pages. This is only visible while scrolling, pages are still
   * edge-to-edge.
   */
  pageMargin?: ?number,

  /**
   * Whether enable showing peekFraction or not. If this is true, the preview of
   * last and next page will show in current screen. Defaults to false.
   */

  peekEnabled?: ?boolean,

  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default), drags do not dismiss the keyboard.
   *   - 'on-drag', the keyboard is dismissed when a drag begins.
   */
  keyboardDismissMode?: ?('none' | 'on-drag'),

  /**
   * When false, the content does not scroll.
   * The default value is true.
   */
  scrollEnabled?: ?boolean,

  children?: Node,

  style?: ?ViewStyleProp,
|}>;

type ViewPagerNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'AndroidViewPager',
): any): ViewPagerNativeType);
