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

const React = require('React');
const PerformanceLoggerContext = require('PerformanceLoggerContext');
import type {IPerformanceLogger} from 'createPerformanceLogger';

export type PerformanceLoggerContextProps = $Exact<PerformanceLoggerContextConfig>;

type PerformanceLoggerContextConfig = {
  +scopedPerformanceLogger: IPerformanceLogger,
};

/**
 * If you already have one React Context on your component, you can't use
 * PerformanceLoggerContext without a consumer for it. This function helps to
 * do that by providing a HOC. Here's how to use it:
 * 1) Spread PerformanceLoggerContextProps into your component's Props.
 * 2) Call this function with Props and DefaultProps of your component.
 3 3) Use the returned HOC instead of your component.
 */
function withPerformanceLoggerContext<Config: PerformanceLoggerContextConfig>(
  Component: React.AbstractComponent<Config>,
): React.AbstractComponent<$Diff<Config, PerformanceLoggerContextConfig>> {
  return class WrappedComponent extends React.Component<
    $Diff<Config, PerformanceLoggerContextConfig>,
  > {
    render() {
      return (
        <PerformanceLoggerContext.Consumer>
          {scopedPerformanceLogger => (
            <Component
              {...this.props}
              scopedPerformanceLogger={scopedPerformanceLogger}
            />
          )}
        </PerformanceLoggerContext.Consumer>
      );
    }
  };
}

module.exports = withPerformanceLoggerContext;
