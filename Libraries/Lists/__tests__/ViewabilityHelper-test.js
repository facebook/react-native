/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const ViewabilityHelper = require('../ViewabilityHelper');

let rowFrames;
let data;
function getFrameMetrics(index: number) {
  const frame = rowFrames[data[index].key];
  return {length: frame.height, offset: frame.y};
}
function createViewToken(index: number, isViewable: boolean) {
  return {key: data[index].key, isViewable};
}

describe('computeViewableItems', function () {
  it('returns all 4 entirely visible rows as viewable', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 50},
      c: {y: 100, height: 50},
      d: {y: 150, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(
      helper.computeViewableItems(data.length, 0, 200, getFrameMetrics),
    ).toEqual([0, 1, 2, 3]);
  });

  it('returns top 2 rows as viewable (1. entirely visible and 2. majority)', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 50},
      d: {y: 250, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(
      helper.computeViewableItems(data.length, 0, 200, getFrameMetrics),
    ).toEqual([0, 1]);
  });

  it('returns only 2nd row as viewable (majority)', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 50},
      d: {y: 250, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    expect(
      helper.computeViewableItems(data.length, 25, 200, getFrameMetrics),
    ).toEqual([1]);
  });

  it('handles empty input', function () {
    const helper = new ViewabilityHelper({
      viewAreaCoveragePercentThreshold: 50,
    });
    rowFrames = {};
    data = [];
    expect(
      helper.computeViewableItems(data.length, 0, 200, getFrameMetrics),
    ).toEqual([]);
  });

  it('handles different view area coverage percent thresholds', function () {
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 500},
      d: {y: 700, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];

    let helper = new ViewabilityHelper({viewAreaCoveragePercentThreshold: 0});
    expect(
      helper.computeViewableItems(data.length, 0, 50, getFrameMetrics),
    ).toEqual([0]);
    expect(
      helper.computeViewableItems(data.length, 1, 50, getFrameMetrics),
    ).toEqual([0, 1]);
    expect(
      helper.computeViewableItems(data.length, 199, 50, getFrameMetrics),
    ).toEqual([1, 2]);
    expect(
      helper.computeViewableItems(data.length, 250, 50, getFrameMetrics),
    ).toEqual([2]);

    helper = new ViewabilityHelper({viewAreaCoveragePercentThreshold: 100});
    expect(
      helper.computeViewableItems(data.length, 0, 200, getFrameMetrics),
    ).toEqual([0, 1]);
    expect(
      helper.computeViewableItems(data.length, 1, 200, getFrameMetrics),
    ).toEqual([1]);
    expect(
      helper.computeViewableItems(data.length, 400, 200, getFrameMetrics),
    ).toEqual([2]);
    expect(
      helper.computeViewableItems(data.length, 600, 200, getFrameMetrics),
    ).toEqual([3]);

    helper = new ViewabilityHelper({viewAreaCoveragePercentThreshold: 10});
    expect(
      helper.computeViewableItems(data.length, 30, 200, getFrameMetrics),
    ).toEqual([0, 1, 2]);
    expect(
      helper.computeViewableItems(data.length, 31, 200, getFrameMetrics),
    ).toEqual([1, 2]);
  });

  it('handles different item visible percent thresholds', function () {
    rowFrames = {
      a: {y: 0, height: 50},
      b: {y: 50, height: 150},
      c: {y: 200, height: 50},
      d: {y: 250, height: 50},
    };
    data = [{key: 'a'}, {key: 'b'}, {key: 'c'}, {key: 'd'}];
    let helper = new ViewabilityHelper({itemVisiblePercentThreshold: 0});
    expect(
      helper.computeViewableItems(data.length, 0, 50, getFrameMetrics),
    ).toEqual([0]);
    expect(
      helper.computeViewableItems(data.length, 1, 50, getFrameMetrics),
    ).toEqual([0, 1]);

    helper = new ViewabilityHelper({itemVisiblePercentThreshold: 100});
    expect(
      helper.computeViewableItems(data.length, 0, 250, getFrameMetrics),
    ).toEqual([0, 1, 2]);
    expect(
      helper.computeViewableItems(data.length, 1, 250, getFrameMetrics),
    ).toEqual([1, 2]);

    helper = new ViewabilityHelper({itemVisiblePercentThreshold: 10});
    expect(
      helper.computeViewableItems(data.length, 184, 20, getFrameMetrics),
    ).toEqual([1]);
    expect(
      helper.computeViewableItems(data.length, 185, 20, getFrameMetrics),
    ).toEqual([1, 2]);
    expect(
      helper.computeViewableItems(data.length, 186, 20, getFrameMetrics),
    ).toEqual([2]);
  });
});

