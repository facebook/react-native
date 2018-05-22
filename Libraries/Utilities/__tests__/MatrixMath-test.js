/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const MatrixMath = require('MatrixMath');

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function convertZeroes(degrees) {
  return degrees.map(value => (value === -0 ? 0 : value));
}

describe('MatrixMath', () => {
  it('decomposes a 4x4 matrix to produce accurate Z-axis angles', () => {
    expect(
      MatrixMath.decomposeMatrix([
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ]).rotationDegrees,
    ).toEqual([0, 0, 0]);

    [30, 45, 60, 75, 90, 100, 115, 120, 133, 167].forEach(angle => {
      let mat = MatrixMath.createRotateZ(degreesToRadians(angle));
      expect(
        convertZeroes(MatrixMath.decomposeMatrix(mat).rotationDegrees),
      ).toEqual([0, 0, angle]);

      mat = MatrixMath.createRotateZ(degreesToRadians(-angle));
      expect(
        convertZeroes(MatrixMath.decomposeMatrix(mat).rotationDegrees),
      ).toEqual([0, 0, -angle]);
    });

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(180)),
      ).rotationDegrees,
    ).toEqual([0, 0, 180]);

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(222)),
      ).rotationDegrees,
    ).toEqual([0, 0, -138]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(270)),
      ).rotationDegrees,
    ).toEqual([0, 0, -90]);

    // 360 is expressed as 0
    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(360)),
      ).rotationDegrees,
    ).toEqual([0, 0, -0]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(33.33333333)),
      ).rotationDegrees,
    ).toEqual([0, 0, 33.333]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(86.75309)),
      ).rotationDegrees,
    ).toEqual([0, 0, 86.753]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(42.00000000001)),
      ).rotationDegrees,
    ).toEqual([0, 0, 42]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(42.99999999999)),
      ).rotationDegrees,
    ).toEqual([0, 0, 43]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(42.49999999999)),
      ).rotationDegrees,
    ).toEqual([0, 0, 42.5]);

    expect(
      MatrixMath.decomposeMatrix(
        MatrixMath.createRotateZ(degreesToRadians(42.55555555555)),
      ).rotationDegrees,
    ).toEqual([0, 0, 42.556]);
  });

  it('decomposes a 4x4 matrix to produce accurate Y-axis angles', () => {
    let mat;
    [30, 45, 60, 75, 90, 100, 110, 120, 133, 167].forEach(angle => {
      mat = MatrixMath.createIdentityMatrix();
      MatrixMath.reuseRotateYCommand(mat, degreesToRadians(angle));
      expect(
        convertZeroes(MatrixMath.decomposeMatrix(mat).rotationDegrees),
      ).toEqual([0, angle, 0]);

      mat = MatrixMath.createIdentityMatrix();
      MatrixMath.reuseRotateYCommand(mat, degreesToRadians(-angle));
      expect(
        convertZeroes(MatrixMath.decomposeMatrix(mat).rotationDegrees),
      ).toEqual([0, -angle, 0]);
    });

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateYCommand(mat, degreesToRadians(222));
    expect(MatrixMath.decomposeMatrix(mat).rotationDegrees).toEqual([
      0,
      -138,
      0,
    ]);

    mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateYCommand(mat, degreesToRadians(270));
    expect(MatrixMath.decomposeMatrix(mat).rotationDegrees).toEqual([
      0,
      -90,
      0,
    ]);

    mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateYCommand(mat, degreesToRadians(360));
    expect(MatrixMath.decomposeMatrix(mat).rotationDegrees).toEqual([0, 0, 0]);
  });

  it('decomposes a 4x4 matrix to produce accurate X-axis angles', () => {
    let mat;
    [30, 45, 60, 75, 90, 100, 110, 120, 133, 167].forEach(angle => {
      mat = MatrixMath.createIdentityMatrix();
      MatrixMath.reuseRotateXCommand(mat, degreesToRadians(angle));
      expect(
        convertZeroes(MatrixMath.decomposeMatrix(mat).rotationDegrees),
      ).toEqual([angle, 0, 0]);
    });

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateXCommand(mat, degreesToRadians(222));
    expect(MatrixMath.decomposeMatrix(mat).rotationDegrees).toEqual([
      -138,
      0,
      0,
    ]);

    mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateXCommand(mat, degreesToRadians(270));
    expect(MatrixMath.decomposeMatrix(mat).rotationDegrees).toEqual([
      -90,
      0,
      0,
    ]);

    mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateXCommand(mat, degreesToRadians(360));
    expect(MatrixMath.decomposeMatrix(mat).rotationDegrees).toEqual([0, 0, 0]);
  });
});
