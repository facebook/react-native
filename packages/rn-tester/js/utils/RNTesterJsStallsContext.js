/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import React from 'react';
import type {Context, Element} from 'react';
import useJsStallsReducer from './useJsStallsReducer';

const RNTesterJsStallsContext: Context<any> = React.createContext();

const RNTesterJsStallsProvider = (props: $FlowFixMeProps): Element<any> => {
  const {
    state,
    onEnableForceJsStalls,
    onDisableForceJsStalls,
    onEnableJsStallsTracking,
    onDisableJsStallsTracking,
  } = useJsStallsReducer();
  const context = {
    state,
    onEnableForceJsStalls,
    onDisableForceJsStalls,
    onEnableJsStallsTracking,
    onDisableJsStallsTracking,
  };
  return <RNTesterJsStallsContext.Provider {...props} value={context} />;
};

export {RNTesterJsStallsContext, RNTesterJsStallsProvider};
