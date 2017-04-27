/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');

const {dirname} = require('path');

import type {Callback} from '../types.flow';

type Path = string;
type WorkerFn<Options> = (
  fileContents: Buffer,
  options: Options,
  callback: Callback<Object>,
) => void;
export type WorkerFnWithIO<Options> = (
  infile: Path,
  outfile: Path,
  options: Options,
  callback: Callback<>,
) => void;

function wrapWorkerFn<Options>(
  workerFunction: WorkerFn<Options>,
): WorkerFnWithIO<Options> {
  return (
    infile: Path,
    outfile: Path,
    options: Options,
    callback: Callback<>,
  ) => {
    const contents = fs.readFileSync(infile);
    workerFunction(contents, options, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      try {
        mkdirp.sync(dirname(outfile));
        fs.writeFileSync(outfile, JSON.stringify(result), 'utf8');
      } catch (writeError) {
        callback(writeError);
        return;
      }

      callback(null);
    });
  };
}

module.exports = wrapWorkerFn;
