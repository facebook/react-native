/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {Node} from 'React';
import {Button} from 'react-native';
import React from 'react';

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = 'Crash';
exports.category = 'Basic';
exports.description = 'Crash examples.';

exports.examples = [
  {
    title: 'JS crash',
    render(): Node {
      return (
        <Button
          title="JS crash"
          onPress={() => {
            const a = {};
            // $FlowIgnore[prop-missing]
            // $FlowIgnore[incompatible-use]
            const b = a.w.q; // js crash here
            console.log(b);
          }}
        />
      );
    },
  },
];
