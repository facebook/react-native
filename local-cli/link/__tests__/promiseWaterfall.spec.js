/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const sinon = require('sinon');
const promiseWaterfall = require('../promiseWaterfall');

describe('promiseWaterfall', () => {

  it('should run promises in a sequence', (done) => {
    const tasks = [sinon.stub(), sinon.stub()];

    promiseWaterfall(tasks).then(() => {
      expect(tasks[0].calledBefore(tasks[1])).toBeTruthy();
      done();
    });
  });

  it('should resolve with last promise value', (done) => {
    const tasks = [sinon.stub().returns(1), sinon.stub().returns(2)];

    promiseWaterfall(tasks).then(value => {
      expect(value).toEqual(2);
      done();
    });
  });

  it('should stop the sequence when one of promises is rejected', (done) => {
    const error = new Error();
    const tasks = [sinon.stub().throws(error), sinon.stub().returns(2)];

    promiseWaterfall(tasks).catch(err => {
      expect(err).toEqual(error);
      expect(tasks[1].callCount).toEqual(0);
      done();
    });
  });

});
