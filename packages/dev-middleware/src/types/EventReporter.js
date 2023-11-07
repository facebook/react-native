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

type DebuggerSessionIDs = {
  appId: string,
  deviceName: string,
  deviceId: string,
  pageId: string | null,
};

export type ReportableEvent =
  | {
      type: 'launch_debugger_frontend',
      launchType: 'launch' | 'redirect',
      ...
        | SuccessResult<{appId: string | null, deviceId: string | null}>
        | ErrorResult<mixed>
        | CodedErrorResult<'NO_APPS_FOUND'>,
    }
  | {
      type: 'connect_debugger_frontend',
      ...
        | SuccessResult<{
            ...DebuggerSessionIDs,
            frontendUserAgent: string | null,
          }>
        | ErrorResult<mixed>,
    }
  | {
      type: 'debugger_command',
      protocol: 'CDP',
      // With some errors, the method might not be known
      method: string | null,
      requestOrigin: 'proxy' | 'debugger' | null,
      responseOrigin: 'proxy' | 'device',
      timeSinceStart: number | null,
      ...DebuggerSessionIDs,
      frontendUserAgent: string | null,
      ...
        | SuccessResult<void>
        | CodedErrorResult<
            | 'TIMED_OUT'
            | 'DEVICE_DISCONNECTED'
            | 'DEBUGGER_DISCONNECTED'
            | 'UNMATCHED_REQUEST_ID'
            | 'PROTOCOL_ERROR',
          >,
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
