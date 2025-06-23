/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {RootTag} from '../Types/RootTagTypes';
import type {IPerformanceLogger} from '../Utilities/createPerformanceLogger';
import type {DisplayModeType} from './DisplayMode';

type Task = (taskData: any) => Promise<void>;
export type TaskProvider = () => Task;

export type ComponentProvider = () => React.ComponentType<any>;
export type ComponentProviderInstrumentationHook = (
  component_: ComponentProvider,
  scopedPerformanceLogger: IPerformanceLogger,
) => React.ComponentType<any>;
export type AppConfig = {
  appKey: string,
  component?: ComponentProvider,
  run?: Runnable,
  section?: boolean,
  ...
};
export type AppParameters = {
  initialProps: $ReadOnly<{[string]: mixed, ...}>,
  rootTag: RootTag,
  fabric?: boolean,
};
export type Runnable = (
  appParameters: AppParameters,
  displayMode: DisplayModeType,
) => void;
export type Runnables = {[appKey: string]: Runnable};
export type Registry = {
  sections: $ReadOnlyArray<string>,
  runnables: Runnables,
  ...
};
export type WrapperComponentProvider = (
  appParameters: Object,
) => React.ComponentType<any>;
export type RootViewStyleProvider = (appParameters: Object) => ViewStyleProp;
