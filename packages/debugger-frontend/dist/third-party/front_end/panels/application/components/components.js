import*as e from"../../../core/common/common.js";import*as t from"../../../core/i18n/i18n.js";import*as a from"../../../core/sdk/sdk.js";import*as r from"../../../ui/components/buttons/buttons.js";import*as o from"../../../ui/components/chrome_link/chrome_link.js";import*as i from"../../../ui/components/expandable_list/expandable_list.js";import*as n from"../../../ui/components/icon_button/icon_button.js";import*as s from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as l from"../../../ui/components/render_coordinator/render_coordinator.js";import*as c from"../../../ui/components/report_view/report_view.js";import*as d from"../../../ui/components/tree_outline/tree_outline.js";import*as h from"../../../ui/legacy/components/utils/utils.js";import*as u from"../../../ui/lit-html/lit-html.js";import*as m from"../../../ui/visual_logging/visual_logging.js";import*as g from"../../../ui/components/data_grid/data_grid.js";import*as p from"../../../core/platform/platform.js";import*as b from"../../../core/root/root.js";import*as w from"../../../models/bindings/bindings.js";import*as f from"../../../models/workspace/workspace.js";import*as v from"../../network/forward/forward.js";import*as k from"../../../third_party/csp_evaluator/csp_evaluator.js";import*as y from"../../../ui/components/adorners/adorners.js";import*as S from"../../../core/host/host.js";import*as T from"../../../ui/components/input/input.js";import*as R from"../../../ui/legacy/legacy.js";const $={notMainFrame:"Navigation happened in a frame other than the main frame.",backForwardCacheDisabled:"Back/forward cache is disabled by flags. Visit chrome://flags/#back-forward-cache to enable it locally on this device.",relatedActiveContentsExist:"The page was opened using '`window.open()`' and another tab has a reference to it, or the page opened a window.",HTTPStatusNotOK:"Only pages with a status code of 2XX can be cached.",schemeNotHTTPOrHTTPS:"Only pages whose URL scheme is HTTP / HTTPS can be cached.",loading:"The page did not finish loading before navigating away.",wasGrantedMediaAccess:"Pages that have granted access to record video or audio are not currently eligible for back/forward cache.",HTTPMethodNotGET:"Only pages loaded via a GET request are eligible for back/forward cache.",subframeIsNavigating:"An iframe on the page started a navigation that did not complete.",timeout:"The page exceeded the maximum time in back/forward cache and was expired.",cacheLimit:"The page was evicted from the cache to allow another page to be cached.",JavaScriptExecution:"Chrome detected an attempt to execute JavaScript while in the cache.",rendererProcessKilled:"The renderer process for the page in back/forward cache was killed.",rendererProcessCrashed:"The renderer process for the page in back/forward cache crashed.",grantedMediaStreamAccess:"Pages that have granted media stream access are not currently eligible for back/forward cache.",cacheFlushed:"The cache was intentionally cleared.",serviceWorkerVersionActivation:"The page was evicted from back/forward cache due to a service worker activation.",sessionRestored:"Chrome restarted and cleared the back/forward cache entries.",serviceWorkerPostMessage:"A service worker attempted to send the page in back/forward cache a `MessageEvent`.",enteredBackForwardCacheBeforeServiceWorkerHostAdded:"A service worker was activated while the page was in back/forward cache.",serviceWorkerClaim:"The page was claimed by a service worker while it is in back/forward cache.",haveInnerContents:"Pages that have certain kinds of embedded content (e.g. PDFs) are not currently eligible for back/forward cache.",timeoutPuttingInCache:"The page timed out entering back/forward cache (likely due to long-running pagehide handlers).",backForwardCacheDisabledByLowMemory:"Back/forward cache is disabled due to insufficient memory.",backForwardCacheDisabledByCommandLine:"Back/forward cache is disabled by the command line.",networkRequestDatapipeDrainedAsBytesConsumer:"Pages that have inflight fetch() or XHR are not currently eligible for back/forward cache.",networkRequestRedirected:"The page was evicted from back/forward cache because an active network request involved a redirect.",networkRequestTimeout:"The page was evicted from the cache because a network connection was open too long. Chrome limits the amount of time that a page may receive data while cached.",networkExceedsBufferLimit:"The page was evicted from the cache because an active network connection received too much data. Chrome limits the amount of data that a page may receive while cached.",navigationCancelledWhileRestoring:"Navigation was cancelled before the page could be restored from back/forward cache.",backForwardCacheDisabledForPrerender:"Back/forward cache is disabled for prerenderer.",userAgentOverrideDiffers:"Browser has changed the user agent override header.",foregroundCacheLimit:"The page was evicted from the cache to allow another page to be cached.",backForwardCacheDisabledForDelegate:"Back/forward cache is not supported by delegate.",unloadHandlerExistsInMainFrame:"The page has an unload handler in the main frame.",unloadHandlerExistsInSubFrame:"The page has an unload handler in a sub frame.",serviceWorkerUnregistration:"ServiceWorker was unregistered while a page was in back/forward cache.",noResponseHead:"Pages that do not have a valid response head cannot enter back/forward cache.",cacheControlNoStore:"Pages with cache-control:no-store header cannot enter back/forward cache.",ineligibleAPI:"Ineligible APIs were used.",internalError:"Internal error.",webSocket:"Pages with WebSocket cannot enter back/forward cache.",webTransport:"Pages with WebTransport cannot enter back/forward cache.",webRTC:"Pages with WebRTC cannot enter back/forward cache.",mainResourceHasCacheControlNoStore:"Pages whose main resource has cache-control:no-store cannot enter back/forward cache.",mainResourceHasCacheControlNoCache:"Pages whose main resource has cache-control:no-cache cannot enter back/forward cache.",subresourceHasCacheControlNoStore:"Pages whose subresource has cache-control:no-store cannot enter back/forward cache.",subresourceHasCacheControlNoCache:"Pages whose subresource has cache-control:no-cache cannot enter back/forward cache.",containsPlugins:"Pages containing plugins are not currently eligible for back/forward cache.",documentLoaded:"The document did not finish loading before navigating away.",dedicatedWorkerOrWorklet:"Pages that use a dedicated worker or worklet are not currently eligible for back/forward cache.",outstandingNetworkRequestOthers:"Pages with an in-flight network request are not currently eligible for back/forward cache.",outstandingIndexedDBTransaction:"Page with ongoing indexed DB transactions are not currently eligible for back/forward cache.",requestedNotificationsPermission:"Pages that have requested notifications permissions are not currently eligible for back/forward cache.",requestedMIDIPermission:"Pages that have requested MIDI permissions are not currently eligible for back/forward cache.",requestedAudioCapturePermission:"Pages that have requested audio capture permissions are not currently eligible for back/forward cache.",requestedVideoCapturePermission:"Pages that have requested video capture permissions are not currently eligible for back/forward cache.",requestedBackForwardCacheBlockedSensors:"Pages that have requested sensor permissions are not currently eligible for back/forward cache.",requestedBackgroundWorkPermission:"Pages that have requested background sync or fetch permissions are not currently eligible for back/forward cache.",broadcastChannel:"The page cannot be cached because it has a BroadcastChannel instance with registered listeners.",indexedDBConnection:"Pages that have an open IndexedDB connection are not currently eligible for back/forward cache.",webXR:"Pages that use WebXR are not currently eligible for back/forward cache.",sharedWorker:"Pages that use SharedWorker are not currently eligible for back/forward cache.",webLocks:"Pages that use WebLocks are not currently eligible for back/forward cache.",webHID:"Pages that use WebHID are not currently eligible for back/forward cache.",webShare:"Pages that use WebShare are not currently eligible for back/forwad cache.",requestedStorageAccessGrant:"Pages that have requested storage access are not currently eligible for back/forward cache.",webNfc:"Pages that use WebNfc are not currently eligible for back/forwad cache.",outstandingNetworkRequestFetch:"Pages with an in-flight fetch network request are not currently eligible for back/forward cache.",outstandingNetworkRequestXHR:"Pages with an in-flight XHR network request are not currently eligible for back/forward cache.",appBanner:"Pages that requested an AppBanner are not currently eligible for back/forward cache.",printing:"Pages that show Printing UI are not currently eligible for back/forward cache.",webDatabase:"Pages that use WebDatabase are not currently eligible for back/forward cache.",pictureInPicture:"Pages that use Picture-in-Picture are not currently eligible for back/forward cache.",speechRecognizer:"Pages that use SpeechRecognizer are not currently eligible for back/forward cache.",idleManager:"Pages that use IdleManager are not currently eligible for back/forward cache.",paymentManager:"Pages that use PaymentManager are not currently eligible for back/forward cache.",speechSynthesis:"Pages that use SpeechSynthesis are not currently eligible for back/forward cache.",keyboardLock:"Pages that use Keyboard lock are not currently eligible for back/forward cache.",webOTPService:"Pages that use WebOTPService are not currently eligible for bfcache.",outstandingNetworkRequestDirectSocket:"Pages with an in-flight network request are not currently eligible for back/forward cache.",injectedJavascript:"Pages that `JavaScript` is injected into by extensions are not currently eligible for back/forward cache.",injectedStyleSheet:"Pages that a `StyleSheet` is injected into by extensions are not currently eligible for back/forward cache.",contentSecurityHandler:"Pages that use SecurityHandler are not eligible for back/forward cache.",contentWebAuthenticationAPI:"Pages that use WebAuthetication API are not eligible for back/forward cache.",contentFileChooser:"Pages that use FileChooser API are not eligible for back/forward cache.",contentSerial:"Pages that use Serial API are not eligible for back/forward cache.",contentFileSystemAccess:"Pages that use File System Access API are not eligible for back/forward cache.",contentMediaDevicesDispatcherHost:"Pages that use Media Device Dispatcher are not eligible for back/forward cache.",contentWebBluetooth:"Pages that use WebBluetooth API are not eligible for back/forward cache.",contentWebUSB:"Pages that use WebUSB API are not eligible for back/forward cache.",contentMediaSession:"Pages that use MediaSession API and set a playback state are not eligible for back/forward cache.",contentMediaSessionService:"Pages that use MediaSession API and set action handlers are not eligible for back/forward cache.",contentMediaPlay:"A media player was playing upon navigating away.",contentScreenReader:"Back/forward cache is disabled due to screen reader.",embedderPopupBlockerTabHelper:"Popup blocker was present upon navigating away.",embedderSafeBrowsingTriggeredPopupBlocker:"Safe Browsing considered this page to be abusive and blocked popup.",embedderSafeBrowsingThreatDetails:"Safe Browsing details were shown upon navigating away.",embedderAppBannerManager:"App Banner was present upon navigating away.",embedderDomDistillerViewerSource:"DOM Distiller Viewer was present upon navigating away.",embedderDomDistillerSelfDeletingRequestDelegate:"DOM distillation was in progress upon navigating away.",embedderOomInterventionTabHelper:"Out-Of-Memory Intervention bar was present upon navigating away.",embedderOfflinePage:"The offline page was shown upon navigating away.",embedderChromePasswordManagerClientBindCredentialManager:"Chrome Password Manager was present upon navigating away.",embedderPermissionRequestManager:"There were permission requests upon navigating away.",embedderModalDialog:"Modal dialog such as form resubmission or http password dialog was shown for the page upon navigating away.",embedderExtensions:"Back/forward cache is disabled due to extensions.",embedderExtensionMessaging:"Back/forward cache is disabled due to extensions using messaging API.",embedderExtensionMessagingForOpenPort:"Extensions with long-lived connection should close the connection before entering back/forward cache.",embedderExtensionSentMessageToCachedFrame:"Extensions with long-lived connection attempted to send messages to frames in back/forward cache.",errorDocument:"Back/forward cache is disabled due to a document error.",fencedFramesEmbedder:"Pages using FencedFrames cannot be stored in bfcache.",keepaliveRequest:"Back/forward cache is disabled due to a keepalive request.",jsNetworkRequestReceivedCacheControlNoStoreResource:"Back/forward cache is disabled because some JavaScript network request received resource with `Cache-Control: no-store` header.",indexedDBEvent:"Back/forward cache is disabled due to an IndexedDB event.",cookieDisabled:"Back/forward cache is disabled because cookies are disabled on a page that uses `Cache-Control: no-store`.",webRTCSticky:"Back/forward cache is disabled because WebRTC has been used.",webTransportSticky:"Back/forward cache is disabled because WebTransport has been used.",webSocketSticky:"Back/forward cache is disabled because WebSocket has been used."},x=t.i18n.registerUIStrings("panels/application/components/BackForwardCacheStrings.ts",$),N=t.i18n.getLazilyComputedLocalizedString.bind(void 0,x),C={NotPrimaryMainFrame:{name:N($.notMainFrame)},BackForwardCacheDisabled:{name:N($.backForwardCacheDisabled)},RelatedActiveContentsExist:{name:N($.relatedActiveContentsExist)},HTTPStatusNotOK:{name:N($.HTTPStatusNotOK)},SchemeNotHTTPOrHTTPS:{name:N($.schemeNotHTTPOrHTTPS)},Loading:{name:N($.loading)},WasGrantedMediaAccess:{name:N($.wasGrantedMediaAccess)},HTTPMethodNotGET:{name:N($.HTTPMethodNotGET)},SubframeIsNavigating:{name:N($.subframeIsNavigating)},Timeout:{name:N($.timeout)},CacheLimit:{name:N($.cacheLimit)},JavaScriptExecution:{name:N($.JavaScriptExecution)},RendererProcessKilled:{name:N($.rendererProcessKilled)},RendererProcessCrashed:{name:N($.rendererProcessCrashed)},GrantedMediaStreamAccess:{name:N($.grantedMediaStreamAccess)},CacheFlushed:{name:N($.cacheFlushed)},ServiceWorkerVersionActivation:{name:N($.serviceWorkerVersionActivation)},SessionRestored:{name:N($.sessionRestored)},ServiceWorkerPostMessage:{name:N($.serviceWorkerPostMessage)},EnteredBackForwardCacheBeforeServiceWorkerHostAdded:{name:N($.enteredBackForwardCacheBeforeServiceWorkerHostAdded)},ServiceWorkerClaim:{name:N($.serviceWorkerClaim)},HaveInnerContents:{name:N($.haveInnerContents)},TimeoutPuttingInCache:{name:N($.timeoutPuttingInCache)},BackForwardCacheDisabledByLowMemory:{name:N($.backForwardCacheDisabledByLowMemory)},BackForwardCacheDisabledByCommandLine:{name:N($.backForwardCacheDisabledByCommandLine)},NetworkRequestDatapipeDrainedAsBytesConsumer:{name:N($.networkRequestDatapipeDrainedAsBytesConsumer)},NetworkRequestRedirected:{name:N($.networkRequestRedirected)},NetworkRequestTimeout:{name:N($.networkRequestTimeout)},NetworkExceedsBufferLimit:{name:N($.networkExceedsBufferLimit)},NavigationCancelledWhileRestoring:{name:N($.navigationCancelledWhileRestoring)},BackForwardCacheDisabledForPrerender:{name:N($.backForwardCacheDisabledForPrerender)},UserAgentOverrideDiffers:{name:N($.userAgentOverrideDiffers)},ForegroundCacheLimit:{name:N($.foregroundCacheLimit)},BackForwardCacheDisabledForDelegate:{name:N($.backForwardCacheDisabledForDelegate)},UnloadHandlerExistsInMainFrame:{name:N($.unloadHandlerExistsInMainFrame)},UnloadHandlerExistsInSubFrame:{name:N($.unloadHandlerExistsInSubFrame)},ServiceWorkerUnregistration:{name:N($.serviceWorkerUnregistration)},NoResponseHead:{name:N($.noResponseHead)},CacheControlNoStore:{name:N($.cacheControlNoStore)},CacheControlNoStoreCookieModified:{name:N($.cacheControlNoStore)},CacheControlNoStoreHTTPOnlyCookieModified:{name:N($.cacheControlNoStore)},DisableForRenderFrameHostCalled:{name:N($.ineligibleAPI)},BlocklistedFeatures:{name:N($.ineligibleAPI)},SchedulerTrackedFeatureUsed:{name:N($.ineligibleAPI)},DomainNotAllowed:{name:N($.internalError)},ConflictingBrowsingInstance:{name:N($.internalError)},NotMostRecentNavigationEntry:{name:N($.internalError)},IgnoreEventAndEvict:{name:N($.internalError)},BrowsingInstanceNotSwapped:{name:N($.internalError)},ActivationNavigationsDisallowedForBug1234857:{name:N($.internalError)},Unknown:{name:N($.internalError)},RenderFrameHostReused_SameSite:{name:N($.internalError)},RenderFrameHostReused_CrossSite:{name:N($.internalError)},WebSocket:{name:N($.webSocket)},WebTransport:{name:N($.webTransport)},WebRTC:{name:N($.webRTC)},MainResourceHasCacheControlNoStore:{name:N($.mainResourceHasCacheControlNoStore)},MainResourceHasCacheControlNoCache:{name:N($.mainResourceHasCacheControlNoCache)},SubresourceHasCacheControlNoStore:{name:N($.subresourceHasCacheControlNoStore)},SubresourceHasCacheControlNoCache:{name:N($.subresourceHasCacheControlNoCache)},ContainsPlugins:{name:N($.containsPlugins)},DocumentLoaded:{name:N($.documentLoaded)},DedicatedWorkerOrWorklet:{name:N($.dedicatedWorkerOrWorklet)},OutstandingNetworkRequestOthers:{name:N($.outstandingNetworkRequestOthers)},OutstandingIndexedDBTransaction:{name:N($.outstandingIndexedDBTransaction)},RequestedNotificationsPermission:{name:N($.requestedNotificationsPermission)},RequestedMIDIPermission:{name:N($.requestedMIDIPermission)},RequestedAudioCapturePermission:{name:N($.requestedAudioCapturePermission)},RequestedVideoCapturePermission:{name:N($.requestedVideoCapturePermission)},RequestedBackForwardCacheBlockedSensors:{name:N($.requestedBackForwardCacheBlockedSensors)},RequestedBackgroundWorkPermission:{name:N($.requestedBackgroundWorkPermission)},BroadcastChannel:{name:N($.broadcastChannel)},IndexedDBConnection:{name:N($.indexedDBConnection)},WebXR:{name:N($.webXR)},SharedWorker:{name:N($.sharedWorker)},WebLocks:{name:N($.webLocks)},WebHID:{name:N($.webHID)},WebShare:{name:N($.webShare)},RequestedStorageAccessGrant:{name:N($.requestedStorageAccessGrant)},WebNfc:{name:N($.webNfc)},OutstandingNetworkRequestFetch:{name:N($.outstandingNetworkRequestFetch)},OutstandingNetworkRequestXHR:{name:N($.outstandingNetworkRequestXHR)},AppBanner:{name:N($.appBanner)},Printing:{name:N($.printing)},WebDatabase:{name:N($.webDatabase)},PictureInPicture:{name:N($.pictureInPicture)},SpeechRecognizer:{name:N($.speechRecognizer)},IdleManager:{name:N($.idleManager)},PaymentManager:{name:N($.paymentManager)},SpeechSynthesis:{name:N($.speechSynthesis)},KeyboardLock:{name:N($.keyboardLock)},WebOTPService:{name:N($.webOTPService)},OutstandingNetworkRequestDirectSocket:{name:N($.outstandingNetworkRequestDirectSocket)},InjectedJavascript:{name:N($.injectedJavascript)},InjectedStyleSheet:{name:N($.injectedStyleSheet)},Dummy:{name:N($.internalError)},ContentSecurityHandler:{name:N($.contentSecurityHandler)},ContentWebAuthenticationAPI:{name:N($.contentWebAuthenticationAPI)},ContentFileChooser:{name:N($.contentFileChooser)},ContentSerial:{name:N($.contentSerial)},ContentFileSystemAccess:{name:N($.contentFileSystemAccess)},ContentMediaDevicesDispatcherHost:{name:N($.contentMediaDevicesDispatcherHost)},ContentWebBluetooth:{name:N($.contentWebBluetooth)},ContentWebUSB:{name:N($.contentWebUSB)},ContentMediaSession:{name:N($.contentMediaSession)},ContentMediaSessionService:{name:N($.contentMediaSessionService)},ContentMediaPlay:{name:N($.contentMediaPlay)},ContentScreenReader:{name:N($.contentScreenReader)},EmbedderPopupBlockerTabHelper:{name:N($.embedderPopupBlockerTabHelper)},EmbedderSafeBrowsingTriggeredPopupBlocker:{name:N($.embedderSafeBrowsingTriggeredPopupBlocker)},EmbedderSafeBrowsingThreatDetails:{name:N($.embedderSafeBrowsingThreatDetails)},EmbedderAppBannerManager:{name:N($.embedderAppBannerManager)},EmbedderDomDistillerViewerSource:{name:N($.embedderDomDistillerViewerSource)},EmbedderDomDistillerSelfDeletingRequestDelegate:{name:N($.embedderDomDistillerSelfDeletingRequestDelegate)},EmbedderOomInterventionTabHelper:{name:N($.embedderOomInterventionTabHelper)},EmbedderOfflinePage:{name:N($.embedderOfflinePage)},EmbedderChromePasswordManagerClientBindCredentialManager:{name:N($.embedderChromePasswordManagerClientBindCredentialManager)},EmbedderPermissionRequestManager:{name:N($.embedderPermissionRequestManager)},EmbedderModalDialog:{name:N($.embedderModalDialog)},EmbedderExtensions:{name:N($.embedderExtensions)},EmbedderExtensionMessaging:{name:N($.embedderExtensionMessaging)},EmbedderExtensionMessagingForOpenPort:{name:N($.embedderExtensionMessagingForOpenPort)},EmbedderExtensionSentMessageToCachedFrame:{name:N($.embedderExtensionSentMessageToCachedFrame)},ErrorDocument:{name:N($.errorDocument)},FencedFramesEmbedder:{name:N($.fencedFramesEmbedder)},KeepaliveRequest:{name:N($.keepaliveRequest)},JsNetworkRequestReceivedCacheControlNoStoreResource:{name:N($.jsNetworkRequestReceivedCacheControlNoStoreResource)},IndexedDBEvent:{name:N($.indexedDBEvent)},CookieDisabled:{name:N($.cookieDisabled)},WebRTCSticky:{name:N($.webRTCSticky)},WebTransportSticky:{name:N($.webTransportSticky)},WebSocketSticky:{name:N($.webSocketSticky)},HTTPAuthRequired:{name:t.i18n.lockedLazyString("HTTPAuthRequired")},CookieFlushed:{name:t.i18n.lockedLazyString("CookieFlushed")},SmartCard:{name:t.i18n.lockedLazyString("SmartCard")},LiveMediaStreamTrack:{name:t.i18n.lockedLazyString("LiveMediaStreamTrack")},UnloadHandler:{name:t.i18n.lockedLazyString("UnloadHandler")},ParserAborted:{name:t.i18n.lockedLazyString("ParserAborted")},BroadcastChannelOnMessage:{name:t.i18n.lockedLazyString("BroadcastChannelOnMessage")},RequestedByWebViewClient:{name:t.i18n.lockedLazyString("RequestedByWebViewClient")},WebViewSettingsChanged:{name:t.i18n.lockedLazyString("WebViewSettingsChanged")},WebViewJavaScriptObjectChanged:{name:t.i18n.lockedLazyString("WebViewJavaScriptObjectChanged")},WebViewMessageListenerInjected:{name:t.i18n.lockedLazyString("WebViewMessageListenerInjected")},WebViewSafeBrowsingAllowlistChanged:{name:t.i18n.lockedLazyString("WebViewSafeBrowsingAllowlistChanged")},WebViewDocumentStartJavascriptChanged:{name:t.i18n.lockedLazyString("WebViewDocumentStartJavascriptChanged")}},I=new CSSStyleSheet;I.replaceSync(".inline-icon{vertical-align:sub}.gray-text{color:var(--sys-color-token-subtle);margin:0 0 5px 56px;display:flex;flex-direction:row;align-items:center;flex:auto;overflow-wrap:break-word;overflow:hidden}.details-list{margin-left:56px;grid-column-start:span 2}.help-outline-icon{margin:0 2px}.circled-exclamation-icon{margin-right:10px;flex-shrink:0}.status{margin-right:11px;flex-shrink:0}.report-line{grid-column-start:span 2;display:flex;align-items:center;margin:0 30px;line-height:26px}.report-key{color:var(--sys-color-token-subtle);min-width:auto;overflow-wrap:break-word;align-self:start}.report-value{padding:0 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.tree-outline li .selection{margin-left:-5px}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=backForwardCacheView.css */\n");const P={mainFrame:"Main Frame",backForwardCacheTitle:"Back/forward cache",unavailable:"unavailable",url:"URL:",unknown:"Unknown Status",normalNavigation:"Not served from back/forward cache: to trigger back/forward cache, use Chrome's back/forward buttons, or use the test button below to automatically navigate away and back.",restoredFromBFCache:"Successfully served from back/forward cache.",pageSupportNeeded:"Actionable",pageSupportNeededExplanation:"These reasons are actionable i.e. they can be cleaned up to make the page eligible for back/forward cache.",circumstantial:"Not Actionable",circumstantialExplanation:"These reasons are not actionable i.e. caching was prevented by something outside of the direct control of the page.",supportPending:"Pending Support",runTest:"Test back/forward cache",runningTest:"Running test",learnMore:"Learn more: back/forward cache eligibility",neverUseUnload:"Learn more: Never use unload handler",supportPendingExplanation:"Chrome support for these reasons is pending i.e. they will not prevent the page from being eligible for back/forward cache in a future version of Chrome.",blockingExtensionId:"Extension id: ",framesTitle:"Frames",issuesInSingleFrame:"{n, plural, =1 {# issue found in 1 frame.} other {# issues found in 1 frame.}}",issuesInMultipleFrames:"{n, plural, =1 {# issue found in {m} frames.} other {# issues found in {m} frames.}}",framesPerIssue:"{n, plural, =1 {# frame} other {# frames}}",blankURLTitle:"Blank URL [{PH1}]",filesPerIssue:"{n, plural, =1 {# file} other {# files}}"},D=t.i18n.registerUIStrings("panels/application/components/BackForwardCacheView.ts",P),B=t.i18n.getLocalizedString.bind(void 0,D),M=l.RenderCoordinator.RenderCoordinator.instance();class V extends s.LegacyWrapper.WrappableComponent{static litTagName=u.literal`devtools-resources-back-forward-cache-view`;#e=this.attachShadow({mode:"open"});#t="Result";#a=0;#r=0;constructor(){super(),this.#o()?.addEventListener(a.ResourceTreeModel.Events.PrimaryPageChanged,this.render,this),this.#o()?.addEventListener(a.ResourceTreeModel.Events.BackForwardCacheDetailsUpdated,this.render,this)}#o(){const e=a.TargetManager.TargetManager.instance().primaryPageTarget();return e?.model(a.ResourceTreeModel.ResourceTreeModel)||null}#i(){return this.#o()?.mainFrame||null}connectedCallback(){this.parentElement?.classList.add("overflow-auto"),this.#e.adoptedStyleSheets=[I]}async render(){await M.write("BackForwardCacheView render",(()=>{u.render(u.html`
        <${c.ReportView.Report.litTagName} .data=${{reportTitle:B(P.backForwardCacheTitle)}} jslog=${m.pane("back-forward-cache")}>

          ${this.#n()}
        </${c.ReportView.Report.litTagName}>
      `,this.#e,{host:this})}))}#s(){a.TargetManager.TargetManager.instance().removeModelListener(a.ResourceTreeModel.ResourceTreeModel,a.ResourceTreeModel.Events.FrameNavigated,this.#s,this),this.#t="Result",this.render()}async#l(){a.TargetManager.TargetManager.instance().removeModelListener(a.ResourceTreeModel.ResourceTreeModel,a.ResourceTreeModel.Events.FrameNavigated,this.#l,this),await this.#c(50)}async#c(e){const t=a.TargetManager.TargetManager.instance().primaryPageTarget(),r=t?.model(a.ResourceTreeModel.ResourceTreeModel),o=await(r?.navigationHistory());r&&o&&(o.currentIndex===this.#r?window.setTimeout(this.#c.bind(this,2*e),e):(a.TargetManager.TargetManager.instance().addModelListener(a.ResourceTreeModel.ResourceTreeModel,a.ResourceTreeModel.Events.FrameNavigated,this.#s,this),r.navigateToHistoryEntry(o.entries[o.currentIndex-1])))}async#d(){const e=a.TargetManager.TargetManager.instance().primaryPageTarget(),t=e?.model(a.ResourceTreeModel.ResourceTreeModel),r=await(t?.navigationHistory());t&&r&&(this.#r=r.currentIndex,this.#t="Running",this.render(),a.TargetManager.TargetManager.instance().addModelListener(a.ResourceTreeModel.ResourceTreeModel,a.ResourceTreeModel.Events.FrameNavigated,this.#l,this),t.navigate("chrome://terms"))}#n(){const t=this.#i();if(!t)return u.html`
        <${c.ReportView.ReportKey.litTagName}>
          ${B(P.mainFrame)}
        </${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName}>
          ${B(P.unavailable)}
        </${c.ReportView.ReportValue.litTagName}>
      `;const a="Running"===this.#t,o=e.ParsedURL.schemeIs(t.url,"devtools:");return u.html`
      ${this.#h(t.backForwardCacheDetails.restoredFromCache)}
      <div class="report-line">
        <div class="report-key">
          ${B(P.url)}
        </div>
        <div class="report-value" title=${t.url}>
          ${t.url}
        </div>
      </div>
      ${this.#u(t.backForwardCacheDetails.explanationsTree)}
      <${c.ReportView.ReportSection.litTagName}>
        <${r.Button.Button.litTagName}
          aria-label=${B(P.runTest)}
          .disabled=${a||o}
          .spinner=${a}
          .variant=${"primary"}
          @click=${this.#d}
          jslog=${m.action("back-forward-cache.run-test").track({click:!0})}>
          ${a?u.html`
            ${B(P.runningTest)}`:`\n            ${B(P.runTest)}\n          `}
        </${r.Button.Button.litTagName}>
      </${c.ReportView.ReportSection.litTagName}>
      <${c.ReportView.ReportSectionDivider.litTagName}>
      </${c.ReportView.ReportSectionDivider.litTagName}>
      ${this.#m(t.backForwardCacheDetails.explanations,t.backForwardCacheDetails.explanationsTree)}
      <${c.ReportView.ReportSection.litTagName}>
        <x-link href="https://web.dev/bfcache/" class="link"
        jslog=${m.action("learn-more.eligibility").track({click:!0})}>
          ${B(P.learnMore)}
        </x-link>
      </${c.ReportView.ReportSection.litTagName}>
    `}#u(e){if(!e||0===e.explanations.length&&0===e.children.length)return u.nothing;const t=this.#g(e,{blankCount:1});t.node.treeNodeData.iconName="frame";let a="";a=1===t.frameCount?B(P.issuesInSingleFrame,{n:t.issueCount}):B(P.issuesInMultipleFrames,{n:t.issueCount,m:t.frameCount});const r={treeNodeData:{text:a},id:"root",children:()=>Promise.resolve([t.node])};return u.html`
      <div class="report-line"
      jslog=${m.section("frames")}>
        <div class="report-key">
          ${B(P.framesTitle)}
        </div>
        <div class="report-value">
          <${d.TreeOutline.TreeOutline.litTagName} .data=${{tree:[r],defaultRenderer:function(e){return u.html`
        <div class="text-ellipsis">
          ${e.treeNodeData.iconName?u.html`
            <${n.Icon.Icon.litTagName} class="inline-icon" style="margin-bottom: -3px;" .data=${{iconName:e.treeNodeData.iconName,color:"var(--icon-default)",width:"20px",height:"20px"}}>
            </${n.Icon.Icon.litTagName}>
          `:u.nothing}
          ${e.treeNodeData.text}
        </div>
      `},compact:!0}}>
          </${d.TreeOutline.TreeOutline.litTagName}>
        </div>
      </div>
    `}#g(e,t){let a=1,r=0;const o=[];let i="";e.url.length?i=e.url:(i=B(P.blankURLTitle,{PH1:t.blankCount}),t.blankCount+=1);for(const t of e.explanations){const e={treeNodeData:{text:t.reason},id:String(this.#a++)};r+=1,o.push(e)}for(const i of e.children){const e=this.#g(i,t);e.issueCount>0&&(o.push(e.node),r+=e.issueCount,a+=e.frameCount)}let n={treeNodeData:{text:`(${r}) ${i}`},id:String(this.#a++)};return o.length?(n={...n,children:()=>Promise.resolve(o)},n.treeNodeData.iconName="iframe"):e.url.length||(t.blankCount-=1),{node:n,frameCount:a,issueCount:r}}#h(e){switch(e){case!0:return u.html`
          <${c.ReportView.ReportSection.litTagName}>
            <div class="status">
              <${n.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"check-circle",color:"var(--icon-checkmark-green)",width:"20px",height:"20px"}}>
              </${n.Icon.Icon.litTagName}>
            </div>
            ${B(P.restoredFromBFCache)}
          </${c.ReportView.ReportSection.litTagName}>
        `;case!1:return u.html`
          <${c.ReportView.ReportSection.litTagName}>
            <div class="status">
              <${n.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"clear",color:"var(--icon-default)",width:"20px",height:"20px"}}>
              </${n.Icon.Icon.litTagName}>
            </div>
            ${B(P.normalNavigation)}
          </${c.ReportView.ReportSection.litTagName}>
        `}return u.html`
    <${c.ReportView.ReportSection.litTagName}>
      ${B(P.unknown)}
    </${c.ReportView.ReportSection.litTagName}>
    `}#p(e,t,a){let r=e.url;0===r.length&&(r=B(P.blankURLTitle,{PH1:t.blankCount}),t.blankCount+=1),e.explanations.forEach((e=>{let t=a.get(e.reason);void 0===t?(t=[r],a.set(e.reason,t)):t.push(r)})),e.children.map((e=>{this.#p(e,t,a)}))}#m(e,t){if(0===e.length)return u.nothing;const a=e.filter((e=>"PageSupportNeeded"===e.type)),r=e.filter((e=>"SupportPending"===e.type)),o=e.filter((e=>"Circumstantial"===e.type)),i=new Map;return t&&this.#p(t,{blankCount:1},i),u.html`
      ${this.#b(B(P.pageSupportNeeded),B(P.pageSupportNeededExplanation),a,i)}
      ${this.#b(B(P.supportPending),B(P.supportPendingExplanation),r,i)}
      ${this.#b(B(P.circumstantial),B(P.circumstantialExplanation),o,i)}
    `}#b(e,t,a,r){return u.html`
      ${a.length>0?u.html`
        <${c.ReportView.ReportSectionHeader.litTagName}>
          ${e}
          <div class="help-outline-icon">
            <${n.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"help",color:"var(--icon-default)",width:"16px",height:"16px"}} title=${t}>
            </${n.Icon.Icon.litTagName}>
          </div>
        </${c.ReportView.ReportSectionHeader.litTagName}>
        ${a.map((e=>this.#w(e,r.get(e.reason))))}
      `:u.nothing}
    `}#f(e){if("EmbedderExtensionSentMessageToCachedFrame"===e.reason&&e.context){const t="chrome://extensions/?id="+e.context;return u.html`${B(P.blockingExtensionId)}
      <${o.ChromeLink.ChromeLink.litTagName} .href=${t}>${e.context}</${o.ChromeLink.ChromeLink.litTagName}>`}return u.nothing}#v(e){if(void 0===e||0===e.length)return u.nothing;const t=[u.html`<div>${B(P.framesPerIssue,{n:e.length})}</div>`];return t.push(...e.map((e=>u.html`<div class="text-ellipsis" title=${e}
    jslog=${m.treeItem()}>${e}</div>`))),u.html`
      <div class="details-list"
      jslog=${m.tree("frames-per-issue")}>
        <${i.ExpandableList.ExpandableList.litTagName} .data=${{rows:t,title:B(P.framesPerIssue,{n:e.length})}}
        jslog=${m.treeItem()}></${i.ExpandableList.ExpandableList.litTagName}>
      </div>
    `}#k(e){return"UnloadHandlerExistsInMainFrame"===e.reason||"UnloadHandlerExistsInSubFrame"===e.reason?u.html`
        <x-link href="https://web.dev/bfcache/#never-use-the-unload-event" class="link"
        jslog=${m.action("learn-more.never-use-unload").track({click:!0})}>
          ${B(P.neverUseUnload)}
        </x-link>`:u.nothing}#y(e){if(void 0===e||0===e.length)return u.nothing;const t=new h.Linkifier.Linkifier(50),a=[u.html`<div>${B(P.filesPerIssue,{n:e.length})}</div>`];return a.push(...e.map((e=>u.html`${t.linkifyScriptLocation(null,null,e.url,e.lineNumber,{columnNumber:e.columnNumber,showColumnNumber:!0,inlineFrameIndex:0})}`))),u.html`
      <div class="details-list">
        <${i.ExpandableList.ExpandableList.litTagName} .data=${{rows:a}}></${i.ExpandableList.ExpandableList.litTagName}>
      </div>
    `}#w(e,t){return u.html`
      <${c.ReportView.ReportSection.litTagName}>
        ${e.reason in C?u.html`
            <div class="circled-exclamation-icon">
              <${n.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"warning",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
              </${n.Icon.Icon.litTagName}>
            </div>
            <div>
              ${C[e.reason].name()}
              ${this.#k(e)}
              ${this.#f(e)}
           </div>`:u.nothing}
      </${c.ReportView.ReportSection.litTagName}>
      <div class="gray-text">
        ${e.reason}
      </div>
      ${this.#y(e.details)}
      ${this.#v(t)}
    `}}customElements.define("devtools-resources-back-forward-cache-view",V);var F=Object.freeze({__proto__:null,BackForwardCacheView:V});const E=new CSSStyleSheet;E.replaceSync("devtools-data-grid-controller{border:1px solid var(--sys-color-divider);margin-top:0}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=bounceTrackingMitigationsView.css */\n");const L={bounceTrackingMitigationsTitle:"Bounce tracking mitigations",forceRun:"Force run",runningMitigations:"Running",stateDeletedFor:"State was deleted for the following sites:",checkingPotentialTrackers:"Checking for potential bounce tracking sites.",learnMore:"Learn more: Bounce Tracking Mitigations",noPotentialBounceTrackersIdentified:"State was not cleared for any potential bounce tracking sites. Either none were identified or third-party cookies are not blocked.",featureDisabled:'Bounce tracking mitigations are disabled. To enable them, set the flag at {PH1} to "Enabled With Deletion".',featureFlag:"Bounce Tracking Mitigations Feature Flag"},A=t.i18n.registerUIStrings("panels/application/components/BounceTrackingMitigationsView.ts",L),H=t.i18n.getLocalizedString.bind(void 0,A);class O extends s.LegacyWrapper.WrappableComponent{static litTagName=u.literal`devtools-bounce-tracking-mitigations-view`;#e=this.attachShadow({mode:"open"});#S=[];#t="Result";#T=!1;#R=!1;connectedCallback(){this.#e.adoptedStyleSheets=[E],this.#$()}async#$(){u.render(u.html`
      <${c.ReportView.Report.litTagName} .data=${{reportTitle:H(L.bounceTrackingMitigationsTitle)}}
      jslog=${m.pane("bounce-tracking-mitigations")}>
        ${await this.#n()}
      </${c.ReportView.Report.litTagName}>
    `,this.#e,{host:this})}async#n(){if(this.#T||await this.#x(),"Disabled"===this.#t){const e=new o.ChromeLink.ChromeLink;return e.href="chrome://flags/#bounce-tracking-mitigations",e.textContent=H(L.featureFlag),u.html`
        <${c.ReportView.ReportSection.litTagName}>
          ${t.i18n.getFormatLocalizedString(A,L.featureDisabled,{PH1:e})}
        </${c.ReportView.ReportSection.litTagName}>
      `}return u.html`
      <${c.ReportView.ReportSection.litTagName}>
        ${this.#N()}
      </${c.ReportView.ReportSection.litTagName}>
        ${this.#C()}
      <${c.ReportView.ReportSectionDivider.litTagName}>
      </${c.ReportView.ReportSectionDivider.litTagName}>
      <${c.ReportView.ReportSection.litTagName}>
        <x-link href="https://privacycg.github.io/nav-tracking-mitigations/#bounce-tracking-mitigations" class="link"
        jslog=${m.link("learn-more").track({click:!0})}>
          ${H(L.learnMore)}
        </x-link>
      </${c.ReportView.ReportSection.litTagName}>
    `}#N(){const e="Running"===this.#t;return u.html`
      <${r.Button.Button.litTagName}
        aria-label=${H(L.forceRun)}
        .disabled=${e}
        .spinner=${e}
        .variant=${"primary"}
        @click=${this.#I}
        jslog=${m.action("force-run").track({click:!0})}>
        ${e?u.html`
          ${H(L.runningMitigations)}`:`\n          ${H(L.forceRun)}\n        `}
      </${r.Button.Button.litTagName}>
    `}#C(){if(!this.#R)return u.html``;if(0===this.#S.length)return u.html`
        <${c.ReportView.ReportSection.litTagName}>
        ${"Running"===this.#t?u.html`
          ${H(L.checkingPotentialTrackers)}`:`\n          ${H(L.noPotentialBounceTrackersIdentified)}\n        `}
        </${c.ReportView.ReportSection.litTagName}>
      `;const e={columns:[{id:"sites",title:H(L.stateDeletedFor),widthWeighting:10,hideable:!1,visible:!0,sortable:!0}],rows:this.#P(),initialSort:{columnId:"sites",direction:"ASC"}};return u.html`
      <${c.ReportView.ReportSection.litTagName}>
        <${g.DataGridController.DataGridController.litTagName} .data=${e}>
        </${g.DataGridController.DataGridController.litTagName}>
      </${c.ReportView.ReportSection.litTagName}>
    `}async#I(){const e=a.TargetManager.TargetManager.instance().primaryPageTarget();if(!e)return;this.#R=!0,this.#t="Running",this.#$();const t=await e.storageAgent().invoke_runBounceTrackingMitigations();this.#S=[],t.deletedSites.forEach((e=>{this.#S.push(e)})),this.#D()}#D(){this.#t="Result",this.#$()}#P(){return this.#S.map((e=>({cells:[{columnId:"sites",value:e}]})))}async#x(){this.#T=!0;const e=a.TargetManager.TargetManager.instance().primaryPageTarget();e&&((await e.systemInfo().invoke_getFeatureState({featureState:"DIPS"})).featureEnabled||(this.#t="Disabled"))}}customElements.define("devtools-bounce-tracking-mitigations-view",O);var W=Object.freeze({__proto__:null,i18nString:H,BounceTrackingMitigationsView:O});const U=new CSSStyleSheet;U.replaceSync(":host{overflow:auto;height:100%}.reporting-container{height:100%;display:flex;flex-direction:column}.reporting-header{font-size:15px;background-color:var(--sys-color-surface2);padding:1px 4px}.reporting-placeholder{flex-grow:1;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--sys-color-token-subtle);min-width:min-content;text-align:center}devtools-data-grid-controller{border:1px solid var(--sys-color-divider)}.inline-icon{vertical-align:text-bottom}\n/*# sourceURL=reportingApiGrid.css */\n");const q={noEndpointsToDisplay:"No endpoints to display"},j=t.i18n.registerUIStrings("panels/application/components/EndpointsGrid.ts",q),z=t.i18n.getLocalizedString.bind(void 0,j),{render:_,html:G}=u;class K extends HTMLElement{static litTagName=u.literal`devtools-resources-endpoints-grid`;#e=this.attachShadow({mode:"open"});#B=new Map;connectedCallback(){this.#e.adoptedStyleSheets=[U],this.#$()}set data(e){this.#B=e.endpoints,this.#$()}#$(){const e={columns:[{id:"origin",title:t.i18n.lockedString("Origin"),widthWeighting:30,hideable:!1,visible:!0},{id:"name",title:t.i18n.lockedString("Name"),widthWeighting:20,hideable:!1,visible:!0},{id:"url",title:t.i18n.lockedString("URL"),widthWeighting:30,hideable:!1,visible:!0}],rows:this.#M()};_(G`
      <div class="reporting-container" jslog=${m.section("endpoints")}>
        <div class="reporting-header">${t.i18n.lockedString("Endpoints")}</div>
        ${this.#B.size>0?G`
          <${g.DataGridController.DataGridController.litTagName} .data=${e}>
          </${g.DataGridController.DataGridController.litTagName}>
        `:G`
          <div class="reporting-placeholder">
            <div>${z(q.noEndpointsToDisplay)}</div>
          </div>
        `}
      </div>
    `,this.#e,{host:this})}#M(){return Array.from(this.#B).map((([e,t])=>t.map((t=>({cells:[{columnId:"origin",value:e},{columnId:"name",value:t.groupName},{columnId:"url",value:t.url}]}))))).flat()}}customElements.define("devtools-resources-endpoints-grid",K);var J=Object.freeze({__proto__:null,i18nString:z,EndpointsGrid:K});const X=new CSSStyleSheet;X.replaceSync('.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}button ~ .text-ellipsis{padding-left:2px}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;padding:0}button.link{border:none;background:none;font-family:inherit;font-size:inherit;height:16px}button.link:has(devtools-icon){margin-top:5px}devtools-button.help-button{top:4px;position:relative}button.text-link{padding-left:2px;height:26px}.inline-button{padding-left:1ex}.inline-comment{padding-left:1ex;white-space:pre-line}.inline-comment::before{content:"("}.inline-comment::after{content:")"}.inline-name{color:var(--sys-color-token-subtle);padding-right:4px;user-select:none;white-space:pre-line}.inline-items{display:flex}.span-cols{grid-column-start:span 2;margin:0 0 8px 30px;line-height:28px}.without-min-width{min-width:auto}.bold{font-weight:bold}.link:not(button):has(devtools-icon){vertical-align:baseline;margin-inline-start:3px}.inline-icon{margin-bottom:-5px;width:18px;height:18px;vertical-align:baseline}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=frameDetailsReportView.css */\n');const Y=new CSSStyleSheet;Y.replaceSync(":host .badge-error{--override-adorner-text-color:var(--sys-color-error-bright);--override-adorner-border-color:var(--sys-color-error-bright)}:host .badge-success{--override-adorner-text-color:var(--sys-color-tertiary);--override-adorner-border-color:var(--sys-color-tertiary)}:host .badge-secondary{--override-adorner-text-color:var(--sys-color-token-subtle);--override-adorner-border-color:var(--sys-color-token-subtle)}:host{font-family:var(--source-code-font-family)}\n/*# sourceURL=badge.css */\n");const Q=new CSSStyleSheet;Q.replaceSync(".content{display:grid;grid-template-columns:min-content 1fr}.key{color:var(--sys-color-token-subtle);padding:0 6px;text-align:right;white-space:pre}.value{color:var(--sys-color-token-subtle);margin-inline-start:0;padding:0 6px}.error-text{color:var(--sys-color-error-bright);font-weight:bold}\n/*# sourceURL=originTrialTokenRows.css */\n");const Z=new CSSStyleSheet;Z.replaceSync(".status-badge{border-radius:4px;padding:4px;background:var(--sys-color-neutral-container);& > devtools-icon{vertical-align:sub}}\n/*# sourceURL=originTrialTreeView.css */\n");const ee={origin:"Origin",trialName:"Trial Name",expiryTime:"Expiry Time",usageRestriction:"Usage Restriction",isThirdParty:"Third Party",matchSubDomains:"Subdomain Matching",rawTokenText:"Raw Token",status:"Token Status",token:"Token",tokens:"{PH1} tokens",noTrialTokens:"No trial tokens"},te=t.i18n.registerUIStrings("panels/application/components/OriginTrialTreeView.ts",ee),ae=t.i18n.getLocalizedString.bind(void 0,te);class re extends HTMLElement{static litTagName=u.literal`devtools-resources-origin-trial-tree-view-badge`;#e=this.attachShadow({mode:"open"});#V=new y.Adorner.Adorner;set data(e){this.#$(e)}connectedCallback(){this.#e.adoptedStyleSheets=[Y]}#$(e){const t=document.createElement("span");t.textContent=e.badgeContent,this.#V.data={name:"badge",content:t},this.#V.classList.add(`badge-${e.style}`),u.render(u.html`
      ${this.#V}
    `,this.#e,{host:this})}}function oe(e){return{treeNodeData:e,id:"OriginTrialTreeNode#"+e.trialName,children:async()=>e.tokensWithStatus.length>1?e.tokensWithStatus.map(ie):se(e.tokensWithStatus[0]),renderer:e=>{const t=e.treeNodeData,a=u.html`
        <${re.litTagName} .data=${{badgeContent:ae(ee.tokens,{PH1:t.tokensWithStatus.length}),style:"secondary"}}></${re.litTagName}>
      `;return u.html`
        ${t.trialName}
        <${re.litTagName} .data=${{badgeContent:t.status,style:"Enabled"===t.status?"success":"error"}}></${re.litTagName}>
        ${t.tokensWithStatus.length>1?a:u.nothing}
      `}}}function ie(e){return{treeNodeData:e.status,id:"TokenNode#"+e.rawTokenText,children:async()=>se(e),renderer:(e,t)=>{const a=e.treeNodeData,r=u.html`
        <${re.litTagName} .data=${{badgeContent:a,style:"Success"===a?"success":"error"}}></${re.litTagName}>
      `;return u.html`${ae(ee.token)} ${t.isExpanded?u.nothing:r}`}}}function ne(e){return u.html`
    <${ce.litTagName} .data=${{node:e}}>
    </${ce.litTagName}>
    `}function se(e){return[{treeNodeData:e,id:"TokenDetailsNode#"+e.rawTokenText,renderer:ne},(t=e.rawTokenText,{treeNodeData:ae(ee.rawTokenText),id:"TokenRawTextContainerNode#"+t,children:async()=>[{treeNodeData:t,id:"TokenRawTextNode#"+t,renderer:e=>{const t=e.treeNodeData;return u.html`
        <div style="overflow-wrap: break-word;">
          ${t}
        </div>
        `}}]})];var t}function le(e){return u.html`${String(e.treeNodeData)}`}customElements.define("devtools-resources-origin-trial-tree-view-badge",re);class ce extends HTMLElement{static litTagName=u.literal`devtools-resources-origin-trial-token-rows`;#e=this.attachShadow({mode:"open"});#F=null;#E=[];#L=new Intl.DateTimeFormat(t.DevToolsLocale.DevToolsLocale.instance().locale,{dateStyle:"long",timeStyle:"long"});set data(e){this.#F=e.node.treeNodeData,this.#A()}connectedCallback(){this.#e.adoptedStyleSheets=[Q],this.#$()}#H=(e,t)=>u.html`
        <div class=${u.Directives.ifDefined(t?"error-text":void 0)}>
          ${e}
        </div>`;#A(){this.#F?.parsedToken&&(this.#E=[{name:ae(ee.origin),value:this.#H(this.#F.parsedToken.origin,"WrongOrigin"===this.#F.status)},{name:ae(ee.expiryTime),value:this.#H(this.#L.format(1e3*this.#F.parsedToken.expiryTime),"Expired"===this.#F.status)},{name:ae(ee.usageRestriction),value:this.#H(this.#F.parsedToken.usageRestriction)},{name:ae(ee.isThirdParty),value:this.#H(this.#F.parsedToken.isThirdParty.toString())},{name:ae(ee.matchSubDomains),value:this.#H(this.#F.parsedToken.matchSubDomains.toString())}],"UnknownTrial"===this.#F.status&&(this.#E=[{name:ae(ee.trialName),value:this.#H(this.#F.parsedToken.trialName)},...this.#E]))}#$(){if(!this.#F)return;const e=[{name:ae(ee.status),value:u.html`
          <${re.litTagName} .data=${{badgeContent:this.#F.status,style:"Success"===this.#F.status?"success":"error"}}></${re.litTagName}>`},...this.#E].map((e=>u.html`
          <div class="key">${e.name}</div>
          <div class="value">${e.value}</div>
          `));u.render(u.html`
      <div class="content">
        ${e}
      </div>
    `,this.#e,{host:this})}}customElements.define("devtools-resources-origin-trial-token-rows",ce);class de extends HTMLElement{static litTagName=u.literal`devtools-resources-origin-trial-tree-view`;#e=this.attachShadow({mode:"open"});set data(e){this.#$(e.trials)}connectedCallback(){this.#e.adoptedStyleSheets=[Z]}#$(e){e.length?u.render(u.html`
      <${d.TreeOutline.TreeOutline.litTagName} .data=${{tree:e.map(oe),defaultRenderer:le}}>
      </${d.TreeOutline.TreeOutline.litTagName}>
    `,this.#e,{host:this}):u.render(u.html`
    <span class="status-badge">
      <${n.Icon.Icon.litTagName}
          .data=${{iconName:"clear",color:"var(--icon-default)",width:"16px",height:"16px"}}
        >
      </${n.Icon.Icon.litTagName}>
      <span>${ae(ee.noTrialTokens)}</span>
    </span>`,this.#e,{host:this})}}customElements.define("devtools-resources-origin-trial-tree-view",de);var he=Object.freeze({__proto__:null,Badge:re,OriginTrialTokenRows:ce,OriginTrialTreeView:de});const ue=new CSSStyleSheet;ue.replaceSync(":host{display:contents}.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}button.link{border:none;background:none;font-family:inherit;font-size:inherit}.policies-list{padding-top:3px}.permissions-row{display:flex;line-height:22px}.permissions-row div{padding-right:5px}.feature-name{width:135px}.allowed-icon{vertical-align:sub}.block-reason{width:215px}\n/*# sourceURL=permissionsPolicySection.css */\n");const me={showDetails:"Show details",hideDetails:"Hide details",allowedFeatures:"Allowed Features",disabledFeatures:"Disabled Features",clickToShowHeader:'Click to reveal the request whose "`Permissions-Policy`" HTTP header disables this feature.',clickToShowIframe:"Click to reveal the top-most iframe which does not allow this feature in the elements panel.",disabledByIframe:'missing in iframe "`allow`" attribute',disabledByHeader:'disabled by "`Permissions-Policy`" header',disabledByFencedFrame:"disabled inside a `fencedframe`"},ge=t.i18n.registerUIStrings("panels/application/components/PermissionsPolicySection.ts",me),pe=t.i18n.getLocalizedString.bind(void 0,ge),be=l.RenderCoordinator.RenderCoordinator.instance();function we(e,t,a,o){return u.html`
  <${r.Button.Button.litTagName}
    .iconName=${e}
    title=${t}
    .variant=${"icon"}
    .size=${"SMALL"}
    @click=${a}
    jslog=${m.action().track({click:!0}).context(o)}></${r.Button.Button.litTagName}>
  `}class fe extends HTMLElement{static litTagName=u.literal`devtools-resources-permissions-policy-section`;#e=this.attachShadow({mode:"open"});#O={policies:[],showDetails:!1};set data(e){this.#O=e,this.#$()}connectedCallback(){this.#e.adoptedStyleSheets=[ue]}#W(){this.#O.showDetails=!this.#O.showDetails,this.#$()}#U(){const e=this.#O.policies.filter((e=>e.allowed)).map((e=>e.feature)).sort();return e.length?u.html`
      <${c.ReportView.ReportKey.litTagName}>${pe(me.allowedFeatures)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        ${e.join(", ")}
      </${c.ReportView.ReportValue.litTagName}>
    `:u.nothing}async#q(){const t=this.#O.policies.filter((e=>!e.allowed)).sort(((e,t)=>e.feature.localeCompare(t.feature)));if(!t.length)return u.nothing;if(!this.#O.showDetails)return u.html`
        <${c.ReportView.ReportKey.litTagName}>${pe(me.disabledFeatures)}</${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName}>
          ${t.map((e=>e.feature)).join(", ")}
          <${r.Button.Button.litTagName}
          .variant=${"outlined"}
          @click=${()=>this.#W()}
          jslog=${m.action("show-disabled-features-details").track({click:!0})}>${pe(me.showDetails)}
        </${r.Button.Button.litTagName}>
        </${c.ReportView.ReportValue.litTagName}>
      `;const o=a.FrameManager.FrameManager.instance(),i=await Promise.all(t.map((async t=>{const a=t.locator?o.getFrame(t.locator.frameId):null,r=t.locator?.blockReason,i=await("IframeAttribute"===r&&a&&a.getOwnerDOMNodeOrDocument()),s=a&&a.resourceForURL(a.url),l="Header"===r&&s&&s.request,c=(()=>{switch(r){case"IframeAttribute":return pe(me.disabledByIframe);case"Header":return pe(me.disabledByHeader);case"InFencedFrameTree":return pe(me.disabledByFencedFrame);default:return""}})();return u.html`
        <div class="permissions-row">
          <div>
            <${n.Icon.Icon.litTagName} class="allowed-icon"
              .data=${{color:"var(--icon-error)",iconName:"cross-circle",width:"20px",height:"20px"}}>
            </${n.Icon.Icon.litTagName}>
          </div>
          <div class="feature-name text-ellipsis">
            ${t.feature}
          </div>
          <div class="block-reason">${c}</div>
          <div>
            ${i?we("code-circle",pe(me.clickToShowIframe),(()=>e.Revealer.reveal(i)),"reveal-in-elements"):u.nothing}
            ${l?we("arrow-up-down-circle",pe(me.clickToShowHeader),(async()=>{if(!l)return;const t=l.responseHeaderValue("permissions-policy")?"permissions-policy":"feature-policy",a=v.UIRequestLocation.UIRequestLocation.responseHeaderMatch(l,{name:t,value:""});await e.Revealer.reveal(a)}),"reveal-in-network"):u.nothing}
          </div>
        </div>
      `})));return u.html`
      <${c.ReportView.ReportKey.litTagName}>${pe(me.disabledFeatures)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName} class="policies-list">
        ${i}
        <div class="permissions-row">
        <${r.Button.Button.litTagName}
          .variant=${"outlined"}
          @click=${()=>this.#W()}
          jslog=${m.action("hide-disabled-features-details").track({click:!0})}>${pe(me.hideDetails)}
        </${r.Button.Button.litTagName}>
        </div>
      </${c.ReportView.ReportValue.litTagName}>
    `}async#$(){await be.write("PermissionsPolicySection render",(()=>{u.render(u.html`
          <${c.ReportView.ReportSectionHeader.litTagName}>${t.i18n.lockedString("Permissions Policy")}</${c.ReportView.ReportSectionHeader.litTagName}>
          ${this.#U()}
          ${u.Directives.until(this.#q(),u.nothing)}
          <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
        `,this.#e,{host:this})}))}}customElements.define("devtools-resources-permissions-policy-section",fe);const ve=new CSSStyleSheet;ve.replaceSync("button.link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;border:none;background:none;font-family:inherit;font-size:inherit}\n/*# sourceURL=stackTraceLinkButton.css */\n");const ke=new CSSStyleSheet;ke.replaceSync(".stack-trace-row{display:flex}.stack-trace-function-name{width:100px}.stack-trace-source-location{display:flex;overflow:hidden}.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stack-trace-source-location .text-ellipsis{padding-right:2px}.ignore-list-link{opacity:60%}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;border:none;background:none}\n/*# sourceURL=stackTraceRow.css */\n");const ye={cannotRenderStackTrace:"Cannot render stack trace",showSMoreFrames:"{n, plural, =1 {Show # more frame} other {Show # more frames}}",showLess:"Show less",creationStackTrace:"Frame Creation `Stack Trace`"},Se=t.i18n.registerUIStrings("panels/application/components/StackTrace.ts",ye),Te=t.i18n.getLocalizedString.bind(void 0,Se);class Re extends HTMLElement{static litTagName=u.literal`devtools-stack-trace-row`;#e=this.attachShadow({mode:"open"});#j=null;set data(e){this.#j=e.stackTraceRowItem,this.#$()}connectedCallback(){this.#e.adoptedStyleSheets=[ke]}#$(){this.#j&&u.render(u.html`
      <div class="stack-trace-row">
              <div class="stack-trace-function-name text-ellipsis" title=${this.#j.functionName}>
                ${this.#j.functionName}
              </div>
              <div class="stack-trace-source-location">
                ${this.#j.link?u.html`<div class="text-ellipsis">\xA0@\xA0${this.#j.link}</div>`:u.nothing}
              </div>
            </div>
    `,this.#e,{host:this})}}class $e extends HTMLElement{static litTagName=u.literal`devtools-stack-trace-link-button`;#e=this.attachShadow({mode:"open"});#z=()=>{};#_=null;#G=!1;set data(e){this.#z=e.onShowAllClick,this.#_=e.hiddenCallFramesCount,this.#G=e.expandedView,this.#$()}connectedCallback(){this.#e.adoptedStyleSheets=[ve]}#$(){if(!this.#_)return;const e=this.#G?Te(ye.showLess):Te(ye.showSMoreFrames,{n:this.#_});u.render(u.html`
      <div class="stack-trace-row">
          <button class="link" @click=${()=>this.#z()}>
            ${e}
          </button>
        </div>
    `,this.#e,{host:this})}}class xe extends HTMLElement{static litTagName=u.literal`devtools-resources-stack-trace`;#e=this.attachShadow({mode:"open"});#K=new h.Linkifier.Linkifier;#J=[];#X=!1;set data(e){const t=e.frame,{creationStackTrace:a,creationStackTraceTarget:r}=t.getCreationStackTraceData();a&&(this.#J=e.buildStackTraceRows(a,r,this.#K,!0,this.#Y.bind(this))),this.#$()}#Y(e){this.#J=e,this.#$()}#Q(){this.#X=!this.#X,this.#$()}createRowTemplates(){const e=[];let t=0;for(const a of this.#J)!this.#X&&a.ignoreListHide||("functionName"in a&&e.push(u.html`
          <${Re.litTagName} data-stack-trace-row .data=${{stackTraceRowItem:a}}></${Re.litTagName}>`),"asyncDescription"in a&&e.push(u.html`
            <div>${a.asyncDescription}</div>
          `)),"functionName"in a&&a.ignoreListHide&&t++;return t&&e.push(u.html`
      <${$e.litTagName} data-stack-trace-row .data=${{onShowAllClick:this.#Q.bind(this),hiddenCallFramesCount:t,expandedView:this.#X}}></${$e.litTagName}>
      `),e}#$(){if(!this.#J.length)return void u.render(u.html`
          <span>${Te(ye.cannotRenderStackTrace)}</span>
        `,this.#e,{host:this});const e=this.createRowTemplates();u.render(u.html`
        <${i.ExpandableList.ExpandableList.litTagName} .data=${{rows:e,title:Te(ye.creationStackTrace)}}>
        jslog=${m.tree()}>
        </${i.ExpandableList.ExpandableList.litTagName}>
      `,this.#e,{host:this})}}customElements.define("devtools-stack-trace-row",Re),customElements.define("devtools-stack-trace-link-button",$e),customElements.define("devtools-resources-stack-trace",xe);var Ne=Object.freeze({__proto__:null,StackTraceRow:Re,StackTraceLinkButton:$e,StackTrace:xe});const Ce={additionalInformation:"Additional Information",thisAdditionalDebugging:"This additional (debugging) information is shown because the 'Protocol Monitor' experiment is enabled.",frameId:"Frame ID",document:"Document",url:"URL",clickToRevealInSourcesPanel:"Click to reveal in Sources panel",clickToRevealInNetworkPanel:"Click to reveal in Network panel",unreachableUrl:"Unreachable URL",clickToRevealInNetworkPanelMight:"Click to reveal in Network panel (might require page reload)",origin:"Origin",ownerElement:"Owner Element",clickToRevealInElementsPanel:"Click to reveal in Elements panel",adStatus:"Ad Status",rootDescription:"This frame has been identified as the root frame of an ad",root:"root",childDescription:"This frame has been identified as a child frame of an ad",child:"child",securityIsolation:"Security & Isolation",contentSecurityPolicy:"Content Security Policy (CSP)",secureContext:"Secure Context",yes:"Yes",no:"No",crossoriginIsolated:"Cross-Origin Isolated",localhostIsAlwaysASecureContext:"`Localhost` is always a secure context",aFrameAncestorIsAnInsecure:"A frame ancestor is an insecure context",theFramesSchemeIsInsecure:"The frame's scheme is insecure",reportingTo:"reporting to",apiAvailability:"API availability",availabilityOfCertainApisDepends:"Availability of certain APIs depends on the document being cross-origin isolated.",availableTransferable:"available, transferable",availableNotTransferable:"available, not transferable",unavailable:"unavailable",sharedarraybufferConstructorIs:"`SharedArrayBuffer` constructor is available and `SABs` can be transferred via `postMessage`",sharedarraybufferConstructorIsAvailable:"`SharedArrayBuffer` constructor is available but `SABs` cannot be transferred via `postMessage`",willRequireCrossoriginIsolated:"⚠️ will require cross-origin isolated context in the future",requiresCrossoriginIsolated:"requires cross-origin isolated context",transferRequiresCrossoriginIsolatedPermission:"`SharedArrayBuffer` transfer requires enabling the permission policy:",available:"available",thePerformanceAPI:"The `performance.measureUserAgentSpecificMemory()` API is available",thePerformancemeasureuseragentspecificmemory:"The `performance.measureUserAgentSpecificMemory()` API is not available",measureMemory:"Measure Memory",learnMore:"Learn more",creationStackTrace:"Frame Creation `Stack Trace`",creationStackTraceExplanation:"This frame was created programmatically. The `stack trace` shows where this happened.",parentIsAdExplanation:"This frame is considered an ad frame because its parent frame is an ad frame.",matchedBlockingRuleExplanation:"This frame is considered an ad frame because its current (or previous) main document is an ad resource.",createdByAdScriptExplanation:"There was an ad script in the `(async) stack` when this frame was created. Examining the creation `stack trace` of this frame might provide more insight.",creatorAdScript:"Creator Ad Script",none:"None",originTrialsExplanation:"Origin trials give you access to a new or experimental feature."},Ie=t.i18n.registerUIStrings("panels/application/components/FrameDetailsView.ts",Ce),Pe=t.i18n.getLocalizedString.bind(void 0,Ie),De=l.RenderCoordinator.RenderCoordinator.instance();class Be extends s.LegacyWrapper.WrappableComponent{static litTagName=u.literal`devtools-resources-frame-details-view`;#e=this.attachShadow({mode:"open"});#Z;#ee;#te=!1;#ae=null;#O={policies:[],showDetails:!1};#re=new de;#K=new h.Linkifier.Linkifier;#oe=null;constructor(e){super(),this.#Z=e,this.render()}connectedCallback(){this.parentElement?.classList.add("overflow-auto"),this.#te=b.Runtime.experiments.isEnabled("protocol-monitor"),this.#e.adoptedStyleSheets=[X]}async render(){this.#oe=await(this.#Z?.parentFrame()?.getAdScriptId(this.#Z?.id))||null;const e=this.#oe?.debuggerId?await a.DebuggerModel.DebuggerModel.modelForDebuggerId(this.#oe?.debuggerId):null;this.#ee=e?.target(),!this.#ae&&this.#Z&&(this.#ae=this.#Z.getPermissionsPolicyState()),await De.write("FrameDetailsView render",(()=>{this.#Z&&u.render(u.html`
        <${c.ReportView.Report.litTagName} .data=${{reportTitle:this.#Z.displayName()}}
        jslog=${m.pane("frames")}>
          ${this.#ie()}
          ${this.#ne()}
          ${this.#se()}
          ${this.#le()}
          ${u.Directives.until(this.#ae?.then((e=>(this.#O.policies=e||[],u.html`
              <${fe.litTagName}
                .data=${this.#O}
              >
              </${fe.litTagName}>
            `))),u.nothing)}
          ${this.#te?this.#ce():u.nothing}
        </${c.ReportView.Report.litTagName}>
      `,this.#e,{host:this})}))}#le(){return this.#Z?(this.#re.classList.add("span-cols"),this.#Z.getOriginTrials().then((e=>{this.#re.data={trials:e}})),u.html`
    <${c.ReportView.ReportSectionHeader.litTagName}>${t.i18n.lockedString("Origin trials")}</${c.ReportView.ReportSectionHeader.litTagName}>
    <div class="span-cols">
        ${Pe(Ce.originTrialsExplanation)}
        <x-link href="https://developer.chrome.com/docs/web-platform/origin-trials/" class="link"
        jslog=${m.link("learn-more.origin-trials").track({click:!0})}>${Pe(Ce.learnMore)}</x-link>
    </div>
    ${this.#re}
    <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
    `):u.nothing}#ie(){return this.#Z?u.html`
      <${c.ReportView.ReportSectionHeader.litTagName}>${Pe(Ce.document)}</${c.ReportView.ReportSectionHeader.litTagName}>
      <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.url)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        <div class="inline-items">
          ${this.#de()}
          ${this.#he()}
          <div class="text-ellipsis" title=${this.#Z.url}>${this.#Z.url}</div>
        </div>
      </${c.ReportView.ReportValue.litTagName}>
      ${this.#ue()}
      ${this.#me()}
      ${u.Directives.until(this.#ge(),u.nothing)}
      ${this.#pe()}
      ${this.#be()}
      <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
    `:u.nothing}#de(){if(!this.#Z||this.#Z.unreachableUrl())return u.nothing;const t=this.#we(this.#Z);return we("breakpoint-circle",Pe(Ce.clickToRevealInSourcesPanel),(()=>e.Revealer.reveal(t)),"reveal-in-sources")}#he(){if(this.#Z){const t=this.#Z.resourceForURL(this.#Z.url);if(t&&t.request){const a=t.request;return we("arrow-up-down-circle",Pe(Ce.clickToRevealInNetworkPanel),(()=>{const t=v.UIRequestLocation.UIRequestLocation.tab(a,"headers-component");return e.Revealer.reveal(t)}),"reveal-in-network")}}return u.nothing}#we(e){for(const t of f.Workspace.WorkspaceImpl.instance().projects()){const a=w.NetworkProject.NetworkProject.getTargetForProject(t);if(a&&a===e.resourceTreeModel().target()){const a=t.uiSourceCodeForURL(e.url);if(a)return a}}return null}#ue(){return this.#Z&&this.#Z.unreachableUrl()?u.html`
      <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.unreachableUrl)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        <div class="inline-items">
          ${this.#fe()}
          <div class="text-ellipsis" title=${this.#Z.unreachableUrl()}>${this.#Z.unreachableUrl()}</div>
        </div>
      </${c.ReportView.ReportValue.litTagName}>
    `:u.nothing}#fe(){if(this.#Z){const t=e.ParsedURL.ParsedURL.fromString(this.#Z.unreachableUrl());if(t)return we("arrow-up-down-circle",Pe(Ce.clickToRevealInNetworkPanelMight),(()=>{e.Revealer.reveal(v.UIFilter.UIRequestFilter.filters([{filterType:v.UIFilter.FilterType.Domain,filterValue:t.domain()},{filterType:null,filterValue:t.path}]))}),"unreachable-url.reveal-in-network")}return u.nothing}#me(){return this.#Z&&this.#Z.securityOrigin&&"://"!==this.#Z.securityOrigin?u.html`
        <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.origin)}</${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName}>
          <div class="text-ellipsis" title=${this.#Z.securityOrigin}>${this.#Z.securityOrigin}</div>
        </${c.ReportView.ReportValue.litTagName}>
      `:u.nothing}async#ge(){if(this.#Z){const t=await this.#Z.getOwnerDOMNodeOrDocument();if(t)return u.html`
          <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.ownerElement)}</${c.ReportView.ReportKey.litTagName}>
          <${c.ReportView.ReportValue.litTagName} class="without-min-width">
            <div class="inline-items">
              <button class="link text-link" role="link" tabindex=0 title=${Pe(Ce.clickToRevealInElementsPanel)}
                @mouseenter=${()=>this.#Z?.highlight()}
                @mouseleave=${()=>a.OverlayModel.OverlayModel.hideDOMNodeHighlight()}
                @click=${()=>e.Revealer.reveal(t)}
                jslog=${m.action("reveal-in-elements").track({click:!0})}
              >
                &lt;${t.nodeName().toLocaleLowerCase()}&gt;
              </button>
            </div>
          </${c.ReportView.ReportValue.litTagName}>
        `}return u.nothing}#pe(){const e=this.#Z?.getCreationStackTraceData();return e&&e.creationStackTrace?u.html`
        <${c.ReportView.ReportKey.litTagName} title=${Pe(Ce.creationStackTraceExplanation)}>${Pe(Ce.creationStackTrace)}</${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName}
        jslog=${m.section("frame-creation-stack-trace")}
        >
          <${xe.litTagName} .data=${{frame:this.#Z,buildStackTraceRows:h.JSPresentationUtils.buildStackTraceRows}}>
          </${xe.litTagName}>
        </${c.ReportView.ReportValue.litTagName}>
      `:u.nothing}#ve(e){switch(e){case"child":return{value:Pe(Ce.child),description:Pe(Ce.childDescription)};case"root":return{value:Pe(Ce.root),description:Pe(Ce.rootDescription)}}}#ke(e){switch(e){case"CreatedByAdScript":return Pe(Ce.createdByAdScriptExplanation);case"MatchedBlockingRule":return Pe(Ce.matchedBlockingRuleExplanation);case"ParentIsAd":return Pe(Ce.parentIsAdExplanation)}}#be(){if(!this.#Z)return u.nothing;const e=this.#Z.adFrameType();if("none"===e)return u.nothing;const t=this.#ve(e),a=[u.html`<div title=${t.description}>${t.value}</div>`];for(const e of this.#Z.adFrameStatus()?.explanations||[])a.push(u.html`<div>${this.#ke(e)}</div>`);const r=this.#ee?this.#K.linkifyScriptLocation(this.#ee,this.#oe?.scriptId||null,p.DevToolsPath.EmptyUrlString,void 0,void 0):null;return u.html`
      <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.adStatus)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}
      jslog=${m.section("ad-status")}>
        <${i.ExpandableList.ExpandableList.litTagName} .data=${{rows:a,title:Pe(Ce.adStatus)}}></${i.ExpandableList.ExpandableList.litTagName}></${c.ReportView.ReportValue.litTagName}>
      ${this.#ee?u.html`
        <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.creatorAdScript)}</${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName} class="ad-script-link">${r?.setAttribute("jslog",`${m.link("ad-script").track({click:!0})}`)}</${c.ReportView.ReportValue.litTagName}>
      `:u.nothing}
    `}#ne(){return this.#Z?u.html`
      <${c.ReportView.ReportSectionHeader.litTagName}>${Pe(Ce.securityIsolation)}</${c.ReportView.ReportSectionHeader.litTagName}>
      <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.secureContext)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        ${this.#Z.isSecureContext()?Pe(Ce.yes):Pe(Ce.no)}\xA0${this.#ye()}
      </${c.ReportView.ReportValue.litTagName}>
      <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.crossoriginIsolated)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        ${this.#Z.isCrossOriginIsolated()?Pe(Ce.yes):Pe(Ce.no)}
      </${c.ReportView.ReportValue.litTagName}>
      ${u.Directives.until(this.#Se(),u.nothing)}
      <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
    `:u.nothing}#ye(){const e=this.#Te();return e?u.html`<span class="inline-comment">${e}</span>`:u.nothing}#Te(){switch(this.#Z?.getSecureContextType()){case"Secure":return null;case"SecureLocalhost":return Pe(Ce.localhostIsAlwaysASecureContext);case"InsecureAncestor":return Pe(Ce.aFrameAncestorIsAnInsecure);case"InsecureScheme":return Pe(Ce.theFramesSchemeIsInsecure)}return null}async#Se(){if(this.#Z){const e=this.#Z.resourceTreeModel().target().model(a.NetworkManager.NetworkManager),r=e&&await e.getSecurityIsolationStatus(this.#Z.id);if(r)return u.html`
          ${this.#Re(r.coep,t.i18n.lockedString("Cross-Origin Embedder Policy (COEP)"),"None")}
          ${this.#Re(r.coop,t.i18n.lockedString("Cross-Origin Opener Policy (COOP)"),"UnsafeNone")}
          ${this.#$e(r.csp)}
        `}return u.nothing}#Re(e,t,a){if(!e)return u.nothing;const r=e.value!==a,o=!r&&e.reportOnlyValue!==a,i=r?e.reportingEndpoint:e.reportOnlyReportingEndpoint;return u.html`
      <${c.ReportView.ReportKey.litTagName}>${t}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        ${r?e.value:e.reportOnlyValue}
        ${o?u.html`<span class="inline-comment">report-only</span>`:u.nothing}
        ${i?u.html`<span class="inline-name">${Pe(Ce.reportingTo)}</span>${i}`:u.nothing}
      </${c.ReportView.ReportValue.litTagName}>
    `}#xe(e){const t=new k.CspParser.CspParser(e).csp.directives,a=[];for(const e in t)a.push(u.html`<div><span class="bold">${e}</span>${": "+t[e]?.join(", ")}</div>`);return a}#Ne(e){return u.html`
      <${c.ReportView.ReportKey.litTagName}>${e.isEnforced?t.i18n.lockedString("Content-Security-Policy"):u.html`${t.i18n.lockedString("Content-Security-Policy-Report-Only")}<${r.Button.Button.litTagName}
          .iconName=${"help"}
          class='help-button'
          .variant=${"icon"}
          .size=${"SMALL"}
          @click=${()=>{window.location.href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only"}}
          jslog=${m.link("learn-more.csp-report-only").track({click:!0})}>
        </${r.Button.Button.litTagName}>`}
      </${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        ${"HTTP"===e.source?t.i18n.lockedString("HTTP header"):t.i18n.lockedString("Meta tag")}
        ${this.#xe(e.effectiveDirectives)}
      </${c.ReportView.ReportValue.litTagName}>
    `}#$e(e){return u.html`
      <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
      <${c.ReportView.ReportSectionHeader.litTagName}>
        ${Pe(Ce.contentSecurityPolicy)}
      </${c.ReportView.ReportSectionHeader.litTagName}>
      ${e&&e.length?e.map((e=>this.#Ne(e))):u.html`
        <${c.ReportView.ReportKey.litTagName}>${t.i18n.lockedString("Content-Security-Policy")}</${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName}>
          ${Pe(Ce.none)}
        </${c.ReportView.ReportValue.litTagName}>
      `}
    `}#se(){return this.#Z?u.html`
      <${c.ReportView.ReportSectionHeader.litTagName}>${Pe(Ce.apiAvailability)}</${c.ReportView.ReportSectionHeader.litTagName}>
      <div class="span-cols">
        ${Pe(Ce.availabilityOfCertainApisDepends)}
        <x-link href="https://web.dev/why-coop-coep/" class="link" jslog=${m.link("learn-more.coop-coep").track({click:!0})}>${Pe(Ce.learnMore)}</x-link>
      </div>
      ${this.#Ce()}
      ${this.#Ie()}
      <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
    `:u.nothing}#Ce(){if(this.#Z){const e=this.#Z.getGatedAPIFeatures();if(e){const t=e.includes("SharedArrayBuffers"),a=t&&e.includes("SharedArrayBuffersTransferAllowed"),r=Pe(a?Ce.availableTransferable:t?Ce.availableNotTransferable:Ce.unavailable),o=a?Pe(Ce.sharedarraybufferConstructorIs):t?Pe(Ce.sharedarraybufferConstructorIsAvailable):"";function i(e){switch(e.getCrossOriginIsolatedContextType()){case"Isolated":return u.nothing;case"NotIsolated":return t?u.html`<span class="inline-comment">${Pe(Ce.willRequireCrossoriginIsolated)}</span>`:u.html`<span class="inline-comment">${Pe(Ce.requiresCrossoriginIsolated)}</span>`;case"NotIsolatedFeatureDisabled":if(!a)return u.html`<span class="inline-comment">${Pe(Ce.transferRequiresCrossoriginIsolatedPermission)} <code>cross-origin-isolated</code></span>`}return u.nothing}return u.html`
          <${c.ReportView.ReportKey.litTagName}>SharedArrayBuffers</${c.ReportView.ReportKey.litTagName}>
          <${c.ReportView.ReportValue.litTagName} title=${o}>
            ${r}\xA0${i(this.#Z)}
          </${c.ReportView.ReportValue.litTagName}>
        `}}return u.nothing}#Ie(){if(this.#Z){const e=this.#Z.isCrossOriginIsolated(),t=Pe(e?Ce.available:Ce.unavailable),a=Pe(e?Ce.thePerformanceAPI:Ce.thePerformancemeasureuseragentspecificmemory);return u.html`
        <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.measureMemory)}</${c.ReportView.ReportKey.litTagName}>
        <${c.ReportView.ReportValue.litTagName}>
          <span title=${a}>${t}</span>\xA0<x-link class="link" href="https://web.dev/monitor-total-page-memory-usage/" jslog=${m.link("learn-more.monitor-memory-usage").track({click:!0})}>${Pe(Ce.learnMore)}</x-link>
        </${c.ReportView.ReportValue.litTagName}>
      `}return u.nothing}#ce(){return this.#Z?u.html`
      <${c.ReportView.ReportSectionHeader.litTagName}
        title=${Pe(Ce.thisAdditionalDebugging)}
      >${Pe(Ce.additionalInformation)}</${c.ReportView.ReportSectionHeader.litTagName}>
      <${c.ReportView.ReportKey.litTagName}>${Pe(Ce.frameId)}</${c.ReportView.ReportKey.litTagName}>
      <${c.ReportView.ReportValue.litTagName}>
        <div class="text-ellipsis" title=${this.#Z.id}>${this.#Z.id}</div>
      </${c.ReportView.ReportValue.litTagName}>
      <${c.ReportView.ReportSectionDivider.litTagName}></${c.ReportView.ReportSectionDivider.litTagName}>
    `:u.nothing}}customElements.define("devtools-resources-frame-details-view",Be);var Me=Object.freeze({__proto__:null,FrameDetailsReportView:Be});const Ve=new CSSStyleSheet;Ve.replaceSync(":host{padding:20px}.heading{font-size:15px}devtools-data-grid-controller{border:1px solid var(--sys-color-divider);margin-top:20px}.info-icon{vertical-align:text-bottom;height:14px}.no-events-message{margin-top:20px}\n/*# sourceURL=interestGroupAccessGrid.css */\n");const Fe={allInterestGroupStorageEvents:"All interest group storage events.",eventTime:"Event Time",eventType:"Access Type",groupOwner:"Owner",groupName:"Name",noEvents:"No interest group events recorded."},Ee=t.i18n.registerUIStrings("panels/application/components/InterestGroupAccessGrid.ts",Fe),Le=t.i18n.getLocalizedString.bind(void 0,Ee);class Ae extends HTMLElement{static litTagName=u.literal`devtools-interest-group-access-grid`;#e=this.attachShadow({mode:"open"});#Pe=[];connectedCallback(){this.#e.adoptedStyleSheets=[Ve],this.#$()}set data(e){this.#Pe=e,this.#$()}#$(){u.render(u.html`
      <div>
        <span class="heading">Interest Groups</span>
        <${n.Icon.Icon.litTagName} class="info-icon" title=${Le(Fe.allInterestGroupStorageEvents)}
          .data=${{iconName:"info",color:"var(--icon-default)",width:"16px"}}>
        </${n.Icon.Icon.litTagName}>
        ${this.#De()}
      </div>
    `,this.#e,{host:this})}#De(){if(0===this.#Pe.length)return u.html`<div class="no-events-message">${Le(Fe.noEvents)}</div>`;const e={columns:[{id:"event-time",title:Le(Fe.eventTime),widthWeighting:10,hideable:!1,visible:!0,sortable:!0},{id:"event-type",title:Le(Fe.eventType),widthWeighting:5,hideable:!1,visible:!0,sortable:!0},{id:"event-group-owner",title:Le(Fe.groupOwner),widthWeighting:10,hideable:!1,visible:!0,sortable:!0},{id:"event-group-name",title:Le(Fe.groupName),widthWeighting:10,hideable:!1,visible:!0,sortable:!0}],rows:this.#Be(),initialSort:{columnId:"event-time",direction:"ASC"}};return u.html`
      <${g.DataGridController.DataGridController.litTagName} .data=${e}></${g.DataGridController.DataGridController.litTagName}>
    `}#Be(){return this.#Pe.map((e=>({cells:[{columnId:"event-time",value:e.accessTime,renderer:this.#Me.bind(this)},{columnId:"event-type",value:e.type},{columnId:"event-group-owner",value:e.ownerOrigin},{columnId:"event-group-name",value:e.name}]})))}#Me(e){const t=new Date(1e3*e);return u.html`${t.toLocaleString()}`}}customElements.define("devtools-interest-group-access-grid",Ae);var He=Object.freeze({__proto__:null,i18nString:Le,InterestGroupAccessGrid:Ae});const Oe=new CSSStyleSheet;Oe.replaceSync('*{box-sizing:border-box;min-width:0;min-height:0}:root{height:100%;overflow:hidden;--legacy-accent-color:#1a73e8;--legacy-accent-fg-color:#1a73e8;--legacy-accent-color-hover:#3b86e8;--legacy-accent-fg-color-hover:#1567d3;--legacy-active-control-bg-color:#5a5a5a;--legacy-focus-bg-color:hsl(214deg 40% 92%);--legacy-focus-ring-inactive-shadow-color:#e0e0e0;--legacy-input-validation-error:#db1600;--legacy-toolbar-hover-bg-color:#eaeaea;--legacy-selection-fg-color:#fff;--legacy-selection-bg-color:var(--legacy-accent-color);--legacy-selection-inactive-fg-color:#5a5a5a;--legacy-selection-inactive-bg-color:#dadada;--legacy-divider-border:1px solid var(--sys-color-divider);--legacy-focus-ring-inactive-shadow:0 0 0 1px var(--legacy-focus-ring-inactive-shadow-color);--legacy-focus-ring-active-shadow:0 0 0 1px var(--legacy-accent-color);--legacy-item-selection-bg-color:#cfe8fc;--legacy-item-selection-inactive-bg-color:#e0e0e0;--monospace-font-size:10px;--monospace-font-family:monospace;--source-code-font-size:11px;--source-code-font-family:monospace;--sys-motion-duration-short4:200ms;--sys-motion-duration-medium2:300ms;--sys-motion-duration-long2:500ms;--sys-motion-easing-emphasized:cubic-bezier(0.2,0,0,1);--sys-motion-easing-emphasized-decelerate:cubic-bezier(0.05,0.7,0.1,1);--sys-motion-easing-emphasized-accelerate:cubic-bezier(0.2,0,0,1)}.theme-with-dark-background{color-scheme:dark;--legacy-accent-color:#0e639c;--legacy-accent-fg-color:#ccc;--legacy-accent-fg-color-hover:#fff;--legacy-accent-color-hover:rgb(17 119 187);--legacy-active-control-bg-color:#cdcdcd;--legacy-focus-bg-color:hsl(214deg 19% 27%);--legacy-focus-ring-inactive-shadow-color:#5a5a5a;--legacy-toolbar-hover-bg-color:#202020;--legacy-selection-fg-color:#cdcdcd;--legacy-selection-inactive-fg-color:#cdcdcd;--legacy-selection-inactive-bg-color:hsl(0deg 0% 28%);--legacy-focus-ring-inactive-shadow:0 0 0 1px var(--legacy-focus-ring-inactive-shadow-color);--legacy-item-selection-bg-color:hsl(207deg 88% 22%);--legacy-item-selection-inactive-bg-color:#454545}body{--default-font-family:".SFNSDisplay-Regular","Helvetica Neue","Lucida Grande",sans-serif;height:100%;width:100%;position:relative;overflow:hidden;margin:0;cursor:default;font-family:var(--default-font-family);font-size:12px;tab-size:4;user-select:none;color:var(--sys-color-on-surface);background:var(--sys-color-cdt-base-container)}.platform-linux{--default-font-family:"Google Sans Text","Google Sans",system-ui,sans-serif}.platform-mac{--default-font-family:system-ui,sans-serif}.platform-windows{--default-font-family:system-ui,sans-serif}:focus{outline-width:0}.platform-mac,\n:host-context(.platform-mac){--monospace-font-size:11px;--monospace-font-family:monospace;--source-code-font-size:11px;--source-code-font-family:monospace}.platform-windows,\n:host-context(.platform-windows){--monospace-font-size:12px;--monospace-font-family:monospace;--source-code-font-size:12px;--source-code-font-family:monospace}.platform-linux,\n:host-context(.platform-linux){--monospace-font-size:11px;--monospace-font-family:"Noto Sans Mono","DejaVu Sans Mono",monospace;--source-code-font-size:11px;--source-code-font-family:"Noto Sans Mono","DejaVu Sans Mono",monospace}.monospace{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)!important}.source-code{font-family:var(--source-code-font-family);font-size:var(--source-code-font-size)!important;white-space:pre-wrap}.source-code .devtools-link.text-button{max-width:100%;overflow:hidden;text-overflow:ellipsis}img{-webkit-user-drag:none}iframe,\na img{border:none}.fill{position:absolute;top:0;left:0;right:0;bottom:0}iframe.fill{width:100%;height:100%}.widget{position:relative;flex:auto;contain:style}.hbox{display:flex;flex-direction:row!important;position:relative}.vbox{display:flex;flex-direction:column!important;position:relative}.view-container > .toolbar{border-bottom:1px solid var(--sys-color-divider)}.flex-auto{flex:auto}.flex-none{flex:none}.flex-centered{display:flex;align-items:center;justify-content:center}.overflow-auto{overflow:auto;background-color:var(--sys-color-cdt-base-container)}iframe.widget{position:absolute;width:100%;height:100%;left:0;right:0;top:0;bottom:0}.hidden{display:none!important}.highlighted-search-result{border-radius:1px;background-color:var(--sys-color-yellow-container);outline:1px solid var(--sys-color-yellow-container)}.link{cursor:pointer;text-decoration:underline;color:var(--sys-color-primary);outline-offset:2px}button,\ninput,\nselect{font-family:inherit;font-size:inherit}select option,\nselect optgroup,\ninput{background-color:var(--sys-color-cdt-base-container)}input{color:inherit;&[type="checkbox"]{position:relative;&:hover::after,\n    &:active::before{content:"";height:24px;width:24px;border-radius:var(--sys-shape-corner-full);position:absolute;top:-6px;left:-6px}&:not(.-theme-preserve){accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary)}&:not(:disabled):hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:not(:disabled):active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:not(:disabled):focus-visible{outline:none;&::before{content:"";height:15px;width:15px;border-radius:5px;position:absolute;top:-3.5px;left:-3.5px;border:2px solid var(--sys-color-state-focus-ring)}}&.small:hover::after,\n    &.small:active::before{height:12px;width:12px;top:0;left:0;border-radius:2px}}}input::placeholder{--override-input-placeholder-color:rgb(0 0 0/54%);color:var(--override-input-placeholder-color)}.theme-with-dark-background input::placeholder,\n:host-context(.theme-with-dark-background) input::placeholder{--override-input-placeholder-color:rgb(230 230 230/54%)}.harmony-input:not([type]),\n.harmony-input[type="number"],\n.harmony-input[type="text"]{padding:3px 6px;height:24px;border:1px solid var(--sys-color-neutral-outline);border-radius:4px;&.error-input,\n  &:invalid{border-color:var(--sys-color-error)}&:not(.error-input):not(:invalid):focus{border-color:var(--sys-color-state-focus-ring)}&:not(.error-input):not(:invalid):hover:not(:focus){background:var(--sys-color-state-hover-on-subtle)}}.highlighted-search-result.current-search-result{--override-current-search-result-background-color:rgb(255 127 0/80%);border-radius:1px;padding:1px;margin:-1px;background-color:var(--override-current-search-result-background-color)}.dimmed{opacity:60%}.editing{box-shadow:var(--drop-shadow);background-color:var(--sys-color-cdt-base-container);text-overflow:clip!important;padding-left:2px;margin-left:-2px;padding-right:2px;margin-right:-2px;margin-bottom:-1px;padding-bottom:1px;opacity:100%!important}.editing,\n.editing *{color:var(--sys-color-on-surface)!important;text-decoration:none!important}.chrome-select{appearance:none;user-select:none;border:1px solid var(--sys-color-neutral-outline);border-radius:4px;color:var(--sys-color-on-surface);font:inherit;margin:0;outline:none;padding-right:20px;padding-left:6px;background-image:var(--image-file-arrow-drop-down-light);background-color:var(--sys-color-surface);background-position:right center;background-repeat:no-repeat;min-height:24px;min-width:80px}.chrome-select:disabled{opacity:38%}.theme-with-dark-background .chrome-select,\n:host-context(.theme-with-dark-background) .chrome-select{background-image:var(--image-file-arrow-drop-down-dark)}.chrome-select:enabled{&:hover{background-color:var(--sys-color-state-hover-on-subtle)}&:active{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:focus{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px}}@media (forced-colors: active) and (prefers-color-scheme: light){.chrome-select{background-image:var(--image-file-arrow-drop-down-light)}.theme-with-dark-background .chrome-select,\n  :host-context(.theme-with-dark-background) .chrome-select{background-image:var(--image-file-arrow-drop-down-light)}}@media (forced-colors: active) and (prefers-color-scheme: dark){.chrome-select{background-image:var(--image-file-arrow-drop-down-dark)}.theme-with-dark-background .chrome-select,\n  :host-context(.theme-with-dark-background) .chrome-select{background-image:var(--image-file-arrow-drop-down-dark)}}.chrome-select-label{margin:0 22px;flex:none}.chrome-select-label p p{margin-top:0;color:var(--sys-color-token-subtle)}.settings-select{margin:0}.chrome-select optgroup,\n.chrome-select option{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface)}.gray-info-message{text-align:center;font-style:italic;padding:6px;color:var(--sys-color-token-subtle);white-space:nowrap}span[is="dt-icon-label"]{flex:none}.full-widget-dimmed-banner a{color:inherit}.full-widget-dimmed-banner{color:var(--sys-color-token-subtle);background-color:var(--sys-color-cdt-base-container);display:flex;justify-content:center;align-items:center;text-align:center;padding:20px;position:absolute;top:0;right:0;bottom:0;left:0;font-size:13px;overflow:auto;z-index:500}.dot::before{content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-default);left:9px;position:absolute;top:9px;z-index:1}.green::before{background-color:var(--sys-color-green-bright)}.purple::before{background-color:var(--sys-color-purple-bright)}.expandable-inline-button{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface);cursor:pointer;border-radius:3px}.undisplayable-text,\n.expandable-inline-button{border:none;padding:1px 3px;margin:0 2px;font-size:11px;font-family:sans-serif;white-space:nowrap;display:inline-block}.undisplayable-text::after,\n.expandable-inline-button::after{content:attr(data-text)}.undisplayable-text{color:var(--sys-color-state-disabled);font-style:italic}.expandable-inline-button:hover,\n.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-hover-on-subtle)}.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-focus-highlight)}::selection{background-color:var(--sys-color-tonal-container)}.reload-warning{align-self:center;margin-left:10px}button.link{border:none;background:none;padding:3px}button.link:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px;border-radius:var(--sys-shape-corner-full)}.theme-with-dark-background button.link:focus-visible,\n:host-context(.theme-with-dark-background) button.link:focus-visible{--override-link-focus-background-color:rgb(230 230 230/8%)}@media (forced-colors: active){.dimmed,\n  .chrome-select:disabled{opacity:100%}.harmony-input:not([type]),\n  .harmony-input[type="number"],\n  .harmony-input[type="text"]{border:1px solid ButtonText}.harmony-input:not([type]):focus,\n  .harmony-input[type="number"]:focus,\n  .harmony-input[type="text"]:focus{border:1px solid Highlight}}input.custom-search-input::-webkit-search-cancel-button{appearance:none;width:16px;height:15px;margin-right:0;opacity:70%;mask-image:var(--image-file-cross-circle-filled);mask-position:center;mask-repeat:no-repeat;mask-size:99%;background-color:var(--icon-default)}input.custom-search-input::-webkit-search-cancel-button:hover{opacity:99%}.spinner::before{display:block;width:var(--dimension,24px);height:var(--dimension,24px);border:var(--override-spinner-size,3px) solid var(--override-spinner-color,var(--sys-color-token-subtle));border-radius:12px;clip:rect(0,var(--clip-size,15px),var(--clip-size,15px),0);content:"";position:absolute;animation:spinner-animation 1s linear infinite;box-sizing:border-box}@keyframes spinner-animation{from{transform:rotate(0)}to{transform:rotate(360deg)}}.adorner-container{display:inline-flex;vertical-align:middle}.adorner-container.hidden{display:none}.adorner-container devtools-adorner{margin-left:3px}:host-context(.theme-with-dark-background) devtools-adorner{--override-adorner-border-color:var(--sys-color-tonal-outline);--override-adorner-focus-border-color:var(--sys-color-state-focus-ring);--override-adorner-active-background-color:var(--sys-color-state-riple-neutral-on-subtle)}.panel{display:flex;overflow:hidden;position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;background-color:var(--sys-color-cdt-base-container)}.panel-sidebar{overflow-x:hidden;background-color:var(--sys-color-cdt-base-container)}iframe.extension{flex:auto;width:100%;height:100%}iframe.panel.extension{display:block;height:100%}@media (forced-colors: active){:root{--legacy-accent-color:Highlight;--legacy-focus-ring-inactive-shadow-color:ButtonText}}\n/*# sourceURL=inspectorCommon.css */\n');const We=new CSSStyleSheet;We.replaceSync('.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.devtools-link:focus-visible{outline-width:unset}input.devtools-text-input[type="text"]{padding:3px 6px;margin-left:4px;margin-right:4px;width:250px;height:25px}input.devtools-text-input[type="text"]::placeholder{color:var(--sys-color-token-subtle)}.protocol-handlers-row{margin:10px 0 2px 18px}.inline-icon{margin-inline:4px;width:16px;height:16px;&[name="check-circle"]{color:var(--icon-checkmark-green)}}@media (forced-colors: active){.devtools-link:not(.devtools-link-prevent-click){color:linktext}.devtools-link:focus-visible{background:Highlight;color:HighlightText}}\n/*# sourceURL=protocolHandlersView.css */\n');const Ue={protocolDetected:"Found valid protocol handler registration in the {PH1}. With the app installed, test the registered protocols.",protocolNotDetected:"Define protocol handlers in the {PH1} to register your app as a handler for custom protocols when your app is installed.",needHelpReadOur:"Need help? Read {PH1}.",protocolHandlerRegistrations:"URL protocol handler registration for PWAs",manifest:"manifest",testProtocol:"Test protocol",dropdownLabel:"Select protocol handler",textboxLabel:"Query parameter or endpoint for protocol handler",textboxPlaceholder:"Enter URL"},qe=t.i18n.registerUIStrings("panels/application/components/ProtocolHandlersView.ts",Ue),je=t.i18n.getLocalizedString.bind(void 0,qe);class ze extends HTMLElement{static litTagName=u.literal`devtools-protocol-handlers-view`;#e=this.attachShadow({mode:"open"});#Ve=[];#Fe=p.DevToolsPath.EmptyUrlString;#Ee="";#Le="";set data(e){const t=this.#Fe!==e.manifestLink;this.#Ve=e.protocolHandlers,this.#Fe=e.manifestLink,t&&this.#Ae()}#Ae(){this.#Le="",this.#Ee=this.#Ve[0]?.protocol??"",this.#$()}#He(){const e=R.XLink.XLink.create(this.#Fe,je(Ue.manifest),void 0,void 0,"manifest"),a=this.#Ve.length>0?Ue.protocolDetected:Ue.protocolNotDetected;return u.html`
    <div class="protocol-handlers-row status">
            <${n.Icon.Icon.litTagName} class="inline-icon"
                                                name=${this.#Ve.length>0?"check-circle":"info"}>
            </${n.Icon.Icon.litTagName}>
            ${t.i18n.getFormatLocalizedString(qe,a,{PH1:e})}
    </div>
    `}#Oe(){if(0===this.#Ve.length)return u.nothing;const e=this.#Ve.filter((e=>e.protocol)).map((e=>u.html`<option value=${e.protocol} jslog=${m.item(e.protocol).track({click:!0})}>${e.protocol}://</option>`));return u.html`
       <div class="protocol-handlers-row">
        <select class="chrome-select protocol-select" @change=${this.#We} aria-label=${je(Ue.dropdownLabel)}>
           ${e}
        </select>
        <input .value=${this.#Le} class="devtools-text-input" type="text" @change=${this.#Ue} aria-label=${je(Ue.textboxLabel)}
        placeholder=${je(Ue.textboxPlaceholder)}/>
        <${r.Button.Button.litTagName} .variant=${"primary"} @click=${this.#qe}>
            ${je(Ue.testProtocol)}
        </${r.Button.Button.litTagName}>
        </div>
      `}#We=e=>{this.#Ee=e.target.value};#Ue=e=>{this.#Le=e.target.value,this.#$()};#qe=()=>{const e=`${this.#Ee}://${this.#Le}`;S.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(e),S.userMetrics.actionTaken(S.UserMetrics.Action.CaptureTestProtocolClicked)};connectedCallback(){this.#e.adoptedStyleSheets=[We,Oe,T.textInputStyles]}#$(){const e=R.XLink.XLink.create("https://web.dev/url-protocol-handler/",je(Ue.protocolHandlerRegistrations),void 0,void 0,"learn-more");u.render(u.html`
      ${this.#He()}
      <div class="protocol-handlers-row">
          ${t.i18n.getFormatLocalizedString(qe,Ue.needHelpReadOur,{PH1:e})}
      </div>
      ${this.#Oe()}
    `,this.#e,{host:this})}}customElements.define("devtools-protocol-handlers-view",ze);var _e=Object.freeze({__proto__:null,ProtocolHandlersView:ze});const Ge={noReportsToDisplay:"No reports to display",status:"Status",destination:"Destination",generatedAt:"Generated at"},Ke=t.i18n.registerUIStrings("panels/application/components/ReportsGrid.ts",Ge),Je=t.i18n.getLocalizedString.bind(void 0,Ke),{render:Xe,html:Ye}=u;class Qe extends HTMLElement{static litTagName=u.literal`devtools-resources-reports-grid-status-header`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[U],this.#$()}#$(){Xe(Ye`
      ${Je(Ge.status)}
      <x-link href="https://web.dev/reporting-api/#report-status"
      jslog=${m.link("report-status").track({click:!0})}>
        <${n.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"help",color:"var(--icon-link)",width:"16px",height:"16px"}}></${n.Icon.Icon.litTagName}>
      </x-link>
    `,this.#e,{host:this})}}class Ze extends HTMLElement{static litTagName=u.literal`devtools-resources-reports-grid`;#e=this.attachShadow({mode:"open"});#je=[];#te=!1;connectedCallback(){this.#e.adoptedStyleSheets=[U],this.#te=b.Runtime.experiments.isEnabled("protocol-monitor"),this.#$()}set data(e){this.#je=e.reports,this.#$()}#$(){const e={columns:[{id:"url",title:t.i18n.lockedString("URL"),widthWeighting:30,hideable:!1,visible:!0},{id:"type",title:t.i18n.lockedString("Type"),widthWeighting:20,hideable:!1,visible:!0},{id:"status",title:Je(Ge.status),widthWeighting:20,hideable:!1,visible:!0,titleElement:Ye`
          <${Qe.litTagName}></${Qe.litTagName}>
          `},{id:"destination",title:Je(Ge.destination),widthWeighting:20,hideable:!1,visible:!0},{id:"timestamp",title:Je(Ge.generatedAt),widthWeighting:20,hideable:!1,visible:!0},{id:"body",title:t.i18n.lockedString("Body"),widthWeighting:20,hideable:!1,visible:!0}],rows:this.#M()};this.#te&&e.columns.unshift({id:"id",title:"ID",widthWeighting:30,hideable:!1,visible:!0}),Xe(Ye`
      <div class="reporting-container" jslog=${m.section("reports")}>
        <div class="reporting-header">${t.i18n.lockedString("Reports")}</div>
        ${this.#je.length>0?Ye`
          <${g.DataGridController.DataGridController.litTagName} .data=${e}>
          </${g.DataGridController.DataGridController.litTagName}>
        `:Ye`
          <div class="reporting-placeholder">
            <div>${Je(Ge.noReportsToDisplay)}</div>
          </div>
        `}
      </div>
    `,this.#e,{host:this})}#M(){return this.#je.map((e=>({cells:[{columnId:"id",value:e.id},{columnId:"url",value:e.initiatorUrl},{columnId:"type",value:e.type},{columnId:"status",value:e.status},{columnId:"destination",value:e.destination},{columnId:"timestamp",value:new Date(1e3*e.timestamp).toLocaleString()},{columnId:"body",value:JSON.stringify(e.body)}]})))}}customElements.define("devtools-resources-reports-grid-status-header",Qe),customElements.define("devtools-resources-reports-grid",Ze);var et=Object.freeze({__proto__:null,i18nString:Je,ReportsGridStatusHeader:Qe,ReportsGrid:Ze});const tt=new CSSStyleSheet;tt.replaceSync(":host{display:block;white-space:normal;max-width:400px}.router-rules{border:1px solid var(--sys-color-divider);border-spacing:0;padding-left:10px;padding-right:10px;line-height:initial;margin-top:0;padding-bottom:12px;text-wrap:balance}.router-rule{display:flex;margin-top:12px;flex-direction:column}.rule-id{color:var(--sys-color-token-subtle)}.item{display:flex;flex-direction:column;padding-left:10px}.condition,\n.source{list-style:none;display:flex;margin-top:4px;flex-direction:row}.condition > *,\n.source > *{word-break:break-all;line-height:1.5em}.rule-type{flex:0 0 18%}\n/*# sourceURL=serviceWorkerRouterView.css */\n");const{html:at,render:rt}=u;class ot extends s.LegacyWrapper.WrappableComponent{static litTagName=u.literal`devtools-service-worker-router-view`;#e=this.attachShadow({mode:"open"});#ze=[];connectedCallback(){this.#e.adoptedStyleSheets=[tt]}update(e){this.#ze=e,this.#ze.length>0&&this.#$()}#$(){rt(at`
      <ul class="router-rules">
        ${this.#ze.map(this.#_e)}
      </ul>
    `,this.#e,{host:this})}#_e(e){return at`
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
    `}}customElements.define("devtools-service-worker-router-view",ot);var it=Object.freeze({__proto__:null,ServiceWorkerRouterView:ot});const nt=new CSSStyleSheet;nt.replaceSync(":host{padding:20px}.heading{font-size:15px}devtools-data-grid-controller{border:1px solid var(--sys-color-divider);margin-top:20px}.info-icon{vertical-align:text-bottom;height:14px}.no-events-message{margin-top:20px}\n/*# sourceURL=sharedStorageAccessGrid.css */\n");const st={sharedStorage:"Shared storage",allSharedStorageEvents:"All shared storage events for this page.",eventTime:"Event Time",eventType:"Access Type",mainFrameId:"Main Frame ID",ownerOrigin:"Owner Origin",eventParams:"Optional Event Params",noEvents:"No shared storage events recorded."},lt=t.i18n.registerUIStrings("panels/application/components/SharedStorageAccessGrid.ts",st),ct=t.i18n.getLocalizedString.bind(void 0,lt);class dt extends HTMLElement{static litTagName=u.literal`devtools-shared-storage-access-grid`;#e=this.attachShadow({mode:"open"});#Pe=[];connectedCallback(){this.#e.adoptedStyleSheets=[nt],this.#$()}set data(e){this.#Pe=e,this.#$()}#$(){u.render(u.html`
      <div>
        <span class="heading">${ct(st.sharedStorage)}</span>
        <${n.Icon.Icon.litTagName} class="info-icon" title=${ct(st.allSharedStorageEvents)}
          .data=${{iconName:"info",color:"var(--icon-default)",width:"16px"}}>
        </${n.Icon.Icon.litTagName}>
        ${this.#De()}
      </div>
    `,this.#e,{host:this})}#De(){if(0===this.#Pe.length)return u.html`<div
        class="no-events-message">${ct(st.noEvents)}</div>`;const e={columns:[{id:"event-main-frame-id",title:ct(st.mainFrameId),widthWeighting:10,hideable:!1,visible:!1,sortable:!1},{id:"event-time",title:ct(st.eventTime),widthWeighting:10,hideable:!1,visible:!0,sortable:!0},{id:"event-type",title:ct(st.eventType),widthWeighting:10,hideable:!1,visible:!0,sortable:!0},{id:"event-owner-origin",title:ct(st.ownerOrigin),widthWeighting:10,hideable:!1,visible:!0,sortable:!0},{id:"event-params",title:ct(st.eventParams),widthWeighting:10,hideable:!1,visible:!0,sortable:!0}],rows:this.#Be(),initialSort:{columnId:"event-time",direction:"ASC"}};return u.html`
      <${g.DataGridController.DataGridController.litTagName} .data=${e}></${g.DataGridController.DataGridController.litTagName}>
    `}#Be(){return this.#Pe.map((e=>({cells:[{columnId:"event-main-frame-id",value:e.mainFrameId},{columnId:"event-time",value:e.accessTime,renderer:this.#Me.bind(this)},{columnId:"event-type",value:e.type},{columnId:"event-owner-origin",value:e.ownerOrigin},{columnId:"event-params",value:JSON.stringify(e.params)}]})))}#Me(e){const t=new Date(1e3*e);return u.html`${t.toLocaleString()}`}}customElements.define("devtools-shared-storage-access-grid",dt);var ht=Object.freeze({__proto__:null,i18nString:ct,SharedStorageAccessGrid:dt});const ut=new CSSStyleSheet;ut.replaceSync(".text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}devtools-icon{vertical-align:text-bottom;margin-left:2px;width:16px;height:16px}devtools-button{vertical-align:sub}\n/*# sourceURL=sharedStorageMetadataView.css */\n");const mt={origin:"Origin",topLevelSite:"Top-level site",opaque:"(opaque)",isOpaque:"Is opaque",isThirdParty:"Is third-party",yes:"Yes",no:"No",yesBecauseTopLevelIsOpaque:"Yes, because the top-level site is opaque",yesBecauseKeyIsOpaque:"Yes, because the storage key is opaque",yesBecauseOriginNotInTopLevelSite:"Yes, because the origin is outside of the top-level site",yesBecauseAncestorChainHasCrossSite:"Yes, because the ancestry chain contains a third-party origin",loading:"Loading…",bucketName:"Bucket name",defaultBucket:"Default bucket",persistent:"Is persistent",durability:"Durability",quota:"Quota",expiration:"Expiration",none:"None",deleteBucket:"Delete bucket",confirmBucketDeletion:'Delete the "{PH1}" bucket?'},gt=t.i18n.registerUIStrings("panels/application/components/StorageMetadataView.ts",mt),pt=t.i18n.getLocalizedString.bind(void 0,gt),bt=l.RenderCoordinator.RenderCoordinator.instance();class wt extends s.LegacyWrapper.WrappableComponent{static litTagName=u.literal`devtools-storage-metadata-view`;#e=this.attachShadow({mode:"open"});#Ge;#Ke=null;#Je=null;getShadow(){return this.#e}setStorageKey(e){this.#Ke=a.StorageKeyManager.parseStorageKey(e),this.render()}setStorageBucket(e){this.#Je=e,this.setStorageKey(e.bucket.storageKey)}enableStorageBucketControls(e){this.#Ge=e,this.#Ke&&this.render()}render(){return bt.write("StorageMetadataView render",(async()=>{u.render(u.html`
        <${c.ReportView.Report.litTagName} .data=${{reportTitle:this.getTitle()??pt(mt.loading)}}>
          ${await this.renderReportContent()}
        </${c.ReportView.Report.litTagName}>`,this.#e,{host:this})}))}getTitle(){if(!this.#Ke)return;const e=this.#Ke.origin,t=this.#Je?.bucket.name||pt(mt.defaultBucket);return this.#Ge?`${t} - ${e}`:e}key(e){return u.html`<${c.ReportView.ReportKey.litTagName}>${e}</${c.ReportView.ReportKey.litTagName}>`}value(e){return u.html`<${c.ReportView.ReportValue.litTagName}>${e}</${c.ReportView.ReportValue.litTagName}>`}async renderReportContent(){if(!this.#Ke)return u.nothing;const e=this.#Ke.origin,t=Boolean(this.#Ke.components.get("3")),a=Boolean(this.#Ke.components.get("1")),r=Boolean(this.#Ke.components.get("4")),o=this.#Ke.components.get("0"),i=t?pt(mt.yesBecauseAncestorChainHasCrossSite):a?pt(mt.yesBecauseKeyIsOpaque):r?pt(mt.yesBecauseTopLevelIsOpaque):o&&e!==o?pt(mt.yesBecauseOriginNotInTopLevelSite):null;return u.html`
        ${this.key(pt(mt.origin))}
        ${this.value(u.html`<div class="text-ellipsis" title=${e}>${e}</div>`)}
        ${o||r?this.key(pt(mt.topLevelSite)):u.nothing}
        ${o?this.value(o):u.nothing}
        ${r?this.value(pt(mt.opaque)):u.nothing}
        ${i?u.html`${this.key(pt(mt.isThirdParty))}${this.value(i)}`:u.nothing}
        ${a||r?this.key(pt(mt.isOpaque)):u.nothing}
        ${a?this.value(pt(mt.yes)):u.nothing}
        ${r?this.value(pt(mt.yesBecauseTopLevelIsOpaque)):u.nothing}
        ${this.#Je?this.#Xe():u.nothing}
        ${this.#Ge?this.#Ye():u.nothing}`}#Xe(){if(!this.#Je)throw new Error("Should not call #renderStorageBucketInfo if #bucket is null.");const{bucket:{name:e},persistent:t,durability:a,quota:r}=this.#Je;return u.html`
      ${this.key(pt(mt.bucketName))}
      ${this.value(e||"default")}
      ${this.key(pt(mt.persistent))}
      ${this.value(pt(t?mt.yes:mt.no))}
      ${this.key(pt(mt.durability))}
      ${this.value(a)}
      ${this.key(pt(mt.quota))}
      ${this.value(p.NumberUtilities.bytesToString(r))}
      ${this.key(pt(mt.expiration))}
      ${this.value(this.#Qe())}`}#Qe(){if(!this.#Je)throw new Error("Should not call #getExpirationString if #bucket is null.");const{expiration:e}=this.#Je;return 0===e?pt(mt.none):new Date(1e3*e).toLocaleString()}#Ye(){return u.html`
      <${c.ReportView.ReportSection.litTagName}>
        <${r.Button.Button.litTagName}
          aria-label=${pt(mt.deleteBucket)}
          .variant=${"primary"}
          @click=${this.#Ze}>
          ${pt(mt.deleteBucket)}
        </${r.Button.Button.litTagName}>
      </${c.ReportView.ReportSection.litTagName}>`}async#Ze(){if(!this.#Ge||!this.#Je)throw new Error("Should not call #deleteBucket if #storageBucketsModel or #storageBucket is null.");await R.UIUtils.ConfirmDialog.show(pt(mt.confirmBucketDeletion,{PH1:this.#Je.bucket.name||""}),this,{jslogContext:"delete-bucket-confirmation"})&&this.#Ge.deleteBucket(this.#Je.bucket)}}customElements.define("devtools-storage-metadata-view",wt);var ft=Object.freeze({__proto__:null,StorageMetadataView:wt});const vt={sharedStorage:"Shared storage",creation:"Creation Time",notYetCreated:"Not yet created",numEntries:"Number of Entries",entropyBudget:"Entropy Budget for Fenced Frames",budgetExplanation:"Remaining data leakage allowed within a 24-hour period for this origin in bits of entropy",resetBudget:"Reset Budget",numBytesUsed:"Number of Bytes Used"},kt=t.i18n.registerUIStrings("panels/application/components/SharedStorageMetadataView.ts",vt),yt=t.i18n.getLocalizedString.bind(void 0,kt);class St extends wt{static litTagName=u.literal`devtools-shared-storage-metadata-view`;#et;#tt=null;#at=0;#rt=0;#ot=0;constructor(e,t){super(),this.#et=e,this.classList.add("overflow-auto"),this.setStorageKey(t)}async#it(){await this.#et.resetBudget(),await this.render()}connectedCallback(){this.getShadow().adoptedStyleSheets=[ut]}getTitle(){return yt(vt.sharedStorage)}async renderReportContent(){const e=await this.#et.getMetadata();return this.#tt=e?.creationTime??null,this.#at=e?.length??0,this.#rt=e?.bytesUsed??0,this.#ot=e?.remainingBudget??0,u.html`
      ${await super.renderReportContent()}
      ${this.key(yt(vt.creation))}
      ${this.value(this.#nt())}
      ${this.key(yt(vt.numEntries))}
      ${this.value(String(this.#at))}
      ${this.key(yt(vt.numBytesUsed))}
      ${this.value(String(this.#rt))}
      ${this.key(u.html`${yt(vt.entropyBudget)}<${n.Icon.Icon.litTagName} name="info" title=${yt(vt.budgetExplanation)}></${n.Icon.Icon.litTagName}>`)}
      ${this.value(u.html`${this.#ot}${this.#st()}`)}`}#nt(){if(!this.#tt)return u.html`${yt(vt.notYetCreated)}`;const e=new Date(1e3*this.#tt);return u.html`${e.toLocaleString()}`}#st(){return u.html`
      <${r.Button.Button.litTagName} .iconName=${"undo"}
                                           .jslogContext=${"reset-entropy-budget"}
                                           .size=${"SMALL"}
                                           .title=${yt(vt.resetBudget)}
                                           .variant=${"icon"}
                                           @click=${this.#it.bind(this)}></${r.Button.Button.litTagName}>
    `}}customElements.define("devtools-shared-storage-metadata-view",St);var Tt=Object.freeze({__proto__:null,SharedStorageMetadataView:St});const Rt=new CSSStyleSheet;Rt.replaceSync(":host{padding:20px}.heading{font-size:15px}devtools-data-grid-controller{border:1px solid var(--sys-color-divider);margin-top:20px;& devtools-button{width:14px;height:14px}}devtools-icon{width:14px;height:14px}.no-tt-message{margin-top:20px}\n/*# sourceURL=trustTokensView.css */\n");const $t={issuer:"Issuer",storedTokenCount:"Stored token count",allStoredTrustTokensAvailableIn:"All stored private state tokens available in this browser instance.",noTrustTokensStored:"No private state tokens are currently stored.",deleteTrustTokens:"Delete all stored private state tokens issued by {PH1}.",trustTokens:"Private state tokens"},xt=t.i18n.registerUIStrings("panels/application/components/TrustTokensView.ts",$t),Nt=t.i18n.getLocalizedString.bind(void 0,xt),Ct=l.RenderCoordinator.RenderCoordinator.instance();class It extends s.LegacyWrapper.WrappableComponent{static litTagName=u.literal`devtools-trust-tokens-storage-view`;#e=this.attachShadow({mode:"open"});#lt(e){const t=a.TargetManager.TargetManager.instance().primaryPageTarget();t?.storageAgent().invoke_clearTrustTokens({issuerOrigin:e})}connectedCallback(){this.wrapper?.contentElement.classList.add("vbox"),this.#e.adoptedStyleSheets=[Rt],this.render()}async render(){const e=a.TargetManager.TargetManager.instance().primaryPageTarget();if(!e)return;const{tokens:t}=await e.storageAgent().invoke_getTrustTokens();await Ct.write("Render TrustTokensView",(()=>{u.render(u.html`
        <div>
          <span class="heading">${Nt($t.trustTokens)}</span>
          <${n.Icon.Icon.litTagName} name="info" title=${Nt($t.allStoredTrustTokensAvailableIn)}></${n.Icon.Icon.litTagName}>
          ${this.#De(t)}
        </div>
      `,this.#e,{host:this}),this.isConnected&&setTimeout((()=>this.render()),1e3)}))}#De(e){if(0===e.length)return u.html`<div class="no-tt-message">${Nt($t.noTrustTokensStored)}</div>`;const t={columns:[{id:"issuer",title:Nt($t.issuer),widthWeighting:10,hideable:!1,visible:!0,sortable:!0},{id:"count",title:Nt($t.storedTokenCount),widthWeighting:5,hideable:!1,visible:!0,sortable:!0},{id:"delete-button",title:"",widthWeighting:1,hideable:!1,visible:!0,sortable:!1}],rows:this.#ct(e),initialSort:{columnId:"issuer",direction:"ASC"}};return u.html`
      <${g.DataGridController.DataGridController.litTagName} .data=${t}></${g.DataGridController.DataGridController.litTagName}>
    `}#ct(e){return e.filter((e=>e.count>0)).map((e=>({cells:[{columnId:"delete-button",value:Pt(e.issuerOrigin),renderer:this.#dt.bind(this)},{columnId:"issuer",value:Pt(e.issuerOrigin)},{columnId:"count",value:e.count}]})))}#dt(e){return u.html`
      <${r.Button.Button.litTagName} .iconName=${"bin"}
                                           .jslogContext=${"delete-all"}
                                           .size=${"SMALL"}
                                           .title=${Nt($t.deleteTrustTokens,{PH1:e})}
                                           .variant=${"icon"}
                                           @click=${this.#lt.bind(this,e)}></${r.Button.Button.litTagName}>
    `}}function Pt(e){return e.replace(/\/$/,"")}customElements.define("devtools-trust-tokens-storage-view",It);var Dt=Object.freeze({__proto__:null,i18nString:Nt,TrustTokensView:It});export{F as BackForwardCacheView,W as BounceTrackingMitigationsView,J as EndpointsGrid,Me as FrameDetailsView,He as InterestGroupAccessGrid,he as OriginTrialTreeView,_e as ProtocolHandlersView,et as ReportsGrid,it as ServiceWorkerRouterView,ht as SharedStorageAccessGrid,Tt as SharedStorageMetadataView,Ne as StackTrace,ft as StorageMetadataView,Dt as TrustTokensView};
