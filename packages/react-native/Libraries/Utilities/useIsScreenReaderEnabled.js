/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import AccessibilityInfo from '../Components/AccessibilityInfo/AccessibilityInfo';
import Platform from './Platform';
import {useEffect, useState} from 'react';

function getCurrentVoiceAssistantState(): boolean {
  if (Platform.OS === 'android') {
    return AccessibilityInfo.isTouchExplorationEnabled();
  } else if (Platform.OS === 'ios') {
    return AccessibilityInfo.getCurrentVoiceOverState();
  }
  return false;
}

export default function useIsScreenReaderEnabled(): boolean {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(
    getCurrentVoiceAssistantState(),
  );

  useEffect(() => {
    const currentStatus = getCurrentVoiceAssistantState();

    // Update state if current status differs from stored state
    if (currentStatus !== isScreenReaderEnabled) {
      setIsScreenReaderEnabled(currentStatus);
    }

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );

    return () => subscription.remove();
  }, [isScreenReaderEnabled]);

  return isScreenReaderEnabled;
}
