/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require("fs")
const log = require('npmlog')
const applyParams = require("./applyParams")

function getPatchAndPattern(patch) {
  return {
    pattern: "new MainReactPackage()",
    patch
  }
}

function applyPackagePatch(
  packageInstance,
  params,
  prefix) {
  const processedInstance = applyParams(packageInstance, params, prefix)
  return getPatchAndPattern(',\n            ' + processedInstance)
}

function revokePackagePatch(file,
  packageInstance,
  params,
  prefix) {
  let processedInstance = applyParams(packageInstance, params, prefix).replace(
    /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    "\\$&"
  )
  let fileStream = fs.readFileSync(file, "utf8")

  return getPatchAndPattern(
    fileStream.match(
      new RegExp(
        `(,\\s*${processedInstance}|${processedInstance}\\s*,|\\s*${processedInstance}\\s*)`,
        "g"
      )
    ) || ""
  )
}

module.exports = {
  applyPackagePatch,
  revokePackagePatch
};
