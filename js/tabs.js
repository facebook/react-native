const currentTabs = {};

function isActiveBlock(block) {
  for (let tab of Object.values(currentTabs)) {
    if (!block.classList.contains(tab)) {
      return false;
    }
  }
  return true;
}

function displayTab(type, value) {
  const list = document.getElementById(`toggle-${type}`);
  // short circuit if there is no toggle for this tab type
  if (!list) {
    return;
  }
  currentTabs[type] = value;
  [...list.children].forEach(child => {
    if (child.classList.contains(`button-${value}`)) {
      child.classList.add('active');
      child.setAttribute('aria-selected', true);
    } else {
      child.classList.remove('active');
      child.setAttribute('aria-selected', false);
    }
  });

  var container = document.getElementsByTagName('block')[0].parentNode;
  [...container.children].forEach(child => {
    if (child.tagName !== 'BLOCK') {
      return;
    }
    if (isActiveBlock(child)) {
      child.classList.add('active');
    } else {
      child.classList.remove('active');
    }
  });
}

// DisplayTabs are when you want to show multiple togglers on the same page, independent of each other.
// See introduction.md for syntax.
function displayTabs(type, value) {
  const list = document.getElementsByClassName(`toggle-${type}`);
  // short circuit if there is no toggle for this tab type
  if (!list) {
    return;
  }
  [...list].forEach(child => {
    [...child.children].forEach(grandchild => {
      if (grandchild.classList.contains(`button-${value}`)) {
        grandchild.classList.add('active');
        grandchild.setAttribute('aria-selected', true);
      } else {
        grandchild.classList.remove('active');
        grandchild.setAttribute('aria-selected', false);
      }
    });
  });

  var container = document.getElementsByTagName('block')[0].parentNode;
  [...container.children].forEach(child => {
    if (child.tagName !== 'BLOCK') {
      return;
    }
    if (child.classList.contains('endBlock')) {
      child.classList.add('active');
    }
    if (
      child.classList.contains(type) &&
      !child.classList.contains('endBlock')
    ) {
      if (child.classList.contains(value)) {
        child.classList.add('active');
      } else {
        child.classList.remove('active');
      }
    }
  });
}

function convertBlocks() {
  // Convert <div>...<span><block /></span>...</div>
  // Into <div>...<block />...</div>
  var blocks = document.querySelectorAll('block');
  for (var i = 0; i < blocks.length; ++i) {
    var block = blocks[i];
    var span = blocks[i].parentNode;
    var container = span.parentNode;
    container.insertBefore(block, span);
    container.removeChild(span);
  }
  // Convert <div>...<block />content<block />...</div>
  // Into <div>...<block>content</block><block />...</div>
  blocks = document.querySelectorAll('block');
  for (var i = 0; i < blocks.length; ++i) {
    var block = blocks[i];
    while (block.nextSibling && block.nextSibling.tagName !== 'BLOCK') {
      block.appendChild(block.nextSibling);
    }
  }
}
function guessPlatformAndOS() {
  if (!document.querySelector('block')) {
    return;
  }
  // If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
  // us as close as possible to the correct platform and dev os using the hashtag and block walk up.
  var foundHash = false;
  if (window.location.hash !== '' && window.location.hash !== 'content') {
    // content is default
    var hashLinks = document.querySelectorAll('a.hash-link');
    for (var i = 0; i < hashLinks.length && !foundHash; ++i) {
      if (hashLinks[i].hash === window.location.hash) {
        var parent = hashLinks[i].parentElement;
        while (parent) {
          if (parent.tagName === 'BLOCK') {
            // Could be more than one target os and dev platform, but just choose some sort of order
            // of priority here.
            // Dev OS
            if (parent.className.indexOf('mac') > -1) {
              displayTab('os', 'mac');
              foundHash = true;
            } else if (parent.className.indexOf('linux') > -1) {
              displayTab('os', 'linux');
              foundHash = true;
            } else if (parent.className.indexOf('windows') > -1) {
              displayTab('os', 'windows');
              foundHash = true;
            } else {
              break;
            }
            // Dev Notes
            if (parent.className.indexOf('androidNote') > -1) {
              displayTabs('devNotes', 'androidNote');
              foundHash = true;
            } else if (parent.className.indexOf('iosNote') > -1) {
              displayTabs('devNotes', 'iosNote');
              foundHash = true;
            } else if (parent.className.indexOf('windowsNote') > -1) {
              displayTabs('devNotes', 'windowsNote');
              foundHash = true;
            } else if (parent.className.indexOf('webNote') > -1) {
              displayTabs('devNotes', 'webNote');
              foundHash = true;
            } else {
              break;
            }
            // Syntax
            if (parent.className.indexOf('functional') > -1) {
              displayTabs('syntax', 'functional');
              foundHash = true;
            } else if (parent.className.indexOf('classical') > -1) {
              displayTabs('syntax', 'classical');
              foundHash = true;
            } else {
              break;
            }
            // Target Platform
            if (parent.className.indexOf('ios') > -1) {
              displayTab('platform', 'ios');
              foundHash = true;
            } else if (parent.className.indexOf('android') > -1) {
              displayTab('platform', 'android');
              foundHash = true;
            } else {
              break;
            }
            // Guide
            if (parent.className.indexOf('native') > -1) {
              displayTab('guide', 'native');
              foundHash = true;
            } else if (parent.className.indexOf('quickstart') > -1) {
              displayTab('guide', 'quickstart');
              foundHash = true;
            } else {
              break;
            }
            break;
          }
          parent = parent.parentElement;
        }
      }
    }
  }
  // Do the default if there is no matching hash
  if (!foundHash) {
    var isMac = navigator.platform === 'MacIntel';
    var isWindows = navigator.platform === 'Win32';
    displayTab('platform', isMac ? 'ios' : 'android');
    displayTab('os', isMac ? 'mac' : isWindows ? 'windows' : 'linux');
    displayTab('guide', 'quickstart');
    displayTab('language', 'objc');
    displayTabs('syntax', 'functional');
    displayTabs('devNotes', 'webNote');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  convertBlocks();
  guessPlatformAndOS();
});
