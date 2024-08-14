/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow-strict
 * @format
 * @oncall react_native
 */

'use strict';

const {create, unmount, update} = require('../../../../jest/renderer');
const Text = require('../../../Text/Text');
const ReactNativeTestTools = require('../../../Utilities/ReactNativeTestTools');
const View = require('../../View/View');
const ScrollView = require('../ScrollView');
const React = require('react');

describe('ScrollView', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('renders its children', async () => {
    await ReactNativeTestTools.expectRendersMatchingSnapshot(
      'ScrollView',
      () => (
        <ScrollView>
          <View>
            <Text>Hello World!</Text>
          </View>
        </ScrollView>
      ),
      () => {
        jest.dontMock('../ScrollView');
      },
    );
  });

  it('mocks native methods and instance methods', async () => {
    jest.mock('../ScrollView');

    const ref = React.createRef();
    await create(<ScrollView ref={ref} />);

    expect(ref.current?.measure).toBeInstanceOf(jest.fn().constructor);
    expect(ref.current?.scrollTo).toBeInstanceOf(jest.fn().constructor);
  });

  describe('ref', () => {
    it('receives an instance or null', async () => {
      jest.dontMock('../ScrollView');

      const scrollViewRef = jest.fn();
      const testRendererInstance = await create(
        <ScrollView ref={scrollViewRef} />,
      );

      expect(scrollViewRef).toHaveBeenLastCalledWith(
        expect.objectContaining({_nativeTag: expect.any(Number)}),
      );

      await unmount(testRendererInstance);

      expect(scrollViewRef).toHaveBeenLastCalledWith(null);
    });

    it('transitions between refs', async () => {
      jest.dontMock('../ScrollView');

      const scrollViewRefA = jest.fn();
      const testRendererInstance = await create(
        <ScrollView ref={scrollViewRefA} />,
      );

      expect(scrollViewRefA).toHaveBeenLastCalledWith(
        expect.objectContaining({_nativeTag: expect.any(Number)}),
      );

      const scrollViewRefB = jest.fn();
      await update(testRendererInstance, <ScrollView ref={scrollViewRefB} />);

      expect(scrollViewRefA).toHaveBeenLastCalledWith(null);
      expect(scrollViewRefB).toHaveBeenLastCalledWith(
        expect.objectContaining({_nativeTag: expect.any(Number)}),
      );
    });
  });

  describe('innerViewRef', () => {
    it('receives an instance or null', async () => {
      jest.dontMock('../ScrollView');

      const innerViewRef = jest.fn();
      const testRendererInstance = await create(
        <ScrollView innerViewRef={innerViewRef} />,
      );

      expect(innerViewRef).toHaveBeenLastCalledWith(
        expect.objectContaining({_nativeTag: expect.any(Number)}),
      );

      await unmount(testRendererInstance);

      expect(innerViewRef).toHaveBeenLastCalledWith(null);
    });

    it('transitions between refs', async () => {
      jest.dontMock('../ScrollView');

      const innerViewRefA = jest.fn();
      const testRendererInstance = await create(
        <ScrollView innerViewRef={innerViewRefA} />,
      );

      expect(innerViewRefA).toHaveBeenLastCalledWith(
        expect.objectContaining({_nativeTag: expect.any(Number)}),
      );

      const innerViewRefB = jest.fn();

      await update(
        testRendererInstance,
        <ScrollView innerViewRef={innerViewRefB} />,
      );

      expect(innerViewRefA).toHaveBeenLastCalledWith(null);
      expect(innerViewRefB).toHaveBeenLastCalledWith(
        expect.objectContaining({_nativeTag: expect.any(Number)}),
      );
    });
  });

  describe('getInnerViewRef', () => {
    it('returns an instance', async () => {
      jest.dontMock('../ScrollView');

      const scrollViewRef = React.createRef(null);
      await create(<ScrollView ref={scrollViewRef} />);
      const innerViewRef = scrollViewRef.current.getInnerViewRef();

      // This is checking if the ref acts like a host component. If we had an
      // `isHostComponent(ref)` method, that would be preferred.
      expect(innerViewRef.measure).toBeInstanceOf(jest.fn().constructor);
      expect(innerViewRef.measureLayout).toBeInstanceOf(jest.fn().constructor);
      expect(innerViewRef.measureInWindow).toBeInstanceOf(
        jest.fn().constructor,
      );
    });
  });
});
