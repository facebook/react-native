/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = function findLineToAddPod(podLines, firstTargetLine) {
  // match line with new target: target 'project_name' do (most likely target inside podfile main target)
  const nextTarget = /target (\'|\")\w+(\'|\") do/g;
  // match line that has only 'end' (if we don't catch new target or function, this would mean this is end of current target)
  const endOfCurrentTarget = /^\s*end\s*$/g;
  // match function definition, like: post_install do |installer| (some Podfiles have function defined inside main target
  const functionDefinition = /^\s*[a-z_]+\s+do(\s+\|[a-z]+\|)?/g;

  for (let i = firstTargetLine, len = podLines.length; i < len; i++) {
    const matchNextConstruct = podLines[i].match(nextTarget) || podLines[i].match(functionDefinition);
    const matchEnd = podLines[i].match(endOfCurrentTarget);

    if (matchNextConstruct || matchEnd) {
      const firstNonSpaceCharacter = podLines[i].search(/\S/);
      return {
        indentation: firstNonSpaceCharacter + (matchEnd ? 2 : 0),
        line: i
      };
    }
  }
  return null;
};
