/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export type StackFrame = {|
  column: ?number,
  file: string,
  lineNumber: number,
  methodName: string,
|};

export interface Spec extends TurboModule {
  +reportFatalException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  +reportSoftException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  +updateExceptionMessage: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // Android only
  +dismissRedbox: () => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ExceptionsManager');
