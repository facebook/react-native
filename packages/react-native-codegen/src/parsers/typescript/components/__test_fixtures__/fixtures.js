/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @lint-ignore-every LICENSELINT
 */

'use strict';

const EVENT_DEFINITION = `
  boolean_required: boolean;
  boolean_optional_key?: boolean;
  boolean_optional_value: boolean | null | void;
  boolean_optional_both?: boolean | null | void;

  string_required: string;
  string_optional_key?: string;
  string_optional_value: string | null | void;
  string_optional_both?: string | null | void;

  double_required: Double;
  double_optional_key?: Double;
  double_optional_value: Double | null | void;
  double_optional_both?: Double | null | void;

  float_required: Float;
  float_optional_key?: Float;
  float_optional_value: Float | null | void;
  float_optional_both?: Float | null | void;

  int32_required: Int32;
  int32_optional_key?: Int32;
  int32_optional_value: Int32 | null | void;
  int32_optional_both?: Int32 | null | void;

  enum_required: 'small' | 'large';
  enum_optional_key?: 'small' | 'large';
  enum_optional_value: ('small' | 'large') | null | void;
  enum_optional_both?: ('small' | 'large') | null | void;

  object_required: {
    boolean_required: boolean;
  };

  object_optional_key?: {
    string_optional_key?: string;
  };

  object_optional_value: {
    float_optional_value: Float | null | void;
  } | null | void;

  object_optional_both?: {
    int32_optional_both?: Int32 | null | void;
  } | null | void;

  object_required_nested_2_layers: {
    object_optional_nested_1_layer?: {
      boolean_required: Int32;
      string_optional_key?: string;
      double_optional_value: Double | null | void;
      float_optional_value: Float | null | void;
      int32_optional_both?: Int32 | null | void;
    } | null | void;
  };

  object_readonly_required: Readonly<{
    boolean_required: boolean;
  }>;

  object_readonly_optional_key?: Readonly<{
    string_optional_key?: string;
  }>;

  object_readonly_optional_value: Readonly<{
    float_optional_value: Float | null | void;
  }> | null | void;

  object_readonly_optional_both?: Readonly<{
    int32_optional_both?: Int32 | null | void;
  }> | null | void;
`;

const ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import type {
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export interface ModuleProps extends ViewProps {
  // Props
  boolean_default_true_optional_both?: WithDefault<boolean, true>;

  // Events
  onDirectEventDefinedInlineNull: DirectEventHandler<null>;
  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>;
}

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  paperComponentName: 'RCTModule',
}) as HostComponent<ModuleProps>;
`;

const ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS_NO_CAST = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  // Props
  boolean_default_true_optional_both?: WithDefault<boolean, true>;

  // Events
  onDirectEventDefinedInlineNull: DirectEventHandler<null>;
  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>;
}

export default codegenNativeComponent<ModuleProps>('Module', {
  interfaceOnly: true,
  excludedPlatforms: ['android'],
  paperComponentName: 'RCTModule',
}) as HostComponent<ModuleProps>;
`;

const NO_PROPS_EVENTS_ONLY_DEPRECATED_VIEW_CONFIG_NAME_OPTION = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {

}

