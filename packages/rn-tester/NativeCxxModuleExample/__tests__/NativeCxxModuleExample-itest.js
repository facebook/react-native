/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import type {
  BinaryTreeNode,
  GraphNode,
  ObjectStruct,
} from '../NativeCxxModuleExample';

import NativeCxxModuleExample, {
  EnumInt,
  EnumNone,
  EnumStr,
} from '../NativeCxxModuleExample';
import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import NativeFantom from 'react-native/src/private/testing/fantom/specs/NativeFantom';

describe('NativeCxxModuleExample', () => {
  it('verifies that the Turbo Module was loaded', () => {
    expect(NativeCxxModuleExample).not.toBeNull();
  });

  it('verifies getArray(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getArray([])).toEqual([]);
    expect(NativeCxxModuleExample?.getArray([null])).toEqual([null]);
    expect(NativeCxxModuleExample?.getArray([{a: 1, b: '2'}])).toEqual([
      {a: 1, b: '2'},
    ]);
  });

  it('verifies getBool(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getBool(false)).toBe(false);
    expect(NativeCxxModuleExample?.getBool(true)).toBe(true);
  });

  it('verifies getConstants(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getConstants()).toEqual({
      const1: true,
      const2: 69,
      const3: 'react-native',
    });
  });

  it('verifies getCustomEnum(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getCustomEnum(EnumInt.IA)).toBe(EnumInt.IA);
  });

  it('verifies getCustomHostObject(...) returns the correct values', () => {
    const customHostObject = NativeCxxModuleExample?.getCustomHostObject();
    expect(customHostObject).not.toBe(null);
    if (customHostObject != null) {
      expect(
        NativeCxxModuleExample?.consumeCustomHostObject(customHostObject),
      ).toBe('answer42');
    }
  });

  it('verifies getBinaryTreeNode(...) returns the correct values', () => {
    const binaryTreeNode: BinaryTreeNode = {
      left: {value: 2},
      value: 4,
      right: {value: 6},
    };
    const result = NativeCxxModuleExample?.getBinaryTreeNode(binaryTreeNode);
    expect(result).not.toBe(null);
    if (result != null) {
      expect(result.left?.left).toBeNull();
      expect(result.left?.value).toBe(2);
      expect(result.left?.right).toBeNull();
      expect(result.value).toBe(4);
      expect(result.right?.left).toBeNull();
      expect(result.right?.value).toBe(6);
      expect(result.right?.right).toBeNull();
    }
  });

  it('verifies getGraphNode(...) returns the correct values', () => {
    const graphNode: GraphNode = {
      label: 'root',
      neighbors: [{label: 'child1'}, {label: 'child2'}],
    };
    const result = NativeCxxModuleExample?.getGraphNode(graphNode);
    expect(result).not.toBe(null);
    if (result != null) {
      expect(result.label).toBe('root');
      expect(result.neighbors?.length).toBe(4);
      expect(result.neighbors?.[0].label).toBe('child1');
      expect(result.neighbors?.[0].neighbors).toBeNull();
      expect(result.neighbors?.[1].label).toBe('child2');
      expect(result.neighbors?.[1].neighbors).toBeNull();
      expect(result.neighbors?.[2].label).toBe('top');
      expect(result.neighbors?.[2].neighbors).toBeNull();
      expect(result.neighbors?.[3].label).toBe('down');
      expect(result.neighbors?.[3].neighbors).toBeNull();
    }
  });

  it('verifies getNumEnum(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getNumEnum(EnumInt.IA)).toBe(EnumInt.IA);
    expect(NativeCxxModuleExample?.getNumEnum(EnumInt.IB)).toBe(EnumInt.IB);
  });

  it('verifies getStrEnum(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getStrEnum(EnumNone.NA)).toBe(EnumStr.SB);
    expect(NativeCxxModuleExample?.getStrEnum(EnumNone.NB)).toBe(EnumStr.SB);
  });

  it('verifies getMap(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getMap({a: 0, b: null, c: 3})).toEqual({
      a: 0,
      b: null,
      c: 3,
    });
  });

  it('verifies getNumber(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getNumber(0)).toBe(0);
    expect(NativeCxxModuleExample?.getNumber(Math.pow(2, 53))).toBe(
      Math.pow(2, 53),
    );
  });

  it('verifies getObject(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getObject({a: 2, b: 'two'})).toEqual({
      a: 2,
      b: 'two',
    });
    expect(
      NativeCxxModuleExample?.getObject({a: 4, b: 'four', c: 'seven'}),
    ).toEqual({a: 4, b: 'four', c: 'seven'});
  });

  it('verifies getSet(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getSet([1, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('verifies getString(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getString('')).toBe('');
    expect(NativeCxxModuleExample?.getString('string')).toBe('string');
  });

  it('verifies getUnion(...) returns the correct values', () => {
    expect(NativeCxxModuleExample?.getUnion(2.88, 'Two', {value: 2})).toBe(
      'x: 2.88, y: Two, z: { value: 2 }',
    );
    expect(NativeCxxModuleExample?.getUnion(5.76, 'One', {low: 'value'})).toBe(
      'x: 5.76, y: One, z: { low: value }',
    );
  });

  it('verifies getValue(...) returns the correct values', () => {
    expect(
      NativeCxxModuleExample?.getValue(23, 'forty-two', {
        a: 4,
        b: 'four',
        c: 'seven',
      }),
    ).toEqual({x: 23, y: 'forty-two', z: {a: 4, b: 'four', c: 'seven'}});
  });

  it('verifies getValueWithCallback(...) returns the correct values', () => {
    let result = '';
    NativeCxxModuleExample?.getValueWithCallback((value: string) => {
      result = value;
    });
    NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callback
    expect(result).toBe('value from callback!');
  });

  it('verifies setValueCallbackWithSubscription(...) returns the correct values', () => {
    let result = '';
    let subscription = NativeCxxModuleExample?.setValueCallbackWithSubscription(
      (value: string) => {
        result = value;
      },
    );
    expect(result).toBe('');
    expect(subscription).not.toBeNull();
    subscription?.();
    NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callback
    expect(result).toBe('value from callback on clean up!');
  });

  it('verifies getValueWithPromise(...) returns the correct values', () => {
    {
      let result = '';
      let error = '';
      NativeCxxModuleExample?.getValueWithPromise(false)
        .then(value => {
          result = value;
        })
        .catch(err => {
          error = err;
        });
      NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callbacks
      expect(result).toBe('result!');
      expect(error).toBe('');
    }
    {
      let result = '';
      let error = '';
      NativeCxxModuleExample?.getValueWithPromise(true)
        .then(value => {
          result = value;
        })
        .catch(err => {
          error = err;
        });
      NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callbacks
      expect(result).toBe('');
      expect(error.toString()).toBe('Error: intentional promise rejection');
    }

    it('verifies getWithWithOptionalArgs(...) returns the correct values', () => {
      expect(NativeCxxModuleExample?.getWithWithOptionalArgs()).toBeNull();
      expect(NativeCxxModuleExample?.getWithWithOptionalArgs(true)).toBe(true);
      expect(NativeCxxModuleExample?.getWithWithOptionalArgs(false)).toBe(
        false,
      );
    });

    it('verifies voidFunc(...) returns the correct for EventEmitters', () => {
      let eventEmitterCalled = {
        onPress: 0,
        onClick: 0,
        onChange: 0,
        onSubmit: 0,
        onEvent: 0,
      };
      let onClickValue: ?string = null;
      let onChangeValue: ?ObjectStruct = null;
      let onSubmitValue: ?(ObjectStruct[]) = null;
      let onEventValue: ?EnumNone = null;
      NativeCxxModuleExample?.onPress(() => {
        eventEmitterCalled.onPress++;
      });
      NativeCxxModuleExample?.onClick((value: string) => {
        eventEmitterCalled.onClick++;
        onClickValue = value;
      });
      NativeCxxModuleExample?.onChange((value: ObjectStruct) => {
        eventEmitterCalled.onChange++;
        onChangeValue = value;
      });
      NativeCxxModuleExample?.onSubmit((value: ObjectStruct[]) => {
        eventEmitterCalled.onSubmit++;
        onSubmitValue = value;
      });
      NativeCxxModuleExample?.onEvent((value: EnumNone) => {
        eventEmitterCalled.onEvent++;
        onEventValue = value;
      });
      NativeCxxModuleExample?.voidFunc();
      NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callbacks

      expect(eventEmitterCalled.onPress).toBe(1);
      expect(eventEmitterCalled.onClick).toBe(1);
      expect(eventEmitterCalled.onChange).toBe(1);
      expect(eventEmitterCalled.onSubmit).toBe(1);
      expect(eventEmitterCalled.onEvent).toBe(1);

      expect(onClickValue).toBe('value from callback on click!');
      expect(onChangeValue).toEqual({a: 1, b: 'two'});
      expect(onSubmitValue).toEqual([
        {a: 1, b: 'two'},
        {a: 3, b: 'four'},
        {a: 5, b: 'six'},
      ]);
      expect(onEventValue).toBe(EnumNone.NA);
    });
  });

  it('verifies voidPromise(...) returns the correct values', () => {
    let promiseCalled = {
      result: 0,
      error: 0,
    };
    NativeCxxModuleExample?.voidPromise()
      .then(_value => promiseCalled.result++)
      .catch(_err => promiseCalled.error++);
    NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callbacks
    expect(promiseCalled.result).toBe(1);
    expect(promiseCalled.error).toBe(0);
  });

  it('verifies setMenu(...) returns the correct values', () => {
    let result: {[key: string]: ?{value: string, flag: boolean}} = {
      file: null,
      new: null,
    };
    let menu = {
      label: 'File',
      onPress: (value: string, flag: boolean) => {
        result.file = {value, flag};
      },
      items: [
        {
          label: 'new',
          onPress: (value: string, flag: boolean) => {
            result.new = {value, flag};
          },
        },
      ],
    };
    NativeCxxModuleExample?.setMenu(menu);
    NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callback
    expect(result.file?.value).toBe('value');
    expect(result.file?.flag).toBe(true);
    expect(result.new?.value).toBe('another value');
    expect(result.new?.flag).toBe(false);
  });

  it('verifies emitCustomDeviceEvent(...) returns the correct values', () => {
    let events: {[key: string]: ?string} = {
      foo: null,
      bar: null,
    };
    RCTDeviceEventEmitter.addListener(
      'foo',
      (value: string) => (events.foo = value),
    );
    RCTDeviceEventEmitter.addListener(
      'bar',
      (value: string) => (events.bar = value),
    );
    NativeCxxModuleExample?.emitCustomDeviceEvent('foo');
    NativeCxxModuleExample?.emitCustomDeviceEvent('bar');

    NativeFantom.flushMessageQueue(); // Flush the message queue to execute the callbacks
    expect(events.foo).toEqual([
      true,
      42,
      'stringArg',
      {type: 'one', level: 2},
    ]);
    expect(events.foo).toEqual([
      true,
      42,
      'stringArg',
      {type: 'one', level: 2},
    ]);
  });
});
