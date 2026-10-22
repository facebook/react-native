/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags deferYogaChildCloningUntilLayout:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useState} from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';

// With `deferYogaChildCloningUntilLayout`, the unchanged children of a node
// that gets a new list of children stay shared with the previous revision of
// the node until Yoga lays the node out. These tests run with the flag off and
// on, and check that the mutations and layouts are the same.

const CHILD_COUNT = 50;

function rectOf(ref: {
  current: HostInstance | null,
}): [number, number, number, number] {
  const rect = nullthrows(ref.current).getBoundingClientRect();
  return [rect.x, rect.y, rect.width, rect.height];
}

type Refs = ReadonlyArray<React.RefObject<HostInstance | null>>;

function createRefs(count: number): Refs {
  return Array.from({length: count}, () => React.createRef<HostInstance>());
}

// Renders `steps` one commit at a time, then renders the last step into a
// fresh root, and checks that both roots end up with the same layout.
function expectSameLayoutAsFreshRender(
  render: (step: number, refs: Refs) => React.MixedElement,
  stepCount: number,
  refCount: number,
): void {
  const refs = createRefs(refCount);
  const root = Fantom.createRoot();
  for (let step = 0; step < stepCount; step++) {
    Fantom.runTask(() => {
      root.render(render(step, refs));
    });
  }

  const freshRefs = createRefs(refCount);
  const freshRoot = Fantom.createRoot();
  Fantom.runTask(() => {
    freshRoot.render(render(stepCount - 1, freshRefs));
  });

  expect(refs.map(rectOf)).toEqual(freshRefs.map(rectOf));

  root.destroy();
  freshRoot.destroy();
}

function Rows({
  colorIndex,
  color,
  tallIndex,
  refs,
}: {
  colorIndex: number,
  color: string,
  tallIndex: number,
  refs: ReadonlyArray<React.RefObject<HostInstance | null>>,
}): React.MixedElement {
  return (
    <View collapsable={false} nativeID="list">
      {refs.map((ref, i) => (
        <View
          key={i}
          ref={ref}
          nativeID={`row-${i}`}
          style={{
            height: i === tallIndex ? 30 : 10,
            backgroundColor: i === colorIndex ? color : 'gray',
          }}
        />
      ))}
    </View>
  );
}