export default codegenNativeComponent<ModuleProps>('Module', {
  deprecatedViewConfigName: 'DeprecateModuleName',
}) as HostComponent<ModuleProps>;
`;

const ALL_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float, WithDefault} from 'CodegenTypes';
import type {ImageSource} from 'ImageSource';
import type {
  ColorValue,
  ColorArrayValue,
  PointValue,
  EdgeInsetsValue,
} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  // Props
  // Boolean props
  boolean_required: boolean;
  boolean_optional_key?: WithDefault<boolean, true>;
  boolean_optional_both?: WithDefault<boolean, true>;

  // Boolean props, null default
  boolean_null_optional_key?: WithDefault<boolean, null>;
  boolean_null_optional_both?: WithDefault<boolean, null>;

  // String props
  string_required: string;
  string_optional_key?: WithDefault<string, ''>;
  string_optional_both?: WithDefault<string, ''>;

  // String props, null default
  string_null_optional_key?: WithDefault<string, null>;
  string_null_optional_both?: WithDefault<string, null>;

  // Stringish props
  stringish_required: Stringish;
  stringish_optional_key?: WithDefault<Stringish, ''>;
  stringish_optional_both?: WithDefault<Stringish, ''>;

  // Stringish props, null default
  stringish_null_optional_key?: WithDefault<Stringish, null>;
  stringish_null_optional_both?: WithDefault<Stringish, null>;

  // Double props
  double_required: Double;
  double_optional_key?: WithDefault<Double, 1.1>;
  double_optional_both?: WithDefault<Double, 1.1>;

  // Float props
  float_required: Float;
  float_optional_key?: WithDefault<Float, 1.1>;
  float_optional_both?: WithDefault<Float, 1.1>;

  // Float props, null default
  float_null_optional_key?: WithDefault<Float, null>;
  float_null_optional_both?: WithDefault<Float, null>;

  // Int32 props
  int32_required: Int32;
  int32_optional_key?: WithDefault<Int32, 1>;
  int32_optional_both?: WithDefault<Int32, 1>;

  // String enum props
  enum_optional_key?: WithDefault<'small' | 'large', 'small'>;
  enum_optional_both?: WithDefault<'small' | 'large', 'small'>;

  // Int enum props
  int_enum_optional_key?: WithDefault<0 | 1, 0>;

  // Object props
  object_optional_key?: Readonly<{prop: string}>;
  object_optional_both?: Readonly<{prop: string} | null | void>;
  object_optional_value: Readonly<{prop: string} | null | void>;

  // ImageSource props
  image_required: ImageSource;
  image_optional_value: ImageSource | null | void;
  image_optional_both?: ImageSource | null | void;

  // ColorValue props
  color_required: ColorValue;
  color_optional_key?: ColorValue;
  color_optional_value: ColorValue | null | void;
  color_optional_both?: ColorValue | null | void;

  // ColorArrayValue props
  color_array_required: ColorArrayValue;
  color_array_optional_key?: ColorArrayValue;
  color_array_optional_value: ColorArrayValue | null | void;
  color_array_optional_both?: ColorArrayValue | null | void;

  // ProcessedColorValue props
  processed_color_required: ProcessedColorValue;
  processed_color_optional_key?: ProcessedColorValue;
  processed_color_optional_value: ProcessedColorValue | null | void;
  processed_color_optional_both?: ProcessedColorValue | null | void;

  // PointValue props
  point_required: PointValue;
  point_optional_key?: PointValue;
  point_optional_value: PointValue | null | void;
  point_optional_both?: PointValue | null | void;

  // EdgeInsets props
  insets_required: EdgeInsetsValue;
  insets_optional_key?: EdgeInsetsValue;
  insets_optional_value: EdgeInsetsValue | null | void;
  insets_optional_both?: EdgeInsetsValue | null | void;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const ARRAY_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float, WithDefault} from 'CodegenTypes';
import type {ImageSource} from 'ImageSource';
import type {
  ColorValue,
  ColorArrayValue,
  PointValue,
  EdgeInsetsValue,
} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

type ObjectType = Readonly<{prop: string}>;
type ArrayObjectType = ReadonlyArray<Readonly<{prop: string}>>;

export interface ModuleProps extends ViewProps {
  // Props
  // Boolean props
  array_boolean_required: ReadonlyArray<boolean>;
  array_boolean_optional_key?: ReadonlyArray<boolean>;
  array_boolean_optional_value: ReadonlyArray<boolean> | null | void;
  array_boolean_optional_both?: ReadonlyArray<boolean> | null | void;

  // String props
  array_string_required: ReadonlyArray<string>;
  array_string_optional_key?: ReadonlyArray<string>;
  array_string_optional_value: ReadonlyArray<string> | null | void;
  array_string_optional_both?: ReadonlyArray<string> | null | void;

  // Double props
  array_double_required: ReadonlyArray<Double>;
  array_double_optional_key?: ReadonlyArray<Double>;
  array_double_optional_value: ReadonlyArray<Double> | null | void;
  array_double_optional_both?: ReadonlyArray<Double> | null | void;

  // Float props
  array_float_required: ReadonlyArray<Float>;
  array_float_optional_key?: ReadonlyArray<Float>;
  array_float_optional_value: ReadonlyArray<Float> | null | void;
  array_float_optional_both?: ReadonlyArray<Float> | null | void;

  // Int32 props
  array_int32_required: ReadonlyArray<Int32>;
  array_int32_optional_key?: ReadonlyArray<Int32>;
  array_int32_optional_value: ReadonlyArray<Int32> | null | void;
  array_int32_optional_both?: ReadonlyArray<Int32> | null | void;

  // String enum props
  array_enum_optional_key?: WithDefault<
    ReadonlyArray<'small' | 'large'>,
    'small'
  >;
  array_enum_optional_both?: WithDefault<
    ReadonlyArray<'small' | 'large'>,
    'small'
  >;

  // ImageSource props
  array_image_required: ReadonlyArray<ImageSource>;
  array_image_optional_key?: ReadonlyArray<ImageSource>;
  array_image_optional_value: ReadonlyArray<ImageSource> | null | void;
  array_image_optional_both?: ReadonlyArray<ImageSource> | null | void;

  // ColorValue props
  array_color_required: ReadonlyArray<ColorValue>;
  array_color_optional_key?: ReadonlyArray<ColorValue>;
  array_color_optional_value: ReadonlyArray<ColorValue> | null | void;
  array_color_optional_both?: ReadonlyArray<ColorValue> | null | void;

  // PointValue props
  array_point_required: ReadonlyArray<PointValue>;
  array_point_optional_key?: ReadonlyArray<PointValue>;
  array_point_optional_value: ReadonlyArray<PointValue> | null | void;
  array_point_optional_both?: ReadonlyArray<PointValue> | null | void;

  // EdgeInsetsValue props
  array_insets_required: ReadonlyArray<EdgeInsetsValue>;
  array_insets_optional_key?: ReadonlyArray<EdgeInsetsValue>;
  array_insets_optional_value: ReadonlyArray<EdgeInsetsValue> | null | void;
  array_insets_optional_both?: ReadonlyArray<EdgeInsetsValue> | null | void;

  // Object props
  array_object_required: ReadonlyArray<Readonly<{prop: string}>>;
  array_object_optional_key?: ReadonlyArray<Readonly<{prop: string}>>;
  array_object_optional_value: ArrayObjectType | null | void;
  array_object_optional_both?: ReadonlyArray<ObjectType> | null | void;

  // Nested array object types
  array_of_array_object_required: ReadonlyArray<
    Readonly<{
      // This needs to be the same name as the top level array above
      array_object_required: ReadonlyArray<Readonly<{prop: string}>>;
    }>
  >;
  array_of_array_object_optional_key?: ReadonlyArray<
    Readonly<{
      // This needs to be the same name as the top level array above
      array_object_optional_key: ReadonlyArray<Readonly<{prop?: string}>>;
    }>
  >;
  array_of_array_object_optional_value: ReadonlyArray<
    Readonly<{
      // This needs to be the same name as the top level array above
      array_object_optional_value: ReadonlyArray<
        Readonly<{prop: string | null | void}>
      >;
    }>
  > | null | void;
  array_of_array_object_optional_both?: ReadonlyArray<
    Readonly<{
      // This needs to be the same name as the top level array above
      array_object_optional_both: ReadonlyArray<
        Readonly<{prop?: string | null | void}>
      >;
    }>
  > | null | void;

  // Nested array of array of object types
  array_of_array_of_object_required: ReadonlyArray<
    ReadonlyArray<
      Readonly<{
        prop: string;
      }>
    >
  >;

  // Nested array of array of object types (in file)
  array_of_array_of_object_required_in_file: ReadonlyArray<
    ReadonlyArray<ObjectType>
  >;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const OBJECT_PROP_TYPES_NO_EVENTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32, Double, Float, WithDefault} from 'CodegenTypes';
import type {ImageSource} from 'ImageSource';
import type {
  ColorValue,
  ColorArrayValue,
  PointValue,
  EdgeInsetsValue,
} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  // Props
  // Boolean props
  boolean_required: Readonly<{prop: boolean}>;
  boolean_optional: Readonly<{prop?: WithDefault<boolean, false>}>;

  // String props
  string_required: Readonly<{prop: string}>;
  string_optional: Readonly<{prop?: WithDefault<string, ''>}>;

  // Double props
  double_required: Readonly<{prop: Double}>;
  double_optional: Readonly<{prop?: WithDefault<Double, 0.0>}>;

  // Float props
  float_required: Readonly<{prop: Float}>;
  float_optional: Readonly<{prop?: WithDefault<Float, 0.0>}>;

  // Int32 props
  int_required: Readonly<{prop: Int32}>;
  int_optional: Readonly<{prop?: WithDefault<Int32, 0>}>;

  // String enum props
  enum_optional: Readonly<{
    prop?: WithDefault<ReadonlyArray<'small' | 'large'>, 'small'>;
  }>;

  // ImageSource props
  image_required: Readonly<{prop: ImageSource}>;
  image_optional_key: Readonly<{prop?: ImageSource}>;
  image_optional_value: Readonly<{prop: ImageSource | null | void}>;
  image_optional_both: Readonly<{prop?: ImageSource | null | void}>;

  // ColorValue props
  color_required: Readonly<{prop: ColorValue}>;
  color_optional_key: Readonly<{prop?: ColorValue}>;
  color_optional_value: Readonly<{prop: ColorValue | null | void}>;
  color_optional_both: Readonly<{prop?: ColorValue | null | void}>;

  // ProcessedColorValue props
  processed_color_required: Readonly<{prop: ProcessedColorValue}>;
  processed_color_optional_key: Readonly<{prop?: ProcessedColorValue}>;
  processed_color_optional_value: Readonly<{
    prop: ProcessedColorValue | null | void;
  }>;
  processed_color_optional_both: Readonly<{
    prop?: ProcessedColorValue | null | void;
  }>;

  // PointValue props
  point_required: Readonly<{prop: PointValue}>;
  point_optional_key: Readonly<{prop?: PointValue}>;
  point_optional_value: Readonly<{prop: PointValue | null | void}>;
  point_optional_both: Readonly<{prop?: PointValue | null | void}>;

  // EdgeInsetsValue props
  insets_required: Readonly<{prop: EdgeInsetsValue}>;
  insets_optional_key: Readonly<{prop?: EdgeInsetsValue}>;
  insets_optional_value: Readonly<{prop: EdgeInsetsValue | null | void}>;
  insets_optional_both: Readonly<{prop?: EdgeInsetsValue | null | void}>;

  // Nested object props
  object_required: Readonly<{prop: Readonly<{nestedProp: string}>}>;
  object_optional_key?: Readonly<{prop: Readonly<{nestedProp: string}>}>;
  object_optional_value: Readonly<{
    prop: Readonly<{nestedProp: string}>;
  }> | null | void;
  object_optional_both?: Readonly<{
    prop: Readonly<{nestedProp: string}>;
  }> | null | void;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_ALIASED_LOCALLY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

type DeepSpread = Readonly<{
  otherStringProp: string;
}>;

export interface PropsInFile extends DeepSpread {
  isEnabled: boolean;
  label: string;
}

type ReadOnlyPropsInFile = Readonly<PropsInFile>;

export interface ModuleProps extends ViewProps, ReadOnlyPropsInFile {
  localType: ReadOnlyPropsInFile;
  localArr: ReadonlyArray<ReadOnlyPropsInFile>;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const EVENTS_DEFINED_INLINE_WITH_ALL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {HostComponent} from 'react-native';
const codegenNativeComponent = require('codegenNativeComponent');

import type {
  Int32,
  Double,
  Float,
  BubblingEventHandler,
  DirectEventHandler,
} from 'CodegenTypes';

import type {ViewProps} from 'ViewPropTypes';

export interface ModuleProps extends ViewProps {
  // No Props

  // Events
  onDirectEventDefinedInline: DirectEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  >;

  onDirectEventDefinedInlineOptionalKey?: DirectEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  >;

  onDirectEventDefinedInlineOptionalValue: DirectEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  > | null | void;

  onDirectEventDefinedInlineOptionalBoth?: DirectEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  > | null | void;

  onDirectEventDefinedInlineWithPaperName?: DirectEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>,
    'paperDirectEventDefinedInlineWithPaperName'
  > | null | void;

  onBubblingEventDefinedInline: BubblingEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  >;

  onBubblingEventDefinedInlineOptionalKey?: BubblingEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  >;

  onBubblingEventDefinedInlineOptionalValue: BubblingEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  > | null | void;

  onBubblingEventDefinedInlineOptionalBoth?: BubblingEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>
  > | null | void;

  onBubblingEventDefinedInlineWithPaperName?: BubblingEventHandler<
    Readonly<{
      ${EVENT_DEFINITION}
    }>,
    'paperBubblingEventDefinedInlineWithPaperName'
  > | null | void;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const EVENTS_DEFINED_AS_NULL_INLINE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {BubblingEventHandler, DirectEventHandler} from 'CodegenTypese';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export interface ModuleProps extends ViewProps {
  // No props

  // Events defined inline
  onDirectEventDefinedInlineNull: DirectEventHandler<null>;
  onDirectEventDefinedInlineNullOptionalKey?: DirectEventHandler<null>;
  onDirectEventDefinedInlineNullOptionalValue: DirectEventHandler<null> | null | void;
  onDirectEventDefinedInlineNullOptionalBoth?: DirectEventHandler<null>;
  onDirectEventDefinedInlineNullWithPaperName?: DirectEventHandler<
    null,
    'paperDirectEventDefinedInlineNullWithPaperName'
  > | null | void;

  onBubblingEventDefinedInlineNull: BubblingEventHandler<null>;
  onBubblingEventDefinedInlineNullOptionalKey?: BubblingEventHandler<null>;
  onBubblingEventDefinedInlineNullOptionalValue: BubblingEventHandler<null> | null | void;
  onBubblingEventDefinedInlineNullOptionalBoth?: BubblingEventHandler<null> | null | void;
  onBubblingEventDefinedInlineNullWithPaperName?: BubblingEventHandler<
    null,
    'paperBubblingEventDefinedInlineNullWithPaperName'
  > | null | void;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_AND_EVENTS_TYPES_EXPORTED = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';
import type {
  BubblingEventHandler,
  DirectEventHandler,
} from 'CodegenTypes';

export type EventInFile = Readonly<{
  ${EVENT_DEFINITION}
}>;

export interface ModuleProps extends ViewProps {
  // No props

  // Events defined inline
  onBubblingEventDefinedInline: BubblingEventHandler<EventInFile>;
  onBubblingEventDefinedInlineWithPaperName: BubblingEventHandler<
    EventInFile,
    'paperBubblingEventDefinedInlineWithPaperName'
  >;
  onDirectEventDefinedInline: DirectEventHandler<EventInFile>;
  onDirectEventDefinedInlineWithPaperName: DirectEventHandler<
    EventInFile,
    'paperDirectEventDefinedInlineWithPaperName'
  >;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_AS_EXTERNAL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeComponent = require('codegenNativeComponent');

import type {HostComponent} from 'react-native';

export type String = string;
export type AnotherArray = ReadonlyArray<String>;

export interface ModuleProps {
  disable: String;
  array: AnotherArray;
}

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITH_ALL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

 const codegenNativeCommands = require('codegenNativeCommands');
 const codegenNativeComponent = require('codegenNativeComponent');

 import type {Int32, Double, Float} from 'CodegenTypes';
 import type {RootTag} from 'RCTExport';
 import type {ViewProps} from 'ViewPropTypes';
 import type {HostComponent} from 'react-native';


export interface ModuleProps extends ViewProps {
  // No props or events
}

type NativeType = HostComponent<ModuleProps>;

 interface NativeCommands {
   readonly handleRootTag: (viewRef: React.ElementRef<NativeType>, rootTag: RootTag) => void;
   readonly hotspotUpdate: (viewRef: React.ElementRef<NativeType>, x: Int32, y: Int32) => void;
   readonly scrollTo: (
     viewRef: React.ElementRef<NativeType>,
     x: Float,
     y: Int32,
     z: Double,
     animated: boolean,
   ) => void;
 }

 export const Commands = codegenNativeCommands<NativeCommands>({
   supportedCommands: ['handleRootTag', 'hotspotUpdate', 'scrollTo'],
 });

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

const COMMANDS_WITH_EXTERNAL_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export type Boolean = boolean;
export type Int = Int32;
export type Void = void;

export interface ModuleProps extends ViewProps {
  // No props or events
}

type NativeType = HostComponent<ModuleProps>;

export type ScrollTo = (
  viewRef: React.ElementRef<NativeType>,
  y: Int,
  animated: Boolean,
) => Void;

interface NativeCommands {
  readonly scrollTo: ScrollTo;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo'],
});

export default codegenNativeComponent<ModuleProps>('Module') as NativeType;

`;

