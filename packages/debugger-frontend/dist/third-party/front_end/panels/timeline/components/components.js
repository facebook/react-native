import*as e from"../../../services/trace_bounds/trace_bounds.js";import*as t from"../../../core/i18n/i18n.js";import*as i from"../../../models/trace/trace.js";import*as n from"../../../ui/components/helpers/helpers.js";import*as s from"../../../ui/legacy/legacy.js";import*as r from"../../../ui/lit/lit.js";import*as o from"../../../ui/visual_logging/visual_logging.js";import"../../../ui/components/menus/menus.js";import*as a from"../../../core/common/common.js";import*as l from"../../../core/sdk/sdk.js";import*as d from"../../../ui/components/buttons/buttons.js";import*as c from"../../mobile_throttling/mobile_throttling.js";import*as h from"../../../core/platform/platform.js";import"../../../ui/components/icon_button/icon_button.js";import*as g from"../../../models/crux-manager/crux-manager.js";import*as p from"../../../ui/components/render_coordinator/render_coordinator.js";import"../../../ui/components/dialogs/dialogs.js";import*as u from"../../../ui/components/input/input.js";import*as m from"../../../models/bindings/bindings.js";import*as v from"../../../models/trace/helpers/helpers.js";import*as b from"../../../ui/legacy/components/utils/utils.js";import*as f from"../utils/utils.js";import*as y from"./insights/insights.js";import*as w from"../../../ui/legacy/theme_support/theme_support.js";import*as S from"../../../core/root/root.js";import*as x from"../../../models/emulation/emulation.js";import*as k from"../../../models/live-metrics/live-metrics.js";import*as T from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import"../../../ui/components/markdown_view/markdown_view.js";import*as C from"../../../third_party/marked/marked.js";import"../../../ui/components/request_link_icon/request_link_icon.js";import*as $ from"../../../ui/legacy/components/perf_ui/perf_ui.js";import*as P from"../../../core/host/host.js";function L(e){const t=[e];let i=e;for(;null!==i.child;){const e=i.child;null!==e&&(t.push(e),i=e)}return t}var R=Object.freeze({__proto__:null,Breadcrumbs:class{initialBreadcrumb;activeBreadcrumb;constructor(e){this.initialBreadcrumb={window:e,child:null};let t=this.initialBreadcrumb;for(;null!==t.child;)t=t.child;this.activeBreadcrumb=t}add(e){if(!this.isTraceWindowWithinTraceWindow(e,this.activeBreadcrumb.window))throw new Error("Can not add a breadcrumb that is equal to or is outside of the parent breadcrumb TimeWindow");const t={window:e,child:null};return this.activeBreadcrumb.child=t,this.setActiveBreadcrumb(t,{removeChildBreadcrumbs:!1,updateVisibleWindow:!0}),t}isTraceWindowWithinTraceWindow(e,t){return e.min>=t.min&&e.max<=t.max&&!(e.min===t.min&&e.max===t.max)}setInitialBreadcrumbFromLoadedModifications(e){this.initialBreadcrumb=e;let t=e;for(;null!==t.child;)t=t.child;this.setActiveBreadcrumb(t,{removeChildBreadcrumbs:!1,updateVisibleWindow:!0})}setActiveBreadcrumb(t,i){i.removeChildBreadcrumbs&&(t.child=null),this.activeBreadcrumb=t,e.TraceBounds.BoundsManager.instance().setMiniMapBounds(t.window),i.updateVisibleWindow&&e.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(t.window)}},flattenBreadcrumbs:L}),I={cssText:`.breadcrumbs{display:none;align-items:center;height:29px;padding:3px;overflow:scroll hidden}.breadcrumbs::-webkit-scrollbar{display:none}.breadcrumb{padding:2px 6px;border-radius:4px}.breadcrumb:hover{background-color:var(--sys-color-state-hover-on-subtle)}.range{font-size:12px;white-space:nowrap}.active-breadcrumb{font-weight:bold;color:var(--app-color-active-breadcrumb)}\n/*# sourceURL=${import.meta.resolve("./breadcrumbsUI.css")} */\n`};const M=new CSSStyleSheet;M.replaceSync(I.cssText);const{render:E,html:D}=r,H={activateBreadcrumb:"Activate breadcrumb",removeChildBreadcrumbs:"Remove child breadcrumbs"},F=t.i18n.registerUIStrings("panels/timeline/components/BreadcrumbsUI.ts",H),N=t.i18n.getLocalizedString.bind(void 0,F);class z extends Event{breadcrumb;childBreadcrumbsRemoved;static eventName="breadcrumbactivated";constructor(e,t){super(z.eventName),this.breadcrumb=e,this.childBreadcrumbsRemoved=t}}class O extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#n=null;#s=null;connectedCallback(){this.#e.adoptedStyleSheets=[M]}set data(e){this.#n=e.initialBreadcrumb,this.#s=e.activeBreadcrumb,n.ScheduledRender.scheduleRender(this,this.#t)}#r(e){this.#s=e,this.dispatchEvent(new z(e))}#o(){const e=this.#e.querySelector(".breadcrumbs");e&&(e.style.display="flex",requestAnimationFrame((()=>{e.scrollWidth-e.clientWidth>0&&requestAnimationFrame((()=>{e.scrollLeft=e.scrollWidth-e.clientWidth}))})))}#a(e,t){const i=new s.ContextMenu.ContextMenu(e);i.defaultSection().appendItem(N(H.activateBreadcrumb),(()=>{this.dispatchEvent(new z(t))})),i.defaultSection().appendItem(N(H.removeChildBreadcrumbs),(()=>{this.dispatchEvent(new z(t,!0))})),i.show()}#l(e,n){const s=i.Helpers.Timing.microToMilli(e.window.range);return D`
          <div class="breadcrumb" @contextmenu=${t=>this.#a(t,e)} @click=${()=>this.#r(e)}
          jslog=${o.item("timeline.breadcrumb-select").track({click:!0})}>
           <span class="${e===this.#s?"active-breadcrumb":""} range">
            ${0===n?`Full range (${t.TimeUtilities.preciseMillisToString(s,2)})`:`${t.TimeUtilities.preciseMillisToString(s,2)}`}
            </span>
          </div>
          ${null!==e.child?D`
            <devtools-icon .data=${{iconName:"chevron-right",color:"var(--icon-default)",width:"16px",height:"16px"}}>`:""}
      `}#i(){const e=D`
      ${null===this.#n?r.nothing:D`<div class="breadcrumbs" jslog=${o.section("breadcrumbs")}>
        ${L(this.#n).map(((e,t)=>this.#l(e,t)))}
      </div>`}
    `;E(e,this.#e,{host:this}),this.#n?.child&&this.#o()}}customElements.define("devtools-breadcrumbs-ui",O);var A=Object.freeze({__proto__:null,BreadcrumbActivatedEvent:z,BreadcrumbsUI:O}),_={cssText:`:host{display:flex;align-items:center;max-width:100%;height:20px}devtools-select-menu{min-width:160px;max-width:100%;height:20px}\n/*# sourceURL=${import.meta.resolve("./cpuThrottlingSelector.css")} */\n`};const U=new CSSStyleSheet;U.replaceSync(_.cssText);const{html:B}=r,V={cpu:"CPU: {PH1}",cpuThrottling:"CPU throttling: {PH1}",recommendedThrottling:"{PH1} – recommended",recommendedThrottlingReason:"Consider changing setting to simulate real user environments",calibrate:"Calibrate…",recalibrate:"Recalibrate…",labelCalibratedPresets:"Calibrated presets"},q=t.i18n.registerUIStrings("panels/timeline/components/CPUThrottlingSelector.ts",V),j=t.i18n.getLocalizedString.bind(void 0,q);class W extends HTMLElement{#e=this.attachShadow({mode:"open"});#d;#c=null;#h=[];#g;constructor(){super(),this.#d=l.CPUThrottlingManager.CPUThrottlingManager.instance().cpuThrottlingOption(),this.#g=a.Settings.Settings.instance().createSetting("calibrated-cpu-throttling",{},"Global"),this.#p(),this.#i()}set recommendedOption(e){this.#c=e,n.ScheduledRender.scheduleRender(this,this.#i)}connectedCallback(){this.#e.adoptedStyleSheets=[U],l.CPUThrottlingManager.CPUThrottlingManager.instance().addEventListener("RateChanged",this.#u,this),this.#g.addChangeListener(this.#m,this),this.#u()}disconnectedCallback(){this.#g.removeChangeListener(this.#m,this),l.CPUThrottlingManager.CPUThrottlingManager.instance().removeEventListener("RateChanged",this.#u,this)}#u(){this.#d=l.CPUThrottlingManager.CPUThrottlingManager.instance().cpuThrottlingOption(),n.ScheduledRender.scheduleRender(this,this.#i)}#m(){this.#p(),n.ScheduledRender.scheduleRender(this,this.#i)}#v(e){let t;if("string"==typeof e.itemValue)"low-tier-mobile"===e.itemValue?t=l.CPUThrottlingManager.CalibratedLowTierMobileThrottlingOption:"mid-tier-mobile"===e.itemValue&&(t=l.CPUThrottlingManager.CalibratedMidTierMobileThrottlingOption);else{const i=Number(e.itemValue);t=c.ThrottlingPresets.ThrottlingPresets.cpuThrottlingPresets.find((e=>!e.calibratedDeviceType&&e.rate()===i))}t&&c.ThrottlingManager.throttlingManager().setCPUThrottlingOption(t)}#b(){a.Revealer.reveal(this.#g)}#p(){this.#h=[{name:"",items:c.ThrottlingPresets.ThrottlingPresets.cpuThrottlingPresets.filter((e=>!e.calibratedDeviceType))},{name:j(V.labelCalibratedPresets),items:c.ThrottlingPresets.ThrottlingPresets.cpuThrottlingPresets.filter((e=>e.calibratedDeviceType))}]}#i=()=>{let e;this.#c&&this.#d===l.CPUThrottlingManager.NoThrottlingOption&&(e=B`<devtools-button
        title=${j(V.recommendedThrottlingReason)}
        .iconName=${"info"}
        .variant=${"icon"}
      ></devtools-button>`);const t=this.#d.title(),i=this.#g.get(),n=i.low||i.mid,s=j(n?V.recalibrate:V.calibrate),a=B`
      <devtools-select-menu
            @selectmenuselected=${this.#v}
            .showDivider=${!0}
            .showArrow=${!0}
            .sideButton=${!1}
            .showSelectedItem=${!0}
            .jslogContext=${"cpu-throttling"}
            .buttonTitle=${j(V.cpu,{PH1:t})}
            .title=${j(V.cpuThrottling,{PH1:t})}
          >
          ${this.#h.map((e=>B`
              <devtools-menu-group .name=${e.name} .title=${e.name}>
                ${e.items.map((e=>{const t=e===this.#c?j(V.recommendedThrottling,{PH1:e.title()}):e.title(),i=e.rate();return B`
                    <devtools-menu-item
                      .value=${e.calibratedDeviceType??i}
                      .selected=${this.#d===e}
                      .disabled=${0===i}
                      .title=${t}
                      jslog=${o.item(e.jslogContext).track({click:!0})}
                    >
                      ${t}
                    </devtools-menu-item>
                  `}))}
                ${"Calibrated presets"===e.name?B`<devtools-menu-item
                  .value=${-1}
                  .title=${s}
                  jslog=${o.action("cpu-throttling-selector-calibrate").track({click:!0})}
                  @click=${this.#b}
                >
                  ${s}
                </devtools-menu-item>`:r.nothing}
              </devtools-menu-group>`))}
      </devtools-select-menu>
      ${e}
    `;r.render(a,this.#e,{host:this})}}customElements.define("devtools-cpu-throttling-selector",W);var K=Object.freeze({__proto__:null,CPUThrottlingSelector:W});const G={forcedReflow:"Forced reflow",sIsALikelyPerformanceBottleneck:"{PH1} is a likely performance bottleneck.",idleCallbackExecutionExtended:"Idle callback execution extended beyond deadline by {PH1}",sTookS:"{PH1} took {PH2}.",longTask:"Long task",longInteractionINP:"Long interaction",sIsLikelyPoorPageResponsiveness:"{PH1} is indicating poor page responsiveness.",websocketProtocol:"WebSocket protocol",webSocketBytes:"{PH1} byte(s)",webSocketDataLength:"Data length"},Y=t.i18n.registerUIStrings("panels/timeline/components/DetailsView.ts",G),X=t.i18n.getLocalizedString.bind(void 0,Y);var J=Object.freeze({__proto__:null,buildRowsForWebSocketEvent:function(e,n){const s=[],r=n.Initiators.eventToInitiator.get(e);return r&&i.Types.Events.isWebSocketCreate(r)?(s.push({key:t.i18n.lockedString("URL"),value:r.args.data.url}),r.args.data.websocketProtocol&&s.push({key:X(G.websocketProtocol),value:r.args.data.websocketProtocol})):i.Types.Events.isWebSocketCreate(e)&&(s.push({key:t.i18n.lockedString("URL"),value:e.args.data.url}),e.args.data.websocketProtocol&&s.push({key:X(G.websocketProtocol),value:e.args.data.websocketProtocol})),i.Types.Events.isWebSocketTransfer(e)&&e.args.data.dataLength&&s.push({key:X(G.webSocketDataLength),value:`${X(G.webSocketBytes,{PH1:e.args.data.dataLength})}`}),s},buildWarningElementsForEvent:function(e,n){const r=n.Warnings.perEvent.get(e),o=[];if(!r)return o;for(const n of r){const r=i.Helpers.Timing.microToMilli(i.Types.Timing.Micro(e.dur||0)),a=document.createElement("span");switch(n){case"FORCED_REFLOW":{const e=s.XLink.XLink.create("https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts",X(G.forcedReflow),void 0,void 0,"forced-reflow");a.appendChild(t.i18n.getFormatLocalizedString(Y,G.sIsALikelyPerformanceBottleneck,{PH1:e}));break}case"IDLE_CALLBACK_OVER_TIME":{if(!i.Types.Events.isFireIdleCallback(e))break;const n=t.TimeUtilities.millisToString((r||0)-e.args.data.allottedMilliseconds,!0);a.textContent=X(G.idleCallbackExecutionExtended,{PH1:n});break}case"LONG_TASK":{const e=s.XLink.XLink.create("https://web.dev/optimize-long-tasks/",X(G.longTask),void 0,void 0,"long-tasks");a.appendChild(t.i18n.getFormatLocalizedString(Y,G.sTookS,{PH1:e,PH2:t.TimeUtilities.millisToString(r||0,!0)}));break}case"LONG_INTERACTION":{const e=s.XLink.XLink.create("https://web.dev/inp",X(G.longInteractionINP),void 0,void 0,"long-interaction");a.appendChild(t.i18n.getFormatLocalizedString(Y,G.sIsLikelyPoorPageResponsiveness,{PH1:e}));break}default:h.assertNever(n,`Unhandled warning type ${n}`)}o.push(a)}return o},generateInvalidationsList:function(e){const t={},n=new Set;for(const s of e){n.add(s.args.data.nodeId);let e=s.args.data.reason||"unknown";if("unknown"===e&&i.Types.Events.isScheduleStyleInvalidationTracking(s)&&s.args.data.invalidatedSelectorId)switch(s.args.data.invalidatedSelectorId){case"attribute":e="Attribute",s.args.data.changedAttribute&&(e+=` (${s.args.data.changedAttribute})`);break;case"class":e="Class",s.args.data.changedClass&&(e+=` (${s.args.data.changedClass})`);break;case"id":e="Id",s.args.data.changedId&&(e+=` (${s.args.data.changedId})`)}if("PseudoClass"===e&&i.Types.Events.isStyleRecalcInvalidationTracking(s)&&s.args.data.extraData&&(e+=s.args.data.extraData),"Attribute"===e&&i.Types.Events.isStyleRecalcInvalidationTracking(s)&&s.args.data.extraData&&(e+=` (${s.args.data.extraData})`),"StyleInvalidator"===e)continue;const r=t[e]||[];r.push(s),t[e]=r}return{groupedByReason:t,backendNodeIds:n}}}),Z={cssText:`.list{max-height:200px}.list-item:has(.origin-mapping-row.header){position:sticky;top:0;z-index:1;background-color:var(--sys-color-cdt-base-container)}.origin-mapping-row{display:flex;flex-direction:row;width:100%;height:30px}.origin-mapping-row.header{font-weight:var(--ref-typeface-weight-medium);border-bottom:1px solid var(--sys-color-divider)}.origin-mapping-cell{flex:1;display:flex;align-items:center;padding:4px;border-right:1px solid var(--sys-color-divider)}.origin-warning-icon{width:16px;height:16px;margin-right:4px;color:var(--icon-warning)}.origin{text-overflow:ellipsis;overflow-x:hidden}.origin-mapping-cell:last-child{border:none}.origin-mapping-editor{display:flex;flex-direction:row;width:100%;padding:12px 8px;gap:12px}.origin-mapping-editor label{flex:1;font-weight:var(--ref-typeface-weight-medium)}.origin-mapping-editor input{margin-top:4px;width:100%}\n/*# sourceURL=${import.meta.resolve("./originMap.css")} */\n`};const{html:Q}=r,ee={developmentOrigin:"Development origin",productionOrigin:"Production origin",invalidOrigin:'"{PH1}" is not a valid origin or URL.',alreadyMapped:'"{PH1}" is already mapped to a production origin.',pageHasNoData:"The Chrome UX Report does not have sufficient real user data for this page."},te=t.i18n.registerUIStrings("panels/timeline/components/OriginMap.ts",ee),ie=t.i18n.getLocalizedString.bind(void 0,te),ne="developmentOrigin",se="productionOrigin";class re extends s.Widget.WidgetElement{#f;#y;constructor(){super(),this.#f=new s.ListWidget.ListWidget(this,!1,!0),g.CrUXManager.instance().getConfigSetting().addChangeListener(this.#w,this),this.#w()}createWidget(){const e=new s.Widget.Widget(!1,!1,this);return this.#f.registerRequiredCSS(Z),this.#f.show(e.contentElement),e}#S(){return g.CrUXManager.instance().getConfigSetting().get().originMappings||[]}#x(e){const t=g.CrUXManager.instance().getConfigSetting(),i={...t.get()};i.originMappings=e,t.set(i)}#w(){const e=this.#S();this.#f.clear(),this.#f.appendItem({developmentOrigin:ie(ee.developmentOrigin),productionOrigin:ie(ee.productionOrigin),isTitleRow:!0},!1);for(const t of e)this.#f.appendItem(t,!0)}#k(e){try{return new URL(e).origin}catch{return null}}#T(e){return p.write((async()=>{if(!g.CrUXManager.instance().isEnabled())return r.nothing;const t=g.CrUXManager.instance(),i=await t.getFieldDataForPage(e);return Object.entries(i).some((([e,t])=>"warnings"!==e&&Boolean(t)))?r.nothing:Q`
        <devtools-icon
          class="origin-warning-icon"
          name="warning-filled"
          title=${ie(ee.pageHasNoData)}
        ></devtools-icon>
      `}))}startCreation(){const e=l.TargetManager.TargetManager.instance().inspectedURL(),t=this.#k(e)||"";this.#f.addNewItem(-1,{developmentOrigin:t,productionOrigin:""})}renderItem(e){const t=document.createElement("div");let i,n;return t.classList.add("origin-mapping-row"),t.role="row",e.isTitleRow?(t.classList.add("header"),i="columnheader",n=r.nothing):(i="cell",n=r.Directives.until(this.#T(e.productionOrigin))),r.render(Q`
      <div class="origin-mapping-cell development-origin" role=${i}>
        <div class="origin" title=${e.developmentOrigin}>${e.developmentOrigin}</div>
      </div>
      <div class="origin-mapping-cell production-origin" role=${i}>
        ${n}
        <div class="origin" title=${e.productionOrigin}>${e.productionOrigin}</div>
      </div>
    `,t,{host:this}),t}removeItemRequested(e,t){const i=this.#S();i.splice(t-1,1),this.#x(i)}commitEdit(e,t,i){e.developmentOrigin=this.#k(t.control(ne).value)||"",e.productionOrigin=this.#k(t.control(se).value)||"";const n=this.#S();i&&n.push(e),this.#x(n)}beginEdit(e){const t=this.#C();return t.control(ne).value=e.developmentOrigin,t.control(se).value=e.productionOrigin,t}#$(e,t,i){const n=this.#k(i.value);if(!n)return{valid:!1,errorMessage:ie(ee.invalidOrigin,{PH1:i.value})};const s=this.#S();for(let e=0;e<s.length;++e){if(e===t-1)continue;if(s[e].developmentOrigin===n)return{valid:!0,errorMessage:ie(ee.alreadyMapped,{PH1:n})}}return{valid:!0}}#P(e,t,i){return this.#k(i.value)?{valid:!0}:{valid:!1,errorMessage:ie(ee.invalidOrigin,{PH1:i.value})}}#C(){if(this.#y)return this.#y;const e=new s.ListWidget.Editor;this.#y=e;const t=e.contentElement().createChild("div","origin-mapping-editor"),i=e.createInput(ne,"text",ie(ee.developmentOrigin),this.#$.bind(this)),n=e.createInput(se,"text",ie(ee.productionOrigin),this.#P.bind(this));return r.render(Q`
      <label class="development-origin-input">
        ${ie(ee.developmentOrigin)}
        ${i}
      </label>
      <label class="production-origin-input">
        ${ie(ee.productionOrigin)}
        ${n}
      </label>
    `,t,{host:this}),e}}customElements.define("devtools-origin-map",re);var oe=Object.freeze({__proto__:null,OriginMap:re}),ae={cssText:`:host{display:block}:host *{box-sizing:border-box}devtools-dialog{--override-transparent:color-mix(in srgb,var(--color-background) 80%,transparent)}.section-title{font-size:var(--sys-typescale-headline5-size);line-height:var(--sys-typescale-headline5-line-height);font-weight:var(--ref-typeface-weight-medium);margin:0}.privacy-disclosure{margin:8px 0}.url-override{margin:8px 0;display:flex;align-items:center;overflow:hidden;text-overflow:ellipsis;max-width:max-content}details > summary{font-size:var(--sys-typescale-body4-size);line-height:var(--sys-typescale-body4-line-height);font-weight:var(--ref-typeface-weight-medium)}.content{max-width:360px;box-sizing:border-box}.open-button-section{display:flex;flex-direction:row}.origin-mapping-grid{border:1px solid var(--sys-color-divider);margin-top:8px}.origin-mapping-description{margin-bottom:8px}.origin-mapping-button-section{display:flex;flex-direction:column;align-items:center;margin-top:var(--sys-size-6)}.config-button{margin-left:auto}.advanced-section-contents{margin:4px 0 14px}.buttons-section{display:flex;justify-content:space-between;margin-top:var(--sys-size-6);margin-bottom:var(--sys-size-2);devtools-button.enable{float:right}}input[type="checkbox"]{height:12px;width:12px;min-height:12px;min-width:12px;margin:6px}input[type="text"][disabled]{color:var(--sys-color-state-disabled)}.warning{margin:2px 8px;color:var(--color-error-text)}x-link{color:var(--sys-color-primary);text-decoration-line:underline}.divider{margin:10px 0;border:none;border-top:1px solid var(--sys-color-divider)}\n/*# sourceURL=${import.meta.resolve("./fieldSettingsDialog.css")} */\n`};const le=new CSSStyleSheet;le.replaceSync(ae.cssText);const de={setUp:"Set up",configure:"Configure",ok:"Ok",optOut:"Opt out",cancel:"Cancel",onlyFetchFieldData:"Always show field data for the below URL",url:"URL",doesNotHaveSufficientData:"The Chrome UX Report does not have sufficient real-world speed data for this page.",configureFieldData:"Configure field data fetching",fetchAggregated:"Fetch aggregated field data from the {PH1} to help you contextualize local measurements with what real users experience on the site.",privacyDisclosure:"Privacy disclosure",whenPerformanceIsShown:"When DevTools is open, the URLs you visit will be sent to Google to query field data. These requests are not tied to your Google account.",advanced:"Advanced",mapDevelopmentOrigins:"Set a development origin to automatically get relevant field data for its production origin.",new:"New",invalidOrigin:'"{PH1}" is not a valid origin or URL.'},ce=t.i18n.registerUIStrings("panels/timeline/components/FieldSettingsDialog.ts",de),he=t.i18n.getLocalizedString.bind(void 0,ce),{html:ge,nothing:pe,Directives:{ifDefined:ue}}=r;class me extends Event{static eventName="showdialog";constructor(){super(me.eventName)}}class ve extends HTMLElement{#e=this.attachShadow({mode:"open"});#L;#R=g.CrUXManager.instance().getConfigSetting();#I="";#M=!1;#E="";#D;constructor(){super();const e=g.CrUXManager.instance();this.#R=e.getConfigSetting(),this.#H(),this.#i()}#H(){const e=this.#R.get();this.#I=e.override||"",this.#M=e.overrideEnabled||!1,this.#E=""}#F(e){const t=this.#R.get();this.#R.set({...t,enabled:e,override:this.#I,overrideEnabled:this.#M})}#N(){n.ScheduledRender.scheduleRender(this,this.#i)}async#z(e){const t=g.CrUXManager.instance(),i=await t.getFieldDataForPage(e);return Object.entries(i).some((([e,t])=>"warnings"!==e&&Boolean(t)))}async#O(e){if(e&&this.#M){if(!this.#k(this.#I))return this.#E=he(de.invalidOrigin,{PH1:this.#I}),void n.ScheduledRender.scheduleRender(this,this.#i);if(!await this.#z(this.#I))return this.#E=he(de.doesNotHaveSufficientData),void n.ScheduledRender.scheduleRender(this,this.#i)}this.#F(e),this.#A()}#_(){if(!this.#L)throw new Error("Dialog not found");this.#H(),this.#L.setDialogVisible(!0),n.ScheduledRender.scheduleRender(this,this.#i),this.dispatchEvent(new me)}#A(e){if(!this.#L)throw new Error("Dialog not found");this.#L.setDialogVisible(!1),e&&e.stopImmediatePropagation(),n.ScheduledRender.scheduleRender(this,this.#i)}connectedCallback(){this.#e.adoptedStyleSheets=[le,u.textInputStyles,u.checkboxStyles],this.#R.addChangeListener(this.#N,this),n.ScheduledRender.scheduleRender(this,this.#i)}disconnectedCallback(){this.#R.removeChangeListener(this.#N,this)}#U(){return this.#R.get().enabled?ge`
        <devtools-button
          class="config-button"
          @click=${this.#_}
          .data=${{variant:"outlined",title:he(de.configure)}}
        jslog=${o.action("timeline.field-data.configure").track({click:!0})}
        >${he(de.configure)}</devtools-button>
      `:ge`
      <devtools-button
        class="setup-button"
        @click=${this.#_}
        .data=${{variant:"primary",title:he(de.setUp)}}
        jslog=${o.action("timeline.field-data.setup").track({click:!0})}
        data-field-data-setup
      >${he(de.setUp)}</devtools-button>
    `}#B(){return ge`
      <devtools-button
        @click=${()=>{this.#O(!0)}}
        .data=${{variant:"primary",title:he(de.ok)}}
        class="enable"
        jslog=${o.action("timeline.field-data.enable").track({click:!0})}
        data-field-data-enable
      >${he(de.ok)}</devtools-button>
    `}#V(){const e=this.#R.get().enabled?he(de.optOut):he(de.cancel);return ge`
      <devtools-button
        @click=${()=>{this.#O(!1)}}
        .data=${{variant:"outlined",title:e}}
        jslog=${o.action("timeline.field-data.disable").track({click:!0})}
        data-field-data-disable
      >${e}</devtools-button>
    `}#q(e){e.stopPropagation();const t=e.target;this.#I=t.value,this.#E="",n.ScheduledRender.scheduleRender(this,this.#i)}#j(e){e.stopPropagation();const t=e.target;this.#M=t.checked,this.#E="",n.ScheduledRender.scheduleRender(this,this.#i)}#k(e){try{return new URL(e).origin}catch{return null}}#W(){return ge`
      <div class="origin-mapping-description">${he(de.mapDevelopmentOrigins)}</div>
      <devtools-origin-map
        on-render=${n.Directives.nodeRenderedCallback((e=>{this.#D=e}))}
      ></devtools-origin-map>
      <div class="origin-mapping-button-section">
        <devtools-button
          @click=${()=>this.#D?.startCreation()}
          .data=${{variant:"text",title:he(de.new),iconName:"plus"}}
          jslogContext=${"new-origin-mapping"}
        >${he(de.new)}</devtools-button>
      </div>
    `}#i=()=>{const e=s.XLink.XLink.create("https://developer.chrome.com/docs/crux",t.i18n.lockedString("Chrome UX Report")),i=t.i18n.getFormatLocalizedString(ce,de.fetchAggregated,{PH1:e}),a=ge`
      <div class="open-button-section">${this.#U()}</div>
      <devtools-dialog
        @clickoutsidedialog=${this.#A}
        .position=${"auto"}
        .horizontalAlignment=${"center"}
        .jslogContext=${"timeline.field-data.settings"}
        .dialogTitle=${he(de.configureFieldData)}
        on-render=${n.Directives.nodeRenderedCallback((e=>{this.#L=e}))}
      >
        <div class="content">
          <div>${i}</div>
          <div class="privacy-disclosure">
            <h3 class="section-title">${he(de.privacyDisclosure)}</h3>
            <div>${he(de.whenPerformanceIsShown)}</div>
          </div>
          <details aria-label=${he(de.advanced)}>
            <summary>${he(de.advanced)}</summary>
            <div class="advanced-section-contents">
              ${this.#W()}
              <hr class="divider">
              <label class="url-override">
                <input
                  type="checkbox"
                  .checked=${this.#M}
                  @change=${this.#j}
                  aria-label=${he(de.onlyFetchFieldData)}
                  jslog=${o.toggle().track({click:!0}).context("field-url-override-enabled")}
                />
                ${he(de.onlyFetchFieldData)}
              </label>
              <input
                type="text"
                @keyup=${this.#q}
                @change=${this.#q}
                class="devtools-text-input"
                .disabled=${!this.#M}
                .value=${this.#I}
                placeholder=${ue(this.#M?he(de.url):void 0)}
              />
              ${this.#E?ge`<div class="warning" role="alert" aria-label=${this.#E}>${this.#E}</div>`:pe}
            </div>
          </details>
          <div class="buttons-section">
            ${this.#V()}
            ${this.#B()}
          </div>
        </div>
      </devtools-dialog>
    `;r.render(a,this.#e,{host:this})}}customElements.define("devtools-field-settings-dialog",ve);var be=Object.freeze({__proto__:null,FieldSettingsDialog:ve,ShowDialog:me}),fe={cssText:`.ignore-list-setting-content{max-width:var(--sys-size-30)}.ignore-list-setting-description{margin-bottom:5px}.regex-row{display:flex;dt-checkbox{flex:auto}devtools-button{height:24px}&:not(:hover) devtools-button{display:none}}.new-regex-row{display:flex;.new-regex-text-input{flex:auto}.harmony-input[type="text"]{border:1px solid var(--sys-color-neutral-outline);border-radius:4px;outline:none;&.error-input,\n    &:invalid{border-color:var(--sys-color-error)}&:not(.error-input, :invalid):focus{border-color:var(--sys-color-state-focus-ring)}&:not(.error-input, :invalid):hover:not(:focus){background:var(--sys-color-state-hover-on-subtle)}}}\n/*# sourceURL=${import.meta.resolve("./ignoreListSetting.css")} */\n`};const ye=new CSSStyleSheet;ye.replaceSync(fe.cssText);const{html:we}=r,Se={showIgnoreListSettingDialog:"Show ignore list setting dialog",ignoreList:"Ignore list",ignoreListDescription:"Add regular expression rules to remove matching scripts from the flame chart.",ignoreScriptsWhoseNamesMatchS:"Ignore scripts whose names match ''{regex}''",removeRegex:"Remove the regex: ''{regex}''",addNewRegex:"Add a regular expression rule for the script's URL",ignoreScriptsWhoseNamesMatchNewRegex:"Ignore scripts whose names match the new regex"},xe=t.i18n.registerUIStrings("panels/timeline/components/IgnoreListSetting.ts",Se),ke=t.i18n.getLocalizedString.bind(void 0,xe);class Te extends HTMLElement{#e=this.attachShadow({mode:"open"});#K=this.#i.bind(this);#G=a.Settings.Settings.instance().moduleSetting("enable-ignore-listing");#Y=this.#X().getAsArray();#J=s.UIUtils.CheckboxLabel.create(void 0,!1,void 0,"timeline.ignore-list-new-regex.checkbox");#Z=s.UIUtils.createInput("new-regex-text-input","text","timeline.ignore-list-new-regex.text");#Q=null;constructor(){super(),this.#ee(),a.Settings.Settings.instance().moduleSetting("skip-stack-frames-pattern").addChangeListener(this.#te.bind(this)),a.Settings.Settings.instance().moduleSetting("enable-ignore-listing").addChangeListener(this.#te.bind(this))}connectedCallback(){this.#e.adoptedStyleSheets=[ye],this.#te(),this.addEventListener("contextmenu",(e=>{e.stopPropagation()}))}#te(){n.ScheduledRender.scheduleRender(this,this.#K)}#X(){return a.Settings.Settings.instance().moduleSetting("skip-stack-frames-pattern")}#ie(){this.#Q={pattern:this.#Z.value,disabled:!1,disabledForUrl:void 0},this.#Y.push(this.#Q)}#ne(){if(!this.#Q)return;const e=this.#Y.pop();e&&e!==this.#Q&&(console.warn("The last regex is not the editing one."),this.#Y.push(e)),this.#Q=null,this.#X().setAsArray(this.#Y)}#se(){this.#J.checkboxElement.checked=!1,this.#Z.value=""}#re(){const e=this.#Z.value.trim();this.#ne(),Ce(e)&&(m.IgnoreListManager.IgnoreListManager.instance().addRegexToIgnoreList(e),this.#se())}#oe(e){if(e.key===h.KeyboardUtilities.ENTER_KEY)return this.#re(),void this.#ie();e.key===h.KeyboardUtilities.ESCAPE_KEY&&(e.stopImmediatePropagation(),this.#ne(),this.#se(),this.#Z.blur())}#ae(){if(this.#Q){const e=this.#Y[this.#Y.length-1];if(e&&e===this.#Q)return this.#Y.slice(0,-1)}return this.#Y}#le(){const e=this.#Z.value.trim();this.#Q&&Ce(e)&&(this.#Q.pattern=e,this.#Q.disabled=!Boolean(e),this.#X().setAsArray(this.#Y))}#ee(){this.#Z.placeholder="/framework\\.js$";const e=ke(Se.ignoreScriptsWhoseNamesMatchNewRegex),t=ke(Se.addNewRegex);s.Tooltip.Tooltip.install(this.#J,e),s.Tooltip.Tooltip.install(this.#Z,t),this.#Z.addEventListener("blur",this.#re.bind(this),!1),this.#Z.addEventListener("keydown",this.#oe.bind(this),!1),this.#Z.addEventListener("input",this.#le.bind(this),!1),this.#Z.addEventListener("focus",this.#ie.bind(this),!1)}#de(){return we`
      <div class='new-regex-row'>${this.#J}${this.#Z}</div>
    `}#ce(e,t){e.disabled=!t.checkboxElement.checked,this.#X().setAsArray(this.#Y)}#he(e){this.#Y.splice(e,1),this.#X().setAsArray(this.#Y)}#ge(e,t){const i=s.UIUtils.CheckboxLabel.createWithStringLiteral(e.pattern,!e.disabled,void 0,"timeline.ignore-list-pattern"),n=ke(Se.ignoreScriptsWhoseNamesMatchS,{regex:e.pattern});return s.Tooltip.Tooltip.install(i,n),i.checkboxElement.ariaLabel=n,i.checkboxElement.addEventListener("change",this.#ce.bind(this,e,i),!1),we`
      <div class='regex-row'>
        ${i}
        <devtools-button
            @click=${this.#he.bind(this,t)}
            .data=${{variant:"icon",iconName:"bin",title:ke(Se.removeRegex,{regex:e.pattern}),jslogContext:"timeline.ignore-list-pattern.remove"}}></devtools-button>
      </div>
    `}#i(){if(!n.ScheduledRender.isScheduledRender(this))throw new Error("Ignore List setting dialog render was not scheduled");const e=we`
      <devtools-button-dialog .data=${{openOnRender:!1,jslogContext:"timeline.ignore-list",variant:"toolbar",iconName:"compress",disabled:!this.#G.get(),iconTitle:ke(Se.showIgnoreListSettingDialog),horizontalAlignment:"auto",closeButton:!0,dialogTitle:ke(Se.ignoreList)}}>
        <div class='ignore-list-setting-content'>
          <div class='ignore-list-setting-description'>${ke(Se.ignoreListDescription)}</div>
          ${this.#ae().map(this.#ge.bind(this))}
          ${this.#de()}
        </div>
      </devtools-button-dialog>
    `;r.render(e,this.#e,{host:this})}}function Ce(e){const t=e.trim();if(!t.length)return!1;let i;try{i=new RegExp(t)}catch{}return Boolean(i)}customElements.define("devtools-perf-ignore-list-setting",Te);var $e=Object.freeze({__proto__:null,IgnoreListSetting:Te,regexInputIsValid:Ce}),Pe={cssText:`:host{display:block}.breakdown{margin:0;padding:0;list-style:none;color:var(--sys-color-token-subtle)}.value{display:inline-block;padding:0 5px;color:var(--sys-color-on-surface)}\n/*# sourceURL=${import.meta.resolve("./interactionBreakdown.css")} */\n`};const Le=new CSSStyleSheet;Le.replaceSync(Pe.cssText);const{html:Re}=r,Ie={inputDelay:"Input delay",processingDuration:"Processing duration",presentationDelay:"Presentation delay"},Me=t.i18n.registerUIStrings("panels/timeline/components/InteractionBreakdown.ts",Ie),Ee=t.i18n.getLocalizedString.bind(void 0,Me);class De extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#pe=null;connectedCallback(){this.#e.adoptedStyleSheets=[Le]}set entry(e){e!==this.#pe&&(this.#pe=e,n.ScheduledRender.scheduleRender(this,this.#t))}#i(){if(!this.#pe)return;const e=t.TimeUtilities.formatMicroSecondsAsMillisFixed(this.#pe.inputDelay),i=t.TimeUtilities.formatMicroSecondsAsMillisFixed(this.#pe.mainThreadHandling),n=t.TimeUtilities.formatMicroSecondsAsMillisFixed(this.#pe.presentationDelay);r.render(Re`<ul class="breakdown">
                     <li data-entry="input-delay">${Ee(Ie.inputDelay)}<span class="value">${e}</span></li>
                     <li data-entry="processing-duration">${Ee(Ie.processingDuration)}<span class="value">${i}</span></li>
                     <li data-entry="presentation-delay">${Ee(Ie.presentationDelay)}<span class="value">${n}</span></li>
                   </ul>
                   `,this.#e,{host:this})}}customElements.define("devtools-interaction-breakdown",De);var He=Object.freeze({__proto__:null,InteractionBreakdown:De}),Fe={cssText:`.layout-shift-details-title,\n.cluster-details-title{padding-bottom:var(--sys-size-5);display:flex;align-items:center;.layout-shift-event-title,\n  .cluster-event-title{background-color:var(--app-color-rendering);width:var(--sys-size-6);height:var(--sys-size-6);border:var(--sys-size-1) solid var(--sys-color-divider);display:inline-block;margin-right:var(--sys-size-3)}}.layout-shift-details-table{font:var(--sys-typescale-body4-regular);margin-bottom:var(--sys-size-4);text-align:left;border-block:var(--sys-size-1) solid var(--sys-color-divider);border-collapse:collapse;font-variant-numeric:tabular-nums;th,\n  td{padding-right:var(--sys-size-4);min-width:var(--sys-size-20);max-width:var(--sys-size-28)}}.table-title{th{font:var(--sys-typescale-body4-medium)}tr{border-bottom:var(--sys-size-1) solid var(--sys-color-divider)}}.timeline-link{cursor:pointer;text-decoration:underline;color:var(--sys-color-primary);background:none;border:none;padding:0;font:inherit;text-align:left}.timeline-link.invalid-link{color:var(--sys-color-state-disabled)}.details-row{display:flex;min-height:var(--sys-size-9)}.title{color:var(--sys-color-token-subtle);overflow:hidden;padding-right:var(--sys-size-5);display:inline-block;vertical-align:top}.culprit{display:inline-flex;flex-direction:row;gap:var(--sys-size-3)}.value{display:inline-block;user-select:text;text-overflow:ellipsis;overflow:hidden;padding:0 var(--sys-size-3)}.layout-shift-summary-details,\n.layout-shift-cluster-summary-details{font:var(--sys-typescale-body4-regular);display:flex;flex-direction:column;column-gap:var(--sys-size-4);padding:var(--sys-size-6) var(--sys-size-6) 0 var(--sys-size-6)}.culprits{display:flex;flex-direction:column}.shift-row:not(:last-child){border-bottom:var(--sys-size-1) solid var(--sys-color-divider)}.total-row{font:var(--sys-typescale-body4-medium)}\n/*# sourceURL=${import.meta.resolve("./layoutShiftDetails.css")} */\n`};const Ne=new CSSStyleSheet;Ne.replaceSync(Fe.cssText);const ze=new CSSStyleSheet;ze.replaceSync(d.textButtonStyles.cssText);const{html:Oe}=r,Ae={startTime:"Start time",shiftScore:"Shift score",elementsShifted:"Elements shifted",culprit:"Culprit",injectedIframe:"Injected iframe",fontRequest:"Font request",nonCompositedAnimation:"Non-composited animation",animation:"Animation",parentCluster:"Parent cluster",cluster:"Layout shift cluster @ {PH1}",layoutShift:"Layout shift @ {PH1}",total:"Total",unsizedImage:"Unsized image"},_e=t.i18n.registerUIStrings("panels/timeline/components/LayoutShiftDetails.ts",Ae),Ue=t.i18n.getLocalizedString.bind(void 0,_e);class Be extends HTMLElement{#e=this.attachShadow({mode:"open"});#ue=null;#me=null;#ve=null;#be=!1;connectedCallback(){this.#e.adoptedStyleSheets=[Ne,ze],this.#i()}setData(e,t,i,n){this.#ue!==e&&(this.#ue=e,this.#me=t,this.#ve=i,this.#be=n,this.#i())}#fe(e){const t=f.EntryName.nameForEntry(e);return Oe`
      <div class="layout-shift-details-title">
        <div class="layout-shift-event-title"></div>
        ${t}
      </div>
    `}#ye(e,t){return Oe`
      ${t?.map((t=>void 0!==t.node_id?Oe`
            <devtools-performance-node-link
              .data=${{backendNodeId:t.node_id,frame:e.args.frame}}>
            </devtools-performance-node-link>`:r.nothing))}`}#we(e){const t=e;if(!t)return null;const i=l.FrameManager.FrameManager.instance().getFrame(t);if(!i)return null;const n=b.Linkifier.Linkifier.linkifyRevealable(i,i.displayName());return Oe`
    <span class="culprit"><span class="culprit-type">${Ue(Ae.injectedIframe)}: </span><span class="culprit-value">${n}</span></span>`}#Se(e){const t={tabStop:!0,showColumnNumber:!1,inlineFrameIndex:0,maxLength:20},i=b.Linkifier.Linkifier.linkifyURL(e.args.data.url,t);return Oe`
    <span class="culprit"><span class="culprit-type">${Ue(Ae.fontRequest)}: </span><span class="culprit-value">${i}</span></span>`}#xe(e){this.dispatchEvent(new y.EventRef.EventReferenceClick(e))}#ke(e){const t=e.animation;return t?Oe`
        <span class="culprit">
        <span class="culprit-type">${Ue(Ae.nonCompositedAnimation)}: </span>
        <button type="button" class="culprit-value timeline-link" @click=${()=>this.#xe(t)}>${Ue(Ae.animation)}</button>
      </span>`:null}#Te(e,t){const i=Oe`
      <devtools-performance-node-link
        .data=${{backendNodeId:t,frame:e}}>
      </devtools-performance-node-link>`;return Oe`
    <span class="culprit"><span class="culprit-type">${Ue(Ae.unsizedImage)}: </span><span class="culprit-value">${i}</span></span>`}#Ce(e,t){return Oe`
      ${t?.fontRequests.map((e=>this.#Se(e)))}
      ${t?.iframeIds.map((e=>this.#we(e)))}
      ${t?.nonCompositedAnimations.map((e=>this.#ke(e)))}
      ${t?.unsizedImages.map((t=>this.#Te(e,t)))}
    `}#$e(e,n){const s=i.Types.Timing.Micro(e.ts-n.Meta.traceBounds.min);if(e===this.#ue)return Oe`${t.TimeUtilities.preciseMillisToString(v.Timing.microToMilli(s))}`;const r=t.TimeUtilities.formatMicroSecondsTime(s);return Oe`
         <button type="button" class="timeline-link" @click=${()=>this.#xe(e)}>${Ue(Ae.layoutShift,{PH1:r})}</button>`}#Pe(e,t,i,n){const s=e.args.data?.weighted_score_delta;if(!s)return null;const o=Boolean(n&&(n.fontRequests.length||n.iframeIds.length||n.nonCompositedAnimations.length||n.unsizedImages.length));return Oe`
      <tr class="shift-row" data-ts=${e.ts}>
        <td>${this.#$e(e,t)}</td>
        <td>${s.toFixed(4)}</td>
        ${this.#be?Oe`
          <td>
            <div class="elements-shifted">
              ${this.#ye(e,i)}
            </div>
          </td>`:r.nothing}
        ${o&&this.#be?Oe`
          <td class="culprits">
            ${this.#Ce(e.args.frame,n)}
          </td>`:r.nothing}
      </tr>`}#Le(e,n){if(!e)return null;const s=i.Types.Timing.Micro(e.ts-(n?.Meta.traceBounds.min??0)),r=t.TimeUtilities.formatMicroSecondsTime(s);return Oe`
      <span class="parent-cluster">${Ue(Ae.parentCluster)}:
         <button type="button" class="timeline-link" @click=${()=>this.#xe(e)}>${Ue(Ae.cluster,{PH1:r})}</button>
      </span>`}#Re(e){return Oe`
      <td class="total-row">${Ue(Ae.total)}</td>
      <td class="total-row">${e.clusterCumulativeScore.toFixed(4)}</td>`}#Ie(e,t,n){if(!t)return null;const s=e.args.data?.navigationId??i.Types.Events.NO_NAVIGATION,o=t.get(s)?.model.CLSCulprits;if(!o||o instanceof Error)return null;const a=o.shifts.get(e),l=e.args.data?.impacted_nodes??[],d=a&&(a.fontRequests.length||a.iframeIds.length||a.nonCompositedAnimations.length||a.unsizedImages.length),c=l?.length,h=o.clusters.find((t=>t.events.find((t=>t===e))));return Oe`
      <table class="layout-shift-details-table">
        <thead class="table-title">
          <tr>
            <th>${Ue(Ae.startTime)}</th>
            <th>${Ue(Ae.shiftScore)}</th>
            ${c&&this.#be?Oe`
              <th>${Ue(Ae.elementsShifted)}</th>`:r.nothing}
            ${d&&this.#be?Oe`
              <th>${Ue(Ae.culprit)}</th> `:r.nothing}
          </tr>
        </thead>
        <tbody>
          ${this.#Pe(e,n,l,a)}
        </tbody>
      </table>
      ${this.#Le(h,n)}
    `}#Me(e,t,n){if(!t)return null;const s=e.navigationId??i.Types.Events.NO_NAVIGATION,o=t.get(s)?.model.CLSCulprits;if(!o||o instanceof Error)return null;const a=Array.from(o.shifts.entries()).filter((([t])=>e.events.includes(t))).map((([,e])=>e)).flatMap((e=>Object.values(e))).flat(),l=Boolean(a.length);return Oe`
          <table class="layout-shift-details-table">
            <thead class="table-title">
              <tr>
                <th>${Ue(Ae.startTime)}</th>
                <th>${Ue(Ae.shiftScore)}</th>
                ${this.#be?Oe`
                  <th>${Ue(Ae.elementsShifted)}</th>`:r.nothing}
                ${l&&this.#be?Oe`
                  <th>${Ue(Ae.culprit)}</th> `:r.nothing}
              </tr>
            </thead>
            <tbody>
              ${e.events.map((e=>{const t=o.shifts.get(e),i=e.args.data?.impacted_nodes??[];return this.#Pe(e,n,i,t)}))}
              ${this.#Re(e)}
            </tbody>
          </table>
        `}#i(){if(!this.#ue||!this.#ve)return;const e=Oe`
      <div class="layout-shift-summary-details">
        <div
          class="event-details"
          @mouseover=${this.#Ee}
          @mouseleave=${this.#Ee}
        >
          ${this.#fe(this.#ue)}
          ${i.Types.Events.isSyntheticLayoutShift(this.#ue)?this.#Ie(this.#ue,this.#me,this.#ve):this.#Me(this.#ue,this.#me,this.#ve)}
        </div>
      </div>
    `;r.render(e,this.#e,{host:this})}#Ee(e){const t="mouseover"===e.type;if("mouseleave"===e.type&&this.dispatchEvent(new CustomEvent("toggle-popover",{detail:{show:t},bubbles:!0,composed:!0})),!(e.target instanceof HTMLElement&&this.#ue))return;const n=e.target.closest("tbody tr");if(!n?.parentElement)return;const s=i.Types.Events.isSyntheticLayoutShift(this.#ue)?this.#ue:this.#ue.events.find((e=>e.ts===parseInt(n.getAttribute("data-ts")??"",10)));this.dispatchEvent(new CustomEvent("toggle-popover",{detail:{event:s,show:t},bubbles:!0,composed:!0}))}}customElements.define("devtools-performance-layout-shift-details",Be);var Ve=Object.freeze({__proto__:null,LayoutShiftDetails:Be}),qe={cssText:`:host{display:flex;align-items:center;max-width:100%;height:20px}devtools-select-menu{min-width:160px;max-width:100%;height:20px}\n/*# sourceURL=${import.meta.resolve("./networkThrottlingSelector.css")} */\n`};const je=new CSSStyleSheet;je.replaceSync(qe.cssText);const{html:We,nothing:Ke}=r,Ge={network:"Network: {PH1}",networkThrottling:"Network throttling: {PH1}",recommendedThrottling:"{PH1} – recommended",recommendedThrottlingReason:"Consider changing setting to simulate real user environments",disabled:"Disabled",presets:"Presets",custom:"Custom",add:"Add…"},Ye=t.i18n.registerUIStrings("panels/timeline/components/NetworkThrottlingSelector.ts",Ge),Xe=t.i18n.getLocalizedString.bind(void 0,Ye);class Je extends HTMLElement{#e=this.attachShadow({mode:"open"});#De;#h=[];#He;#Fe=null;constructor(){super(),this.#De=a.Settings.Settings.instance().moduleSetting("custom-network-conditions"),this.#Ne(),this.#He=l.NetworkManager.MultitargetNetworkManager.instance().networkConditions(),this.#i()}set recommendedConditions(e){this.#Fe=e,n.ScheduledRender.scheduleRender(this,this.#i)}connectedCallback(){this.#e.adoptedStyleSheets=[je],l.NetworkManager.MultitargetNetworkManager.instance().addEventListener("ConditionsChanged",this.#ze,this),this.#ze(),this.#De.addChangeListener(this.#Oe,this)}disconnectedCallback(){l.NetworkManager.MultitargetNetworkManager.instance().removeEventListener("ConditionsChanged",this.#ze,this),this.#De.removeChangeListener(this.#Oe,this)}#Ne(){this.#h=[{name:Xe(Ge.disabled),items:[l.NetworkManager.NoThrottlingConditions]},{name:Xe(Ge.presets),items:c.ThrottlingPresets.ThrottlingPresets.networkPresets},{name:Xe(Ge.custom),items:this.#De.get(),showCustomAddOption:!0,jslogContext:"custom-network-throttling-item"}]}#ze(){this.#He=l.NetworkManager.MultitargetNetworkManager.instance().networkConditions(),n.ScheduledRender.scheduleRender(this,this.#i)}#v(e){const t=this.#h.flatMap((e=>e.items)).find((t=>this.#Ae(t)===e.itemValue));t&&l.NetworkManager.MultitargetNetworkManager.instance().setNetworkConditions(t)}#Oe(){this.#Ne(),n.ScheduledRender.scheduleRender(this,this.#i)}#_e(e){return e.title instanceof Function?e.title():e.title}#Ue(){a.Revealer.reveal(this.#De)}#Ae(e){return e.i18nTitleKey||this.#_e(e)}#i=()=>{const e=this.#_e(this.#He),t=this.#Ae(this.#He);let i;this.#Fe&&this.#He===l.NetworkManager.NoThrottlingConditions&&(i=We`<devtools-button
        title=${Xe(Ge.recommendedThrottlingReason)}
        .iconName=${"info"}
        .variant=${"icon"}
      ></devtools-button>`);const n=We`
      <devtools-select-menu
        @selectmenuselected=${this.#v}
        .showDivider=${!0}
        .showArrow=${!0}
        .sideButton=${!1}
        .showSelectedItem=${!0}
        .jslogContext=${"network-conditions"}
        .buttonTitle=${Xe(Ge.network,{PH1:e})}
        .title=${Xe(Ge.networkThrottling,{PH1:e})}
      >
        ${this.#h.map((e=>We`
            <devtools-menu-group .name=${e.name} .title=${e.name}>
              ${e.items.map((i=>{let n=this.#_e(i);i===this.#Fe&&(n=Xe(Ge.recommendedThrottling,{PH1:n}));const s=this.#Ae(i),r=e.jslogContext||h.StringUtilities.toKebabCase(i.i18nTitleKey||n);return We`
                  <devtools-menu-item
                    .value=${s}
                    .selected=${t===s}
                    .title=${n}
                    jslog=${o.item(r).track({click:!0})}
                  >
                    ${n}
                  </devtools-menu-item>
                `}))}
              ${e.showCustomAddOption?We`
                <devtools-menu-item
                  .value=${1}
                  .title=${Xe(Ge.add)}
                  jslog=${o.action("add").track({click:!0})}
                  @click=${this.#Ue}
                >
                  ${Xe(Ge.add)}
                </devtools-menu-item>
              `:Ke}
            </devtools-menu-group>
          `))}
      </devtools-select-menu>
      ${i}
    `;r.render(n,this.#e,{host:this})}}customElements.define("devtools-network-throttling-selector",Je);var Ze=Object.freeze({__proto__:null,NetworkThrottlingSelector:Je}),Qe={cssText:`.metric-card{border-radius:var(--sys-shape-corner-small);padding:14px 16px;background-color:var(--sys-color-surface3);height:100%;box-sizing:border-box;&:not(:hover) .title-help{visibility:hidden}}.title{display:flex;justify-content:space-between;font-size:var(--sys-typescale-headline5-size);line-height:var(--sys-typescale-headline5-line-height);font-weight:var(--ref-typeface-weight-medium);margin:0;margin-bottom:6px}.title-help{height:var(--sys-typescale-headline5-line-height);margin-left:4px}.metric-values-section{position:relative;display:flex;column-gap:8px;margin-bottom:8px}.metric-values-section:focus-visible{outline:2px solid -webkit-focus-ring-color}.metric-source-block{flex:1}.metric-source-value{font-size:32px;line-height:36px;font-weight:var(--ref-typeface-weight-regular)}.metric-source-label{font-weight:var(--ref-typeface-weight-medium)}.warning{margin-top:4px;color:var(--sys-color-error);font-size:var(--sys-typescale-body4-size);line-height:var(--sys-typescale-body4-line-height);display:flex;&::before{content:" ";width:var(--sys-typescale-body4-line-height);height:var(--sys-typescale-body4-line-height);mask-size:var(--sys-typescale-body4-line-height);mask-image:var(--image-file-warning);background-color:var(--sys-color-error);margin-right:4px;flex-shrink:0}}.good-bg{background-color:var(--app-color-performance-good)}.needs-improvement-bg{background-color:var(--app-color-performance-ok)}.poor-bg{background-color:var(--app-color-performance-bad)}.divider{width:100%;border:0;border-bottom:1px solid var(--sys-color-divider);margin:8px 0;box-sizing:border-box}.compare-text{margin-top:8px}.environment-recs-intro{margin-top:8px}.environment-recs{margin:9px 0}.environment-recs > summary{font-weight:var(--ref-typeface-weight-medium);margin-bottom:4px;font-size:var(--sys-typescale-body4-size);line-height:var(--sys-typescale-body4-line-height);display:flex;&::before{content:" ";width:var(--sys-typescale-body4-line-height);height:var(--sys-typescale-body4-line-height);mask-size:var(--sys-typescale-body4-line-height);mask-image:var(--image-file-triangle-right);background-color:var(--icon-default);margin-right:4px;flex-shrink:0}}details.environment-recs[open] > summary::before{mask-image:var(--image-file-triangle-down)}.environment-recs-list{margin:0}.detailed-compare-text{margin-bottom:8px}.bucket-summaries{margin-top:8px;white-space:nowrap}.bucket-summaries.histogram{display:grid;grid-template-columns:minmax(min-content,auto) minmax(40px,60px) max-content;grid-auto-rows:1fr;column-gap:8px;place-items:center flex-end}.bucket-label{justify-self:start;font-weight:var(--ref-typeface-weight-medium);white-space:wrap;> *{white-space:nowrap}}.bucket-range{color:var(--sys-color-token-subtle)}.histogram-bar{height:6px}.histogram-percent{color:var(--sys-color-token-subtle);font-weight:var(--ref-typeface-weight-medium)}.tooltip{display:none;visibility:hidden;transition-property:visibility;width:min(var(--tooltip-container-width,350px),350px);max-width:max-content;position:absolute;top:100%;left:50%;transform:translateX(-50%);z-index:1;box-sizing:border-box;padding:var(--sys-size-5) var(--sys-size-6);border-radius:var(--sys-shape-corner-small);background-color:var(--sys-color-cdt-base-container);box-shadow:var(--drop-shadow-depth-3);.tooltip-scroll{overflow-x:auto;.tooltip-contents{min-width:min-content}}}.phase-table{display:grid;column-gap:var(--sys-size-3);white-space:nowrap}.phase-table-row{display:contents}.phase-table-value{text-align:right}.phase-table-header-row{font-weight:var(--ref-typeface-weight-medium)}\n/*# sourceURL=${import.meta.resolve("./metricCard.css")} */\n`};const et={goodBetterCompare:"Your local {PH1} value of {PH2} is good, but is significantly better than your users’ experience.",goodWorseCompare:"Your local {PH1} value of {PH2} is good, but is significantly worse than your users’ experience.",goodSimilarCompare:"Your local {PH1} value of {PH2} is good, and is similar to your users’ experience.",goodSummarized:"Your local {PH1} value of {PH2} is good.",needsImprovementBetterCompare:"Your local {PH1} value of {PH2} needs improvement, but is significantly better than your users’ experience.",needsImprovementWorseCompare:"Your local {PH1} value of {PH2} needs improvement, but is significantly worse than your users’ experience.",needsImprovementSimilarCompare:"Your local {PH1} value of {PH2} needs improvement, and is similar to your users’ experience.",needsImprovementSummarized:"Your local {PH1} value of {PH2} needs improvement.",poorBetterCompare:"Your local {PH1} value of {PH2} is poor, but is significantly better than your users’ experience.",poorWorseCompare:"Your local {PH1} value of {PH2} is poor, but is significantly worse than your users’ experience.",poorSimilarCompare:"Your local {PH1} value of {PH2} is poor, and is similar to your users’ experience.",poorSummarized:"Your local {PH1} value of {PH2} is poor.",goodGoodDetailedCompare:"Your local {PH1} value of {PH2} is good and is rated the same as {PH4} of real-user {PH1} experiences. Additionally, the field data 75th percentile {PH1} value of {PH3} is good.",goodNeedsImprovementDetailedCompare:"Your local {PH1} value of {PH2} is good and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} value of {PH3} needs improvement.",goodPoorDetailedCompare:"Your local {PH1} value of {PH2} is good and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} value of {PH3} is poor.",needsImprovementGoodDetailedCompare:"Your local {PH1} value of {PH2} needs improvement and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} value of {PH3} is good.",needsImprovementNeedsImprovementDetailedCompare:"Your local {PH1} value of {PH2} needs improvement and is rated the same as {PH4} of real-user {PH1} experiences. Additionally, the field data 75th percentile {PH1} value of {PH3} needs improvement.",needsImprovementPoorDetailedCompare:"Your local {PH1} value of {PH2} needs improvement and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} value of {PH3} is poor.",poorGoodDetailedCompare:"Your local {PH1} value of {PH2} is poor and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} value of {PH3} is good.",poorNeedsImprovementDetailedCompare:"Your local {PH1} value of {PH2} is poor and is rated the same as {PH4} of real-user {PH1} experiences. However, the field data 75th percentile {PH1} value of {PH3} needs improvement.",poorPoorDetailedCompare:"Your local {PH1} value of {PH2} is poor and is rated the same as {PH4} of real-user {PH1} experiences. Additionally, the field data 75th percentile {PH1} value of {PH3} is poor."},tt=t.i18n.registerUIStrings("panels/timeline/components/MetricCompareStrings.ts",et);var it={cssText:`.metric-value{text-wrap:nowrap}.metric-value.dim{font-weight:var(--ref-typeface-weight-medium)}.metric-value.waiting{color:var(--sys-color-token-subtle)}.metric-value.good{color:var(--app-color-performance-good)}.metric-value.needs-improvement{color:var(--app-color-performance-ok)}.metric-value.poor{color:var(--app-color-performance-bad)}.metric-value.good.dim{color:var(--app-color-performance-good-dim)}.metric-value.needs-improvement.dim{color:var(--app-color-performance-ok-dim)}.metric-value.poor.dim{color:var(--app-color-performance-bad-dim)}\n/*# sourceURL=${import.meta.resolve("./metricValueStyles.css")} */\n`};const nt={fms:"{PH1}[ms]()",fs:"{PH1}[s]()"},st=t.i18n.registerUIStrings("panels/timeline/components/Utils.ts",nt),rt=t.i18n.getLocalizedString.bind(void 0,st);var ot;function at(e){const{mimeType:t}=e.args.data;switch(e.args.data.resourceType){case"Document":return ot.DOC;case"Stylesheet":return ot.CSS;case"Image":return ot.IMG;case"Media":return ot.MEDIA;case"Font":return ot.FONT;case"Script":case"WebSocket":return ot.JS;default:return void 0===t?ot.OTHER:t.endsWith("/css")?ot.CSS:t.endsWith("javascript")?ot.JS:t.startsWith("image/")?ot.IMG:t.startsWith("audio/")||t.startsWith("video/")?ot.MEDIA:t.startsWith("font/")||t.includes("font-")?ot.FONT:"application/wasm"===t?ot.WASM:t.startsWith("text/")?ot.DOC:ot.OTHER}}function lt(e){let t="--app-color-system";switch(e){case ot.DOC:t="--app-color-doc";break;case ot.JS:t="--app-color-scripting";break;case ot.CSS:t="--app-color-css";break;case ot.IMG:t="--app-color-image";break;case ot.MEDIA:t="--app-color-media";break;case ot.FONT:t="--app-color-font";break;case ot.WASM:t="--app-color-wasm";break;case ot.OTHER:default:t="--app-color-system"}return w.ThemeSupport.instance().getComputedValue(t)}function dt(e){return lt(at(e))}!function(e){e.DOC="Doc",e.CSS="CSS",e.JS="JS",e.FONT="Font",e.IMG="Img",e.MEDIA="Media",e.WASM="Wasm",e.OTHER="Other"}(ot||(ot={}));const ct=[2500,4e3],ht=[.1,.25],gt=[200,500];function pt(e,t){return e<=t[0]?"good":e<=t[1]?"needs-improvement":"poor"}function ut(e,t,i,n,s){const r=document.createElement("span");if(r.classList.add("metric-value"),void 0===t)return r.classList.add("waiting"),r.textContent="-",r;r.textContent=n(t);const a=pt(t,i);return r.classList.add(a),r.setAttribute("jslog",`${o.section(e)}`),s?.dim&&r.classList.add("dim"),r}var mt;function vt(e,t,i){let n,s;switch(e){case"LCP":n=ct,s=1e3;break;case"CLS":n=ht,s=.1;break;case"INP":n=gt,s=200;break;default:h.assertNever(e,`Unknown metric: ${e}`)}const r=pt(t,n),o=pt(i,n);return"good"===r&&"good"===o?"similar":t-i>s?"worse":i-t>s?"better":"similar"}!function(e){function i(e){const t=e.indexOf("["),i=-1!==t&&e.indexOf("]",t),n=i&&e.indexOf("(",i),s=n&&e.indexOf(")",n);if(!s||-1===s)return null;return{firstPart:e.substring(0,t),unitPart:e.substring(t+1,i),lastPart:e.substring(s+1)}}e.parse=i,e.formatMicroSecondsAsSeconds=function(e){const n=document.createElement("span");n.classList.add("number-with-unit");const s=h.Timing.microSecondsToMilliSeconds(e),r=h.Timing.milliSecondsToSeconds(s),o=rt(nt.fs,{PH1:r.toFixed(2)}),a=i(o);if(!a)return n.textContent=t.TimeUtilities.formatMicroSecondsAsSeconds(e),{text:o,element:n};const{firstPart:l,unitPart:d,lastPart:c}=a;return l&&n.append(l),n.createChild("span","unit").textContent=d,c&&n.append(c),{text:n.textContent??"",element:n}},e.formatMicroSecondsAsMillisFixed=function(e,n=0){const s=document.createElement("span");s.classList.add("number-with-unit");const r=h.Timing.microSecondsToMilliSeconds(e),o=rt(nt.fms,{PH1:r.toFixed(n)}),a=i(o);if(!a)return s.textContent=t.TimeUtilities.formatMicroSecondsAsMillisFixed(e),{text:o,element:s};const{firstPart:l,unitPart:d,lastPart:c}=a;return l&&s.append(l),s.createChild("span","unit").textContent=d,c&&s.append(c),{text:s.textContent??"",element:s}}}(mt||(mt={}));var bt=Object.freeze({__proto__:null,CLS_THRESHOLDS:ht,INP_THRESHOLDS:gt,LCP_THRESHOLDS:ct,get NetworkCategory(){return ot},get NumberWithUnit(){return mt},colorForNetworkCategory:lt,colorForNetworkRequest:dt,determineCompareRating:vt,networkResourceCategory:at,rateMetric:pt,renderMetricValue:ut});const ft=new CSSStyleSheet;ft.replaceSync(Qe.cssText);const yt=new CSSStyleSheet;yt.replaceSync(it.cssText);const{html:wt,nothing:St}=r,xt={localValue:"Local",field75thPercentile:"Field 75th percentile",fieldP75:"Field p75",good:"Good",needsImprovement:"Needs improvement",poor:"Poor",leqRange:"(≤{PH1})",betweenRange:"({PH1}-{PH2})",gtRange:"(>{PH1})",percentage:"{PH1}%",interactToMeasure:"Interact with the page to measure INP.",viewCardDetails:"View card details",considerTesting:"Consider your local test conditions",recThrottlingLCP:"Real users may experience longer page loads due to slower network conditions. Increasing network throttling will simulate slower network conditions.",recThrottlingINP:"Real users may experience longer interactions due to slower CPU speeds. Increasing CPU throttling will simulate a slower device.",recViewportLCP:"Screen size can influence what the LCP element is. Ensure you are testing common viewport sizes.",recViewportCLS:"Screen size can influence what layout shifts happen. Ensure you are testing common viewport sizes.",recJourneyCLS:"How a user interacts with the page can influence layout shifts. Ensure you are testing common interactions like scrolling the page.",recJourneyINP:"How a user interacts with the page influences interaction delays. Ensure you are testing common interactions.",recDynamicContentLCP:"The LCP element can vary between page loads if content is dynamic.",recDynamicContentCLS:"Dynamic content can influence what layout shifts happen.",phase:"Phase",lcpHelpTooltip:"LCP reports the render time of the largest image, text block, or video visible in the viewport. Click here to learn more about LCP.",clsHelpTooltip:"CLS measures the amount of unexpected shifted content. Click here to learn more about CLS.",inpHelpTooltip:"INP measures the overall responsiveness to all click, tap, and keyboard interactions. Click here to learn more about INP."},kt=t.i18n.registerUIStrings("panels/timeline/components/MetricCard.ts",xt),Tt=t.i18n.getLocalizedString.bind(void 0,kt);class Ct extends HTMLElement{#e=this.attachShadow({mode:"open"});constructor(){super(),this.#i()}#Be;#Ve={metric:"LCP"};set data(e){this.#Ve=e,n.ScheduledRender.scheduleRender(this,this.#i)}connectedCallback(){this.#e.adoptedStyleSheets=[ft,yt],n.ScheduledRender.scheduleRender(this,this.#i)}#qe=e=>{h.KeyboardUtilities.isEscKey(e)&&(e.stopPropagation(),this.#je())};#We(e){const t=e.target;t?.hasFocus()||this.#je()}#Ke(e){const t=e.target;if(t?.hasFocus())return;const i=e.relatedTarget;i instanceof Node&&t.contains(i)||this.#je()}#je(){const e=this.#Be;e&&(document.body.removeEventListener("keydown",this.#qe),e.style.removeProperty("left"),e.style.removeProperty("visibility"),e.style.removeProperty("display"),e.style.removeProperty("transition-delay"))}#Ge(e=0){const t=this.#Be;if(!t||t.style.visibility||t.style.display)return;document.body.addEventListener("keydown",this.#qe),t.style.display="block",t.style.transitionDelay=`${Math.round(e)}ms`;const i=this.#Ve.tooltipContainer;if(!i)return;const n=i.getBoundingClientRect();t.style.setProperty("--tooltip-container-width",`${Math.round(n.width)}px`),requestAnimationFrame((()=>{let e=0;const i=t.getBoundingClientRect(),s=i.right-n.right,r=i.left-n.left;r<0?e=Math.round(r):s>0&&(e=Math.round(s)),t.style.left=`calc(50% - ${e}px)`,t.style.visibility="visible"}))}#Ye(){switch(this.#Ve.metric){case"LCP":return t.i18n.lockedString("Largest Contentful Paint (LCP)");case"CLS":return t.i18n.lockedString("Cumulative Layout Shift (CLS)");case"INP":return t.i18n.lockedString("Interaction to Next Paint (INP)")}}#Xe(){switch(this.#Ve.metric){case"LCP":return ct;case"CLS":return ht;case"INP":return gt}}#Je(){switch(this.#Ve.metric){case"LCP":return e=>{const i=1e3*e;return t.TimeUtilities.formatMicroSecondsAsSeconds(i)};case"CLS":return e=>0===e?"0":e.toFixed(2);case"INP":return e=>t.TimeUtilities.preciseMillisToString(e)}}#Ze(){switch(this.#Ve.metric){case"LCP":return"https://web.dev/articles/lcp";case"CLS":return"https://web.dev/articles/cls";case"INP":return"https://web.dev/articles/inp"}}#Qe(){switch(this.#Ve.metric){case"LCP":return Tt(xt.lcpHelpTooltip);case"CLS":return Tt(xt.clsHelpTooltip);case"INP":return Tt(xt.inpHelpTooltip)}}#et(){const{localValue:e}=this.#Ve;if(void 0!==e)return e}#tt(){let{fieldValue:e}=this.#Ve;if(void 0!==e&&("string"==typeof e&&(e=Number(e)),Number.isFinite(e)))return e}#it(){const e=this.#et(),t=this.#tt();if(void 0!==e&&void 0!==t)return vt(this.#Ve.metric,e,t)}#nt(){const e=this.#et();if(void 0===e)return"INP"===this.#Ve.metric?wt`
          <div class="compare-text">${Tt(xt.interactToMeasure)}</div>
        `:r.nothing;const i=this.#it(),n=pt(e,this.#Xe()),s=ut(this.#st(!0),e,this.#Xe(),this.#Je(),{dim:!0});return wt`
      <div class="compare-text">
        ${function(e){const{rating:i,compare:n}=e,s={PH1:e.metric,PH2:e.localValue};if("good"===i&&"better"===n)return t.i18n.getFormatLocalizedString(tt,et.goodBetterCompare,s);if("good"===i&&"worse"===n)return t.i18n.getFormatLocalizedString(tt,et.goodWorseCompare,s);if("good"===i&&"similar"===n)return t.i18n.getFormatLocalizedString(tt,et.goodSimilarCompare,s);if("good"===i&&!n)return t.i18n.getFormatLocalizedString(tt,et.goodSummarized,s);if("needs-improvement"===i&&"better"===n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementBetterCompare,s);if("needs-improvement"===i&&"worse"===n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementWorseCompare,s);if("needs-improvement"===i&&"similar"===n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementSimilarCompare,s);if("needs-improvement"===i&&!n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementSummarized,s);if("poor"===i&&"better"===n)return t.i18n.getFormatLocalizedString(tt,et.poorBetterCompare,s);if("poor"===i&&"worse"===n)return t.i18n.getFormatLocalizedString(tt,et.poorWorseCompare,s);if("poor"===i&&"similar"===n)return t.i18n.getFormatLocalizedString(tt,et.poorSimilarCompare,s);if("poor"===i&&!n)return t.i18n.getFormatLocalizedString(tt,et.poorSummarized,s);throw new Error("Compare string not found")}({metric:t.i18n.lockedString(this.#Ve.metric),rating:n,compare:i,localValue:s})}
      </div>
    `}#rt(){const e=this.#it();if(!e||"similar"===e)return r.nothing;const t=[],i=this.#Ve.metric;return"LCP"===i&&"better"===e?t.push(Tt(xt.recThrottlingLCP)):"INP"===i&&"better"===e&&t.push(Tt(xt.recThrottlingINP)),"LCP"===i?t.push(Tt(xt.recViewportLCP)):"CLS"===i&&t.push(Tt(xt.recViewportCLS)),"CLS"===i?t.push(Tt(xt.recJourneyCLS)):"INP"===i&&t.push(Tt(xt.recJourneyINP)),"LCP"===i?t.push(Tt(xt.recDynamicContentLCP)):"CLS"===i&&t.push(Tt(xt.recDynamicContentCLS)),t.length?wt`
      <details class="environment-recs">
        <summary>${Tt(xt.considerTesting)}</summary>
        <ul class="environment-recs-list">${t.map((e=>wt`<li>${e}</li>`))}</ul>
      </details>
    `:r.nothing}#st(e){return`timeline.landing.${e?"local":"field"}-${this.#Ve.metric.toLowerCase()}`}#ot(){const e=this.#et();if(void 0===e)return"INP"===this.#Ve.metric?wt`
          <div class="detailed-compare-text">${Tt(xt.interactToMeasure)}</div>
        `:r.nothing;const i=pt(e,this.#Xe()),n=this.#tt(),s=void 0!==n?pt(n,this.#Xe()):void 0,o=ut(this.#st(!0),e,this.#Xe(),this.#Je(),{dim:!0}),a=ut(this.#st(!1),n,this.#Xe(),this.#Je(),{dim:!0});return wt`
      <div class="detailed-compare-text">${function(e){const{localRating:i,fieldRating:n}=e,s={PH1:e.metric,PH2:e.localValue,PH3:e.fieldValue,PH4:e.percent};if("good"===i&&"good"===n)return t.i18n.getFormatLocalizedString(tt,et.goodGoodDetailedCompare,s);if("good"===i&&"needs-improvement"===n)return t.i18n.getFormatLocalizedString(tt,et.goodNeedsImprovementDetailedCompare,s);if("good"===i&&"poor"===n)return t.i18n.getFormatLocalizedString(tt,et.goodPoorDetailedCompare,s);if("good"===i&&!n)return t.i18n.getFormatLocalizedString(tt,et.goodSummarized,s);if("needs-improvement"===i&&"good"===n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementGoodDetailedCompare,s);if("needs-improvement"===i&&"needs-improvement"===n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementNeedsImprovementDetailedCompare,s);if("needs-improvement"===i&&"poor"===n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementPoorDetailedCompare,s);if("needs-improvement"===i&&!n)return t.i18n.getFormatLocalizedString(tt,et.needsImprovementSummarized,s);if("poor"===i&&"good"===n)return t.i18n.getFormatLocalizedString(tt,et.poorGoodDetailedCompare,s);if("poor"===i&&"needs-improvement"===n)return t.i18n.getFormatLocalizedString(tt,et.poorNeedsImprovementDetailedCompare,s);if("poor"===i&&"poor"===n)return t.i18n.getFormatLocalizedString(tt,et.poorPoorDetailedCompare,s);if("poor"===i&&!n)return t.i18n.getFormatLocalizedString(tt,et.poorSummarized,s);throw new Error("Detailed compare string not found")}({metric:t.i18n.lockedString(this.#Ve.metric),localRating:i,fieldRating:s,localValue:o,fieldValue:a,percent:this.#at(i)})}</div>
    `}#lt(e){switch(e){case"good":return 0;case"needs-improvement":return 1;case"poor":return 2}}#dt(e){const t=this.#Ve.histogram,i=t?.[this.#lt(e)].density||0;return`${Math.round(100*i)}%`}#at(e){const t=this.#Ve.histogram;if(void 0===t)return"-";const i=t[this.#lt(e)].density||0,n=Math.round(100*i);return Tt(xt.percentage,{PH1:n})}#ct(){const e=g.CrUXManager.instance().getConfigSetting().get().enabled,t=this.#Je(),i=this.#Xe(),n=wt`
      <div class="bucket-label">
        <span>${Tt(xt.good)}</span>
        <span class="bucket-range">${Tt(xt.leqRange,{PH1:t(i[0])})}</span>
      </div>
    `,s=wt`
      <div class="bucket-label">
        <span>${Tt(xt.needsImprovement)}</span>
        <span class="bucket-range">${Tt(xt.betweenRange,{PH1:t(i[0]),PH2:t(i[1])})}</span>
      </div>
    `,r=wt`
      <div class="bucket-label">
        <span>${Tt(xt.poor)}</span>
        <span class="bucket-range">${Tt(xt.gtRange,{PH1:t(i[1])})}</span>
      </div>
    `;return e?wt`
      <div class="bucket-summaries histogram">
        ${n}
        <div class="histogram-bar good-bg" style="width: ${this.#dt("good")}"></div>
        <div class="histogram-percent">${this.#at("good")}</div>
        ${s}
        <div class="histogram-bar needs-improvement-bg" style="width: ${this.#dt("needs-improvement")}"></div>
        <div class="histogram-percent">${this.#at("needs-improvement")}</div>
        ${r}
        <div class="histogram-bar poor-bg" style="width: ${this.#dt("poor")}"></div>
        <div class="histogram-percent">${this.#at("poor")}</div>
      </div>
    `:wt`
        <div class="bucket-summaries">
          ${n}
          ${s}
          ${r}
        </div>
      `}#ht(e){const i=e.every((e=>void 0!==e[2]));return wt`
      <hr class="divider">
      <div class="phase-table" role="table">
        <div class="phase-table-row phase-table-header-row" role="row">
          <div role="columnheader" style="grid-column: 1">${Tt(xt.phase)}</div>
          <div role="columnheader" class="phase-table-value" style="grid-column: 2">${Tt(xt.localValue)}</div>
          ${i?wt`
            <div
              role="columnheader"
              class="phase-table-value"
              style="grid-column: 3"
              title=${Tt(xt.field75thPercentile)}>${Tt(xt.fieldP75)}</div>
          `:St}
        </div>
        ${e.map((e=>wt`
          <div class="phase-table-row" role="row">
            <div role="cell">${e[0]}</div>
            <div role="cell" class="phase-table-value">${t.TimeUtilities.preciseMillisToString(e[1])}</div>
            ${void 0!==e[2]?wt`
              <div role="cell" class="phase-table-value">${t.TimeUtilities.preciseMillisToString(e[2])}</div>
            `:St}
          </div>
        `))}
      </div>
    `}#i=()=>{const e=g.CrUXManager.instance().getConfigSetting().get().enabled,t=this.#Ze(),i=this.#et(),o=this.#tt(),a=this.#Xe(),l=this.#Je(),d=ut(this.#st(!0),i,a,l),c=ut(this.#st(!1),o,a,l),h=wt`
      <div class="metric-card">
        <h3 class="title">
          ${this.#Ye()}
          <devtools-button
            class="title-help"
            title=${this.#Qe()}
            .iconName=${"help"}
            .variant=${"icon"}
            @click=${()=>s.UIUtils.openInNewTab(t)}
          ></devtools-button>
        </h3>
        <div tabindex="0" class="metric-values-section"
          @mouseenter=${()=>this.#Ge(500)}
          @mouseleave=${this.#We}
          @focusin=${this.#Ge}
          @focusout=${this.#Ke}
          aria-describedby="tooltip"
        >
          <div class="metric-source-block">
            <div class="metric-source-value" id="local-value">${d}</div>
            ${e?wt`<div class="metric-source-label">${Tt(xt.localValue)}</div>`:St}
          </div>
          ${e?wt`
            <div class="metric-source-block">
              <div class="metric-source-value" id="field-value">${c}</div>
              <div class="metric-source-label">${Tt(xt.field75thPercentile)}</div>
            </div>
          `:St}
          <div
            id="tooltip"
            class="tooltip"
            role="tooltip"
            aria-label=${Tt(xt.viewCardDetails)}
            on-render=${n.Directives.nodeRenderedCallback((e=>{this.#Be=e}))}
          >
            <div class="tooltip-scroll">
              <div class="tooltip-contents">
                <div>
                  ${this.#ot()}
                  <hr class="divider">
                  ${this.#ct()}
                  ${i&&this.#Ve.phases?this.#ht(this.#Ve.phases):St}
                </div>
              </div>
            </div>
          </div>
        </div>
        ${e?wt`<hr class="divider">`:St}
        ${this.#nt()}
        ${this.#Ve.warnings?.map((e=>wt`
          <div class="warning">${e}</div>
        `))}
        ${this.#rt()}
        <slot name="extra-info"></slot>
      </div>
    `;r.render(h,this.#e,{host:this})}}customElements.define("devtools-metric-card",Ct);var $t=Object.freeze({__proto__:null,MetricCard:Ct});const{html:Pt}=r;function Lt(e){const t=C.Marked.lexer(e);return Pt`<devtools-markdown-view .data=${{tokens:t}}></devtools-markdown-view>`}var Rt={cssText:`.container{container-type:inline-size;height:100%;font-size:var(--sys-typescale-body4-size);line-height:var(--sys-typescale-body4-line-height);font-weight:var(--ref-typeface-weight-regular);user-select:text}.live-metrics-view{--min-main-area-size:60%;background-color:var(--sys-color-cdt-base-container);display:flex;flex-direction:row;width:100%;height:100%}.live-metrics,\n.next-steps{padding:16px;height:100%;overflow-y:auto;box-sizing:border-box}.live-metrics{flex:1;display:flex;flex-direction:column}.next-steps{flex:0 0 336px;box-sizing:border-box;border:none;border-left:1px solid var(--sys-color-divider)}@container (max-width: 650px){.live-metrics-view{flex-direction:column}.next-steps{flex-basis:40%;border:none;border-top:1px solid var(--sys-color-divider)}}.metric-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));width:100%}.section-title{font-size:var(--sys-typescale-headline4-size);line-height:var(--sys-typescale-headline4-line-height);font-weight:var(--ref-typeface-weight-medium);margin:0;margin-bottom:10px}.settings-card{border-radius:var(--sys-shape-corner-small);padding:14px 16px 16px;background-color:var(--sys-color-surface3);margin-bottom:16px}.record-action-card{border-radius:var(--sys-shape-corner-small);padding:12px 16px 12px 12px;background-color:var(--sys-color-surface3);margin-bottom:16px}.card-title{font-size:var(--sys-typescale-headline5-size);line-height:var(--sys-typescale-headline5-line-height);font-weight:var(--ref-typeface-weight-medium);margin:0}.settings-card .card-title{margin-bottom:4px}.device-toolbar-description{margin-bottom:12px;display:flex}.network-cache-setting{display:inline-block;max-width:max-content}.throttling-recommendation-value{font-weight:var(--ref-typeface-weight-medium)}.related-info{text-wrap:nowrap;margin-top:8px;display:flex}.related-info-label{font-weight:var(--ref-typeface-weight-medium);margin-right:4px}.related-info-link{background-color:var(--sys-color-cdt-base-container);border-radius:2px;padding:0 2px;min-width:0}.local-field-link{display:inline-block;width:fit-content;margin-top:8px}.logs-section{margin-top:24px;display:flex;flex-direction:column;flex:1 0 300px;overflow:hidden;max-height:max-content;--app-color-toolbar-background:transparent}.logs-section-header{display:flex;align-items:center}.interactions-clear{margin-left:4px;vertical-align:sub}.log{padding:0;margin:0;overflow:auto}.log-item{border:none;border-bottom:1px solid var(--sys-color-divider);&.highlight{animation:highlight-fadeout 2s}}.interaction{--phase-table-margin:120px;--details-indicator-width:18px;summary{display:flex;align-items:center;padding:7px 4px;&::before{content:" ";height:14px;width:var(--details-indicator-width);mask-image:var(--image-file-triangle-right);background-color:var(--icon-default);flex-shrink:0}}details[open] summary::before{mask-image:var(--image-file-triangle-down)}}.interaction-type{font-weight:var(--ref-typeface-weight-medium);width:calc(var(--phase-table-margin) - var(--details-indicator-width));flex-shrink:0}.interaction-inp-chip{background-color:var(--sys-color-yellow-bright);color:var(--sys-color-on-yellow);padding:0 2px}.interaction-node{flex-grow:1;margin-right:32px;min-width:0}.interaction-info{width:var(--sys-typescale-body4-line-height);height:var(--sys-typescale-body4-line-height);margin-right:6px}.interaction-duration{text-align:end;width:max-content;flex-shrink:0;font-weight:var(--ref-typeface-weight-medium)}.layout-shift{display:flex;align-items:flex-start}.layout-shift-score{margin-right:16px;padding:7px 0;width:150px;box-sizing:border-box}.layout-shift-nodes{flex:1;min-width:0}.layout-shift-node{border-bottom:1px solid var(--sys-color-divider);padding:7px 0;&:last-child{border:none}}.record-action{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px}.shortcut-label{width:max-content;flex-shrink:0}.field-data-option{margin:8px 0;max-width:100%}.field-setup-buttons{margin-top:14px}.field-data-message{margin-bottom:12px}.field-data-warning{margin-top:4px;color:var(--sys-color-error);font-size:var(--sys-typescale-body4-size);line-height:var(--sys-typescale-body4-line-height);display:flex;&::before{content:" ";width:var(--sys-typescale-body4-line-height);height:var(--sys-typescale-body4-line-height);mask-size:var(--sys-typescale-body4-line-height);mask-image:var(--image-file-warning);background-color:var(--sys-color-error);margin-right:4px;flex-shrink:0}}.collection-period-range{font-weight:var(--ref-typeface-weight-medium)}x-link{color:var(--sys-color-primary);text-decoration-line:underline}.environment-option{display:flex;align-items:center;margin-top:8px}.environment-recs-list{margin:0;padding-left:20px}.environment-rec{font-weight:var(--ref-typeface-weight-medium)}.link-to-log{padding:unset;background:unset;border:unset;font:inherit;color:var(--sys-color-primary);text-decoration:underline;cursor:pointer}@keyframes highlight-fadeout{from{background-color:var(--sys-color-yellow-container)}to{background-color:transparent}}.phase-table{border-top:1px solid var(--sys-color-divider);padding:7px 4px;margin-left:var(--phase-table-margin)}.phase-table-row{display:flex;justify-content:space-between}.phase-table-header-row{font-weight:var(--ref-typeface-weight-medium);margin-bottom:4px}.log-extra-details-button{padding:unset;background:unset;border:unset;font:inherit;color:var(--sys-color-primary);text-decoration:underline;cursor:pointer}.node-view{display:flex;align-items:center;justify-content:center;height:100%;font-size:var(--sys-typescale-body4-size);line-height:var(--sys-typescale-body4-line-height);font-weight:var(--ref-typeface-weight-regular);user-select:text;main{width:300px;max-width:100%;text-align:center;.section-title{margin-bottom:4px}}}.node-description{margin-bottom:12px}\n/*# sourceURL=${import.meta.resolve("./liveMetricsView.css")} */\n`};const It=new CSSStyleSheet;It.replaceSync(Rt.cssText);const Mt=new CSSStyleSheet;Mt.replaceSync(it.cssText);const{html:Et,nothing:Dt}=r,Ht=["AUTO",...g.DEVICE_SCOPE_LIST],Ft={localAndFieldMetrics:"Local and field metrics",localMetrics:"Local metrics",eventLogs:"Interaction and layout shift logs section",interactions:"Interactions",layoutShifts:"Layout shifts",nextSteps:"Next steps",fieldData:"Field data",environmentSettings:"Environment settings",showFieldDataForDevice:"Show field data for device type: {PH1}",notEnoughData:"Not enough data",network:"Network: {PH1}",device:"Device: {PH1}",allDevices:"All devices",desktop:"Desktop",mobile:"Mobile",tablet:"Tablet",auto:"Auto ({PH1})",loadingOption:"{PH1} - Loading…",needsDataOption:"{PH1} - No data",urlOption:"URL",originOption:"Origin",urlOptionWithKey:"URL: {PH1}",originOptionWithKey:"Origin: {PH1}",showFieldDataForPage:"Show field data for {PH1}",tryDisablingThrottling:"75th percentile is too fast to simulate with throttling",tryUsingThrottling:"75th percentile is similar to {PH1} throttling",percentDevices:"{PH1}% mobile, {PH2}% desktop",useDeviceToolbar:"Use the [device toolbar](https://developer.chrome.com/docs/devtools/device-mode) and configure throttling to simulate real user environments and identify more performance issues.",disableNetworkCache:"Disable network cache",lcpElement:"LCP element",inpInteractionLink:"INP interaction",worstCluster:"Worst cluster",numShifts:"{shiftCount, plural,\n    =1 {{shiftCount} shift}\n    other {{shiftCount} shifts}\n  }",collectionPeriod:"Collection period: {PH1}",dateRange:"{PH1} - {PH2}",seeHowYourLocalMetricsCompare:"See how your local metrics compare to real user data in the {PH1}.",localFieldLearnMoreLink:"Learn more about local and field data",localFieldLearnMoreTooltip:"Local metrics are captured from the current page using your network connection and device. Field data is measured by real users using many different network connections and devices.",interactionExcluded:"INP is calculated using the 98th percentile of interaction delays, so some interaction delays may be larger than the INP value.",clearCurrentLog:"Clear the current log",timeToFirstByte:"Time to first byte",resourceLoadDelay:"Resource load delay",resourceLoadDuration:"Resource load duration",elementRenderDelay:"Element render delay",inputDelay:"Input delay",processingDuration:"Processing duration",presentationDelay:"Presentation delay",inpInteraction:"The INP interaction is at the 98th percentile of interaction delays.",showInpInteraction:"Go to the INP interaction.",showClsCluster:"Go to worst layout shift cluster.",phase:"Phase",duration:"Local duration (ms)",logToConsole:"Log additional interaction data to the console",nodePerformanceTimeline:"Node performance",nodeClickToRecord:"Record a performance timeline of the connected Node process."},Nt=t.i18n.registerUIStrings("panels/timeline/components/LiveMetricsView.ts",Ft),zt=t.i18n.getLocalizedString.bind(void 0,Nt);class Ot extends T.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#gt=!1;#pt;#ut;#mt;#vt=new Map;#bt=[];#ft=g.CrUXManager.instance();#yt;#wt=null;#St;#xt;#kt;#Tt;#Ct;#$t=!1;#Pt=x.DeviceModeModel.DeviceModeModel.tryInstance();constructor(){super(),this.#St=S.Runtime.experiments.isEnabled("react-native-specific-ui"),this.#yt=s.ActionRegistry.ActionRegistry.instance().getAction("timeline.toggle-recording"),this.#St||(this.#wt=s.ActionRegistry.ActionRegistry.instance().getAction("timeline.record-reload"))}set isNode(e){this.#gt=e,n.ScheduledRender.scheduleRender(this,this.#i)}#Lt(e){this.#pt=e.data.lcp,this.#ut=e.data.cls,this.#mt=e.data.inp;const t=this.#bt.length<e.data.layoutShifts.length;this.#bt=[...e.data.layoutShifts];const i=this.#vt.size<e.data.interactions.size;this.#vt=new Map(e.data.interactions);const s=n.ScheduledRender.scheduleRender(this,this.#i);i&&this.#Tt&&this.#Rt(s,this.#Tt),t&&this.#Ct&&this.#Rt(s,this.#Ct)}#Rt(e,t){if(!t.checkVisibility())return;(Math.abs(t.scrollHeight-t.clientHeight-t.scrollTop)<=1||this.#$t)&&e.then((()=>{requestAnimationFrame((()=>{this.#$t=!0,t.addEventListener("scrollend",(()=>{this.#$t=!1}),{once:!0}),t.scrollTo({top:t.scrollHeight,behavior:"smooth"})}))}))}#It(){n.ScheduledRender.scheduleRender(this,this.#i)}#Mt(){n.ScheduledRender.scheduleRender(this,this.#i)}async#Et(){await this.#ft.refresh(),n.ScheduledRender.scheduleRender(this,this.#i)}connectedCallback(){this.#e.adoptedStyleSheets=[It,Mt];const e=k.LiveMetrics.instance();e.addEventListener("status",this.#Lt,this);const t=g.CrUXManager.instance();t.addEventListener("field-data-changed",this.#It,this),this.#Pt?.addEventListener("Updated",this.#Mt,this),t.getConfigSetting().get().enabled&&this.#Et(),this.#pt=e.lcpValue,this.#ut=e.clsValue,this.#mt=e.inpValue,this.#vt=e.interactions,this.#bt=e.layoutShifts,n.ScheduledRender.scheduleRender(this,this.#i)}disconnectedCallback(){k.LiveMetrics.instance().removeEventListener("status",this.#Lt,this);g.CrUXManager.instance().removeEventListener("field-data-changed",this.#It,this),this.#Pt?.removeEventListener("Updated",this.#Mt,this)}#Dt(){const e=this.#ft.getSelectedFieldMetricData("largest_contentful_paint_image_time_to_first_byte")?.percentiles?.p75,t=this.#ft.getSelectedFieldMetricData("largest_contentful_paint_image_resource_load_delay")?.percentiles?.p75,n=this.#ft.getSelectedFieldMetricData("largest_contentful_paint_image_resource_load_duration")?.percentiles?.p75,s=this.#ft.getSelectedFieldMetricData("largest_contentful_paint_image_element_render_delay")?.percentiles?.p75;return"number"!=typeof e||"number"!=typeof t||"number"!=typeof n||"number"!=typeof s?null:{timeToFirstByte:i.Types.Timing.Milli(e),resourceLoadDelay:i.Types.Timing.Milli(t),resourceLoadTime:i.Types.Timing.Milli(n),elementRenderDelay:i.Types.Timing.Milli(s)}}#Ht(){const e=this.#ft.getSelectedFieldMetricData("largest_contentful_paint"),t=this.#pt?.nodeRef?.link,i=this.#pt?.phases,n=this.#Dt();return Et`
      <devtools-metric-card .data=${{metric:"LCP",localValue:this.#pt?.value,fieldValue:e?.percentiles?.p75,histogram:e?.histogram,tooltipContainer:this.#kt,warnings:this.#pt?.warnings,phases:i&&[[zt(Ft.timeToFirstByte),i.timeToFirstByte,n?.timeToFirstByte],[zt(Ft.resourceLoadDelay),i.resourceLoadDelay,n?.resourceLoadDelay],[zt(Ft.resourceLoadDuration),i.resourceLoadTime,n?.resourceLoadTime],[zt(Ft.elementRenderDelay),i.elementRenderDelay,n?.elementRenderDelay]]}}>
        ${t?Et`
            <div class="related-info" slot="extra-info">
              <span class="related-info-label">${zt(Ft.lcpElement)}</span>
              <span class="related-info-link">${t}</span>
            </div>
          `:Dt}
      </devtools-metric-card>
    `}#Ft(){const e=this.#ft.getSelectedFieldMetricData("cumulative_layout_shift"),t=new Set(this.#ut?.clusterShiftIds||[]),i=t.size>0&&this.#bt.some((e=>t.has(e.uniqueLayoutShiftId)));return Et`
      <devtools-metric-card .data=${{metric:"CLS",localValue:this.#ut?.value,fieldValue:e?.percentiles?.p75,histogram:e?.histogram,tooltipContainer:this.#kt,warnings:this.#ut?.warnings}}>
        ${i?Et`
          <div class="related-info" slot="extra-info">
            <span class="related-info-label">${zt(Ft.worstCluster)}</span>
            <button
              class="link-to-log"
              title=${zt(Ft.showClsCluster)}
              @click=${()=>this.#Nt(t)}
              jslog=${o.action("timeline.landing.show-cls-cluster").track({click:!0})}
            >${zt(Ft.numShifts,{shiftCount:t.size})}</button>
          </div>
        `:Dt}
      </devtools-metric-card>
    `}#zt(){const e=this.#ft.getSelectedFieldMetricData("interaction_to_next_paint"),t=this.#mt?.phases,i=this.#mt&&this.#vt.get(this.#mt.interactionId);return Et`
      <devtools-metric-card .data=${{metric:"INP",localValue:this.#mt?.value,fieldValue:e?.percentiles?.p75,histogram:e?.histogram,tooltipContainer:this.#kt,warnings:this.#mt?.warnings,phases:t&&[[zt(Ft.inputDelay),t.inputDelay],[zt(Ft.processingDuration),t.processingDuration],[zt(Ft.presentationDelay),t.presentationDelay]]}}>
        ${i?Et`
          <div class="related-info" slot="extra-info">
            <span class="related-info-label">${zt(Ft.inpInteractionLink)}</span>
            <button
              class="link-to-log"
              title=${zt(Ft.showInpInteraction)}
              @click=${()=>this.#Ot(i)}
              jslog=${o.action("timeline.landing.show-inp-interaction").track({click:!0})}
            >${i.interactionType}</button>
          </div>
        `:Dt}
      </devtools-metric-card>
    `}#At(e){return Et`
      <div class="record-action">
        <devtools-button @click=${function(){e.execute()}} .data=${{variant:"text",size:"REGULAR",iconName:e.icon(),title:e.title(),jslogContext:e.id()}}>
          ${e.title()}
        </devtools-button>
        <span class="shortcut-label">${s.ShortcutRegistry.ShortcutRegistry.instance().shortcutTitleForAction(e.id())}</span>
      </div>
    `}#_t(){const e=this.#ft.getSelectedFieldMetricData("round_trip_time");if(!e?.percentiles)return null;const t=Number(e.percentiles.p75);if(!Number.isFinite(t))return null;if(t<60)return zt(Ft.tryDisablingThrottling);const i=c.ThrottlingPresets.ThrottlingPresets.getRecommendedNetworkPreset(t);if(!i)return null;const n="function"==typeof i.title?i.title():i.title;return zt(Ft.tryUsingThrottling,{PH1:n})}#Ut(){const e=this.#ft.getFieldResponse(this.#ft.fieldPageScope,"ALL")?.record.metrics.form_factors?.fractions;return e?zt(Ft.percentDevices,{PH1:Math.round(100*e.phone),PH2:Math.round(100*e.desktop)}):null}#Bt(){const e=this.#ft.getConfigSetting().get().enabled,i=document.createElement("span");i.classList.add("environment-rec"),i.textContent=this.#Ut()||zt(Ft.notEnoughData);const n=document.createElement("span");n.classList.add("environment-rec"),n.textContent=this.#_t()||zt(Ft.notEnoughData);const s=function(){let e=l.CPUThrottlingManager.CalibratedMidTierMobileThrottlingOption;0===e.rate()&&(e=l.CPUThrottlingManager.MidTierThrottlingOption);let t=null;const i=g.CrUXManager.instance().getSelectedFieldMetricData("round_trip_time");if(i?.percentiles){const e=Number(i.percentiles.p75);t=c.ThrottlingPresets.ThrottlingPresets.getRecommendedNetworkPreset(e)}return{cpuOption:e,networkConditions:t}}();return Et`
      <h3 class="card-title">${zt(Ft.environmentSettings)}</h3>
      <div class="device-toolbar-description">${Lt(zt(Ft.useDeviceToolbar))}</div>
      ${e?Et`
        <ul class="environment-recs-list">
          <li>${t.i18n.getFormatLocalizedString(Nt,Ft.device,{PH1:i})}</li>
          <li>${t.i18n.getFormatLocalizedString(Nt,Ft.network,{PH1:n})}</li>
        </ul>
      `:Dt}
      <div class="environment-option">
        <devtools-cpu-throttling-selector .recommendedOption=${s.cpuOption}></devtools-cpu-throttling-selector>
      </div>
      <div class="environment-option">
        <devtools-network-throttling-selector .recommendedConditions=${s.networkConditions}></devtools-network-throttling-selector>
      </div>
      <div class="environment-option">
        <setting-checkbox
          class="network-cache-setting"
          .data=${{setting:a.Settings.Settings.instance().moduleSetting("cache-disabled"),textOverride:zt(Ft.disableNetworkCache)}}
        ></setting-checkbox>
      </div>
    `}#Vt(e){const t=this.#ft.pageResult?.[`${e}-ALL`]?.record.key[e];if(t)return zt("url"===e?Ft.urlOptionWithKey:Ft.originOptionWithKey,{PH1:t});const i=zt("url"===e?Ft.urlOption:Ft.originOption);return zt(Ft.needsDataOption,{PH1:i})}#qt(e){"url"===e.itemValue?this.#ft.fieldPageScope="url":this.#ft.fieldPageScope="origin",n.ScheduledRender.scheduleRender(this,this.#i)}#jt(){if(!this.#ft.getConfigSetting().get().enabled)return r.nothing;const e=this.#Vt("url"),t=this.#Vt("origin"),i="url"===this.#ft.fieldPageScope?e:t,n=zt(Ft.showFieldDataForPage,{PH1:i}),s=!this.#ft.pageResult?.["url-ALL"]&&!this.#ft.pageResult?.["origin-ALL"];return Et`
      <devtools-select-menu
        id="page-scope-select"
        class="field-data-option"
        @selectmenuselected=${this.#qt}
        .showDivider=${!0}
        .showArrow=${!0}
        .sideButton=${!1}
        .showSelectedItem=${!0}
        .buttonTitle=${i}
        .disabled=${s}
        title=${n}
      >
        <devtools-menu-item
          .value=${"url"}
          .selected=${"url"===this.#ft.fieldPageScope}
        >
          ${e}
        </devtools-menu-item>
        <devtools-menu-item
          .value=${"origin"}
          .selected=${"origin"===this.#ft.fieldPageScope}
        >
          ${t}
        </devtools-menu-item>
      </devtools-select-menu>
    `}#Wt(e){switch(e){case"ALL":return zt(Ft.allDevices);case"DESKTOP":return zt(Ft.desktop);case"PHONE":return zt(Ft.mobile);case"TABLET":return zt(Ft.tablet)}}#Kt(e){let t;if("AUTO"===e){const i=this.#ft.resolveDeviceOptionToScope(e),n=this.#Wt(i);t=zt(Ft.auto,{PH1:n})}else t=this.#Wt(e);if(!this.#ft.pageResult)return zt(Ft.loadingOption,{PH1:t});return this.#ft.getSelectedFieldResponse()?t:zt(Ft.needsDataOption,{PH1:t})}#Gt(e){this.#ft.fieldDeviceOption=e.itemValue,n.ScheduledRender.scheduleRender(this,this.#i)}#Yt(){if(!this.#ft.getConfigSetting().get().enabled)return r.nothing;const e=!this.#ft.getFieldResponse(this.#ft.fieldPageScope,"ALL"),t=this.#Kt(this.#ft.fieldDeviceOption);return Et`
      <devtools-select-menu
        id="device-scope-select"
        class="field-data-option"
        @selectmenuselected=${this.#Gt}
        .showDivider=${!0}
        .showArrow=${!0}
        .sideButton=${!1}
        .showSelectedItem=${!0}
        .buttonTitle=${zt(Ft.device,{PH1:t})}
        .disabled=${e}
        title=${zt(Ft.showFieldDataForDevice,{PH1:t})}
      >
        ${Ht.map((e=>Et`
            <devtools-menu-item
              .value=${e}
              .selected=${this.#ft.fieldDeviceOption===e}
            >
              ${this.#Kt(e)}
            </devtools-menu-item>
          `))}
      </devtools-select-menu>
    `}#Xt(){const e=this.#ft.getSelectedFieldResponse();if(!e)return null;const{firstDate:t,lastDate:i}=e.record.collectionPeriod,n=new Date(t.year,t.month-1,t.day),s=new Date(i.year,i.month-1,i.day),r={year:"numeric",month:"short",day:"numeric"};return zt(Ft.dateRange,{PH1:n.toLocaleDateString(void 0,r),PH2:s.toLocaleDateString(void 0,r)})}#Jt(){const e=this.#Xt(),i=document.createElement("span");i.classList.add("collection-period-range"),i.textContent=e||zt(Ft.notEnoughData);const n=t.i18n.getFormatLocalizedString(Nt,Ft.collectionPeriod,{PH1:i}),s=this.#ft.pageResult?.warnings||[];return Et`
      <div class="field-data-message">
        <div>${n}</div>
        ${s.map((e=>Et`
          <div class="field-data-warning">${e}</div>
        `))}
      </div>
    `}#Zt(){if(this.#ft.getConfigSetting().get().enabled)return this.#Jt();const e=s.XLink.XLink.create("https://developer.chrome.com/docs/crux",t.i18n.lockedString("Chrome UX Report")),i=t.i18n.getFormatLocalizedString(Nt,Ft.seeHowYourLocalMetricsCompare,{PH1:e});return Et`
      <div class="field-data-message">${i}</div>
    `}#Qt(){return Et`
      <section class="logs-section" aria-label=${zt(Ft.eventLogs)}>
        <devtools-live-metrics-logs
          on-render=${n.Directives.nodeRenderedCallback((e=>{this.#xt=e}))}
        >
          ${this.#ei()}
          ${this.#ti()}
        </devtools-live-metrics-logs>
      </section>
    `}async#Ot(e){const t=this.#e.getElementById(e.interactionId);if(!t||!this.#xt)return;this.#xt.selectTab("interactions")&&await p.write((()=>{t.scrollIntoView({block:"center"}),t.focus(),s.UIUtils.runCSSAnimationOnce(t,"highlight")}))}async#ii(e){await k.LiveMetrics.instance().logInteractionScripts(e)&&await a.Console.Console.instance().showPromise()}#ei(){return this.#vt.size?Et`
      <ol class="log"
        slot="interactions-log-content"
        on-render=${n.Directives.nodeRenderedCallback((e=>{this.#Tt=e}))}
      >
        ${this.#vt.values().map((e=>{const i=ut("timeline.landing.interaction-event-timing",e.duration,gt,(e=>t.TimeUtilities.preciseMillisToString(e)),{dim:!0}),n=this.#mt&&this.#mt.value<e.duration,s=this.#mt?.interactionId===e.interactionId;return Et`
            <li id=${e.interactionId} class="log-item interaction" tabindex="-1">
              <details>
                <summary>
                  <span class="interaction-type">
                    ${e.interactionType}
                    ${s?Et`<span class="interaction-inp-chip" title=${zt(Ft.inpInteraction)}>INP</span>`:Dt}
                  </span>
                  <span class="interaction-node">${e.nodeRef?.link}</span>
                  ${n?Et`<devtools-icon
                    class="interaction-info"
                    name="info"
                    title=${zt(Ft.interactionExcluded)}
                  ></devtools-icon>`:Dt}
                  <span class="interaction-duration">${i}</span>
                </summary>
                <div class="phase-table" role="table">
                  <div class="phase-table-row phase-table-header-row" role="row">
                    <div role="columnheader">${zt(Ft.phase)}</div>
                    <div role="columnheader">
                      ${e.longAnimationFrameTimings.length?Et`
                        <button
                          class="log-extra-details-button"
                          title=${zt(Ft.logToConsole)}
                          @click=${()=>this.#ii(e)}
                        >${zt(Ft.duration)}</button>
                      `:zt(Ft.duration)}
                    </div>
                  </div>
                  <div class="phase-table-row" role="row">
                    <div role="cell">${zt(Ft.inputDelay)}</div>
                    <div role="cell">${Math.round(e.phases.inputDelay)}</div>
                  </div>
                  <div class="phase-table-row" role="row">
                    <div role="cell">${zt(Ft.processingDuration)}</div>
                    <div role="cell">${Math.round(e.phases.processingDuration)}</div>
                  </div>
                  <div class="phase-table-row" role="row">
                    <div role="cell">${zt(Ft.presentationDelay)}</div>
                    <div role="cell">${Math.round(e.phases.presentationDelay)}</div>
                  </div>
                </div>
              </details>
            </li>
          `}))}
      </ol>
    `:r.nothing}async#Nt(e){if(!this.#xt)return;const t=[];for(const i of e){const e=this.#e.getElementById(i);e&&t.push(e)}if(!t.length)return;this.#xt.selectTab("layout-shifts")&&await p.write((()=>{t[0].scrollIntoView({block:"start"}),t[0].focus();for(const e of t)s.UIUtils.runCSSAnimationOnce(e,"highlight")}))}#ti(){return this.#bt.length?Et`
      <ol class="log"
        slot="layout-shifts-log-content"
        on-render=${n.Directives.nodeRenderedCallback((e=>{this.#Ct=e}))}
      >
        ${this.#bt.map((e=>{const t=ut("timeline.landing.layout-shift-event-score",e.score,ht,(e=>e.toFixed(4)),{dim:!0});return Et`
            <li id=${e.uniqueLayoutShiftId} class="log-item layout-shift" tabindex="-1">
              <div class="layout-shift-score">Layout shift score: ${t}</div>
              <div class="layout-shift-nodes">
                ${e.affectedNodeRefs.map((({link:e})=>Et`
                  <div class="layout-shift-node">${e}</div>
                `))}
              </div>
            </li>
          `}))}
      </ol>
    `:r.nothing}#ni(){return Et`
      <div class="node-view">
        <main>
          <h2 class="section-title">${zt(Ft.nodePerformanceTimeline)}</h2>
          <div class="node-description">${zt(Ft.nodeClickToRecord)}</div>
          <div class="record-action-card">${this.#At(this.#yt)}</div>
        </main>
      </div>
    `}#i=()=>{if(this.#gt)return void r.render(this.#ni(),this.#e,{host:this});const e=this.#ft.getConfigSetting().get().enabled,t=zt(e?Ft.localAndFieldMetrics:Ft.localMetrics),i=Et`
      <div class="container">
        <div class="live-metrics-view">
          <main class="live-metrics">
            <h2 class="section-title">${t}</h2>
            <div class="metric-cards"
              on-render=${n.Directives.nodeRenderedCallback((e=>{this.#kt=e}))}
            >
              <div id="lcp">
                ${this.#Ht()}
              </div>
              <div id="cls">
                ${this.#Ft()}
              </div>
              <div id="inp">
                ${this.#zt()}
              </div>
            </div>
            <x-link
              href=${"https://web.dev/articles/lab-and-field-data-differences#lab_data_versus_field_data"}
              class="local-field-link"
              title=${zt(Ft.localFieldLearnMoreTooltip)}
            >${zt(Ft.localFieldLearnMoreLink)}</x-link>
            ${this.#Qt()}
          </main>
          <aside class="next-steps" aria-labelledby="next-steps-section-title">
            <h2 id="next-steps-section-title" class="section-title">${zt(Ft.nextSteps)}</h2>
            <div id="field-setup" class="settings-card">
              <h3 class="card-title">${zt(Ft.fieldData)}</h3>
              ${this.#Zt()}
              ${this.#jt()}
              ${this.#Yt()}
              <div class="field-setup-buttons">
                <devtools-field-settings-dialog></devtools-field-settings-dialog>
              </div>
            </div>
            <div id="recording-settings" class="settings-card">
              ${this.#Bt()}
            </div>
            <div id="record" class="record-action-card">
              ${this.#At(this.#yt)}
            </div>
            ${null!==this.#wt?Et`<div id="record-page-load" class="record-action-card">
              ${this.#At(this.#wt)}
            </div>`:Dt}
          </aside>
        </div>
      </div>
    `;r.render(i,this.#e,{host:this})}}class At extends s.Widget.WidgetElement{#si;constructor(){super(),this.style.display="contents"}selectTab(e){return!!this.#si&&this.#si.selectTab(e)}#ri(){const e=k.LiveMetrics.instance();switch(this.#si?.selectedTabId){case"interactions":e.clearInteractions();break;case"layout-shifts":e.clearLayoutShifts()}}createWidget(){const e=new s.Widget.Widget(!0,void 0,this);e.contentElement.style.display="contents",this.#si=new s.TabbedPane.TabbedPane;const t=document.createElement("slot");t.name="interactions-log-content";const i=s.Widget.Widget.getOrCreateWidget(t);this.#si.appendTab("interactions",zt(Ft.interactions),i,void 0,void 0,void 0,void 0,void 0,"timeline.landing.interactions-log");const n=document.createElement("slot");n.name="layout-shifts-log-content";const r=s.Widget.Widget.getOrCreateWidget(n);this.#si.appendTab("layout-shifts",zt(Ft.layoutShifts),r,void 0,void 0,void 0,void 0,void 0,"timeline.landing.layout-shifts-log");const o=new s.Toolbar.ToolbarButton(zt(Ft.clearCurrentLog),"clear",void 0,"timeline.landing.clear-log");return o.addEventListener("Click",this.#ri,this),this.#si.rightToolbar().appendToolbarItem(o),this.#si.show(e.contentElement),e}}customElements.define("devtools-live-metrics-view",Ot),customElements.define("devtools-live-metrics-logs",At);var _t=Object.freeze({__proto__:null,LiveMetricsView:Ot}),Ut={cssText:`.network-request-details-title{font-size:13px;padding:8px;display:flex;align-items:center}.network-request-details-title > div{box-sizing:border-box;width:12px;height:12px;border:1px solid var(--sys-color-divider);display:inline-block;margin-right:4px}.network-request-details-content{border-bottom:1px solid var(--sys-color-divider)}.network-request-details-cols{display:flex;justify-content:space-between;width:fit-content}:host{display:contents}.network-request-details-col{width:300px}.column-divider{border-left:1px solid var(--sys-color-divider)}.network-request-details-col.server-timings{display:grid;grid-template-columns:1fr 1fr 1fr;width:fit-content;width:450px;gap:0}.network-request-details-item, .network-request-details-col{padding:5px 10px}.server-timing-column-header{font-weight:var(--ref-typeface-weight-medium)}.network-request-details-row{min-height:min-content;display:flex;justify-content:space-between}.title{color:var(--sys-color-token-subtle);overflow:hidden;padding-right:10px;display:inline-block;vertical-align:top}.value{display:inline-block;user-select:text;text-overflow:ellipsis;overflow:hidden}.devtools-link,\n.timeline-link{color:var(--text-link);text-decoration:underline;outline-offset:2px;padding:0;text-align:left;.elements-disclosure &{color:var(--text-link)}devtools-icon{vertical-align:baseline;color:var(--sys-color-primary)}:focus .selected & devtools-icon{color:var(--sys-color-tonal-container)}&:focus-visible{outline-width:unset}&.invalid-link{color:var(--text-disabled);text-decoration:none}&:not(.devtools-link-prevent-click, .invalid-link){cursor:pointer}@media (forced-colors: active){&:not(.devtools-link-prevent-click){forced-color-adjust:none;color:linktext}&:focus-visible{background:Highlight;color:HighlightText}}}.text-button.link-style,\n.text-button.link-style:hover,\n.text-button.link-style:active{background:none;border:none;font:inherit}\n/*# sourceURL=${import.meta.resolve("./networkRequestDetails.css")} */\n`},Bt={cssText:`.bold{font-weight:bold}.url{margin-left:15px;margin-right:5px}.url--host{color:var(--sys-color-token-subtle)}.priority-row{margin-left:15px}.network-category-chip{box-sizing:border-box;width:10px;height:10px;border:1px solid var(--sys-color-divider);display:inline-block;margin-right:4px}devtools-icon.priority{height:13px;width:13px;color:var(--sys-color-on-surface-subtle)}.render-blocking{margin-left:15px;color:var(--sys-color-error)}.divider{border-top:1px solid var(--sys-color-divider);margin:5px 0}.timings-row{align-self:start;display:flex;align-items:center}.indicator{display:inline-block;width:10px;height:4px;margin-right:5px;border:1px solid var(--sys-color-on-surface-subtle)}.whisker-left{align-self:center;display:inline-flex;width:10px;height:6px;margin-right:5px;border-left:1px solid var(--sys-color-on-surface-subtle)}.whisker-right{align-self:center;display:inline-flex;width:10px;height:6px;margin-right:5px;border-right:1px solid var(--sys-color-on-surface-subtle)}.horizontal{background-color:var(--sys-color-on-surface-subtle);height:1px;width:10px;align-self:center}.time{margin-left:auto;display:inline-block;padding-left:10px}.timings-row--duration{.indicator{border-color:transparent}.time{font-weight:var(--ref-typeface-weight-medium)}}\n/*# sourceURL=${import.meta.resolve("./networkRequestTooltip.css")} */\n`};const Vt=new CSSStyleSheet;Vt.replaceSync(Bt.cssText);const{html:qt}=r,jt={priority:"Priority",duration:"Duration",queuingAndConnecting:"Queuing and connecting",requestSentAndWaiting:"Request sent and waiting",contentDownloading:"Content downloading",waitingOnMainThread:"Waiting on main thread",renderBlocking:"Render blocking"},Wt=t.i18n.registerUIStrings("panels/timeline/components/NetworkRequestTooltip.ts",jt),Kt=t.i18n.getLocalizedString.bind(void 0,Wt);class Gt extends HTMLElement{#e=this.attachShadow({mode:"open"});#Ve={networkRequest:null,entityMapper:null};connectedCallback(){this.#e.adoptedStyleSheets=[Vt],this.#i()}set data(e){this.#Ve.networkRequest!==e.networkRequest&&this.#Ve.entityMapper!==e.entityMapper&&(this.#Ve={networkRequest:e.networkRequest,entityMapper:e.entityMapper},this.#i())}static renderPriorityValue(e){return e.args.data.priority===e.args.data.initialPriority?qt`${$.NetworkPriorities.uiLabelForNetworkPriority(e.args.data.priority)}`:qt`${$.NetworkPriorities.uiLabelForNetworkPriority(e.args.data.initialPriority)}
        <devtools-icon name=${"arrow-forward"} class="priority"></devtools-icon>
        ${$.NetworkPriorities.uiLabelForNetworkPriority(e.args.data.priority)}`}static renderTimings(e){const i=e.args.data.syntheticData,n=i.sendStartTime-e.ts,s=i.downloadStart-i.sendStartTime,o=i.finishTime-i.downloadStart,a=e.ts+e.dur-i.finishTime,l=dt(e),d={backgroundColor:`color-mix(in srgb, ${l}, hsla(0, 100%, 100%, 0.8))`},c={backgroundColor:l},h=qt`<span class="whisker-left"> <span class="horizontal"></span> </span>`,g=qt`<span class="whisker-right"> <span class="horizontal"></span> </span>`;return qt`
      <div class="timings-row timings-row--duration">
        <span class="indicator"></span>
        ${Kt(jt.duration)}
         <span class="time">${t.TimeUtilities.formatMicroSecondsTime(e.dur)}</span>
      </div>
      <div class="timings-row">
        ${h}
        ${Kt(jt.queuingAndConnecting)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(n)}</span>
      </div>
      <div class="timings-row">
        <span class="indicator" style=${r.Directives.styleMap(d)}></span>
        ${Kt(jt.requestSentAndWaiting)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(s)}</span>
      </div>
      <div class="timings-row">
        <span class="indicator" style=${r.Directives.styleMap(c)}></span>
        ${Kt(jt.contentDownloading)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(o)}</span>
      </div>
      <div class="timings-row">
        ${g}
        ${Kt(jt.waitingOnMainThread)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(a)}</span>
      </div>
    `}#i(){if(!this.#Ve.networkRequest)return;const e={backgroundColor:`${dt(this.#Ve.networkRequest)}`},t=new URL(this.#Ve.networkRequest.args.data.url),n=this.#Ve.entityMapper?this.#Ve.entityMapper.entityForEvent(this.#Ve.networkRequest):null,s=f.Helpers.formatOriginWithEntity(t,n,!0),o=qt`
      <div class="performance-card">
        <div class="url">${h.StringUtilities.trimMiddle(t.href.replace(t.origin,""),60)}</div>
        <div class="url url--host">${s}</div>

        <div class="divider"></div>
        <div class="network-category"><span class="network-category-chip" style=${r.Directives.styleMap(e)}></span>${at(this.#Ve.networkRequest)}</div>
        <div class="priority-row">${Kt(jt.priority)}: ${Gt.renderPriorityValue(this.#Ve.networkRequest)}</div>
        ${i.Helpers.Network.isSyntheticNetworkRequestEventRenderBlocking(this.#Ve.networkRequest)?qt`<div class="render-blocking"> ${Kt(jt.renderBlocking)} </div>`:r.nothing}
        <div class="divider"></div>

        ${Gt.renderTimings(this.#Ve.networkRequest)}
      </div>
    `;r.render(o,this.#e,{host:this})}}customElements.define("devtools-performance-network-request-tooltip",Gt);var Yt=Object.freeze({__proto__:null,NetworkRequestTooltip:Gt});const Xt=new CSSStyleSheet;Xt.replaceSync(Ut.cssText);const Jt=new CSSStyleSheet;Jt.replaceSync(Bt.cssText);const{html:Zt}=r,Qt={requestMethod:"Request method",protocol:"Protocol",priority:"Priority",encodedData:"Encoded data",decodedBody:"Decoded body",yes:"Yes",no:"No",networkRequest:"Network request",fromCache:"From cache",mimeType:"MIME type",FromMemoryCache:" (from memory cache)",FromCache:" (from cache)",FromPush:" (from push)",FromServiceWorker:" (from `service worker`)",initiatedBy:"Initiated by",blocking:"Blocking",inBodyParserBlocking:"In-body parser blocking",renderBlocking:"Render blocking",entity:"3rd party",serverTiming:"Server timing",time:"Time",description:"Description"},ei=t.i18n.registerUIStrings("panels/timeline/components/NetworkRequestDetails.ts",Qt),ti=t.i18n.getLocalizedString.bind(void 0,ei);class ii extends HTMLElement{#e=this.attachShadow({mode:"open"});#oi=null;#ai=null;#li=new WeakMap;#di;#ve=null;#ci=null;#hi=null;constructor(e){super(),this.#di=e}connectedCallback(){this.#e.adoptedStyleSheets=[Xt,Jt]}async setData(e,t,i,n){if(this.#oi!==t||e!==this.#ve){this.#ve=e,this.#oi=t,this.#ai=i,this.#ci=n,this.#hi=null;for(const e of t.args.data.responseHeaders){const t=e.name.toLocaleLowerCase();if("server-timing"===t||"server-timing-test"===t){e.name="server-timing",this.#hi=l.ServerTiming.ServerTiming.parseHeaders([e]);break}}await this.#i()}}#fe(){if(!this.#oi)return null;const e={backgroundColor:`${dt(this.#oi)}`};return Zt`
      <div class="network-request-details-title">
        <div style=${r.Directives.styleMap(e)}></div>
        ${ti(Qt.networkRequest)}
      </div>
    `}#gi(e,t){return t?Zt`
      <div class="network-request-details-row"><div class="title">${e}</div><div class="value">${t}</div></div>
    `:null}#pi(){return this.#hi?Zt`
      <div class="column-divider"></div>
      <div class="network-request-details-col server-timings">
          <div class="server-timing-column-header">${ti(Qt.serverTiming)}</div>
          <div class="server-timing-column-header">${ti(Qt.time)}</div>
          <div class="server-timing-column-header">${ti(Qt.description)}</div>
        ${this.#hi.map((e=>Zt`
              <div class="value">${e.metric||"-"}</div>
              <div class="value">${e.value||"-"}</div>
              <div class="value">${e.description||"-"}</div>
          `))}
      </div>
    `:r.nothing}#ui(){if(!this.#oi)return null;const e={tabStop:!0,showColumnNumber:!1,inlineFrameIndex:0,maxLength:100},t=b.Linkifier.Linkifier.linkifyURL(this.#oi.args.data.url,e),i=l.TraceObject.RevealableNetworkRequest.create(this.#oi);if(i){t.addEventListener("contextmenu",(e=>{if(!this.#oi)return;const t=new s.ContextMenu.ContextMenu(e);t.appendApplicableItems(i),t.show()}));const e=Zt`
        ${t}
        <devtools-request-link-icon .data=${{request:i.networkRequest}}>
        </devtools-request-link-icon>
      `;return Zt`<div class="network-request-details-item">${e}</div>`}return Zt`<div class="network-request-details-item">${t}</div>`}#mi(){if(!this.#oi)return null;const e=this.#oi.args.data.syntheticData.isMemoryCached||this.#oi.args.data.syntheticData.isDiskCached;return this.#gi(ti(Qt.fromCache),ti(e?Qt.yes:Qt.no))}#vi(){if(!this.#ci||!this.#oi)return null;const e=this.#ci.entityForEvent(this.#oi);return e?this.#gi(ti(Qt.entity),e.name):null}#bi(){if(!this.#oi)return null;let e="";return this.#oi.args.data.syntheticData.isMemoryCached?e+=ti(Qt.FromMemoryCache):this.#oi.args.data.syntheticData.isDiskCached?e+=ti(Qt.FromCache):this.#oi.args.data.timing?.pushStart&&(e+=ti(Qt.FromPush)),this.#oi.args.data.fromServiceWorker&&(e+=ti(Qt.FromServiceWorker)),!this.#oi.args.data.encodedDataLength&&e||(e=`${t.ByteUtilities.bytesToString(this.#oi.args.data.encodedDataLength)}${e}`),this.#gi(ti(Qt.encodedData),e)}#fi(){if(!this.#oi)return null;let e=null;if(null!==i.Helpers.Trace.stackTraceInEvent(this.#oi)){const t=i.Helpers.Trace.getZeroIndexedStackTraceForEvent(this.#oi)?.at(0)??null;t&&(e=this.#di.maybeLinkifyConsoleCallFrame(this.#ai,t,{tabStop:!0,inlineFrameIndex:0,showColumnNumber:!0}))}const t=this.#ve?.NetworkRequests.eventToInitiator.get(this.#oi);return t&&(e=this.#di.maybeLinkifyScriptLocation(this.#ai,null,t.args.data.url,void 0)),e?Zt`
      <div class="network-request-details-item"><div class="title">${ti(Qt.initiatedBy)}</div><div class="value">${e}</div></div>
    `:null}#yi(){if(!this.#oi||!v.Network.isSyntheticNetworkRequestEventRenderBlocking(this.#oi))return null;let e;switch(this.#oi.args.data.renderBlocking){case"blocking":e=Qt.renderBlocking;break;case"in_body_parser_blocking":e=Qt.inBodyParserBlocking;break;default:return null}return this.#gi(ti(Qt.blocking),e)}async#wi(){if(!this.#oi)return null;if(!this.#li.get(this.#oi)&&this.#oi.args.data.url&&this.#ai){const e=await b.ImagePreview.ImagePreview.build(this.#ai,this.#oi.args.data.url,!1,{imageAltText:b.ImagePreview.ImagePreview.defaultAltTextForImageURL(this.#oi.args.data.url),precomputedFeatures:void 0,align:"start",hideFileData:!0});this.#li.set(this.#oi,e)}const e=this.#li.get(this.#oi);return e?Zt`<div class="network-request-details-item">${e}</div>`:null}async#i(){if(!this.#oi)return;const e=this.#oi.args.data,i=Zt`
      <div class="network-request-details-content">
        ${this.#fe()}
        ${this.#ui()}
        ${await this.#wi()}
        <div class="network-request-details-cols">
          <div class="network-request-details-col">
            ${this.#gi(ti(Qt.requestMethod),e.requestMethod)}
            ${this.#gi(ti(Qt.protocol),e.protocol)}
            ${this.#gi(ti(Qt.priority),Gt.renderPriorityValue(this.#oi))}
            ${this.#gi(ti(Qt.mimeType),e.mimeType)}
            ${this.#bi()}
            ${this.#gi(ti(Qt.decodedBody),t.ByteUtilities.bytesToString(this.#oi.args.data.decodedBodyLength))}
            ${this.#yi()}
            ${this.#mi()}
            ${this.#vi()}
          </div>
          <div class="column-divider"></div>
          <div class="network-request-details-col">
            <div class="timing-rows">
              ${Gt.renderTimings(this.#oi)}
            </div>
          </div>
          ${this.#pi()}
        </div>
        ${this.#fi()}
      </div>
    `;r.render(i,this.#e,{host:this})}}customElements.define("devtools-performance-network-request-details",ii);var ni=Object.freeze({__proto__:null,NetworkRequestDetails:ii}),si={cssText:`:host{display:block;border-bottom:1px solid var(--sys-color-divider);flex:none}ul{list-style:none;margin:0;display:flex;flex-wrap:wrap;gap:var(--sys-size-4);padding:0 var(--sys-size-4);justify-content:flex-start;align-items:center}.insight-chip button{background:none;user-select:none;font:var(--sys-typescale-body4-regular);border:var(--sys-size-1) solid var(--sys-color-primary);border-radius:var(--sys-shape-corner-extra-small);display:flex;margin:var(--sys-size-4) 0;padding:var(--sys-size-2) var(--sys-size-4) var(--sys-size-2) var(--sys-size-4);width:max-content;white-space:pre;.keyword{color:var(--sys-color-primary);padding-right:var(--sys-size-3)}}.insight-chip button:hover{background-color:var(--sys-color-state-hover-on-subtle);cursor:pointer;transition:opacity 0.2s ease}.insight-message-box{background:var(--sys-color-surface-yellow);border-radius:var(--sys-shape-corner-extra-small);font:var(--sys-typescale-body4-regular);margin:var(--sys-size-4) 0;button{color:var(--sys-color-on-surface-yellow);border:none;text-align:left;background:none;padding:var(--sys-size-4) var(--sys-size-5);width:100%;max-width:500px;.insight-label{color:var(--sys-color-orange-bright);padding-right:var(--sys-size-3);font-weight:var(--ref-typeface-weight-medium);margin-bottom:var(--sys-size-2)}&:hover{background-color:var(--sys-color-state-hover-on-subtle);cursor:pointer;transition:opacity 0.2s ease}}}\n/*# sourceURL=${import.meta.resolve("./relatedInsightChips.css")} */\n`};const ri=new CSSStyleSheet;ri.replaceSync(si.cssText);const{html:oi}=r,ai={insightKeyword:"Insight",insightWithName:"Insight: {PH1}"},li=t.i18n.registerUIStrings("panels/timeline/components/RelatedInsightChips.ts",ai),di=t.i18n.getLocalizedString.bind(void 0,li);class ci extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#Ve={eventToRelatedInsightsMap:new Map,activeEvent:null};connectedCallback(){this.#e.adoptedStyleSheets=[ri],this.#i()}set activeEvent(e){e!==this.#Ve.activeEvent&&(this.#Ve.activeEvent=e,n.ScheduledRender.scheduleRender(this,this.#t))}set eventToRelatedInsightsMap(e){this.#Ve.eventToRelatedInsightsMap=e,n.ScheduledRender.scheduleRender(this,this.#t)}#Si(e){return t=>{t.preventDefault(),e.activateInsight()}}#i(){const{activeEvent:e,eventToRelatedInsightsMap:t}=this.#Ve,i=e?t.get(e)??[]:[];if(!e||0===t.size||0===i.length)return void r.render(oi``,this.#e,{host:this});const n=i.flatMap((e=>e.messages.map((t=>oi`
        <li class="insight-message-box">
          <button type="button" @click=${this.#Si(e)}>
            <div class="insight-label">${di(ai.insightWithName,{PH1:e.insightLabel})}</div>
            <div class="insight-message">${t}</div>
          </button>
        </li>
      `)))),s=i.flatMap((e=>[oi`
        <li class="insight-chip">
          <button type="button" @click=${this.#Si(e)}>
            <span class="keyword">${di(ai.insightKeyword)}</span>
            <span class="insight-label">${e.insightLabel}</span>
          </button>
        </li>
      `]));r.render(oi`
      <ul>${n}</ul>
      <ul>${s}</ul>
    `,this.#e,{host:this})}}customElements.define("devtools-related-insight-chips",ci);var hi=Object.freeze({__proto__:null,RelatedInsightChips:ci}),gi={cssText:`:host{display:block;height:100%}.annotations{display:flex;flex-direction:column;height:100%;padding:0}.visibility-setting{margin-top:auto}.annotation-container{display:flex;justify-content:space-between;align-items:center;padding:0 var(--sys-size-4);.delete-button{visibility:hidden;border:none;background:none}&:hover,\n  &:focus-within{background-color:var(--sys-color-neutral-container);button.delete-button{visibility:visible}}}.annotation{display:flex;flex-direction:column;align-items:flex-start;word-break:normal;overflow-wrap:anywhere;padding:var(--sys-size-8) 0;gap:6px}.annotation-identifier{padding:4px 8px;border-radius:10px;font-weight:bold;&.time-range{background-color:var(--app-color-performance-sidebar-time-range);color:var(--app-color-performance-sidebar-label-text-light)}}.entries-link{display:flex;flex-wrap:wrap;row-gap:2px;align-items:center}.label{font-size:larger}.annotation-tutorial-container{padding:10px}.tutorial-card{display:block;position:relative;margin:10px 0;padding:10px;border-radius:var(--sys-shape-corner-extra-small);overflow:hidden;border:1px solid var(--sys-color-divider);background-color:var(--sys-color-base)}.tutorial-image{display:flex;justify-content:center;& > img{max-width:100%;height:auto}}.tutorial-title,\n.tutorial-description{margin:5px 0}\n/*# sourceURL=${import.meta.resolve("./sidebarAnnotationsTab.css")} */\n`};const pi=new CSSStyleSheet;pi.replaceSync(gi.cssText);const{html:ui}=r,mi=new URL("../../../Images/performance-panel-diagram.svg",import.meta.url).toString(),vi=new URL("../../../Images/performance-panel-entry-label.svg",import.meta.url).toString(),bi=new URL("../../../Images/performance-panel-time-range.svg",import.meta.url).toString(),fi=new URL("../../../Images/performance-panel-delete-annotation.svg",import.meta.url).toString(),yi={annotationGetStarted:"Annotate a trace for yourself and others",entryLabelTutorialTitle:"Label an item",entryLabelTutorialDescription:"Double-click on an item and type to create an item label.",entryLinkTutorialTitle:"Connect two items",entryLinkTutorialDescription:"Double-click on an item, click on the adjacent rightward arrow, then select the destination item.",timeRangeTutorialTitle:"Define a time range",timeRangeTutorialDescription:"Shift-drag in the flamechart then type to create a time range annotation.",deleteAnnotationTutorialTitle:"Delete an annotation",deleteAnnotationTutorialDescription:"Hover over the list in the sidebar with Annotations tab selected to access the delete function.",deleteButton:"Delete annotation: {PH1}",entryLabelDescriptionLabel:'A "{PH1}" event annotated with the text "{PH2}"',timeRangeDescriptionLabel:"A time range starting at {PH1} and ending at {PH2}",entryLinkDescriptionLabel:'A link between a "{PH1}" event and a "{PH2}" event'},wi=t.i18n.registerUIStrings("panels/timeline/components/SidebarAnnotationsTab.ts",yi),Si=t.i18n.getLocalizedString.bind(void 0,wi);class xi extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#xi=[];#ki=new Map;#Ti;constructor(){super(),this.#Ti=a.Settings.Settings.instance().moduleSetting("annotations-hidden")}deduplicatedAnnotations(){return this.#xi}set annotations(e){this.#xi=this.#Ci(e),n.ScheduledRender.scheduleRender(this,this.#t)}set annotationEntryToColorMap(e){this.#ki=e}#Ci(e){const t=new Set,i=e.filter((e=>{if(this.#$i(e))return!0;if("ENTRIES_LINK"===e.type||"ENTRY_LABEL"===e.type){const i="ENTRIES_LINK"===e.type?e.entryFrom:e.entry;if(t.has(i))return!1;t.add(i)}return!0}));return i.sort(((e,t)=>this.#Pi(e)-this.#Pi(t))),i}#Pi(e){switch(e.type){case"ENTRY_LABEL":return e.entry.ts;case"ENTRIES_LINK":return e.entryFrom.ts;case"TIME_RANGE":return e.bounds.min;default:h.assertNever(e,`Invalid annotation type ${e}`)}}#$i(e){switch(e.type){case"ENTRY_LABEL":return e.label.length>0;case"ENTRIES_LINK":return Boolean(e.entryTo);case"TIME_RANGE":return e.bounds.range>0}}connectedCallback(){this.#e.adoptedStyleSheets=[pi],n.ScheduledRender.scheduleRender(this,this.#t)}#Li(e){if(e.entryTo){const t=f.EntryName.nameForEntry(e.entryTo),i=this.#ki.get(e.entryTo)??"",n={backgroundColor:i,color:ki(i)};return ui`
        <span class="annotation-identifier" style=${r.Directives.styleMap(n)}>
          ${t}
        </span>`}return r.nothing}#Ri(t){switch(t.type){case"ENTRY_LABEL":{const e=f.EntryName.nameForEntry(t.entry),i=this.#ki.get(t.entry)??"",n={backgroundColor:i,color:ki(i)};return ui`
              <span class="annotation-identifier" style=${r.Directives.styleMap(n)}>
                ${e}
              </span>
        `}case"TIME_RANGE":{const n=e.TraceBounds.BoundsManager.instance().state()?.milli.entireTraceBounds.min??0,s=Math.round(i.Helpers.Timing.microToMilli(t.bounds.min)-n),r=Math.round(i.Helpers.Timing.microToMilli(t.bounds.max)-n);return ui`
              <span class="annotation-identifier time-range">
                ${s} - ${r} ms
              </span>
        `}case"ENTRIES_LINK":{const e=f.EntryName.nameForEntry(t.entryFrom),i=this.#ki.get(t.entryFrom)??"",n={backgroundColor:i,color:ki(i)};return ui`
          <div class="entries-link">
            <span class="annotation-identifier" style=${r.Directives.styleMap(n)}>
              ${e}
            </span>
            <devtools-icon class="inline-icon" .data=${{iconName:"arrow-forward",color:"var(--icon-default)",width:"18px",height:"18px"}}>
            </devtools-icon>
            ${this.#Li(t)}
          </div>
      `}default:h.assertNever(t,"Unsupported annotation type")}}#Ii(e){this.dispatchEvent(new en(e))}#Mi(){return ui`
      <div class="annotation-tutorial-container">
      ${Si(yi.annotationGetStarted)}
        <div class="tutorial-card">
          <div class="tutorial-image"> <img src=${vi}></img></div>
          <div class="tutorial-title">${Si(yi.entryLabelTutorialTitle)}</div>
          <div class="tutorial-description">${Si(yi.entryLabelTutorialDescription)}</div>
        </div>
        <div class="tutorial-card">
          <div class="tutorial-image"> <img src=${mi}></img></div>
          <div class="tutorial-title">${Si(yi.entryLinkTutorialTitle)}</div>
          <div class="tutorial-description">${Si(yi.entryLinkTutorialDescription)}</div>
        </div>
        <div class="tutorial-card">
          <div class="tutorial-image"> <img src=${bi}></img></div>
          <div class="tutorial-title">${Si(yi.timeRangeTutorialTitle)}</div>
          <div class="tutorial-description">${Si(yi.timeRangeTutorialDescription)}</div>
        </div>
        <div class="tutorial-card">
          <div class="tutorial-image"> <img src=${fi}></img></div>
          <div class="tutorial-title">${Si(yi.deleteAnnotationTutorialTitle)}</div>
          <div class="tutorial-description">${Si(yi.deleteAnnotationTutorialDescription)}</div>
        </div>
      </div>
    `}#Ei(e){switch(e.type){case"ENTRY_LABEL":return"entry-label";case"TIME_RANGE":return"time-range";case"ENTRIES_LINK":return"entries-link";default:h.assertNever(e,"unknown annotation type")}}#i(){r.render(ui`
        <span class="annotations">
          ${0===this.#xi.length?this.#Mi():ui`
              ${this.#xi.map((e=>{const i=function(e){switch(e.type){case"ENTRY_LABEL":{const t=f.EntryName.nameForEntry(e.entry);return Si(yi.entryLabelDescriptionLabel,{PH1:t,PH2:e.label})}case"TIME_RANGE":{const i=t.TimeUtilities.formatMicroSecondsAsMillisFixedExpanded(e.bounds.min),n=t.TimeUtilities.formatMicroSecondsAsMillisFixedExpanded(e.bounds.max);return Si(yi.timeRangeDescriptionLabel,{PH1:i,PH2:n})}case"ENTRIES_LINK":{if(!e.entryTo)return"";const t=f.EntryName.nameForEntry(e.entryFrom),i=f.EntryName.nameForEntry(e.entryTo);return Si(yi.entryLinkDescriptionLabel,{PH1:t,PH2:i})}default:h.assertNever(e,"Unsupported annotation")}}(e);return ui`
                  <div class="annotation-container"
                    @click=${()=>this.#Ii(e)}
                    aria-label=${i}
                    tabindex="0"
                    jslog=${o.item(`timeline.annotation-sidebar.annotation-${this.#Ei(e)}`).track({click:!0})}
                  >
                    <div class="annotation">
                      ${this.#Ri(e)}
                      <span class="label">
                        ${"ENTRY_LABEL"===e.type||"TIME_RANGE"===e.type?e.label:""}
                      </span>
                    </div>
                    <button class="delete-button" aria-label=${Si(yi.deleteButton,{PH1:i})} @click=${t=>{t.stopPropagation(),this.dispatchEvent(new Qi(e))}} jslog=${o.action("timeline.annotation-sidebar.delete").track({click:!0})}>
                      <devtools-icon
                        class="bin-icon"
                        .data=${{iconName:"bin",color:"var(--icon-default)",width:"20px",height:"20px"}}
                      ></devtools-icon>
                    </button>
                  </div>`}))}
              <setting-checkbox class="visibility-setting" .data=${{setting:this.#Ti,textOverride:"Hide annotations"}}>
              </setting-checkbox>`}
      </span>`,this.#e,{host:this})}}function ki(e){const t=a.Color.parse(e)?.asLegacyColor(),i="--app-color-performance-sidebar-label-text-dark",n=a.Color.parse(w.ThemeSupport.instance().getComputedValue(i))?.asLegacyColor();if(!t||!n)return`var(${i})`;return a.ColorUtils.contrastRatio(t.rgba(),n.rgba())>=4.5?`var(${i})`:"var(--app-color-performance-sidebar-label-text-light)"}customElements.define("devtools-performance-sidebar-annotations",xi);var Ti=Object.freeze({__proto__:null,SidebarAnnotationsTab:xi});var Ci={cssText:`:host{display:block;padding:5px 8px}.metrics{display:grid;align-items:end;grid-template-columns:repeat(3,1fr) 0.5fr;grid-row-gap:5px}.row-border{grid-column:1/5;border-top:var(--sys-size-1) solid var(--sys-color-divider)}.row-label{visibility:hidden;font-size:var(--sys-size-7)}.metrics--field .row-label{visibility:visible}.metrics-row{display:contents}.metric{flex:1;user-select:text;cursor:pointer;background:none;border:none;padding:0;display:block;text-align:left}.metric-value{font-size:var(--sys-size-10)}.metric-value-bad{color:var(--app-color-performance-bad)}.metric-value-ok{color:var(--app-color-performance-ok)}.metric-value-good{color:var(--app-color-performance-good)}.metric-score-unclassified{color:var(--sys-color-token-subtle)}.metric-label{font:var(--sys-typescale-body4-medium)}.number-with-unit{white-space:nowrap;.unit{font-size:14px;padding:0 1px}}.passed-insights-section{margin-top:var(--sys-size-5);summary{font-weight:var(--ref-typeface-weight-medium)}}.field-mismatch-notice{display:grid;grid-template-columns:auto auto;align-items:center;background-color:var(--sys-color-surface3);margin:var(--sys-size-6) 0;border-radius:var(--sys-shape-corner-extra-small);border:var(--sys-size-1) solid var(--sys-color-divider);h3{margin-block:3px;font:var(--sys-typescale-body4-medium);color:var(--sys-color-on-base);padding:var(--sys-size-5) var(--sys-size-6) 0 var(--sys-size-6)}.field-mismatch-notice__body{padding:var(--sys-size-3) var(--sys-size-6) var(--sys-size-5) var(--sys-size-6)}button{padding:5px;background:unset;border:unset;font:inherit;color:var(--sys-color-primary);text-decoration:underline;cursor:pointer}}\n/*# sourceURL=${import.meta.resolve("./sidebarSingleInsightSet.css")} */\n`};const $i=new CSSStyleSheet;$i.replaceSync(Ci.cssText);const{html:Pi}=r.StaticHtml,Li={metricScore:"{PH1}: {PH2} {PH3} score",metricScoreUnavailable:"{PH1}: unavailable",passedInsights:"Passed insights ({PH1})",fieldScoreLabel:"Field ({PH1})",urlOption:"URL",originOption:"Origin",dismissTitle:"Dismiss",fieldMismatchTitle:"Field & local metrics mismatch",fieldMismatchNotice:"There are many reasons why local and field metrics [may not match](https://web.dev/articles/lab-and-field-data-differences). Adjust [throttling settings and device emulation](https://developer.chrome.com/docs/devtools/device-mode) to analyze traces more similar to the average user's environment."},Ri=t.i18n.registerUIStrings("panels/timeline/components/SidebarSingleInsightSet.ts",Li),Ii=t.i18n.getLocalizedString.bind(void 0,Ri),Mi=new Set([]),Ei={Cache:y.Cache.Cache,CLSCulprits:y.CLSCulprits.CLSCulprits,DocumentLatency:y.DocumentLatency.DocumentLatency,DOMSize:y.DOMSize.DOMSize,DuplicatedJavaScript:y.DuplicatedJavaScript.DuplicatedJavaScript,FontDisplay:y.FontDisplay.FontDisplay,ForcedReflow:y.ForcedReflow.ForcedReflow,ImageDelivery:y.ImageDelivery.ImageDelivery,InteractionToNextPaint:y.InteractionToNextPaint.InteractionToNextPaint,LCPDiscovery:y.LCPDiscovery.LCPDiscovery,LCPPhases:y.LCPPhases.LCPPhases,LegacyJavaScript:y.LegacyJavaScript.LegacyJavaScript,ModernHTTP:y.ModernHTTP.ModernHTTP,NetworkDependencyTree:y.NetworkDependencyTree.NetworkDependencyTree,RenderBlocking:y.RenderBlocking.RenderBlocking,SlowCSSSelector:y.SlowCSSSelector.SlowCSSSelector,ThirdParties:y.ThirdParties.ThirdParties,Viewport:y.Viewport.Viewport};class Di extends HTMLElement{#e=this.attachShadow({mode:"open"});#K=this.#i.bind(this);#Ve={insights:null,insightSetKey:null,activeCategory:i.Insights.Types.InsightCategory.ALL,activeInsight:null,parsedTrace:null,traceMetadata:null};#Di=!1;set data(e){this.#Ve=e,n.ScheduledRender.scheduleRender(this,this.#K)}connectedCallback(){this.#e.adoptedStyleSheets=[$i],this.#i()}#Hi(e){return this.#Ve.activeCategory===i.Insights.Types.InsightCategory.ALL||e===this.#Ve.activeCategory}#Fi(e){this.dispatchEvent(new y.EventRef.EventReferenceClick(e))}#Ni(e,t,n){let s,o,a;if(null===t)s=o="-",a="unclassified";else if("LCP"===e){const e=t,{text:n,element:r}=mt.formatMicroSecondsAsSeconds(e);s=n,o=r,a=i.Handlers.ModelHandlers.PageLoadMetrics.scoreClassificationForLargestContentfulPaint(e)}else if("CLS"===e)s=o=t?t.toFixed(2):"0",a=i.Handlers.ModelHandlers.LayoutShifts.scoreClassificationForLayoutShift(t);else if("INP"===e){const e=t,{text:n,element:r}=mt.formatMicroSecondsAsMillisFixed(e);s=n,o=r,a=i.Handlers.ModelHandlers.UserInteractions.scoreClassificationForInteractionToNextPaint(e)}else h.TypeScriptUtilities.assertNever(e,`Unexpected metric ${e}`);const l=null!==t?Ii(Li.metricScore,{PH1:e,PH2:s,PH3:a}):Ii(Li.metricScoreUnavailable,{PH1:e});return this.#Hi(e)?Pi`
      <button class="metric"
        @click=${n?this.#Fi.bind(this,n):null}
        title=${l}
        aria-label=${l}
      >
        <div class="metric-value metric-value-${a}">${o}</div>
      </button>
    `:r.nothing}#zi(e){return{lcp:i.Insights.Common.getLCP(this.#Ve.insights,e),cls:i.Insights.Common.getCLS(this.#Ve.insights,e),inp:i.Insights.Common.getINP(this.#Ve.insights,e)}}#Oi(e){const t=this.#Ve.insights?.get(e);if(!t)return null;const n=i.Insights.Common.getFieldMetricsForInsightSet(t,this.#Ve.traceMetadata,g.CrUXManager.instance().getSelectedScope());return n||null}#Ai(e,t){return void 0!==e.lcp&&void 0!==t.lcp&&"better"===vt("LCP",e.lcp,t.lcp)||void 0!==e.inp&&void 0!==t.inp&&"better"===vt("LCP",e.inp,t.inp)}#_i(){this.#Di=!0,this.#i()}#Ui(e){const t=this.#zi(e),n=this.#Oi(e),s=this.#Ni("LCP",t.lcp?.value??null,t.lcp?.event??null),a=this.#Ni("INP",t.inp?.value??null,t.inp?.event??null),l=this.#Ni("CLS",t.cls.value??null,t.cls?.worstClusterEvent??null),d=Pi`
      <div class="metrics-row">
        <span>${s}</span>
        <span>${a}</span>
        <span>${l}</span>
        <span class="row-label">Local</span>
      </div>
      <span class="row-border"></span>
    `;let c;if(n){const{lcp:e,inp:t,cls:i}=n,s=this.#Ni("LCP",e?.value??null,null),r=this.#Ni("INP",t?.value??null,null),o=this.#Ni("CLS",i?.value??null,null);let a=Ii(Li.originOption);"url"!==e?.pageScope&&"url"!==t?.pageScope||(a=Ii(Li.urlOption)),c=Pi`
        <div class="metrics-row">
          <span>${s}</span>
          <span>${r}</span>
          <span>${o}</span>
          <span class="row-label">${Ii(Li.fieldScoreLabel,{PH1:a})}</span>
        </div>
        <span class="row-border"></span>
      `}const h={lcp:void 0!==t.lcp?.value?i.Helpers.Timing.microToMilli(t.lcp.value):void 0,inp:void 0!==t.inp?.value?i.Helpers.Timing.microToMilli(t.inp.value):void 0},g=n&&{lcp:void 0!==n.lcp?.value?i.Helpers.Timing.microToMilli(n.lcp.value):void 0,inp:void 0!==n.inp?.value?i.Helpers.Timing.microToMilli(n.inp.value):void 0};let p;!this.#Di&&g&&this.#Ai(h,g)&&(p=Pi`
        <div class="field-mismatch-notice" jslog=${o.section("timeline.insights.field-mismatch")}>
          <h3>${Ii(Li.fieldMismatchTitle)}</h3>
          <devtools-button
            title=${Ii(Li.dismissTitle)}
            .iconName=${"cross"}
            .variant=${"icon"}
            .jslogContext=${"timeline.insights.dismiss-field-mismatch"}
            @click=${this.#_i}
          ></devtools-button>
          <div class="field-mismatch-notice__body">${Lt(Ii(Li.fieldMismatchNotice))}</div>
        </div>
      `);const u={metrics:!0,"metrics--field":Boolean(c)},m=Pi`<div class=${r.Directives.classMap(u)}>
      <div class="metrics-row">
        <span class="metric-label">LCP</span>
        <span class="metric-label">INP</span>
        <span class="metric-label">CLS</span>
        <span class="row-label"></span>
      </div>
      ${d}
      ${c}
    </div>`;return Pi`
      ${m}
      ${p}
    `}#Bi(e,t){const n=S.Runtime.experiments.isEnabled("timeline-experimental-insights"),s=e?.get(t);if(!s)return r.nothing;const o=s.model,a=[],l=[];for(const[e,r]of Object.entries(o)){const o=Ei[e];if(!o)continue;if(!n&&Mi.has(e))continue;if(!r||(d={activeCategory:this.#Ve.activeCategory,insightCategory:r.category}).activeCategory!==i.Insights.Types.InsightCategory.ALL&&d.activeCategory!==d.insightCategory)continue;const c=this.#Oi(t),h=Pi`<div>
        <${o.litTagName}
          .selected=${this.#Ve.activeInsight?.model===r}
          .model=${r}
          .bounds=${s.bounds}
          .insightSetKey=${t}
          .parsedTrace=${this.#Ve.parsedTrace}
          .fieldMetrics=${c}>
        </${o.litTagName}>
      </div>`;"pass"===r.state?l.push(h):a.push(h)}var d;return Pi`
      ${a}
      ${l.length?Pi`
        <details class="passed-insights-section">
          <summary>${Ii(Li.passedInsights,{PH1:l.length})}</summary>
          ${l}
        </details>
      `:r.nothing}
    `}#i(){const{insights:e,insightSetKey:t}=this.#Ve;e&&t?r.render(Pi`
      <div class="navigation">
        ${this.#Ui(t)}
        ${this.#Bi(e,t)}
        </div>
      `,this.#e,{host:this}):r.render(Pi``,this.#e,{host:this})}}customElements.define("devtools-performance-sidebar-single-navigation",Di);var Hi=Object.freeze({__proto__:null,SidebarSingleInsightSet:Di}),Fi={cssText:`:host{display:flex;flex-flow:column nowrap;flex-grow:1}.insight-sets-wrapper{display:flex;flex-flow:column nowrap;flex-grow:1;details{flex-grow:0}details[open]{flex-grow:1;border-bottom:1px solid var(--sys-color-divider)}summary{background-color:var(--sys-color-surface2);border-bottom:1px solid var(--sys-color-divider);overflow:hidden;padding:2px 5px;text-overflow:ellipsis;white-space:nowrap;font:var(--sys-typescale-body4-medium);display:flex;align-items:center;&:focus{background-color:var(--sys-color-tonal-container)}&::marker{color:var(--sys-color-on-surface-subtle);font-size:11px;line-height:1}details:first-child &{border-top:1px solid var(--sys-color-divider)}}}.zoom-button{margin-left:auto}.zoom-icon{visibility:hidden;&.active devtools-button{visibility:visible}}.dropdown-icon{&.active devtools-button{transform:rotate(90deg)}}.feedback-wrapper{position:relative;padding:var(--sys-size-6);.tooltip{visibility:hidden;transition-property:visibility;position:absolute;bottom:35px;width:90%;max-width:300px;left:var(--sys-size-6);z-index:1;box-sizing:border-box;padding:var(--sys-size-5) var(--sys-size-6);border-radius:var(--sys-shape-corner-small);background-color:var(--sys-color-cdt-base-container);box-shadow:var(--drop-shadow-depth-3)}devtools-button:hover + .tooltip{visibility:visible}}\n/*# sourceURL=${import.meta.resolve("./sidebarInsightsTab.css")} */\n`};const Ni=new CSSStyleSheet;Ni.replaceSync(Fi.cssText);const{html:zi}=r,Oi={feedbackButton:"Feedback",feedbackTooltip:"Insights is an experimental feature. Your feedback will help us improve it."},Ai=t.i18n.registerUIStrings("panels/timeline/components/SidebarInsightsTab.ts",Oi),_i=t.i18n.getLocalizedString.bind(void 0,Ai);class Ui extends HTMLElement{#t=this.#i.bind(this);#e=this.attachShadow({mode:"open"});#ve=null;#Vi=null;#qi=null;#ji=null;#Wi=i.Insights.Types.InsightCategory.ALL;#Ki=null;connectedCallback(){this.#e.adoptedStyleSheets=[Ni]}set parsedTrace(e){e!==this.#ve&&(this.#ve=e,this.#Ki=null,n.ScheduledRender.scheduleRender(this,this.#t))}set traceMetadata(e){e!==this.#Vi&&(this.#Vi=e,this.#Ki=null,n.ScheduledRender.scheduleRender(this,this.#t))}set insights(e){if(e===this.#qi)return;if(this.#qi=e,this.#Ki=null,!this.#qi||!this.#ve)return;const t=i.Helpers.Timing.milliToMicro(i.Types.Timing.Milli(5e3)),s=[...this.#qi.values()];this.#Ki=s.find((e=>e.navigation||e.bounds.range>t))?.id??s[0]?.id??null,n.ScheduledRender.scheduleRender(this,this.#t)}set activeInsight(e){e!==this.#ji&&(this.#ji=e,this.#ji&&(this.#Ki=this.#ji.insightSetKey),n.ScheduledRender.scheduleRender(this,this.#t))}#Gi(e){this.#Ki=this.#Ki===e?null:e,this.#Ki!==this.#ji?.insightSetKey&&this.dispatchEvent(new y.SidebarInsight.InsightDeactivated),n.ScheduledRender.scheduleRender(this,this.#t)}#Yi(e){const t=this.#qi?.get(e);t&&this.dispatchEvent(new y.SidebarInsight.InsightSetHovered(t.bounds))}#Xi(){this.dispatchEvent(new y.SidebarInsight.InsightSetHovered)}#Ji(){P.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab("https://crbug.com/371170842")}#Zi(e,t){e.stopPropagation();const i=this.#qi?.get(t);i&&this.dispatchEvent(new y.SidebarInsight.InsightSetZoom(i.bounds))}#Qi(e){const t=r.Directives.classMap({"zoom-icon":!0,active:e});return zi`
    <div class=${t}>
        <devtools-button .data=${{variant:"icon",iconName:"center-focus-weak",size:"SMALL"}}
      ></devtools-button></div>`}#en(e){const t=r.Directives.classMap({"dropdown-icon":!0,active:e});return zi`
      <div class=${t}>
        <devtools-button .data=${{variant:"icon",iconName:"chevron-right",size:"SMALL"}}
      ></devtools-button></div>
    `}#i(){if(!this.#ve||!this.#qi)return void r.render(r.nothing,this.#e,{host:this});const e=this.#qi.size>1,t=f.Helpers.createUrlLabels([...this.#qi.values()].map((({url:e})=>e))),i=zi`
      <div class="insight-sets-wrapper">
        ${[...this.#qi.values()].map((({id:i,url:n},s)=>{const r={insights:this.#qi,insightSetKey:i,activeCategory:this.#Wi,activeInsight:this.#ji,parsedTrace:this.#ve,traceMetadata:this.#Vi},o=zi`
            <devtools-performance-sidebar-single-navigation
              .data=${r}>
            </devtools-performance-sidebar-single-navigation>
          `;return e?zi`<details
              ?open=${i===this.#Ki}
            >
              <summary
                @click=${()=>this.#Gi(i)}
                @mouseenter=${()=>this.#Yi(i)}
                @mouseleave=${()=>this.#Xi()}
                title=${n.href}>
                ${this.#en(i===this.#Ki)}
                <span>${t[s]}</span>
                <span class='zoom-button' @click=${e=>this.#Zi(e,i)}>${this.#Qi(i===this.#Ki)}</span>
              </summary>
              ${o}
            </details>`:o}))}
      </div>

      <div class="feedback-wrapper">
        <devtools-button .variant=${"outlined"} .iconName=${"experiment"} @click=${this.#Ji}>
          ${_i(Oi.feedbackButton)}
        </devtools-button>

        <p class="tooltip">${_i(Oi.feedbackTooltip)}</p>
      </div>
    `,n=r.Directives.repeat([i],(()=>this.#ve),(e=>e));r.render(n,this.#e,{host:this})}}customElements.define("devtools-performance-sidebar-insights",Ui);var Bi=Object.freeze({__proto__:null,SidebarInsightsTab:Ui}),Vi=`:host{display:block}details{border-bottom:1px solid var(--sys-color-divider)}.issue-summary{display:flex;align-items:flex-start;gap:8px;padding:8px 12px;cursor:pointer;list-style:none;background-color:var(--color-background);transition:background-color 0.2s ease}.issue-summary:hover{background-color:var(--sys-color-state-hover-on-subtle)}.issue-summary::-webkit-details-marker{display:none}.dropdown-icon{transition:transform 0.2s ease;flex-shrink:0}.dropdown-icon.open{transform:rotate(90deg)}.issue-info{flex:1;display:flex;flex-direction:column;gap:4px}.issue-name{font-weight:500}.event-count-pill{background-color:var(--sys-color-neutral-container);color:var(--sys-color-on-surface-subtle);border-radius:10px;padding:2px 6px;font-size:11px;font-weight:500;min-width:16px;text-align:center;line-height:1.2;display:inline-block;flex-shrink:0;margin-top:1px}.issue-summary devtools-icon{margin-top:1px}.issue-description{font-size:12px;color:var(--color-text-secondary);line-height:1.3}.issue-learn-more{font-size:12px;color:var(--text-link);text-decoration:underline}.issue-content{padding:0 12px 8px;background-color:var(--color-background)}.event-list{border-left:2px solid var(--sys-color-divider);margin-left:30px}.event-list-error{border-left-color:var(--icon-error)}.event-list-warning{border-left-color:var(--icon-warning)}.event-list-info{border-left-color:var(--icon-info)}.event-item{display:flex;justify-content:space-between;align-items:center;padding:7px 12px;cursor:pointer;border-bottom:1px solid var(--sys-color-divider)}.event-item:focus{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:-2px}.event-item:last-child{border-bottom:none}.event-name{font-size:12px;color:var(--text-link);flex:1;font-weight:400;text-decoration:underline;cursor:pointer}.event-timestamp{font-size:11px;color:var(--color-text-secondary);margin-left:8px;font-weight:500;white-space:nowrap}\n/*# sourceURL=${import.meta.resolve("./sidebarRNPerfIssueItem.css")} */\n`;const{html:qi}=r;class ji extends HTMLElement{#e=this.attachShadow({mode:"open"});#tn=null;#in;#nn=!1;set data(e){this.#tn=e.issue,this.#in=e.onEventSelected,this.#i()}#sn(e){e.preventDefault(),this.#nn=!this.#nn,this.#i()}#rn(e){this.#in&&this.#in(e.event)}#on(e,t){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this.#rn(t))}#en(e){return qi`
      <devtools-button .data=${{variant:"icon",iconName:"chevron-right",size:"SMALL"}} class="dropdown-icon ${e?"open":""}"></devtools-button>
    `}#an(e){const{iconName:t,color:i}={error:{iconName:"issue-cross-filled",color:"var(--icon-error)"},warning:{iconName:"issue-exclamation-filled",color:"var(--icon-warning)"},info:{iconName:"issue-text-filled",color:"var(--icon-info)"}}[e];return qi`
      <devtools-icon .data=${{iconName:t,color:i,width:"16px",height:"16px"}}></devtools-icon>
    `}#i(){const e=this.#tn;if(!e)return void r.render(r.nothing,this.#e,{host:this});const t=new Intl.NumberFormat(void 0,{minimumFractionDigits:1,maximumFractionDigits:1,style:"decimal"}),i=qi`
      <style>${Vi}</style>
      <details ?open=${this.#nn}>
        <summary @click=${e=>this.#sn(e)} class="issue-summary">
          ${this.#en(this.#nn)}
          ${this.#an(e.severity)}
          <span class="event-count-pill">${e.count}</span>
          <div class="issue-info">
            <div class="issue-name">${e.name}</div>
            ${e.description?qi`<div class="issue-description">${e.description}</div>`:""}
            ${e.learnMoreUrl?qi`
              <div class="issue-learn-more">
                ${s.XLink.XLink.create(e.learnMoreUrl,"Learn more")}
              </div>
            `:""}
          </div>
        </summary>
        <div class="issue-content">
          <div class="event-list event-list-${e.severity}">
            ${e.events.map(((e,i)=>qi`
                <div class="event-item"
                     tabindex="0"
                     role="button"
                     aria-label="Navigate to item ${i+1} in timeline"
                     @click=${()=>this.#rn(e)}
                     @keydown=${t=>this.#on(t,e)}>
                  <div class="event-name">${e.event.name}</div>
                  <div class="event-timestamp">${t.format(e.timestampMs)} ms</div>
                </div>`))}
          </div>
        </div>
      </details>
    `;r.render(i,this.#e,{host:this})}}customElements.define("devtools-performance-sidebar-perf-issue-item",ji);var Wi=`.perf-issues-wrapper{flex:1;overflow-y:auto}.empty-state-container{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:16px}.empty-state-title{font-size:14px;font-weight:500;color:var(--color-text-primary);margin-bottom:8px;text-align:center}.empty-state-detail{font-size:14px;color:var(--color-text-secondary);line-height:1.4;text-align:center}\n/*# sourceURL=${import.meta.resolve("./sidebarRNPerfIssuesTab.css")} */\n`;const{html:Ki}=r,Gi={error:3,warning:2,info:1},Yi={emptyStateTitle:"Performance Signals (Experimental)",emptyStateDetail:"No issues found"},Xi=t.i18n.registerUIStrings("panels/timeline/components/SidebarRNPerfSignalsTab.ts",Yi),Ji=t.i18n.getLocalizedString.bind(void 0,Xi);class Zi extends HTMLElement{#t=this.#i.bind(this);#e=this.attachShadow({mode:"open"});#ve=null;#ln=[];#dn;set parsedTrace(e){e!==this.#ve&&(this.#ve=e,this.#cn(),n.ScheduledRender.scheduleRender(this,this.#t))}setSelectTimelineEventCallback(e){this.#dn=e}hasIssues(){return this.#ln.length>0}#cn(){if(this.#ln=[],!this.#ve)return;const e=i.Helpers.Timing.microToMilli(this.#ve.Meta.traceBounds.min),t=new Map;for(const n of this.#ve.ExtensionTraceData.extensionTrackData)for(const s of Object.values(n.entriesByTrack))for(const n of s){if(!i.Types.Extensions.isSyntheticExtensionEntry(n))continue;const s=n.rawSourceEvent;try{const r=i.Types.Events.isSyntheticUserTiming(s)?s.args.data.beginEvent:s,o="detail"in r.args?r.args.detail:void 0;if(!o)continue;const a=JSON.parse(o),l=a?.devtools?.performanceIssue;if(!l)continue;const d=t.get(l.name)??{metadata:l,events:[]};d.events.push({event:n,timestampMs:i.Helpers.Timing.microToMilli(n.ts)-e}),t.set(l.name,d)}catch{continue}}for(const[e,{events:i,metadata:n}]of t)this.#ln.push({name:e,description:n.description,severity:n.severity??"info",learnMoreUrl:n.learnMoreUrl,events:i,count:i.length});this.#ln.sort(((e,t)=>{const i=Gi[t.severity]-Gi[e.severity];return 0!==i?i:e.name.localeCompare(t.name)}))}#hn(){return Ki`
      <div class="empty-state-container">
        <div class="empty-state-title">${Ji(Yi.emptyStateTitle)}</div>
        <div class="empty-state-detail">${Ji(Yi.emptyStateDetail)}</div>
      </div>
    `}#i(){if(!this.#ve)return void r.render(r.nothing,this.#e,{host:this});const e=Ki`
      <style>${Wi}</style>
      <div class="perf-issues-wrapper">
        ${this.#ln.length?this.#ln.map((e=>Ki`
            <devtools-performance-sidebar-perf-issue-item .data=${{issue:e,onEventSelected:this.#dn}}></devtools-performance-sidebar-perf-issue-item>
          `)):this.#hn()}
      </div>
    `;r.render(e,this.#e,{host:this})}}customElements.define("devtools-performance-sidebar-perf-signals",Zi);class Qi extends Event{removedAnnotation;static eventName="removeannotation";constructor(e){super(Qi.eventName,{bubbles:!0,composed:!0}),this.removedAnnotation=e}}class en extends Event{annotation;static eventName="revealannotation";constructor(e){super(en.eventName,{bubbles:!0,composed:!0}),this.annotation=e}}class tn extends s.Widget.VBox{#si=new s.TabbedPane.TabbedPane;#gn=new nn;#pn=new sn;#un=!1;#mn=new rn;#vn=a.Settings.Settings.instance().createSetting("timeline-user-has-opened-sidebar-once",!1);userHasOpenedSidebarOnce(){return this.#vn.get()}constructor(){super(),this.setMinimumSize(170,0);const e=!S.Runtime.experiments.isEnabled("react-native-specific-ui");this.#un=S.Runtime.experiments.isEnabled("react-native-specific-ui"),e&&this.#si.appendTab("insights","Insights",this.#gn,void 0,void 0,!1,!1,0,"timeline.insights-tab"),this.#si.appendTab("annotations","Annotations",this.#pn,void 0,void 0,!1,!1,1,"timeline.annotations-tab"),this.#si.selectTab(e?"insights":"annotations")}wasShown(){this.#vn.set(!0),this.#si.show(this.element),this.#bn(),"insights"===this.#si.selectedTabId&&this.#si.tabIsDisabled("insights")&&this.#si.selectTab("annotations")}setAnnotations(e,t){this.#pn.setAnnotations(e,t),this.#bn()}#bn(){const e=this.#pn.deduplicatedAnnotations();this.#si.setBadge("annotations",e.length>0?e.length.toString():null)}setParsedTrace(e,t){if(this.#gn.setParsedTrace(e,t),this.#mn.setParsedTrace(e),this.#un){const e=this.#mn.hasIssues(),t=this.#si.hasTab("perf-signals");e&&!t?(this.#si.appendTab("perf-signals","Performance Signals",this.#mn,void 0,void 0,!1,!0),this.#si.selectTab("perf-signals")):!e&&t&&this.#si.closeTab("perf-signals")}}setSelectTimelineEventCallback(e){this.#mn.setSelectTimelineEventCallback(e)}setInsights(e){this.#gn.setInsights(e),this.#si.setTabEnabled("insights",null!==e)}setActiveInsight(e){this.#gn.setActiveInsight(e),e&&this.#si.selectTab("insights")}}class nn extends s.Widget.VBox{#fn=new Ui;constructor(){super(),this.element.classList.add("sidebar-insights"),this.element.appendChild(this.#fn)}setParsedTrace(e,t){this.#fn.parsedTrace=e,this.#fn.traceMetadata=t}setInsights(e){this.#fn.insights=e}setActiveInsight(e){this.#fn.activeInsight=e}}class sn extends s.Widget.VBox{#fn=new xi;constructor(){super(),this.element.classList.add("sidebar-annotations"),this.element.appendChild(this.#fn)}setAnnotations(e,t){this.#fn.annotationEntryToColorMap=t,this.#fn.annotations=e}deduplicatedAnnotations(){return this.#fn.deduplicatedAnnotations()}}class rn extends s.Widget.VBox{#fn=new Zi;constructor(){super(),this.element.classList.add("sidebar-perf-signals"),this.element.appendChild(this.#fn)}setParsedTrace(e){this.#fn.parsedTrace=e}setSelectTimelineEventCallback(e){this.#fn.setSelectTimelineEventCallback(e)}hasIssues(){return this.#fn.hasIssues()}}var on=Object.freeze({__proto__:null,DEFAULT_SIDEBAR_TAB:"insights",DEFAULT_SIDEBAR_WIDTH_PX:240,RemoveAnnotation:Qi,RevealAnnotation:en,SidebarWidget:tn}),an={cssText:`:host{max-height:100%;overflow:hidden auto;scrollbar-width:thin}.timeline-summary{font-size:var(--sys-typescale-body4-size);flex-direction:column;padding:0 var(--sys-size-6) var(--sys-size-4) var(--sys-size-8)}.summary-range{font-weight:var(--ref-typeface-weight-medium);height:24.5px;line-height:22px}.category-summary{gap:var(--sys-size-4);display:flex;flex-direction:column}.category-row{min-height:16px;line-height:16px}.category-swatch{display:inline-block;width:var(--sys-size-6);height:var(--sys-size-6);margin-right:var(--sys-size-4);top:var(--sys-size-1);position:relative;border:var(--sys-size-1) solid var(--sys-color-neutral-outline)}.category-name{display:inline;word-break:break-all}.category-value{text-align:right;position:relative;float:right;z-index:0;width:var(--sys-size-19)}.background-bar-container{position:absolute;inset:0 0 0 var(--sys-size-3);z-index:-1}.background-bar{width:100%;float:right;height:var(--sys-size-8);background-color:var(--sys-color-surface-yellow);border-bottom:var(--sys-size-1) solid var(--sys-color-yellow-outline)}\n/*# sourceURL=${import.meta.resolve("./timelineSummary.css")} */\n`};const{render:ln,html:dn}=r,cn={total:"Total",rangeSS:"Range:  {PH1} – {PH2}"},hn=t.i18n.registerUIStrings("panels/timeline/components/TimelineSummary.ts",cn),gn=t.i18n.getLocalizedString.bind(void 0,hn);class pn extends HTMLElement{#e=s.UIUtils.createShadowRootWithCoreStyles(this,{cssFile:an,delegatesFocus:void 0});#yn=0;#wn=0;#Sn=0;#xn=[];set data(e){this.#Sn=e.total,this.#xn=e.categories,this.#yn=e.rangeStart,this.#wn=e.rangeEnd,this.#i()}#i(){const e=dn`
          <div class="timeline-summary">
              <div class="summary-range">${gn(cn.rangeSS,{PH1:t.TimeUtilities.millisToString(this.#yn),PH2:t.TimeUtilities.millisToString(this.#wn)})}</div>
              <div class="category-summary">
                  ${this.#xn.map((e=>dn`
                          <div class="category-row">
                          <div class="category-swatch" style="background-color: ${e.color};"></div>
                          <div class="category-name">${e.title}</div>
                          <div class="category-value">
                              ${t.TimeUtilities.preciseMillisToString(e.value)}
                              <div class="background-bar-container">
                                  <div class="background-bar" style='width: ${(100*e.value/this.#Sn).toFixed(1)}%;'></div>
                              </div>
                          </div>
                          </div>`))}
                  <div class="category-row">
                      <div class="category-swatch"></div>
                      <div class="category-name">${gn(cn.total)}</div>
                      <div class="category-value">
                          ${t.TimeUtilities.preciseMillisToString(this.#Sn)}
                          <div class="background-bar-container">
                              <div class="background-bar"></div>
                          </div>
                      </div>
                  </div>
                </div>
          </div>
          </div>

        </div>`;ln(e,this.#e,{host:this})}}customElements.define("devtools-performance-timeline-summary",pn);var un=Object.freeze({__proto__:null,CategorySummary:pn});export{R as Breadcrumbs,A as BreadcrumbsUI,K as CPUThrottlingSelector,J as DetailsView,be as FieldSettingsDialog,$e as IgnoreListSetting,He as InteractionBreakdown,Ve as LayoutShiftDetails,_t as LiveMetricsView,$t as MetricCard,ni as NetworkRequestDetails,Yt as NetworkRequestTooltip,Ze as NetworkThrottlingSelector,oe as OriginMap,hi as RelatedInsightChips,on as Sidebar,Ti as SidebarAnnotationsTab,Bi as SidebarInsightsTab,Hi as SidebarSingleInsightSet,un as TimelineSummary,bt as Utils};
