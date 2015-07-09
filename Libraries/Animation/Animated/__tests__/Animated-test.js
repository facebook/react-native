/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .autoMockOff()
  .setMock('Text', {})
  .setMock('View', {})
  .setMock('Image', {})
  .setMock('React', {Component: class {}});

var Animated = require('Animated');

describe('Animated', () => {
  it('works end to end', () => {
    var anim = new Animated.Value(0);

    var callback = jest.genMockFunction();

    var node = new Animated.__PropsOnlyForTests({
      style: {
        backgroundColor: 'red',
        opacity: anim,
        transform: [
          {translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 200],
          })},
          {scale: anim},
        ]
      }
    }, callback);

    expect(anim.getChildren().length).toBe(3);

    expect(node.__getValue()).toEqual({
      style: {
        backgroundColor: 'red',
        opacity: 0,
        transform: [
          {translateX: 100},
          {scale: 0},
        ],
      },
    });

    anim.setValue(0.5);

    expect(callback).toBeCalled();

    expect(node.__getValue()).toEqual({
      style: {
        backgroundColor: 'red',
        opacity: 0.5,
        transform: [
          {translateX: 150},
          {scale: 0.5},
        ],
      },
    });

    node.detach();
    expect(anim.getChildren().length).toBe(0);

    anim.setValue(1);
    expect(callback.mock.calls.length).toBe(1);
  });

  it('does not detach on updates', () => {
    var anim = new Animated.Value(0);
    anim.detach = jest.genMockFunction();

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
    };
    c.componentWillMount();

    expect(anim.detach).not.toBeCalled();
    c.componentWillReceiveProps({
      style: {
        opacity: anim,
      },
    });
    expect(anim.detach).not.toBeCalled();

    c.componentWillUnmount();
    expect(anim.detach).toBeCalled();
  });


  it('stops animation when detached', () => {
    // jest environment doesn't have requestAnimationFrame :(
    window.requestAnimationFrame = jest.genMockFunction();
    window.cancelAnimationFrame = jest.genMockFunction();

    var anim = new Animated.Value(0);
    var callback = jest.genMockFunction();

    var c = new Animated.View();
    c.props = {
      style: {
        opacity: anim,
      },
    };
    c.componentWillMount();

    Animated.timing(anim, {toValue: 10, duration: 1000}).start(callback);

    c.componentWillUnmount();

    expect(callback).toBeCalledWith({finished: false});
    expect(callback).toBeCalledWith({finished: false});
  });

  it('triggers callback when spring is at rest', () => {
    var anim = new Animated.Value(0);
    var callback = jest.genMockFunction();
    Animated.spring(anim, {toValue: 0, velocity: 0}).start(callback);
    expect(callback).toBeCalled();
  });
});


describe('Animated Sequence', () => {

  it('works with an empty sequence', () => {
    var cb = jest.genMockFunction();
    Animated.sequence([]).start(cb);
    expect(cb).toBeCalledWith({finished: true});
  });

  it('sequences well', () => {
    var anim1 = {start: jest.genMockFunction()};
    var anim2 = {start: jest.genMockFunction()};
    var cb = jest.genMockFunction();

    var seq = Animated.sequence([anim1, anim2]);

    expect(anim1.start).not.toBeCalled();
    expect(anim2.start).not.toBeCalled();

    seq.start(cb);

    expect(anim1.start).toBeCalled();
    expect(anim2.start).not.toBeCalled();
    expect(cb).not.toBeCalled();

    anim1.start.mock.calls[0][0]({finished: true});

    expect(anim2.start).toBeCalled();
    expect(cb).not.toBeCalled();

    anim2.start.mock.calls[0][0]({finished: true});
    expect(cb).toBeCalledWith({finished: true});
  });

  it('supports interrupting sequence', () => {
    var anim1 = {start: jest.genMockFunction()};
    var anim2 = {start: jest.genMockFunction()};
    var cb = jest.genMockFunction();

    Animated.sequence([anim1, anim2]).start(cb);

    anim1.start.mock.calls[0][0]({finished: false});

    expect(anim1.start).toBeCalled();
    expect(anim2.start).not.toBeCalled();
    expect(cb).toBeCalledWith({finished: false});
  });

  it('supports stopping sequence', () => {
    var anim1 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var anim2 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var cb = jest.genMockFunction();

    var seq = Animated.sequence([anim1, anim2]);
    seq.start(cb);
    seq.stop();

    expect(anim1.stop).toBeCalled();
    expect(anim2.stop).not.toBeCalled();
    expect(cb).not.toBeCalled();

    anim1.start.mock.calls[0][0]({finished: false});

    expect(cb).toBeCalledWith({finished: false});
  });
});


