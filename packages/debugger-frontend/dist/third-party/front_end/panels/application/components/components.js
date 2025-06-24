import*as e from"../../../ui/components/chrome_link/chrome_link.js";import"../../../ui/components/expandable_list/expandable_list.js";import"../../../ui/components/report_view/report_view.js";import"../../../ui/components/tree_outline/tree_outline.js";import*as t from"../../../core/common/common.js";import*as o from"../../../core/i18n/i18n.js";import*as r from"../../../core/sdk/sdk.js";import"../../../ui/components/buttons/buttons.js";import*as a from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as n from"../../../ui/components/render_coordinator/render_coordinator.js";import*as i from"../../../ui/legacy/components/utils/utils.js";import*as s from"../../../ui/lit/lit.js";import*as l from"../../../ui/visual_logging/visual_logging.js";import"../../../ui/legacy/components/data_grid/data_grid.js";import*as c from"../../../models/bindings/bindings.js";import*as d from"../../../core/platform/platform.js";import*as h from"../../../core/root/root.js";import*as u from"../../../models/workspace/workspace.js";import*as p from"../../network/forward/forward.js";import*as g from"../../../third_party/csp_evaluator/csp_evaluator.js";import"../../../ui/components/icon_button/icon_button.js";import*as m from"../../../ui/components/adorners/adorners.js";import*as v from"../../../core/host/host.js";import*as b from"../../../ui/components/input/input.js";import*as k from"../../../ui/legacy/legacy.js";const f={notMainFrame:"Navigation happened in a frame other than the main frame.",backForwardCacheDisabled:"Back/forward cache is disabled by flags. Visit chrome://flags/#back-forward-cache to enable it locally on this device.",relatedActiveContentsExist:"The page was opened using '`window.open()`' and another tab has a reference to it, or the page opened a window.",HTTPStatusNotOK:"Only pages with a status code of 2XX can be cached.",schemeNotHTTPOrHTTPS:"Only pages whose URL scheme is HTTP / HTTPS can be cached.",loading:"The page did not finish loading before navigating away.",wasGrantedMediaAccess:"Pages that have granted access to record video or audio are not currently eligible for back/forward cache.",HTTPMethodNotGET:"Only pages loaded via a GET request are eligible for back/forward cache.",subframeIsNavigating:"An iframe on the page started a navigation that did not complete.",timeout:"The page exceeded the maximum time in back/forward cache and was expired.",cacheLimit:"The page was evicted from the cache to allow another page to be cached.",JavaScriptExecution:"Chrome detected an attempt to execute JavaScript while in the cache.",rendererProcessKilled:"The renderer process for the page in back/forward cache was killed.",rendererProcessCrashed:"The renderer process for the page in back/forward cache crashed.",grantedMediaStreamAccess:"Pages that have granted media stream access are not currently eligible for back/forward cache.",cacheFlushed:"The cache was intentionally cleared.",serviceWorkerVersionActivation:"The page was evicted from back/forward cache due to a service worker activation.",sessionRestored:"Chrome restarted and cleared the back/forward cache entries.",serviceWorkerPostMessage:"A service worker attempted to send the page in back/forward cache a `MessageEvent`.",enteredBackForwardCacheBeforeServiceWorkerHostAdded:"A service worker was activated while the page was in back/forward cache.",serviceWorkerClaim:"The page was claimed by a service worker while it is in back/forward cache.",haveInnerContents:"Pages that have certain kinds of embedded content (e.g. PDFs) are not currently eligible for back/forward cache.",timeoutPuttingInCache:"The page timed out entering back/forward cache (likely due to long-running pagehide handlers).",backForwardCacheDisabledByLowMemory:"Back/forward cache is disabled due to insufficient memory.",backForwardCacheDisabledByCommandLine:"Back/forward cache is disabled by the command line.",networkRequestDatapipeDrainedAsBytesConsumer:"Pages that have inflight fetch() or XHR are not currently eligible for back/forward cache.",networkRequestRedirected:"The page was evicted from back/forward cache because an active network request involved a redirect.",networkRequestTimeout:"The page was evicted from the cache because a network connection was open too long. Chrome limits the amount of time that a page may receive data while cached.",networkExceedsBufferLimit:"The page was evicted from the cache because an active network connection received too much data. Chrome limits the amount of data that a page may receive while cached.",navigationCancelledWhileRestoring:"Navigation was cancelled before the page could be restored from back/forward cache.",backForwardCacheDisabledForPrerender:"Back/forward cache is disabled for prerenderer.",userAgentOverrideDiffers:"Browser has changed the user agent override header.",foregroundCacheLimit:"The page was evicted from the cache to allow another page to be cached.",backForwardCacheDisabledForDelegate:"Back/forward cache is not supported by delegate.",unloadHandlerExistsInMainFrame:"The page has an unload handler in the main frame.",unloadHandlerExistsInSubFrame:"The page has an unload handler in a sub frame.",serviceWorkerUnregistration:"ServiceWorker was unregistered while a page was in back/forward cache.",noResponseHead:"Pages that do not have a valid response head cannot enter back/forward cache.",cacheControlNoStore:"Pages with cache-control:no-store header cannot enter back/forward cache.",ineligibleAPI:"Ineligible APIs were used.",internalError:"Internal error.",webSocket:"Pages with WebSocket cannot enter back/forward cache.",webTransport:"Pages with WebTransport cannot enter back/forward cache.",webRTC:"Pages with WebRTC cannot enter back/forward cache.",mainResourceHasCacheControlNoStore:"Pages whose main resource has cache-control:no-store cannot enter back/forward cache.",mainResourceHasCacheControlNoCache:"Pages whose main resource has cache-control:no-cache cannot enter back/forward cache.",subresourceHasCacheControlNoStore:"Pages whose subresource has cache-control:no-store cannot enter back/forward cache.",subresourceHasCacheControlNoCache:"Pages whose subresource has cache-control:no-cache cannot enter back/forward cache.",containsPlugins:"Pages containing plugins are not currently eligible for back/forward cache.",documentLoaded:"The document did not finish loading before navigating away.",dedicatedWorkerOrWorklet:"Pages that use a dedicated worker or worklet are not currently eligible for back/forward cache.",outstandingNetworkRequestOthers:"Pages with an in-flight network request are not currently eligible for back/forward cache.",outstandingIndexedDBTransaction:"Page with ongoing indexed DB transactions are not currently eligible for back/forward cache.",requestedNotificationsPermission:"Pages that have requested notifications permissions are not currently eligible for back/forward cache.",requestedMIDIPermission:"Pages that have requested MIDI permissions are not currently eligible for back/forward cache.",requestedAudioCapturePermission:"Pages that have requested audio capture permissions are not currently eligible for back/forward cache.",requestedVideoCapturePermission:"Pages that have requested video capture permissions are not currently eligible for back/forward cache.",requestedBackForwardCacheBlockedSensors:"Pages that have requested sensor permissions are not currently eligible for back/forward cache.",requestedBackgroundWorkPermission:"Pages that have requested background sync or fetch permissions are not currently eligible for back/forward cache.",broadcastChannel:"The page cannot be cached because it has a BroadcastChannel instance with registered listeners.",indexedDBConnection:"Pages that have an open IndexedDB connection are not currently eligible for back/forward cache.",webXR:"Pages that use WebXR are not currently eligible for back/forward cache.",sharedWorker:"Pages that use SharedWorker are not currently eligible for back/forward cache.",webLocks:"Pages that use WebLocks are not currently eligible for back/forward cache.",webHID:"Pages that use WebHID are not currently eligible for back/forward cache.",webShare:"Pages that use WebShare are not currently eligible for back/forwad cache.",requestedStorageAccessGrant:"Pages that have requested storage access are not currently eligible for back/forward cache.",webNfc:"Pages that use WebNfc are not currently eligible for back/forwad cache.",outstandingNetworkRequestFetch:"Pages with an in-flight fetch network request are not currently eligible for back/forward cache.",outstandingNetworkRequestXHR:"Pages with an in-flight XHR network request are not currently eligible for back/forward cache.",appBanner:"Pages that requested an AppBanner are not currently eligible for back/forward cache.",printing:"Pages that show Printing UI are not currently eligible for back/forward cache.",webDatabase:"Pages that use WebDatabase are not currently eligible for back/forward cache.",pictureInPicture:"Pages that use Picture-in-Picture are not currently eligible for back/forward cache.",speechRecognizer:"Pages that use SpeechRecognizer are not currently eligible for back/forward cache.",idleManager:"Pages that use IdleManager are not currently eligible for back/forward cache.",paymentManager:"Pages that use PaymentManager are not currently eligible for back/forward cache.",speechSynthesis:"Pages that use SpeechSynthesis are not currently eligible for back/forward cache.",keyboardLock:"Pages that use Keyboard lock are not currently eligible for back/forward cache.",webOTPService:"Pages that use WebOTPService are not currently eligible for bfcache.",outstandingNetworkRequestDirectSocket:"Pages with an in-flight network request are not currently eligible for back/forward cache.",injectedJavascript:"Pages that `JavaScript` is injected into by extensions are not currently eligible for back/forward cache.",injectedStyleSheet:"Pages that a `StyleSheet` is injected into by extensions are not currently eligible for back/forward cache.",contentDiscarded:"Undefined",contentSecurityHandler:"Pages that use SecurityHandler are not eligible for back/forward cache.",contentWebAuthenticationAPI:"Pages that use WebAuthetication API are not eligible for back/forward cache.",contentFileChooser:"Pages that use FileChooser API are not eligible for back/forward cache.",contentSerial:"Pages that use Serial API are not eligible for back/forward cache.",contentFileSystemAccess:"Pages that use File System Access API are not eligible for back/forward cache.",contentMediaDevicesDispatcherHost:"Pages that use Media Device Dispatcher are not eligible for back/forward cache.",contentWebBluetooth:"Pages that use WebBluetooth API are not eligible for back/forward cache.",contentWebUSB:"Pages that use WebUSB API are not eligible for back/forward cache.",contentMediaSession:"Pages that use MediaSession API and set a playback state are not eligible for back/forward cache.",contentMediaSessionService:"Pages that use MediaSession API and set action handlers are not eligible for back/forward cache.",contentMediaPlay:"A media player was playing upon navigating away.",contentScreenReader:"Back/forward cache is disabled due to screen reader.",embedderPopupBlockerTabHelper:"Popup blocker was present upon navigating away.",embedderSafeBrowsingTriggeredPopupBlocker:"Safe Browsing considered this page to be abusive and blocked popup.",embedderSafeBrowsingThreatDetails:"Safe Browsing details were shown upon navigating away.",embedderAppBannerManager:"App Banner was present upon navigating away.",embedderDomDistillerViewerSource:"DOM Distiller Viewer was present upon navigating away.",embedderDomDistillerSelfDeletingRequestDelegate:"DOM distillation was in progress upon navigating away.",embedderOomInterventionTabHelper:"Out-Of-Memory Intervention bar was present upon navigating away.",embedderOfflinePage:"The offline page was shown upon navigating away.",embedderChromePasswordManagerClientBindCredentialManager:"Chrome Password Manager was present upon navigating away.",embedderPermissionRequestManager:"There were permission requests upon navigating away.",embedderModalDialog:"Modal dialog such as form resubmission or http password dialog was shown for the page upon navigating away.",embedderExtensions:"Back/forward cache is disabled due to extensions.",embedderExtensionMessaging:"Back/forward cache is disabled due to extensions using messaging API.",embedderExtensionMessagingForOpenPort:"Extensions with long-lived connection should close the connection before entering back/forward cache.",embedderExtensionSentMessageToCachedFrame:"Extensions with long-lived connection attempted to send messages to frames in back/forward cache.",errorDocument:"Back/forward cache is disabled due to a document error.",fencedFramesEmbedder:"Pages using FencedFrames cannot be stored in bfcache.",keepaliveRequest:"Back/forward cache is disabled due to a keepalive request.",jsNetworkRequestReceivedCacheControlNoStoreResource:"Back/forward cache is disabled because some JavaScript network request received resource with `Cache-Control: no-store` header.",indexedDBEvent:"Back/forward cache is disabled due to an IndexedDB event.",cookieDisabled:"Back/forward cache is disabled because cookies are disabled on a page that uses `Cache-Control: no-store`.",webRTCSticky:"Back/forward cache is disabled because WebRTC has been used.",webTransportSticky:"Back/forward cache is disabled because WebTransport has been used.",webSocketSticky:"Back/forward cache is disabled because WebSocket has been used."},w=o.i18n.registerUIStrings("panels/application/components/BackForwardCacheStrings.ts",f),y=o.i18n.getLazilyComputedLocalizedString.bind(void 0,w),x={NotPrimaryMainFrame:{name:y(f.notMainFrame)},BackForwardCacheDisabled:{name:y(f.backForwardCacheDisabled)},RelatedActiveContentsExist:{name:y(f.relatedActiveContentsExist)},HTTPStatusNotOK:{name:y(f.HTTPStatusNotOK)},SchemeNotHTTPOrHTTPS:{name:y(f.schemeNotHTTPOrHTTPS)},Loading:{name:y(f.loading)},WasGrantedMediaAccess:{name:y(f.wasGrantedMediaAccess)},HTTPMethodNotGET:{name:y(f.HTTPMethodNotGET)},SubframeIsNavigating:{name:y(f.subframeIsNavigating)},Timeout:{name:y(f.timeout)},CacheLimit:{name:y(f.cacheLimit)},JavaScriptExecution:{name:y(f.JavaScriptExecution)},RendererProcessKilled:{name:y(f.rendererProcessKilled)},RendererProcessCrashed:{name:y(f.rendererProcessCrashed)},GrantedMediaStreamAccess:{name:y(f.grantedMediaStreamAccess)},CacheFlushed:{name:y(f.cacheFlushed)},ServiceWorkerVersionActivation:{name:y(f.serviceWorkerVersionActivation)},SessionRestored:{name:y(f.sessionRestored)},ServiceWorkerPostMessage:{name:y(f.serviceWorkerPostMessage)},EnteredBackForwardCacheBeforeServiceWorkerHostAdded:{name:y(f.enteredBackForwardCacheBeforeServiceWorkerHostAdded)},ServiceWorkerClaim:{name:y(f.serviceWorkerClaim)},HaveInnerContents:{name:y(f.haveInnerContents)},TimeoutPuttingInCache:{name:y(f.timeoutPuttingInCache)},BackForwardCacheDisabledByLowMemory:{name:y(f.backForwardCacheDisabledByLowMemory)},BackForwardCacheDisabledByCommandLine:{name:y(f.backForwardCacheDisabledByCommandLine)},NetworkRequestDatapipeDrainedAsBytesConsumer:{name:y(f.networkRequestDatapipeDrainedAsBytesConsumer)},NetworkRequestRedirected:{name:y(f.networkRequestRedirected)},NetworkRequestTimeout:{name:y(f.networkRequestTimeout)},NetworkExceedsBufferLimit:{name:y(f.networkExceedsBufferLimit)},NavigationCancelledWhileRestoring:{name:y(f.navigationCancelledWhileRestoring)},BackForwardCacheDisabledForPrerender:{name:y(f.backForwardCacheDisabledForPrerender)},UserAgentOverrideDiffers:{name:y(f.userAgentOverrideDiffers)},ForegroundCacheLimit:{name:y(f.foregroundCacheLimit)},BackForwardCacheDisabledForDelegate:{name:y(f.backForwardCacheDisabledForDelegate)},UnloadHandlerExistsInMainFrame:{name:y(f.unloadHandlerExistsInMainFrame)},UnloadHandlerExistsInSubFrame:{name:y(f.unloadHandlerExistsInSubFrame)},ServiceWorkerUnregistration:{name:y(f.serviceWorkerUnregistration)},NoResponseHead:{name:y(f.noResponseHead)},CacheControlNoStore:{name:y(f.cacheControlNoStore)},CacheControlNoStoreCookieModified:{name:y(f.cacheControlNoStore)},CacheControlNoStoreHTTPOnlyCookieModified:{name:y(f.cacheControlNoStore)},DisableForRenderFrameHostCalled:{name:y(f.ineligibleAPI)},BlocklistedFeatures:{name:y(f.ineligibleAPI)},SchedulerTrackedFeatureUsed:{name:y(f.ineligibleAPI)},DomainNotAllowed:{name:y(f.internalError)},ConflictingBrowsingInstance:{name:y(f.internalError)},NotMostRecentNavigationEntry:{name:y(f.internalError)},IgnoreEventAndEvict:{name:y(f.internalError)},BrowsingInstanceNotSwapped:{name:y(f.internalError)},ActivationNavigationsDisallowedForBug1234857:{name:y(f.internalError)},Unknown:{name:y(f.internalError)},RenderFrameHostReused_SameSite:{name:y(f.internalError)},RenderFrameHostReused_CrossSite:{name:y(f.internalError)},WebSocket:{name:y(f.webSocket)},WebTransport:{name:y(f.webTransport)},WebRTC:{name:y(f.webRTC)},MainResourceHasCacheControlNoStore:{name:y(f.mainResourceHasCacheControlNoStore)},MainResourceHasCacheControlNoCache:{name:y(f.mainResourceHasCacheControlNoCache)},SubresourceHasCacheControlNoStore:{name:y(f.subresourceHasCacheControlNoStore)},SubresourceHasCacheControlNoCache:{name:y(f.subresourceHasCacheControlNoCache)},ContainsPlugins:{name:y(f.containsPlugins)},DocumentLoaded:{name:y(f.documentLoaded)},DedicatedWorkerOrWorklet:{name:y(f.dedicatedWorkerOrWorklet)},OutstandingNetworkRequestOthers:{name:y(f.outstandingNetworkRequestOthers)},OutstandingIndexedDBTransaction:{name:y(f.outstandingIndexedDBTransaction)},RequestedNotificationsPermission:{name:y(f.requestedNotificationsPermission)},RequestedMIDIPermission:{name:y(f.requestedMIDIPermission)},RequestedAudioCapturePermission:{name:y(f.requestedAudioCapturePermission)},RequestedVideoCapturePermission:{name:y(f.requestedVideoCapturePermission)},RequestedBackForwardCacheBlockedSensors:{name:y(f.requestedBackForwardCacheBlockedSensors)},RequestedBackgroundWorkPermission:{name:y(f.requestedBackgroundWorkPermission)},BroadcastChannel:{name:y(f.broadcastChannel)},IndexedDBConnection:{name:y(f.indexedDBConnection)},WebXR:{name:y(f.webXR)},SharedWorker:{name:y(f.sharedWorker)},WebLocks:{name:y(f.webLocks)},WebHID:{name:y(f.webHID)},WebShare:{name:y(f.webShare)},RequestedStorageAccessGrant:{name:y(f.requestedStorageAccessGrant)},WebNfc:{name:y(f.webNfc)},OutstandingNetworkRequestFetch:{name:y(f.outstandingNetworkRequestFetch)},OutstandingNetworkRequestXHR:{name:y(f.outstandingNetworkRequestXHR)},AppBanner:{name:y(f.appBanner)},Printing:{name:y(f.printing)},WebDatabase:{name:y(f.webDatabase)},PictureInPicture:{name:y(f.pictureInPicture)},SpeechRecognizer:{name:y(f.speechRecognizer)},IdleManager:{name:y(f.idleManager)},PaymentManager:{name:y(f.paymentManager)},SpeechSynthesis:{name:y(f.speechSynthesis)},KeyboardLock:{name:y(f.keyboardLock)},WebOTPService:{name:y(f.webOTPService)},OutstandingNetworkRequestDirectSocket:{name:y(f.outstandingNetworkRequestDirectSocket)},InjectedJavascript:{name:y(f.injectedJavascript)},InjectedStyleSheet:{name:y(f.injectedStyleSheet)},Dummy:{name:y(f.internalError)},ContentDiscarded:{name:y(f.contentDiscarded)},ContentSecurityHandler:{name:y(f.contentSecurityHandler)},ContentWebAuthenticationAPI:{name:y(f.contentWebAuthenticationAPI)},ContentFileChooser:{name:y(f.contentFileChooser)},ContentSerial:{name:y(f.contentSerial)},ContentFileSystemAccess:{name:y(f.contentFileSystemAccess)},ContentMediaDevicesDispatcherHost:{name:y(f.contentMediaDevicesDispatcherHost)},ContentWebBluetooth:{name:y(f.contentWebBluetooth)},ContentWebUSB:{name:y(f.contentWebUSB)},ContentMediaSession:{name:y(f.contentMediaSession)},ContentMediaSessionService:{name:y(f.contentMediaSessionService)},ContentMediaPlay:{name:y(f.contentMediaPlay)},ContentScreenReader:{name:y(f.contentScreenReader)},EmbedderPopupBlockerTabHelper:{name:y(f.embedderPopupBlockerTabHelper)},EmbedderSafeBrowsingTriggeredPopupBlocker:{name:y(f.embedderSafeBrowsingTriggeredPopupBlocker)},EmbedderSafeBrowsingThreatDetails:{name:y(f.embedderSafeBrowsingThreatDetails)},EmbedderAppBannerManager:{name:y(f.embedderAppBannerManager)},EmbedderDomDistillerViewerSource:{name:y(f.embedderDomDistillerViewerSource)},EmbedderDomDistillerSelfDeletingRequestDelegate:{name:y(f.embedderDomDistillerSelfDeletingRequestDelegate)},EmbedderOomInterventionTabHelper:{name:y(f.embedderOomInterventionTabHelper)},EmbedderOfflinePage:{name:y(f.embedderOfflinePage)},EmbedderChromePasswordManagerClientBindCredentialManager:{name:y(f.embedderChromePasswordManagerClientBindCredentialManager)},EmbedderPermissionRequestManager:{name:y(f.embedderPermissionRequestManager)},EmbedderModalDialog:{name:y(f.embedderModalDialog)},EmbedderExtensions:{name:y(f.embedderExtensions)},EmbedderExtensionMessaging:{name:y(f.embedderExtensionMessaging)},EmbedderExtensionMessagingForOpenPort:{name:y(f.embedderExtensionMessagingForOpenPort)},EmbedderExtensionSentMessageToCachedFrame:{name:y(f.embedderExtensionSentMessageToCachedFrame)},ErrorDocument:{name:y(f.errorDocument)},FencedFramesEmbedder:{name:y(f.fencedFramesEmbedder)},KeepaliveRequest:{name:y(f.keepaliveRequest)},JsNetworkRequestReceivedCacheControlNoStoreResource:{name:y(f.jsNetworkRequestReceivedCacheControlNoStoreResource)},IndexedDBEvent:{name:y(f.indexedDBEvent)},CookieDisabled:{name:y(f.cookieDisabled)},WebRTCSticky:{name:y(f.webRTCSticky)},WebTransportSticky:{name:y(f.webTransportSticky)},WebSocketSticky:{name:y(f.webSocketSticky)},HTTPAuthRequired:{name:o.i18n.lockedLazyString("HTTPAuthRequired")},CookieFlushed:{name:o.i18n.lockedLazyString("CookieFlushed")},SmartCard:{name:o.i18n.lockedLazyString("SmartCard")},LiveMediaStreamTrack:{name:o.i18n.lockedLazyString("LiveMediaStreamTrack")},UnloadHandler:{name:o.i18n.lockedLazyString("UnloadHandler")},ParserAborted:{name:o.i18n.lockedLazyString("ParserAborted")},BroadcastChannelOnMessage:{name:o.i18n.lockedLazyString("BroadcastChannelOnMessage")},RequestedByWebViewClient:{name:o.i18n.lockedLazyString("RequestedByWebViewClient")},PostMessageByWebViewClient:{name:o.i18n.lockedLazyString("PostMessageByWebViewClient")},WebViewSettingsChanged:{name:o.i18n.lockedLazyString("WebViewSettingsChanged")},WebViewJavaScriptObjectChanged:{name:o.i18n.lockedLazyString("WebViewJavaScriptObjectChanged")},WebViewMessageListenerInjected:{name:o.i18n.lockedLazyString("WebViewMessageListenerInjected")},WebViewSafeBrowsingAllowlistChanged:{name:o.i18n.lockedLazyString("WebViewSafeBrowsingAllowlistChanged")},WebViewDocumentStartJavascriptChanged:{name:o.i18n.lockedLazyString("WebViewDocumentStartJavascriptChanged")},CacheControlNoStoreDeviceBoundSessionTerminated:{name:y(f.cacheControlNoStore)},CacheLimitPruned:{name:o.i18n.lockedLazyString("CacheLimitPruned")}};var S=`.inline-icon{vertical-align:sub}.gray-text{color:var(--sys-color-token-subtle);margin:0 0 5px 56px;display:flex;flex-direction:row;align-items:center;flex:auto;overflow-wrap:break-word;overflow:hidden;grid-column-start:span 2}.details-list{margin-left:56px;grid-column-start:span 2}.help-outline-icon{margin:0 2px}.circled-exclamation-icon{margin-right:10px;flex-shrink:0}.status{margin-right:11px;flex-shrink:0}.report-line{grid-column-start:span 2;display:flex;align-items:center;margin:0 30px;line-height:26px}.report-key{color:var(--sys-color-token-subtle);min-width:auto;overflow-wrap:break-word;align-self:start}.report-value{padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}devtools-report-value:has(devtools-tree-outline){margin-left:var(--sys-size-7)}.tree-outline li .selection{margin-left:-5px}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=${import.meta.resolve("./backForwardCacheView.css")} */\n`;const{html:T}=s,$={mainFrame:"Main Frame",backForwardCacheTitle:"Back/forward cache",unavailable:"unavailable",url:"URL",unknown:"Unknown Status",normalNavigation:"Not served from back/forward cache: to trigger back/forward cache, use Chrome's back/forward buttons, or use the test button below to automatically navigate away and back.",restoredFromBFCache:"Successfully served from back/forward cache.",pageSupportNeeded:"Actionable",pageSupportNeededExplanation:"These reasons are actionable i.e. they can be cleaned up to make the page eligible for back/forward cache.",circumstantial:"Not Actionable",circumstantialExplanation:"These reasons are not actionable i.e. caching was prevented by something outside of the direct control of the page.",supportPending:"Pending Support",runTest:"Test back/forward cache",runningTest:"Running test",learnMore:"Learn more: back/forward cache eligibility",neverUseUnload:"Learn more: Never use unload handler",supportPendingExplanation:"Chrome support for these reasons is pending i.e. they will not prevent the page from being eligible for back/forward cache in a future version of Chrome.",blockingExtensionId:"Extension id: ",framesTitle:"Frames",issuesInSingleFrame:"{n, plural, =1 {# issue found in 1 frame.} other {# issues found in 1 frame.}}",issuesInMultipleFrames:"{n, plural, =1 {# issue found in {m} frames.} other {# issues found in {m} frames.}}",framesPerIssue:"{n, plural, =1 {# frame} other {# frames}}",blankURLTitle:"Blank URL [{PH1}]",filesPerIssue:"{n, plural, =1 {# file} other {# files}}"},C=o.i18n.registerUIStrings("panels/application/components/BackForwardCacheView.ts",$),P=o.i18n.getLocalizedString.bind(void 0,C);class R extends a.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#t="Result";#o=0;#r=0;constructor(){super(),this.#a()?.addEventListener(r.ResourceTreeModel.Events.PrimaryPageChanged,this.render,this),this.#a()?.addEventListener(r.ResourceTreeModel.Events.BackForwardCacheDetailsUpdated,this.render,this)}#a(){const e=r.TargetManager.TargetManager.instance().primaryPageTarget();return e?.model(r.ResourceTreeModel.ResourceTreeModel)||null}#n(){return this.#a()?.mainFrame||null}connectedCallback(){this.parentElement?.classList.add("overflow-auto")}async render(){await n.write("BackForwardCacheView render",(()=>{s.render(T`
        <style>${S}</style>
        <devtools-report .data=${{reportTitle:P($.backForwardCacheTitle)}} jslog=${l.pane("back-forward-cache")}>

          ${this.#i()}
        </devtools-report>
      `,this.#e,{host:this})}))}#s(){r.TargetManager.TargetManager.instance().removeModelListener(r.ResourceTreeModel.ResourceTreeModel,r.ResourceTreeModel.Events.FrameNavigated,this.#s,this),this.#t="Result",this.render()}async#l(){r.TargetManager.TargetManager.instance().removeModelListener(r.ResourceTreeModel.ResourceTreeModel,r.ResourceTreeModel.Events.FrameNavigated,this.#l,this),await this.#c(50)}async#c(e){const t=r.TargetManager.TargetManager.instance().primaryPageTarget(),o=t?.model(r.ResourceTreeModel.ResourceTreeModel),a=await(o?.navigationHistory());o&&a&&(a.currentIndex===this.#r?window.setTimeout(this.#c.bind(this,2*e),e):(r.TargetManager.TargetManager.instance().addModelListener(r.ResourceTreeModel.ResourceTreeModel,r.ResourceTreeModel.Events.FrameNavigated,this.#s,this),o.navigateToHistoryEntry(a.entries[a.currentIndex-1])))}async#d(){const e=r.TargetManager.TargetManager.instance().primaryPageTarget(),t=e?.model(r.ResourceTreeModel.ResourceTreeModel),o=await(t?.navigationHistory());t&&o&&(this.#r=o.currentIndex,this.#t="Running",this.render(),r.TargetManager.TargetManager.instance().addModelListener(r.ResourceTreeModel.ResourceTreeModel,r.ResourceTreeModel.Events.FrameNavigated,this.#l,this),t.navigate("chrome://terms"))}#i(){const e=this.#n();if(!e)return T`
        <devtools-report-key>
          ${P($.mainFrame)}
        </devtools-report-key>
        <devtools-report-value>
          ${P($.unavailable)}
        </devtools-report-value>
      `;const o="Running"===this.#t,r=t.ParsedURL.schemeIs(e.url,"devtools:");return T`
      ${this.#h(e.backForwardCacheDetails.restoredFromCache)}
      <devtools-report-key>${P($.url)}</devtools-report-key>
      <devtools-report-value>${e.url}</devtools-report-value>
      ${this.#u(e.backForwardCacheDetails.explanationsTree)}
      <devtools-report-section>
        <devtools-button
          aria-label=${P($.runTest)}
          .disabled=${o||r}
          .spinner=${o}
          .variant=${"primary"}
          @click=${this.#d}
          jslog=${l.action("back-forward-cache.run-test").track({click:!0})}>
          ${o?T`
            ${P($.runningTest)}`:`\n            ${P($.runTest)}\n          `}
        </devtools-button>
      </devtools-report-section>
      <devtools-report-divider>
      </devtools-report-divider>
      ${this.#p(e.backForwardCacheDetails.explanations,e.backForwardCacheDetails.explanationsTree)}
      <devtools-report-section>
        <x-link href="https://web.dev/bfcache/" class="link"
        jslog=${l.action("learn-more.eligibility").track({click:!0})}>
          ${P($.learnMore)}
        </x-link>
      </devtools-report-section>
    `}#u(e){if(!e||0===e.explanations.length&&0===e.children.length)return s.nothing;const t=this.#g(e,{blankCount:1});t.node.treeNodeData.iconName="frame";let o="";o=1===t.frameCount?P($.issuesInSingleFrame,{n:t.issueCount}):P($.issuesInMultipleFrames,{n:t.issueCount,m:t.frameCount});const r={treeNodeData:{text:o},id:"root",children:()=>Promise.resolve([t.node])};return T`
      <devtools-report-key jslog=${l.section("frames")}>${P($.framesTitle)}</devtools-report-key>
      <devtools-report-value>
        <devtools-tree-outline .data=${{tree:[r],defaultRenderer:function(e){return T`
        <div class="text-ellipsis">
          ${e.treeNodeData.iconName?T`
            <devtools-icon class="inline-icon" style="margin-bottom: -3px;" .data=${{iconName:e.treeNodeData.iconName,color:"var(--icon-default)",width:"20px",height:"20px"}}>
            </devtools-icon>
          `:s.nothing}
          ${e.treeNodeData.text}
        </div>
      `},compact:!0}}>
        </devtools-tree-outline>
      </devtools-report-value>
    `}#g(e,t){let o=1,r=0;const a=[];let n="";e.url.length?n=e.url:(n=P($.blankURLTitle,{PH1:t.blankCount}),t.blankCount+=1);for(const t of e.explanations){const e={treeNodeData:{text:t.reason},id:String(this.#o++)};r+=1,a.push(e)}for(const n of e.children){const e=this.#g(n,t);e.issueCount>0&&(a.push(e.node),r+=e.issueCount,o+=e.frameCount)}let i={treeNodeData:{text:`(${r}) ${n}`},id:String(this.#o++)};return a.length?(i={...i,children:()=>Promise.resolve(a)},i.treeNodeData.iconName="iframe"):e.url.length||(t.blankCount-=1),{node:i,frameCount:o,issueCount:r}}#h(e){switch(e){case!0:return T`
          <devtools-report-section>
            <div class="status">
              <devtools-icon class="inline-icon" .data=${{iconName:"check-circle",color:"var(--icon-checkmark-green)",width:"20px",height:"20px"}}>
              </devtools-icon>
            </div>
            ${P($.restoredFromBFCache)}
          </devtools-report-section>
        `;case!1:return T`
          <devtools-report-section>
            <div class="status">
              <devtools-icon class="inline-icon" .data=${{iconName:"clear",color:"var(--icon-default)",width:"20px",height:"20px"}}>
              </devtools-icon>
            </div>
            ${P($.normalNavigation)}
          </devtools-report-section>
        `}return T`
    <devtools-report-section>
      ${P($.unknown)}
    </devtools-report-section>
    `}#m(e,t,o){let r=e.url;0===r.length&&(r=P($.blankURLTitle,{PH1:t.blankCount}),t.blankCount+=1),e.explanations.forEach((e=>{let t=o.get(e.reason);void 0===t?(t=[r],o.set(e.reason,t)):t.push(r)})),e.children.map((e=>{this.#m(e,t,o)}))}#p(e,t){if(0===e.length)return s.nothing;const o=e.filter((e=>"PageSupportNeeded"===e.type)),r=e.filter((e=>"SupportPending"===e.type)),a=e.filter((e=>"Circumstantial"===e.type)),n=new Map;return t&&this.#m(t,{blankCount:1},n),T`
      ${this.#v(P($.pageSupportNeeded),P($.pageSupportNeededExplanation),o,n)}
      ${this.#v(P($.supportPending),P($.supportPendingExplanation),r,n)}
      ${this.#v(P($.circumstantial),P($.circumstantialExplanation),a,n)}
    `}#v(e,t,o,r){return T`
      ${o.length>0?T`
        <devtools-report-section-header>
          ${e}
          <div class="help-outline-icon">
            <devtools-icon class="inline-icon" .data=${{iconName:"help",color:"var(--icon-default)",width:"16px",height:"16px"}} title=${t}>
            </devtools-icon>
          </div>
        </devtools-report-section-header>
        ${o.map((e=>this.#b(e,r.get(e.reason))))}
      `:s.nothing}
    `}#k(e){if("EmbedderExtensionSentMessageToCachedFrame"===e.reason&&e.context){const t="chrome://extensions/?id="+e.context;return T`${P($.blockingExtensionId)}
      <devtools-chrome-link .href=${t}>${e.context}</devtools-chrome-link>`}return s.nothing}#f(e){if(void 0===e||0===e.length)return s.nothing;const t=[T`<div>${P($.framesPerIssue,{n:e.length})}</div>`];return t.push(...e.map((e=>T`<div class="text-ellipsis" title=${e}
    jslog=${l.treeItem()}>${e}</div>`))),T`
      <div class="details-list"
      jslog=${l.tree("frames-per-issue")}>
        <devtools-expandable-list .data=${{rows:t,title:P($.framesPerIssue,{n:e.length})}}
        jslog=${l.treeItem()}></devtools-expandable-list>
      </div>
    `}#w(e){return"UnloadHandlerExistsInMainFrame"===e.reason||"UnloadHandlerExistsInSubFrame"===e.reason?T`
        <x-link href="https://web.dev/bfcache/#never-use-the-unload-event" class="link"
        jslog=${l.action("learn-more.never-use-unload").track({click:!0})}>
          ${P($.neverUseUnload)}
        </x-link>`:s.nothing}#y(e){if(void 0===e||0===e.length)return s.nothing;const t=new i.Linkifier.Linkifier(50),o=[T`<div>${P($.filesPerIssue,{n:e.length})}</div>`];return o.push(...e.map((e=>T`${t.linkifyScriptLocation(null,null,e.url,e.lineNumber,{columnNumber:e.columnNumber,showColumnNumber:!0,inlineFrameIndex:0})}`))),T`
      <div class="details-list">
        <devtools-expandable-list .data=${{rows:o}}></devtools-expandable-list>
      </div>
    `}#b(e,t){return T`
      <devtools-report-section>
        ${e.reason in x?T`
            <div class="circled-exclamation-icon">
              <devtools-icon class="inline-icon" .data=${{iconName:"warning",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
              </devtools-icon>
            </div>
            <div>
              ${x[e.reason].name()}
              ${this.#w(e)}
              ${this.#k(e)}
           </div>`:s.nothing}
      </devtools-report-section>
      <div class="gray-text">
        ${e.reason}
      </div>
      ${this.#y(e.details)}
      ${this.#f(t)}
    `}}customElements.define("devtools-resources-back-forward-cache-view",R);var M=Object.freeze({__proto__:null,BackForwardCacheView:R}),D=`devtools-data-grid{margin-top:0}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=${import.meta.resolve("./bounceTrackingMitigationsView.css")} */\n`;const{html:I}=s,B={bounceTrackingMitigationsTitle:"Bounce tracking mitigations",forceRun:"Force run",runningMitigations:"Running",stateDeletedFor:"State was deleted for the following sites:",checkingPotentialTrackers:"Checking for potential bounce tracking sites.",learnMore:"Learn more: Bounce Tracking Mitigations",noPotentialBounceTrackersIdentified:"State was not cleared for any potential bounce tracking sites. Either none were identified or third-party cookies are not blocked.",featureDisabled:'Bounce tracking mitigations are disabled. To enable them, set the flag at {PH1} to "Enabled With Deletion".',featureFlag:"Bounce Tracking Mitigations Feature Flag"},E=o.i18n.registerUIStrings("panels/application/components/BounceTrackingMitigationsView.ts",B),F=o.i18n.getLocalizedString.bind(void 0,E);class L extends a.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#x=[];#t="Result";#S=!1;#T=!1;connectedCallback(){this.#$()}async#$(){s.render(I`
      <style>${D}</style>
      <devtools-report .data=${{reportTitle:F(B.bounceTrackingMitigationsTitle)}}
                       jslog=${l.pane("bounce-tracking-mitigations")}>
        ${await this.#i()}
      </devtools-report>
    `,this.#e,{host:this})}async#i(){if(this.#S||await this.#C(),"Disabled"===this.#t){const t=new e.ChromeLink.ChromeLink;return t.href="chrome://flags/#bounce-tracking-mitigations",t.textContent=F(B.featureFlag),I`
        <devtools-report-section>
          ${o.i18n.getFormatLocalizedString(E,B.featureDisabled,{PH1:t})}
        </devtools-report-section>
      `}return I`
      <devtools-report-section>
        ${this.#P()}
      </devtools-report-section>
      ${this.#R()}
      <devtools-report-divider>
      </devtools-report-divider>
      <devtools-report-section>
        <x-link href="https://privacycg.github.io/nav-tracking-mitigations/#bounce-tracking-mitigations" class="link"
        jslog=${l.link("learn-more").track({click:!0})}>
          ${F(B.learnMore)}
        </x-link>
      </devtools-report-section>
    `}#P(){const e="Running"===this.#t;return I`
      <devtools-button
        aria-label=${F(B.forceRun)}
        .disabled=${e}
        .spinner=${e}
        .variant=${"primary"}
        @click=${this.#M}
        jslog=${l.action("force-run").track({click:!0})}>
        ${e?I`
          ${F(B.runningMitigations)}`:`\n          ${F(B.forceRun)}\n        `}
      </devtools-button>
    `}#R(){return this.#T?0===this.#x.length?I`
        <devtools-report-section>
        ${"Running"===this.#t?I`
          ${F(B.checkingPotentialTrackers)}`:`\n          ${F(B.noPotentialBounceTrackersIdentified)}\n        `}
        </devtools-report-section>
      `:I`
      <devtools-report-section>
        <devtools-data-grid striped inline>
          <table>
            <tr>
              <th id="sites" weight="10" sortable>
                ${F(B.stateDeletedFor)}
              </th>
            </tr>
            ${this.#x.map((e=>I`
              <tr><td>${e}</td></tr>`))}
          </table>
        </devtools-data-grid>
      </devtools-report-section>
    `:I``}async#M(){const e=r.TargetManager.TargetManager.instance().primaryPageTarget();if(!e)return;this.#T=!0,this.#t="Running",this.#$();const t=await e.storageAgent().invoke_runBounceTrackingMitigations();this.#x=[],t.deletedSites.forEach((e=>{this.#x.push(e)})),this.#D()}#D(){this.#t="Result",this.#$()}async#C(){this.#S=!0;const e=r.TargetManager.TargetManager.instance().primaryPageTarget();e&&((await e.systemInfo().invoke_getFeatureState({featureState:"DIPS"})).featureEnabled||(this.#t="Disabled"))}}customElements.define("devtools-bounce-tracking-mitigations-view",L);var N=Object.freeze({__proto__:null,BounceTrackingMitigationsView:L,i18nString:F}),A={cssText:`*{box-sizing:border-box;min-width:0;min-height:0}:root{height:100%;overflow:hidden;interpolate-size:allow-keywords}body{height:100%;width:100%;position:relative;overflow:hidden;margin:0;cursor:default;font-family:var(--default-font-family);font-size:12px;tab-size:4;user-select:none;color:var(--sys-color-on-surface);background:var(--sys-color-cdt-base-container)}:focus{outline-width:0}.monospace{font-family:var(--monospace-font-family);font-size:var(\n    --monospace-font-size\n  )!important}.source-code{font-family:var(--source-code-font-family);font-size:var(\n    --source-code-font-size\n  )!important;white-space:pre-wrap;&:not(input)::selection{color:var(--sys-color-on-surface)}}.source-code.breakpoint{white-space:nowrap}.source-code .devtools-link.text-button{max-width:100%;overflow:hidden;text-overflow:ellipsis}img{-webkit-user-drag:none}iframe,\na img{border:none}.fill{position:absolute;inset:0}iframe.fill{width:100%;height:100%}.widget{position:relative;flex:auto;contain:style}.hbox{display:flex;flex-direction:row!important;position:relative}.vbox{display:flex;flex-direction:column!important;position:relative}.view-container > devtools-toolbar{border-bottom:1px solid var(--sys-color-divider)}.flex-auto{flex:auto}.flex-none{flex:none}.flex-centered{display:flex;align-items:center;justify-content:center}.overflow-auto{overflow:auto;background-color:var(--sys-color-cdt-base-container)}iframe.widget{position:absolute;width:100%;height:100%;inset:0}.hidden{display:none!important}.highlighted-search-result{border-radius:1px;background-color:var(--sys-color-yellow-container);outline:1px solid var(--sys-color-yellow-container)}.link{cursor:pointer;text-decoration:underline;color:var(--sys-color-primary);outline-offset:2px}button,\ninput,\nselect{font-family:inherit;font-size:inherit}select option,\nselect optgroup,\ninput{background-color:var(--sys-color-cdt-base-container)}input{color:inherit;&[type="checkbox"]{position:relative;outline:none;display:flex;align-items:center;justify-content:center;&:hover::after,\n    &:active::before{content:"";height:24px;width:24px;border-radius:var(--sys-shape-corner-full);position:absolute}&:not(.-theme-preserve){accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary)}&:not(:disabled):hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:not(:disabled):active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:not(:disabled):focus-visible::before{content:"";height:15px;width:15px;border-radius:5px;position:absolute;border:2px solid var(--sys-color-state-focus-ring)}&.small:hover::after,\n    &.small:active::before{height:12px;width:12px;border-radius:2px}}}input::placeholder{--override-input-placeholder-color:rgb(0 0 0/54%);color:var(--override-input-placeholder-color)}.theme-with-dark-background input::placeholder,\n:host-context(.theme-with-dark-background) input::placeholder{--override-input-placeholder-color:rgb(230 230 230/54%)}.harmony-input:not([type]),\n.harmony-input[type="number"],\n.harmony-input[type="text"]{padding:3px 6px;height:24px;border:1px solid var(--sys-color-neutral-outline);border-radius:4px;&.error-input,\n  &:invalid{border-color:var(--sys-color-error)}&:not(.error-input, :invalid):focus{border-color:var(--sys-color-state-focus-ring)}&:not(.error-input, :invalid):hover:not(:focus){background:var(--sys-color-state-hover-on-subtle)}}input[type="radio"]{height:17px;width:17px;min-width:17px;border-radius:8px;vertical-align:sub;margin:0 5px 5px 0;accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary);&:focus{box-shadow:var(--legacy-focus-ring-active-shadow)}}@media (forced-colors: active){input[type="radio"]{--gradient-start:ButtonFace;--gradient-end:ButtonFace;&:checked{--gradient-start:Highlight;--gradient-end:Highlight}}}input[type="range"]{appearance:none;margin:0;padding:0;height:10px;width:88px;outline:none;background:none}input[type="range"]::-webkit-slider-thumb,\n.-theme-preserve{appearance:none;margin:0;padding:0;border:0;width:12px;height:12px;margin-top:-5px;border-radius:50%;background-color:var(--sys-color-primary)}input[type="range"]::-webkit-slider-runnable-track{appearance:none;margin:0;padding:0;width:100%;height:2px;background-color:var(--sys-color-surface-variant)}input[type="range"]:focus::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--sys-color-inverse-primary)}input[type="range"]:disabled::-webkit-slider-thumb{background-color:var(--sys-color-state-disabled)}@media (forced-colors: active){input[type="range"]{forced-color-adjust:none}}.highlighted-search-result.current-search-result{--override-current-search-result-background-color:rgb(255 127 0/80%);border-radius:1px;padding:1px;margin:-1px;background-color:var(--override-current-search-result-background-color)}.dimmed{opacity:60%}.editing{box-shadow:var(--drop-shadow);background-color:var(--sys-color-cdt-base-container);text-overflow:clip!important;padding-left:2px;margin-left:-2px;padding-right:2px;margin-right:-2px;margin-bottom:-1px;padding-bottom:1px;opacity:100%!important}.editing,\n.editing *{color:var(\n    --sys-color-on-surface\n  )!important;text-decoration:none!important}select{appearance:none;user-select:none;height:var(--sys-size-11);border:var(--sys-size-1) solid var(--sys-color-neutral-outline);border-radius:var(--sys-shape-corner-extra-small);color:var(--sys-color-on-surface);font:inherit;margin:0;outline:none;padding:0 var(--sys-size-9) 0 var(--sys-size-5);background-image:var(--combobox-dropdown-arrow);background-color:transparent;background-position:right center;background-repeat:no-repeat;&:disabled{opacity:100%;border-color:transparent;color:var(--sys-color-state-disabled);background-color:var(--sys-color-state-disabled-container);pointer-events:none}&:enabled{&:hover{background-color:var(--sys-color-state-hover-on-subtle)}&:active{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:hover:active{background:var(--combobox-dropdown-arrow),linear-gradient(var(--sys-color-state-hover-on-subtle),var(--sys-color-state-hover-on-subtle)),linear-gradient(var(--sys-color-state-ripple-neutral-on-subtle),var(--sys-color-state-ripple-neutral-on-subtle));background-position:right center;background-repeat:no-repeat}&:focus{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring);outline-offset:-1px}}}@media (forced-colors: active) and (prefers-color-scheme: light){:root,\n  .theme-with-dark-background,\n  :host-context(.theme-with-dark-background){--combobox-dropdown-arrow:var(--image-file-arrow-drop-down-light)}}@media (forced-colors: active) and (prefers-color-scheme: dark){:root,\n  .theme-with-dark-background,\n  :host-context(.theme-with-dark-background){--combobox-dropdown-arrow:var(--image-file-arrow-drop-down-dark)}}.chrome-select-label{margin:0 var(--sys-size-10);flex:none;p p{margin-top:0;color:var(--sys-color-token-subtle)}.reload-warning{margin-left:var(--sys-size-5)}}.settings-select{margin:0}select optgroup,\nselect option{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface)}.gray-info-message{text-align:center;font-style:italic;padding:6px;color:var(--sys-color-token-subtle);white-space:nowrap}.empty-state{margin:var(--sys-size-5);display:flex;flex-grow:1;justify-content:center;align-items:center;flex-direction:column;text-align:center;min-height:fit-content;min-width:fit-content;> *{max-width:var(--sys-size-29)}.empty-state-header{font:var(--sys-typescale-headline5);margin-bottom:var(--sys-size-3)}.empty-state-description{font:var(--sys-typescale-body4-regular);color:var(--sys-color-on-surface-subtle);> x-link{white-space:nowrap;margin-left:var(--sys-size-3)}}> devtools-button{margin-top:var(--sys-size-7)}}dt-icon-label{flex:none}.full-widget-dimmed-banner a{color:inherit}.full-widget-dimmed-banner{color:var(--sys-color-token-subtle);background-color:var(--sys-color-cdt-base-container);display:flex;justify-content:center;align-items:center;text-align:center;padding:20px;position:absolute;inset:0;font-size:13px;overflow:auto;z-index:500}.dot::before{content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-default);left:9px;position:absolute;top:9px;z-index:1}.green::before{background-color:var(--sys-color-green-bright)}.purple::before{background-color:var(--sys-color-purple-bright)}.expandable-inline-button{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface);cursor:pointer;border-radius:3px}.undisplayable-text,\n.expandable-inline-button{border:none;padding:1px 3px;margin:0 2px;font-size:11px;font-family:sans-serif;white-space:nowrap;display:inline-block}.undisplayable-text::after,\n.expandable-inline-button::after{content:attr(data-text)}.undisplayable-text{color:var(--sys-color-state-disabled);font-style:italic}.expandable-inline-button:hover,\n.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-hover-on-subtle)}.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-focus-highlight)}::selection{background-color:var(--sys-color-state-text-highlight);color:var(--sys-color-state-on-text-highlight)}button.link{border:none;background:none;padding:3px}button.link:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px;border-radius:var(--sys-shape-corner-full)}.data-grid-data-grid-node button.link:focus-visible{border-radius:var(--sys-shape-corner-extra-small);padding:0;margin-top:3px}@media (forced-colors: active){.dimmed,\n  select:disabled{opacity:100%}.harmony-input:not([type]),\n  .harmony-input[type="number"],\n  .harmony-input[type="text"]{border:1px solid ButtonText}.harmony-input:not([type]):focus,\n  .harmony-input[type="number"]:focus,\n  .harmony-input[type="text"]:focus{border:1px solid Highlight}}input.custom-search-input::-webkit-search-cancel-button{appearance:none;width:16px;height:15px;margin-right:0;opacity:70%;mask-image:var(--image-file-cross-circle-filled);mask-position:center;mask-repeat:no-repeat;mask-size:99%;background-color:var(--icon-default)}input.custom-search-input::-webkit-search-cancel-button:hover{opacity:99%}.spinner::before{display:block;width:var(--dimension,24px);height:var(--dimension,24px);border:var(--override-spinner-size,3px) solid var(--override-spinner-color,var(--sys-color-token-subtle));border-radius:12px;clip:rect(0,var(--clip-size,15px),var(--clip-size,15px),0);content:"";position:absolute;animation:spinner-animation 1s linear infinite;box-sizing:border-box}@keyframes spinner-animation{from{transform:rotate(0)}to{transform:rotate(360deg)}}.adorner-container{display:inline-flex;vertical-align:middle}.adorner-container.hidden{display:none}.adorner-container devtools-adorner{margin-left:3px}:host-context(.theme-with-dark-background) devtools-adorner{--override-adorner-border-color:var(--sys-color-tonal-outline);--override-adorner-active-background-color:var(\n    --sys-color-state-riple-neutral-on-subtle\n  )}.panel{display:flex;overflow:hidden;position:absolute;inset:0;z-index:0;background-color:var(--sys-color-cdt-base-container)}.panel-sidebar{overflow-x:hidden;background-color:var(--sys-color-cdt-base-container)}iframe.extension{flex:auto;width:100%;height:100%}iframe.panel.extension{display:block;height:100%}@media (forced-colors: active){:root{--legacy-accent-color:Highlight;--legacy-focus-ring-inactive-shadow-color:ButtonText}}devtools-toolbar{& > *{position:relative;display:flex;background-color:transparent;flex:none;align-items:center;justify-content:center;height:var(--toolbar-height);border:none;white-space:pre;overflow:hidden;max-width:100%;color:var(--icon-default);cursor:default;& .devtools-link{color:var(--icon-default)}}.status-buttons{padding:0 var(--sys-size-2);gap:var(--sys-size-2)}& > :not(select){padding:0}& > devtools-issue-counter{margin-top:-4px;padding:0 1px}devtools-adorner.fix-perf-icon{--override-adorner-text-color:transparent;--override-adorner-border-color:transparent;--override-adorner-background-color:transparent}devtools-issue-counter.main-toolbar{margin-left:1px;margin-right:1px}.toolbar-dropdown-arrow{pointer-events:none;flex:none;top:2px}.toolbar-button.dark-text .toolbar-dropdown-arrow{color:var(--sys-color-on-surface)}.toolbar-button{white-space:nowrap;overflow:hidden;min-width:28px;background:transparent;border-radius:0;&[aria-haspopup="true"][aria-expanded="true"]{pointer-events:none}}.toolbar-item-search{min-width:5.2em;max-width:300px;flex:1 1 auto;justify-content:start;overflow:revert}.toolbar-text{margin:0 5px;flex:none;color:var(--ui-text)}.toolbar-text:empty{margin:0}.toolbar-has-dropdown{justify-content:space-between;height:var(--sys-size-9);padding:0 var(--sys-size-2) 0 var(--sys-size-4);margin:0 var(--sys-size-2);gap:var(--sys-size-2);border-radius:var(--sys-shape-corner-extra-small);&:hover::after,\n    &:active::before{content:"";height:100%;width:100%;border-radius:inherit;position:absolute;top:0;left:0}&:hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:focus-visible{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring)}&[disabled]{pointer-events:none;background-color:var(--sys-color-state-disabled-container);color:var(--sys-color-state-disabled)}}.toolbar-has-dropdown-shrinkable{flex-shrink:1}.toolbar-has-dropdown .toolbar-text{margin:0;text-overflow:ellipsis;flex:auto;overflow:hidden;text-align:right}.toolbar-button:not(.toolbar-has-dropdown):focus-visible::before{position:absolute;inset:2px;background-color:var(--sys-color-state-focus-highlight);border-radius:2px;content:"";z-index:-1}.toolbar-glyph{flex:none}.toolbar-button:disabled{opacity:50%}.toolbar-button.copied-to-clipboard::after{content:attr(data-content);position:fixed;margin-top:calc(2 * var(--toolbar-height));padding:3px 5px;color:var(--sys-color-token-subtle);background:var(--sys-color-cdt-base-container);animation:2s fade-out;font-weight:normal;border:1px solid var(--sys-color-divider);border-radius:3px}.toolbar-button.toolbar-state-on .toolbar-glyph{color:var(--icon-toggled)}.toolbar-state-on.toolbar-toggle-with-dot .toolbar-text::after{content:"";position:absolute;bottom:2px;background-color:var(--sys-color-primary-bright);width:4.5px;height:4.5px;border:2px solid var(--override-toolbar-background-color,--sys-color-cdt-base-container);border-radius:50%;right:0}.toolbar-button.toolbar-state-on.toolbar-toggle-with-red-color .toolbar-glyph,\n  .toolbar-button.toolbar-state-off.toolbar-default-with-red-color\n    .toolbar-glyph{color:var(\n      --icon-error\n    )!important}.toolbar-button:not(\n      .toolbar-has-glyph,\n      .toolbar-has-dropdown,\n      .largeicon-menu,\n      .toolbar-button-secondary\n    ){font-weight:bold}.toolbar-button.dark-text .toolbar-text{color:var(\n      --sys-color-on-surface\n    )!important}.toolbar-button.toolbar-state-on .toolbar-text{color:var(--sys-color-primary)}.toolbar-button.toolbar-state-on:enabled:active .toolbar-text{color:var(--sys-color-primary-bright)}.toolbar-button:enabled:hover:not(:active) .toolbar-glyph{color:var(--sys-color-on-surface)}.toolbar-button:enabled:hover:not(:active) .toolbar-text{color:var(--sys-color-on-surface)}.toolbar-button.toolbar-state-on:enabled:hover:not(:active) .toolbar-glyph{color:var(--sys-color-primary)}.toolbar-button.toolbar-state-on:enabled:hover:not(:active) .toolbar-text{color:var(--sys-color-primary)}& > dt-checkbox{padding:0 5px 0 0}& > select{height:var(--sys-size-9);min-width:var(--sys-size-14)}.toolbar-input{box-shadow:inset 0 0 0 2px transparent;box-sizing:border-box;width:120px;height:var(--sys-size-9);padding:0 var(--sys-size-2) 0 var(--sys-size-5);margin:1px 3px;border-radius:100px;min-width:35px;position:relative;&.focused{box-shadow:inset 0 0 0 2px var(--sys-color-state-focus-ring)}&:not(:has(devtools-button:hover), .disabled):hover{background-color:var(--sys-color-state-hover-on-subtle)}&::before{content:"";box-sizing:inherit;height:100%;width:100%;position:absolute;left:0;background:var(--sys-color-cdt-base);z-index:-1}& > devtools-icon{color:var(--sys-color-on-surface-subtle);width:var(--sys-size-8);height:var(--sys-size-8);margin-right:var(--sys-size-3)}&.disabled > devtools-icon{color:var(--sys-color-state-disabled)}}.toolbar-filter .toolbar-input-clear-button{margin-right:var(--sys-size-4)}.toolbar-input-empty .toolbar-input-clear-button{display:none}.toolbar-prompt-proxy{flex:1}.toolbar-input-prompt{flex:1;overflow:hidden;white-space:nowrap;cursor:text;color:var(--sys-color-on-surface)}.toolbar-divider{background-color:var(--sys-color-divider);width:1px;margin:5px 4px;height:16px}.toolbar-spacer{flex:auto}.toolbar-button.emulate-active{background-color:var(--sys-color-surface-variant)}&:not([floating]) > :last-child:not(:first-child, select){flex-shrink:1;justify-content:left}&:not([floating]) > .toolbar-button:last-child:not(:first-child, select){justify-content:left;margin-right:2px}& > .highlight::before{content:"";position:absolute;inset:2px;border-radius:2px;background:var(--sys-color-neutral-container);z-index:-1}& > .highlight:focus-visible{background:var(--sys-color-tonal-container);& > .title{color:var(--sys-color-on-tonal-container)}}devtools-icon.leading-issue-icon{margin:0 7px}@media (forced-colors: active){.toolbar-button:disabled{opacity:100%;color:Graytext}devtools-toolbar > *,\n    .toolbar-text{color:ButtonText}.toolbar-button:disabled .toolbar-text{color:Graytext}devtools-toolbar > select:disabled{opacity:100%;color:Graytext}.toolbar-button.toolbar-state-on .toolbar-glyph{forced-color-adjust:none;color:Highlight}.toolbar-button.toolbar-state-on .toolbar-text{forced-color-adjust:none;color:Highlight}.toolbar-button:enabled:hover:not(:active) .toolbar-text,\n    .toolbar-button:enabled:focus:not(:active) .toolbar-text{color:HighlightText}.toolbar-button:disabled devtools-icon{color:GrayText}.toolbar-button:disabled .toolbar-glyph{color:GrayText}.toolbar-button:enabled.hover:not(:active) .toolbar-glyph{forced-color-adjust:none;color:Highlight}.toolbar-button:enabled:hover .toolbar-glyph,\n    .toolbar-button:enabled:focus .toolbar-glyph,\n    .toolbar-button:enabled:hover:not(:active) .toolbar-glyph,\n    .toolbar-button:enabled:hover devtools-icon,\n    .toolbar-button:enabled:focus devtools-icon{color:HighlightText}.toolbar-input{forced-color-adjust:none;background:canvas;box-shadow:var(--legacy-focus-ring-inactive-shadow)}.toolbar-input.focused,\n    .toolbar-input:not(.toolbar-input-empty){forced-color-adjust:none;background:canvas;box-shadow:var(--legacy-focus-ring-active-shadow)}.toolbar-input:hover{box-shadow:var(--legacy-focus-ring-active-shadow)}devtools-toolbar .devtools-link{color:linktext}.toolbar-has-dropdown{forced-color-adjust:none;background:ButtonFace;color:ButtonText}}}@keyframes fade-out{from{opacity:100%}to{opacity:0%}}.webkit-css-property{color:var(--webkit-css-property-color,var(--sys-color-token-property-special))}.webkit-html-comment{color:var(--sys-color-token-comment)}.webkit-html-tag{color:var(--sys-color-token-tag)}.webkit-html-tag-name,\n.webkit-html-close-tag-name{color:var(--sys-color-token-tag)}.webkit-html-pseudo-element{color:var(--sys-color-token-pseudo-element)}.webkit-html-js-node,\n.webkit-html-css-node{color:var(--text-primary);white-space:pre-wrap}.webkit-html-text-node{color:var(--text-primary);unicode-bidi:-webkit-isolate}.webkit-html-entity-value{background-color:rgb(0 0 0/15%);unicode-bidi:-webkit-isolate}.webkit-html-doctype{color:var(--text-secondary)}.webkit-html-attribute-name{color:var(--sys-color-token-attribute);unicode-bidi:-webkit-isolate}.webkit-html-attribute-value{color:var(--sys-color-token-attribute-value);unicode-bidi:-webkit-isolate;word-break:break-all}.devtools-link{color:var(--text-link);text-decoration:underline;outline-offset:2px;.elements-disclosure &{color:var(--text-link)}devtools-icon{vertical-align:baseline;color:var(--sys-color-primary)}:focus .selected & devtools-icon{color:var(--sys-color-tonal-container)}&:focus-visible{outline-width:unset}&.invalid-link{color:var(--text-disabled);text-decoration:none}&:not(.devtools-link-prevent-click, .invalid-link){cursor:pointer}@media (forced-colors: active){&:not(.devtools-link-prevent-click){forced-color-adjust:none;color:linktext}&:focus-visible{background:Highlight;color:HighlightText}}}\n/*# sourceURL=${import.meta.resolve("./inspectorCommon.css")} */\n`},H={cssText:`:host{overflow:auto;height:100%}.reporting-container{height:100%;display:flex;flex-direction:column}.reporting-header{font-size:15px;background-color:var(--sys-color-surface2);padding:1px 4px;flex-shrink:0}devtools-data-grid{flex:auto}.inline-icon{vertical-align:text-bottom}\n/*# sourceURL=${import.meta.resolve("./reportingApiGrid.css")} */\n`};const O={noEndpointsToDisplay:"No endpoints to display",endpointsDescription:"Here you will find the list of endpoints that receive the reports"},z=o.i18n.registerUIStrings("panels/application/components/EndpointsGrid.ts",O),W=o.i18n.getLocalizedString.bind(void 0,z),{render:U,html:q}=s;class j extends HTMLElement{#e=this.attachShadow({mode:"open"});#I=new Map;connectedCallback(){this.#$()}set data(e){this.#I=e.endpoints,this.#$()}#$(){U(q`
      <style>${H.cssText}</style>
      <style>${A.cssText}</style>
      <div class="reporting-container" jslog=${l.section("endpoints")}>
        <div class="reporting-header">${o.i18n.lockedString("Endpoints")}</div>
        ${this.#I.size>0?q`
          <devtools-data-grid striped>
           <table>
            <tr>
              <th id="origin" weight="30">${o.i18n.lockedString("Origin")}</th>
              <th id="name" weight="20">${o.i18n.lockedString("Name")}</th>
              <th id="url" weight="30">${o.i18n.lockedString("URL")}</th>
            </tr>
            ${Array.from(this.#I).map((([e,t])=>t.map((t=>q`<tr>
                  <td>${e}</td>
                  <td>${t.groupName}</td>
                  <td>${t.url}</td>
                </tr>`)))).flat()}
            </table>
          </devtools-data-grid>
        `:q`
          <div class="empty-state">
            <span class="empty-state-header">${W(O.noEndpointsToDisplay)}</span>
            <span class="empty-state-description">${W(O.endpointsDescription)}</span>
          </div>
        `}
      </div>
    `,this.#e,{host:this})}}customElements.define("devtools-resources-endpoints-grid",j);var _=Object.freeze({__proto__:null,EndpointsGrid:j,i18nString:W}),V=`button.link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;border:none;background:none;font-family:inherit;font-size:inherit}\n/*# sourceURL=${import.meta.resolve("./stackTraceLinkButton.css")} */\n`,G=`.stack-trace-row{display:flex}.stack-trace-function-name{width:100px}.stack-trace-source-location{display:flex;overflow:hidden}.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stack-trace-source-location .text-ellipsis{padding-right:2px}.ignore-list-link{opacity:60%}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;border:none;background:none;font-family:inherit;font-size:var(--sys-size-6);&:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:0;border-radius:var(--sys-shape-corner-extra-small)}}\n/*# sourceURL=${import.meta.resolve("./stackTraceRow.css")} */\n`;const{html:K}=s,X={cannotRenderStackTrace:"Cannot render stack trace",showSMoreFrames:"{n, plural, =1 {Show # more frame} other {Show # more frames}}",showLess:"Show less",creationStackTrace:"Frame Creation `Stack Trace`"},J=o.i18n.registerUIStrings("panels/application/components/StackTrace.ts",X),Y=o.i18n.getLocalizedString.bind(void 0,J);class Q extends HTMLElement{#e=this.attachShadow({mode:"open"});#B=null;set data(e){this.#B=e.stackTraceRowItem,this.#$()}#$(){this.#B&&s.render(K`
      <style>${G}</style>
      <div class="stack-trace-row">
              <div class="stack-trace-function-name text-ellipsis" title=${this.#B.functionName}>
                ${this.#B.functionName}
              </div>
              <div class="stack-trace-source-location">
                ${this.#B.link?K`<div class="text-ellipsis">\xA0@\xA0${this.#B.link}</div>`:s.nothing}
              </div>
            </div>
    `,this.#e,{host:this})}}class Z extends HTMLElement{#e=this.attachShadow({mode:"open"});#E=()=>{};#F=null;#L=!1;set data(e){this.#E=e.onShowAllClick,this.#F=e.hiddenCallFramesCount,this.#L=e.expandedView,this.#$()}#$(){if(!this.#F)return;const e=this.#L?Y(X.showLess):Y(X.showSMoreFrames,{n:this.#F});s.render(K`
      <style>${V}</style>
      <div class="stack-trace-row">
          <button class="link" @click=${()=>this.#E()}>
            ${e}
          </button>
        </div>
    `,this.#e,{host:this})}}class ee extends HTMLElement{#e=this.attachShadow({mode:"open"});#N=new i.Linkifier.Linkifier;#A=[];#H=!1;set data(e){const t=e.frame,{creationStackTrace:o,creationStackTraceTarget:r}=t.getCreationStackTraceData();o&&(this.#A=e.buildStackTraceRows(o,r,this.#N,!0,this.#O.bind(this))),this.#$()}#O(e){this.#A=e,this.#$()}#z(){this.#H=!this.#H,this.#$()}createRowTemplates(){const e=[];let t=0;for(const o of this.#A){let r=!1;if("link"in o&&o.link){const e=i.Linkifier.Linkifier.uiLocation(o.link);e&&c.IgnoreListManager.IgnoreListManager.instance().isUserOrSourceMapIgnoreListedUISourceCode(e.uiSourceCode)&&(r=!0)}!this.#H&&r||("functionName"in o&&e.push(K`
          <devtools-stack-trace-row data-stack-trace-row .data=${{stackTraceRowItem:o}}></devtools-stack-trace-row>`),"asyncDescription"in o&&e.push(K`
            <div>${o.asyncDescription}</div>
          `)),"functionName"in o&&r&&t++}return t&&e.push(K`
      <devtools-stack-trace-link-button data-stack-trace-row .data=${{onShowAllClick:this.#z.bind(this),hiddenCallFramesCount:t,expandedView:this.#H}}></devtools-stack-trace-link-button>
      `),e}#$(){if(!this.#A.length)return void s.render(K`
          <span>${Y(X.cannotRenderStackTrace)}</span>
        `,this.#e,{host:this});const e=this.createRowTemplates();s.render(K`
        <devtools-expandable-list .data=${{rows:e,title:Y(X.creationStackTrace)}}
                                  jslog=${l.tree()}>
        </devtools-expandable-list>
      `,this.#e,{host:this})}}customElements.define("devtools-stack-trace-row",Q),customElements.define("devtools-stack-trace-link-button",Z),customElements.define("devtools-resources-stack-trace",ee);var te=Object.freeze({__proto__:null,StackTrace:ee,StackTraceLinkButton:Z,StackTraceRow:Q}),oe=`.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button ~ .text-ellipsis{padding-left:2px}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;padding:0;margin-left:var(--sys-size-3);white-space:nowrap}button.link{border:none;background:none;font-family:inherit;font-size:inherit;height:16px}button.link:has(devtools-icon){margin-top:5px}devtools-button.help-button{top:4px;position:relative}button.text-link{padding-left:2px;height:26px}.inline-button{padding-left:1ex}.inline-comment{padding-left:1ex;white-space:pre-line}.inline-comment::before{content:"("}.inline-comment::after{content:")"}.inline-name{color:var(--sys-color-token-subtle);padding-right:4px;user-select:none;white-space:pre-line}.inline-items{display:flex}.span-cols{grid-column-start:span 2;margin-left:var(--sys-size-9);line-height:28px}.report-section:has(.link){line-height:var(--sys-size-12)}.without-min-width{min-width:auto}.bold{font-weight:bold}.link:not(button):has(devtools-icon){vertical-align:baseline;margin-inline-start:3px}.inline-icon{margin-bottom:-5px;width:18px;height:18px;vertical-align:baseline}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=${import.meta.resolve("./frameDetailsReportView.css")} */\n`,re=`:host .badge-error{--override-adorner-text-color:var(--sys-color-error-bright);--override-adorner-border-color:var(--sys-color-error-bright)}:host .badge-success{--override-adorner-text-color:var(--sys-color-tertiary);--override-adorner-border-color:var(--sys-color-tertiary)}:host .badge-secondary{--override-adorner-text-color:var(--sys-color-token-subtle);--override-adorner-border-color:var(--sys-color-token-subtle)}:host{font-family:var(--source-code-font-family)}\n/*# sourceURL=${import.meta.resolve("./badge.css")} */\n`,ae=`.content{display:grid;grid-template-columns:min-content 1fr}.key{color:var(--sys-color-token-subtle);padding:0 6px;text-align:right;white-space:pre}.value{color:var(--sys-color-token-subtle);margin-inline-start:0;padding:0 6px}.error-text{color:var(--sys-color-error-bright);font-weight:bold}\n/*# sourceURL=${import.meta.resolve("./originTrialTokenRows.css")} */\n`,ne=`.status-badge{border-radius:4px;padding:4px;background:var(--sys-color-neutral-container);& > devtools-icon{vertical-align:sub}}\n/*# sourceURL=${import.meta.resolve("./originTrialTreeView.css")} */\n`;const{html:ie,Directives:{ifDefined:se}}=s,le={origin:"Origin",trialName:"Trial Name",expiryTime:"Expiry Time",usageRestriction:"Usage Restriction",isThirdParty:"Third Party",matchSubDomains:"Subdomain Matching",rawTokenText:"Raw Token",status:"Token Status",token:"Token",tokens:"{PH1} tokens",noTrialTokens:"No trial tokens"},ce=o.i18n.registerUIStrings("panels/application/components/OriginTrialTreeView.ts",le),de=o.i18n.getLocalizedString.bind(void 0,ce);class he extends HTMLElement{#e=this.attachShadow({mode:"open"});#W=new m.Adorner.Adorner;set data(e){this.#$(e)}#$(e){const t=document.createElement("span");t.textContent=e.badgeContent,this.#W.data={name:"badge",content:t},this.#W.classList.add(`badge-${e.style}`),s.render(ie`
      <style>${re}</style>
      ${this.#W}
    `,this.#e,{host:this})}}function ue(e){return{treeNodeData:e,id:"OriginTrialTreeNode#"+e.trialName,children:async()=>e.tokensWithStatus.length>1?e.tokensWithStatus.map(pe):me(e.tokensWithStatus[0]),renderer:e=>{const t=e.treeNodeData,o=ie`
        <devtools-resources-origin-trial-tree-view-badge .data=${{badgeContent:de(le.tokens,{PH1:t.tokensWithStatus.length}),style:"secondary"}}></devtools-resources-origin-trial-tree-view-badge>
      `;return ie`
        ${t.trialName}
        <devtools-resources-origin-trial-tree-view-badge .data=${{badgeContent:t.status,style:"Enabled"===t.status?"success":"error"}}></devtools-resources-origin-trial-tree-view-badge>
        ${t.tokensWithStatus.length>1?o:s.nothing}
      `}}}function pe(e){return{treeNodeData:e.status,id:"TokenNode#"+e.rawTokenText,children:async()=>me(e),renderer:(e,t)=>{const o=e.treeNodeData,r=ie`
        <devtools-resources-origin-trial-tree-view-badge .data=${{badgeContent:o,style:"Success"===o?"success":"error"}}></devtools-resources-origin-trial-tree-view-badge>
      `;return ie`${de(le.token)} ${t.isExpanded?s.nothing:r}`}}}function ge(e){return ie`
    <devtools-resources-origin-trial-token-rows .data=${{node:e}}>
    </devtools-resources-origin-trial-token-rows>
    `}function me(e){return[{treeNodeData:e,id:"TokenDetailsNode#"+e.rawTokenText,renderer:ge},(t=e.rawTokenText,{treeNodeData:de(le.rawTokenText),id:"TokenRawTextContainerNode#"+t,children:async()=>[{treeNodeData:t,id:"TokenRawTextNode#"+t,renderer:e=>{const t=e.treeNodeData;return ie`
        <div style="overflow-wrap: break-word;">
          ${t}
        </div>
        `}}]})];var t}function ve(e){return ie`${String(e.treeNodeData)}`}customElements.define("devtools-resources-origin-trial-tree-view-badge",he);class be extends HTMLElement{#e=this.attachShadow({mode:"open"});#U=null;#q=[];#j=new Intl.DateTimeFormat(o.DevToolsLocale.DevToolsLocale.instance().locale,{dateStyle:"long",timeStyle:"long"});set data(e){this.#U=e.node.treeNodeData,this.#_()}connectedCallback(){this.#$()}#V=(e,t)=>ie`
        <div class=${se(t?"error-text":void 0)}>
          ${e}
        </div>`;#_(){this.#U?.parsedToken&&(this.#q=[{name:de(le.origin),value:this.#V(this.#U.parsedToken.origin,"WrongOrigin"===this.#U.status)},{name:de(le.expiryTime),value:this.#V(this.#j.format(1e3*this.#U.parsedToken.expiryTime),"Expired"===this.#U.status)},{name:de(le.usageRestriction),value:this.#V(this.#U.parsedToken.usageRestriction)},{name:de(le.isThirdParty),value:this.#V(this.#U.parsedToken.isThirdParty.toString())},{name:de(le.matchSubDomains),value:this.#V(this.#U.parsedToken.matchSubDomains.toString())}],"UnknownTrial"===this.#U.status&&(this.#q=[{name:de(le.trialName),value:this.#V(this.#U.parsedToken.trialName)},...this.#q]))}#$(){if(!this.#U)return;const e=[{name:de(le.status),value:ie`
          <devtools-resources-origin-trial-tree-view-badge .data=${{badgeContent:this.#U.status,style:"Success"===this.#U.status?"success":"error"}}></devtools-resources-origin-trial-tree-view-badge>`},...this.#q].map((e=>ie`
          <div class="key">${e.name}</div>
          <div class="value">${e.value}</div>
          `));s.render(ie`
      <style>${ae}</style>
      <div class="content">
        ${e}
      </div>
    `,this.#e,{host:this})}}customElements.define("devtools-resources-origin-trial-token-rows",be);class ke extends HTMLElement{#e=this.attachShadow({mode:"open"});set data(e){this.#$(e.trials)}#$(e){e.length?s.render(ie`
      <style>${ne}</style>
      <devtools-tree-outline .data=${{tree:e.map(ue),defaultRenderer:ve}}>
      </devtools-tree-outline>
    `,this.#e,{host:this}):s.render(ie`
    <style>${ne}</style>
    <span class="status-badge">
      <devtools-icon
          .data=${{iconName:"clear",color:"var(--icon-default)",width:"16px",height:"16px"}}
        >
      </devtools-icon>
      <span>${de(le.noTrialTokens)}</span>
    </span>`,this.#e,{host:this})}}customElements.define("devtools-resources-origin-trial-tree-view",ke);var fe=Object.freeze({__proto__:null,Badge:he,OriginTrialTokenRows:be,OriginTrialTreeView:ke}),we=`:host{display:contents}.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}button.link{border:none;background:none;font-family:inherit;font-size:inherit}.policies-list{padding-top:3px}.permissions-row{display:flex;line-height:22px}.permissions-row div{padding-right:5px}.feature-name{width:135px}.allowed-icon{vertical-align:sub}.block-reason{width:215px}.disabled-features-button{padding-left:var(--sys-size-3)}\n/*# sourceURL=${import.meta.resolve("./permissionsPolicySection.css")} */\n`;const{html:ye}=s,xe={showDetails:"Show details",hideDetails:"Hide details",allowedFeatures:"Allowed Features",disabledFeatures:"Disabled Features",clickToShowHeader:'Click to reveal the request whose "`Permissions-Policy`" HTTP header disables this feature.',clickToShowIframe:"Click to reveal the top-most iframe which does not allow this feature in the elements panel.",disabledByIframe:'missing in iframe "`allow`" attribute',disabledByHeader:'disabled by "`Permissions-Policy`" header',disabledByFencedFrame:"disabled inside a `fencedframe`"},Se=o.i18n.registerUIStrings("panels/application/components/PermissionsPolicySection.ts",xe),Te=o.i18n.getLocalizedString.bind(void 0,Se);function $e(e,t,o,r){return ye`
  <devtools-button
    .iconName=${e}
    title=${t}
    .variant=${"icon"}
    .size=${"SMALL"}
    @click=${o}
    jslog=${l.action().track({click:!0}).context(r)}></devtools-button>
  `}class Ce extends HTMLElement{#e=this.attachShadow({mode:"open"});#G={policies:[],showDetails:!1};set data(e){this.#G=e,this.#$()}#K(){this.#G.showDetails=!this.#G.showDetails,this.#$()}#X(){const e=this.#G.policies.filter((e=>e.allowed)).map((e=>e.feature)).sort();return e.length?ye`
      <devtools-report-key>${Te(xe.allowedFeatures)}</devtools-report-key>
      <devtools-report-value>
        ${e.join(", ")}
      </devtools-report-value>
    `:s.nothing}async#J(){const e=this.#G.policies.filter((e=>!e.allowed)).sort(((e,t)=>e.feature.localeCompare(t.feature)));if(!e.length)return s.nothing;if(!this.#G.showDetails)return ye`
        <devtools-report-key>${Te(xe.disabledFeatures)}</devtools-report-key>
        <devtools-report-value>
          ${e.map((e=>e.feature)).join(", ")}
          <devtools-button
          class="disabled-features-button"
          .variant=${"outlined"}
          @click=${()=>this.#K()}
          jslog=${l.action("show-disabled-features-details").track({click:!0})}>${Te(xe.showDetails)}
        </devtools-button>
        </devtools-report-value>
      `;const o=r.FrameManager.FrameManager.instance(),a=await Promise.all(e.map((async e=>{const r=e.locator?o.getFrame(e.locator.frameId):null,a=e.locator?.blockReason,n=await("IframeAttribute"===a&&r?.getOwnerDOMNodeOrDocument()),i=r?.resourceForURL(r.url),l="Header"===a&&i?.request,c=(()=>{switch(a){case"IframeAttribute":return Te(xe.disabledByIframe);case"Header":return Te(xe.disabledByHeader);case"InFencedFrameTree":return Te(xe.disabledByFencedFrame);default:return""}})();return ye`
        <div class="permissions-row">
          <div>
            <devtools-icon class="allowed-icon"
              .data=${{color:"var(--icon-error)",iconName:"cross-circle",width:"20px",height:"20px"}}>
            </devtools-icon>
          </div>
          <div class="feature-name text-ellipsis">
            ${e.feature}
          </div>
          <div class="block-reason">${c}</div>
          <div>
            ${n?$e("code-circle",Te(xe.clickToShowIframe),(()=>t.Revealer.reveal(n)),"reveal-in-elements"):s.nothing}
            ${l?$e("arrow-up-down-circle",Te(xe.clickToShowHeader),(async()=>{if(!l)return;const e=l.responseHeaderValue("permissions-policy")?"permissions-policy":"feature-policy",o=p.UIRequestLocation.UIRequestLocation.responseHeaderMatch(l,{name:e,value:""});await t.Revealer.reveal(o)}),"reveal-in-network"):s.nothing}
          </div>
        </div>
      `})));return ye`
      <devtools-report-key>${Te(xe.disabledFeatures)}</devtools-report-key>
      <devtools-report-value class="policies-list">
        ${a}
        <div class="permissions-row">
        <devtools-button
          .variant=${"outlined"}
          @click=${()=>this.#K()}
          jslog=${l.action("hide-disabled-features-details").track({click:!0})}>${Te(xe.hideDetails)}
        </devtools-button>
        </div>
      </devtools-report-value>
    `}async#$(){await n.write("PermissionsPolicySection render",(()=>{s.render(ye`
          <style>${we}</style>
          <devtools-report-section-header>${o.i18n.lockedString("Permissions Policy")}</devtools-report-section-header>
          ${this.#X()}
          ${this.#G.policies.findIndex((e=>e.allowed))>0||this.#G.policies.findIndex((e=>!e.allowed))>0?ye`<devtools-report-divider class="subsection-divider"></devtools-report-divider>`:s.nothing}
          ${s.Directives.until(this.#J(),s.nothing)}
          <devtools-report-divider></devtools-report-divider>
        `,this.#e,{host:this})}))}}customElements.define("devtools-resources-permissions-policy-section",Ce);const{html:Pe}=s,Re={additionalInformation:"Additional Information",thisAdditionalDebugging:"This additional (debugging) information is shown because the 'Protocol Monitor' experiment is enabled.",frameId:"Frame ID",document:"Document",url:"URL",clickToOpenInSourcesPanel:"Click to open in Sources panel",clickToOpenInNetworkPanel:"Click to open in Network panel",unreachableUrl:"Unreachable URL",clickToOpenInNetworkPanelMight:"Click to open in Network panel (might require page reload)",origin:"Origin",ownerElement:"Owner Element",clickToOpenInElementsPanel:"Click to open in Elements panel",adStatus:"Ad Status",rootDescription:"This frame has been identified as the root frame of an ad",root:"root",childDescription:"This frame has been identified as a child frame of an ad",child:"child",securityIsolation:"Security & Isolation",contentSecurityPolicy:"Content Security Policy (CSP)",secureContext:"Secure Context",yes:"Yes",no:"No",crossoriginIsolated:"Cross-Origin Isolated",localhostIsAlwaysASecureContext:"`Localhost` is always a secure context",aFrameAncestorIsAnInsecure:"A frame ancestor is an insecure context",theFramesSchemeIsInsecure:"The frame's scheme is insecure",reportingTo:"reporting to",apiAvailability:"API availability",availabilityOfCertainApisDepends:"Availability of certain APIs depends on the document being cross-origin isolated.",availableTransferable:"available, transferable",availableNotTransferable:"available, not transferable",unavailable:"unavailable",sharedarraybufferConstructorIs:"`SharedArrayBuffer` constructor is available and `SABs` can be transferred via `postMessage`",sharedarraybufferConstructorIsAvailable:"`SharedArrayBuffer` constructor is available but `SABs` cannot be transferred via `postMessage`",willRequireCrossoriginIsolated:"⚠️ will require cross-origin isolated context in the future",requiresCrossoriginIsolated:"requires cross-origin isolated context",transferRequiresCrossoriginIsolatedPermission:"`SharedArrayBuffer` transfer requires enabling the permission policy:",available:"available",thePerformanceAPI:"The `performance.measureUserAgentSpecificMemory()` API is available",thePerformancemeasureuseragentspecificmemory:"The `performance.measureUserAgentSpecificMemory()` API is not available",measureMemory:"Measure Memory",learnMore:"Learn more",creationStackTrace:"Frame Creation `Stack Trace`",creationStackTraceExplanation:"This frame was created programmatically. The `stack trace` shows where this happened.",parentIsAdExplanation:"This frame is considered an ad frame because its parent frame is an ad frame.",matchedBlockingRuleExplanation:"This frame is considered an ad frame because its current (or previous) main document is an ad resource.",createdByAdScriptExplanation:"There was an ad script in the `(async) stack` when this frame was created. Examining the creation `stack trace` of this frame might provide more insight.",creatorAdScript:"Creator Ad Script",none:"None",originTrialsExplanation:"Origin trials give you access to a new or experimental feature."},Me=o.i18n.registerUIStrings("panels/application/components/FrameDetailsView.ts",Re),De=o.i18n.getLocalizedString.bind(void 0,Me);class Ie extends a.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#Y;#Q;#Z=!1;#ee=null;#G={policies:[],showDetails:!1};#te=new ke;#N=new i.Linkifier.Linkifier;#oe=null;constructor(e){super(),this.#Y=e,this.render()}connectedCallback(){this.parentElement?.classList.add("overflow-auto"),this.#Z=h.Runtime.experiments.isEnabled("protocol-monitor")}async render(){this.#oe=await(this.#Y?.parentFrame()?.getAdScriptId(this.#Y?.id))||null;const e=this.#oe?.debuggerId?await r.DebuggerModel.DebuggerModel.modelForDebuggerId(this.#oe?.debuggerId):null;this.#Q=e?.target(),!this.#ee&&this.#Y&&(this.#ee=this.#Y.getPermissionsPolicyState()),await n.write("FrameDetailsView render",(()=>{this.#Y&&s.render(Pe`
        <style>${oe}</style>
        <devtools-report .data=${{reportTitle:this.#Y.displayName()}}
        jslog=${l.pane("frames")}>
          ${this.#re()}
          ${this.#ae()}
          ${this.#ne()}
          ${this.#ie()}
          ${s.Directives.until(this.#ee?.then((e=>(this.#G.policies=e||[],Pe`
              <devtools-resources-permissions-policy-section
                .data=${this.#G}
              >
              </devtools-resources-permissions-policy-section>
            `))),s.nothing)}
          ${this.#Z?this.#se():s.nothing}
        </devtools-report>
      `,this.#e,{host:this})}))}#ie(){return this.#Y?(this.#te.classList.add("span-cols"),this.#Y.getOriginTrials().then((e=>{this.#te.data={trials:e}})),Pe`
    <devtools-report-section-header>${o.i18n.lockedString("Origin trials")}</devtools-report-section-header>
    <devtools-report-section><span class="report-section">${De(Re.originTrialsExplanation)}
        <x-link href="https://developer.chrome.com/docs/web-platform/origin-trials/" class="link"
        jslog=${l.link("learn-more.origin-trials").track({click:!0})}>${De(Re.learnMore)}</x-link></span>
    </devtools-report-section>
    ${this.#te}
    <devtools-report-divider></devtools-report-divider>
    `):s.nothing}#re(){return this.#Y?Pe`
      <devtools-report-section-header>${De(Re.document)}</devtools-report-section-header>
      <devtools-report-key>${De(Re.url)}</devtools-report-key>
      <devtools-report-value>
        <div class="inline-items">
          ${this.#le()}
          ${this.#ce()}
          <div class="text-ellipsis" title=${this.#Y.url}>${this.#Y.url}</div>
        </div>
      </devtools-report-value>
      ${this.#de()}
      ${this.#he()}
      ${s.Directives.until(this.#ue(),s.nothing)}
      ${this.#pe()}
      ${this.#ge()}
      <devtools-report-divider></devtools-report-divider>
    `:s.nothing}#le(){if(!this.#Y||this.#Y.unreachableUrl())return s.nothing;const e=this.#me(this.#Y);return $e("label",De(Re.clickToOpenInSourcesPanel),(()=>t.Revealer.reveal(e)),"reveal-in-sources")}#ce(){if(this.#Y){const e=this.#Y.resourceForURL(this.#Y.url);if(e?.request){const o=e.request;return $e("arrow-up-down-circle",De(Re.clickToOpenInNetworkPanel),(()=>{const e=p.UIRequestLocation.UIRequestLocation.tab(o,"headers-component");return t.Revealer.reveal(e)}),"reveal-in-network")}}return s.nothing}#me(e){for(const t of u.Workspace.WorkspaceImpl.instance().projects()){const o=c.NetworkProject.NetworkProject.getTargetForProject(t);if(o&&o===e.resourceTreeModel().target()){const o=t.uiSourceCodeForURL(e.url);if(o)return o}}return null}#de(){return this.#Y&&this.#Y.unreachableUrl()?Pe`
      <devtools-report-key>${De(Re.unreachableUrl)}</devtools-report-key>
      <devtools-report-value>
        <div class="inline-items">
          ${this.#ve()}
          <div class="text-ellipsis" title=${this.#Y.unreachableUrl()}>${this.#Y.unreachableUrl()}</div>
        </div>
      </devtools-report-value>
    `:s.nothing}#ve(){if(this.#Y){const e=t.ParsedURL.ParsedURL.fromString(this.#Y.unreachableUrl());if(e)return $e("arrow-up-down-circle",De(Re.clickToOpenInNetworkPanelMight),(()=>{t.Revealer.reveal(p.UIFilter.UIRequestFilter.filters([{filterType:p.UIFilter.FilterType.Domain,filterValue:e.domain()},{filterType:null,filterValue:e.path}]))}),"unreachable-url.reveal-in-network")}return s.nothing}#he(){return this.#Y&&this.#Y.securityOrigin&&"://"!==this.#Y.securityOrigin?Pe`
        <devtools-report-key>${De(Re.origin)}</devtools-report-key>
        <devtools-report-value>
          <div class="text-ellipsis" title=${this.#Y.securityOrigin}>${this.#Y.securityOrigin}</div>
        </devtools-report-value>
      `:s.nothing}async#ue(){if(this.#Y){const e=await this.#Y.getOwnerDOMNodeOrDocument();if(e)return Pe`
          <devtools-report-key>${De(Re.ownerElement)}</devtools-report-key>
          <devtools-report-value class="without-min-width">
            <div class="inline-items">
              <button class="link text-link" role="link" tabindex=0 title=${De(Re.clickToOpenInElementsPanel)}
                @mouseenter=${()=>this.#Y?.highlight()}
                @mouseleave=${()=>r.OverlayModel.OverlayModel.hideDOMNodeHighlight()}
                @click=${()=>t.Revealer.reveal(e)}
                jslog=${l.action("reveal-in-elements").track({click:!0})}
              >
                &lt;${e.nodeName().toLocaleLowerCase()}&gt;
              </button>
            </div>
          </devtools-report-value>
        `}return s.nothing}#pe(){const e=this.#Y?.getCreationStackTraceData();return e?.creationStackTrace?Pe`
        <devtools-report-key title=${De(Re.creationStackTraceExplanation)}>${De(Re.creationStackTrace)}</devtools-report-key>
        <devtools-report-value
        jslog=${l.section("frame-creation-stack-trace")}
        >
          <devtools-resources-stack-trace .data=${{frame:this.#Y,buildStackTraceRows:i.JSPresentationUtils.buildStackTraceRows}}>
          </devtools-resources-stack-trace>
        </devtools-report-value>
      `:s.nothing}#be(e){switch(e){case"child":return{value:De(Re.child),description:De(Re.childDescription)};case"root":return{value:De(Re.root),description:De(Re.rootDescription)}}}#ke(e){switch(e){case"CreatedByAdScript":return De(Re.createdByAdScriptExplanation);case"MatchedBlockingRule":return De(Re.matchedBlockingRuleExplanation);case"ParentIsAd":return De(Re.parentIsAdExplanation)}}#ge(){if(!this.#Y)return s.nothing;const e=this.#Y.adFrameType();if("none"===e)return s.nothing;const t=this.#be(e),o=[Pe`<div title=${t.description}>${t.value}</div>`];for(const e of this.#Y.adFrameStatus()?.explanations||[])o.push(Pe`<div>${this.#ke(e)}</div>`);const r=this.#Q?this.#N.linkifyScriptLocation(this.#Q,this.#oe?.scriptId||null,d.DevToolsPath.EmptyUrlString,void 0,void 0):null;return Pe`
      <devtools-report-key>${De(Re.adStatus)}</devtools-report-key>
      <devtools-report-value
      jslog=${l.section("ad-status")}>
        <devtools-expandable-list .data=${{rows:o,title:De(Re.adStatus)}}></devtools-expandable-list></devtools-report-value>
      ${this.#Q?Pe`
        <devtools-report-key>${De(Re.creatorAdScript)}</devtools-report-key>
        <devtools-report-value class="ad-script-link">${r?.setAttribute("jslog",`${l.link("ad-script").track({click:!0})}`)}</devtools-report-value>
      `:s.nothing}
    `}#ae(){return this.#Y?Pe`
      <devtools-report-section-header>${De(Re.securityIsolation)}</devtools-report-section-header>
      <devtools-report-key>${De(Re.secureContext)}</devtools-report-key>
      <devtools-report-value>
        ${this.#Y.isSecureContext()?De(Re.yes):De(Re.no)}\xA0${this.#fe()}
      </devtools-report-value>
      <devtools-report-key>${De(Re.crossoriginIsolated)}</devtools-report-key>
      <devtools-report-value>
        ${this.#Y.isCrossOriginIsolated()?De(Re.yes):De(Re.no)}
      </devtools-report-value>
      ${s.Directives.until(this.#we(),s.nothing)}
      <devtools-report-divider></devtools-report-divider>
    `:s.nothing}#fe(){const e=this.#ye();return e?Pe`<span class="inline-comment">${e}</span>`:s.nothing}#ye(){switch(this.#Y?.getSecureContextType()){case"Secure":return null;case"SecureLocalhost":return De(Re.localhostIsAlwaysASecureContext);case"InsecureAncestor":return De(Re.aFrameAncestorIsAnInsecure);case"InsecureScheme":return De(Re.theFramesSchemeIsInsecure)}return null}async#we(){if(this.#Y){const e=this.#Y.resourceTreeModel().target().model(r.NetworkManager.NetworkManager),t=e&&await e.getSecurityIsolationStatus(this.#Y.id);if(t)return Pe`
          ${this.#xe(t.coep,o.i18n.lockedString("Cross-Origin Embedder Policy (COEP)"),"None")}
          ${this.#xe(t.coop,o.i18n.lockedString("Cross-Origin Opener Policy (COOP)"),"UnsafeNone")}
          ${this.#Se(t.csp)}
        `}return s.nothing}#xe(e,t,o){if(!e)return s.nothing;const r=e.value!==o,a=!r&&e.reportOnlyValue!==o,n=r?e.reportingEndpoint:e.reportOnlyReportingEndpoint;return Pe`
      <devtools-report-key>${t}</devtools-report-key>
      <devtools-report-value>
        ${r?e.value:e.reportOnlyValue}
        ${a?Pe`<span class="inline-comment">report-only</span>`:s.nothing}
        ${n?Pe`<span class="inline-name">${De(Re.reportingTo)}</span>${n}`:s.nothing}
      </devtools-report-value>
    `}#Te(e){const t=new g.CspParser.CspParser(e).csp.directives,o=[];for(const e in t)o.push(Pe`<div><span class="bold">${e}</span>${": "+t[e]?.join(", ")}</div>`);return o}#$e(e,t){return Pe`
      <devtools-report-key>${e.isEnforced?o.i18n.lockedString("Content-Security-Policy"):Pe`${o.i18n.lockedString("Content-Security-Policy-Report-Only")}<devtools-button
          .iconName=${"help"}
          class='help-button'
          .variant=${"icon"}
          .size=${"SMALL"}
          @click=${()=>{window.location.href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only"}}
          jslog=${l.link("learn-more.csp-report-only").track({click:!0})}
          ></devtools-button>`}
      </devtools-report-key>
      <devtools-report-value>
        ${"HTTP"===e.source?o.i18n.lockedString("HTTP header"):o.i18n.lockedString("Meta tag")}
        ${this.#Te(e.effectiveDirectives)}
      </devtools-report-value>
      ${t?Pe`<devtools-report-divider class="subsection-divider"></devtools-report-divider>`:s.nothing}
    `}#Se(e){return Pe`
      <devtools-report-divider></devtools-report-divider>
      <devtools-report-section-header>
        ${De(Re.contentSecurityPolicy)}
      </devtools-report-section-header>
      ${e?.length?e.map(((t,o)=>this.#$e(t,o<e?.length-1))):Pe`
        <devtools-report-key>${o.i18n.lockedString("Content-Security-Policy")}</devtools-report-key>
        <devtools-report-value>
          ${De(Re.none)}
        </devtools-report-value>
      `}
    `}#ne(){return this.#Y?Pe`
      <devtools-report-section-header>${De(Re.apiAvailability)}</devtools-report-section-header>
      <devtools-report-section>
        <span class="report-section">${De(Re.availabilityOfCertainApisDepends)}<x-link href="https://web.dev/why-coop-coep/" class="link" jslog=${l.link("learn-more.coop-coep").track({click:!0})}>${De(Re.learnMore)}</x-link></span>
      </devtools-report-section>
      ${this.#Ce()}
      ${this.#Pe()}
      <devtools-report-divider></devtools-report-divider>
    `:s.nothing}#Ce(){if(this.#Y){const e=this.#Y.getGatedAPIFeatures();if(e){const t=e.includes("SharedArrayBuffers"),o=t&&e.includes("SharedArrayBuffersTransferAllowed"),r=De(o?Re.availableTransferable:t?Re.availableNotTransferable:Re.unavailable),a=o?De(Re.sharedarraybufferConstructorIs):t?De(Re.sharedarraybufferConstructorIsAvailable):"";function n(e){switch(e.getCrossOriginIsolatedContextType()){case"Isolated":return s.nothing;case"NotIsolated":return t?Pe`<span class="inline-comment">${De(Re.willRequireCrossoriginIsolated)}</span>`:Pe`<span class="inline-comment">${De(Re.requiresCrossoriginIsolated)}</span>`;case"NotIsolatedFeatureDisabled":if(!o)return Pe`<span class="inline-comment">${De(Re.transferRequiresCrossoriginIsolatedPermission)} <code>cross-origin-isolated</code></span>`}return s.nothing}return Pe`
          <devtools-report-key>SharedArrayBuffers</devtools-report-key>
          <devtools-report-value title=${a}>
            ${r}\xA0${n(this.#Y)}
          </devtools-report-value>
        `}}return s.nothing}#Pe(){if(this.#Y){const e=this.#Y.isCrossOriginIsolated(),t=De(e?Re.available:Re.unavailable),o=De(e?Re.thePerformanceAPI:Re.thePerformancemeasureuseragentspecificmemory);return Pe`
        <devtools-report-key>${De(Re.measureMemory)}</devtools-report-key>
        <devtools-report-value>
          <span title=${o}>${t}</span>\xA0<x-link class="link" href="https://web.dev/monitor-total-page-memory-usage/" jslog=${l.link("learn-more.monitor-memory-usage").track({click:!0})}>${De(Re.learnMore)}</x-link>
        </devtools-report-value>
      `}return s.nothing}#se(){return this.#Y?Pe`
      <devtools-report-section-header
        title=${De(Re.thisAdditionalDebugging)}
      >${De(Re.additionalInformation)}</devtools-report-section-header>
      <devtools-report-key>${De(Re.frameId)}</devtools-report-key>
      <devtools-report-value>
        <div class="text-ellipsis" title=${this.#Y.id}>${this.#Y.id}</div>
      </devtools-report-value>
      <devtools-report-divider></devtools-report-divider>
    `:s.nothing}}customElements.define("devtools-resources-frame-details-view",Ie);var Be=Object.freeze({__proto__:null,FrameDetailsReportView:Ie}),Ee=`:host{display:flex;padding:20px;height:100%}.heading{font-size:15px}devtools-data-grid{margin-top:20px}.info-icon{vertical-align:text-bottom;height:14px}.no-events-message{margin-top:20px}\n/*# sourceURL=${import.meta.resolve("./interestGroupAccessGrid.css")} */\n`;const{html:Fe}=s,Le={allInterestGroupStorageEvents:"All interest group storage events.",eventTime:"Event Time",eventType:"Access Type",groupOwner:"Owner",groupName:"Name",noEvents:"No interest group events detected",interestGroupDescription:"On this page you can inspect and analyze interest groups"},Ne=o.i18n.registerUIStrings("panels/application/components/InterestGroupAccessGrid.ts",Le),Ae=o.i18n.getLocalizedString.bind(void 0,Ne);class He extends HTMLElement{#e=this.attachShadow({mode:"open"});#Re=[];connectedCallback(){this.#$()}set data(e){this.#Re=e,this.#$()}#$(){s.render(Fe`
      <style>${Ee}</style>
      <style>${A.cssText}</style>
      ${0===this.#Re.length?Fe`
          <div class="empty-state">
            <span class="empty-state-header">${Ae(Le.noEvents)}</span>
            <span class="empty-state-description">${Ae(Le.interestGroupDescription)}</span>
          </div>`:Fe`
          <div>
            <span class="heading">Interest Groups</span>
            <devtools-icon class="info-icon"
                          title=${Ae(Le.allInterestGroupStorageEvents)}
                          .data=${{iconName:"info",color:"var(--icon-default)",width:"16px"}}>
            </devtools-icon>
            ${this.#Me()}
          </div>`}
    `,this.#e,{host:this})}#Me(){return Fe`
      <devtools-data-grid @select=${this.#De} striped inline>
        <table>
          <tr>
            <th id="event-time" sortable weight="10">${Ae(Le.eventTime)}</td>
            <th id="event-type" sortable weight="5">${Ae(Le.eventType)}</td>
            <th id="event-group-owner" sortable weight="10">${Ae(Le.groupOwner)}</td>
            <th id="event-group-name" sortable weight="10">${Ae(Le.groupName)}</td>
          </tr>
          ${this.#Re.map(((e,t)=>Fe`
          <tr data-index=${t}>
            <td>${new Date(1e3*e.accessTime).toLocaleString()}</td>
            <td>${e.type}</td>
            <td>${e.ownerOrigin}</td>
            <td>${e.name}</td>
          </tr>
        `))}
        </table>
      </devtools-data-grid>
    `}#De(e){e.detail&&this.dispatchEvent(new CustomEvent("select",{detail:this.#Re[Number(e.detail.dataset.index)]}))}}customElements.define("devtools-interest-group-access-grid",He);var Oe=Object.freeze({__proto__:null,InterestGroupAccessGrid:He,i18nString:Ae}),ze=`:host{display:flex;flex-direction:column}.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.devtools-link:focus-visible{outline-width:unset}input.devtools-text-input[type="text"]{padding:3px 6px;margin-left:4px;margin-right:4px;width:250px;height:25px}input.devtools-text-input[type="text"]::placeholder{color:var(--sys-color-token-subtle)}.protocol-handlers-row{margin:var(--sys-size-3) 0}.inline-icon{width:16px;height:16px;&[name="check-circle"]{color:var(--icon-checkmark-green)}}@media (forced-colors: active){.devtools-link:not(.devtools-link-prevent-click){color:linktext}.devtools-link:focus-visible{background:Highlight;color:HighlightText}}\n/*# sourceURL=${import.meta.resolve("./protocolHandlersView.css")} */\n`;const{html:We}=s,Ue={protocolDetected:"Found valid protocol handler registration in the {PH1}. With the app installed, test the registered protocols.",protocolNotDetected:"Define protocol handlers in the {PH1} to register your app as a handler for custom protocols when your app is installed.",needHelpReadOur:"Need help? Read {PH1}.",protocolHandlerRegistrations:"URL protocol handler registration for PWAs",manifest:"manifest",testProtocol:"Test protocol",dropdownLabel:"Select protocol handler",textboxLabel:"Query parameter or endpoint for protocol handler",textboxPlaceholder:"Enter URL"},qe=o.i18n.registerUIStrings("panels/application/components/ProtocolHandlersView.ts",Ue),je=o.i18n.getLocalizedString.bind(void 0,qe);class _e extends HTMLElement{#e=this.attachShadow({mode:"open"});#Ie=[];#Be=d.DevToolsPath.EmptyUrlString;#Ee="";#Fe="";set data(e){const t=this.#Be!==e.manifestLink;this.#Ie=e.protocolHandlers,this.#Be=e.manifestLink,t&&this.#Le()}#Le(){this.#Fe="",this.#Ee=this.#Ie[0]?.protocol??"",this.#$()}#Ne(){const e=k.XLink.XLink.create(this.#Be,je(Ue.manifest),void 0,void 0,"manifest"),t=this.#Ie.length>0?Ue.protocolDetected:Ue.protocolNotDetected;return We`
    <div class="protocol-handlers-row status">
            <devtools-icon class="inline-icon"
                                                name=${this.#Ie.length>0?"check-circle":"info"}>
            </devtools-icon>
            ${o.i18n.getFormatLocalizedString(qe,t,{PH1:e})}
    </div>
    `}#Ae(){if(0===this.#Ie.length)return s.nothing;const e=this.#Ie.filter((e=>e.protocol)).map((e=>We`<option value=${e.protocol} jslog=${l.item(e.protocol).track({click:!0})}>${e.protocol}://</option>`));return We`
       <div class="protocol-handlers-row">
        <select class="protocol-select" @change=${this.#He} aria-label=${je(Ue.dropdownLabel)}>
           ${e}
        </select>
        <input .value=${this.#Fe} class="devtools-text-input" type="text" @change=${this.#Oe} aria-label=${je(Ue.textboxLabel)}
        placeholder=${je(Ue.textboxPlaceholder)} />
        <devtools-button .variant=${"primary"} @click=${this.#ze}>
            ${je(Ue.testProtocol)}
        </devtools-button>
        </div>
      `}#He=e=>{this.#Ee=e.target.value};#Oe=e=>{this.#Fe=e.target.value,this.#$()};#ze=()=>{const e=`${this.#Ee}://${this.#Fe}`;v.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(e),v.userMetrics.actionTaken(v.UserMetrics.Action.CaptureTestProtocolClicked)};#$(){const e=k.XLink.XLink.create("https://web.dev/url-protocol-handler/",je(Ue.protocolHandlerRegistrations),void 0,void 0,"learn-more");s.render(We`
      <style>${ze}</style>
      <style>${A.cssText}</style>
      <style>${b.textInputStylesRaw.cssText}</style>
      ${this.#Ne()}
      <div class="protocol-handlers-row">
          ${o.i18n.getFormatLocalizedString(qe,Ue.needHelpReadOur,{PH1:e})}
      </div>
      ${this.#Ae()}
    `,this.#e,{host:this})}}customElements.define("devtools-protocol-handlers-view",_e);var Ve=Object.freeze({__proto__:null,ProtocolHandlersView:_e});const Ge=new CSSStyleSheet;Ge.replaceSync(H.cssText);const Ke=new CSSStyleSheet;Ke.replaceSync(A.cssText);const Xe={noReportsToDisplay:"No reports to display",reportingApiDescription:"Here you will find reporting api reports that are generated by the page.",learnMore:"Learn more",status:"Status",destination:"Destination",generatedAt:"Generated at"},Je=o.i18n.registerUIStrings("panels/application/components/ReportsGrid.ts",Xe),Ye=o.i18n.getLocalizedString.bind(void 0,Je),{render:Qe,html:Ze}=s;class et extends HTMLElement{#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[Ge],this.#$()}#$(){Qe(Ze`
      ${Ye(Xe.status)}
      <x-link href="https://web.dev/reporting-api/#report-status"
      jslog=${l.link("report-status").track({click:!0})}>
        <devtools-icon class="inline-icon" .data=${{iconName:"help",color:"var(--icon-link)",width:"16px",height:"16px"}}></devtools-icon>
      </x-link>
    `,this.#e,{host:this})}}class tt extends HTMLElement{#e=this.attachShadow({mode:"open"});#We=[];#Z=!1;connectedCallback(){this.#e.adoptedStyleSheets=[Ge,Ke],this.#Z=h.Runtime.experiments.isEnabled("protocol-monitor"),this.#$()}set data(e){this.#We=e.reports,this.#$()}#$(){Qe(Ze`
      <div class="reporting-container" jslog=${l.section("reports")}>
        <div class="reporting-header">${o.i18n.lockedString("Reports")}</div>
        ${this.#We.length>0?Ze`
          <devtools-data-grid striped @select=${this.#De}>
            <table>
              <tr>
                ${this.#Z?Ze`
                  <th id="id" weight="30">${o.i18n.lockedString("ID")}</th>
                `:""}
                <th id="url" weight="30">${o.i18n.lockedString("URL")}</th>
                <th id="type" weight="20">${o.i18n.lockedString("Type")}</th>
                <th id="status" weight="20">
                    <devtools-resources-reports-grid-status-header></devtools-resources-reports-grid-status-header>
                </th>
                <th id="destination" weight="20">${Ye(Xe.destination)}</th>
                <th id="timestamp" weight="20">${Ye(Xe.generatedAt)}</th>
                <th id="body" weight="20">${o.i18n.lockedString("Body")}</th>
              </tr>
              ${this.#We.map((e=>Ze`
                <tr data-id=${e.id}>
                  ${this.#Z?Ze`<td>${e.id}</td>`:""}
                  <td>${e.initiatorUrl}</td>
                  <td>${e.type}</td>
                  <td>${e.status}</td>
                  <td>${e.destination}</td>
                  <td>${new Date(1e3*e.timestamp).toLocaleString()}</td>
                  <td>${JSON.stringify(e.body)}</td>
                </tr>
              `))}
            </table>
          </devtools-data-grid>
        `:Ze`
          <div class="empty-state">
            <span class="empty-state-header">${Ye(Xe.noReportsToDisplay)}</span>
            <div class="empty-state-description">
              <span>${Ye(Xe.reportingApiDescription)}</span>
              ${k.XLink.XLink.create("https://developer.chrome.com/docs/capabilities/web-apis/reporting-api",Ye(Xe.learnMore),void 0,void 0,"learn-more")}
            </div>
          </div>
        `}
      </div>
    `,this.#e,{host:this})}#De(e){e.detail&&this.dispatchEvent(new CustomEvent("select",{detail:e.detail.dataset.id}))}}customElements.define("devtools-resources-reports-grid-status-header",et),customElements.define("devtools-resources-reports-grid",tt);var ot=Object.freeze({__proto__:null,ReportsGrid:tt,ReportsGridStatusHeader:et,i18nString:Ye}),rt=`:host{display:block;white-space:normal;max-width:400px}.router-rules{border:1px solid var(--sys-color-divider);border-spacing:0;padding-left:10px;padding-right:10px;line-height:initial;margin-top:0;padding-bottom:12px;text-wrap:balance}.router-rule{display:flex;margin-top:12px;flex-direction:column}.rule-id{color:var(--sys-color-token-subtle)}.item{display:flex;flex-direction:column;padding-left:10px}.condition,\n.source{list-style:none;display:flex;margin-top:4px;flex-direction:row}.condition > *,\n.source > *{word-break:break-all;line-height:1.5em}.rule-type{flex:0 0 18%}\n/*# sourceURL=${import.meta.resolve("./serviceWorkerRouterView.css")} */\n`;const{html:at,render:nt}=s;class it extends a.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#Ue=[];update(e){this.#Ue=e,this.#Ue.length>0&&this.#$()}#$(){nt(at`
      <style>${rt}</style>
      <ul class="router-rules">
        ${this.#Ue.map(this.#qe)}
      </ul>
    `,this.#e,{host:this})}#qe(e){return at`
      <li class="router-rule">
        <div class="rule-id">Rule ${e.id}</div>
        <ul class="item">
          <li class="condition">
            <div class="rule-type">Condition</div>
            <div class="rule-value">${e.condition}</div>
          </li>
          <li class="source">
            <div class="rule-type">Source</div>
            <div class="rule-value">${e.source}</div>
          </li>
        </ul>
      </li>
    `}}customElements.define("devtools-service-worker-router-view",it);var st=Object.freeze({__proto__:null,ServiceWorkerRouterView:it}),lt=`:host{padding:20px;height:100%;display:flex}.heading{font-size:15px}devtools-data-grid{margin-top:20px}.info-icon{vertical-align:text-bottom;height:14px}.no-events-message{margin-top:20px}\n/*# sourceURL=${import.meta.resolve("./sharedStorageAccessGrid.css")} */\n`;const{render:ct,html:dt}=s,ht={sharedStorage:"Shared storage",allSharedStorageEvents:"All shared storage events for this page.",eventTime:"Event Time",eventScope:"Access Scope",eventMethod:"Access Method",ownerOrigin:"Owner Origin",ownerSite:"Owner Site",eventParams:"Optional Event Params",noEvents:"No shared storage events detected",sharedStorageDescription:"On this page you can view, add, edit and delete shared storage key-value pairs and view shared storage events.",learnMore:"Learn more"},ut=o.i18n.registerUIStrings("panels/application/components/SharedStorageAccessGrid.ts",ht),pt=o.i18n.getLocalizedString.bind(void 0,ut);class gt extends HTMLElement{#e=this.attachShadow({mode:"open"});#Re=[];connectedCallback(){this.#$()}set data(e){this.#Re=e.sort(((e,t)=>e.accessTime-t.accessTime)),this.#$()}#$(){ct(dt`
      <style>${lt}</style>
      <style>${A.cssText}</style>
      ${this.#je()}`,this.#e,{host:this})}#je(){return 0===this.#Re.length?dt`
        <div class="empty-state" jslog=${l.section().context("empty-view")}>
          <div class="empty-state-header">${pt(ht.noEvents)}</div>
          <div class="empty-state-description">
            <span>${pt(ht.sharedStorageDescription)}</span>
            ${k.XLink.XLink.create("https://developers.google.com/privacy-sandbox/private-advertising/shared-storage",pt(ht.learnMore),"x-link",void 0,"learn-more")}
          </div>
        </div>
      `:dt`
      <div>
        <span class="heading">${pt(ht.sharedStorage)}</span>
        <devtools-icon class="info-icon"
                        title=${pt(ht.allSharedStorageEvents)}
                        .data=${{iconName:"info",color:"var(--icon-default)",width:"16px"}}>
        </devtools-icon>
        <devtools-data-grid striped inline @select=${this.#De}>
          <table>
            <tr>
              <th id="event-time" weight="10" sortable>
                ${pt(ht.eventTime)}
              </th>
              <th id="event-scope" weight="10" sortable>
                ${pt(ht.eventScope)}
              </th>
              <th id="event-method" weight="10" sortable>
                ${pt(ht.eventMethod)}
              </th>
              <th id="event-owner-origin" weight="10" sortable>
                ${pt(ht.ownerOrigin)}
              </th>
              <th id="event-owner-site" weight="10" sortable>
                ${pt(ht.ownerSite)}
              </th>
              <th id="event-params" weight="10" sortable>
                ${pt(ht.eventParams)}
              </th>
            </tr>
            ${this.#Re.map(((e,t)=>dt`
              <tr data-index=${t}>
                <td data-value=${e.accessTime}>
                  ${new Date(1e3*e.accessTime).toLocaleString()}
                </td>
                <td>${e.scope}</td>
                <td>${e.method}</td>
                <td>${e.ownerOrigin}</td>
                <td>${e.ownerSite}</td>
                <td>${JSON.stringify(e.params)}</td>
              </tr>
            `))}
          </table>
        </devtools-data-grid>
      </div>
    `}#De(e){const t=parseInt(e.detail.dataset.index||"",10),o=isNaN(t)?void 0:this.#Re[t];o&&this.dispatchEvent(new CustomEvent("select",{detail:o}))}}customElements.define("devtools-shared-storage-access-grid",gt);var mt=Object.freeze({__proto__:null,SharedStorageAccessGrid:gt,i18nString:pt}),vt={cssText:`.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}devtools-icon{vertical-align:text-bottom;margin-left:var(--sys-size-3);width:16px;height:16px}devtools-button{vertical-align:sub;margin-left:var(--sys-size-3)}.entropy-budget{display:flex;align-items:center;height:18px}\n/*# sourceURL=${import.meta.resolve("./sharedStorageMetadataView.css")} */\n`};const{html:bt}=s,kt={origin:"Origin",topLevelSite:"Top-level site",opaque:"(opaque)",isOpaque:"Is opaque",isThirdParty:"Is third-party",yes:"Yes",no:"No",yesBecauseTopLevelIsOpaque:"Yes, because the top-level site is opaque",yesBecauseKeyIsOpaque:"Yes, because the storage key is opaque",yesBecauseOriginNotInTopLevelSite:"Yes, because the origin is outside of the top-level site",yesBecauseAncestorChainHasCrossSite:"Yes, because the ancestry chain contains a third-party origin",loading:"Loading…",bucketName:"Bucket name",defaultBucket:"Default bucket",persistent:"Is persistent",durability:"Durability",quota:"Quota",expiration:"Expiration",none:"None",deleteBucket:"Delete bucket",confirmBucketDeletion:'Delete the "{PH1}" bucket?',bucketWillBeRemoved:"The selected storage bucket and contained data will be removed."},ft=o.i18n.registerUIStrings("panels/application/components/StorageMetadataView.ts",kt),wt=o.i18n.getLocalizedString.bind(void 0,ft);class yt extends a.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#_e;#Ve=null;#Ge=null;getShadow(){return this.#e}setStorageKey(e){this.#Ve=r.StorageKeyManager.parseStorageKey(e),this.render()}setStorageBucket(e){this.#Ge=e,this.setStorageKey(e.bucket.storageKey)}enableStorageBucketControls(e){this.#_e=e,this.#Ve&&this.render()}render(){return n.write("StorageMetadataView render",(async()=>{s.render(bt`
        <devtools-report .data=${{reportTitle:this.getTitle()??wt(kt.loading)}}>
          ${await this.renderReportContent()}
        </devtools-report>`,this.#e,{host:this})}))}getTitle(){if(!this.#Ve)return;const e=this.#Ve.origin,t=this.#Ge?.bucket.name||wt(kt.defaultBucket);return this.#_e?`${t} - ${e}`:e}key(e){return bt`<devtools-report-key>${e}</devtools-report-key>`}value(e){return bt`<devtools-report-value>${e}</devtools-report-value>`}async renderReportContent(){if(!this.#Ve)return s.nothing;const e=this.#Ve.origin,t=Boolean(this.#Ve.components.get("3")),o=Boolean(this.#Ve.components.get("1")),r=Boolean(this.#Ve.components.get("4")),a=this.#Ve.components.get("0"),n=t?wt(kt.yesBecauseAncestorChainHasCrossSite):o?wt(kt.yesBecauseKeyIsOpaque):r?wt(kt.yesBecauseTopLevelIsOpaque):a&&e!==a?wt(kt.yesBecauseOriginNotInTopLevelSite):null;return bt`
        ${this.key(wt(kt.origin))}
        ${this.value(bt`<div class="text-ellipsis" title=${e}>${e}</div>`)}
        ${a||r?this.key(wt(kt.topLevelSite)):s.nothing}
        ${a?this.value(a):s.nothing}
        ${r?this.value(wt(kt.opaque)):s.nothing}
        ${n?bt`${this.key(wt(kt.isThirdParty))}${this.value(n)}`:s.nothing}
        ${o||r?this.key(wt(kt.isOpaque)):s.nothing}
        ${o?this.value(wt(kt.yes)):s.nothing}
        ${r?this.value(wt(kt.yesBecauseTopLevelIsOpaque)):s.nothing}
        ${this.#Ge?this.#Ke():s.nothing}
        ${this.#_e?this.#Xe():s.nothing}`}#Ke(){if(!this.#Ge)throw new Error("Should not call #renderStorageBucketInfo if #bucket is null.");const{bucket:{name:e},persistent:t,durability:r,quota:a}=this.#Ge;return bt`
      ${this.key(wt(kt.bucketName))}
      ${this.value(e||"default")}
      ${this.key(wt(kt.persistent))}
      ${this.value(wt(t?kt.yes:kt.no))}
      ${this.key(wt(kt.durability))}
      ${this.value(r)}
      ${this.key(wt(kt.quota))}
      ${this.value(o.ByteUtilities.bytesToString(a))}
      ${this.key(wt(kt.expiration))}
      ${this.value(this.#Je())}`}#Je(){if(!this.#Ge)throw new Error("Should not call #getExpirationString if #bucket is null.");const{expiration:e}=this.#Ge;return 0===e?wt(kt.none):new Date(1e3*e).toLocaleString()}#Xe(){return bt`
      <devtools-report-divider></devtools-report-divider>
      <devtools-report-section>
        <devtools-button
          aria-label=${wt(kt.deleteBucket)}
          .variant=${"outlined"}
          @click=${this.#Ye}>
          ${wt(kt.deleteBucket)}
        </devtools-button>
      </devtools-report-section>`}async#Ye(){if(!this.#_e||!this.#Ge)throw new Error("Should not call #deleteBucket if #storageBucketsModel or #storageBucket is null.");await k.UIUtils.ConfirmDialog.show(wt(kt.bucketWillBeRemoved),wt(kt.confirmBucketDeletion,{PH1:this.#Ge.bucket.name||""}),this,{jslogContext:"delete-bucket-confirmation"})&&this.#_e.deleteBucket(this.#Ge.bucket)}}customElements.define("devtools-storage-metadata-view",yt);var xt=Object.freeze({__proto__:null,StorageMetadataView:yt});const St=new CSSStyleSheet;St.replaceSync(vt.cssText);const{html:Tt}=s,$t={sharedStorage:"Shared storage",creation:"Creation Time",notYetCreated:"Not yet created",numEntries:"Number of Entries",entropyBudget:"Entropy Budget for Fenced Frames",budgetExplanation:"Remaining data leakage allowed within a 24-hour period for this origin in bits of entropy",resetBudget:"Reset Budget",numBytesUsed:"Number of Bytes Used"},Ct=o.i18n.registerUIStrings("panels/application/components/SharedStorageMetadataView.ts",$t),Pt=o.i18n.getLocalizedString.bind(void 0,Ct);class Rt extends yt{#Qe;#Ze=null;#et=0;#tt=0;#ot=0;constructor(e,t){super(),this.#Qe=e,this.classList.add("overflow-auto"),this.setStorageKey(t)}async#rt(){await this.#Qe.resetBudget(),await this.render()}connectedCallback(){this.getShadow().adoptedStyleSheets=[St]}getTitle(){return Pt($t.sharedStorage)}async renderReportContent(){const e=await this.#Qe.getMetadata();return this.#Ze=e?.creationTime??null,this.#et=e?.length??0,this.#tt=e?.bytesUsed??0,this.#ot=e?.remainingBudget??0,Tt`
      ${await super.renderReportContent()}
      ${this.key(Pt($t.creation))}
      ${this.value(this.#at())}
      ${this.key(Pt($t.numEntries))}
      ${this.value(String(this.#et))}
      ${this.key(Pt($t.numBytesUsed))}
      ${this.value(String(this.#tt))}
      ${this.key(Tt`<span class="entropy-budget">${Pt($t.entropyBudget)}<devtools-icon name="info" title=${Pt($t.budgetExplanation)}></devtools-icon></span>`)}
      ${this.value(Tt`<span class="entropy-budget">${this.#ot}${this.#nt()}</span>`)}`}#at(){if(!this.#Ze)return Tt`${Pt($t.notYetCreated)}`;const e=new Date(1e3*this.#Ze);return Tt`${e.toLocaleString()}`}#nt(){return Tt`
      <devtools-button .iconName=${"undo"}
                       .jslogContext=${"reset-entropy-budget"}
                       .size=${"SMALL"}
                       .title=${Pt($t.resetBudget)}
                       .variant=${"icon"}
                       @click=${this.#rt.bind(this)}></devtools-button>
    `}}customElements.define("devtools-shared-storage-metadata-view",Rt);var Mt=Object.freeze({__proto__:null,SharedStorageMetadataView:Rt}),Dt=`:host{padding:20px;height:100%;display:flex}.heading{font-size:15px}devtools-data-grid{margin-top:20px;& devtools-button{width:14px;height:14px}}devtools-icon{width:14px;height:14px}.no-tt-message{margin-top:20px}\n/*# sourceURL=${import.meta.resolve("./trustTokensView.css")} */\n`;const{html:It}=s,Bt={issuer:"Issuer",storedTokenCount:"Stored token count",allStoredTrustTokensAvailableIn:"All stored private state tokens available in this browser instance.",noTrustTokens:"No private state tokens detected",trustTokensDescription:"On this page you can view all available private state tokens in the current browsing context.",deleteTrustTokens:"Delete all stored private state tokens issued by {PH1}.",trustTokens:"Private state tokens",learnMore:"Learn more"},Et=o.i18n.registerUIStrings("panels/application/components/TrustTokensView.ts",Bt),Ft=o.i18n.getLocalizedString.bind(void 0,Et);class Lt extends a.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#it(e){const t=r.TargetManager.TargetManager.instance().primaryPageTarget();t?.storageAgent().invoke_clearTrustTokens({issuerOrigin:e})}connectedCallback(){this.wrapper?.contentElement.classList.add("vbox"),this.render()}async render(){const e=r.TargetManager.TargetManager.instance().primaryPageTarget();if(!e)return;const{tokens:t}=await e.storageAgent().invoke_getTrustTokens();t.sort(((e,t)=>e.issuerOrigin.localeCompare(t.issuerOrigin))),await n.write("Render TrustTokensView",(()=>{s.render(It`
        <style>${Dt}</style>
        <style>${A.cssText}</style>
        ${this.#je(t)}
      `,this.#e,{host:this}),this.isConnected&&setTimeout((()=>this.render()),1e3)}))}#je(e){return 0===e.length?It`
        <div class="empty-state" jslog=${l.section().context("empty-view")}>
          <div class="empty-state-header">${Ft(Bt.noTrustTokens)}</div>
          <div class="empty-state-description">
            <span>${Ft(Bt.trustTokensDescription)}</span>
            ${k.XLink.XLink.create("https://developers.google.com/privacy-sandbox/protections/private-state-tokens",Ft(Bt.learnMore),"x-link",void 0,"learn-more")}
          </div>
        </div>
      `:It`
      <div>
        <span class="heading">${Ft(Bt.trustTokens)}</span>
        <devtools-icon name="info" title=${Ft(Bt.allStoredTrustTokensAvailableIn)}></devtools-icon>
        <devtools-data-grid striped inline>
          <table>
            <tr>
              <th id="issuer" weight="10" sortable>${Ft(Bt.issuer)}</th>
              <th id="count" weight="5" sortable>${Ft(Bt.storedTokenCount)}</th>
              <th id="delete-button" weight="1" sortable></th>
            </tr>
            ${e.filter((e=>e.count>0)).map((e=>It`
                <tr>
                  <td>${Nt(e.issuerOrigin)}</td>
                  <td>${e.count}</td>
                  <td>
                    <devtools-button .iconName=${"bin"}
                                    .jslogContext=${"delete-all"}
                                    .size=${"SMALL"}
                                    .title=${Ft(Bt.deleteTrustTokens,{PH1:Nt(e.issuerOrigin)})}
                                    .variant=${"icon"}
                                    @click=${this.#it.bind(this,Nt(e.issuerOrigin))}></devtools-button>
                  </td>
                </tr>
              `))}
          </table>
        </devtools-data-grid>
      </div>
    `}}function Nt(e){return e.replace(/\/$/,"")}customElements.define("devtools-trust-tokens-storage-view",Lt);var At=Object.freeze({__proto__:null,TrustTokensView:Lt,i18nString:Ft});export{M as BackForwardCacheView,N as BounceTrackingMitigationsView,_ as EndpointsGrid,Be as FrameDetailsView,Oe as InterestGroupAccessGrid,fe as OriginTrialTreeView,Ve as ProtocolHandlersView,ot as ReportsGrid,st as ServiceWorkerRouterView,mt as SharedStorageAccessGrid,Mt as SharedStorageMetadataView,te as StackTrace,xt as StorageMetadataView,At as TrustTokensView};
