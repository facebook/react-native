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

import type {
  Int32,
  Float,
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from '../../../../Libraries/Types/CodegenTypes';
import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

type OnChangeEvent = $ReadOnly<{|
  value: boolean,
  source?: string,
  progress: ?Int32,
  scale?: ?Float,
|}>;

type OnEventDirect = $ReadOnly<{|
  value: boolean,
|}>;

type OnOrientationChangeEvent = $ReadOnly<{|
  orientation: 'landscape' | 'portrait',
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,

  // Events
  onChange?: ?BubblingEventHandler<OnChangeEvent, 'paperDirectName'>,
  onEventDirect?: ?DirectEventHandler<OnEventDirect>,
  onEventDirectWithPaperName?: ?DirectEventHandler<
    OnEventDirect,
    'paperDirectName',
  >,
  onOrientationChange?: ?DirectEventHandler<
    OnOrientationChangeEvent,
    'paperBubblingName',
  >,
  onEnd?: ?BubblingEventHandler<null>,
  onEventBubblingWithPaperName?: ?BubblingEventHandler<
    null,
    'paperBubblingName',
  >,
|}>;

export default codegenNativeComponent<NativeProps>('EventPropsNativeComponent');
