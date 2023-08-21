/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type SuccessResult<Props: {...} | void = {}> = {
  status: 'success',
  ...Props,
};

type ErrorResult<ErrorT = mixed> = {
  status: 'error',
  error: ErrorT,
};

type CodedErrorResult<ErrorCode: string> = {
  status: 'coded_error',
  errorCode: ErrorCode,
  errorDetails?: string,
};

export type ReportableEvent =
  | {
      type: 'launch_debugger_frontend',
      ...
        | SuccessResult<{appId: string}>
        | ErrorResult<mixed>
        | CodedErrorResult<'MISSING_APP_ID' | 'NO_APPS_FOUND'>,
    }
  | {
      type: 'connect_debugger_frontend',
      ...SuccessResult<void> | ErrorResult<mixed>,
    };

/**
 * A simple interface for logging events, to be implemented by integrators of
 * `dev-middleware`.
 *
 * This is an unstable API with no semver guarantees.
 */
export interface EventReporter {
  logEvent(event: ReportableEvent): void;
}