const COMMANDS_AND_EVENTS_TYPES_EXPORTED = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {
  BubblingEventHandler,
  DirectEventHandler,
} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type EventInFile = Readonly<{
  ${EVENT_DEFINITION}
}>;

export type Boolean = boolean;
export type Int = Int32;
export type Void = void;

export interface ModuleProps extends ViewProps {
  // No props

  // Events defined inline
  onBubblingEventDefinedInline: BubblingEventHandler<EventInFile>,
  onBubblingEventDefinedInlineWithPaperName: BubblingEventHandler<EventInFile, 'paperBubblingEventDefinedInlineWithPaperName'>,
  onDirectEventDefinedInline: DirectEventHandler<EventInFile>,
  onDirectEventDefinedInlineWithPaperName: DirectEventHandler<EventInFile, 'paperDirectEventDefinedInlineWithPaperName'>,
}

type NativeType = HostComponent<ModuleProps>;

export type ScrollTo = (viewRef: React.ElementRef<NativeType>, y: Int, animated: Boolean) => Void;

interface NativeCommands {
  readonly scrollTo: ScrollTo;
}

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo']
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as NativeType;
`;

module.exports = {
  ALL_PROP_TYPES_NO_EVENTS,
  ARRAY_PROP_TYPES_NO_EVENTS,
  OBJECT_PROP_TYPES_NO_EVENTS,
  PROPS_ALIASED_LOCALLY,
  ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS,
  ONE_OF_EACH_PROP_EVENT_DEFAULT_AND_OPTIONS_NO_CAST,
  NO_PROPS_EVENTS_ONLY_DEPRECATED_VIEW_CONFIG_NAME_OPTION,
  EVENTS_DEFINED_INLINE_WITH_ALL_TYPES,
  EVENTS_DEFINED_AS_NULL_INLINE,
  PROPS_AND_EVENTS_TYPES_EXPORTED,
  COMMANDS_AND_EVENTS_TYPES_EXPORTED,
  COMMANDS_DEFINED_WITH_ALL_TYPES,
  PROPS_AS_EXTERNAL_TYPES,
  COMMANDS_WITH_EXTERNAL_TYPES,
};
