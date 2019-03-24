/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow local-strict
 * @format
 */

const React = require('React');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

import type {Layout} from 'CoreEventTypes';

export type LayoutContext = $ReadOnly<{|
  layout: Layout,
  safeAreaInsets: $ReadOnly<{|
    top: number,
    right: number,
    bottom: number,
    left: number,
  |}>,
|}>;

/**
 * Context used to provide layout metrics from the root view the component
 * tree is being rendered in. This is useful when sync measurements are
 * required.
 */
const Context: React.Context<LayoutContext> = React.createContext({
  layout: {x: 0, y: 0, width: 0, height: 0},
  safeAreaInsets: {top: 0, right: 0, bottom: 0, left: 0},
});

type Props = {|
  children: React.Node,
  initialLayoutContext: LayoutContext,
  rootTag: number,
|};

function RootViewLayoutManager({
  children,
  initialLayoutContext,
  rootTag,
}: Props) {
  const [layoutContext, setLayoutContext] = React.useState<LayoutContext>(
    initialLayoutContext,
  );
  React.useLayoutEffect(() => {
    const subscription = RCTDeviceEventEmitter.addListener(
      'didUpdateLayoutContext',
      event => {
        if (rootTag === event.rootTag) {
          setLayoutContext(event.layoutContext);
        }
      },
    );
    return () => {
      subscription.remove();
    };
  }, [rootTag]);

  return <Context.Provider value={layoutContext}>{children}</Context.Provider>;
}

module.exports = {
  Context,
  Manager: RootViewLayoutManager,
};
