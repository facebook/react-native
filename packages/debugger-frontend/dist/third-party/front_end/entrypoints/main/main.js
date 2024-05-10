import*as e from"../../core/sdk/sdk.js";import*as t from"../../core/common/common.js";import*as n from"../../core/host/host.js";import*as o from"../../core/i18n/i18n.js";import*as s from"../../core/platform/platform.js";import*as r from"../../core/protocol_client/protocol_client.js";import*as i from"../../core/root/root.js";import*as a from"../../models/autofill_manager/autofill_manager.js";import*as c from"../../models/bindings/bindings.js";import*as l from"../../models/breakpoints/breakpoints.js";import*as d from"../../models/extensions/extensions.js";import*as g from"../../models/issues_manager/issues_manager.js";import*as p from"../../models/logs/logs.js";import*as m from"../../models/persistence/persistence.js";import*as u from"../../models/workspace/workspace.js";import*as h from"../../panels/snippets/snippets.js";import*as f from"../../panels/timeline/timeline.js";import*as w from"../../ui/components/icon_button/icon_button.js";import*as x from"../../ui/legacy/components/perf_ui/perf_ui.js";import*as v from"../../ui/legacy/components/utils/utils.js";import*as S from"../../ui/legacy/legacy.js";import*as b from"../../ui/legacy/theme_support/theme_support.js";import*as I from"../../core/rn_experiments/rn_experiments.js";import*as M from"../../ui/visual_logging/visual_logging.js";class C{#e;#t;#n;#o;constructor(t,n){n.addFlavorChangeListener(e.RuntimeModel.ExecutionContext,this.#s,this),n.addFlavorChangeListener(e.Target.Target,this.#r,this),t.addModelListener(e.RuntimeModel.RuntimeModel,e.RuntimeModel.Events.ExecutionContextCreated,this.#i,this),t.addModelListener(e.RuntimeModel.RuntimeModel,e.RuntimeModel.Events.ExecutionContextDestroyed,this.#a,this),t.addModelListener(e.RuntimeModel.RuntimeModel,e.RuntimeModel.Events.ExecutionContextOrderChanged,this.#c,this),this.#e=t,this.#t=n,t.observeModels(e.RuntimeModel.RuntimeModel,this)}modelAdded(t){queueMicrotask(function(){this.#t.flavor(e.Target.Target)||this.#t.setFlavor(e.Target.Target,t.target())}.bind(this))}modelRemoved(t){const n=this.#t.flavor(e.RuntimeModel.ExecutionContext);n&&n.runtimeModel===t&&this.#l();const o=this.#e.models(e.RuntimeModel.RuntimeModel);this.#t.flavor(e.Target.Target)===t.target()&&o.length&&this.#t.setFlavor(e.Target.Target,o[0].target())}#s({data:t}){t&&(this.#t.setFlavor(e.Target.Target,t.target()),this.#o||(this.#n=this.#d(t)))}#d(e){return e.isDefault?e.target().name()+":"+e.frameId:""}#r({data:t}){const n=this.#t.flavor(e.RuntimeModel.ExecutionContext);if(!t||n&&n.target()===t)return;const o=t.model(e.RuntimeModel.RuntimeModel),s=o?o.executionContexts():[];if(!s.length)return;let r=null;for(let e=0;e<s.length&&!r;++e)this.#g(s[e])&&(r=s[e]);for(let e=0;e<s.length&&!r;++e)this.#p(s[e])&&(r=s[e]);this.#o=!0,this.#t.setFlavor(e.RuntimeModel.ExecutionContext,r||s[0]),this.#o=!1}#g(e){return!e.target().targetInfo()?.subtype&&(!(!this.#n||this.#n!==this.#d(e))||!this.#n&&this.#p(e))}#p(t){if(!t.isDefault||!t.frameId)return!1;if(t.target().parentTarget()?.type()===e.Target.Type.Frame)return!1;const n=t.target().model(e.ResourceTreeModel.ResourceTreeModel),o=n&&n.frameForId(t.frameId);return Boolean(o?.isOutermostFrame())}#i(e){this.#m(e.data)}#a(t){const n=t.data;this.#t.flavor(e.RuntimeModel.ExecutionContext)===n&&this.#l()}#c(e){const t=e.data.executionContexts();for(let e=0;e<t.length&&!this.#m(t[e]);e++);}#m(t){return!(this.#t.flavor(e.RuntimeModel.ExecutionContext)&&!this.#g(t))&&(this.#o=!0,this.#t.setFlavor(e.RuntimeModel.ExecutionContext,t),this.#o=!1,!0)}#l(){const t=this.#e.models(e.RuntimeModel.RuntimeModel);let n=null;for(let e=0;e<t.length&&!n;++e){const o=t[e].executionContexts();for(const e of o)if(this.#p(e)){n=e;break}}if(!n)for(let e=0;e<t.length&&!n;++e){const o=t[e].executionContexts();if(o.length){n=o[0];break}}this.#o=!0,this.#t.setFlavor(e.RuntimeModel.ExecutionContext,n),this.#o=!1}}var k=Object.freeze({__proto__:null,ExecutionContextSelector:C});class T{constructor(){this.#u()}#u(){let e;try{e=t.Settings.moduleSetting("console-insights-enabled")}catch{return}e.addChangeListener((()=>{e.get()&&t.Settings.Settings.instance().createLocalSetting("console-insights-onboarding-finished",!1).set(!1)}))}}var R=Object.freeze({__proto__:null,SettingTracker:T});const y={customizeAndControlDevtools:"Customize and control DevTools",dockSide:"Dock side",placementOfDevtoolsRelativeToThe:"Placement of DevTools relative to the page. ({PH1} to restore last position)",undockIntoSeparateWindow:"Undock into separate window",dockToBottom:"Dock to bottom",dockToRight:"Dock to right",dockToLeft:"Dock to left",focusDebuggee:"Focus page",hideConsoleDrawer:"Hide console drawer",showConsoleDrawer:"Show console drawer",moreTools:"More tools",help:"Help",dockSideNaviation:"Use left and right arrow keys to navigate the options"},E=o.i18n.registerUIStrings("entrypoints/main/MainImpl.ts",y),D=o.i18n.getLocalizedString.bind(void 0,E);class F{#h;#f;#w;constructor(){F.instanceForTest=this,this.#f=new Promise((e=>{this.#w=e})),this.#x()}static time(e){n.InspectorFrontendHost.isUnderTest()||console.time(e)}static timeEnd(e){n.InspectorFrontendHost.isUnderTest()||console.timeEnd(e)}async#x(){console.timeStamp("Main._loaded"),i.Runtime.Runtime.setPlatform(n.Platform.platform());const e=await new Promise((e=>{n.InspectorFrontendHost.InspectorFrontendHostInstance.getPreferences(e)}));console.timeStamp("Main._gotPreferences"),this.#v(),this.createSettings(e),await this.requestAndRegisterLocaleData(),n.userMetrics.syncSetting(t.Settings.Settings.instance().moduleSetting("sync-preferences").get()),i.Runtime.Runtime.queryParam("veLogging")&&M.startLogging(),this.#S()}#v(){self.Extensions||={},self.Host||={},self.Host.userMetrics||=n.userMetrics,self.Host.UserMetrics||=n.UserMetrics,self.ProtocolClient||={},self.ProtocolClient.test||=r.InspectorBackend.test}async requestAndRegisterLocaleData(){const e=t.Settings.Settings.instance().moduleSetting("language").get(),s=o.DevToolsLocale.DevToolsLocale.instance({create:!0,data:{navigatorLanguage:navigator.language,settingLanguage:e,lookupClosestDevToolsLocale:o.i18n.lookupClosestSupportedDevToolsLocale}});n.userMetrics.language(s.locale),"en-US"!==s.locale&&await o.i18n.fetchAndRegisterLocaleData("en-US");try{await o.i18n.fetchAndRegisterLocaleData(s.locale)}catch(e){console.warn(`Unable to fetch & register locale data for '${s.locale}', falling back to 'en-US'. Cause: `,e),s.forceFallbackLocale()}}createSettings(e){this.#b();let o,s="";if(n.Platform.isCustomDevtoolsFrontend()?s="__custom__":i.Runtime.Runtime.queryParam("can_dock")||!Boolean(i.Runtime.Runtime.queryParam("debugFrontend"))||n.InspectorFrontendHost.isUnderTest()||(s="__bundled__"),!n.InspectorFrontendHost.isUnderTest()&&window.localStorage){const e={...t.Settings.NOOP_STORAGE,clear:()=>window.localStorage.clear()};o=new t.Settings.SettingsStorage(window.localStorage,e,s)}else o=new t.Settings.SettingsStorage({},t.Settings.NOOP_STORAGE,s);const r={register:e=>n.InspectorFrontendHost.InspectorFrontendHostInstance.registerPreference(e,{synced:!1}),set:n.InspectorFrontendHost.InspectorFrontendHostInstance.setPreference,get:e=>new Promise((t=>{n.InspectorFrontendHost.InspectorFrontendHostInstance.getPreference(e,t)})),remove:n.InspectorFrontendHost.InspectorFrontendHostInstance.removePreference,clear:n.InspectorFrontendHost.InspectorFrontendHostInstance.clearPreferences},a={...r,register:e=>n.InspectorFrontendHost.InspectorFrontendHostInstance.registerPreference(e,{synced:!0})},c=new t.Settings.SettingsStorage(e,a,s),l=new t.Settings.SettingsStorage(e,r,s);t.Settings.Settings.instance({forceNew:!0,syncedStorage:c,globalStorage:l,localStorage:o}),new T,n.InspectorFrontendHost.isUnderTest()||(new t.Settings.VersionController).updateVersion()}#b(){i.Runtime.experiments.register("apply-custom-stylesheet","Allow extensions to load custom stylesheets"),i.Runtime.experiments.register("capture-node-creation-stacks","Capture node creation stacks"),i.Runtime.experiments.register("ignore-list-js-frames-on-timeline","Ignore List for JavaScript frames on Timeline",!0),i.Runtime.experiments.register("live-heap-profile","Live heap profile",!0),i.Runtime.experiments.register("protocol-monitor","Protocol Monitor",void 0,"https://developer.chrome.com/blog/new-in-devtools-92/#protocol-monitor"),i.Runtime.experiments.register("sampling-heap-profiler-timeline","Sampling heap profiler timeline",!0),i.Runtime.experiments.register("show-option-tp-expose-internals-in-heap-snapshot","Show option to expose internals in heap snapshots"),i.Runtime.experiments.register("heap-snapshot-treat-backing-store-as-containing-object","In heap snapshots, treat backing store size as part of the containing object"),i.Runtime.experiments.register("timeline-invalidation-tracking","Timeline: invalidation tracking",!0),i.Runtime.experiments.register("timeline-show-all-events","Timeline: show all events",!0),i.Runtime.experiments.register("timeline-v8-runtime-call-stats","Timeline: V8 Runtime Call Stats on Timeline",!0),i.Runtime.experiments.register("timeline-as-console-profile-result-panel","View console.profile() results in the Performance panel for Node.js",!0),i.Runtime.experiments.register("js-profiler-temporarily-enable","Enable JavaScript Profiler temporarily",!1,"https://goo.gle/js-profiler-deprecation","https://crbug.com/1354548"),i.Runtime.experiments.register("sources-frame-indentation-markers-temporarily-disable","Disable Indentation Markers temporarily",!1,"https://developer.chrome.com/blog/new-in-devtools-121/#indentation","https://crbug.com/1479986"),i.Runtime.experiments.register("evaluate-expressions-with-source-maps","Resolve variable names in expressions using source maps",void 0,"https://goo.gle/evaluate-source-var-default","https://crbug.com/1504123"),i.Runtime.experiments.register("instrumentation-breakpoints","Enable instrumentation breakpoints",!0),i.Runtime.experiments.register("set-all-breakpoints-eagerly","Set all breakpoints eagerly at startup"),i.Runtime.experiments.register("use-source-map-scopes","Use scope information from source maps",!0),i.Runtime.experiments.register("apca","Enable new Advanced Perceptual Contrast Algorithm (APCA) replacing previous contrast ratio and AA/AAA guidelines",void 0,"https://developer.chrome.com/blog/new-in-devtools-89/#apca"),i.Runtime.experiments.register("full-accessibility-tree","Enable full accessibility tree view in the Elements panel",void 0,"https://developer.chrome.com/blog/new-in-devtools-90/#accesibility-tree","https://g.co/devtools/a11y-tree-feedback"),i.Runtime.experiments.register("font-editor","Enable new Font Editor tool within the Styles tab.",void 0,"https://developer.chrome.com/blog/new-in-devtools-89/#font"),i.Runtime.experiments.register("contrast-issues","Enable automatic contrast issue reporting via the Issues panel",void 0,"https://developer.chrome.com/blog/new-in-devtools-90/#low-contrast"),i.Runtime.experiments.register("experimental-cookie-features","Enable experimental cookie features"),i.Runtime.experiments.register("css-type-component-length-deprecate","Deprecate CSS <length> authoring tool in the Styles tab",void 0,"https://goo.gle/devtools-deprecate-length-tools","https://crbug.com/1522657"),i.Runtime.experiments.register("styles-pane-css-changes","Sync CSS changes in the Styles pane"),i.Runtime.experiments.register("highlight-errors-elements-panel","Highlights a violating node or attribute in the Elements panel DOM tree"),i.Runtime.experiments.register("authored-deployed-grouping","Group sources into Authored and Deployed trees",void 0,"https://goo.gle/authored-deployed","https://goo.gle/authored-deployed-feedback"),i.Runtime.experiments.register("just-my-code","Hide ignore-listed code in sources tree view"),i.Runtime.experiments.register("important-dom-properties","Highlight important DOM properties in the Object Properties viewer"),i.Runtime.experiments.register("preloading-status-panel","Enable Speculative Loads Panel in Application panel",!0),i.Runtime.experiments.register("outermost-target-selector","Enable background page selector (e.g. for prerendering debugging)",!1),i.Runtime.experiments.register("self-xss-warning","Show warning about Self-XSS when pasting code"),i.Runtime.experiments.register("storage-buckets-tree","Enable Storage Buckets Tree in Application panel",!0),i.Runtime.experiments.register("network-panel-filter-bar-redesign","Redesign of the filter bar in the Network Panel",!1,"https://goo.gle/devtools-network-filter-redesign","https://crbug.com/1500573"),i.Runtime.experiments.register("track-context-menu","Enable context menu that allows to modify trees in the Flame Chart",!0),i.Runtime.experiments.register("autofill-view","Enable Autofill view"),I.RNExperimentsImpl.Instance.copyInto(i.Runtime.experiments,"[React Native] "),i.Runtime.experiments.enableExperimentsByDefault(["css-type-component-length-deprecate","set-all-breakpoints-eagerly","timeline-as-console-profile-result-panel","outermost-target-selector","self-xss-warning","preloading-status-panel","evaluate-expressions-with-source-maps",...i.Runtime.Runtime.queryParam("isChromeForTesting")?["protocol-monitor"]:[]]),i.Runtime.experiments.cleanUpStaleExperiments();const e=i.Runtime.Runtime.queryParam("enabledExperiments");if(e&&i.Runtime.experiments.setServerEnabledExperiments(e.split(";")),i.Runtime.experiments.enableExperimentsTransiently([]),n.InspectorFrontendHost.isUnderTest()){const e=i.Runtime.Runtime.queryParam("test");e&&e.includes("live-line-level-heap-profile.js")&&i.Runtime.experiments.enableForTest("live-heap-profile")}for(const e of i.Runtime.experiments.allConfigurableExperiments())e.isEnabled()?n.userMetrics.experimentEnabledAtLaunch(e.name):n.userMetrics.experimentDisabledAtLaunch(e.name)}async#S(){F.time("Main._createAppUI"),m.IsolatedFileSystemManager.IsolatedFileSystemManager.instance();const o=t.Settings.Settings.instance().createSetting("ui-theme","systemPreferred");S.UIUtils.initializeUIUtils(document),b.ThemeSupport.hasInstance()||b.ThemeSupport.instance({forceNew:!0,setting:o}),b.ThemeSupport.instance().applyTheme(document);const s=()=>{b.ThemeSupport.instance().applyTheme(document)},r=window.matchMedia("(prefers-color-scheme: dark)"),f=window.matchMedia("(forced-colors: active)");r.addEventListener("change",s),f.addEventListener("change",s),o.addChangeListener(s),n.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(n.InspectorFrontendHostAPI.Events.ColorThemeChanged,(async()=>{await b.ThemeSupport.fetchColors(document)}),this),S.UIUtils.installComponentRootStyles(document.body),this.#I(document);const w=Boolean(i.Runtime.Runtime.queryParam("can_dock"));S.ZoomManager.ZoomManager.instance({forceNew:!0,win:window,frontendHost:n.InspectorFrontendHost.InspectorFrontendHostInstance}),S.ContextMenu.ContextMenu.initialize(),S.ContextMenu.ContextMenu.installHandler(document),p.NetworkLog.NetworkLog.instance(),e.FrameManager.FrameManager.instance(),p.LogManager.LogManager.instance(),g.IssuesManager.IssuesManager.instance({forceNew:!0,ensureFirst:!0,showThirdPartyIssuesSetting:g.Issue.getShowThirdPartyIssuesSetting(),hideIssueSetting:g.IssuesManager.getHideIssueByCodeSetting()}),g.ContrastCheckTrigger.ContrastCheckTrigger.instance(),S.DockController.DockController.instance({forceNew:!0,canDock:w}),e.NetworkManager.MultitargetNetworkManager.instance({forceNew:!0}),e.DOMDebuggerModel.DOMDebuggerManager.instance({forceNew:!0}),e.TargetManager.TargetManager.instance().addEventListener("SuspendStateChanged",this.#M.bind(this)),u.FileManager.FileManager.instance({forceNew:!0}),u.Workspace.WorkspaceImpl.instance(),c.NetworkProject.NetworkProjectManager.instance();const x=new c.ResourceMapping.ResourceMapping(e.TargetManager.TargetManager.instance(),u.Workspace.WorkspaceImpl.instance());new c.PresentationConsoleMessageHelper.PresentationConsoleMessageManager,c.CSSWorkspaceBinding.CSSWorkspaceBinding.instance({forceNew:!0,resourceMapping:x,targetManager:e.TargetManager.TargetManager.instance()}),c.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance({forceNew:!0,resourceMapping:x,targetManager:e.TargetManager.TargetManager.instance()}),e.TargetManager.TargetManager.instance().setScopeTarget(e.TargetManager.TargetManager.instance().primaryPageTarget()),S.Context.Context.instance().addFlavorChangeListener(e.Target.Target,(({data:t})=>{const n=t?.outermostTarget();e.TargetManager.TargetManager.instance().setScopeTarget(n)})),l.BreakpointManager.BreakpointManager.instance({forceNew:!0,workspace:u.Workspace.WorkspaceImpl.instance(),targetManager:e.TargetManager.TargetManager.instance(),debuggerWorkspaceBinding:c.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance()}),self.Extensions.extensionServer=d.ExtensionServer.ExtensionServer.instance({forceNew:!0}),new m.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding(m.IsolatedFileSystemManager.IsolatedFileSystemManager.instance(),u.Workspace.WorkspaceImpl.instance()),m.IsolatedFileSystemManager.IsolatedFileSystemManager.instance().addPlatformFileSystem("snippet://",new h.ScriptSnippetFileSystem.SnippetFileSystem),m.Persistence.PersistenceImpl.instance({forceNew:!0,workspace:u.Workspace.WorkspaceImpl.instance(),breakpointManager:l.BreakpointManager.BreakpointManager.instance()}),m.NetworkPersistenceManager.NetworkPersistenceManager.instance({forceNew:!0,workspace:u.Workspace.WorkspaceImpl.instance()}),new C(e.TargetManager.TargetManager.instance(),S.Context.Context.instance()),c.IgnoreListManager.IgnoreListManager.instance({forceNew:!0,debuggerWorkspaceBinding:c.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance()}),a.AutofillManager.AutofillManager.instance(),new _;const v=S.ActionRegistry.ActionRegistry.instance({forceNew:!0});S.ShortcutRegistry.ShortcutRegistry.instance({forceNew:!0,actionRegistry:v}),this.#C(),F.timeEnd("Main._createAppUI");const I=t.AppProvider.getRegisteredAppProviders()[0];if(!I)throw new Error("Unable to boot DevTools, as the appprovider is missing");await this.#k(await I.loadAppProvider())}async#k(e){F.time("Main._showAppUI");const t=e.createApp();if(S.DockController.DockController.instance().initialize(),await b.ThemeSupport.fetchColors(document),t.presentUI(document),S.ActionRegistry.ActionRegistry.instance().hasAction("elements.toggle-element-search")){const e=S.ActionRegistry.ActionRegistry.instance().getAction("elements.toggle-element-search");n.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(n.InspectorFrontendHostAPI.Events.EnterInspectElementMode,(()=>{e.execute()}),this)}n.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(n.InspectorFrontendHostAPI.Events.RevealSourceLine,this.#T,this),await S.InspectorView.InspectorView.instance().createToolbars(),n.InspectorFrontendHost.InspectorFrontendHostInstance.loadCompleted();const o=i.Runtime.Runtime.queryParam("loadTimelineFromURL");null!==o&&f.TimelinePanel.LoadTimelineHandler.instance().handleQueryParam(o),S.ARIAUtils.alertElementInstance(),S.DockController.DockController.instance().announceDockLocation(),window.setTimeout(this.#R.bind(this),0),F.timeEnd("Main._showAppUI")}async#R(){F.time("Main._initializeTarget");for(const e of t.Runnable.earlyInitializationRunnables())await e().run();n.InspectorFrontendHost.InspectorFrontendHostInstance.readyForTest(),this.#w(),window.setTimeout(this.#y.bind(this),100),F.timeEnd("Main._initializeTarget")}#y(){F.time("Main._lateInitialization"),d.ExtensionServer.ExtensionServer.instance().initializeExtensions();const e=t.Runnable.lateInitializationRunnables().map((async e=>(await e()).run()));if(i.Runtime.experiments.isEnabled("live-heap-profile")){const n="memory-live-heap-profile";if(t.Settings.Settings.instance().moduleSetting(n).get())e.push(x.LiveHeapProfile.LiveHeapProfile.instance().run());else{const e=async o=>{o.data&&(t.Settings.Settings.instance().moduleSetting(n).removeChangeListener(e),x.LiveHeapProfile.LiveHeapProfile.instance().run())};t.Settings.Settings.instance().moduleSetting(n).addChangeListener(e)}}this.#h=Promise.all(e).then((()=>{})),F.timeEnd("Main._lateInitialization")}lateInitDonePromiseForTest(){return this.#h}readyForTest(){return this.#f}#C(){t.Console.Console.instance().addEventListener("messageAdded",(function({data:e}){e.show&&t.Console.Console.instance().show()}))}#T(e){const{url:n,lineNumber:o,columnNumber:s}=e.data,r=u.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(n);r?t.Revealer.reveal(r.uiLocation(o,s)):u.Workspace.WorkspaceImpl.instance().addEventListener(u.Workspace.Events.UISourceCodeAdded,(function e(r){const i=r.data;i.url()===n&&(t.Revealer.reveal(i.uiLocation(o,s)),u.Workspace.WorkspaceImpl.instance().removeEventListener(u.Workspace.Events.UISourceCodeAdded,e))}))}#E(e){e.handled||S.ShortcutRegistry.ShortcutRegistry.instance().handleShortcut(e)}#D(e){const t=new CustomEvent("clipboard-"+e.type,{bubbles:!0});t.original=e;const n=e.target&&e.target.ownerDocument,o=n?s.DOMUtilities.deepActiveElement(n):null;o&&o.dispatchEvent(t),t.handled&&e.preventDefault()}#F(e){(e.handled||e.target.classList.contains("popup-glasspane"))&&e.preventDefault()}#I(e){e.addEventListener("keydown",this.#E.bind(this),!1),e.addEventListener("beforecopy",this.#D.bind(this),!0),e.addEventListener("copy",this.#D.bind(this),!1),e.addEventListener("cut",this.#D.bind(this),!1),e.addEventListener("paste",this.#D.bind(this),!1),e.addEventListener("contextmenu",this.#F.bind(this),!0)}#M(){const t=e.TargetManager.TargetManager.instance().allTargetsSuspended();S.InspectorView.InspectorView.instance().onSuspendStateChanged(t)}static instanceForTest=null}globalThis.Main=globalThis.Main||{},globalThis.Main.Main=F;let L,P;class A{#L;constructor(){this.#L=new S.Toolbar.ToolbarMenuButton(this.#P.bind(this),!0,"main-menu"),this.#L.element.classList.add("main-menu"),this.#L.setTitle(D(y.customizeAndControlDevtools))}static instance(e={forceNew:null}){const{forceNew:t}=e;return L&&!t||(L=new A),L}item(){return this.#L}#P(t){if(S.DockController.DockController.instance().canDock()){const e=document.createElement("div");e.classList.add("flex-centered"),e.classList.add("flex-auto"),e.classList.add("location-menu"),e.tabIndex=-1,S.ARIAUtils.setLabel(e,y.dockSide+y.dockSideNaviation);const n=e.createChild("span","dockside-title");n.textContent=D(y.dockSide);const o=S.ShortcutRegistry.ShortcutRegistry.instance().shortcutsForAction("main.toggle-dock");S.Tooltip.Tooltip.install(n,D(y.placementOfDevtoolsRelativeToThe,{PH1:o[0].title()})),e.appendChild(n);const i=new S.Toolbar.Toolbar("",e);e.setAttribute("jslog",`${M.item("dock-side")}`),i.makeBlueOnHover();const a=new S.Toolbar.ToolbarToggle(D(y.undockIntoSeparateWindow),"dock-window",void 0,"undock"),c=new S.Toolbar.ToolbarToggle(D(y.dockToBottom),"dock-bottom",void 0,"dock-bottom"),l=new S.Toolbar.ToolbarToggle(D(y.dockToRight),"dock-right",void 0,"dock-right"),d=new S.Toolbar.ToolbarToggle(D(y.dockToLeft),"dock-left",void 0,"dock-left");a.addEventListener("MouseDown",(e=>e.data.consume())),c.addEventListener("MouseDown",(e=>e.data.consume())),l.addEventListener("MouseDown",(e=>e.data.consume())),d.addEventListener("MouseDown",(e=>e.data.consume())),a.addEventListener("Click",r.bind(null,"undocked")),c.addEventListener("Click",r.bind(null,"bottom")),l.addEventListener("Click",r.bind(null,"right")),d.addEventListener("Click",r.bind(null,"left")),a.setToggled("undocked"===S.DockController.DockController.instance().dockSide()),c.setToggled("bottom"===S.DockController.DockController.instance().dockSide()),l.setToggled("right"===S.DockController.DockController.instance().dockSide()),d.setToggled("left"===S.DockController.DockController.instance().dockSide()),i.appendToolbarItem(a),i.appendToolbarItem(d),i.appendToolbarItem(c),i.appendToolbarItem(l),e.addEventListener("keydown",(t=>{let n=0;if("ArrowLeft"===t.key)n=-1;else{if("ArrowRight"!==t.key){if("ArrowDown"===t.key){const t=e.closest(".soft-context-menu");return void t?.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown"}))}return}n=1}const o=[a,d,c,l];let r=o.findIndex((e=>e.element.hasFocus()));r=s.NumberUtilities.clamp(r+n,0,o.length-1),o[r].element.focus(),t.consume(!0)})),t.headerSection().appendCustomItem(e,"dock-side")}const o=this.#L.element;function r(e){S.DockController.DockController.instance().once("AfterDockSideChanged").then((()=>{o.focus()})),S.DockController.DockController.instance().setDockSide(e),t.discard()}if("undocked"===S.DockController.DockController.instance().dockSide()){const n=e.TargetManager.TargetManager.instance().primaryPageTarget();n&&n.type()===e.Target.Type.Frame&&t.defaultSection().appendAction("inspector-main.focus-debuggee",D(y.focusDebuggee))}t.defaultSection().appendAction("main.toggle-drawer",S.InspectorView.InspectorView.instance().drawerVisible()?D(y.hideConsoleDrawer):D(y.showConsoleDrawer)),t.appendItemsAtLocation("mainMenu");const i=t.defaultSection().appendSubMenuItem(D(y.moreTools),!1,"more-tools"),a=S.ViewManager.getRegisteredViewExtensions();a.sort(((e,t)=>{const n=e.title(),o=t.title();return n.localeCompare(o)}));for(const e of a){const t=e.location(),o=e.persistence(),s=e.title(),r=e.viewId();if("issues-pane"!==r){if("closeable"===o&&("drawer-view"===t||"panel"===t))if(e.isPreviewFeature()){const e=w.Icon.create("experiment");i.defaultSection().appendItem(s,(()=>{S.ViewManager.ViewManager.instance().showView(r,!0,!1)}),{disabled:!1,additionalElement:e,jslogContext:r})}else i.defaultSection().appendItem(s,(()=>{S.ViewManager.ViewManager.instance().showView(r,!0,!1)}),{jslogContext:r})}else i.defaultSection().appendItem(s,(()=>{n.userMetrics.issuesPanelOpenedFrom(3),S.ViewManager.ViewManager.instance().showView("issues-pane",!0)}),{jslogContext:r})}t.footerSection().appendSubMenuItem(D(y.help),!1,"help").appendItemsAtLocation("mainMenuHelp")}}class H{#A;constructor(){this.#A=S.Toolbar.Toolbar.createActionButtonForId("settings.show",{showLabel:!1,userActionCode:void 0})}static instance(e={forceNew:null}){const{forceNew:t}=e;return P&&!t||(P=new H),P}item(){return this.#A}}class _{constructor(){e.TargetManager.TargetManager.instance().addModelListener(e.DebuggerModel.DebuggerModel,e.DebuggerModel.Events.DebuggerPaused,this.#H,this)}#H(n){e.TargetManager.TargetManager.instance().removeModelListener(e.DebuggerModel.DebuggerModel,e.DebuggerModel.Events.DebuggerPaused,this.#H,this);const o=n.data,s=o.debuggerPausedDetails();S.Context.Context.instance().setFlavor(e.Target.Target,o.target()),t.Revealer.reveal(s)}}var N=Object.freeze({__proto__:null,MainImpl:F,ZoomActionDelegate:class{handleAction(e,t){if(n.InspectorFrontendHost.InspectorFrontendHostInstance.isHostedMode())return!1;switch(t){case"main.zoom-in":return n.InspectorFrontendHost.InspectorFrontendHostInstance.zoomIn(),!0;case"main.zoom-out":return n.InspectorFrontendHost.InspectorFrontendHostInstance.zoomOut(),!0;case"main.zoom-reset":return n.InspectorFrontendHost.InspectorFrontendHostInstance.resetZoom(),!0}return!1}},SearchActionDelegate:class{handleAction(e,t){let n=S.SearchableView.SearchableView.fromElement(s.DOMUtilities.deepActiveElement(document));if(!n){const e=S.InspectorView.InspectorView.instance().currentPanelDeprecated();if(e&&e.searchableView&&(n=e.searchableView()),!n)return!1}switch(t){case"main.search-in-panel.find":return n.handleFindShortcut();case"main.search-in-panel.cancel":return n.handleCancelSearchShortcut();case"main.search-in-panel.find-next":return n.handleFindNextShortcut();case"main.search-in-panel.find-previous":return n.handleFindPreviousShortcut()}return!1}},MainMenuItem:A,SettingsButtonProvider:H,PauseListener:_,sendOverProtocol:function(e,t){return new Promise(((n,o)=>{const s=r.InspectorBackend.test.sendRawMessage;if(!s)return o("Unable to send message to test client");s(e,t,((e,...t)=>e?o(e):n(t)))}))},ReloadActionDelegate:class{handleAction(e,t){return"main.debug-reload"===t&&(v.Reload.reload(),!0)}}});class U{presentUI(e){const t=new S.RootView.RootView;S.InspectorView.InspectorView.instance().show(t.element),t.attachToDocument(e),t.focus()}}let j;class W{static instance(e={forceNew:null}){const{forceNew:t}=e;return j&&!t||(j=new W),j}createApp(){return new U}}var B=Object.freeze({__proto__:null,SimpleApp:U,SimpleAppProvider:W});export{k as ExecutionContextSelector,N as MainImpl,R as SettingTracker,B as SimpleApp};
