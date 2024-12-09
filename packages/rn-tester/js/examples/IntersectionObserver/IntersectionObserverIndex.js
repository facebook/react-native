/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as IntersectionObserverBenchmark from './IntersectionObserverBenchmark';
import * as IntersectionObserverMDNExample from './IntersectionObserverMDNExample';
import * as IntersectionObserverRootThreshold from './IntersectionObserverRootThreshold';

export const framework = 'React';
export const title = 'IntersectionObserver';
export const category = 'UI';
export const documentationURL =
  'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API';
export const description =
  'API to detect paint times for elements and changes in their intersections with other elements.';
export const showIndividualExamples = true;
export const examples = [
  IntersectionObserverMDNExample,
  IntersectionObserverBenchmark,
  IntersectionObserverRootThreshold,
];