describe('onUpdate', function () {
  it('returns 1 visible row as viewable then scrolls away', function () {
    const helper = new ViewabilityHelper();
    rowFrames = {
      a: {y: 0, height: 50},
    };
    data = [{key: 'a'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'a'}],
    });
    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1); // nothing changed!
    helper.onUpdate(
      data.length,
      100,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(2);
    expect(onViewableItemsChanged.mock.calls[1][0]).toEqual({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [],
    });
  });

  it('returns 1st visible row then 1st and 2nd then just 2nd', function () {
    const helper = new ViewabilityHelper();
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'a'}],
    });
    helper.onUpdate(
      data.length,
      100,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(2);
    // Both visible with 100px overlap each
    expect(onViewableItemsChanged.mock.calls[1][0]).toEqual({
      changed: [{isViewable: true, key: 'b'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [
        {isViewable: true, key: 'a'},
        {isViewable: true, key: 'b'},
      ],
    });
    helper.onUpdate(
      data.length,
      200,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(3);
    expect(onViewableItemsChanged.mock.calls[2][0]).toEqual({
      changed: [{isViewable: false, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'b'}],
    });
  });

  it('minimumViewTime delays callback', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged).not.toBeCalled();

    jest.runAllTimers();

    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {
        minimumViewTime: 350,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'a'}],
    });
  });

  it('minimumViewTime skips briefly visible items', function () {
    const helper = new ViewabilityHelper({
      minimumViewTime: 350,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 250},
      b: {y: 250, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    helper.onUpdate(
      data.length,
      300, // scroll past item 'a'
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );

    jest.runAllTimers();

    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'b'}],
      viewabilityConfig: {
        minimumViewTime: 350,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'b'}],
    });
  });

  it('waitForInteraction blocks callback until interaction', function () {
    const helper = new ViewabilityHelper({
      waitForInteraction: true,
      viewAreaCoveragePercentThreshold: 0,
    });
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      data.length,
      0,
      100,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged).not.toBeCalled();

    helper.recordInteraction();

    helper.onUpdate(
      data.length,
      20,
      100,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {
        waitForInteraction: true,
        viewAreaCoveragePercentThreshold: 0,
      },
      viewableItems: [{isViewable: true, key: 'a'}],
    });
  });

  it('returns the right visible row after the underlying data changed', function () {
    const helper = new ViewabilityHelper();
    rowFrames = {
      a: {y: 0, height: 200},
      b: {y: 200, height: 200},
    };
    data = [{key: 'a'}, {key: 'b'}];
    const onViewableItemsChanged = jest.fn();
    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );
    expect(onViewableItemsChanged.mock.calls.length).toBe(1);
    expect(onViewableItemsChanged.mock.calls[0][0]).toEqual({
      changed: [{isViewable: true, key: 'a'}],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'a'}],
    });

    // update data
    rowFrames = {
      c: {y: 0, height: 200},
      a: {y: 200, height: 200},
      b: {y: 400, height: 200},
    };
    data = [{key: 'c'}, {key: 'a'}, {key: 'b'}];

    helper.resetViewableIndices();

    helper.onUpdate(
      data.length,
      0,
      200,
      getFrameMetrics,
      createViewToken,
      onViewableItemsChanged,
    );

    expect(onViewableItemsChanged.mock.calls.length).toBe(2);
    expect(onViewableItemsChanged.mock.calls[1][0]).toEqual({
      changed: [
        {isViewable: true, key: 'c'},
        {isViewable: false, key: 'a'},
      ],
      viewabilityConfig: {viewAreaCoveragePercentThreshold: 0},
      viewableItems: [{isViewable: true, key: 'c'}],
    });
  });
});
