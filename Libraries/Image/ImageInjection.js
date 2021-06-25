/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format strict-local
 * @flow
 */

import * as React from 'react';
import type {ImageProps as ImagePropsType} from './ImageProps';
import ImageViewNativeComponent from './ImageViewNativeComponent';
import TextInlineImageNativeComponent from './TextInlineImageNativeComponent';

export default {
  unstable_createImageComponent: (null: ?(
    Image: React.AbstractComponent<
      ImagePropsType,
      | React.ElementRef<typeof TextInlineImageNativeComponent>
      | React.ElementRef<typeof ImageViewNativeComponent>,
    >,
  ) => React.AbstractComponent<
    ImagePropsType,
    | React.ElementRef<typeof TextInlineImageNativeComponent>
    | React.ElementRef<typeof ImageViewNativeComponent>,
  >),
};
