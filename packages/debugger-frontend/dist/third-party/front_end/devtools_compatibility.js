// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable indent */
(function(window) {

// DevToolsAPI ----------------------------------------------------------------

/**
 * @typedef {{runtimeAllowedHosts: !Array<string>, runtimeBlockedHosts: !Array<string>}} ExtensionHostsPolicy
 */
/**
 * @typedef {{startPage: string, name: string, exposeExperimentalAPIs: boolean, hostsPolicy?: ExtensionHostsPolicy}} ExtensionDescriptor
 */
const DevToolsAPIImpl = class {
  constructor() {
    /**
     * @type {number}
     */
    this._lastCallId = 0;

    /**
     * @type {!Object.<number, function(?Object)>}
     */
    this._callbacks = {};

    /**
     * @type {!Array.<!ExtensionDescriptor>}
     */
    this._pendingExtensionDescriptors = [];

    /**
     * @type {?function(!ExtensionDescriptor): void}
     */
    this._addExtensionCallback = null;

    /**
     * @type {!Array<string>}
     */
    this._originsForbiddenForExtensions = [];

    /**
     * @type {!Promise<string>}
     */
    this._initialTargetIdPromise = new Promise(resolve => {
      this._setInitialTargetId = resolve;
    });
  }

  /**
   * @param {number} id
   * @param {?Object} arg
   */
  embedderMessageAck(id, arg) {
    const callback = this._callbacks[id];
    delete this._callbacks[id];
    if (callback) {
      callback(arg);
    }
  }

  /**
   * @param {string} method
   * @param {!Array.<*>} args
   * @param {?function(?Object)} callback
   */
  sendMessageToEmbedder(method, args, callback) {
    const callId = ++this._lastCallId;
    if (callback) {
      this._callbacks[callId] = callback;
    }
    const message = {'id': callId, 'method': method};
    if (args.length) {
      message.params = args;
    }
    DevToolsHost.sendMessageToEmbedder(JSON.stringify(message));
  }

  /**
   * @param {string} method
   * @param {!Array<*>} args
   */
  _dispatchOnInspectorFrontendAPI(method, args) {
    const inspectorFrontendAPI = /** @type {!Object<string, function()>} */ (window['InspectorFrontendAPI']);
    if (!inspectorFrontendAPI) {
      // This is the case for device_mode_emulation_frame entrypoint. It's created via `window.open` from
      // the DevTools window, so it shares a context with DevTools but has a separate DevToolsUIBinding and `window` object.
      // We can safely ignore the events since they also arrive on the DevTools `window` object.
      return;
    }
    inspectorFrontendAPI[method].apply(inspectorFrontendAPI, args);
  }

  // API methods below this line --------------------------------------------

  /**
   * @param {!Array.<!ExtensionDescriptor>} extensions
   */
  addExtensions(extensions) {
    // Support for legacy front-ends (<M41).
    if (window['WebInspector'] && window['WebInspector']['addExtensions']) {
      window['WebInspector']['addExtensions'](extensions);
    } else {
      // The addExtensions command is sent as the onload event happens for
      // DevTools front-end. We should buffer this command until the frontend
      // is ready for it.
      if (this._addExtensionCallback) {
        extensions.forEach(this._addExtensionCallback);
      } else {
        this._pendingExtensionDescriptors.push(...extensions);
      }
    }
  }

  /**
   * @param {!Array<string>} forbiddenOrigins
   */
  setOriginsForbiddenForExtensions(forbiddenOrigins) {
    this._originsForbiddenForExtensions = forbiddenOrigins;
  }

  /**
   * @return {!Array<string>}
   */
  getOriginsForbiddenForExtensions() {
    return this._originsForbiddenForExtensions;
  }

  /**
   * @param {string} url
   */
  appendedToURL(url) {
    this._dispatchOnInspectorFrontendAPI('appendedToURL', [url]);
  }

  /**
   * @param {string} url
   */
  canceledSaveURL(url) {
    this._dispatchOnInspectorFrontendAPI('canceledSaveURL', [url]);
  }

  contextMenuCleared() {
    this._dispatchOnInspectorFrontendAPI('contextMenuCleared', []);
  }

  /**
   * @param {string} id
   */
  contextMenuItemSelected(id) {
    this._dispatchOnInspectorFrontendAPI('contextMenuItemSelected', [id]);
  }

  /**
   * @param {number} count
   */
  deviceCountUpdated(count) {
    this._dispatchOnInspectorFrontendAPI('deviceCountUpdated', [count]);
  }

  /**
   * @param {!Adb.Config} config
   */
  devicesDiscoveryConfigChanged(config) {
    this._dispatchOnInspectorFrontendAPI('devicesDiscoveryConfigChanged', [config]);
  }

  /**
   * @param {!Adb.PortForwardingStatus} status
   */
  devicesPortForwardingStatusChanged(status) {
    this._dispatchOnInspectorFrontendAPI('devicesPortForwardingStatusChanged', [status]);
  }

  /**
   * @param {!Array.<!Adb.Device>} devices
   */
  devicesUpdated(devices) {
    this._dispatchOnInspectorFrontendAPI('devicesUpdated', [devices]);
  }

  /**
   * @param {string} message
   */
  dispatchMessage(message) {
    this._dispatchOnInspectorFrontendAPI('dispatchMessage', [message]);
  }

  /**
   * @param {string} messageChunk
   * @param {number} messageSize
   */
  dispatchMessageChunk(messageChunk, messageSize) {
    this._dispatchOnInspectorFrontendAPI('dispatchMessageChunk', [messageChunk, messageSize]);
  }

  enterInspectElementMode() {
    this._dispatchOnInspectorFrontendAPI('enterInspectElementMode', []);
  }

  /**
   * @param {!{r: number, g: number, b: number, a: number}} color
   */
  eyeDropperPickedColor(color) {
    this._dispatchOnInspectorFrontendAPI('eyeDropperPickedColor', [color]);
  }

  /**
   * @param {!Array.<!{fileSystemName: string, rootURL: string, fileSystemPath: string}>} fileSystems
   */
  fileSystemsLoaded(fileSystems) {
    this._dispatchOnInspectorFrontendAPI('fileSystemsLoaded', [fileSystems]);
  }

  /**
   * @param {string} fileSystemPath
   */
  fileSystemRemoved(fileSystemPath) {
    this._dispatchOnInspectorFrontendAPI('fileSystemRemoved', [fileSystemPath]);
  }

  /**
   * @param {?string} error
   * @param {?{type: string, fileSystemName: string, rootURL: string, fileSystemPath: string}} fileSystem
   */
  fileSystemAdded(error, fileSystem) {
    this._dispatchOnInspectorFrontendAPI('fileSystemAdded', [error, fileSystem]);
  }

  /**
   * @param {!Array<string>} changedPaths
   * @param {!Array<string>} addedPaths
   * @param {!Array<string>} removedPaths
   */
  fileSystemFilesChangedAddedRemoved(changedPaths, addedPaths, removedPaths) {
    // Support for legacy front-ends (<M58)
    if (window['InspectorFrontendAPI'] && window['InspectorFrontendAPI']['fileSystemFilesChanged']) {
      this._dispatchOnInspectorFrontendAPI(
          'fileSystemFilesChanged', [changedPaths.concat(addedPaths).concat(removedPaths)]);
    } else {
      this._dispatchOnInspectorFrontendAPI(
          'fileSystemFilesChangedAddedRemoved', [changedPaths, addedPaths, removedPaths]);
    }
  }

  /**
   * @param {number} requestId
   * @param {string} fileSystemPath
   * @param {number} totalWork
   */
  indexingTotalWorkCalculated(requestId, fileSystemPath, totalWork) {
    this._dispatchOnInspectorFrontendAPI('indexingTotalWorkCalculated', [requestId, fileSystemPath, totalWork]);
  }

  /**
   * @param {number} requestId
   * @param {string} fileSystemPath
   * @param {number} worked
   */
  indexingWorked(requestId, fileSystemPath, worked) {
    this._dispatchOnInspectorFrontendAPI('indexingWorked', [requestId, fileSystemPath, worked]);
  }

  /**
   * @param {number} requestId
   * @param {string} fileSystemPath
   */
  indexingDone(requestId, fileSystemPath) {
    this._dispatchOnInspectorFrontendAPI('indexingDone', [requestId, fileSystemPath]);
  }

  /**
   * @param {{type: string, key: string, code: string, keyCode: number, modifiers: number}} event
   */
  keyEventUnhandled(event) {
    event.keyIdentifier = keyCodeToKeyIdentifier(event.keyCode);
    this._dispatchOnInspectorFrontendAPI('keyEventUnhandled', [event]);
  }

  /**
   * @param {function(!ExtensionDescriptor)} callback
   */
  setAddExtensionCallback(callback) {
    this._addExtensionCallback = callback;
    if (this._pendingExtensionDescriptors.length) {
      this._pendingExtensionDescriptors.forEach(this._addExtensionCallback);
      this._pendingExtensionDescriptors = [];
    }
  }

  /**
   * @param {boolean} hard
   */
  reloadInspectedPage(hard) {
    this._dispatchOnInspectorFrontendAPI('reloadInspectedPage', [hard]);
  }

  /**
   * @param {string} url
   * @param {number} lineNumber
   * @param {number} columnNumber
   */
  revealSourceLine(url, lineNumber, columnNumber) {
    this._dispatchOnInspectorFrontendAPI('revealSourceLine', [url, lineNumber, columnNumber]);
  }

  /**
   * @param {string} url
   * @param {string=} fileSystemPath
   */
  savedURL(url, fileSystemPath) {
    this._dispatchOnInspectorFrontendAPI('savedURL', [url, fileSystemPath]);
  }

  /**
   * @param {number} requestId
   * @param {string} fileSystemPath
   * @param {!Array.<string>} files
   */
  searchCompleted(requestId, fileSystemPath, files) {
    this._dispatchOnInspectorFrontendAPI('searchCompleted', [requestId, fileSystemPath, files]);
  }

  colorThemeChanged() {
    this._dispatchOnInspectorFrontendAPI('colorThemeChanged', []);
  }

  /**
   * @param {string} tabId
   */
  setInspectedTabId(tabId) {
    this._inspectedTabIdValue = tabId;

    // Support for legacy front-ends (<M41).
    if (window['WebInspector'] && window['WebInspector']['setInspectedTabId']) {
      window['WebInspector']['setInspectedTabId'](tabId);
    } else {
      this._dispatchOnInspectorFrontendAPI('setInspectedTabId', [tabId]);
    }
  }

  /**
   * @param {string} targetId
   */
  setInitialTargetId(targetId) {
    this._setInitialTargetId(targetId);
  }

  /**
   * @return {string|undefined}
   */
  getInspectedTabId() {
    return this._inspectedTabIdValue;
  }

  /**
   * @param {boolean} useSoftMenu
   */
  setUseSoftMenu(useSoftMenu) {
    this._dispatchOnInspectorFrontendAPI('setUseSoftMenu', [useSoftMenu]);
  }

  /**
   * @param {string} panelName
   */
  showPanel(panelName) {
    this._dispatchOnInspectorFrontendAPI('showPanel', [panelName]);
  }

  /**
   * @param {number} id
   * @param {string} chunk
   * @param {boolean} encoded
   */
  streamWrite(id, chunk, encoded) {
    this._dispatchOnInspectorFrontendAPI('streamWrite', [id, encoded ? this._decodeBase64(chunk) : chunk]);
  }

  /**
   * @param {string} chunk
   * @return {string}
   */
  _decodeBase64(chunk) {
    const request = new XMLHttpRequest();
    request.open('GET', 'data:text/plain;base64,' + chunk, false);
    request.send(null);
    if (request.status === 200) {
      return request.responseText;
    }
    console.error('Error while decoding chunk in streamWrite');
    return '';
  }
};

const DevToolsAPI = new DevToolsAPIImpl();
window.DevToolsAPI = DevToolsAPI;

// InspectorFrontendHostImpl --------------------------------------------------

/**
 * Enum for recordPerformanceHistogram
 * Warning: There is another definition of this enum in the DevTools code
 * base, keep them in sync:
 * front_end/core/host/InspectorFrontendHostAPI.ts
 * @readonly
 * @enum {string}
 */
const EnumeratedHistogram = {
  ActionTaken: 'DevTools.ActionTaken',
  CSSHintShown: 'DevTools.CSSHintShown',
  DeveloperResourceLoaded: 'DevTools.DeveloperResourceLoaded',
  DeveloperResourceScheme: 'DevTools.DeveloperResourceScheme',
  ExperimentDisabled: 'DevTools.ExperimentDisabled',
  ExperimentDisabledAtLaunch: 'DevTools.ExperimentDisabledAtLaunch',
  ExperimentEnabled: 'DevTools.ExperimentEnabled',
  ExperimentEnabledAtLaunch: 'DevTools.ExperimentEnabledAtLaunch',
  IssueCreated: 'DevTools.IssueCreated',
  IssuesPanelIssueExpanded: 'DevTools.IssuesPanelIssueExpanded',
  IssuesPanelOpenedFrom: 'DevTools.IssuesPanelOpenedFrom',
  IssuesPanelResourceOpened: 'DevTools.IssuesPanelResourceOpened',
  KeybindSetSettingChanged: 'DevTools.KeybindSetSettingChanged',
  KeyboardShortcutFired: 'DevTools.KeyboardShortcutFired',
  Language: 'DevTools.Language',
  LighthouseModeRun: 'DevTools.LighthouseModeRun',
  LighthouseCategoryUsed: 'DevTools.LighthouseCategoryUsed',
  ManifestSectionSelected: 'DevTools.ManifestSectionSelected',
  PanelShown: 'DevTools.PanelShown',
  PanelShownInLocation: 'DevTools.PanelShownInLocation',
  RecordingAssertion: 'DevTools.RecordingAssertion',
  RecordingCodeToggled: 'DevTools.RecordingCodeToggled',
  RecordingCopiedToClipboard: 'DevTools.RecordingCopiedToClipboard',
  RecordingEdited: 'DevTools.RecordingEdited',
  RecordingExported: 'DevTools.RecordingExported',
  RecordingReplayFinished: 'DevTools.RecordingReplayFinished',
  RecordingReplaySpeed: 'DevTools.RecordingReplaySpeed',
  RecordingReplayStarted: 'DevTools.RecordingReplayStarted',
  RecordingToggled: 'DevTools.RecordingToggled',
  SidebarPaneShown: 'DevTools.SidebarPaneShown',
  SourcesSidebarTabShown: 'DevTools.Sources.SidebarTabShown',
  SourcesPanelFileDebugged: 'DevTools.SourcesPanelFileDebugged',
  SourcesPanelFileOpened: 'DevTools.SourcesPanelFileOpened',
  NetworkPanelResponsePreviewOpened: 'DevTools.NetworkPanelResponsePreviewOpened',
  StyleTextCopied: 'DevTools.StyleTextCopied',
  SyncSetting: 'DevTools.SyncSetting',
  ColorConvertedFrom: 'DevTools.ColorConvertedFrom',
  ColorPickerOpenedFrom: 'DevTools.ColorPickerOpenedFrom',
  CSSPropertyDocumentation: 'DevTools.CSSPropertyDocumentation',
  SwatchActivated: 'DevTools.SwatchActivated',
  AnimationPlaybackRateChanged: 'DevTools.AnimationPlaybackRateChanged',
  AnimationPointDragged: 'DevTools.AnimationPointDragged',
  LegacyResourceTypeFilterNumberOfSelectedChanged: 'DevTools.LegacyResourceTypeFilterNumberOfSelectedChanged',
  LegacyResourceTypeFilterItemSelected: 'DevTools.LegacyResourceTypeFilterItemSelected',
  ResourceTypeFilterNumberOfSelectedChanged: 'DevTools.ResourceTypeFilterNumberOfSelectedChanged',
  ResourceTypeFilterItemSelected: 'DevTools.ResourceTypeFilterItemSelected',
  NetworkPanelMoreFiltersNumberOfSelectedChanged: 'DevTools.NetworkPanelMoreFiltersNumberOfSelectedChanged',
  NetworkPanelMoreFiltersItemSelected: 'DevTools.NetworkPanelMoreFiltersItemSelected',
};

/**
 * @implements {InspectorFrontendHostAPI}
 */
const InspectorFrontendHostImpl = class {
  /**
   * @return {string}
   */
  getSelectionBackgroundColor() {
    return '#6e86ff';
  }

  /**
   * @return {string}
   */
  getSelectionForegroundColor() {
    return '#ffffff';
  }

  /**
   * @return {string}
   */
  getInactiveSelectionBackgroundColor() {
    return '#c9c8c8';
  }

  /**
   * @return {string}
   */
  getInactiveSelectionForegroundColor() {
    return '#323232';
  }

  /**
   * @override
   * @return {string}
   */
  platform() {
    return DevToolsHost.platform();
  }

  /**
   * @override
   */
  loadCompleted() {
    DevToolsAPI.sendMessageToEmbedder('loadCompleted', [], null);
    // Support for legacy (<57) frontends.
    if (window.Runtime && window.Runtime.queryParam) {
      const panelToOpen = window.Runtime.queryParam('panel');
      if (panelToOpen) {
        window.DevToolsAPI.showPanel(panelToOpen);
      }
    }
  }

  /**
   * @override
   */
  bringToFront() {
    DevToolsAPI.sendMessageToEmbedder('bringToFront', [], null);
  }

  /**
   * @override
   */
  closeWindow() {
    DevToolsAPI.sendMessageToEmbedder('closeWindow', [], null);
  }

  /**
   * @override
   * @param {boolean} isDocked
   * @param {function()} callback
   */
  setIsDocked(isDocked, callback) {
    DevToolsAPI.sendMessageToEmbedder('setIsDocked', [isDocked], callback);
  }

  /**
   * @override
   * @param {string} trigger
   * @param {function(!InspectorFrontendHostAPI.ShowSurveyResult): void} callback
   */
  showSurvey(trigger, callback) {
    DevToolsAPI.sendMessageToEmbedder('showSurvey', [trigger], /** @type {function(?Object)} */ (callback));
  }

  /**
   * @override
   * @param {string} trigger
   * @param {function(!InspectorFrontendHostAPI.CanShowSurveyResult): void} callback
   */
  canShowSurvey(trigger, callback) {
    DevToolsAPI.sendMessageToEmbedder('canShowSurvey', [trigger], /** @type {function(?Object)} */ (callback));
  }

  /**
   * Requests inspected page to be placed atop of the inspector frontend with specified bounds.
   * @override
   * @param {{x: number, y: number, width: number, height: number}} bounds
   */
  setInspectedPageBounds(bounds) {
    DevToolsAPI.sendMessageToEmbedder('setInspectedPageBounds', [bounds], null);
  }

  /**
   * @override
   */
  inspectElementCompleted() {
    DevToolsAPI.sendMessageToEmbedder('inspectElementCompleted', [], null);
  }

  /**
   * @override
   * @param {string} url
   * @param {string} headers
   * @param {number} streamId
   * @param {function(!InspectorFrontendHostAPI.LoadNetworkResourceResult): void} callback
   */
  loadNetworkResource(url, headers, streamId, callback) {
    DevToolsAPI.sendMessageToEmbedder(
        'loadNetworkResource', [url, headers, streamId], /** @type {function(?Object)} */ (callback));
  }

  /**
   * @override
   * @param {string} name
   * @param {!{synced: (boolean|undefined)}} options
   */
  registerPreference(name, options) {
    DevToolsAPI.sendMessageToEmbedder('registerPreference', [name, options], null);
  }

  /**
   * @override
   * @param {function(!Object<string, string>)} callback
   */
  getPreferences(callback) {
    DevToolsAPI.sendMessageToEmbedder('getPreferences', [], /** @type {function(?Object)} */ (callback));
  }

  /**
   * @override
   * @param {string} name
   * @param {function(string)} callback
   */
  getPreference(name, callback) {
    DevToolsAPI.sendMessageToEmbedder('getPreference', [name], /** @type {function(string)} */ (callback));
  }

  /**
   * @override
   * @param {string} name
   * @param {string} value
   */
  setPreference(name, value) {
    DevToolsAPI.sendMessageToEmbedder('setPreference', [name, value], null);
  }

  /**
   * @override
   * @param {string} name
   */
  removePreference(name) {
    DevToolsAPI.sendMessageToEmbedder('removePreference', [name], null);
  }

  /**
   * @override
   */
  clearPreferences() {
    DevToolsAPI.sendMessageToEmbedder('clearPreferences', [], null);
  }

  /**
   * @override
   * @param {!function(!InspectorFrontendHostAPI.SyncInformation):void} callback
   */
  getSyncInformation(callback) {
    DevToolsAPI.sendMessageToEmbedder('getSyncInformation', [], callback);
  }

  /**
   * @override
   * @param {function(Object<string, Object<string, string|boolean>>):void} callback
   */
  getHostConfig(callback) {
    DevToolsAPI.sendMessageToEmbedder('getHostConfig', [], /** @type {function(?Object)} */ (callback));
  }

  /**
   * @override
   * @param {string} origin
   * @param {string} script
   */
  setInjectedScriptForOrigin(origin, script) {
    DevToolsAPI.sendMessageToEmbedder('registerExtensionsAPI', [origin, script], null);
  }

  /**
   * @override
   * @param {string} url
   */
  inspectedURLChanged(url) {
    DevToolsAPI.sendMessageToEmbedder('inspectedURLChanged', [url], null);
  }

  /**
   * @override
   * @param {string} text
   */
  copyText(text) {
    DevToolsHost.copyText(text);
  }

  /**
   * @override
   * @param {string} url
   */
  openInNewTab(url) {
    DevToolsAPI.sendMessageToEmbedder('openInNewTab', [url], null);
  }

  /**
   * @override
   * @param {string} query
   */
  openSearchResultsInNewTab(query) {
    DevToolsAPI.sendMessageToEmbedder('openSearchResultsInNewTab', [query], null);
  }

  /**
   * @override
   * @param {string} fileSystemPath
   */
  showItemInFolder(fileSystemPath) {
    DevToolsAPI.sendMessageToEmbedder('showItemInFolder', [fileSystemPath], null);
  }

  /**
   * @override
   * @param {string} url
   * @param {string} content
   * @param {boolean} forceSaveAs
   * @param {boolean} isBase64
   */
  save(url, content, forceSaveAs, isBase64) {
    DevToolsAPI.sendMessageToEmbedder('save', [url, content, forceSaveAs, isBase64], null);
  }

  /**
   * @override
   * @param {string} url
   * @param {string} content
   */
  append(url, content) {
    DevToolsAPI.sendMessageToEmbedder('append', [url, content], null);
  }

  /**
   * @override
   * @param {string} url
   */
  close(url) {
  }

  /**
   * @override
   * @param {string} message
   */
  sendMessageToBackend(message) {
    DevToolsAPI.sendMessageToEmbedder('dispatchProtocolMessage', [message], null);
  }

  /**
   * @override
   * @param {string} histogramName
   * @param {number} sample
   * @param {number} min
   * @param {number} exclusiveMax
   * @param {number} bucketSize
   */
  recordCountHistogram(histogramName, sample, min, exclusiveMax, bucketSize) {
    DevToolsAPI.sendMessageToEmbedder(
        'recordCountHistogram', [histogramName, sample, min, exclusiveMax, bucketSize], null);
  }

  /**
   * @override
   * @param {!InspectorFrontendHostAPI.EnumeratedHistogram} actionName
   * @param {number} actionCode
   * @param {number} bucketSize
   */
  recordEnumeratedHistogram(actionName, actionCode, bucketSize) {
    if (!Object.values(EnumeratedHistogram).includes(actionName)) {
      return;
    }
    DevToolsAPI.sendMessageToEmbedder('recordEnumeratedHistogram', [actionName, actionCode, bucketSize], null);
  }

  /**
   * @override
   * @param {string} histogramName
   * @param {number} duration
   */
  recordPerformanceHistogram(histogramName, duration) {
    DevToolsAPI.sendMessageToEmbedder('recordPerformanceHistogram', [histogramName, duration], null);
  }

  /**
   * @override
   * @param {string} umaName
   */
  recordUserMetricsAction(umaName) {
    DevToolsAPI.sendMessageToEmbedder('recordUserMetricsAction', [umaName], null);
  }

  /**
   * @override
   */
  requestFileSystems() {
    DevToolsAPI.sendMessageToEmbedder('requestFileSystems', [], null);
  }

  /**
   * @override
   * @param {string=} type
   */
  addFileSystem(type) {
    DevToolsAPI.sendMessageToEmbedder('addFileSystem', [type || ''], null);
  }

  /**
   * @override
   * @param {string} fileSystemPath
   */
  removeFileSystem(fileSystemPath) {
    DevToolsAPI.sendMessageToEmbedder('removeFileSystem', [fileSystemPath], null);
  }

  /**
   * @override
   * @param {string} fileSystemId
   * @param {string} registeredName
   * @return {?FileSystem}
   */
  isolatedFileSystem(fileSystemId, registeredName) {
    return DevToolsHost.isolatedFileSystem(fileSystemId, registeredName);
  }

  /**
   * @override
   * @param {!FileSystem} fileSystem
   */
  upgradeDraggedFileSystemPermissions(fileSystem) {
    DevToolsHost.upgradeDraggedFileSystemPermissions(fileSystem);
  }

  /**
   * @override
   * @param {number} requestId
   * @param {string} fileSystemPath
   * @param {string} excludedFolders
   */
  indexPath(requestId, fileSystemPath, excludedFolders) {
    // |excludedFolders| added in M67. For backward compatibility,
    // pass empty array.
    excludedFolders = excludedFolders || '[]';
    DevToolsAPI.sendMessageToEmbedder('indexPath', [requestId, fileSystemPath, excludedFolders], null);
  }

  /**
   * @override
   * @param {number} requestId
   */
  stopIndexing(requestId) {
    DevToolsAPI.sendMessageToEmbedder('stopIndexing', [requestId], null);
  }

  /**
   * @override
   * @param {number} requestId
   * @param {string} fileSystemPath
   * @param {string} query
   */
  searchInPath(requestId, fileSystemPath, query) {
    DevToolsAPI.sendMessageToEmbedder('searchInPath', [requestId, fileSystemPath, query], null);
  }

  /**
   * @override
   * @return {number}
   */
  zoomFactor() {
    return DevToolsHost.zoomFactor();
  }

  /**
   * @override
   */
  zoomIn() {
    DevToolsAPI.sendMessageToEmbedder('zoomIn', [], null);
  }

  /**
   * @override
   */
  zoomOut() {
    DevToolsAPI.sendMessageToEmbedder('zoomOut', [], null);
  }

  /**
   * @override
   */
  resetZoom() {
    DevToolsAPI.sendMessageToEmbedder('resetZoom', [], null);
  }

  /**
   * @override
   * @param {string} shortcuts
   */
  setWhitelistedShortcuts(shortcuts) {
    DevToolsAPI.sendMessageToEmbedder('setWhitelistedShortcuts', [shortcuts], null);
  }

  /**
   * @override
   * @param {boolean} active
   */
  setEyeDropperActive(active) {
    DevToolsAPI.sendMessageToEmbedder('setEyeDropperActive', [active], null);
  }

  /**
   * @override
   * @param {!Array<string>} certChain
   */
  showCertificateViewer(certChain) {
    DevToolsAPI.sendMessageToEmbedder('showCertificateViewer', [JSON.stringify(certChain)], null);
  }

  /**
   * Only needed to run Lighthouse on old devtools.
   * @override
   * @param {function()} callback
   */
  reattach(callback) {
    DevToolsAPI.sendMessageToEmbedder('reattach', [], callback);
  }

  /**
   * @override
   */
  readyForTest() {
    DevToolsAPI.sendMessageToEmbedder('readyForTest', [], null);
  }

  /**
   * @override
   */
  connectionReady() {
    DevToolsAPI.sendMessageToEmbedder('connectionReady', [], null);
  }

  /**
   * @override
   * @param {boolean} value
   */
  setOpenNewWindowForPopups(value) {
    DevToolsAPI.sendMessageToEmbedder('setOpenNewWindowForPopups', [value], null);
  }

  /**
   * @override
   * @param {!Adb.Config} config
   */
  setDevicesDiscoveryConfig(config) {
    DevToolsAPI.sendMessageToEmbedder(
        'setDevicesDiscoveryConfig',
        [
          config.discoverUsbDevices, config.portForwardingEnabled, JSON.stringify(config.portForwardingConfig),
          config.networkDiscoveryEnabled, JSON.stringify(config.networkDiscoveryConfig)
        ],
        null);
  }

  /**
   * @override
   * @param {boolean} enabled
   */
  setDevicesUpdatesEnabled(enabled) {
    DevToolsAPI.sendMessageToEmbedder('setDevicesUpdatesEnabled', [enabled], null);
  }

  /**
   * @override
   * @param {string} pageId
   * @param {string} action
   */
  performActionOnRemotePage(pageId, action) {
    DevToolsAPI.sendMessageToEmbedder('performActionOnRemotePage', [pageId, action], null);
  }

  /**
   * @override
   * @param {string} browserId
   * @param {string} url
   */
  openRemotePage(browserId, url) {
    DevToolsAPI.sendMessageToEmbedder('openRemotePage', [browserId, url], null);
  }

  /**
   * @override
   */
  openNodeFrontend() {
    DevToolsAPI.sendMessageToEmbedder('openNodeFrontend', [], null);
  }

  /**
   * @override
   * @param {number} x
   * @param {number} y
   * @param {!Array.<!InspectorFrontendHostAPI.ContextMenuDescriptor>} items
   * @param {!Document} document
   */
  showContextMenuAtPoint(x, y, items, document) {
    DevToolsHost.showContextMenuAtPoint(x, y, items, document);
  }

  /**
   * @override
   * @return {boolean}
   */
  isHostedMode() {
    return DevToolsHost.isHostedMode();
  }

  /**
   * @override
   * @param {function(!ExtensionDescriptor)} callback
   */
  setAddExtensionCallback(callback) {
    DevToolsAPI.setAddExtensionCallback(callback);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.ImpressionEvent} impressionEvent
   */
  recordImpression(impressionEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordImpression', [impressionEvent], null);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.ResizeEvent} resizeEvent
   */
  recordResize(resizeEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordResize', [resizeEvent], null);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.ClickEvent} clickEvent
   */
  recordClick(clickEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordClick', [clickEvent], null);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.HoverEvent} hoverEvent
   */
  recordHover(hoverEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordHover', [hoverEvent], null);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.DragEvent} dragEvent
   */
  recordDrag(dragEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordDrag', [dragEvent], null);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.ChangeEvent} changeEvent
   */
  recordChange(changeEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordChange', [changeEvent], null);
  }

  /**
   * @override
   * @param {InspectorFrontendHostAPI.KeyDownEvent} keyDownEvent
   */
  recordKeyDown(keyDownEvent) {
    DevToolsAPI.sendMessageToEmbedder('recordKeyDown', [keyDownEvent], null);
  }

  // Backward-compatible methods below this line --------------------------------------------

  /**
   * Support for legacy front-ends (<M65).
   * @return {boolean}
   */
  isUnderTest() {
    return false;
  }

  /**
   * Support for legacy front-ends (<M50).
   * @param {string} message
   */
  sendFrontendAPINotification(message) {
  }

  /**
   * Support for legacy front-ends (<M41).
   * @return {string}
   */
  port() {
    return 'unknown';
  }

  /**
   * Support for legacy front-ends (<M38).
   * @param {number} zoomFactor
   */
  setZoomFactor(zoomFactor) {
  }

  /**
   * Support for legacy front-ends (<M34).
   */
  sendMessageToEmbedder() {
  }

  /**
   * Support for legacy front-ends (<M34).
   * @param {string} dockSide
   */
  requestSetDockSide(dockSide) {
    DevToolsAPI.sendMessageToEmbedder('setIsDocked', [dockSide !== 'undocked'], null);
  }

  /**
   * Support for legacy front-ends (<M34).
   * @return {boolean}
   */
  supportsFileSystems() {
    return true;
  }

  /**
   * Support for legacy front-ends (<M44).
   * @param {number} actionCode
   */
  recordActionTaken(actionCode) {
    // Do not record actions, as that may crash the DevTools renderer.
  }

  /**
   * Support for legacy front-ends (<M44).
   * @param {number} panelCode
   */
  recordPanelShown(panelCode) {
    // Do not record actions, as that may crash the DevTools renderer.
  }

  /**
   * @return {!Promise<string>}
   */
  initialTargetId() {
    return DevToolsAPI._initialTargetIdPromise;
  }

  /**
   * @param {string} request
   * @param {number} streamId
   * @param {function(!InspectorFrontendHostAPI.DoAidaConversationResult): void} cb
   */
  doAidaConversation(request, streamId, cb) {
    DevToolsAPI.sendMessageToEmbedder('doAidaConversation', [request, streamId], cb);
  }

  /**
   * @param {string} request
   * @param {function(!InspectorFrontendHostAPI.AidaClientResult): void} cb
   */
  registerAidaClientEvent(request, cb) {
    DevToolsAPI.sendMessageToEmbedder('registerAidaClientEvent', [request], cb);
  }
};

window.InspectorFrontendHost = new InspectorFrontendHostImpl();

// DevToolsApp ---------------------------------------------------------------

function installObjectObserve() {
  /** @type {!Array<string>} */
  const properties = [
    'advancedSearchConfig',
    'auditsPanelSplitViewState',
    'auditsSidebarWidth',
    'blockedURLs',
    'breakpoints',
    'cacheDisabled',
    'colorFormat',
    'consoleHistory',
    'consoleTimestampsEnabled',
    'cpuProfilerView',
    'cssSourceMapsEnabled',
    'currentDockState',
    'customColorPalette',
    'customDevicePresets',
    'customEmulatedDeviceList',
    'customFormatters',
    'customUserAgent',
    'databaseTableViewVisibleColumns',
    'dataGrid-cookiesTable',
    'dataGrid-DOMStorageItemsView',
    'debuggerSidebarHidden',
    'disablePausedStateOverlay',
    'domBreakpoints',
    'domWordWrap',
    'elementsPanelSplitViewState',
    'elementsSidebarWidth',
    'emulation.deviceHeight',
    'emulation.deviceModeValue',
    'emulation.deviceOrientationOverride',
    'emulation.deviceScale',
    'emulation.deviceScaleFactor',
    'emulation.deviceUA',
    'emulation.deviceWidth',
    'emulation.locationOverride',
    'emulation.showDeviceMode',
    'emulation.showRulers',
    'enableAsyncStackTraces',
    'enableIgnoreListing',
    'eventListenerBreakpoints',
    'fileMappingEntries',
    'fileSystemMapping',
    'FileSystemViewSidebarWidth',
    'fileSystemViewSplitViewState',
    'filterBar-consoleView',
    'filterBar-networkPanel',
    'filterBar-promisePane',
    'filterBar-timelinePanel',
    'frameViewerHideChromeWindow',
    'heapSnapshotRetainersViewSize',
    'heapSnapshotSplitViewState',
    'hideCollectedPromises',
    'hideNetworkMessages',
    'highlightNodeOnHoverInOverlay',
    'inlineVariableValues',
    'Inspector.drawerSplitView',
    'Inspector.drawerSplitViewState',
    'InspectorView.panelOrder',
    'InspectorView.screencastSplitView',
    'InspectorView.screencastSplitViewState',
    'InspectorView.splitView',
    'InspectorView.splitViewState',
    'javaScriptDisabled',
    'jsSourceMapsEnabled',
    'lastActivePanel',
    'lastDockState',
    'lastSelectedSourcesSidebarPaneTab',
    'lastSnippetEvaluationIndex',
    'layerDetailsSplitView',
    'layerDetailsSplitViewState',
    'layersPanelSplitViewState',
    'layersShowInternalLayers',
    'layersSidebarWidth',
    'messageLevelFilters',
    'messageURLFilters',
    'monitoringXHREnabled',
    'navigatorGroupByAuthored',
    'navigatorGroupByFolder',
    'navigatorHidden',
    'networkColorCodeResourceTypes',
    'networkConditions',
    'networkConditionsCustomProfiles',
    'networkHideDataURL',
    'networkLogColumnsVisibility',
    'networkLogLargeRows',
    'networkLogShowOverview',
    'networkPanelSplitViewState',
    'networkRecordFilmStripSetting',
    'networkResourceTypeFilters',
    'networkShowPrimaryLoadWaterfall',
    'networkSidebarWidth',
    'openLinkHandler',
    'pauseOnUncaughtException',
    'pauseOnCaughtException',
    'pauseOnExceptionEnabled',
    'preserveConsoleLog',
    'prettyPrintInfobarDisabled',
    'previouslyViewedFiles',
    'profilesPanelSplitViewState',
    'profilesSidebarWidth',
    'promiseStatusFilters',
    'recordAllocationStacks',
    'requestHeaderFilterSetting',
    'request-info-formData-category-expanded',
    'request-info-general-category-expanded',
    'request-info-queryString-category-expanded',
    'request-info-requestHeaders-category-expanded',
    'request-info-requestPayload-category-expanded',
    'request-info-responseHeaders-category-expanded',
    'resources',
    'resourcesLastSelectedItem',
    'resourcesPanelSplitViewState',
    'resourcesSidebarWidth',
    'resourceViewTab',
    'savedURLs',
    'screencastEnabled',
    'scriptsPanelNavigatorSidebarWidth',
    'searchInContentScripts',
    'selectedAuditCategories',
    'selectedColorPalette',
    'selectedProfileType',
    'shortcutPanelSwitch',
    'showAdvancedHeapSnapshotProperties',
    'showEventListenersForAncestors',
    'showFrameowkrListeners',
    'showHeaSnapshotObjectsHiddenProperties',
    'showInheritedComputedStyleProperties',
    'showMediaQueryInspector',
    'showUAShadowDOM',
    'showWhitespacesInEditor',
    'sidebarPosition',
    'skipContentScripts',
    'automaticallyIgnoreListKnownThirdPartyScripts',
    'skipStackFramesPattern',
    'sourceMapInfobarDisabled',
    'sourceMapSkippedInfobarDisabled',
    'sourcesPanelDebuggerSidebarSplitViewState',
    'sourcesPanelNavigatorSplitViewState',
    'sourcesPanelSplitSidebarRatio',
    'sourcesPanelSplitViewState',
    'sourcesSidebarWidth',
    'standardEmulatedDeviceList',
    'StylesPaneSplitRatio',
    'stylesPaneSplitViewState',
    'textEditorAutocompletion',
    'textEditorAutoDetectIndent',
    'textEditorBracketMatching',
    'textEditorIndent',
    'textEditorTabMovesFocus',
    'timelineCaptureFilmStrip',
    'timelineCaptureLayersAndPictures',
    'timelineCaptureMemory',
    'timelineCaptureNetwork',
    'timeline-details',
    'timelineEnableJSSampling',
    'timelineOverviewMode',
    'timelinePanelDetailsSplitViewState',
    'timelinePanelRecorsSplitViewState',
    'timelinePanelTimelineStackSplitViewState',
    'timelinePerspective',
    'timeline-split',
    'timelineTreeGroupBy',
    'timeline-view',
    'timelineViewMode',
    'uiTheme',
    'watchExpressions',
    'WebInspector.Drawer.lastSelectedView',
    'WebInspector.Drawer.showOnLoad',
    'workspaceExcludedFolders',
    'workspaceFolderExcludePattern',
    'workspaceInfobarDisabled',
    'workspaceMappingInfobarDisabled',
    'xhrBreakpoints'
  ];

  /**
   * @this {!{_storage: Object, _name: string}}
   */
  function settingRemove() {
    this._storage[this._name] = undefined;
  }

  /**
   * @param {!Object} object
   * @param {function(!Array<!{name: string}>)} observer
   */
  function objectObserve(object, observer) {
    if (window['WebInspector']) {
      const settingPrototype = /** @type {!Object} */ (window['WebInspector']['Setting']['prototype']);
      if (typeof settingPrototype['remove'] === 'function') {
        settingPrototype['remove'] = settingRemove;
      }
    }
    /** @type {!Set<string>} */
    const changedProperties = new Set();
    let scheduled = false;

    function scheduleObserver() {
      if (scheduled) {
        return;
      }
      scheduled = true;
      queueMicrotask(callObserver);
    }

    function callObserver() {
      scheduled = false;
      const changes = /** @type {!Array<!{name: string}>} */ ([]);
      changedProperties.forEach(function(name) {
        changes.push({name: name});
      });
      changedProperties.clear();
      observer.call(null, changes);
    }

    /** @type {!Map<string, *>} */
    const storage = new Map();

    /**
     * @param {string} property
     */
    function defineProperty(property) {
      if (property in object) {
        storage.set(property, object[property]);
        delete object[property];
      }

      Object.defineProperty(object, property, {
        /**
         * @return {*}
         */
        get: function() {
          return storage.get(property);
        },

        /**
         * @param {*} value
         */
        set: function(value) {
          storage.set(property, value);
          changedProperties.add(property);
          scheduleObserver();
        }
      });
    }

    for (let i = 0; i < properties.length; ++i) {
      defineProperty(properties[i]);
    }
  }

  window.Object.observe = objectObserve;
}

/** @type {!Map<number, string>} */
const staticKeyIdentifiers = new Map([
  [0x12, 'Alt'],
  [0x11, 'Control'],
  [0x10, 'Shift'],
  [0x14, 'CapsLock'],
  [0x5b, 'Win'],
  [0x5c, 'Win'],
  [0x0c, 'Clear'],
  [0x28, 'Down'],
  [0x23, 'End'],
  [0x0a, 'Enter'],
  [0x0d, 'Enter'],
  [0x2b, 'Execute'],
  [0x70, 'F1'],
  [0x71, 'F2'],
  [0x72, 'F3'],
  [0x73, 'F4'],
  [0x74, 'F5'],
  [0x75, 'F6'],
  [0x76, 'F7'],
  [0x77, 'F8'],
  [0x78, 'F9'],
  [0x79, 'F10'],
  [0x7a, 'F11'],
  [0x7b, 'F12'],
  [0x7c, 'F13'],
  [0x7d, 'F14'],
  [0x7e, 'F15'],
  [0x7f, 'F16'],
  [0x80, 'F17'],
  [0x81, 'F18'],
  [0x82, 'F19'],
  [0x83, 'F20'],
  [0x84, 'F21'],
  [0x85, 'F22'],
  [0x86, 'F23'],
  [0x87, 'F24'],
  [0x2f, 'Help'],
  [0x24, 'Home'],
  [0x2d, 'Insert'],
  [0x25, 'Left'],
  [0x22, 'PageDown'],
  [0x21, 'PageUp'],
  [0x13, 'Pause'],
  [0x2c, 'PrintScreen'],
  [0x27, 'Right'],
  [0x91, 'Scroll'],
  [0x29, 'Select'],
  [0x26, 'Up'],
  [0x2e, 'U+007F'],  // Standard says that DEL becomes U+007F.
  [0xb0, 'MediaNextTrack'],
  [0xb1, 'MediaPreviousTrack'],
  [0xb2, 'MediaStop'],
  [0xb3, 'MediaPlayPause'],
  [0xad, 'VolumeMute'],
  [0xae, 'VolumeDown'],
  [0xaf, 'VolumeUp'],
]);

/**
 * @param {number} keyCode
 * @return {string}
 */
function keyCodeToKeyIdentifier(keyCode) {
  let result = staticKeyIdentifiers.get(keyCode);
  if (result !== undefined) {
    return result;
  }
  result = 'U+';
  const hexString = keyCode.toString(16).toUpperCase();
  for (let i = hexString.length; i < 4; ++i) {
    result += '0';
  }
  result += hexString;
  return result;
}

function installBackwardsCompatibility() {
  const majorVersion = getRemoteMajorVersion();
  if (!majorVersion) {
    return;
  }

  /** @type {!Array<string>} */
  const styleRules = [];
  // Shadow DOM V0 polyfill
  if (majorVersion <= 73 && !Element.prototype.createShadowRoot) {
    Element.prototype.createShadowRoot = function() {
      try {
        return this.attachShadow({mode: 'open'});
      } catch (e) {
        // some elements we use to add shadow roots can no
        // longer have shadow roots.
        const fakeShadowHost = document.createElement('span');
        this.appendChild(fakeShadowHost);
        fakeShadowHost.className = 'fake-shadow-host';
        return fakeShadowHost.createShadowRoot();
      }
    };

    const origAdd = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function(...tokens) {
      if (tokens[0].startsWith('insertion-point') || tokens[0].startsWith('tabbed-pane-header')) {
        this._myElement.slot = '.' + tokens[0];
      }
      return origAdd.apply(this, tokens);
    };

    const origCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, ...rest) {
      if (tagName === 'content') {
        tagName = 'slot';
      }
      const element = origCreateElement.call(this, tagName, ...rest);
      element.classList._myElement = element;
      return element;
    };

    Object.defineProperty(HTMLSlotElement.prototype, 'select', {
      set(selector) {
        this.name = selector;
      }
    });
  }

  // Custom Elements V0 polyfill
  if (majorVersion <= 73 && !Document.prototype.hasOwnProperty('registerElement')) {
    const fakeRegistry = new Map();
    Document.prototype.registerElement = function(typeExtension, options) {
      const {prototype, extends: localName} = options;
      const document = this;
      const callback = function() {
        const element = document.createElement(localName || typeExtension);
        const skip = new Set(['constructor', '__proto__']);
        for (const key of Object.keys(Object.getOwnPropertyDescriptors(prototype.__proto__ || {}))) {
          if (skip.has(key)) {
            continue;
          }
          element[key] = prototype[key];
        }
        element.setAttribute('is', typeExtension);
        if (element['createdCallback']) {
          element['createdCallback']();
        }
        return element;
      };
      fakeRegistry.set(typeExtension, callback);
      return callback;
    };

    const origCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, fakeCustomElementType) {
      const fakeConstructor = fakeRegistry.get(fakeCustomElementType);
      if (fakeConstructor) {
        return fakeConstructor();
      }
      return origCreateElement.call(this, tagName, fakeCustomElementType);
    };

    // DevTools front-ends mistakenly assume that
    //   classList.toggle('a', undefined) works as
    //   classList.toggle('a', false) rather than as
    //   classList.toggle('a');
    const originalDOMTokenListToggle = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function(token, force) {
      if (arguments.length === 1) {
        force = !this.contains(token);
      }
      return originalDOMTokenListToggle.call(this, token, Boolean(force));
    };
  }

  if (majorVersion <= 66) {
    /** @type {(!function(number, number):Element|undefined)} */
    ShadowRoot.prototype.__originalShadowRootElementFromPoint;

    if (!ShadowRoot.prototype.__originalShadowRootElementFromPoint) {
      ShadowRoot.prototype.__originalShadowRootElementFromPoint = ShadowRoot.prototype.elementFromPoint;
      /**
       *  @param {number} x
       *  @param {number} y
       *  @return {Element}
       */
      ShadowRoot.prototype.elementFromPoint = function(x, y) {
        const originalResult = ShadowRoot.prototype.__originalShadowRootElementFromPoint.apply(this, arguments);
        if (this.host && originalResult === this.host) {
          return null;
        }
        return originalResult;
      };
    }
  }

  if (majorVersion <= 53) {
    Object.defineProperty(window.KeyboardEvent.prototype, 'keyIdentifier', {
      /**
       * @return {string}
       * @this {KeyboardEvent}
       */
      get: function() {
        return keyCodeToKeyIdentifier(this.keyCode);
      }
    });
  }

  if (majorVersion <= 50) {
    installObjectObserve();
  }

  if (majorVersion <= 71) {
    styleRules.push(
        '.coverage-toolbar-container, .animation-timeline-toolbar-container, .computed-properties { flex-basis: auto; }');
  }

  if (majorVersion <= 50) {
    Event.prototype.deepPath = undefined;
  }

  if (majorVersion <= 54) {
    window.FileError = /** @type {!function (new: FileError) : ?} */ ({
      NOT_FOUND_ERR: DOMException.NOT_FOUND_ERR,
      ABORT_ERR: DOMException.ABORT_ERR,
      INVALID_MODIFICATION_ERR: DOMException.INVALID_MODIFICATION_ERR,
      NOT_READABLE_ERR: 0  // No matching DOMException, so code will be 0.
    });
  }

  installExtraStyleRules(styleRules);
}

/**
 * @return {?number}
 */
function getRemoteMajorVersion() {
  try {
    const remoteVersion = new URLSearchParams(window.location.search).get('remoteVersion');
    if (!remoteVersion) {
      return null;
    }
    const majorVersion = parseInt(remoteVersion.split('.')[0], 10);
    return majorVersion;
  } catch (e) {
    return null;
  }
}

/**
 * @param {!Array<string>} styleRules
 */
function installExtraStyleRules(styleRules) {
  if (!styleRules.length) {
    return;
  }
  const styleText = styleRules.join('\n');
  document.head.appendChild(createStyleElement(styleText));

  const origCreateShadowRoot = HTMLElement.prototype.createShadowRoot;
  HTMLElement.prototype.createShadowRoot = function(...args) {
    const shadowRoot = origCreateShadowRoot.call(this, ...args);
    shadowRoot.appendChild(createStyleElement(styleText));
    return shadowRoot;
  };
}

/**
 * @param {string} styleText
 * @return {!Element}
 */
function createStyleElement(styleText) {
  const style = document.createElement('style');
  style.textContent = styleText;
  return style;
}

installBackwardsCompatibility();
})(window);
