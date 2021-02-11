function stripInformation(
  internalInstanceHandle
) {
  var possibleCause = "\n\nProbably result of a conditional rendering using boolean concatination as in `cond && <Component ...>`.";
  if (internalInstanceHandle && internalInstanceHandle.sibling) {
    var debugOwner = internalInstanceHandle.sibling._debugOwner;
    var debugSource = internalInstanceHandle.sibling._debugSource;
    if (debugOwner && debugSource) {
      var parentComponentName = debugOwner.type.name;
      var siblingSource = "\"" + debugSource.fileName + "\" line " + debugSource.lineNumber + ", column " + debugSource.columnNumber;
      return " Error may have occured in component <" + parentComponentName + "> near " + siblingSource + "." + possibleCause;
    }
  }
  return possibleCause;
}

module.exports = function assertTextRendersInParent(
  hostContext,
  text,
  internalInstanceHandle
) {
  if (!hostContext.isInAParentText) {
    throw Error("Text string \"" + text + "\" must be rendered within a <Text> component." + stripInformation(internalInstanceHandle));
  }
}