describe('Animated Parallel', () => {

  it('works with an empty parallel', () => {
    var cb = jest.genMockFunction();
    Animated.parallel([]).start(cb);
    expect(cb).toBeCalledWith({finished: true});
  });


  it('parellelizes well', () => {
    var anim1 = {start: jest.genMockFunction()};
    var anim2 = {start: jest.genMockFunction()};
    var cb = jest.genMockFunction();

    var par = Animated.parallel([anim1, anim2]);

    expect(anim1.start).not.toBeCalled();
    expect(anim2.start).not.toBeCalled();

    par.start(cb);

    expect(anim1.start).toBeCalled();
    expect(anim2.start).toBeCalled();
    expect(cb).not.toBeCalled();

    anim1.start.mock.calls[0][0]({finished: true});
    expect(cb).not.toBeCalled();

    anim2.start.mock.calls[0][0]({finished: true});
    expect(cb).toBeCalledWith({finished: true});
  });

  it('supports stopping parallel', () => {
    var anim1 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var anim2 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var cb = jest.genMockFunction();

    var seq = Animated.parallel([anim1, anim2]);
    seq.start(cb);
    seq.stop();

    expect(anim1.stop).toBeCalled();
    expect(anim2.stop).toBeCalled();
    expect(cb).not.toBeCalled();

    anim1.start.mock.calls[0][0]({finished: false});
    expect(cb).not.toBeCalled();

    anim2.start.mock.calls[0][0]({finished: false});
    expect(cb).toBeCalledWith({finished: false});
  });


  it('does not call stop more than once when stopping', () => {
    var anim1 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var anim2 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var anim3 = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var cb = jest.genMockFunction();

    var seq = Animated.parallel([anim1, anim2, anim3]);
    seq.start(cb);

    anim1.start.mock.calls[0][0]({finished: false});

    expect(anim1.stop.mock.calls.length).toBe(0);
    expect(anim2.stop.mock.calls.length).toBe(1);
    expect(anim3.stop.mock.calls.length).toBe(1);

    anim2.start.mock.calls[0][0]({finished: false});

    expect(anim1.stop.mock.calls.length).toBe(0);
    expect(anim2.stop.mock.calls.length).toBe(1);
    expect(anim3.stop.mock.calls.length).toBe(1);

    anim3.start.mock.calls[0][0]({finished: false});

    expect(anim1.stop.mock.calls.length).toBe(0);
    expect(anim2.stop.mock.calls.length).toBe(1);
    expect(anim3.stop.mock.calls.length).toBe(1);
  });
});

describe('Animated delays', () => {
  it('should call anim after delay in sequence', () => {
    var anim = {start: jest.genMockFunction(), stop: jest.genMockFunction()};
    var cb = jest.genMockFunction();
    Animated.sequence([
      Animated.delay(1000),
      anim,
    ]).start(cb);
    jest.runAllTimers();
    expect(anim.start.mock.calls.length).toBe(1);
    expect(cb).not.toBeCalled();
    anim.start.mock.calls[0][0]({finished: true});
    expect(cb).toBeCalledWith({finished: true});
  });
  it('should run stagger to end', () => {
    var cb = jest.genMockFunction();
    Animated.stagger(1000, [
      Animated.delay(1000),
      Animated.delay(1000),
      Animated.delay(1000),
    ]).start(cb);
    jest.runAllTimers();
    expect(cb).toBeCalledWith({finished: true});
  });
});

describe('Animated Events', () => {
  it('should map events', () => {
    var value = new Animated.Value(0);
    var handler = Animated.event(
      [null, {state: {foo: value}}],
    );
    handler({bar: 'ignoreBar'}, {state: {baz: 'ignoreBaz', foo: 42}});
    expect(value.__getValue()).toBe(42);
  });
  it('should call listeners', () => {
    var value = new Animated.Value(0);
    var listener = jest.genMockFunction();
    var handler = Animated.event(
      [{foo: value}],
      {listener},
    );
    handler({foo: 42});
    expect(value.__getValue()).toBe(42);
    expect(listener.mock.calls.length).toBe(1);
    expect(listener).toBeCalledWith({foo: 42});
  });
});

