/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @nolint
 */

// TODO (bvaughn) Remove this file once flowtype/flow-typed/pull/773 is merged

type $npm$propTypes$ReactPropsCheckType = (
  props: any,
  propName: string,
  componentName: string,
  href?: string
) => ?Error;

declare module 'prop-types' {
  declare var array: React$PropType$Primitive<Array<any>>;
  declare var bool: React$PropType$Primitive<boolean>;
  declare var func: React$PropType$Primitive<Function>;
  declare var number: React$PropType$Primitive<number>;
  declare var object: React$PropType$Primitive<Object>;
  declare var string: React$PropType$Primitive<string>;
  declare var any: React$PropType$Primitive<any>;
  declare var arrayOf: React$PropType$ArrayOf;
  declare var element: React$PropType$Primitive<any>; /* TODO */
  declare var instanceOf: React$PropType$InstanceOf;
  declare var node: React$PropType$Primitive<any>; /* TODO */
  declare var objectOf: React$PropType$ObjectOf;
  declare var oneOf: React$PropType$OneOf;
  declare var oneOfType: React$PropType$OneOfType;
  declare var shape: React$PropType$Shape;

  declare function checkPropTypes<V>(
    propTypes: $Subtype<{[_: $Keys<V>]: $npm$propTypes$ReactPropsCheckType}>,
    values: V,
    location: string,
    componentName: string,
    getStack: ?(() => ?string)
  ) : void;
}
