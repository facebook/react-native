/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

'use strict';

const React = require('react');
const LogBoxContainer = require('../LogBoxContainer').default;
const LogBoxLog = require('../../Data/LogBoxLog').default;
const render = require('../../../../jest/renderer');

describe('LogBoxContainer', () => {
  it('should render null with no logs', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={-1}
        logs={new Set()}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null with no selected log and disabled', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        isDisabled
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={-1}
        logs={
          new Set([
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest warning notification', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={-1}
        logs={
          new Set([
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message (latest)',
                substitutions: [],
              },
              [],
              'Some kind of message (latest)',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest error notification', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={-1}
        logs={
          new Set([
            new LogBoxLog(
              'error',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
            new LogBoxLog(
              'error',
              {
                content: 'Some kind of message (latest)',
                substitutions: [],
              },
              [],
              'Some kind of message (latest)',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render both an error and warning notification', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={-1}
        logs={
          new Set([
            new LogBoxLog(
              'warn',
              {
                content: 'Some kind of message',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
            new LogBoxLog(
              'error',
              {
                content: 'Some kind of message (latest)',
                substitutions: [],
              },
              [],
              'Some kind of message (latest)',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render selected fatal error even when disabled', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        isDisabled
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={0}
        logs={
          new Set([
            new LogBoxLog(
              'fatal',
              {
                content: 'Should be selected',
                substitutions: [],
              },
              [],
              'Some kind of message',
              [],
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render selected syntax error even when disabled', () => {
    const output = render.shallowRender(
      <LogBoxContainer
        isDisabled
        onDismiss={() => {}}
        onDismissWarns={() => {}}
        onDismissErrors={() => {}}
        setSelectedLog={() => {}}
        selectedLogIndex={0}
        logs={
          new Set([
            new LogBoxLog(
              'syntax',
              {
                content: 'Should be selected',
                substitutions: [],
              },
              [],
              'Some kind of syntax error message',
              [],
              {
                fileName:
                  '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
                location: {row: 199, column: 0},
                content: `  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
              },
            ),
          ])
        }
      />,
    );

    expect(output).toMatchSnapshot();
  });
});