describe('Animated Tracking', () => {
  it('should track values', () => {
    var value1 = new Animated.Value(0);
    var value2 = new Animated.Value(0);
    Animated.timing(value2, {
      toValue: value1,
      duration: 0,
    }).start();
    value1.setValue(42);
    expect(value2.__getValue()).toBe(42);
    value1.setValue(7);
    expect(value2.__getValue()).toBe(7);
  });

  it('should track interpolated values', () => {
    var value1 = new Animated.Value(0);
    var value2 = new Animated.Value(0);
    Animated.timing(value2, {
      toValue: value1.interpolate({
        inputRange: [0, 2],
        outputRange: [0, 1]
      }),
      duration: 0,
    }).start();
    value1.setValue(42);
    expect(value2.__getValue()).toBe(42 / 2);
  });

  it('should stop tracking when animated', () => {
    var value1 = new Animated.Value(0);
    var value2 = new Animated.Value(0);
    Animated.timing(value2, {
      toValue: value1,
      duration: 0,
    }).start();
    value1.setValue(42);
    expect(value2.__getValue()).toBe(42);
    Animated.timing(value2, {
      toValue: 7,
      duration: 0,
    }).start();
    value1.setValue(1492);
    expect(value2.__getValue()).toBe(7);
  });
});

describe('Animated Vectors', () => {
  it('should animate vectors', () => {
    var vec = new Animated.ValueXY();

    var callback = jest.genMockFunction();

    var node = new Animated.__PropsOnlyForTests({
      style: {
        opacity: vec.x.interpolate({
          inputRange: [0, 42],
          outputRange: [0.2, 0.8],
        }),
        transform: vec.getTranslateTransform(),
        ...vec.getLayout(),
      }
    }, callback);

    expect(node.__getValue()).toEqual({
      style: {
        opacity: 0.2,
        transform: [
          {translateX: 0},
          {translateY: 0},
        ],
        left: 0,
        top: 0,
      },
    });

    vec.setValue({x: 42, y: 1492});

    expect(callback.mock.calls.length).toBe(2); // once each for x, y

    expect(node.__getValue()).toEqual({
      style: {
        opacity: 0.8,
        transform: [
          {translateX: 42},
          {translateY: 1492},
        ],
        left: 42,
        top: 1492,
      },
    });

    node.detach();

    vec.setValue({x: 1, y: 1});
    expect(callback.mock.calls.length).toBe(2);
  });

  it('should track vectors', () => {
    var value1 = new Animated.ValueXY();
    var value2 = new Animated.ValueXY();
    Animated.timing(value2, {
      toValue: value1,
      duration: 0,
    }).start();
    value1.setValue({x: 42, y: 1492});
    expect(value2.__getValue()).toEqual({x: 42, y: 1492});

    // Make sure tracking keeps working (see stopTogether in ParallelConfig used
    // by maybeVectorAnim).
    value1.setValue({x: 3, y: 4});
    expect(value2.__getValue()).toEqual({x: 3, y: 4});
  });

  it('should track with springs', () => {
    var value1 = new Animated.ValueXY();
    var value2 = new Animated.ValueXY();
    Animated.spring(value2, {
      toValue: value1,
      tension: 3000, // faster spring for faster test
      friction: 60,
    }).start();
    value1.setValue({x: 1, y: 1});
    jest.runAllTimers();
    expect(Math.round(value2.__getValue().x)).toEqual(1);
    expect(Math.round(value2.__getValue().y)).toEqual(1);
    value1.setValue({x: 2, y: 2});
    jest.runAllTimers();
    expect(Math.round(value2.__getValue().x)).toEqual(2);
    expect(Math.round(value2.__getValue().y)).toEqual(2);
  });
});

describe('Animated Listeners', () => {
  it('should get updates', () => {
    var value1 = new Animated.Value(0);
    var listener = jest.genMockFunction();
    var id = value1.addListener(listener);
    value1.setValue(42);
    expect(listener.mock.calls.length).toBe(1);
    expect(listener).toBeCalledWith({value: 42});
    expect(value1.__getValue()).toBe(42);
    value1.setValue(7);
    expect(listener.mock.calls.length).toBe(2);
    expect(listener).toBeCalledWith({value: 7});
    expect(value1.__getValue()).toBe(7);
    value1.removeListener(id);
    value1.setValue(1492);
    expect(listener.mock.calls.length).toBe(2);
    expect(value1.__getValue()).toBe(1492);
  });

  it('should removeAll', () => {
    var value1 = new Animated.Value(0);
    var listener = jest.genMockFunction();
    [1,2,3,4].forEach(() => value1.addListener(listener));
    value1.setValue(42);
    expect(listener.mock.calls.length).toBe(4);
    expect(listener).toBeCalledWith({value: 42});
    value1.removeAllListeners();
    value1.setValue(7);
    expect(listener.mock.calls.length).toBe(4);
  });
});
