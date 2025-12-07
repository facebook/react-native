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

'use strict';

const NativeStatusBarManagerAndroid = {
    setColor: jest.fn(),
    setStyle: jest.fn(),
    setHidden: jest.fn(),
    setTranslucent: jest.fn(),
    getConstants: () => ({
        DEFAULT_BACKGROUND_COLOR: 'black',
        HEIGHT: 42,
    }),
};

jest.mock('../NativeStatusBarManagerAndroid', () => ({
    __esModule: true,
    default: NativeStatusBarManagerAndroid,
}));

jest.mock('../../../StyleSheet/processColor', () =>
    jest.fn(color => {
        if (color === 'red') {
            return -65536;
        } // 0xFFFF0000 -> signed int
        if (color === 'blue') {
            return -16776961;
        }
        return 0;
    }),
);

jest.mock('../../../Utilities/Platform', () => ({
    OS: 'android',
    select: objs => objs.android,
    isTesting: true,
}));

const { create, update } = require('../../../../jest/renderer');
const React = require('react');
const StatusBar = require('../StatusBar').default;

describe('StatusBar Android Optimization', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('does not call setColor if backgroundColor is unchanged', async () => {
        const component = await create(<StatusBar backgroundColor="red" />);
        jest.runAllTimers();
        // First mount calls native module
        expect(NativeStatusBarManagerAndroid.setColor).toHaveBeenCalled();
        NativeStatusBarManagerAndroid.setColor.mockClear();

        // Update with same color
        await update(component, <StatusBar backgroundColor="red" />);
        jest.runAllTimers();
        // Should NOT call native module
        expect(NativeStatusBarManagerAndroid.setColor).not.toHaveBeenCalled();

        // Update with different color
        await update(component, <StatusBar backgroundColor="blue" />);
        jest.runAllTimers();
        // Should call native module
        expect(NativeStatusBarManagerAndroid.setColor).toHaveBeenCalled();
    });

    it('does not call setStyle if barStyle is unchanged', async () => {
        const component = await create(<StatusBar barStyle="light-content" />);
        jest.runAllTimers();
        expect(NativeStatusBarManagerAndroid.setStyle).toHaveBeenCalled();
        NativeStatusBarManagerAndroid.setStyle.mockClear();

        await update(component, <StatusBar barStyle="light-content" />);
        jest.runAllTimers();
        expect(NativeStatusBarManagerAndroid.setStyle).not.toHaveBeenCalled();

        await update(component, <StatusBar barStyle="dark-content" />);
        jest.runAllTimers();
        expect(NativeStatusBarManagerAndroid.setStyle).toHaveBeenCalled();
    });
});
