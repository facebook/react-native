/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

type SpringConfigType = {
  stiffness: number,
  damping: number,
  ...
};

function stiffnessFromOrigamiValue(oValue: number) {
  return (oValue - 30) * 3.62 + 194;
}

function dampingFromOrigamiValue(oValue: number) {
  return (oValue - 8) * 3 + 25;
}

export function fromOrigamiTensionAndFriction(
  tension: number,
  friction: number,
): SpringConfigType {
  return {
    stiffness: stiffnessFromOrigamiValue(tension),
    damping: dampingFromOrigamiValue(friction),
  };
}

export function fromBouncinessAndSpeed(
  bounciness: number,
  speed: number,
): SpringConfigType {
  function normalize(value: number, startValue: number, endValue: number) {
    return (value - startValue) / (endValue - startValue);
  }

  function projectNormal(n: number, start: number, end: number) {
    return start + n * (end - start);
  }

  function linearInterpolation(t: number, start: number, end: number) {
    return t * end + (1 - t) * start;
  }

  function quadraticOutInterpolation(t: number, start: number, end: number) {
    return linearInterpolation(2 * t - t * t, start, end);
  }

  function b3Friction1(x: number) {
    return 0.0007 * Math.pow(x, 3) - 0.031 * Math.pow(x, 2) + 0.64 * x + 1.28;
  }

  function b3Friction2(x: number) {
    return 0.000044 * Math.pow(x, 3) - 0.006 * Math.pow(x, 2) + 0.36 * x + 2;
  }

  function b3Friction3(x: number) {
    return (
      0.00000045 * Math.pow(x, 3) -
      0.000332 * Math.pow(x, 2) +
      0.1078 * x +
      5.84
    );
  }

  function b3Nobounce(tension: number) {
    if (tension <= 18) {
      return b3Friction1(tension);
    } else if (tension > 18 && tension <= 44) {
      return b3Friction2(tension);
    } else {
      return b3Friction3(tension);
    }
  }

  let b = normalize(bounciness / 1.7, 0, 20);
  b = projectNormal(b, 0, 0.8);
  const s = normalize(speed / 1.7, 0, 20);
  const bouncyTension = projectNormal(s, 0.5, 200);
  const bouncyFriction = quadraticOutInterpolation(
    b,
    b3Nobounce(bouncyTension),
    0.01,
  );

  return {
    stiffness: stiffnessFromOrigamiValue(bouncyTension),
    damping: dampingFromOrigamiValue(bouncyFriction),
  };
}
