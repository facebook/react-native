'use strict';

jest.autoMockOff();

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
