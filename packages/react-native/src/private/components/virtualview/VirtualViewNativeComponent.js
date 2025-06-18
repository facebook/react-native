/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {
  DirectEventHandler,
  Double,
  Int32,
} from '../../../../Libraries/Types/CodegenTypes';
import type {HostComponent} from '../../types/HostComponent';

import codegenNativeComponent from '../../../../Libraries/Utilities/codegenNativeComponent';

export type NativeModeChangeEvent = $ReadOnly<{
  /**
   * Virtualization mode of the target view.
   *
   * - `0`: Target view is visible. (default)
   * - `1`: Target view is hidden, but can be prerendered.
   * - `2`: Target view is hidden.
   *
   * WORKAROUND: As of this writing, codegen doesn't support enums, so we need
   * to convert `number` into an enum in `VirtualView`.
   */
  mode: Int32,

  /**
   * Rect of the target view, relative to the nearest ancestor scroll container.
   */
  targetRect: $ReadOnly<{
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  }>,

  /**
   * Rect of the threshold that determines the mode of the target view, relative
   * to the nearest ancestor scroll container.
   *
   * - `Visible`: Rect in which the target view is visible.
   * - `Prerender`: Rect in which the target view is prerendered.
   * - `Hidden`: Unused, without any guarantees.
   *
   * This can be used to determine whether and how much new content to render.
   */
  thresholdRect: $ReadOnly<{
    x: Double,
    y: Double,
    width: Double,
    height: Double,
  }>,
}>;

type VirtualViewNativeProps = $ReadOnly<{
  ...ViewProps,

  // Whether the initial mode should be `Hidden`.
  initialHidden?: boolean,

  // Events
  onModeChange?: ?DirectEventHandler<NativeModeChangeEvent>,
}>;

export default codegenNativeComponent<VirtualViewNativeProps>('VirtualView', {
  interfaceOnly: true,
}) as HostComponent<VirtualViewNativeProps>;
