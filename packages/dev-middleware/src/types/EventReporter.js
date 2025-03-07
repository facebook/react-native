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

type ErrorResult<ErrorT = mixed, Props: {...} | void = {}> = {
  status: 'error',
  error: ErrorT,
  prefersFuseboxFrontend?: ?boolean,
  ...Props,
};

type CodedErrorResult<ErrorCode: string> = {
  status: 'coded_error',
  errorCode: ErrorCode,
  errorDetails?: string,
};

export type DebuggerSessionIDs = {
  appId: string | null,
  deviceName: string | null,
  deviceId: string | null,
  pageId: string | null,
};

export type ReportableEvent =
  | {
      type: 'launch_debugger_frontend',
      launchType: 'launch' | 'redirect',
      ...
        | SuccessResult<{
            targetDescription: string,
            prefersFuseboxFrontend: boolean,
            ...DebuggerSessionIDs,
          }>
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
        | ErrorResult<mixed, DebuggerSessionIDs>,
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
      prefersFuseboxFrontend: boolean | null,
      ...
        | SuccessResult<void>
        | CodedErrorResult<
            | 'TIMED_OUT'
            | 'DEVICE_DISCONNECTED'
            | 'DEBUGGER_DISCONNECTED'
            | 'UNMATCHED_REQUEST_ID'
            | 'PROTOCOL_ERROR',
          >,
    }
  | {
      type: 'profiling_target_registered',
      status: 'success',
      ...DebuggerSessionIDs,
    }
  | {
      type: 'fusebox_console_notice',
    }
  | {
      type: 'proxy_error',
      status: 'error',
      messageOrigin: 'debugger' | 'device',
      message: string,
      error: string,
      errorStack: string,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'debugger_heartbeat' | 'device_heartbeat',
      duration: number,
      isIdle: boolean,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'debugger_timeout' | 'device_timeout',
      duration: number,
      isIdle: boolean,
      ...DebuggerSessionIDs,
    }
  | {
      type: 'debugger_connection_closed' | 'device_connection_closed',
      code: number,
      reason: string,
      isIdle: boolean,
      ...DebuggerSessionIDs,
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
