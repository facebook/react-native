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
  file: ?string,
  lineNumber: ?number,
  methodName: string,
  collapse?: boolean,
|};

export type ExceptionData = {
  message: string,
  originalMessage: ?string,
  name: ?string,
  componentStack: ?string,
  stack: Array<StackFrame>,
  id: number,
  isFatal: boolean,
  // flowlint-next-line unclear-type:off
  extraData?: Object,
<<<<<<< HEAD
=======
  ...
>>>>>>> fb/0.62-stable
};

export interface Spec extends TurboModule {
  // Deprecated: Use `reportException`
  +reportFatalException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // Deprecated: Use `reportException`
  +reportSoftException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // TODO(T53311281): This is a noop on iOS now. Implement it.
  +reportException?: (data: ExceptionData) => void;
  +updateExceptionMessage: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // TODO(T53311281): This is a noop on iOS now. Implement it.
  +dismissRedbox?: () => void;
}

const Platform = require('../Utilities/Platform');

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>(
  'ExceptionsManager',
);

const ExceptionsManager = {
  reportFatalException(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.reportFatalException(message, stack, exceptionId);
  },
  reportSoftException(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.reportSoftException(message, stack, exceptionId);
  },
  updateExceptionMessage(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.updateExceptionMessage(message, stack, exceptionId);
  },
  dismissRedbox(): void {
<<<<<<< HEAD
    if (
      Platform.OS !== 'ios' &&
      Platform.OS !== 'macos' /* TODO(macOS ISS#2323203) */ &&
      NativeModule.dismissRedbox
    ) {
=======
    if (Platform.OS !== 'ios' && NativeModule.dismissRedbox) {
>>>>>>> fb/0.62-stable
      // TODO(T53311281): This is a noop on iOS now. Implement it.
      NativeModule.dismissRedbox();
    }
  },
  reportException(data: ExceptionData): void {
<<<<<<< HEAD
    if (
      Platform.OS !== 'ios' &&
      Platform.OS !== 'macos' /* TODO(macOS ISS#2323203) */ &&
      NativeModule.reportException
    ) {
      // TODO(T53311281): This is a noop on iOS now. Implement it.
=======
    if (NativeModule.reportException) {
>>>>>>> fb/0.62-stable
      NativeModule.reportException(data);
      return;
    }
    if (data.isFatal) {
      ExceptionsManager.reportFatalException(data.message, data.stack, data.id);
    } else {
      ExceptionsManager.reportSoftException(data.message, data.stack, data.id);
    }
  },
};

export default ExceptionsManager;
