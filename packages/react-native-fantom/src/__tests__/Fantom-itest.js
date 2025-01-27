/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import 'react-native/Libraries/Core/InitializeCore';

import type {Root} from '..';

import Fantom from '..';
import * as React from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';
import ensureInstance from 'react-native/src/private/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function getActualViewportDimensions(root: Root): {
  viewportWidth: number,
  viewportHeight: number,
} {
  let maybeNode;

  Fantom.runTask(() => {
    root.render(
      <View
        style={{width: '100%', height: '100%'}}
        ref={node => {
          maybeNode = node;
        }}
      />,
    );
  });

  const node = ensureInstance(maybeNode, ReactNativeElement);

  const rect = node.getBoundingClientRect();
  return {
    viewportWidth: rect.width,
    viewportHeight: rect.height,
  };
}

describe('Fantom', () => {
  describe('runTask', () => {
    it('should run a task synchronously', () => {
      const task = jest.fn();

      Fantom.runTask(task);

      expect(task).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should re-throw errors from the task synchronously', () => {
      expect(() => {
        Fantom.runTask(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });

    it('should exhaust the microtask queue synchronously', () => {
      const lastMicrotask = jest.fn();

      Fantom.runTask(() => {
        queueMicrotask(() => {
          queueMicrotask(() => {
            queueMicrotask(() => {
              queueMicrotask(lastMicrotask);
            });
          });
        });
      });

      expect(lastMicrotask).toHaveBeenCalledTimes(1);
    });

    // TODO: fix error handling and make this pass
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('should re-throw errors from microtasks synchronously', () => {
      expect(() => {
        Fantom.runTask(() => {
          queueMicrotask(() => {
            throw new Error('test error');
          });
        });
      }).toThrow('test error');
    });

    it('should run async tasks synchronously', () => {
      let completed = false;

      Fantom.runTask(async () => {
        await Promise.resolve(6);
        completed = true;
      });

      expect(completed).toBe(true);
    });

    // TODO: when error handling is fixed, this should verify using `toThrow`
    it('should throw when running a task inside another task', () => {
      let threw = false;

      Fantom.runTask(() => {
        // TODO replace with expect(() => { ... }).toThrow() when error handling is fixed
        try {
          Fantom.runTask(() => {});
        } catch {
          threw = true;
        }
      });
      expect(threw).toBe(true);

      threw = false;

      Fantom.runTask(() => {
        queueMicrotask(() => {
          try {
            Fantom.runTask(() => {});
          } catch {
            threw = true;
          }
        });
      });
      expect(threw).toBe(true);
    });
  });

  describe('createRoot', () => {
    it('allows creating a root with specific dimensions', () => {
      const rootWithDefaults = Fantom.createRoot();

      expect(getActualViewportDimensions(rootWithDefaults)).toEqual({
        viewportWidth: 390,
        viewportHeight: 844,
      });

      const rootWithCustomWidthAndHeight = Fantom.createRoot({
        viewportWidth: 200,
        viewportHeight: 600,
      });

      expect(getActualViewportDimensions(rootWithCustomWidthAndHeight)).toEqual(
        {
          viewportWidth: 200,
          viewportHeight: 600,
        },
      );
    });
  });

  describe('getRenderedOutput', () => {
    describe('toJSX', () => {
      it('default config', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view height="100.000000" width="100.000000" />,
        );
      });

      it('default config, list of children', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <>
              <View
                key="first"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
              <View
                key="second"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
            </>,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <>
            <rn-view key="0" width="100.000000" height="100.000000" />
            <rn-view key="1" width="100.000000" height="100.000000" />
          </>,
        );
      });

      it('include root', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(root.getRenderedOutput({includeRoot: true}).toJSX()).toEqual(
          <rn-rootView>
            <rn-view width="100.000000" height="100.000000" />
          </rn-rootView>,
        );
      });

      it('include layout metrics', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
        ).toEqual(
          <rn-view
            height="100.000000"
            layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
            layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
            layoutMetrics-displayType="Flex"
            layoutMetrics-frame="{x:0,y:0,width:100,height:100}"
            layoutMetrics-layoutDirection="LeftToRight"
            layoutMetrics-overflowInset="{top:0,right:-0,bottom:-0,left:0}"
            layoutMetrics-pointScaleFactor="3"
            width="100.000000"
          />,
        );
      });

      it('take props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['width'],
            })
            .toJSX(),
        ).toEqual(<rn-view width="100.000000" />);
      });

      it('skip props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <View style={{width: 100, height: 100}} collapsable={false} />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['!width'],
            })
            .toJSX(),
        ).toEqual(<rn-view height="100.000000" />);
      });

      it('filter out all props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <>
              <View
                key="first"
                style={{width: 100, height: 100}}
                collapsable={false}
              />
              <Text key="second">hello world!</Text>
              <View
                key="third"
                style={{width: 200, height: 300}}
                collapsable={false}
              />
            </>,
          );
        });

        expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
          <>
            <rn-view key="0" />
            <rn-paragraph key="1">hello world!</rn-paragraph>
            <rn-view key="2" />
          </>,
        );
      });
    });

    describe('toJSON', () => {
      it('nested text', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Text>
              Testing native{' '}
              <Text style={{color: 'red'}}>
                JSX is <Text style={{color: 'blue'}}>easy!</Text>
              </Text>
            </Text>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['foreground*']}).toJSON(),
        ).toEqual({
          children: [
            'Testing native ',
            {
              children: 'JSX is ',
              props: {
                foregroundColor: 'rgba(255, 0, 0, 255)',
              },
              type: 'Text',
            },
            {
              children: 'easy!',
              props: {
                foregroundColor: 'rgba(0, 0, 255, 255)',
              },
              type: 'Text',
            },
          ],
          props: {
            foregroundColor: 'rgba(255, 255, 255, 127)',
          },
          type: 'Paragraph',
        });
      });
    });
  });

  describe('runOnUIThread + dispatchNativeEvent', () => {
    it('sends event without payload', () => {
      const root = Fantom.createRoot();
      let maybeNode;

      let focusEvent = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <TextInput
            onFocus={focusEvent}
            ref={node => {
              maybeNode = node;
            }}
          />,
        );
      });

      const element = ensureInstance(maybeNode, ReactNativeElement);

      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.runOnUIThread(() => {
        Fantom.dispatchNativeEvent(element, 'focus');
      });

      // The tasks have not run.
      expect(focusEvent).toHaveBeenCalledTimes(0);

      Fantom.runWorkLoop();

      expect(focusEvent).toHaveBeenCalledTimes(1);
    });
  });

  it('sends event with payload', () => {
    const root = Fantom.createRoot();
    let maybeNode;
    const onChange = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <TextInput
          onChange={event => {
            onChange(event.nativeEvent);
          }}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'change', {
        text: 'Hello World',
      });
    });

    Fantom.runWorkLoop();

    expect(onChange).toHaveBeenCalledTimes(1);
    const [entry] = onChange.mock.lastCall;
    expect(entry.text).toEqual('Hello World');
  });

  it('it batches events with isUnique option', () => {
    const root = Fantom.createRoot();
    let maybeNode;
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'scroll', {
        contentOffset: {
          x: 0,
          y: 1,
        },
      });
      Fantom.dispatchNativeEvent(
        element,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 2,
          },
        },
        {
          isUnique: true,
        },
      );
    });

    Fantom.runWorkLoop();

    expect(onScroll).toHaveBeenCalledTimes(1);
    const [entry] = onScroll.mock.lastCall;
    expect(entry.contentOffset).toEqual({
      x: 0,
      y: 2,
    });
  });

  describe('scrollTo', () => {
    it('throws error if called on node that is not scroll view', () => {
      const root = Fantom.createRoot();
      let maybeNode;

      Fantom.runTask(() => {
        root.render(
          <View
            ref={node => {
              maybeNode = node;
            }}
          />,
        );
      });

      const element = ensureInstance(maybeNode, ReactNativeElement);

      expect(() => {
        Fantom.runOnUIThread(() => {
          Fantom.scrollTo(element, {
            x: 0,
            y: 1,
          });
        });
      }).toThrow(
        'Exception in HostFunction: scrollTo() can only be called on <ScrollView />',
      );
    });

    it('delivers onScroll event and affects position of elements on screen', () => {
      const root = Fantom.createRoot();
      let maybeScrollViewNode;
      let maybeNode;
      const onScroll = jest.fn();

      Fantom.runTask(() => {
        root.render(
          <ScrollView
            onScroll={event => {
              onScroll(event.nativeEvent);
            }}
            ref={node => {
              maybeScrollViewNode = node;
            }}>
            <View
              style={{width: 1, height: 2, top: 3}}
              ref={node => {
                maybeNode = node;
              }}
            />
          </ScrollView>,
        );
      });

      const scrollViewElement = ensureInstance(
        maybeScrollViewNode,
        ReactNativeElement,
      );

      Fantom.runOnUIThread(() => {
        Fantom.scrollTo(scrollViewElement, {
          x: 0,
          y: 1,
        });
      });

      Fantom.runWorkLoop();

      expect(onScroll).toHaveBeenCalledTimes(1);

      const viewElement = ensureInstance(maybeNode, ReactNativeElement);

      let rect;

      viewElement.measure((x, y, width, height, pageX, pageY) => {
        rect = {
          x,
          y,
          width,
          height,
          pageX,
          pageY,
        };
      });

      expect(rect).toEqual({
        x: 0,
        y: 3,
        width: 1,
        height: 2,
        pageY: 2,
        pageX: 0,
      });

      const boundingClientRect = viewElement.getBoundingClientRect();
      expect(boundingClientRect.x).toBe(0);
      expect(boundingClientRect.y).toBe(2);
      expect(boundingClientRect.width).toBe(1);
      expect(boundingClientRect.height).toBe(2);

      root.destroy();
    });
  });

  describe('flushAllNativeEvents', () => {
    it('calls events in the event queue', () => {
      const root = Fantom.createRoot();
      const onLayout = jest.fn();
      Fantom.runTask(() => {
        root.render(
          <View
            style={{width: 100, height: 100}}
            onLayout={event => {
              onLayout(event.nativeEvent);
            }}
          />,
        );
      });

      expect(onLayout).toHaveBeenCalledTimes(0);

      Fantom.flushAllNativeEvents();

      expect(onLayout).toHaveBeenCalledTimes(1);
    });
  });
});
