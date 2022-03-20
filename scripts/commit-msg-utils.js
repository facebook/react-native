const CHANGE_TYPE = [
  'breaking',
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
  'unknown',
  'failed',
];

 const CHANGE_CATEGORY = [
  'android',
  'ios',
  'general',
  'internal',
];

// [CATEGORY] [TYPE] - MESSAGE
const CHANGELOG_LINE_REGEXP = new RegExp(
  `(\\[(${[...CHANGE_TYPE, ...CHANGE_CATEGORY].join('|')})\\]s*)+`,
  'i'
);

function isAndroidCommit(change) {
  return (
    !/(\[ios\]|\[general\])/i.test(change) &&
    (/\b(android|java)\b/i.test(change) || /android/i.test(change))
  );
}

function isIOSCommit(change) {
  return (
    !/(\[android\]|\[general\])/i.test(change) &&
    (/\b(ios|xcode|swift|objective-c|iphone|ipad)\b/i.test(change) ||
      /ios\b/i.test(change) ||
      /\brct/i.test(change))
  );
}

function isBreaking(change) {
  return /\b(breaking)\b/i.test(change);
}

function isAdded(change) {
  return /\b(added)\b/i.test(change);
}

function isChanged(change) {
  return /\b(changed)\b/i.test(change);
}

function isDeprecated(change) {
  return /\b(deprecated)\b/i.test(change);
}

function isRemoved(change) {
  return /\b(removed)\b/i.test(change);
}

function isFixed(change) {
  return /\b(fixed)\b/i.test(change);
}

function isSecurity(change) {
  return /\b(security)\b/i.test(change);
}

function isFabric(change) {
  return /\b(fabric)\b/i.test(change);
}

function isTurboModules(change) {
  return /\b(tm)\b/i.test(change);
}

function isInternal(change) {
  return /\[internal\]/i.test(change);
}

function getChangeType(changelogMsg, commitMsg) {
  if (isBreaking(changelogMsg)) {
    return 'breaking';
  } else if (isAdded(changelogMsg)) {
    return 'added';
  } else if (isChanged(changelogMsg)) {
    return 'changed';
  } else if (isFixed(changelogMsg)) {
    return 'fixed';
  } else if (isRemoved(changelogMsg)) {
    return 'removed';
  } else if (isDeprecated(changelogMsg)) {
    return 'deprecated';
  } else if (isSecurity(commitMsg)) {
    return 'security';
  } else if (commitMsg.match(/changelog/i)) {
    return 'failed';
  } else {
    return 'unknown';
  }
}

function getChangeCategory(commitMsg) {
  if (isAndroidCommit(commitMsg)) {
    return 'android';
  } else if (isIOSCommit(commitMsg)) {
    return 'ios';
  } else {
    return 'general';
  }
}
 function getChangeDimensions(commitMsg) {
  let changelogMsg = commitMsg.split('\n').find((line) => {
    return CHANGELOG_LINE_REGEXP.test(line);
  });
  const doesNotFollowTemplate = !changelogMsg;
  if (!changelogMsg) {
    changelogMsg = commitMsg;
  }

  return {
    doesNotFollowTemplate,
    changeCategory: getChangeCategory(changelogMsg),
    changeType: getChangeType(changelogMsg, commitMsg),
    fabric: isFabric(changelogMsg.split('\n')[0]),
    internal: isInternal(changelogMsg),
    turboModules: isTurboModules(changelogMsg.split('\n')[0]),
  };
}

function getChangeMessage(commitMsg) {
  const commitMessage = commitMsg.split('\n');
  let entry =
    commitMessage
      .reverse()
      .find((a) => /\[ios\]|\[android\]|\[general\]/i.test(a)) ||
    commitMessage.reverse()[0];
  entry = entry.replace(/^((changelog:\s*)?(\[\w+\]\s?)+[\s-]*)/i, ''); //Remove the [General] [whatever]
  entry = entry.replace(/ \(#\d*\)$/i, ''); //Remove the PR number if it's on the end

  // Capitalize
  if (/^[a-z]/.test(entry)) {
    entry = entry.slice(0, 1).toUpperCase() + entry.slice(1);
  }

  return entry;
}

module.exports = {getChangeDimensions, getChangeMessage};
