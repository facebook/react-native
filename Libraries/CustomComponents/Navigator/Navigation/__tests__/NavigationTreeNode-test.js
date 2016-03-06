/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 */

'use strict';

jest
  .dontMock('NavigationTreeNode')
  .dontMock('fbjs/lib/invariant')
  .dontMock('immutable');

var NavigationTreeNode = require('NavigationTreeNode');

describe('NavigationTreeNode-test', () => {
  it('should be empty', () => {
    var node = new NavigationTreeNode();
    expect(node.getValue()).toEqual(undefined);
    expect(node.getParent()).toEqual(null);
    expect(node.getChildrenCount()).toEqual(0);
    expect(node.getChildAt(0)).toEqual(null);
  });


  it('should contain value', () => {
    var node = new NavigationTreeNode(123);
    expect(node.getValue()).toEqual(123);
  });

  it('should appendChild', () => {
    var papa = new NavigationTreeNode('hedger');
    var baby = new NavigationTreeNode('hedger jr');
    papa.appendChild(baby);
    expect(papa.getChildAt(0)).toEqual(baby);
    expect(papa.getChildrenCount()).toEqual(1);
    expect(baby.getParent()).toEqual(papa);
  });

  it('should removeChild', () => {
    var papa = new NavigationTreeNode('Eddard Stark');
    var baby = new NavigationTreeNode('Robb Stark');
    papa.appendChild(baby);

    papa.removeChild(baby);
    expect(papa.getChildAt(0)).toEqual(null);
    expect(papa.getChildrenCount()).toEqual(0);
    expect(baby.getParent()).toEqual(null);
  });

  it('should not remove non-child', () => {
    var papa = new NavigationTreeNode('dog');
    var baby = new NavigationTreeNode('cat');
    expect(papa.removeChild.bind(papa, baby)).toThrow();
  });

  it('should find child', () => {
    var papa = new NavigationTreeNode('Eddard Stark');
    var baby = new NavigationTreeNode('Robb Stark');

    papa.appendChild(baby);
    expect(papa.indexOf(baby)).toEqual(0);

    papa.removeChild(baby);
    expect(papa.indexOf(baby)).toEqual(-1);
  });


  it('should traverse each child', () => {
    var parent = new NavigationTreeNode();
    parent.appendChild(new NavigationTreeNode('a'));
    parent.appendChild(new NavigationTreeNode('b'));
    parent.appendChild(new NavigationTreeNode('c'));
    var result = [];
    parent.forEach((child, index) => {
      result[index] = child.getValue();
    });

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should map children', () => {
    var parent = new NavigationTreeNode();
    parent.appendChild(new NavigationTreeNode('a'));
    parent.appendChild(new NavigationTreeNode('b'));
    parent.appendChild(new NavigationTreeNode('c'));
    var result = parent.map((child, index) => {
      return child.getValue();
    });

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should traverse some children', () => {
    var parent = new NavigationTreeNode();
    parent.appendChild(new NavigationTreeNode('a'));
    parent.appendChild(new NavigationTreeNode('b'));
    parent.appendChild(new NavigationTreeNode('c'));

    var result = [];
    var value = parent.some((child, index) => {
      if (index > 1) {
        return true;
      } else {
        result[index] = child.getValue();
      }
    });

    expect(value).toEqual(true);
    expect(result).toEqual(['a', 'b']);
  });
});
