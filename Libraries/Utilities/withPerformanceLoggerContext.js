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

export type PerformanceLoggerContextProps = {
  scopedPerformanceLogger: IPerformanceLogger,
};

/**
 * If you already have one React Context on your component, you can't use
 * PerformanceLoggerContext without a consumer for it. This function helps to
 * do that. Here's how to use it:
 * 1) Intersect Props of your component with PerformanceLoggerContextProps.
 * 2) Call this function with Props and RequiredProps of your component.
 *    You can figure out RequiredProps as $Diff<Props, DefaultProps>.
 */
function withPerformanceLoggerContext<
  TProps: PerformanceLoggerContextProps,
  TRequiredProps: PerformanceLoggerContextProps,
>(
  Component: React.ComponentType<TProps>,
): React.ComponentType<$Diff<TRequiredProps, PerformanceLoggerContextProps>> {
  return class WrappedComponent extends React.Component<
    $Diff<TProps, PerformanceLoggerContextProps>,
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
