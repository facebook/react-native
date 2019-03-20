/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

/* global element, by, expect */

// Will open a component example from the root list
// by filtering by component and then tapping on the label
exports.openComponentWithLabel = async (component, label) => {
  await element(by.id('explorer_search')).replaceText(component);
  await element(by.label(label)).tap();
};

// Will open an individual example for a component
// by filtering on the example title
exports.openExampleWithTitle = async title => {
  await element(by.id('example_search')).replaceText(title);
};
