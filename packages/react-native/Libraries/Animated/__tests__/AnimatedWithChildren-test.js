/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

describe('AnimatedWithChildren', () => {
  let AnimatedWithChildren;
  let AnimatedValue;

  beforeEach(() => {
    jest.resetModules();
    AnimatedWithChildren = require('../nodes/AnimatedWithChildren').default;
    AnimatedValue = require('../nodes/AnimatedValue').default;
  });

  it('adds a child to the children array when it is not already present', () => {
    const parent = new AnimatedWithChildren();
    const child = new AnimatedValue(0);

    expect(parent.__getChildren().length).toBe(0);

    parent.__addChild(child);
    expect(parent.__getChildren().length).toBe(1);
    expect(parent.__getChildren()).toContain(child);
  });

  it('prevents adding the same child more than once to the children array', () => {
    const parent = new AnimatedWithChildren();
    const child = new AnimatedValue(0);

    parent.__addChild(child);
    expect(parent.__getChildren().length).toBe(1);

    parent.__addChild(child);
    expect(parent.__getChildren().length).toBe(1);
  });

  it('removes a child correctly from the children array when it exists', () => {
    const parent = new AnimatedWithChildren();
    const child1 = new AnimatedValue(0);
    const child2 = new AnimatedValue(10);

    parent.__addChild(child1);
    parent.__addChild(child2);
    expect(parent.__getChildren().length).toBe(2);

    parent.__removeChild(child1);
    expect(parent.__getChildren().length).toBe(1);
    expect(parent.__getChildren()).not.toContain(child1);
    expect(parent.__getChildren()).toContain(child2);

    parent.__removeChild(child2);
    expect(parent.__getChildren().length).toBe(0);
  });

  it('safely ignores removal calls for non-existent children in the children array', () => {
    const parent = new AnimatedWithChildren();
    const child = new AnimatedValue(0);

    parent.__addChild(child);
    expect(parent.__getChildren().length).toBe(1);

    parent.__removeChild(child);
    expect(parent.__getChildren().length).toBe(0);

    expect(() => parent.__removeChild(child)).not.toThrow();
    expect(parent.__getChildren().length).toBe(0);
  });
});