describe('deferYogaChildCloningUntilLayout', () => {
  it('updates one of many children without touching the others', () => {
    const root = Fantom.createRoot();
    const refs = Array.from({length: CHILD_COUNT}, () =>
      React.createRef<HostInstance>(),
    );

    Fantom.runTask(() => {
      root.render(
        <Rows colorIndex={20} color="red" tallIndex={-1} refs={refs} />,
      );
    });
    root.takeMountingManagerLogs();

    Fantom.runTask(() => {
      root.render(
        <Rows colorIndex={20} color="blue" tallIndex={-1} refs={refs} />,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "row-20"}',
    ]);
    expect(rectOf(refs[20])).toEqual([0, 200, 390, 10]);
    expect(rectOf(refs[CHILD_COUNT - 1])).toEqual([0, 490, 390, 10]);

    root.destroy();
  });

  it('lays out shared children when a sibling changes size', () => {
    const root = Fantom.createRoot();
    const refs = Array.from({length: CHILD_COUNT}, () =>
      React.createRef<HostInstance>(),
    );

    Fantom.runTask(() => {
      root.render(
        <Rows colorIndex={20} color="red" tallIndex={-1} refs={refs} />,
      );
    });

    // Commits that change no layout input, so the list is not laid out and
    // its unchanged children stay shared.
    for (const color of ['blue', 'green', 'yellow']) {
      Fantom.runTask(() => {
        root.render(
          <Rows colorIndex={20} color={color} tallIndex={-1} refs={refs} />,
        );
      });
    }
    root.takeMountingManagerLogs();

    // Row 10 grows by 20, which moves every row after it.
    Fantom.runTask(() => {
      root.render(
        <Rows colorIndex={20} color="yellow" tallIndex={10} refs={refs} />,
      );
    });

    expect(rectOf(refs[9])).toEqual([0, 90, 390, 10]);
    expect(rectOf(refs[10])).toEqual([0, 100, 390, 30]);
    expect(rectOf(refs[11])).toEqual([0, 130, 390, 10]);
    expect(rectOf(refs[CHILD_COUNT - 1])).toEqual([0, 510, 390, 10]);

    const logs = root.takeMountingManagerLogs();
    expect(logs).toContain('Update {type: "View", nativeID: "row-10"}');
    expect(logs).toContain('Update {type: "View", nativeID: "row-11"}');
    expect(logs).toContain(
      `Update {type: "View", nativeID: "row-${CHILD_COUNT - 1}"}`,
    );
    expect(logs).not.toContain('Update {type: "View", nativeID: "row-9"}');

    root.destroy();
  });

  it('lays out a nested child whose parent was shared', () => {
    const root = Fantom.createRoot();
    const innerRef = React.createRef<HostInstance>();
    const groupRef = React.createRef<HostInstance>();
    const afterRef = React.createRef<HostInstance>();

    function Tree({
      innerHeight,
      color,
    }: {
      innerHeight: number,
      color: string,
    }): React.MixedElement {
      return (
        <View collapsable={false}>
          <View ref={groupRef} collapsable={false}>
            <View ref={innerRef} style={{height: innerHeight}} />
          </View>
          <View ref={afterRef} style={{height: 10, backgroundColor: color}} />
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<Tree innerHeight={10} color="red" />);
    });
    // Only the last child changes, so the group stays shared.
    Fantom.runTask(() => {
      root.render(<Tree innerHeight={10} color="blue" />);
    });
    // The group's child grows, which moves the last child.
    Fantom.runTask(() => {
      root.render(<Tree innerHeight={40} color="blue" />);
    });

    expect(rectOf(groupRef)).toEqual([0, 0, 390, 40]);
    expect(rectOf(innerRef)).toEqual([0, 0, 390, 40]);
    expect(rectOf(afterRef)).toEqual([0, 40, 390, 10]);

    root.destroy();
  });

  it('keeps layouts correct when scrolling and then changing content', () => {
    const root = Fantom.createRoot();
    const scrollRef = React.createRef<HostInstance>();
    const refs = Array.from({length: CHILD_COUNT}, () =>
      React.createRef<HostInstance>(),
    );

    function List({tallIndex}: {tallIndex: number}): React.MixedElement {
      return (
        <View collapsable={false}>
          <View style={{height: 50}} collapsable={false} />
          <ScrollView ref={scrollRef} style={{height: 200}}>
            {refs.map((ref, i) => (
              <View
                key={i}
                ref={ref}
                style={{height: i === tallIndex ? 30 : 10}}
              />
            ))}
          </ScrollView>
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<List tallIndex={-1} />);
    });

    // Each scroll commits a state update of the ScrollView, which clones its
    // ancestors with a new list of children.
    Fantom.scrollTo(scrollRef, {x: 0, y: 100});
    Fantom.scrollTo(scrollRef, {x: 0, y: 150});

    Fantom.runTask(() => {
      root.render(<List tallIndex={0} />);
    });

    // Rows are offset by the header (50) and the scroll offset (150).
    expect(rectOf(refs[0])).toEqual([0, 50 - 150, 390, 30]);
    expect(rectOf(refs[1])).toEqual([0, 80 - 150, 390, 10]);
    expect(rectOf(refs[CHILD_COUNT - 1])).toEqual([0, 560 - 150, 390, 10]);

    root.destroy();
  });

  it('keeps layouts correct when a node with shared children is hidden and shown', () => {
    const root = Fantom.createRoot();
    const refs = Array.from({length: 3}, () => React.createRef<HostInstance>());
    const afterRef = React.createRef<HostInstance>();

    function Tree({
      hidden,
      color,
    }: {
      hidden: boolean,
      color: string,
    }): React.MixedElement {
      return (
        <View collapsable={false}>
          <View collapsable={false} style={{display: hidden ? 'none' : 'flex'}}>
            {refs.map((ref, i) => (
              <View
                key={i}
                ref={ref}
                style={{
                  height: 10,
                  backgroundColor: i === 0 ? color : 'gray',
                }}
              />
            ))}
          </View>
          <View ref={afterRef} style={{height: 10}} />
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<Tree hidden={false} color="red" />);
    });
    Fantom.runTask(() => {
      root.render(<Tree hidden={true} color="red" />);
    });
    expect(rectOf(afterRef)).toEqual([0, 0, 390, 10]);

    // A change while hidden: the hidden node gets a new list of children.
    Fantom.runTask(() => {
      root.render(<Tree hidden={true} color="blue" />);
    });
    Fantom.runTask(() => {
      root.render(<Tree hidden={false} color="blue" />);
    });

    expect(rectOf(refs[0])).toEqual([0, 0, 390, 10]);
    expect(rectOf(refs[2])).toEqual([0, 20, 390, 10]);
    expect(rectOf(afterRef)).toEqual([0, 30, 390, 10]);

    root.destroy();
  });

  it('lays out shared children of a node whose layout comes from the cache', () => {
    // The container's height changes while the row's size doesn't, so Yoga
    // restores the row from its cache; then a sibling changes color.
    expectSameLayoutAsFreshRender(
      (step, refs) => (
        <View
          collapsable={false}
          style={{
            height: step % 2 === 0 ? 300 : 400,
            justifyContent: 'center',
          }}>
          <View collapsable={false} style={{flexDirection: 'row'}}>
            <View ref={refs[0]} style={{width: 20, height: 20}} />
            <View
              ref={refs[1]}
              style={{
                width: 20,
                height: 20,
                backgroundColor: step < 2 ? 'red' : 'blue',
              }}
            />
          </View>
          <View ref={refs[2]} style={{height: 10}} />
        </View>
      ),
      5,
      3,
    );
  });

  it('positions an absolute child of a shared static node', () => {
    expectSameLayoutAsFreshRender(
      (step, refs) => (
        <View
          ref={refs[0]}
          collapsable={false}
          style={{width: 200, height: step < 2 ? 100 : 150}}>
          <View ref={refs[1]} collapsable={false} style={{position: 'static'}}>
            <View
              ref={refs[2]}
              style={{position: 'absolute', bottom: 0, width: 10, height: 10}}
            />
          </View>
          <View
            ref={refs[3]}
            style={{height: 10, backgroundColor: step < 1 ? 'red' : 'blue'}}
          />
        </View>
      ),
      3,
      4,
    );
  });

  it('lays out shared children of a display: contents node', () => {
    expectSameLayoutAsFreshRender(
      (step, refs) => (
        <View collapsable={false}>
          <View style={{display: 'contents'}}>
            <View ref={refs[0]} style={{height: step < 2 ? 10 : 30}} />
            <View ref={refs[1]} style={{height: 10}} />
          </View>
          <View
            ref={refs[2]}
            style={{height: 10, backgroundColor: step < 1 ? 'red' : 'blue'}}
          />
        </View>
      ),
      3,
      3,
    );
  });

  it('aligns shared text to the baseline', () => {
    expectSameLayoutAsFreshRender(
      (step, refs) => (
        <View
          collapsable={false}
          style={{flexDirection: 'row', alignItems: 'baseline'}}>
          <Text ref={refs[0]} style={{fontSize: step < 2 ? 10 : 20}}>
            Hello
          </Text>
          <Text
            ref={refs[1]}
            style={{fontSize: 10, color: step < 1 ? 'red' : 'blue'}}>
            World
          </Text>
          <View ref={refs[2]} style={{width: 10, height: 10}} />
        </View>
      ),
      3,
      3,
    );
  });

  // The same steps as View-yogaNodeOwnerAssertion-itest.js, which once left
  // `hasNewLayout` set on a hidden child shared with an older revision. With
  // the flag on, more children stay shared, so run them twice.
  it('does not trip the Yoga node owner assertion after resize then restyle', () => {
    let triggerResize: () => void = () => {};
    let triggerRestyle: () => void = () => {};

    function Repro(): React.MixedElement {
      const [tall, setTall] = useState(false);
      const [highlighted, setHighlighted] = useState(false);

      triggerResize = () => setTall(v => !v);
      triggerRestyle = () => setHighlighted(v => !v);

      return (
        <View style={{flex: 1}}>
          <View style={{height: tall ? 400 : 300, justifyContent: 'center'}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View style={{justifyContent: 'center'}}>
                <View style={{display: 'none'}} />
              </View>
              <TextInput
                style={[
                  {borderWidth: 1, minWidth: 120},
                  highlighted && {borderColor: 'red'},
                ]}
              />
            </View>
          </View>
        </View>
      );
    }

    const root = Fantom.createRoot({viewportWidth: 390, viewportHeight: 844});

    Fantom.runTask(() => {
      root.render(<Repro />);
    });
    Fantom.runTask(() => {
      triggerResize();
    });
    Fantom.runTask(() => {
      triggerRestyle();
    });
    Fantom.runTask(() => {
      triggerResize();
    });
    Fantom.runTask(() => {
      triggerRestyle();
    });

    expect(root.getRenderedOutput().toJSX()).not.toBe(null);

    root.destroy();
  });
});
