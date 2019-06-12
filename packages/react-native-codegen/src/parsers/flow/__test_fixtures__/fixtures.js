/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';
const EVENT_DEFINITION = `
  boolean_required: boolean,
  boolean_optional_key?: boolean,
  boolean_optional_value: ?boolean,
  boolean_optional_both?: ?boolean,

  string_required: string,
  string_optional_key?: string,
  string_optional_value: ?string,
  string_optional_both?: ?string,

  float_required: Float,
  float_optional_key?: Float,
  float_optional_value: ?Float,
  float_optional_both?: ?Float,

  int32_required: Int32,
  int32_optional_key?: Int32,
  int32_optional_value: ?Int32,
  int32_optional_both?: ?Int32,

  object_required: {
    boolean_required: boolean,
  }

  object_optional_key?: {
    string_optional_key?: string,
  }

  object_optional_value: ?{
    float_optional_value: ?Float,
  }

  object_optional_both?: ?{
    int32_optional_both?: ?Int32,
  }

  object_required_nested_2_layers: {
    object_optional_nested_1_layer?: ?{
      boolean_required: Int32,
      string_optional_key?: string,
      float_optional_value: ?Float,
      int32_optional_both?: ?Int32,
    }
  }
`;

const ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEvent,
  DirectEvent,
  WithDefault,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  boolean_default_true_optional_both?: ?WithDefault<boolean, true>,

  // Events
  onDirectEventDefinedInlineNull: (event: DirectEvent<null>) => void,
  onBubblingEventDefinedInlineNull: (event: BubblingEvent<null>) => void,
|}>;

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  isDeprecatedPaperComponentNameRCT: true,
});
`;

const ALL_PROP_TYPES_NO_EVENTS = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Int32,
  Float,
  WithDefault,
} from 'CodegenTypes';

import type {ColorValue, ColorArrayValue, PointValue} from 'StyleSheetTypes';
import type {ImageSource} from 'ImageSource';
import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  boolean_required: WithDefault<boolean, true>,
  boolean_optional_key?: WithDefault<boolean, true>,
  boolean_optional_value: ?WithDefault<boolean, true>,
  boolean_optional_both?: ?WithDefault<boolean, true>,

  // String props
  string_required: WithDefault<string, ''>,
  string_optional_key?: WithDefault<string, ''>,
  string_optional_value: ?WithDefault<string, ''>,
  string_optional_both?: ?WithDefault<string, ''>,

  // String props, null default
  string_null_required: WithDefault<string, null>,
  string_null_optional_key?: WithDefault<string, null>,
  string_null_optional_value: ?WithDefault<string, null>,
  string_null_optional_both?: ?WithDefault<string, null>,

  // Float props
  float_required: WithDefault<Float, 1.1>,
  float_optional_key?: WithDefault<Float, 1.1>,
  float_optional_value: ?WithDefault<Float, 1.1>,
  float_optional_both?: ?WithDefault<Float, 1.1>,

  // Int32 props
  int32_required: WithDefault<Int32, 1>,
  int32_optional_key?: WithDefault<Int32, 1>,
  int32_optional_value: ?WithDefault<Int32, 1>,
  int32_optional_both?: ?WithDefault<Int32, 1>,

  // String enum props
  enum_required: WithDefault<('small' | 'large'), 'small'>,
  enum_optional_key?: WithDefault<('small' | 'large'), 'small'>,
  enum_optional_value: ?WithDefault<('small' | 'large'), 'small'>,
  enum_optional_both?: ?WithDefault<('small' | 'large'), 'small'>,

  // ImageSource props
  image_required: ImageSource,
  image_optional_value: ?ImageSource,
  image_optional_both?: ?ImageSource,

  // ColorValue props
  color_required: ColorValue,
  color_optional_key?: ColorValue,
  color_optional_value: ?ColorValue,
  color_optional_both?: ?ColorValue,

  // ColorArrayValue props
  color_array_required: ColorArrayValue,
  color_array_optional_key?: ColorArrayValue,
  color_array_optional_value: ?ColorArrayValue,
  color_array_optional_both?: ?ColorArrayValue,

  // PointValue props
  point_required: PointValue,
  point_optional_key?: PointValue,
  point_optional_value: ?PointValue,
  point_optional_both?: ?PointValue,
|}>;

export default codegenNativeComponent<ModuleProps, Options>('Module');
`;

