/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

export type UIExplorerListWithFilterAction = {
  type: 'UIExplorerListWithFilterAction',
  filter: ?string;
};

export type UIExplorerExampleAction = {
  type: 'UIExplorerExampleAction',
  openExample: string;
};

export type UIExplorerAction = UIExplorerListWithFilterAction | UIExplorerExampleAction;

function ExampleListWithFilter(filter: ?string): UIExplorerListWithFilterAction {
  return {
    type: 'UIExplorerListWithFilterAction',
    filter,
  };
}

function ExampleAction(openExample: string): UIExplorerExampleAction {
  return {
    type: 'UIExplorerExampleAction',
    openExample,
  };
}

const UIExplorerActions = {
  ExampleListWithFilter,
  ExampleAction,
};

module.exports = UIExplorerActions;
