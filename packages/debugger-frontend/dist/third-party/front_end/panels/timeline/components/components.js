import*as e from"../../../services/trace_bounds/trace_bounds.js";import*as t from"../../../core/i18n/i18n.js";import*as i from"../../../models/trace/trace.js";import*as n from"../../../ui/components/helpers/helpers.js";import*as r from"../../../ui/components/icon_button/icon_button.js";import*as s from"../../../ui/lit-html/lit-html.js";import*as a from"../../../ui/visual_logging/visual_logging.js";import*as o from"../../../core/sdk/sdk.js";import*as l from"../../../ui/components/menus/menus.js";import*as d from"../../mobile_throttling/mobile_throttling.js";import*as c from"../../../core/platform/platform.js";import*as h from"../../../ui/legacy/legacy.js";import*as u from"../../../models/crux-manager/crux-manager.js";import*as g from"../../../ui/components/buttons/buttons.js";import*as p from"../../../ui/components/dialogs/dialogs.js";import*as m from"../../../ui/components/input/input.js";import*as v from"../../../core/common/common.js";import*as b from"../../../models/emulation/emulation.js";import*as w from"../../../models/live-metrics/live-metrics.js";import*as f from"../../../ui/legacy/components/perf_ui/perf_ui.js";import*as k from"../../../ui/legacy/components/utils/utils.js";import*as S from"../utils/utils.js";import*as y from"../../../ui/legacy/theme_support/theme_support.js";import*as $ from"./insights/insights.js";function T(e){const t=[e];let i=e;for(;null!==i.child;){const e=i.child;null!==e&&(t.push(e),i=e)}return t}var x=Object.freeze({__proto__:null,flattenBreadcrumbs:T,Breadcrumbs:class{initialBreadcrumb;lastBreadcrumb;constructor(e){this.initialBreadcrumb={window:e,child:null},this.lastBreadcrumb=this.initialBreadcrumb}add(e){if(!this.isTraceWindowWithinTraceWindow(e,this.lastBreadcrumb.window))throw new Error("Can not add a breadcrumb that is equal to or is outside of the parent breadcrumb TimeWindow");{const t={window:e,child:null};this.lastBreadcrumb.child=t,this.setLastBreadcrumb(t)}}isTraceWindowWithinTraceWindow(e,t){return e.min>=t.min&&e.max<=t.max&&!(e.min===t.min&&e.max===t.max)}setInitialBreadcrumbFromLoadedModifications(e){this.initialBreadcrumb=e;let t=e;for(;null!==t.child;)t=t.child;this.setLastBreadcrumb(t)}setLastBreadcrumb(t){this.lastBreadcrumb=t,this.lastBreadcrumb.child=null,e.TraceBounds.BoundsManager.instance().setMiniMapBounds(t.window),e.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(t.window)}}});const C=new CSSStyleSheet;C.replaceSync(".breadcrumbs{display:none;align-items:center;height:29px;padding:3px;overflow-y:hidden;overflow-x:scroll}.breadcrumbs::-webkit-scrollbar{display:none}.breadcrumb{padding:2px 6px;border-radius:4px}.breadcrumb:hover{background-color:var(--sys-color-state-hover-on-subtle)}.range{font-size:12px;white-space:nowrap}.last-breadcrumb{font-weight:bold;color:var(--app-color-active-breadcrumb)}\n/*# sourceURL=breadcrumbsUI.css */\n");const{render:R,html:M}=s;class P extends Event{breadcrumb;static eventName="breadcrumbremoved";constructor(e){super(P.eventName),this.breadcrumb=e}}class I extends HTMLElement{static litTagName=s.literal`devtools-breadcrumbs-ui`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#n=null;connectedCallback(){this.#e.adoptedStyleSheets=[C]}set data(e){this.#n=e.breadcrumb,n.ScheduledRender.scheduleRender(this,this.#t)}#r(e){this.dispatchEvent(new P(e))}#s(){const e=this.#e.querySelector(".breadcrumbs");e&&(e.style.display="flex",requestAnimationFrame((()=>{e.scrollWidth-e.clientWidth>0&&requestAnimationFrame((()=>{e.scrollLeft=e.scrollWidth-e.clientWidth}))})))}#a(e,n){const s=i.Helpers.Timing.microSecondsToMilliseconds(e.window.range);return M`
          <div class="breadcrumb" @click=${()=>this.#r(e)}
          jslog=${a.action("timeline.breadcrumb-select").track({click:!0})}>
           <span class="${0!==n&&null===e.child?"last-breadcrumb":""} range">
            ${0===n?`Full range (${t.TimeUtilities.preciseMillisToString(s,2)})`:`${t.TimeUtilities.preciseMillisToString(s,2)}`}
            </span>
          </div>
          ${null!==e.child?M`
            <${r.Icon.Icon.litTagName} .data=${{iconName:"chevron-right",color:"var(--icon-default)",width:"16px",height:"16px"}}>`:""}
      `}#i(){const e=M`
      ${null===this.#n?M``:M`<div class="breadcrumbs">
        ${T(this.#n).map(((e,t)=>this.#a(e,t)))}
      </div>`}
    `;R(e,this.#e,{host:this}),this.#n?.child&&this.#s()}}customElements.define("devtools-breadcrumbs-ui",I);var L=Object.freeze({__proto__:null,BreadcrumbRemovedEvent:P,BreadcrumbsUI:I});const{html:N}=s,D={noThrottling:"No throttling",dSlowdown:"{PH1}× slowdown"},E=t.i18n.registerUIStrings("panels/timeline/components/CPUThrottlingSelector.ts",D),U=t.i18n.getLocalizedString.bind(void 0,E);class q extends HTMLElement{static litTagName=s.literal`devtools-cpu-throttling-selector`;#e=this.attachShadow({mode:"open"});#o;constructor(){super(),this.#o=o.CPUThrottlingManager.CPUThrottlingManager.instance().cpuThrottlingRate(),this.#i()}connectedCallback(){o.CPUThrottlingManager.CPUThrottlingManager.instance().addEventListener("RateChanged",this.#l,this)}disconnectedCallback(){o.CPUThrottlingManager.CPUThrottlingManager.instance().removeEventListener("RateChanged",this.#l,this)}#l(e){this.#o=e.data,n.ScheduledRender.scheduleRender(this,this.#i)}#d(e){d.ThrottlingManager.throttlingManager().setCPUThrottlingRate(Number(e.itemValue))}#i=()=>{const e=N`
      <${l.SelectMenu.SelectMenu.litTagName}
            @selectmenuselected=${this.#d}
            .showDivider=${!0}
            .showArrow=${!0}
            .sideButton=${!1}
            .showSelectedItem=${!0}
            .showConnector=${!1}
            .buttonTitle=${1===this.#o?U(D.noThrottling):U(D.dSlowdown,{PH1:this.#o})}
          >
          ${d.ThrottlingPresets.ThrottlingPresets.cpuThrottlingPresets.map((e=>{const t=1===e?U(D.noThrottling):U(D.dSlowdown,{PH1:e});return s.html`
              <${l.Menu.MenuItem.litTagName}
                .value=${e}
                .selected=${this.#o===e}
              >
                ${t}
              </${l.Menu.MenuItem.litTagName}>
            `}))}
      </${l.SelectMenu.SelectMenu.litTagName}>
    `;s.render(e,this.#e,{host:this})}}customElements.define("devtools-cpu-throttling-selector",q);var O=Object.freeze({__proto__:null,CPUThrottlingSelector:q});const B={forcedReflow:"Forced reflow",sIsALikelyPerformanceBottleneck:"{PH1} is a likely performance bottleneck.",idleCallbackExecutionExtended:"Idle callback execution extended beyond deadline by {PH1}",sTookS:"{PH1} took {PH2}.",longTask:"Long task",longInteractionINP:"Long interaction",sIsLikelyPoorPageResponsiveness:"{PH1} is indicating poor page responsiveness.",websocketProtocol:"WebSocket Protocol",webSocketBytes:"{PH1} byte(s)",webSocketDataLength:"Data Length"},A=t.i18n.registerUIStrings("panels/timeline/components/DetailsView.ts",B),F=t.i18n.getLocalizedString.bind(void 0,A);var _=Object.freeze({__proto__:null,buildWarningElementsForEvent:function(e,n){const r=n.Warnings.perEvent.get(e),s=[];if(!r)return s;for(const n of r){const r=i.Helpers.Timing.microSecondsToMilliseconds(i.Types.Timing.MicroSeconds(e.dur||0)),a=document.createElement("span");switch(n){case"FORCED_REFLOW":{const e=h.XLink.XLink.create("https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts",F(B.forcedReflow),void 0,void 0,"forced-reflow");a.appendChild(t.i18n.getFormatLocalizedString(A,B.sIsALikelyPerformanceBottleneck,{PH1:e}));break}case"IDLE_CALLBACK_OVER_TIME":{if(!i.Types.TraceEvents.isTraceEventFireIdleCallback(e))break;const n=t.TimeUtilities.millisToString((r||0)-e.args.data.allottedMilliseconds,!0);a.textContent=F(B.idleCallbackExecutionExtended,{PH1:n});break}case"LONG_TASK":{const e=h.XLink.XLink.create("https://web.dev/optimize-long-tasks/",F(B.longTask),void 0,void 0,"long-tasks");a.appendChild(t.i18n.getFormatLocalizedString(A,B.sTookS,{PH1:e,PH2:t.TimeUtilities.millisToString(r||0,!0)}));break}case"LONG_INTERACTION":{const e=h.XLink.XLink.create("https://web.dev/inp",F(B.longInteractionINP),void 0,void 0,"long-interaction");a.appendChild(t.i18n.getFormatLocalizedString(A,B.sIsLikelyPoorPageResponsiveness,{PH1:e}));break}default:c.assertNever(n,`Unhandled warning type ${n}`)}s.push(a)}return s},buildRowsForWebSocketEvent:function(e,n){const r=[],s=n.Initiators.eventToInitiator.get(e);return s&&i.Types.TraceEvents.isTraceEventWebSocketCreate(s)?(r.push({key:t.i18n.lockedString("URL"),value:s.args.data.url}),s.args.data.websocketProtocol&&r.push({key:F(B.websocketProtocol),value:s.args.data.websocketProtocol})):i.Types.TraceEvents.isTraceEventWebSocketCreate(e)&&(r.push({key:t.i18n.lockedString("URL"),value:e.args.data.url}),e.args.data.websocketProtocol&&r.push({key:F(B.websocketProtocol),value:e.args.data.websocketProtocol})),i.Types.TraceEvents.isTraceEventWebSocketTransfer(e)&&e.args.data.dataLength&&r.push({key:F(B.webSocketDataLength),value:`${F(B.webSocketBytes,{PH1:e.args.data.dataLength})}`}),r},generateInvalidationsList:function(e){const t={},n=new Set;for(const r of e){n.add(r.args.data.nodeId);let e=r.args.data.reason||"unknown";if("unknown"===e&&i.Types.TraceEvents.isTraceEventScheduleStyleInvalidationTracking(r)&&r.args.data.invalidatedSelectorId)switch(r.args.data.invalidatedSelectorId){case"attribute":e="Attribute",r.args.data.changedAttribute&&(e+=` (${r.args.data.changedAttribute})`);break;case"class":e="Class",r.args.data.changedClass&&(e+=` (${r.args.data.changedClass})`);break;case"id":e="Id",r.args.data.changedId&&(e+=` (${r.args.data.changedId})`)}if("PseudoClass"===e&&i.Types.TraceEvents.isTraceEventStyleRecalcInvalidationTracking(r)&&r.args.data.extraData&&(e+=r.args.data.extraData),"Attribute"===e&&i.Types.TraceEvents.isTraceEventStyleRecalcInvalidationTracking(r)&&r.args.data.extraData&&(e+=` (${r.args.data.extraData})`),"StyleInvalidator"===e)continue;const s=t[e]||[];s.push(r),t[e]=s}return{groupedByReason:t,backendNodeIds:n}}});const H=new CSSStyleSheet;H.replaceSync(':host *{box-sizing:border-box}devtools-dialog{--override-transparent:rgb(0 0 0/50%)}.content{max-width:500px;padding:16px}.content > :first-child{margin-top:0}.buttons-section{display:flex;justify-content:flex-end;margin-top:16px;gap:8px}input[type="checkbox"]{height:12px;width:12px;min-height:12px;min-width:12px;margin:6px}input[type="text"][disabled]{color:var(--sys-color-state-disabled)}label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis}.warning{color:var(--color-error-text)}\n/*# sourceURL=fieldSettingsDialog.css */\n');const j={setUp:"Set up",configure:"Configure",ok:"Ok",optOut:"Opt out",cancel:"Cancel",onlyFetchFieldData:"Only fetch field data for the below URL",urlOverride:"URL Override",doesNotHaveSufficientData:"The Chrome UX Report does not have sufficient real-world speed data for this page.",configureFieldData:"Configure field data fetching",fetchAggregated:"Fetch aggregated field data from the Chrome UX Report to help you contextualize local measurements with what real users experience on the site.",privacyDisclosure:"Privacy disclosure",whenPerformanceIsShown:"When DevTools is open, the URLs you visit will be sent to Google to query field data. These requests are not tied to your Google account.",advanced:"Advanced"},W=t.i18n.registerUIStrings("panels/timeline/components/FieldSettingsDialog.ts",j),V=t.i18n.getLocalizedString.bind(void 0,W),{html:z,nothing:X}=s;class K extends Event{static eventName="showdialog";constructor(){super(K.eventName)}}class G extends HTMLElement{static litTagName=s.literal`devtools-field-settings-dialog`;#e=this.attachShadow({mode:"open"});#c;#h=u.CrUXManager.instance().getConfigSetting();#u="";#g=!1;#p=!1;constructor(){super();const e=u.CrUXManager.instance();this.#h=e.getConfigSetting(),this.#m(),this.#i()}#m(){this.#u=this.#h.get().override,this.#g=Boolean(this.#u)}#v(e){this.#h.set({enabled:e,override:this.#g?this.#u:""})}#b(){n.ScheduledRender.scheduleRender(this,this.#i)}async#w(e){if(e&&this.#g){const e=u.CrUXManager.instance(),t=await e.getFieldDataForPage(this.#u);if(Object.values(t).every((e=>!e)))return this.#p=!0,void n.ScheduledRender.scheduleRender(this,this.#i)}this.#v(e),this.#f()}#k(){if(!this.#c)throw new Error("Dialog not found");this.#m(),this.#c.setDialogVisible(!0),n.ScheduledRender.scheduleRender(this,this.#i),this.dispatchEvent(new K)}#f(e){if(!this.#c)throw new Error("Dialog not found");this.#c.setDialogVisible(!1),e&&e.stopImmediatePropagation(),n.ScheduledRender.scheduleRender(this,this.#i)}connectedCallback(){this.#e.adoptedStyleSheets=[H,m.textInputStyles,m.checkboxStyles],this.#h.addChangeListener(this.#b,this),n.ScheduledRender.scheduleRender(this,this.#i)}disconnectedCallback(){this.#h.removeChangeListener(this.#b,this)}#S(){return this.#h.get().enabled?z`
        <${g.Button.Button.litTagName}
          @click=${this.#k}
          .data=${{variant:"outlined",title:V(j.configure)}}
          jslogContext=${"field-data-configure"}
        >${V(j.configure)}</${g.Button.Button.litTagName}>
      `:z`
      <${g.Button.Button.litTagName}
        @click=${this.#k}
        .data=${{variant:"primary",title:V(j.setUp)}}
        jslogContext=${"field-data-setup"}
      >${V(j.setUp)}</${g.Button.Button.litTagName}>
    `}#y(){return z`
      <${g.Button.Button.litTagName}
        @click=${()=>{this.#w(!0)}}
        .data=${{variant:"primary",title:V(j.ok)}}
        jslogContext=${"field-data-enable"}
      >${V(j.ok)}</${g.Button.Button.litTagName}>
    `}#$(){const e=this.#h.get().enabled?V(j.optOut):V(j.cancel);return z`
      <${g.Button.Button.litTagName}
        @click=${()=>{this.#w(!1)}}
        .data=${{variant:"outlined",title:e}}
        jslogContext=${"field-data-disable"}
      >${e}</${g.Button.Button.litTagName}>
    `}#T(e){const t=e.target;this.#u=t.value,this.#p=!1,n.ScheduledRender.scheduleRender(this,this.#i)}#x(e){const t=e.target;this.#g=t.checked,this.#p=!1,n.ScheduledRender.scheduleRender(this,this.#i)}#i=()=>{const e=z`
      ${this.#S()}
      <${p.Dialog.Dialog.litTagName}
        @clickoutsidedialog=${this.#f}
        .showConnector=${!0}
        .position=${"auto"}
        .horizontalAlignment=${"center"}
        .jslogContext=${"field-data-settings"}
        on-render=${n.Directives.nodeRenderedCallback((e=>{this.#c=e}))}
      >
        <div class="content">
          <h2>${V(j.configureFieldData)}</h2>
          <p>${V(j.fetchAggregated)}</p>
          <h3>${V(j.privacyDisclosure)}</h3>
          <p>${V(j.whenPerformanceIsShown)}</p>
          <details>
            <summary>${V(j.advanced)}</summary>
            <p>
              <label>
                <input
                  type="checkbox"
                  .checked=${this.#g}
                  @change=${this.#x}
                  jslog=${a.toggle().track({click:!0}).context("field-url-override-enabled")}
                  aria-label=${V(j.onlyFetchFieldData)}
                />
                ${V(j.onlyFetchFieldData)}
              </label>
            </p>
            <input
              type="text"
              @change=${this.#T}
              @keyup=${this.#T}
              class="devtools-text-input"
              .disabled=${!this.#g}
              .value=${this.#u}
              aria-label=${V(j.urlOverride)}
              />
            ${this.#p?z`
              <p class="warning">${V(j.doesNotHaveSufficientData)}</p>
            `:X}
          </details>
          <div class="buttons-section">
            ${this.#$()}
            ${this.#y()}
          </div>
        </div>
      </${p.Dialog.Dialog.litTagName}
    `;s.render(e,this.#e,{host:this})}}customElements.define("devtools-field-settings-dialog",G);var J=Object.freeze({__proto__:null,ShowDialog:K,FieldSettingsDialog:G});const Q=new CSSStyleSheet;Q.replaceSync(":host{display:block}.breakdown{margin:0;padding:0;list-style:none;color:var(--sys-color-token-subtle)}.value{display:inline-block;padding:0 5px;color:var(--sys-color-on-surface)}\n/*# sourceURL=interactionBreakdown.css */\n");const Y={inputDelay:"Input delay",processingDuration:"Processing duration",presentationDelay:"Presentation delay"},Z=t.i18n.registerUIStrings("panels/timeline/components/InteractionBreakdown.ts",Y),ee=t.i18n.getLocalizedString.bind(void 0,Z);class te extends HTMLElement{static litTagName=s.literal`devtools-interaction-breakdown`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#C=null;connectedCallback(){this.#e.adoptedStyleSheets=[Q]}set entry(e){e!==this.#C&&(this.#C=e,n.ScheduledRender.scheduleRender(this,this.#t))}#i(){if(!this.#C)return;const e=t.TimeUtilities.formatMicroSecondsTime(this.#C.inputDelay),i=t.TimeUtilities.formatMicroSecondsTime(this.#C.mainThreadHandling),n=t.TimeUtilities.formatMicroSecondsTime(this.#C.presentationDelay);s.render(s.html`<ul class="breakdown">
                     <li data-entry="input-delay">${ee(Y.inputDelay)}<span class="value">${e}</span></li>
                     <li data-entry="processing-duration">${ee(Y.processingDuration)}<span class="value">${i}</span></li>
                     <li data-entry="presentation-delay">${ee(Y.presentationDelay)}<span class="value">${n}</span></li>
                   </ul>
                   `,this.#e,{host:this})}}customElements.define("devtools-interaction-breakdown",te);var ie=Object.freeze({__proto__:null,InteractionBreakdown:te});const ne=new CSSStyleSheet;ne.replaceSync(".container{container-type:inline-size;height:100%}.live-metrics-view{--min-main-area-size:60%;background-color:var(--sys-color-cdt-base-container);display:flex;flex-direction:row;width:100%;height:100%}.live-metrics,\n.next-steps{padding:8px 16px;height:100%;overflow-y:auto;box-sizing:border-box;display:flex;flex-direction:column}.live-metrics{flex:1}.next-steps{flex:0 0 300px;box-sizing:border-box;border:none;border-left:1px solid var(--sys-color-divider)}@container (max-width: 600px){.live-metrics-view{flex-direction:column}.next-steps{flex-basis:40%;border:none;border-top:1px solid var(--sys-color-divider)}}.metric-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));width:100%}.section-title{text-wrap:nowrap;font-size:14px;font-weight:bold}.card{border:1px solid var(--sys-color-divider);border-radius:4px;padding:12px 16px;display:flex;flex-direction:column;gap:16px;background-color:var(--sys-color-surface2)}.next-steps .card{margin-bottom:16px}.card-title{text-wrap:nowrap;font-size:12px;font-weight:bold}.card-section-title{text-wrap:nowrap;font-size:12px;font-weight:bold}.card-metric-values{display:grid;grid-template-columns:1fr 1fr;column-gap:8px}.metric-value{text-wrap:nowrap}.local-value,\n.field-value{font-size:30px}.metric-value-label{font-size:12px;font-weight:bold}.good{color:var(--app-color-performance-good)}.needs-improvement{color:var(--app-color-performance-ok)}.poor{color:var(--app-color-performance-bad)}.good-bg{background-color:var(--app-color-performance-good)}.needs-improvement-bg{background-color:var(--app-color-performance-ok)}.poor-bg{background-color:var(--app-color-performance-bad)}.metric-card-element{overflow:hidden}.interactions-list{padding:0;margin:0;overflow:auto;flex-grow:1;min-height:100px}.interaction{display:flex;align-items:center;gap:32px}.interaction-type{font-weight:bold;width:60px;flex-shrink:0}.interaction-node{overflow:hidden;flex-grow:1}.interaction-duration{text-align:end;width:max-content;flex-shrink:0}.divider{grid-column:1/-1;width:100%;border:0;border-bottom:1px solid var(--sys-color-divider);margin:4px 0}.field-data-histogram{display:grid;grid-template-columns:max-content 100px max-content;grid-auto-rows:1fr;column-gap:8px;justify-items:flex-end;align-items:center;flex:1}.histogram-bar{height:6px}.histogram-label{width:100%;font-weight:bold}.histogram-range{font-weight:normal;color:var(--sys-color-token-subtle)}.record-action{display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px}.record-action devtools-button{overflow:hidden}.shortcut-label{width:max-content;color:var(--sys-color-token-subtle);flex-shrink:0}.live-metrics-option{display:flex;flex-flow:row nowrap;align-items:center;gap:8px;max-width:100%;text-wrap:nowrap}.live-metrics-option > devtools-select-menu{min-width:0;max-width:100%}.no-data{color:var(--sys-color-token-subtle)}.tooltip-content{margin:0 6px}\n/*# sourceURL=liveMetricsView.css */\n");const{html:re,nothing:se}=s,ae={disabled:"Disabled",presets:"Presets",custom:"Custom",add:"Add…"},oe=t.i18n.registerUIStrings("panels/timeline/components/NetworkThrottlingSelector.ts",ae),le=t.i18n.getLocalizedString.bind(void 0,oe);class de extends HTMLElement{static litTagName=s.literal`devtools-network-throttling-selector`;#e=this.attachShadow({mode:"open"});#R;#M=[];#P;constructor(){super(),this.#R=v.Settings.Settings.instance().moduleSetting("custom-network-conditions"),this.#I(),this.#P=o.NetworkManager.MultitargetNetworkManager.instance().networkConditions(),this.#i()}connectedCallback(){o.NetworkManager.MultitargetNetworkManager.instance().addEventListener("ConditionsChanged",this.#L,this),this.#R.addChangeListener(this.#N,this)}disconnectedCallback(){o.NetworkManager.MultitargetNetworkManager.instance().removeEventListener("ConditionsChanged",this.#L,this),this.#R.removeChangeListener(this.#N,this)}#I(){this.#M=[{name:le(ae.disabled),items:[o.NetworkManager.NoThrottlingConditions]},{name:le(ae.presets),items:d.ThrottlingPresets.ThrottlingPresets.networkPresets},{name:le(ae.custom),items:this.#R.get(),showCustomAddOption:!0}]}#L(){this.#P=o.NetworkManager.MultitargetNetworkManager.instance().networkConditions(),n.ScheduledRender.scheduleRender(this,this.#i)}#d(e){const t=this.#M.flatMap((e=>e.items)).find((t=>t.i18nTitleKey===e.itemValue));t&&o.NetworkManager.MultitargetNetworkManager.instance().setNetworkConditions(t)}#N(){this.#I(),n.ScheduledRender.scheduleRender(this,this.#i)}#D(e){return e.title instanceof Function?e.title():e.title}#E(){v.Revealer.reveal(this.#R)}#i=()=>{const e=re`
      <${l.SelectMenu.SelectMenu.litTagName}
        @selectmenuselected=${this.#d}
        .showDivider=${!0}
        .showArrow=${!0}
        .sideButton=${!1}
        .showSelectedItem=${!0}
        .showConnector=${!1}
        .jslogContext=${"network-conditions"}
        .buttonTitle=${this.#D(this.#P)}
      >
        ${this.#M.map((e=>re`
            <${l.Menu.MenuGroup.litTagName} .name=${e.name}>
              ${e.items.map((e=>re`
                  <${l.Menu.MenuItem.litTagName}
                    .value=${e.i18nTitleKey}
                    .selected=${this.#P.i18nTitleKey===e.i18nTitleKey}
                    jslog=${a.item(c.StringUtilities.toKebabCase(e.i18nTitleKey||""))}
                  >
                    ${this.#D(e)}
                  </${l.Menu.MenuItem.litTagName}>
                `))}
              ${e.showCustomAddOption?re`
                <${l.Menu.MenuItem.litTagName}
                  .value=${1}
                  jslog=${a.action("add").track({click:!0})}
                  @click=${this.#E}
                >
                  ${le(ae.add)}
                </${l.Menu.MenuItem.litTagName}>
              `:se}
            </${l.Menu.MenuGroup.litTagName}>
          `))}
      </${l.SelectMenu.SelectMenu.litTagName}>
    `;s.render(e,this.#e,{host:this})}}customElements.define("devtools-network-throttling-selector",de);var ce=Object.freeze({__proto__:null,NetworkThrottlingSelector:de});const{html:he,nothing:ue,Directives:ge}=s,{until:pe}=ge,me=[2500,4e3],ve=[.1,.25],be=[200,500],we=["AUTO",...u.DEVICE_SCOPE_LIST],fe={localAndFieldMetrics:"Local and Field Metrics",interactions:"Interactions",nextSteps:"Next steps",fieldData:"Field data",throttling:"Throttling",lcpTitle:"Largest Contentful Paint (LCP)",clsTitle:"Cumulative Layout Shift (CLS)",inpTitle:"Interaction to Next Paint (INP)",localValue:"Local",field75thPercentile:"Field 75th Percentile",deviceType:"Device type:",urlOrOrigin:"URL/Origin:",networkThrottling:"Network throttling:",cpuThrottling:"CPU throttling:",allDevices:"All devices",desktop:"Desktop",mobile:"Mobile",tablet:"Tablet",auto:"Auto ({PH1})",loadingOption:"{PH1} - Loading…",needsDataOption:"{PH1} - No data",urlOption:"URL",originOption:"Origin",urlOptionWithKey:"URL ({PH1})",originOptionWithKey:"Origin ({PH1})",tryDisablingThrottling:"Try disabling network throttling to approximate the network latency measured by real users.",tryUsingThrottling:"Try using {PH1} network throttling to approximate the network latency measured by real users.",relatedNode:"Related node",good:"Good",needsImprovement:"Needs improvement",poor:"Poor",leqRange:"(≤{PH1})",betweenRange:"({PH1}-{PH2})",gtRange:"(>{PH1})",percentage:"{PH1}%"},ke=t.i18n.registerUIStrings("panels/timeline/components/LiveMetricsView.ts",fe),Se=t.i18n.getLocalizedString.bind(void 0,ke);class ye extends HTMLElement{static litTagName=s.literal`devtools-metric-card`;#e=this.attachShadow({mode:"open"});constructor(){super(),this.#i()}#U;#c;connectedCallback(){this.#e.adoptedStyleSheets=[ne],n.ScheduledRender.scheduleRender(this,this.#i)}#k(){this.#c&&(this.#c.setDialogVisible(!0),n.ScheduledRender.scheduleRender(this,this.#i))}#f(e){if(this.#c&&this.#U){if(e){const t=e.composedPath();if(t.includes(this.#U))return;if(t.includes(this.#c))return}this.#c.setDialogVisible(!1),n.ScheduledRender.scheduleRender(this,this.#i)}}#i=()=>{const e=he`
      <div class="card metric-card">
        <div class="card-title">
          <slot name="headline"></slot>
        </div>
        <div class="card-metric-values"
          @mouseenter=${this.#k}
          @mouseleave=${this.#f}
          on-render=${n.Directives.nodeRenderedCallback((e=>{this.#U=e}))}
        >
          <span class="local-value">
            <slot name="local-value"></slot>
          </span>
          <span class="field-value">
            <slot name="field-value"></slot>
          </span>
          <span class="metric-value-label">${Se(fe.localValue)}</span>
          <span class="metric-value-label">${Se(fe.field75thPercentile)}</span>
        </div>
        <${p.Dialog.Dialog.litTagName}
          @pointerleftdialog=${()=>this.#f()}
          .showConnector=${!0}
          .centered=${!0}
          .closeOnScroll=${!1}
          .origin=${()=>{if(!this.#U)throw new Error("No metric values element");return this.#U}}
          on-render=${n.Directives.nodeRenderedCallback((e=>{this.#c=e}))}
        >
          <div class="tooltip-content">
            <slot name="tooltip"></slot>
          </div>
        </${p.Dialog.Dialog.litTagName}>
        <hr class="divider">
        <div class="metric-card-element">
          <slot name="related-element"><slot>
        </div>
      </div>
    `;s.render(e,this.#e,{host:this})}}class $e extends HTMLElement{static litTagName=s.literal`devtools-live-metrics-view`;#e=this.attachShadow({mode:"open"});#q;#O;#B;#A=[];#F;#_="AUTO";#H="url";#j;#W;constructor(){super(),this.#j=h.ActionRegistry.ActionRegistry.instance().getAction("timeline.toggle-recording"),this.#W=h.ActionRegistry.ActionRegistry.instance().getAction("timeline.record-reload"),this.#i()}#V(e){this.#q=e.data.lcp,this.#O=e.data.cls,this.#B=e.data.inp,this.#A=e.data.interactions,n.ScheduledRender.scheduleRender(this,this.#i)}#z(e){this.#F=e.data,n.ScheduledRender.scheduleRender(this,this.#i)}#X(){n.ScheduledRender.scheduleRender(this,this.#i)}async#K(){this.#F=await u.CrUXManager.instance().getFieldDataForCurrentPage(),n.ScheduledRender.scheduleRender(this,this.#i)}#G(e){const t="AUTO"===this.#_?this.#J():this.#_;return this.#F?.[`${this.#H}-${t}`]?.record.metrics[e]}connectedCallback(){this.#e.adoptedStyleSheets=[ne];const e=w.LiveMetrics.instance();e.addEventListener("status",this.#V,this);const t=u.CrUXManager.instance();t.addEventListener("field-data-changed",this.#z,this);b.DeviceModeModel.DeviceModeModel.instance().addEventListener("Updated",this.#X,this),t.getConfigSetting().get().enabled&&this.#K(),this.#q=e.lcpValue,this.#O=e.clsValue,this.#B=e.inpValue,this.#A=e.interactions,n.ScheduledRender.scheduleRender(this,this.#i)}disconnectedCallback(){w.LiveMetrics.instance().removeEventListener("status",this.#V,this);u.CrUXManager.instance().removeEventListener("field-data-changed",this.#z,this);b.DeviceModeModel.DeviceModeModel.instance().removeEventListener("Updated",this.#X,this)}#Q(e,t,i){if(void 0===e)return he`<span class="metric-value waiting">-<span>`;"string"==typeof e&&(e=Number(e));const n=this.#Y(e,t),r=i(e);return he`
      <span class=${`metric-value ${n}`}>${r}</span>
    `}#Z(){const e=this.#G("largest_contentful_paint");return this.#ee(Se(fe.lcpTitle),this.#q?.value,e?.percentiles?.p75,e?.histogram,me,(e=>t.TimeUtilities.millisToString(e)),this.#q?.node)}#te(){const e=this.#G("cumulative_layout_shift");return this.#ee(Se(fe.clsTitle),this.#O?.value,e?.percentiles?.p75,e?.histogram,ve,(e=>0===e?"0":e.toFixed(2)))}#ie(){const e=this.#G("interaction_to_next_paint");return this.#ee(Se(fe.inpTitle),this.#B?.value,e?.percentiles?.p75,e?.histogram,be,(e=>t.TimeUtilities.millisToString(e)))}#ne(e){void 0===e&&(e=0);return`${Math.round(100*e)}%`}#re(e,t){if(void 0===e)return"-";const i=e[t].density||0,n=Math.round(100*i);return Se(fe.percentage,{PH1:n})}#se(e,t,i){const n=this.#ne(e?.[0].density),r=this.#ne(e?.[1].density),s=this.#ne(e?.[2].density);return he`
      <div class="field-data-histogram">
        <span class="histogram-label">
          ${Se(fe.good)}
          <span class="histogram-range">${Se(fe.leqRange,{PH1:i(t[0])})}</span>
        </span>
        <span class="histogram-bar good-bg" style="width: ${n}"></span>
        <span class="histogram-percent">${this.#re(e,0)}</span>
        <span class="histogram-label">
          ${Se(fe.needsImprovement)}
          <span class="histogram-range">${Se(fe.betweenRange,{PH1:i(t[0]),PH2:i(t[1])})}</span>
        </span>
        <span class="histogram-bar needs-improvement-bg" style="width: ${r}"></span>
        <span class="histogram-percent">${this.#re(e,1)}</span>
        <span class="histogram-label">
          ${Se(fe.poor)}
          <span class="histogram-range">${Se(fe.gtRange,{PH1:i(t[1])})}</span>
        </span>
        <span class="histogram-bar poor-bg" style="width: ${s}"></span>
        <span class="histogram-percent">${this.#re(e,2)}</span>
      </div>
    `}#Y(e,t){return e<=t[0]?"good":e<=t[1]?"needs-improvement":"poor"}#ee(e,t,i,n,r,s,a){return he`
      <${ye.litTagName}>
        <div slot="headline">${e}</div>
        <span slot="local-value">${this.#Q(t,r,s)}</span>
        <span slot="field-value">${this.#Q(i,r,s)}</span>
        <div slot="tooltip">
          ${this.#se(n,r,s)}
        </div>
        <div slot="related-element">
          ${a?he`
              <div class="card-section-title">${Se(fe.relatedNode)}</div>
              <div>${pe(v.Linkifier.Linkifier.linkify(a))}</div>`:ue}
        </div>
      </${ye.litTagName}>
    `}#ae(e){return he`
      <div class="record-action">
        <${g.Button.Button.litTagName} @click=${function(){e.execute()}} .data=${{variant:"text",size:"REGULAR",iconName:e.icon(),title:e.title(),jslogContext:e.id()}}>
          ${e.title()}
        </${g.Button.Button.litTagName}>
        <span class="shortcut-label">${h.ShortcutRegistry.ShortcutRegistry.instance().shortcutTitleForAction(e.id())}</span>
      </div>
    `}#oe(){const e=this.#G("round_trip_time");if(!e?.percentiles)return null;const t=Number(e.percentiles.p75);if(!Number.isFinite(t))return null;if(t<60)return o.NetworkManager.NoThrottlingConditions;let i=null,n=1/0;for(const e of d.ThrottlingPresets.ThrottlingPresets.networkPresets){const{targetLatency:r}=e;if(!r)continue;const s=Math.abs(r-t);s>200||(n<s||(i=e,n=s))}return i}#le(){const e=this.#oe();let t;if(e)if(e===o.NetworkManager.NoThrottlingConditions)t=Se(fe.tryDisablingThrottling);else{const i="function"==typeof e.title?e.title():e.title;t=Se(fe.tryUsingThrottling,{PH1:i})}return he`
      <div class="card-title">${Se(fe.throttling)}</div>
      ${t?he`<div class="throttling-recommendation">${t}</div>`:ue}
      <span class="live-metrics-option">
        ${Se(fe.cpuThrottling)}<${q.litTagName}>
        </${q.litTagName}>
      </span>
      <span class="live-metrics-option">
        ${Se(fe.networkThrottling)}
        <${de.litTagName}></${de.litTagName}>
      </span>
    `}#de(e){const t=this.#F?.[`${e}-ALL`]?.record.key[e];if(t)return Se("url"===e?fe.urlOptionWithKey:fe.originOptionWithKey,{PH1:t});const i=Se("url"===e?fe.urlOption:fe.originOption);return Se(fe.needsDataOption,{PH1:i})}#ce(e){"url"===e.itemValue?this.#H="url":this.#H="origin",n.ScheduledRender.scheduleRender(this,this.#i)}#he(){if(!u.CrUXManager.instance().getConfigSetting().get().enabled)return s.nothing;const e=this.#de("url"),t=this.#de("origin");return he`
      <span id="page-scope-select" class="live-metrics-option">
        ${Se(fe.urlOrOrigin)}
        <${l.SelectMenu.SelectMenu.litTagName}
          @selectmenuselected=${this.#ce}
          .showDivider=${!0}
          .showArrow=${!0}
          .sideButton=${!1}
          .showSelectedItem=${!0}
          .showConnector=${!1}
          .buttonTitle=${"url"===this.#H?e:t}
        >
          <${l.Menu.MenuItem.litTagName}
            .value=${"url"}
            .selected=${"url"===this.#H}
          >
            ${e}
          </${l.Menu.MenuItem.litTagName}>
          <${l.Menu.MenuItem.litTagName}
            .value=${"origin"}
            .selected=${"origin"===this.#H}
          >
            ${t}
          </${l.Menu.MenuItem.litTagName}>
        </${l.SelectMenu.SelectMenu.litTagName}>
      </span>
    `}#ue(e){switch(e){case"ALL":return Se(fe.allDevices);case"DESKTOP":return Se(fe.desktop);case"PHONE":return Se(fe.mobile);case"TABLET":return Se(fe.tablet)}}#J(){const e=b.DeviceModeModel.DeviceModeModel.instance();return e.device()?.mobile()?this.#F?.[`${this.#H}-PHONE`]?"PHONE":"ALL":this.#F?.[`${this.#H}-DESKTOP`]?"DESKTOP":"ALL"}#ge(e){const t="AUTO"===e?this.#J():e,i=this.#ue(t),n="AUTO"===e?Se(fe.auto,{PH1:i}):i;if(!this.#F)return Se(fe.loadingOption,{PH1:n});return this.#F[`${this.#H}-${t}`]?n:Se(fe.needsDataOption,{PH1:n})}#pe(e){this.#_=e.itemValue,n.ScheduledRender.scheduleRender(this,this.#i)}#me(){if(!u.CrUXManager.instance().getConfigSetting().get().enabled)return s.nothing;const e=!this.#F?.[`${this.#H}-ALL`];return he`
      <span id="device-scope-select" class="live-metrics-option">
        ${Se(fe.deviceType)}
        <${l.SelectMenu.SelectMenu.litTagName}
          @selectmenuselected=${this.#pe}
          .showDivider=${!0}
          .showArrow=${!0}
          .sideButton=${!1}
          .showSelectedItem=${!0}
          .showConnector=${!1}
          .buttonTitle=${this.#ge(this.#_)}
          .disabled=${e}
        >
          ${we.map((e=>he`
              <${l.Menu.MenuItem.litTagName}
                .value=${e}
                .selected=${this.#_===e}
              >
                ${this.#ge(e)}
              </${l.Menu.MenuItem.litTagName}>
            `))}
        </${l.SelectMenu.SelectMenu.litTagName}>
      </span>
    `}#i=()=>{const e=he`
      <div class="container">
        <div class="live-metrics-view">
          <div class="live-metrics" slot="main">
            <h3>${Se(fe.localAndFieldMetrics)}</h3>
            <div class="metric-cards">
              <div id="lcp">
                ${this.#Z()}
              </div>
              <div id="cls">
                ${this.#te()}
              </div>
              <div id="inp">
                ${this.#ie()}
              </div>
            </div>
            <h3>${Se(fe.interactions)}</h3>
            <ol class="interactions-list">
              ${this.#A.map(((e,i)=>he`
                ${0===i?he`<hr class="divider">`:ue}
                <li class="interaction">
                  <span class="interaction-type">${e.interactionType}</span>
                  <span class="interaction-node">${e.node&&pe(v.Linkifier.Linkifier.linkify(e.node))}</span>
                  <span class="interaction-duration">
                    ${this.#Q(e.duration,be,(e=>t.TimeUtilities.millisToString(e)))}
                  </span>
                </li>
                <hr class="divider">
              `))}
            </ol>
          </div>
          <div class="next-steps" slot="sidebar">
            <h3>${Se(fe.nextSteps)}</h3>
            <div id="field-setup" class="card">
              <div class="card-title">${Se(fe.fieldData)}</div>
              ${this.#he()}
              ${this.#me()}
              <${G.litTagName}></${G.litTagName}>
            </div>
            <div id="throttling" class="card">
              ${this.#le()}
            </div>
            <div id="record" class="card">
              ${this.#ae(this.#j)}
            </div>
            <div id="record-page-load" class="card">
              ${this.#ae(this.#W)}
            </div>
          </div>
        </div>
      </div>
    `;s.render(e,this.#e,{host:this})}}customElements.define("devtools-metric-card",ye),customElements.define("devtools-live-metrics-view",$e);var Te=Object.freeze({__proto__:null,MetricCard:ye,LiveMetricsView:$e});const xe=new CSSStyleSheet;var Ce;function Re(e){let t="--app-color-system";switch(e){case Ce.Doc:t="--app-color-doc";break;case Ce.JS:t="--app-color-scripting";break;case Ce.CSS:t="--app-color-css";break;case Ce.Img:t="--app-color-image";break;case Ce.Media:t="--app-color-media";break;case Ce.Font:t="--app-color-font";break;case Ce.Wasm:t="--app-color-wasm";break;case Ce.Other:default:t="--app-color-system"}return y.ThemeSupport.instance().getComputedValue(t)}function Me(e){const t=function(e){switch(e.args.data.mimeType){case"text/html":return Ce.Doc;case"application/javascript":case"application/x-javascript":case"text/javascript":return Ce.JS;case"text/css":return Ce.CSS;case"image/gif":case"image/jpeg":case"image/png":case"image/svg+xml":case"image/webp":case"image/x-icon":return Ce.Img;case"audio/aac":case"audio/midi":case"audio/x-midi":case"audio/mpeg":case"audio/ogg":case"audio/wav":case"audio/webm":return Ce.Media;case"font/opentype":case"font/woff2":case"font/ttf":case"application/font-woff":return Ce.Font;case"application/wasm":return Ce.Wasm;default:return Ce.Other}}(e);return Re(t)}xe.replaceSync('.network-request-details-title{font-size:13px;padding:8px;display:flex;align-items:center}.network-request-details-title > div{box-sizing:border-box;width:12px;height:12px;border:1px solid var(--sys-color-divider);display:inline-block;margin-right:4px;content:" "}.network-request-details-body{display:flex;padding-bottom:5px;border-bottom:1px solid var(--sys-color-divider)}.network-request-details-col{flex:1}.network-request-details-row{display:flex;padding:0 10px;min-height:20px}.title{color:var(--sys-color-token-subtle);overflow:hidden;padding-right:10px;display:inline-block;vertical-align:top}.value{display:inline-block;user-select:text;text-overflow:ellipsis;overflow:hidden;padding:0 3px}.devtools-link{color:var(--text-link);text-decoration:underline;outline-offset:2px;padding:0;.elements-disclosure &{color:var(--text-link)}devtools-icon{vertical-align:baseline;color:var(--sys-color-primary)}:focus .selected & devtools-icon{color:var(--sys-color-tonal-container)}&:focus-visible{outline-width:unset}&.invalid-link{color:var(--text-disabled);text-decoration:none}&:not(.devtools-link-prevent-click, .invalid-link){cursor:pointer}@media (forced-colors: active){&:not(.devtools-link-prevent-click){forced-color-adjust:none;color:linktext}&:focus-visible{background:Highlight;color:HighlightText}}}.text-button.link-style,\n.text-button.link-style:hover,\n.text-button.link-style:active{background:none;border:none;font:inherit}.timings-row{align-self:start;display:flex;align-items:center;width:100%}.indicator{display:inline-block;width:10px;height:4px;margin-right:5px;border:1px solid var(--sys-color-on-surface-subtle)}.whisker-left{align-self:center;display:inline-flex;width:10px;height:6px;margin-right:5px;border-left:1px solid var(--sys-color-on-surface-subtle)}.whisker-right{align-self:center;display:inline-flex;width:10px;height:6px;margin-right:5px;border-right:1px solid var(--sys-color-on-surface-subtle)}.horizontal{background-color:var(--sys-color-on-surface-subtle);height:1px;width:10px;align-self:center}.time{display:inline-block;padding-left:10px;margin-left:auto}\n/*# sourceURL=networkRequestDetails.css */\n'),function(e){e.Doc="Doc",e.CSS="CSS",e.JS="JS",e.Font="Font",e.Img="Img",e.Media="Media",e.Wasm="Wasm",e.Other="Other"}(Ce||(Ce={}));var Pe=Object.freeze({__proto__:null,get NetworkCategory(){return Ce},colorForNetworkCategory:Re,colorForNetworkRequest:Me});const Ie={initialPriority:"Initial Priority",requestMethod:"Request Method",priority:"Priority",encodedData:"Encoded Data",decodedBody:"Decoded Body",yes:"Yes",no:"No",preview:"Preview",networkRequest:"Network request",duration:"Duration",fromCache:"From cache",mimeType:"Mime Type",FromMemoryCache:" (from memory cache)",FromCache:" (from cache)",FromPush:" (from push)",FromServiceWorker:" (from `service worker`)",initiatedBy:"Initiated by",queuingAndConnecting:"Queuing and connecting",requestSentAndWaiting:"Request sent and waiting",contentDownloading:"Content downloading",waitingOnMainThread:"Waiting on main thread"},Le=t.i18n.registerUIStrings("panels/timeline/components/NetworkRequestDetails.ts",Ie),Ne=t.i18n.getLocalizedString.bind(void 0,Le);class De extends HTMLElement{static litTagName=s.literal`devtools-performance-network-request-details`;#e=this.attachShadow({mode:"open"});#ve=null;#be=null;#we=new WeakMap;#fe;constructor(e){super(),this.#fe=e}connectedCallback(){this.#e.adoptedStyleSheets=[xe]}async setData(e,t){this.#ve!==e&&(this.#ve=e,this.#be=t,await this.#i())}#ke(){if(!this.#ve)return null;const e={backgroundColor:`${Me(this.#ve)}`};return s.html`
      <div class="network-request-details-title">
        <div style=${s.Directives.styleMap(e)}"></div>
        ${Ne(Ie.networkRequest)}
      </div>
    `}#Se(e,t){return t?s.html`
      <div class="network-request-details-row"><div class="title">${e}</div><div class="value">${t}</div></div>
    `:null}#ye(){if(!this.#ve)return null;const e={tabStop:!0,showColumnNumber:!1,inlineFrameIndex:0,maxLength:80},i=k.Linkifier.Linkifier.linkifyURL(this.#ve.args.data.url,e);return i.addEventListener("contextmenu",(e=>{if(!this.#ve)return;const t=new S.NetworkRequest.TimelineNetworkRequest(this.#ve),i=new h.ContextMenu.ContextMenu(e,{useSoftMenu:!0});i.appendApplicableItems(t),i.show()})),this.#Se(t.i18n.lockedString("URL"),i)}#$e(){if(!this.#ve)return null;const e=this.#ve.args.data.syntheticData.isMemoryCached||this.#ve.args.data.syntheticData.isDiskCached;return this.#Se(Ne(Ie.fromCache),Ne(e?Ie.yes:Ie.no))}#Te(){if(!this.#ve)return null;const e=this.#ve.dur;if(!isFinite(e))return null;const i=t.TimeUtilities.formatMicroSecondsTime(e),n=s.html`
      <div>
        ${i}
        ${this.#xe()}
      </div>
    `;return this.#Se(Ne(Ie.duration),n)}#Ce(){if(!this.#ve)return null;let e="";return this.#ve.args.data.syntheticData.isMemoryCached?e+=Ne(Ie.FromMemoryCache):this.#ve.args.data.syntheticData.isDiskCached?e+=Ne(Ie.FromCache):this.#ve.args.data.timing?.pushStart&&(e+=Ne(Ie.FromPush)),this.#ve.args.data.fromServiceWorker&&(e+=Ne(Ie.FromServiceWorker)),!this.#ve.args.data.encodedDataLength&&e||(e=`${c.NumberUtilities.bytesToString(this.#ve.args.data.encodedDataLength)}${e}`),this.#Se(Ne(Ie.encodedData),e)}#Re(){if(!this.#ve)return null;const e=i.Helpers.Trace.getZeroIndexedStackTraceForEvent(this.#ve)?.at(0)??null;if(e){const t=this.#fe.maybeLinkifyConsoleCallFrame(this.#be,e,{tabStop:!0,inlineFrameIndex:0,showColumnNumber:!0});if(t)return this.#Se(Ne(Ie.initiatedBy),t)}return null}async#Me(){if(!this.#ve)return null;if(!this.#we.get(this.#ve)&&this.#ve.args.data.url&&this.#be){const e=await k.ImagePreview.ImagePreview.build(this.#be,this.#ve.args.data.url,!1,{imageAltText:k.ImagePreview.ImagePreview.defaultAltTextForImageURL(this.#ve.args.data.url),precomputedFeatures:void 0});this.#we.set(this.#ve,e)}const e=this.#we.get(this.#ve);return e?this.#Se(Ne(Ie.preview),e):null}#Pe(){return s.html`<span class="whisker-left"> <span class="horizontal"></span> </span>`}#Ie(){return s.html`<span class="whisker-right"> <span class="horizontal"></span> </span>`}#xe(){if(!this.#ve)return null;const e=this.#ve.args.data.syntheticData,i=e.sendStartTime-this.#ve.ts,n=e.downloadStart-e.sendStartTime,r=e.finishTime-e.downloadStart,a=this.#ve.ts+this.#ve.dur-e.finishTime,o=Me(this.#ve),l={backgroundColor:`color-mix(in srgb, ${o}, hsla(0, 100%, 100%, 0.8))`},d={backgroundColor:o};return s.html`
      <div class="timings-row">
        ${this.#Pe()}
        ${Ne(Ie.queuingAndConnecting)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(i)}</span>
      </div>
      <div class="timings-row">
        <span class="indicator" style=${s.Directives.styleMap(l)}></span>
        ${Ne(Ie.requestSentAndWaiting)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(n)}</span>
      </div>
      <div class="timings-row">
        <span class="indicator" style=${s.Directives.styleMap(d)}></span>
        ${Ne(Ie.contentDownloading)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(r)}</span>
      </div>
      <div class="timings-row">
        ${this.#Ie()}
        ${Ne(Ie.waitingOnMainThread)}
        <span class="time">${t.TimeUtilities.formatMicroSecondsTime(a)}</span>
      </div>
    `}async#i(){if(!this.#ve)return;const e=this.#ve.args.data,t=s.html`
      ${this.#ke()}
      <div class="network-request-details-body">
        <div class="network-request-details-col">
          ${this.#ye()}
          ${this.#Se(Ne(Ie.requestMethod),e.requestMethod)}
          ${this.#Se(Ne(Ie.initialPriority),f.NetworkPriorities.uiLabelForNetworkPriority(e.initialPriority))}
          ${this.#Se(Ne(Ie.priority),f.NetworkPriorities.uiLabelForNetworkPriority(e.priority))}
          ${this.#Se(Ne(Ie.mimeType),e.mimeType)}
          ${this.#Ce()}
          ${this.#Se(Ne(Ie.decodedBody),c.NumberUtilities.bytesToString(this.#ve.args.data.decodedBodyLength))}
          ${this.#Re()}
          ${await this.#Me()}
        </div>
        <div class="network-request-details-col">
          ${this.#$e()}
          ${this.#Te()}
        </div>
      </div>
    `;s.render(t,this.#e,{host:this})}}customElements.define("devtools-performance-network-request-details",De);var Ee=Object.freeze({__proto__:null,NetworkRequestDetails:De});const Ue=new CSSStyleSheet;Ue.replaceSync(".bold{font-weight:bold}.url{margin-left:15px;margin-right:5px}.priority{margin-left:15px}.priority > devtools-icon{height:13px;width:13px;color:var(--sys-color-on-surface-subtle)}.render-blocking{margin-left:15px;color:var(--sys-color-error)}.divider{border-top:1px solid var(--sys-color-divider);margin:5px 0}ul{list-style:none;padding:0;margin:0}li{display:flex;align-items:center}.indicator{display:inline-block;width:10px;height:4px;margin-right:5px;border:1px solid var(--sys-color-on-surface-subtle)}.whisker-left{display:flex;width:10px;height:6px;margin-right:5px;border-left:1px solid var(--sys-color-on-surface-subtle)}.whisker-right{display:flex;width:10px;height:6px;margin-right:5px;border-right:1px solid var(--sys-color-on-surface-subtle)}.horizontal{background-color:var(--sys-color-on-surface-subtle);height:1px;width:10px;align-self:center}.time{margin-left:auto}\n/*# sourceURL=networkRequestTooltip.css */\n");const qe="Priority",Oe="Queuing and connecting",Be="Request sent and waiting",Ae="Content downloading",Fe="Waiting on main thread",_e="Render blocking";class He extends HTMLElement{static litTagName=s.literal`devtools-performance-network-request-tooltip`;#e=this.attachShadow({mode:"open"});#ve;connectedCallback(){this.#e.adoptedStyleSheets=[Ue],this.#i()}set networkRequest(e){this.#ve!==e&&(this.#ve=e,this.#i())}#Le(){return this.#ve?this.#ve.args.data.priority===this.#ve.args.data.initialPriority?s.html`
        <div class="priority">${qe}: ${f.NetworkPriorities.uiLabelForNetworkPriority(this.#ve.args.data.priority)}</div>
      `:s.html`
      <div class="priority">
        ${qe}:
        ${f.NetworkPriorities.uiLabelForNetworkPriority(this.#ve.args.data.initialPriority)}
        <${r.Icon.Icon.litTagName} name=${"arrow-forward"}></${r.Icon.Icon.litTagName}>
        ${f.NetworkPriorities.uiLabelForNetworkPriority(this.#ve.args.data.priority)}
      </div>
    `:null}#Pe(){return s.html`<span class="whisker-left"> <span class="horizontal"></span> </span>`}#Ie(){return s.html`<span class="whisker-right"> <span class="horizontal"></span> </span>`}#xe(){if(!this.#ve)return null;const e=this.#ve.args.data.syntheticData,i=e.sendStartTime-this.#ve.ts,n=e.downloadStart-e.sendStartTime,r=e.finishTime-e.downloadStart,a=this.#ve.ts+this.#ve.dur-e.finishTime,o=Me(this.#ve),l={backgroundColor:`color-mix(in srgb, ${o}, hsla(0, 100%, 100%, 0.8))`},d={backgroundColor:o};return s.html`
      <ul>
        <li>
          ${this.#Pe()}
          ${Oe}
          <span class="time">${t.TimeUtilities.formatMicroSecondsTime(i)}</span>
        </li>
        <li>
          <span class="indicator" style=${s.Directives.styleMap(l)}></span>
          ${Be}
          <span class="time">${t.TimeUtilities.formatMicroSecondsTime(n)}</span>
        </li>
        <li>
          <span class="indicator" style=${s.Directives.styleMap(d)}></span>
          ${Ae}
          <span class="time">${t.TimeUtilities.formatMicroSecondsTime(r)}</span>
        </li>
        <li>
          ${this.#Ie()}
          ${Fe}
          <span class="time">${t.TimeUtilities.formatMicroSecondsTime(a)}</span>
        </li>
      </ul>
    `}#i(){if(!this.#ve)return;const e=this.#ve.args.data,n=s.html`
      <div class="performance-card">
        <span class="url">${c.StringUtilities.trimMiddle(e.url,30)}</span>
        <span class="time bold">${t.TimeUtilities.formatMicroSecondsTime(this.#ve.dur)}</span>

        <div class="divider"></div>
        ${this.#Le()}
        ${i.Helpers.Network.isSyntheticNetworkRequestEventRenderBlocking(this.#ve)?s.html`<div class="render-blocking"> ${_e} </div>`:s.nothing}
        <div class="divider"></div>

        ${this.#xe()}
      </div>
    `;s.render(n,this.#e,{host:this})}}customElements.define("devtools-performance-network-request-tooltip",He);var je=Object.freeze({__proto__:null,NetworkRequestTooltip:He});const We=new CSSStyleSheet;We.replaceSync('.sidebar-toggle-button{width:24px;height:24px;margin-top:8px;margin-bottom:8px}.tab-bar{display:flex;.sidebar-toggle-button[name="left-panel-close"]{margin-left:auto;margin-right:4px}}.tabs-header{overflow:hidden;display:flex;justify-content:space-evenly;height:40px;margin-right:auto;flex-grow:0;flex-shrink:0}.tabs-header input{background:none;border:none;color:var(--color-text-secondary);box-sizing:border-box;padding:0 10px}.tabs-header input[active]{color:var(--sys-color-on-surface-subtle)}.tab-slider{position:absolute;top:40px;height:1px;background-color:var(--sys-color-on-surface-subtle);transition:left 150ms cubic-bezier(0,0,0.2,1)}.tab-headers-bottom-line{height:1px;width:100%;background-color:var(--sys-color-divider)}.sidebar-body{padding:0 10px}devtools-select-menu{margin-top:10px;height:25px;border:none}.metrics-row{display:flex;flex-direction:row}.metric{margin-top:10px;flex:1}.metric-value{font-size:20px}.metric-value-bad{color:var(--app-color-performance-bad)}.metric-value-ok{color:var(--app-color-performance-ok)}.metric-value-good{color:var(--app-color-performance-good)}.metric-score-unclassified{color:var(--sys-color-token-subtle)}.metric-label{font-size:12px;font-weight:bold}.navigation-wrapper summary{text-wrap:nowrap;width:100%;overflow:hidden;text-overflow:ellipsis}\n/*# sourceURL=sidebar.css */\n');const Ve=new CSSStyleSheet;Ve.replaceSync(".annotations{display:block;padding:0}.bin-icon{visibility:hidden}.annotation-container{display:flex;justify-content:space-between;align-items:center;&:hover{background-color:var(--sys-color-neutral-container);.bin-icon{visibility:visible}}}.annotation{display:flex;flex-direction:column;align-items:flex-start;word-break:break-all;padding-top:15px;gap:6px}.entry-name{padding:4px 8px;border-radius:10px;font-weight:bold;background-color:var(--app-color-performance-sidebar-label)}.label{font-size:larger}\n/*# sourceURL=sidebarAnnotationsTab.css */\n");class ze extends HTMLElement{static litTagName=s.literal`devtools-performance-sidebar-annotations`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#Ne=[];set annotations(e){this.#Ne=e,n.ScheduledRender.scheduleRender(this,this.#t)}connectedCallback(){this.#e.adoptedStyleSheets=[Ve],n.ScheduledRender.scheduleRender(this,this.#t)}#De(e){const t=i.Types.TraceEvents.isProfileCall(e.entry)?e.entry.callFrame.functionName:e.entry.name;return s.html`
      <div class="annotation-container">
        <div class="annotation">
          <span class="entry-name">
            ${t}
          </span>
          <span class="label">
          ${e.label}
          </span>
        </div>
        <${r.Icon.Icon.litTagName} class="bin-icon" .data=${{iconName:"bin",color:"var(--icon-default)",width:"20px",height:"20px"}} @click=${()=>{this.dispatchEvent(new Ye(e))}}>
      </div>
    `}#i(){s.render(s.html`
              <span class="annotations">
                ${this.#Ne.map((e=>this.#De(e)))}
              </span>`,this.#e,{host:this})}}customElements.define("devtools-performance-sidebar-annotations",ze);var Xe=Object.freeze({__proto__:null,SidebarAnnotationsTab:ze});const Ke=new CSSStyleSheet;Ke.replaceSync(":host{display:block;padding:5px 0}.metrics-row{display:flex;flex-direction:row}.metric{margin-top:10px;flex:1}.metric-value{font-size:20px}.metric-value-bad{color:var(--app-color-performance-bad)}.metric-value-ok{color:var(--app-color-performance-ok)}.metric-value-good{color:var(--app-color-performance-good)}.metric-score-unclassified{color:var(--sys-color-token-subtle)}.metric-label{font-size:12px;font-weight:bold}\n/*# sourceURL=sidebarSingleNavigation.css */\n");class Ge extends HTMLElement{static litTagName=s.literal`devtools-performance-sidebar-single-navigation`;#e=this.attachShadow({mode:"open"});#Ee=this.#i.bind(this);#Ue={traceParsedData:null,insights:null,navigationId:null,activeCategory:Qe.ALL,activeInsight:null};set data(e){this.#Ue=e,n.ScheduledRender.scheduleRender(this,this.#Ee)}connectedCallback(){this.#e.adoptedStyleSheets=[Ke],this.#i()}#qe(e){return this.#Ue.activeCategory===Qe.ALL||e===this.#Ue.activeCategory}#Q(e,t,i){return this.#qe(e)?s.html`
      <div class="metric">
        <div class="metric-value metric-value-${i}">${t}</div>
        <div class="metric-label">${e}</div>
      </div>
    `:s.nothing}#Oe(e,t){const n=e.UserInteractions.interactionEventsWithNoNesting.filter((e=>e.args.data.navigationId===t));if(0===n.length)return null;let r=i.Types.Timing.MicroSeconds(0);for(const e of n)e.dur>r&&(r=e.dur);return r}#Be(e,t){const i=e.LayoutShifts.clusters.filter((e=>e.navigationId===t));let n=0;for(const e of i)e.clusterCumulativeScore>n&&(n=e.clusterCumulativeScore);return n}#Ae(e,n){const r=e.PageLoadMetrics.metricScoresByFrameId.get(e.Meta.mainFrameId)?.get(n),a=r?.get("LCP"),o=this.#Be(e,n),l=this.#Oe(e,n);return s.html`
    <div class="metrics-row">
    ${a?this.#Q("LCP",t.TimeUtilities.formatMicroSecondsAsSeconds(a.timing),a.classification):s.nothing}
    ${this.#Q("CLS",o.toFixed(2),i.Handlers.ModelHandlers.LayoutShifts.scoreClassificationForLayoutShift(o))}
    ${l?this.#Q("INP",t.TimeUtilities.formatMicroSecondsTime(l),i.Handlers.ModelHandlers.UserInteractions.scoreClassificationForInteractionToNextPaint(l)):s.nothing}
    </div>
    `}#Fe(e,t){return s.html`
       <div>
          <${$.LCPPhases.LCPPhases.litTagName}
            .insights=${e}
            .navigationId=${t}
            .activeInsight=${this.#Ue.activeInsight}
            .activeCategory=${this.#Ue.activeCategory}
          </${$.LCPPhases.LCPPhases}>
        </div>`}#i(){const{traceParsedData:e,insights:t,navigationId:i}=this.#Ue;if(!e||!t||!i)return void s.render(s.html``,this.#e,{host:this});e.Meta.navigationsByNavigationId.get(i)?s.render(s.html`
      <div class="navigation">
        ${this.#Ae(e,i)}
        ${this.#Fe(t,i)}
        </div>
      `,this.#e,{host:this}):s.render(s.html``,this.#e,{host:this})}}customElements.define("devtools-performance-sidebar-single-navigation",Ge);const Je="Insights";var Qe;!function(e){e.ALL="All",e.INP="INP",e.LCP="LCP",e.CLS="CLS",e.OTHER="Other"}(Qe||(Qe={}));class Ye extends Event{removedAnnotation;static eventName="removeannotation";constructor(e){super(Ye.eventName,{bubbles:!0,composed:!0}),this.removedAnnotation=e}}class Ze extends(v.ObjectWrapper.eventMixin(h.SplitWidget.SplitWidget)){#_e=new et;constructor(){super(!0,!1,void 0,240),this.sidebarElement().append(this.#_e),this.#_e.addEventListener("closebuttonclick",(()=>{this.dispatchEventToListeners("SidebarCollapseClick",{})}))}updateContentsOnExpand(){this.#_e.onWidgetShow()}setAnnotationsTabContent(e){this.#_e.annotations=e}setTraceParsedData(e){this.#_e.traceParsedData=e}setInsights(e){this.#_e.insights=e}setActiveInsight(e){this.#_e.activeInsight=e}}class et extends HTMLElement{static litTagName=s.literal`devtools-performance-sidebar`;#e=this.attachShadow({mode:"open"});#He=Je;#je=Qe.ALL;#We;#Ve=null;#Ne=[];#Ee=this.#i.bind(this);#ze=null;#Xe=null;connectedCallback(){this.#e.adoptedStyleSheets=[We]}onWidgetShow(){this.#i()}set annotations(e){this.#Ne=e,n.ScheduledRender.scheduleRender(this,this.#Ee)}set insights(e){e!==this.#Ve&&(this.#Ve=e,n.ScheduledRender.scheduleRender(this,this.#Ee))}set activeInsight(e){this.#Xe=e,n.ScheduledRender.scheduleRender(this,this.#Ee)}set traceParsedData(e){this.#We!==e&&(this.#We=e,n.ScheduledRender.scheduleRender(this,this.#Ee))}#Ke(){this.dispatchEvent(new Event("closebuttonclick"))}#Ge(e){e!==this.#He&&(this.#He=e,n.ScheduledRender.scheduleRender(this,this.#Ee))}#Je(){return s.html`
      <div class="tabs-header">
        <input
          type="button"
          value=${"Insights"}
          ?active=${"Insights"===this.#He}
          @click=${()=>this.#Ge("Insights")}>
        <input
          type="button"
          value=${"Annotations"}
          ?active=${"Annotations"===this.#He}
          @click=${()=>this.#Ge("Annotations")}>
      </div>
    `}#Qe(e){this.#je=e.itemValue,n.ScheduledRender.scheduleRender(this,this.#Ee)}#Ye(){const e=this.#We?.Meta.mainFrameNavigations??[],t=e.length>1;return s.html`
      <${l.SelectMenu.SelectMenu.litTagName}
            class="target-select-menu"
            @selectmenuselected=${this.#Qe}
            .showDivider=${!0}
            .showArrow=${!0}
            .sideButton=${!1}
            .showSelectedItem=${!0}
            .showConnector=${!1}
            .position=${"bottom"}
            .buttonTitle=${this.#je}
            jslog=${a.dropDown("timeline.sidebar-insights-category-select").track({click:!0})}
          >
          ${Object.values(Qe).map((e=>s.html`
              <${l.Menu.MenuItem.litTagName} .value=${e}>
                ${e}
              </${l.Menu.MenuItem.litTagName}>
            `))}
      </${l.SelectMenu.SelectMenu.litTagName}>

      ${e.map((e=>{const i=e.args.data?.navigationId,n=e.args.data?.documentLoaderURL;if(!i||!n)return s.nothing;const r={traceParsedData:this.#We??null,insights:this.#Ve,navigationId:i,activeCategory:this.#je,activeInsight:this.#Xe},a=s.html`
          <${Ge.litTagName}
            .data=${r}>
          </${Ge.litTagName}>
        `;return t?s.html`<div class="multi-nav-container">
            <details ?open=${i===this.#ze} class="navigation-wrapper"><summary @click=${()=>this.#Ze(i)}>${n}</summary>${a}</details>
            </div>`:a}))}
    `}#Ze(e){return e!==this.#Xe?.navigationId&&this.dispatchEvent(new $.SidebarInsight.InsightDeactivated),this.#ze=e,e=>{e.preventDefault(),n.ScheduledRender.scheduleRender(this,this.#Ee)}}#et(){switch(this.#He){case"Insights":return this.#Ye();case"Annotations":return s.html`
        <${ze.litTagName} .annotations=${this.#Ne}></${ze.litTagName}>
      `;default:return null}}#tt(){const e=this.#e.querySelector(".tabs-header input:nth-child(1)"),t=this.#e.querySelector(".tabs-header input:nth-child(2)"),i=this.#e.querySelector(".tab-slider");if(e&&t&&i){const n=e.getBoundingClientRect().width,r=t.getBoundingClientRect().width;switch(this.#He){case"Insights":return i.style.left="0",void(i.style.width=`${n}px`);case"Annotations":return i.style.left=`${n}px`,void(i.style.width=`${r}px`)}}}#i(){const e=s.html`<div class="sidebar">
      <div class="tab-bar">
        ${this.#Je()}
        <${r.Icon.Icon.litTagName}
          name='left-panel-close'
          @click=${this.#Ke}
          class="sidebar-toggle-button"
          jslog=${a.action("timeline.sidebar-close").track({click:!0})}
        ></${r.Icon.Icon.litTagName}>
      </div>
      <div class="tab-slider"></div>
      <div class="tab-headers-bottom-line"></div>
      <div class="sidebar-body">${this.#et()}</div>
    </div>`;s.render(e,this.#e,{host:this}),this.#tt()}}customElements.define("devtools-performance-sidebar",et);var tt=Object.freeze({__proto__:null,DEFAULT_SIDEBAR_TAB:Je,get InsightsCategories(){return Qe},RemoveAnnotation:Ye,SidebarWidget:Ze,SidebarUI:et});export{x as Breadcrumbs,L as BreadcrumbsUI,O as CPUThrottlingSelector,_ as DetailsView,J as FieldSettingsDialog,ie as InteractionBreakdown,Te as LiveMetricsView,Ee as NetworkRequestDetails,je as NetworkRequestTooltip,ce as NetworkThrottlingSelector,tt as Sidebar,Xe as SidebarAnnotationsTab,Pe as Utils};
