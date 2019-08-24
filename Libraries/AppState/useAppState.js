/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import AppState from './AppState';
import {useEffect, useState} from 'react';

export default function useAppState(): string {
  const [state, setState] = useState(AppState.currentState);
  useEffect(() => {
    function handleChange(state) {
      setState(state)
    }

    AppState.addEventListener('change', handleChange)
    setState(AppState.currentState)
    return () => {
      AppState.removeEventListener('change', handleChange)
    }
  }, [])
  return state
}