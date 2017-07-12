'use strict';

module.exports = function findLineToAddPod(podLines, firstTargetLine){

  // match line with new targe: target 'project_name' do (most likely target inside podfile main target)
  const nextTarget = /target (\'|\")\w+(\'|\") do/g;
  // match line that has only 'end' (if we don't catch new target or function, this would mean this is end of current target)
  const endOfCurrentTarget = /^\s*end\s*$/g;
  // match function defeinition, like: post_install do |installer| (some Podfiles have function defined inside main target
  const functionDefinition = /^\s*[a-z_]+\s+do(\s+\|[a-z]+\|)?/g;

  for (let i = firstTargetLine, len = podLines.length; i < len; i++) {
    const match = podLines[i].match(nextTarget) || podLines[i].match(endOfCurrentTarget) || podLines[i].match(functionDefinition);
    if (match) {
      return i;
    }
  }
  return null;
};