const ARRAY_PROP_TYPES_NO_EVENTS = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Int32,
  Float,
  WithDefault,
} from 'CodegenTypes';

import type {ColorValue, PointValue} from 'StyleSheetTypes';
import type {ImageSource} from 'ImageSource';
import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  // Boolean props
  array_boolean_required: $ReadOnlyArray<boolean>,
  array_boolean_optional_key?: $ReadOnlyArray<boolean>,
  array_boolean_optional_value: ?$ReadOnlyArray<boolean>,
  array_boolean_optional_both?: ?$ReadOnlyArray<boolean>,

  // String props
  array_string_required: $ReadOnlyArray<string>,
  array_string_optional_key?: $ReadOnlyArray<string>,
  array_string_optional_value: ?$ReadOnlyArray<string>,
  array_string_optional_both?: ?$ReadOnlyArray<string>,

  // Float props
  array_float_required: $ReadOnlyArray<Float>,
  array_float_optional_key?: $ReadOnlyArray<Float>,
  array_float_optional_value: ?$ReadOnlyArray<Float>,
  array_float_optional_both?: ?$ReadOnlyArray<Float>,

  // Int32 props
  array_int32_required: $ReadOnlyArray<Int32>,
  array_int32_optional_key?: $ReadOnlyArray<Int32>,
  array_int32_optional_value: ?$ReadOnlyArray<Int32>,
  array_int32_optional_both?: ?$ReadOnlyArray<Int32>,

  // String enum props
  array_enum_required: WithDefault<$ReadOnlyArray<('small' | 'large')>, 'small'>,
  array_enum_optional_key?: WithDefault<$ReadOnlyArray<('small' | 'large')>, 'small'>,
  array_enum_optional_value: ?WithDefault<$ReadOnlyArray<('small' | 'large')>, 'small'>,
  array_enum_optional_both?: ?WithDefault<$ReadOnlyArray<('small' | 'large')>, 'small'>,

  // ImageSource props
  array_image_required: $ReadOnlyArray<ImageSource>,
  array_image_optional_key?: $ReadOnlyArray<ImageSource>,
  array_image_optional_value: ?$ReadOnlyArray<ImageSource>,
  array_image_optional_both?: ?$ReadOnlyArray<ImageSource>,

  // ColorValue props
  array_color_required: $ReadOnlyArray<ColorValue>,
  array_color_optional_key?: $ReadOnlyArray<ColorValue>,
  array_color_optional_value: ?$ReadOnlyArray<ColorValue>,
  array_color_optional_both?: ?$ReadOnlyArray<ColorValue>,

  // PointValue props
  array_point_required: $ReadOnlyArray<PointValue>,
  array_point_optional_key?: $ReadOnlyArray<PointValue>,
  array_point_optional_value: ?$ReadOnlyArray<PointValue>,
  array_point_optional_both?: ?$ReadOnlyArray<PointValue>,
|}>;

export default codegenNativeComponent<ModuleProps>('Module');
`;

const EVENTS_DEFINED_INLINE_WITH_ALL_TYPES = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Int32,
  Float,
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No Props

  // Events
  onDirectEventDefinedInline: (
    event: DirectEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onDirectEventDefinedInlineOptionalKey?: (
    event: DirectEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onDirectEventDefinedInlineOptionalValue: ?(
    event: DirectEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onDirectEventDefinedInlineOptionalBoth?: ?(
    event: DirectEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onBubblingEventDefinedInline: (
    event: BubblingEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onBubblingEventDefinedInlineOptionalKey?: (
    event: BubblingEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onBubblingEventDefinedInlineOptionalValue: ?(
    event: BubblingEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,

  onBubblingEventDefinedInlineOptionalBoth?: ?(
    event: BubblingEvent<
      $ReadOnly<{|
        ${EVENT_DEFINITION}
      |}>,
    >,
  ) => void,
|}>;

export default codegenNativeComponent<ModuleProps>('Module');
`;

const EVENTS_DEFINED_IN_FILE_WITH_ALL_TYPES = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Float,
  Int32,
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

