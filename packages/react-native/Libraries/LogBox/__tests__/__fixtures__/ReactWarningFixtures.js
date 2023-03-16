/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import Text from '../../../Text/Text';
import * as React from 'react';

export const DoesNotUseKey = () => {
  return (
    <>
      {['foo', 'bar'].map(item => (
        <Text>{item}</Text>
      ))}
    </>
  );
};

export const FragmentWithProp = () => {
  return (
    <React.Fragment invalid="prop">
      {['foo', 'bar'].map(item => (
        <Text key={item}>{item}</Text>
      ))}
    </React.Fragment>
  );
};
