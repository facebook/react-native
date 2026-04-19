/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_mode dev
 */

/**
 * We force the DEV mode, because React only uses console.createTask in DEV builds.
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import {View} from 'react-native';

let root;

function Node(props: {depth: number}): React.Node {
  if (props.depth === 500) {
    return <View />;
  }

  return (
    <View>
      <Node depth={props.depth + 1} />
    </View>
  );
}
function Root(props: {prop: boolean}): React.Node {
  return <Node depth={0} />;
}

Fantom.unstable_benchmark
  .suite(
    `console.createTask ${typeof console.createTask === 'function' ? 'installed' : 'removed'}`,
    {
      minIterations: 100,
      disableOptimizedBuildCheck: true,
    },
  )
  .test(
    'Rendering 1000 views',
    () => {
      let recursiveViews: React.MixedElement;
      for (let i = 0; i < 1000; ++i) {
        recursiveViews = <View>{recursiveViews}</View>;
      }

      Fantom.runTask(() => root.render(recursiveViews));
    },
    {
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    },
  )
  .test(
    'Updating a subtree of 500 nodes',
    () => {
      Fantom.runTask(() => root.render(<Root prop={false} />));
    },
    {
      beforeEach: () => {
        root = Fantom.createRoot();
        Fantom.runTask(() => root.render(<Root prop={true} />));
      },
      afterEach: () => {
        root.destroy();
      },
    },
  );