type EventInFile = $ReadOnly<{|
  ${EVENT_DEFINITION}
|}>;

type DirectEventInFile = DirectEvent<EventInFile>;
type BubblingEventInFile = BubblingEvent<EventInFile>;

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events
  // Events defined elsewhere in file

  onDirectEventDefinedInFile: (event: DirectEventInFile) => void,
  onDirectEventDefinedInFileOptionalKey?: (event: DirectEventInFile) => void,
  onDirectEventDefinedInFileOptionalValue: ?(event: DirectEventInFile) => void,
  onDirectEventDefinedInFileOptionalBoth?: ?(event: DirectEventInFile) => void,

  onBubblingEventDefinedInFile: (event: BubblingEventInFile) => void,
  onBubblingEventDefinedInFileOptionalKey?: (
    event: BubblingEventInFile,
  ) => void,
  onBubblingEventDefinedInFileOptionalValue: ?(
    event: BubblingEventInFile,
  ) => void,
  onBubblingEventDefinedInFileOptionalBoth?: ?(
    event: BubblingEventInFile,
  ) => void,
|}>;

export default codegenNativeComponent<ModuleProps>('Module');
`;

const EVENTS_DEFINED_AS_NULL_IN_FILE = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

type DirectEventDefinedInFileNull = DirectEvent<null>;
type BubblingEventDefinedInFileNull = BubblingEvent<null>;

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined elsewhere in file
  onDirectEventDefinedInFileNull: (event: DirectEventDefinedInFileNull) => void,
  onDirectEventDefinedInFileNullOptionalKey?: (
    event: DirectEventDefinedInFileNull,
  ) => void,
  onDirectEventDefinedInFileNullOptionalValue: ?(
    event: DirectEventDefinedInFileNull,
  ) => void,
  onDirectEventDefinedInFileNullOptionalBoth?: ?(
    event: DirectEventDefinedInFileNull,
  ) => void,

  onBubblingEventDefinedInFileNull: (
    event: BubblingEventDefinedInFileNull,
  ) => void,
  onBubblingEventDefinedInFileNullOptionalKey?: (
    event: BubblingEventDefinedInFileNull,
  ) => void,
  onBubblingEventDefinedInFileNullOptionalValue: ?(
    event: BubblingEventDefinedInFileNull,
  ) => void,
  onBubblingEventDefinedInFileNullOptionalBoth?: ?(
    event: BubblingEventDefinedInFileNull,
  ) => void,
|}>;


export default codegenNativeComponent<ModuleProps>('Module');
`;

const EVENTS_DEFINED_AS_NULL_INLINE = `
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

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEvent,
  DirectEvent,
} from 'CodegenTypese';

import type {ViewProps} from 'ViewPropTypes';

type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  // No props

  // Events defined inline
  onDirectEventDefinedInlineNull: (event: DirectEvent<null>) => void,
  onDirectEventDefinedInlineNullOptionalKey?: (
    event: DirectEvent<null>,
  ) => void,
  onDirectEventDefinedInlineNullOptionalValue: ?(
    event: DirectEvent<null>,
  ) => void,
  onDirectEventDefinedInlineNullOptionalBoth?: ?(
    event: DirectEvent<null>,
  ) => void,

  onBubblingEventDefinedInlineNull: (event: BubblingEvent<null>) => void,
  onBubblingEventDefinedInlineNullOptionalKey?: (
    event: BubblingEvent<null>,
  ) => void,
  onBubblingEventDefinedInlineNullOptionalValue: ?(
    event: BubblingEvent<null>,
  ) => void,
  onBubblingEventDefinedInlineNullOptionalBoth?: ?(
    event: BubblingEvent<null>,
  ) => void,
|}>;

export default codegenNativeComponent<ModuleProps>('Module');
`;

module.exports = {
  ALL_PROP_TYPES_NO_EVENTS,
  ARRAY_PROP_TYPES_NO_EVENTS,
  ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS,
  EVENTS_DEFINED_INLINE_WITH_ALL_TYPES,
  EVENTS_DEFINED_IN_FILE_WITH_ALL_TYPES,
  EVENTS_DEFINED_AS_NULL_IN_FILE,
  EVENTS_DEFINED_AS_NULL_INLINE,
};
