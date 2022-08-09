/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {CellRenderMask} from '../CellRenderMask';

describe('CellRenderMask', () => {
  it('throws when constructed with invalid size', () => {
    expect(() => new CellRenderMask(-1)).toThrow();
  });

  it('allows creation of empty mask', () => {
    const renderMask = new CellRenderMask(0);
    expect(renderMask.enumerateRegions()).toEqual([]);
  });

  it('allows creation of single-cell mask', () => {
    const renderMask = new CellRenderMask(1);
    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 0, isSpacer: true},
    ]);
  });

  it('throws when adding invalid cell ranges', () => {
    const renderMask = new CellRenderMask(5);

    expect(() => renderMask.addCells({first: -1, last: 0})).toThrow();
    expect(() => renderMask.addCells({first: 1, last: 0})).toThrow();
    expect(() => renderMask.addCells({first: 0, last: 5})).toThrow();
    expect(() => renderMask.addCells({first: 6, last: 7})).toThrow();
  });

  it('allows adding single cell at beginning', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 0, last: 0});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 0, isSpacer: false},
      {first: 1, last: 4, isSpacer: true},
    ]);
  });

  it('allows adding single cell at end', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 4, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 3, isSpacer: true},
      {first: 4, last: 4, isSpacer: false},
    ]);
  });

  it('allows adding single cell in middle', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 2, last: 2});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 2, isSpacer: false},
      {first: 3, last: 4, isSpacer: true},
    ]);
  });

  it('allows marking entire cell range', () => {
    const renderMask = new CellRenderMask(5);
    renderMask.addCells({first: 0, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 4, isSpacer: false},
    ]);
  });

  it('correctly replaces fragmented cell ranges', () => {
    const renderMask = new CellRenderMask(10);

    renderMask.addCells({first: 3, last: 3});
    renderMask.addCells({first: 5, last: 7});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
      {first: 5, last: 7, isSpacer: false},
      {first: 8, last: 9, isSpacer: true},
    ]);

    renderMask.addCells({first: 3, last: 7});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 7, isSpacer: false},
      {first: 8, last: 9, isSpacer: true},
    ]);
  });

  it('left-expands region', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 2, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);
  });

  it('right-expands region', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 3, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 4, isSpacer: false},
    ]);
  });

  it('left+right expands region', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 2, isSpacer: true},
      {first: 3, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 2, last: 4});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 4, isSpacer: false},
    ]);
  });

  it('does nothing when adding existing cells', () => {
    const renderMask = new CellRenderMask(5);

    renderMask.addCells({first: 2, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);

    renderMask.addCells({first: 3, last: 3});

    expect(renderMask.enumerateRegions()).toEqual([
      {first: 0, last: 1, isSpacer: true},
      {first: 2, last: 3, isSpacer: false},
      {first: 4, last: 4, isSpacer: true},
    ]);
  });
});
