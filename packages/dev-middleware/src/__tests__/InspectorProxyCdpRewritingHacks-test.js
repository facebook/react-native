/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {allowSelfSignedCertsInNodeFetch} from './FetchUtils';
import {
  createAndConnectTarget,
  parseJsonFromDataUri,
  sendFromDebuggerToTarget,
  sendFromTargetToDebugger,
} from './InspectorProtocolUtils';
import {withAbortSignalForEachTest} from './ResourceUtils';
import {
  serveStaticJson,
  serveStaticText,
  withServerForEachTest,
} from './ServerUtils';
import {createHash} from 'crypto';
import fs from 'fs';
import path from 'path';

const fsPromise = fs.promises;

// WebSocket is unreliable when using fake timers.
jest.useRealTimers();

jest.setTimeout(10000);

beforeAll(() => {
  // inspector-proxy uses node-fetch for source map fetching.
  allowSelfSignedCertsInNodeFetch();

  jest.resetModules();
});

describe.each(['HTTP', 'HTTPS'])(
  'inspector proxy CDP rewriting hacks over %s',
  protocol => {
    const serverRef = withServerForEachTest({
      logger: undefined,
      projectRoot: __dirname,
      secure: protocol === 'HTTPS',
    });
    const autoCleanup = withAbortSignalForEachTest();
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('source map fetching in Debugger.scriptParsed', async () => {
      serverRef.app.use(
        '/source-map',
        serveStaticJson({
          version: 3,
          // Mojibake insurance.
          file: '\u2757.js',
        }),
      );
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL: `${serverRef.serverBaseUrl}/source-map`,
            },
          },
        );
        expect(
          parseJsonFromDataUri(scriptParsedMessage.params.sourceMapURL),
        ).toEqual({version: 3, file: '\u2757.js'});
      } finally {
        device.close();
        debugger_.close();
      }
    });

    test('handling of failure to fetch source map', async () => {
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              sourceMapURL: `${serverRef.serverBaseUrl}/source-map-missing`,
            },
          },
        );

        // We don't rewrite the message in this case.
        expect(scriptParsedMessage.params.sourceMapURL).toEqual(
          `${serverRef.serverBaseUrl}/source-map-missing`,
        );

        // We send an error through to the debugger as a console message.
        expect(debugger_.handle).toBeCalledWith(
          expect.objectContaining({
            method: 'Runtime.consoleAPICalled',
            params: {
              args: [
                {
                  type: 'string',
                  value: expect.stringMatching('Failed to fetch source map'),
                },
              ],
              executionContextId: 0,
              type: 'error',
            },
          }),
        );
      } finally {
        device.close();
        debugger_.close();
      }
    });

    describe.each(['10.0.2.2', '10.0.3.2'])(
      '%s aliasing to and from localhost',
      sourceHost => {
        test('in source map fetching during Debugger.scriptParsed', async () => {
          serverRef.app.use('/source-map', serveStaticJson({version: 3}));
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          );
          try {
            const scriptParsedMessage = await sendFromTargetToDebugger(
              device,
              debugger_,
              'page1',
              {
                method: 'Debugger.scriptParsed',
                params: {
                  sourceMapURL: `${protocol.toLowerCase()}://${sourceHost}:${
                    serverRef.port
                  }/source-map`,
                },
              },
            );
            expect(
              parseJsonFromDataUri(scriptParsedMessage.params.sourceMapURL),
            ).toEqual({version: 3});
          } finally {
            device.close();
            debugger_.close();
          }
        });

        test('in Debugger.setBreakpointByUrl', async () => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          );
          try {
            const scriptParsedMessage = await sendFromTargetToDebugger(
              device,
              debugger_,
              'page1',
              {
                method: 'Debugger.scriptParsed',
                params: {
                  url: `${protocol.toLowerCase()}://${sourceHost}:${
                    serverRef.port
                  }/some/file.js`,
                },
              },
            );
            expect(scriptParsedMessage.params.url).toEqual(
              `${protocol.toLowerCase()}://localhost:${
                serverRef.port
              }/some/file.js`,
            );

            const setBreakpointByUrlMessage = await sendFromDebuggerToTarget(
              debugger_,
              device,
              'page1',
              {
                id: 100,
                method: 'Debugger.setBreakpointByUrl',
                params: {
                  lineNumber: 1,
                  url: `${protocol.toLowerCase()}://localhost:${
                    serverRef.port
                  }/some/file.js`,
                },
              },
            );
            expect(setBreakpointByUrlMessage.params.url).toEqual(
              `${protocol.toLowerCase()}://${sourceHost}:${
                serverRef.port
              }/some/file.js`,
            );

            const setBreakpointByUrlRegexMessage =
              await sendFromDebuggerToTarget(debugger_, device, 'page1', {
                id: 200,
                method: 'Debugger.setBreakpointByUrl',
                params: {
                  lineNumber: 1,
                  urlRegex: 'localhost:1000|localhost:2000',
                },
              });
            expect(setBreakpointByUrlRegexMessage.params.urlRegex).toEqual(
              `${sourceHost}:1000|${sourceHost}:2000`,
            );
          } finally {
            device.close();
            debugger_.close();
          }
        });
      },
    );

    test('rewrites alphanumeric script IDs to file:// URIs', async () => {
      const {device, debugger_} = await createAndConnectTarget(
        serverRef,
        autoCleanup.signal,
        {
          app: 'bar-app',
          id: 'page1',
          title: 'bar-title',
          vm: 'bar-vm',
        },
      );
      try {
        const scriptParsedMessage = await sendFromTargetToDebugger(
          device,
          debugger_,
          'page1',
          {
            method: 'Debugger.scriptParsed',
            params: {
              url: 'abcde12345',
            },
          },
        );
        expect(scriptParsedMessage.params.url).toBe('file://abcde12345');
      } finally {
        device.close();
        debugger_.close();
      }
    });

    describe('Debugger.getScriptSource', () => {
      test('fetches source from server', async () => {
        serverRef.app.use('/source', serveStaticText('foo'));
        const {device, debugger_} = await createAndConnectTarget(
          serverRef,
          autoCleanup.signal,
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        );
        try {
          await sendFromTargetToDebugger(device, debugger_, 'page1', {
            method: 'Debugger.scriptParsed',
            params: {
              scriptId: 'script1',
              url: `${serverRef.serverBaseUrl}/source`,
              startLine: 0,
              endLine: 0,
              startColumn: 0,
              endColumn: 0,
              hash: createHash('sha256').update('foo').digest('hex'),
            },
          });
          const response = await debugger_.sendAndGetResponse({
            id: 1,
            method: 'Debugger.getScriptSource',
            params: {
              scriptId: 'script1',
            },
          });
          expect(response.result).toEqual(
            expect.objectContaining({scriptSource: 'foo'}),
          );
          // The device does not receive the getScriptSource request, since it
          // is handled by the proxy.
          expect(device.wrappedEventParsed).not.toBeCalledWith({
            pageId: 'page1',
            wrappedEvent: expect.objectContaining({
              method: 'Debugger.getScriptSource',
            }),
          });
        } finally {
          device.close();
          debugger_.close();
        }
      });

      test('reads source from disk', async () => {
        // Should be just 'foo\n', but the newline can get mangled by the OS
        // and/or SCM, so let's read the source of truth from disk.
        const fileRealContents = await fsPromise.readFile(
          path.join(__dirname, '__fixtures__', 'mock-source-file.txt'),
          'utf8',
        );

        const {device, debugger_} = await createAndConnectTarget(
          serverRef,
          autoCleanup.signal,
          {
            app: 'bar-app',
            id: 'page1',
            title: 'bar-title',
            vm: 'bar-vm',
          },
        );
        try {
          await sendFromTargetToDebugger(device, debugger_, 'page1', {
            method: 'Debugger.scriptParsed',
            params: {
              scriptId: 'script1',
              url: '__fixtures__/mock-source-file.txt',
              startLine: 0,
              endLine: 0,
              startColumn: 0,
              endColumn: 0,
              hash: createHash('sha256').update(fileRealContents).digest('hex'),
            },
          });
          const response = await debugger_.sendAndGetResponse({
            id: 1,
            method: 'Debugger.getScriptSource',
            params: {
              scriptId: 'script1',
            },
          });
          expect(response.result).toEqual(
            expect.objectContaining({scriptSource: fileRealContents}),
          );
          // The device does not receive the getScriptSource request, since it
          // is handled by the proxy.
          expect(device.wrappedEventParsed).not.toBeCalledWith({
            pageId: 'page1',
            wrappedEvent: expect.objectContaining({
              method: 'Debugger.getScriptSource',
            }),
          });
        } finally {
          device.close();
          debugger_.close();
        }
      });

      test.each(['url', 'file'])(
        'reports %s fetch error back to debugger',
        async resourceType => {
          const {device, debugger_} = await createAndConnectTarget(
            serverRef,
            autoCleanup.signal,
            {
              app: 'bar-app',
              id: 'page1',
              title: 'bar-title',
              vm: 'bar-vm',
            },
          );
          try {
            await sendFromTargetToDebugger(device, debugger_, 'page1', {
              method: 'Debugger.scriptParsed',
              params: {
                scriptId: 'script1',
                url:
                  resourceType === 'url'
                    ? `${serverRef.serverBaseUrl}/source-missing`
                    : '__fixtures__/mock-source-file.does-not-exist',
                startLine: 0,
                endLine: 0,
                startColumn: 0,
                endColumn: 0,
                hash: createHash('sha256').update('foo').digest('hex'),
              },
            });
            const response = await debugger_.sendAndGetResponse({
              id: 1,
              method: 'Debugger.getScriptSource',
              params: {
                scriptId: 'script1',
              },
            });

            // We mark the request as failed.
            expect(response).toEqual({
              id: 1,
              result: {
                error: {
                  message: expect.stringMatching(
                    `Failed to fetch source ${resourceType}`,
                  ),
                },
              },
            });

            // We also send an error through to the debugger as a console message.
            expect(debugger_.handle).toBeCalledWith(
              expect.objectContaining({
                method: 'Runtime.consoleAPICalled',
                params: {
                  args: [
                    {
                      type: 'string',
                      value: expect.stringMatching(
                        `Failed to fetch source ${resourceType}`,
                      ),
                    },
                  ],
                  executionContextId: 0,
                  type: 'error',
                },
              }),
            );

            // The device does not receive the getScriptSource request, since it
            // is handled by the proxy.
            expect(device.wrappedEventParsed).not.toBeCalledWith({
              pageId: 'page1',
              wrappedEvent: expect.objectContaining({
                method: 'Debugger.getScriptSource',
              }),
            });
          } finally {
            device.close();
            debugger_.close();
          }
        },
      );
    });
  },
);
