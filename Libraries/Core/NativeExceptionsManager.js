/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

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
  +dismissRedbox?: () => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ExceptionsManager');
