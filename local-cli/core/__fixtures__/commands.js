/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

exports.single = {
  func: () => {},
  description: 'Test action',
  name: 'test',
};

exports.multiple = [
  {
    func: () => {},
    description: 'Test action #1',
    name: 'test1',
  },
  {
    func: () => {},
    description: 'Test action #2',
    name: 'test2',
  },
];
