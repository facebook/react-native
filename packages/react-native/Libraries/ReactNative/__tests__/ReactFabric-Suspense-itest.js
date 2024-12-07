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

import '../../Core/InitializeCore.js';
import View from '../../Components/View/View';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Suspense, startTransition} from 'react';

let resolveFunction: (() => void) | null = null;

// This is a workaround for a bug to get the demo running.
// TODO: replace with real implementation when the bug is fixed.
// $FlowFixMe: [missing-local-annot]
function use(promise) {
  if (promise.status === 'fulfilled') {
    return promise.value;
  } else if (promise.status === 'rejected') {
    throw promise.reason;
  } else if (promise.status === 'pending') {
    throw promise;
  } else {
    promise.status = 'pending';
    promise.then(
      result => {
        promise.status = 'fulfilled';
        promise.value = result;
      },
      reason => {
        promise.status = 'rejected';
        promise.reason = reason;
      },
    );
    throw promise;
  }
}

type SquareData = {
  color: 'red' | 'green',
};

enum SquareId {
  Green = 'green-square',
  Red = 'red-square',
}

async function getGreenSquareData(): Promise<SquareData> {
  await new Promise(resolve => {
    resolveFunction = resolve;
  });
  return {
    color: 'green',
  };
}

async function getRedSquareData(): Promise<SquareData> {
  await new Promise(resolve => {
    resolveFunction = resolve;
  });
  return {
    color: 'red',
  };
}

const cache = new Map<SquareId, SquareData>();

async function getData(squareId: SquareId): Promise<SquareData> {
  switch (squareId) {
    case SquareId.Green:
      return await getGreenSquareData();
    case SquareId.Red:
      return await getRedSquareData();
  }
}

async function fetchData(squareId: SquareId): Promise<SquareData> {
  const data = await getData(squareId);
  cache.set(squareId, data);
  return data;
}

function Square(props: {squareId: SquareId}) {
  let data = cache.get(props.squareId);
  if (data == null) {
    data = use(fetchData(props.squareId));
  }
  return <View key={data.color} nativeID={'square with data: ' + data.color} />;
}

function GreenSquare() {
  return <Square squareId={SquareId.Green} />;
}

function RedSquare() {
  return <Square squareId={SquareId.Red} />;
}

function Fallback() {
  return <View nativeID="suspense fallback" />;
}

describe('Suspense', () => {
  it('shows fallback if data is not available', () => {
    cache.clear();
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <Suspense fallback={<Fallback />}>
          <GreenSquare />
        </Suspense>,
      );
    });

    let mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `suspense fallback`',
    );

    expect(resolveFunction).not.toBeNull();
    Fantom.runTask(() => {
      resolveFunction?.();
      resolveFunction = null;
    });

    mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `square with data: green`',
    );

    Fantom.runTask(() => {
      root.render(
        <Suspense fallback={<Fallback />}>
          <RedSquare />
        </Suspense>,
      );
    });

    mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `suspense fallback`',
    );

    expect(resolveFunction).not.toBeNull();
    Fantom.runTask(() => {
      resolveFunction?.();
      resolveFunction = null;
    });

    mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `square with data: red`',
    );

    Fantom.runTask(() => {
      root.render(
        <Suspense fallback={<Fallback />}>
          <GreenSquare />
        </Suspense>,
      );
    });

    mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `square with data: green`',
    );

    expect(resolveFunction).toBeNull();

    root.destroy();
  });

  // TODO(T207868872): this test only succeeds with enableFabricCompleteRootInCommitPhase enabled.
  // enableFabricCompleteRootInCommitPhase is hardcoded to true in the testing environment.
  it('shows stale data while transition is happening', () => {
    cache.clear();
    cache.set(SquareId.Green, {color: 'green'});

    const root = Fantom.createRoot();

    function App(props: {color: 'red' | 'green'}) {
      return (
        <Suspense fallback={<Fallback />}>
          {props.color === 'green' ? <GreenSquare /> : <RedSquare />}
        </Suspense>
      );
    }

    Fantom.runTask(() => {
      root.render(<App color="green" />);
    });

    let mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `square with data: green`',
    );

    expect(resolveFunction).toBeNull();
    Fantom.runTask(() => {
      startTransition(() => {
        root.render(<App color="red" />);
      });
    });

    mountingLogs = root.getMountingLogs();

    // Green square is still mounted. Fallback is not shown to the user.
    expect(mountingLogs.length).toBe(0);

    expect(resolveFunction).not.toBeNull();
    Fantom.runTask(() => {
      resolveFunction?.();
      resolveFunction = null;
    });

    mountingLogs = root.getMountingLogs();

    expect(mountingLogs.length).toBe(1);
    expect(mountingLogs[0]).toBe(
      'create view type: `View` nativeId: `square with data: red`',
    );

    root.destroy();
  });
});
