/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
import {EmitterSubscription} from '../../vendor/emitter/EventEmitter';

type AccessibilityChangeEventName =
  | 'change' // deprecated, maps to screenReaderChanged
  | 'boldTextChanged' // iOS-only Event
  | 'grayscaleChanged' // iOS-only Event
  | 'invertColorsChanged' // iOS-only Event
  | 'reduceMotionChanged'
  | 'screenReaderChanged'
  | 'reduceTransparencyChanged'; // iOS-only Event

type AccessibilityChangeEvent = boolean;

type AccessibilityChangeEventHandler = (
  event: AccessibilityChangeEvent,
) => void;

type AccessibilityAnnouncementEventName = 'announcementFinished'; // iOS-only Event

type AccessibilityAnnouncementFinishedEvent = {
  announcement: string;
  success: boolean;
};

type AccessibilityAnnouncementFinishedEventHandler = (
  event: AccessibilityAnnouncementFinishedEvent,
) => void;

type AccessibilityEventTypes = 'click' | 'focus';

/**
 * @see https://reactnative.dev/docs/accessibilityinfo
 */
export interface AccessibilityInfoStatic {
  /**
   * Query whether bold text is currently enabled.
   *
   * @platform ios
   */
  isBoldTextEnabled: () => Promise<boolean>;

  /**
   * Query whether grayscale is currently enabled.
   *
   * @platform ios
   */
  isGrayscaleEnabled: () => Promise<boolean>;

  /**
   * Query whether invert colors is currently enabled.
   *
   * @platform ios
   */
  isInvertColorsEnabled: () => Promise<boolean>;

  /**
   * Query whether reduce motion is currently enabled.
   */
  isReduceMotionEnabled: () => Promise<boolean>;

  /**
   * Query whether reduce transparency is currently enabled.
   *
   * @platform ios
   */
  isReduceTransparencyEnabled: () => Promise<boolean>;

  /**
   * Query whether a screen reader is currently enabled.
   */
  isScreenReaderEnabled: () => Promise<boolean>;

  /**
   * Add an event handler. Supported events:
   * - announcementFinished: iOS-only event. Fires when the screen reader has finished making an announcement.
   *                         The argument to the event handler is a dictionary with these keys:
   *                          - announcement: The string announced by the screen reader.
   *                          - success: A boolean indicating whether the announcement was successfully made.
   * - AccessibilityEventName constants other than announcementFinished: Fires on accessibility feature change.
   *            The argument to the event handler is a boolean.
   *            The boolean is true when the related event's feature is enabled and false otherwise.
   *
   */
  addEventListener(
    eventName: AccessibilityChangeEventName,
    handler: AccessibilityChangeEventHandler,
  ): EmitterSubscription;
  addEventListener(
    eventName: AccessibilityAnnouncementEventName,
    handler: AccessibilityAnnouncementFinishedEventHandler,
  ): EmitterSubscription;

  /**
   * Set accessibility focus to a react component.
   */
  setAccessibilityFocus: (reactTag: number) => void;

  /**
   * Post a string to be announced by the screen reader.
   */
  announceForAccessibility: (announcement: string) => void;

  /**
   * Gets the timeout in millisecond that the user needs.
   * This value is set in "Time to take action (Accessibility timeout)" of "Accessibility" settings.
   *
   * @platform android
   */
  getRecommendedTimeoutMillis: (originalTimeout: number) => Promise<number>;
  sendAccessibilityEvent: (
    handle: React.ElementRef<HostComponent<unknown>>,
    eventType: AccessibilityEventTypes,
  ) => void;
}

export const AccessibilityInfo: AccessibilityInfoStatic;
export type AccessibilityInfo = AccessibilityInfoStatic;
