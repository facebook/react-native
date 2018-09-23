/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

global.setImmediate = jest.fn();
global.clearImmediate = jest.fn();
global.requestAnimationFrame = jest.fn();
global.cancelAnimationFrame = jest.fn();

jest.useFakeTimers();

const Timer = require('../Timer');

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');

describe('Timer', () => {
  [
    {setter: 'setTimeout', clearer: 'clearTimeout', key: '_timeouts'},
    {setter: 'setInterval', clearer: 'clearInterval', key: '_intervals'},
    {setter: 'setImmediate', clearer: 'clearImmediate', key: '_immediates'},
    {
      setter: 'requestAnimationFrame',
      clearer: 'cancelAnimationFrame',
      key: '_rafs',
    },
  ].forEach(type => {
    it(`should apply basic ${type.setter} correctly`, () => {
      const root = ReactTestRenderer.create(<Timer />);
      const ref = root.getInstance();

      expect(ref[type.key]).toEqual(undefined);

      global[type.setter].mockClear();
      global[type.setter].mockReturnValueOnce(1);
      global[type.clearer].mockClear();
      const cb = jest.fn();
      const id = ref[type.setter](cb, 10);

      expect(global[type.setter]).toHaveBeenCalled();
      expect(global[type.clearer]).not.toBeCalled();
      expect(ref[type.key]).toEqual([id]);

      root.unmount();

      expect(global[type.clearer]).toBeCalledWith(id);
      expect(ref[type.key]).toEqual(null);
    });

    it(`should apply ${type.clearer} correctly`, () => {
      const root = ReactTestRenderer.create(<Timer />);
      const ref = root.getInstance();

      let id = 1;
      global[type.setter].mockClear();
      global[type.setter].mockImplementationOnce(() => {
        return id++;
      });
      global[type.clearer].mockClear();
      const cb = jest.fn();

      const id1 = ref[type.setter](cb, 10);
      const id2 = ref[type.setter](cb, 10);
      const id3 = ref[type.setter](cb, 10);
      ref[type.clearer](id2);
      expect(global[type.clearer]).toBeCalledWith(id2);
      const id4 = ref[type.setter](cb, 10);
      ref[type.clearer](id1);
      expect(global[type.clearer]).toBeCalledWith(id1);
      const id5 = ref[type.setter](cb, 10);
      ref[type.clearer](id5);
      expect(global[type.clearer]).toBeCalledWith(id5);
      ref[type.clearer](id3);
      expect(global[type.clearer]).toBeCalledWith(id3);

      expect(ref[type.key]).toEqual([id4]);

      root.unmount();

      expect(global[type.clearer]).toBeCalledWith(id4);
      expect(ref[type.key]).toEqual(null);
    });

    it(`should remove bookeeping when callback is called for ${
      type.setter
    }`, () => {
      const root = ReactTestRenderer.create(<Timer />);
      const ref = root.getInstance();

      global[type.setter].mockClear();
      global[type.setter].mockReturnValueOnce(1);
      global[type.clearer].mockClear();
      const cb = jest.fn();
      const id = ref[type.setter](cb, 10);
      expect(cb).not.toBeCalled();
      global[type.setter].mock.calls[0][0]();
      expect(cb).toBeCalled();

      if (type.setter !== 'setInterval') {
        expect(global[type.clearer]).toBeCalledWith(id);
        expect(ref[type.key]).toEqual([]);
      } else {
        expect(global[type.clearer]).not.toBeCalled();
        expect(ref[type.key]).toEqual([id]);
      }
    });
  });
});
