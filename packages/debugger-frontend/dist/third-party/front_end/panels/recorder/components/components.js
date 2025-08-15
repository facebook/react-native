import*as e from"../../../ui/lit/lit.js";import*as t from"../../../ui/legacy/legacy.js";import"../../../ui/components/icon_button/icon_button.js";import*as o from"../../../core/i18n/i18n.js";import*as r from"../../../ui/components/buttons/buttons.js";import*as s from"../../../ui/components/input/input.js";import*as i from"../../../ui/visual_logging/visual_logging.js";import*as n from"../models/models.js";import*as a from"../../../ui/components/helpers/helpers.js";import*as l from"../extensions/extensions.js";import*as c from"../../../core/host/host.js";import*as d from"../../../core/platform/platform.js";import*as p from"../../../core/sdk/sdk.js";import*as u from"../../../third_party/codemirror.next/codemirror.next.js";import*as h from"../../../ui/components/code_highlighter/code_highlighter.js";import"../../../ui/components/dialogs/dialogs.js";import*as v from"../../../ui/components/text_editor/text_editor.js";import*as g from"../../../ui/components/menus/menus.js";import*as b from"../../../ui/components/suggestion_input/suggestion_input.js";import*as m from"../controllers/controllers.js";import*as y from"../util/util.js";var f={cssText:`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.control{background:none;border:none;display:flex;flex-direction:column;align-items:center}.control[disabled]{filter:grayscale(100%);cursor:auto}.icon{display:flex;width:40px;height:40px;border-radius:50%;background:var(--sys-color-error-bright);margin-bottom:8px;position:relative;transition:background 200ms;place-content:center center;align-items:center}.icon::before{--override-white:#fff;box-sizing:border-box;content:"";display:block;width:14px;height:14px;border:1px solid var(--override-white);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background-color:var(--override-white)}.icon.square::before{border-radius:0}.icon.circle::before{border-radius:50%}.icon:hover{background:color-mix(in srgb,var(--sys-color-error-bright),var(--sys-color-state-hover-on-prominent) 10%)}.icon:active{background:color-mix(in srgb,var(--sys-color-error-bright),var(--sys-color-state-ripple-neutral-on-prominent) 16%)}.control[disabled] .icon:hover{background:var(--sys-color-error)}.label{font-size:12px;line-height:16px;text-align:center;letter-spacing:0.02em;color:var(--sys-color-on-surface)}\n/*# sourceURL=${import.meta.resolve("./controlButton.css")} */\n`},x=self&&self.__decorate||function(e,t,o,r){var s,i=arguments.length,n=i<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,o):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,o,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(i<3?s(n):i>3?s(t,o,n):s(t,o))||n);return i>3&&n&&Object.defineProperty(t,o,n),n};const w=new CSSStyleSheet;w.replaceSync(f.cssText);const{html:S,Decorators:k,LitElement:$}=e,{customElement:E,property:C}=k;let R=class extends ${static styles=[w];constructor(){super(),this.label="",this.shape="square",this.disabled=!1}#e=e=>{this.disabled&&(e.stopPropagation(),e.preventDefault())};render(){return S`
            <button
                @click=${this.#e}
                .disabled=${this.disabled}
                class="control"
            >
                <div class="icon ${this.shape}"></div>
                <div class="label">${this.label}</div>
            </button>
        `}};x([C()],R.prototype,"label",void 0),x([C()],R.prototype,"shape",void 0),x([C({type:Boolean})],R.prototype,"disabled",void 0),R=x([E("devtools-control-button")],R);var T=Object.freeze({__proto__:null,get ControlButton(){return R}}),I={cssText:`*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.wrapper{padding:24px;flex:1}h1{font-size:18px;line-height:24px;letter-spacing:0.02em;color:var(--sys-color-on-surface);margin:0;font-weight:normal}.row-label{font-weight:500;font-size:11px;line-height:16px;letter-spacing:0.8px;text-transform:uppercase;color:var(--sys-color-secondary);margin-bottom:8px;margin-top:32px;display:flex;align-items:center;gap:3px}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container)}.controls{display:flex}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error)}.row-label .link:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}.header-wrapper{display:flex;align-items:baseline;justify-content:space-between}.checkbox-label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis;gap:4px;line-height:1.1;padding:4px}.checkbox-container{display:flex;flex-flow:row wrap;gap:10px}input[type="checkbox"]:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}devtools-icon[name="help"]{width:16px;height:16px}\n/*# sourceURL=${import.meta.resolve("./createRecordingView.css")} */\n`};const N=new CSSStyleSheet;N.replaceSync(I.cssText);const{html:j,Directives:{ifDefined:A}}=e,z={recordingName:"Recording name",startRecording:"Start recording",createRecording:"Create a new recording",recordingNameIsRequired:"Recording name is required",selectorAttribute:"Selector attribute",cancelRecording:"Cancel recording",selectorTypeCSS:"CSS",selectorTypePierce:"Pierce",selectorTypeARIA:"ARIA",selectorTypeText:"Text",selectorTypeXPath:"XPath",selectorTypes:"Selector types to record",includeNecessarySelectors:"You must choose CSS, Pierce, or XPath as one of your options. Only these selectors are guaranteed to be recorded since ARIA and text selectors may not be unique.",learnMore:"Learn more"},M=o.i18n.registerUIStrings("panels/recorder/components/CreateRecordingView.ts",z),B=o.i18n.getLocalizedString.bind(void 0,M);class P extends Event{static eventName="recordingstarted";name;selectorAttribute;selectorTypesToRecord;constructor(e,t,o){super(P.eventName,{}),this.name=e,this.selectorAttribute=o||void 0,this.selectorTypesToRecord=t}}class L extends Event{static eventName="recordingcancelled";constructor(){super(L.eventName)}}class O extends HTMLElement{#t=this.attachShadow({mode:"open"});#o="";#r;#s;constructor(){super(),this.setAttribute("jslog",`${i.section("create-recording-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[N,s.textInputStyles,s.checkboxStyles],this.#i(),this.#t.querySelector("input")?.focus()}set data(e){this.#s=e.recorderSettings,this.#o=this.#s.defaultTitle}#n(e){this.#r&&(this.#r=void 0,this.#i());"Enter"===e.key&&(this.startRecording(),e.stopPropagation(),e.preventDefault())}startRecording(){const e=this.#t.querySelector("#user-flow-name");if(!e)throw new Error("input#user-flow-name not found");if(!this.#s)throw new Error("settings not set");if(!e.value.trim())return this.#r=new Error(B(z.recordingNameIsRequired)),void this.#i();const t=this.#t.querySelectorAll(".selector-type input[type=checkbox]"),o=[];for(const e of t){const t=e,r=t.value;t.checked&&o.push(r)}if(!o.includes(n.Schema.SelectorType.CSS)&&!o.includes(n.Schema.SelectorType.XPath)&&!o.includes(n.Schema.SelectorType.Pierce))return this.#r=new Error(B(z.includeNecessarySelectors)),void this.#i();for(const e of Object.values(n.Schema.SelectorType))this.#s.setSelectorByType(e,o.includes(e));const r=this.#t.querySelector("#selector-attribute").value.trim();this.#s.selectorAttribute=r,this.dispatchEvent(new P(e.value.trim(),o,r))}#a(){this.dispatchEvent(new L)}#l=()=>{this.#t.querySelector("#user-flow-name")?.select()};#i(){const t=new Map([[n.Schema.SelectorType.ARIA,B(z.selectorTypeARIA)],[n.Schema.SelectorType.CSS,B(z.selectorTypeCSS)],[n.Schema.SelectorType.Text,B(z.selectorTypeText)],[n.Schema.SelectorType.XPath,B(z.selectorTypeXPath)],[n.Schema.SelectorType.Pierce,B(z.selectorTypePierce)]]);e.render(j`
        <div class="wrapper">
          <div class="header-wrapper">
            <h1>${B(z.createRecording)}</h1>
            <devtools-button
              title=${B(z.cancelRecording)}
              jslog=${i.close().track({click:!0})}
              .data=${{variant:"icon",size:"SMALL",iconName:"cross"}}
              @click=${this.#a}
            ></devtools-button>
          </div>
          <label class="row-label" for="user-flow-name">${B(z.recordingName)}</label>
          <input
            value=${this.#o}
            @focus=${this.#l}
            @keydown=${this.#n}
            jslog=${i.textField("user-flow-name").track({change:!0})}
            class="devtools-text-input"
            id="user-flow-name"
          />
          <label class="row-label" for="selector-attribute">
            <span>${B(z.selectorAttribute)}</span>
            <x-link
              class="link" href="https://g.co/devtools/recorder#selector"
              title=${B(z.learnMore)}
              jslog=${i.link("recorder-selector-help").track({click:!0})}>
              <devtools-icon name="help">
              </devtools-icon>
            </x-link>
          </label>
          <input
            value=${A(this.#s?.selectorAttribute)}
            placeholder="data-testid"
            @keydown=${this.#n}
            jslog=${i.textField("selector-attribute").track({change:!0})}
            class="devtools-text-input"
            id="selector-attribute"
          />
          <label class="row-label">
            <span>${B(z.selectorTypes)}</span>
            <x-link
              class="link" href="https://g.co/devtools/recorder#selector"
              title=${B(z.learnMore)}
              jslog=${i.link("recorder-selector-help").track({click:!0})}>
              <devtools-icon name="help">
              </devtools-icon>
            </x-link>
          </label>
          <div class="checkbox-container">
            ${Object.values(n.Schema.SelectorType).map((e=>{const o=this.#s?.getSelectorByType(e);return j`
                  <label class="checkbox-label selector-type">
                    <input
                      @keydown=${this.#n}
                      .value=${e}
                      jslog=${i.toggle().track({click:!0}).context(`selector-${e}`)}
                      ?checked=${o}
                      type="checkbox"
                    />
                    ${t.get(e)||e}
                  </label>
                `}))}
          </div>

          ${this.#r&&j`
          <div class="error" role="alert">
            ${this.#r.message}
          </div>
        `}
        </div>
        <div class="footer">
          <div class="controls">
            <devtools-control-button
              @click=${this.startRecording}
              .label=${B(z.startRecording)}
              .shape=${"circle"}
              jslog=${i.action("chrome-recorder.start-recording").track({click:!0})}
              title=${n.Tooltip.getTooltipForActions(B(z.startRecording),"chrome-recorder.start-recording")}
            ></devtools-control-button>
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-create-recording-view",O);var F=Object.freeze({__proto__:null,CreateRecordingView:O,RecordingCancelledEvent:L,RecordingStartedEvent:P}),D={cssText:`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}*:focus,\n*:focus-visible{outline:none}.wrapper{padding:24px}.header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}h1{font-size:16px;line-height:19px;color:var(--sys-color-on-surface);font-weight:normal}.icon,\n.icon devtools-icon{width:20px;height:20px;color:var(--sys-color-primary)}.table{margin-top:35px}.title{font-size:13px;color:var(--sys-color-on-surface);margin-left:10px;flex:1;overflow-x:hidden;white-space:nowrap;text-overflow:ellipsis}.row{display:flex;align-items:center;padding-right:5px;height:28px;border-bottom:1px solid var(--sys-color-divider)}.row:focus-within,\n.row:hover{background-color:var(--sys-color-state-hover-on-subtle)}.row:last-child{border-bottom:none}.actions{display:flex;align-items:center}.actions button{border:none;background-color:transparent;width:24px;height:24px;border-radius:50%}.actions .divider{width:1px;height:17px;background-color:var(--sys-color-divider);margin:0 6px}\n/*# sourceURL=${import.meta.resolve("./recordingListView.css")} */\n`};const V=new CSSStyleSheet;V.replaceSync(D.cssText);const{html:_}=e,K={savedRecordings:"Saved recordings",createRecording:"Create a new recording",playRecording:"Play recording",deleteRecording:"Delete recording",openRecording:"Open recording"},G=o.i18n.registerUIStrings("panels/recorder/components/RecordingListView.ts",K),U=o.i18n.getLocalizedString.bind(void 0,G);class H extends Event{static eventName="createrecording";constructor(){super(H.eventName)}}class q extends Event{storageName;static eventName="deleterecording";constructor(e){super(q.eventName),this.storageName=e}}class W extends Event{storageName;static eventName="openrecording";constructor(e){super(W.eventName),this.storageName=e}}let X=class e extends Event{storageName;static eventName="playrecording";constructor(t){super(e.eventName),this.storageName=t}};class Y extends HTMLElement{#t=this.attachShadow({mode:"open"});#c={recordings:[],replayAllowed:!0};constructor(){super()}connectedCallback(){this.#t.adoptedStyleSheets=[V],a.ScheduledRender.scheduleRender(this,this.#i)}set recordings(e){this.#c.recordings=e,a.ScheduledRender.scheduleRender(this,this.#i)}set replayAllowed(e){this.#c.replayAllowed=e,a.ScheduledRender.scheduleRender(this,this.#i)}#d(){this.dispatchEvent(new H)}#p(e,t){t.stopPropagation(),this.dispatchEvent(new q(e))}#u(e,t){t.stopPropagation(),this.dispatchEvent(new W(e))}#h(e,t){t.stopPropagation(),this.dispatchEvent(new X(e))}#n(e,t){"Enter"===t.key&&this.#u(e,t)}#v(e){e.stopPropagation()}#i=()=>{e.render(_`
        <div class="wrapper">
          <div class="header">
            <h1>${U(K.savedRecordings)}</h1>
            <devtools-button
              .variant=${"primary"}
              @click=${this.#d}
              title=${n.Tooltip.getTooltipForActions(U(K.createRecording),"chrome-recorder.create-recording")}
              .jslogContext=${"create-recording"}
            >
              ${U(K.createRecording)}
            </devtools-button>
          </div>
          <div class="table">
            ${this.#c.recordings.map((e=>_`
                  <div
                    role="button"
                    tabindex="0"
                    aria-label=${U(K.openRecording)}
                    class="row"
                    @keydown=${this.#n.bind(this,e.storageName)}
                    @click=${this.#u.bind(this,e.storageName)}
                    jslog=${i.item().track({click:!0}).context("recording")}>
                    <div class="icon">
                      <devtools-icon name="flow">
                      </devtools-icon>
                    </div>
                    <div class="title">${e.name}</div>
                    <div class="actions">
                      ${this.#c.replayAllowed?_`
                              <devtools-button
                                title=${U(K.playRecording)}
                                .data=${{variant:"icon",iconName:"play",jslogContext:"play-recording"}}
                                @click=${this.#h.bind(this,e.storageName)}
                                @keydown=${this.#v}
                              ></devtools-button>
                              <div class="divider"></div>`:""}
                      <devtools-button
                        class="delete-recording-button"
                        title=${U(K.deleteRecording)}
                        .data=${{variant:"icon",iconName:"bin",jslogContext:"delete-recording"}}
                        @click=${this.#p.bind(this,e.storageName)}
                        @keydown=${this.#v}
                      ></devtools-button>
                    </div>
                  </div>
                `))}
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-recording-list-view",Y);var J=Object.freeze({__proto__:null,CreateRecordingEvent:H,DeleteRecordingEvent:q,OpenRecordingEvent:W,PlayRecordingEvent:X,RecordingListView:Y}),Z={cssText:`*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.extension-view{display:flex;flex-direction:column;height:100%}main{flex:1}iframe{border:none;height:100%;width:100%}header{display:flex;padding:3px 8px;justify-content:space-between;border-bottom:1px solid var(--sys-color-divider)}header > div{align-self:center}.icon{display:block;width:16px;height:16px;color:var(--sys-color-secondary)}.title{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-secondary);align-items:center;font-weight:500}\n/*# sourceURL=${import.meta.resolve("./extensionView.css")} */\n`};const Q=new CSSStyleSheet;Q.replaceSync(Z.cssText);const{html:ee}=e,te={closeView:"Close",extension:"Content provided by a browser extension"},oe=o.i18n.registerUIStrings("panels/recorder/components/ExtensionView.ts",te),re=o.i18n.getLocalizedString.bind(void 0,oe);class se extends Event{static eventName="recorderextensionviewclosed";constructor(){super(se.eventName,{bubbles:!0,composed:!0})}}class ie extends HTMLElement{#t=this.attachShadow({mode:"open"});#g;constructor(){super(),this.setAttribute("jslog",`${i.section("extension-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[Q],this.#i()}disconnectedCallback(){this.#g&&l.ExtensionManager.ExtensionManager.instance().getView(this.#g.id).hide()}set descriptor(e){this.#g=e,this.#i(),l.ExtensionManager.ExtensionManager.instance().getView(e.id).show()}#b(){this.dispatchEvent(new se)}#i(){if(!this.#g)return;const t=l.ExtensionManager.ExtensionManager.instance().getView(this.#g.id).frame();e.render(ee`
        <div class="extension-view">
          <header>
            <div class="title">
              <devtools-icon
                class="icon"
                title=${re(te.extension)}
                name="extension">
              </devtools-icon>
              ${this.#g.title}
            </div>
            <devtools-button
              title=${re(te.closeView)}
              jslog=${i.close().track({click:!0})}
              .data=${{variant:"icon",size:"SMALL",iconName:"cross"}}
              @click=${this.#b}
            ></devtools-button>
          </header>
          <main>
            ${t}
          </main>
      </div>
    `,this.#t,{host:this})}}customElements.define("devtools-recorder-extension-view",ie);const{html:ne}=e,ae={Replay:"Replay",ReplayNormalButtonLabel:"Normal speed",ReplayNormalItemLabel:"Normal (Default)",ReplaySlowButtonLabel:"Slow speed",ReplaySlowItemLabel:"Slow",ReplayVerySlowButtonLabel:"Very slow speed",ReplayVerySlowItemLabel:"Very slow",ReplayExtremelySlowButtonLabel:"Extremely slow speed",ReplayExtremelySlowItemLabel:"Extremely slow",speedGroup:"Speed",extensionGroup:"Extensions"},le=[{value:"normal",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplayNormalButtonLabel),label:()=>pe(ae.ReplayNormalItemLabel)},{value:"slow",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplaySlowButtonLabel),label:()=>pe(ae.ReplaySlowItemLabel)},{value:"very_slow",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplayVerySlowButtonLabel),label:()=>pe(ae.ReplayVerySlowItemLabel)},{value:"extremely_slow",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplayExtremelySlowButtonLabel),label:()=>pe(ae.ReplayExtremelySlowItemLabel)}],ce={normal:1,slow:2,very_slow:3,extremely_slow:4},de=o.i18n.registerUIStrings("panels/recorder/components/ReplaySection.ts",ae),pe=o.i18n.getLocalizedString.bind(void 0,de);class ue extends Event{speed;extension;static eventName="startreplay";constructor(e,t){super(ue.eventName,{bubbles:!0,composed:!0}),this.speed=e,this.extension=t}}const he="extension";class ve extends HTMLElement{#t=this.attachShadow({mode:"open"});#m=this.#i.bind(this);#c={disabled:!1};#y;#f=[];set data(e){this.#y=e.settings,this.#f=e.replayExtensions}get disabled(){return this.#c.disabled}set disabled(e){this.#c.disabled=e,a.ScheduledRender.scheduleRender(this,this.#m)}connectedCallback(){a.ScheduledRender.scheduleRender(this,this.#m)}#x(e){const t=e.value;this.#y&&e.value&&(this.#y.speed=t,this.#y.replayExtension=""),c.userMetrics.recordingReplaySpeed(ce[t]),a.ScheduledRender.scheduleRender(this,this.#m)}#w(e){if(e.stopPropagation(),e.value?.startsWith(he)){this.#y&&(this.#y.replayExtension=e.value);const t=Number(e.value.substring(9));return this.dispatchEvent(new ue("normal",this.#f[t])),void a.ScheduledRender.scheduleRender(this,this.#m)}this.dispatchEvent(new ue(this.#y?this.#y.speed:"normal")),a.ScheduledRender.scheduleRender(this,this.#m)}#i(){const t=[{name:pe(ae.speedGroup),items:le}];this.#f.length&&t.push({name:pe(ae.extensionGroup),items:this.#f.map(((e,t)=>({value:he+t,buttonIconName:"play",buttonLabel:()=>e.getName(),label:()=>e.getName()})))}),e.render(ne`
    <devtools-select-button
      @selectmenuselected=${this.#x}
      @selectbuttonclick=${this.#w}
      .variant=${"primary"}
      .showItemDivider=${!1}
      .disabled=${this.#c.disabled}
      .action=${"chrome-recorder.replay-recording"}
      .value=${this.#y?.replayExtension||this.#y?.speed||""}
      .buttonLabel=${pe(ae.Replay)}
      .groups=${t}
      jslog=${i.action("chrome-recorder.replay-recording").track({click:!0})}
    ></devtools-select-button>`,this.#t,{host:this})}}customElements.define("devtools-replay-section",ve);var ge=Object.freeze({__proto__:null,ReplaySection:ve,StartReplayEvent:ue}),be={cssText:`*{box-sizing:border-box;min-width:0;min-height:0}:root{height:100%;overflow:hidden;interpolate-size:allow-keywords}body{height:100%;width:100%;position:relative;overflow:hidden;margin:0;cursor:default;font-family:var(--default-font-family);font-size:12px;tab-size:4;user-select:none;color:var(--sys-color-on-surface);background:var(--sys-color-cdt-base-container)}:focus{outline-width:0}.monospace{font-family:var(--monospace-font-family);font-size:var(\n    --monospace-font-size\n  )!important}.source-code{font-family:var(--source-code-font-family);font-size:var(\n    --source-code-font-size\n  )!important;white-space:pre-wrap;&:not(input)::selection{color:var(--sys-color-on-surface)}}.source-code.breakpoint{white-space:nowrap}.source-code .devtools-link.text-button{max-width:100%;overflow:hidden;text-overflow:ellipsis}img{-webkit-user-drag:none}iframe,\na img{border:none}.fill{position:absolute;inset:0}iframe.fill{width:100%;height:100%}.widget{position:relative;flex:auto;contain:style}.hbox{display:flex;flex-direction:row!important;position:relative}.vbox{display:flex;flex-direction:column!important;position:relative}.view-container > devtools-toolbar{border-bottom:1px solid var(--sys-color-divider)}.flex-auto{flex:auto}.flex-none{flex:none}.flex-centered{display:flex;align-items:center;justify-content:center}.overflow-auto{overflow:auto;background-color:var(--sys-color-cdt-base-container)}iframe.widget{position:absolute;width:100%;height:100%;inset:0}.hidden{display:none!important}.highlighted-search-result{border-radius:1px;background-color:var(--sys-color-yellow-container);outline:1px solid var(--sys-color-yellow-container)}.link{cursor:pointer;text-decoration:underline;color:var(--sys-color-primary);outline-offset:2px}button,\ninput,\nselect{font-family:inherit;font-size:inherit}select option,\nselect optgroup,\ninput{background-color:var(--sys-color-cdt-base-container)}input{color:inherit;&[type="checkbox"]{position:relative;outline:none;display:flex;align-items:center;justify-content:center;&:hover::after,\n    &:active::before{content:"";height:24px;width:24px;border-radius:var(--sys-shape-corner-full);position:absolute}&:not(.-theme-preserve){accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary)}&:not(:disabled):hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:not(:disabled):active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:not(:disabled):focus-visible::before{content:"";height:15px;width:15px;border-radius:5px;position:absolute;border:2px solid var(--sys-color-state-focus-ring)}&.small:hover::after,\n    &.small:active::before{height:12px;width:12px;border-radius:2px}}}input::placeholder{--override-input-placeholder-color:rgb(0 0 0/54%);color:var(--override-input-placeholder-color)}.theme-with-dark-background input::placeholder,\n:host-context(.theme-with-dark-background) input::placeholder{--override-input-placeholder-color:rgb(230 230 230/54%)}.harmony-input:not([type]),\n.harmony-input[type="number"],\n.harmony-input[type="text"]{padding:3px 6px;height:24px;border:1px solid var(--sys-color-neutral-outline);border-radius:4px;&.error-input,\n  &:invalid{border-color:var(--sys-color-error)}&:not(.error-input, :invalid):focus{border-color:var(--sys-color-state-focus-ring)}&:not(.error-input, :invalid):hover:not(:focus){background:var(--sys-color-state-hover-on-subtle)}}input[type="radio"]{height:17px;width:17px;min-width:17px;border-radius:8px;vertical-align:sub;margin:0 5px 5px 0;accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary);&:focus{box-shadow:var(--legacy-focus-ring-active-shadow)}}@media (forced-colors: active){input[type="radio"]{--gradient-start:ButtonFace;--gradient-end:ButtonFace;&:checked{--gradient-start:Highlight;--gradient-end:Highlight}}}input[type="range"]{appearance:none;margin:0;padding:0;height:10px;width:88px;outline:none;background:none}input[type="range"]::-webkit-slider-thumb,\n.-theme-preserve{appearance:none;margin:0;padding:0;border:0;width:12px;height:12px;margin-top:-5px;border-radius:50%;background-color:var(--sys-color-primary)}input[type="range"]::-webkit-slider-runnable-track{appearance:none;margin:0;padding:0;width:100%;height:2px;background-color:var(--sys-color-surface-variant)}input[type="range"]:focus::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--sys-color-inverse-primary)}input[type="range"]:disabled::-webkit-slider-thumb{background-color:var(--sys-color-state-disabled)}@media (forced-colors: active){input[type="range"]{forced-color-adjust:none}}.highlighted-search-result.current-search-result{--override-current-search-result-background-color:rgb(255 127 0/80%);border-radius:1px;padding:1px;margin:-1px;background-color:var(--override-current-search-result-background-color)}.dimmed{opacity:60%}.editing{box-shadow:var(--drop-shadow);background-color:var(--sys-color-cdt-base-container);text-overflow:clip!important;padding-left:2px;margin-left:-2px;padding-right:2px;margin-right:-2px;margin-bottom:-1px;padding-bottom:1px;opacity:100%!important}.editing,\n.editing *{color:var(\n    --sys-color-on-surface\n  )!important;text-decoration:none!important}select{appearance:none;user-select:none;height:var(--sys-size-11);border:var(--sys-size-1) solid var(--sys-color-neutral-outline);border-radius:var(--sys-shape-corner-extra-small);color:var(--sys-color-on-surface);font:inherit;margin:0;outline:none;padding:0 var(--sys-size-9) 0 var(--sys-size-5);background-image:var(--combobox-dropdown-arrow);background-color:transparent;background-position:right center;background-repeat:no-repeat;&:disabled{opacity:100%;border-color:transparent;color:var(--sys-color-state-disabled);background-color:var(--sys-color-state-disabled-container);pointer-events:none}&:enabled{&:hover{background-color:var(--sys-color-state-hover-on-subtle)}&:active{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:hover:active{background:var(--combobox-dropdown-arrow),linear-gradient(var(--sys-color-state-hover-on-subtle),var(--sys-color-state-hover-on-subtle)),linear-gradient(var(--sys-color-state-ripple-neutral-on-subtle),var(--sys-color-state-ripple-neutral-on-subtle));background-position:right center;background-repeat:no-repeat}&:focus{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring);outline-offset:-1px}}}@media (forced-colors: active) and (prefers-color-scheme: light){:root,\n  .theme-with-dark-background,\n  :host-context(.theme-with-dark-background){--combobox-dropdown-arrow:var(--image-file-arrow-drop-down-light)}}@media (forced-colors: active) and (prefers-color-scheme: dark){:root,\n  .theme-with-dark-background,\n  :host-context(.theme-with-dark-background){--combobox-dropdown-arrow:var(--image-file-arrow-drop-down-dark)}}.chrome-select-label{margin:0 var(--sys-size-10);flex:none;p p{margin-top:0;color:var(--sys-color-token-subtle)}.reload-warning{margin-left:var(--sys-size-5)}}.settings-select{margin:0}select optgroup,\nselect option{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface)}.gray-info-message{text-align:center;font-style:italic;padding:6px;color:var(--sys-color-token-subtle);white-space:nowrap}.empty-state{margin:var(--sys-size-5);display:flex;flex-grow:1;justify-content:center;align-items:center;flex-direction:column;text-align:center;min-height:fit-content;min-width:fit-content;> *{max-width:var(--sys-size-29)}.empty-state-header{font:var(--sys-typescale-headline5);margin-bottom:var(--sys-size-3)}.empty-state-description{font:var(--sys-typescale-body4-regular);color:var(--sys-color-on-surface-subtle);> x-link{white-space:nowrap;margin-left:var(--sys-size-3)}}> devtools-button{margin-top:var(--sys-size-7)}}dt-icon-label{flex:none}.full-widget-dimmed-banner a{color:inherit}.full-widget-dimmed-banner{color:var(--sys-color-token-subtle);background-color:var(--sys-color-cdt-base-container);display:flex;justify-content:center;align-items:center;text-align:center;padding:20px;position:absolute;inset:0;font-size:13px;overflow:auto;z-index:500}.dot::before{content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-default);left:9px;position:absolute;top:9px;z-index:1}.green::before{background-color:var(--sys-color-green-bright)}.purple::before{background-color:var(--sys-color-purple-bright)}.expandable-inline-button{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface);cursor:pointer;border-radius:3px}.undisplayable-text,\n.expandable-inline-button{border:none;padding:1px 3px;margin:0 2px;font-size:11px;font-family:sans-serif;white-space:nowrap;display:inline-block}.undisplayable-text::after,\n.expandable-inline-button::after{content:attr(data-text)}.undisplayable-text{color:var(--sys-color-state-disabled);font-style:italic}.expandable-inline-button:hover,\n.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-hover-on-subtle)}.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-focus-highlight)}::selection{background-color:var(--sys-color-state-text-highlight);color:var(--sys-color-state-on-text-highlight)}button.link{border:none;background:none;padding:3px}button.link:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px;border-radius:var(--sys-shape-corner-full)}.data-grid-data-grid-node button.link:focus-visible{border-radius:var(--sys-shape-corner-extra-small);padding:0;margin-top:3px}@media (forced-colors: active){.dimmed,\n  select:disabled{opacity:100%}.harmony-input:not([type]),\n  .harmony-input[type="number"],\n  .harmony-input[type="text"]{border:1px solid ButtonText}.harmony-input:not([type]):focus,\n  .harmony-input[type="number"]:focus,\n  .harmony-input[type="text"]:focus{border:1px solid Highlight}}input.custom-search-input::-webkit-search-cancel-button{appearance:none;width:16px;height:15px;margin-right:0;opacity:70%;mask-image:var(--image-file-cross-circle-filled);mask-position:center;mask-repeat:no-repeat;mask-size:99%;background-color:var(--icon-default)}input.custom-search-input::-webkit-search-cancel-button:hover{opacity:99%}.spinner::before{display:block;width:var(--dimension,24px);height:var(--dimension,24px);border:var(--override-spinner-size,3px) solid var(--override-spinner-color,var(--sys-color-token-subtle));border-radius:12px;clip:rect(0,var(--clip-size,15px),var(--clip-size,15px),0);content:"";position:absolute;animation:spinner-animation 1s linear infinite;box-sizing:border-box}@keyframes spinner-animation{from{transform:rotate(0)}to{transform:rotate(360deg)}}.adorner-container{display:inline-flex;vertical-align:middle}.adorner-container.hidden{display:none}.adorner-container devtools-adorner{margin-left:3px}:host-context(.theme-with-dark-background) devtools-adorner{--override-adorner-border-color:var(--sys-color-tonal-outline);--override-adorner-active-background-color:var(\n    --sys-color-state-riple-neutral-on-subtle\n  )}.panel{display:flex;overflow:hidden;position:absolute;inset:0;z-index:0;background-color:var(--sys-color-cdt-base-container)}.panel-sidebar{overflow-x:hidden;background-color:var(--sys-color-cdt-base-container)}iframe.extension{flex:auto;width:100%;height:100%}iframe.panel.extension{display:block;height:100%}@media (forced-colors: active){:root{--legacy-accent-color:Highlight;--legacy-focus-ring-inactive-shadow-color:ButtonText}}devtools-toolbar{& > *{position:relative;display:flex;background-color:transparent;flex:none;align-items:center;justify-content:center;height:var(--toolbar-height);border:none;white-space:pre;overflow:hidden;max-width:100%;color:var(--icon-default);cursor:default;& .devtools-link{color:var(--icon-default)}}.status-buttons{padding:0 var(--sys-size-2);gap:var(--sys-size-2)}& > :not(select){padding:0}& > devtools-issue-counter{margin-top:-4px;padding:0 1px}devtools-adorner.fix-perf-icon{--override-adorner-text-color:transparent;--override-adorner-border-color:transparent;--override-adorner-background-color:transparent}devtools-issue-counter.main-toolbar{margin-left:1px;margin-right:1px}.toolbar-dropdown-arrow{pointer-events:none;flex:none;top:2px}.toolbar-button.dark-text .toolbar-dropdown-arrow{color:var(--sys-color-on-surface)}.toolbar-button{white-space:nowrap;overflow:hidden;min-width:28px;background:transparent;border-radius:0;&[aria-haspopup="true"][aria-expanded="true"]{pointer-events:none}}.toolbar-item-search{min-width:5.2em;max-width:300px;flex:1 1 auto;justify-content:start;overflow:revert}.toolbar-text{margin:0 5px;flex:none;color:var(--ui-text)}.toolbar-text:empty{margin:0}.toolbar-has-dropdown{justify-content:space-between;height:var(--sys-size-9);padding:0 var(--sys-size-2) 0 var(--sys-size-4);margin:0 var(--sys-size-2);gap:var(--sys-size-2);border-radius:var(--sys-shape-corner-extra-small);&:hover::after,\n    &:active::before{content:"";height:100%;width:100%;border-radius:inherit;position:absolute;top:0;left:0}&:hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:focus-visible{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring)}&[disabled]{pointer-events:none;background-color:var(--sys-color-state-disabled-container);color:var(--sys-color-state-disabled)}}.toolbar-has-dropdown-shrinkable{flex-shrink:1}.toolbar-has-dropdown .toolbar-text{margin:0;text-overflow:ellipsis;flex:auto;overflow:hidden;text-align:right}.toolbar-button:not(.toolbar-has-dropdown):focus-visible::before{position:absolute;inset:2px;background-color:var(--sys-color-state-focus-highlight);border-radius:2px;content:"";z-index:-1}.toolbar-glyph{flex:none}.toolbar-button:disabled{opacity:50%}.toolbar-button.copied-to-clipboard::after{content:attr(data-content);position:fixed;margin-top:calc(2 * var(--toolbar-height));padding:3px 5px;color:var(--sys-color-token-subtle);background:var(--sys-color-cdt-base-container);animation:2s fade-out;font-weight:normal;border:1px solid var(--sys-color-divider);border-radius:3px}.toolbar-button.toolbar-state-on .toolbar-glyph{color:var(--icon-toggled)}.toolbar-state-on.toolbar-toggle-with-dot .toolbar-text::after{content:"";position:absolute;bottom:2px;background-color:var(--sys-color-primary-bright);width:4.5px;height:4.5px;border:2px solid var(--override-toolbar-background-color,--sys-color-cdt-base-container);border-radius:50%;right:0}.toolbar-button.toolbar-state-on.toolbar-toggle-with-red-color .toolbar-glyph,\n  .toolbar-button.toolbar-state-off.toolbar-default-with-red-color\n    .toolbar-glyph{color:var(\n      --icon-error\n    )!important}.toolbar-button:not(\n      .toolbar-has-glyph,\n      .toolbar-has-dropdown,\n      .largeicon-menu,\n      .toolbar-button-secondary\n    ){font-weight:bold}.toolbar-button.dark-text .toolbar-text{color:var(\n      --sys-color-on-surface\n    )!important}.toolbar-button.toolbar-state-on .toolbar-text{color:var(--sys-color-primary)}.toolbar-button.toolbar-state-on:enabled:active .toolbar-text{color:var(--sys-color-primary-bright)}.toolbar-button:enabled:hover:not(:active) .toolbar-glyph{color:var(--sys-color-on-surface)}.toolbar-button:enabled:hover:not(:active) .toolbar-text{color:var(--sys-color-on-surface)}.toolbar-button.toolbar-state-on:enabled:hover:not(:active) .toolbar-glyph{color:var(--sys-color-primary)}.toolbar-button.toolbar-state-on:enabled:hover:not(:active) .toolbar-text{color:var(--sys-color-primary)}& > dt-checkbox{padding:0 5px 0 0}& > select{height:var(--sys-size-9);min-width:var(--sys-size-14)}.toolbar-input{box-shadow:inset 0 0 0 2px transparent;box-sizing:border-box;width:120px;height:var(--sys-size-9);padding:0 var(--sys-size-2) 0 var(--sys-size-5);margin:1px 3px;border-radius:100px;min-width:35px;position:relative;&.focused{box-shadow:inset 0 0 0 2px var(--sys-color-state-focus-ring)}&:not(:has(devtools-button:hover), .disabled):hover{background-color:var(--sys-color-state-hover-on-subtle)}&::before{content:"";box-sizing:inherit;height:100%;width:100%;position:absolute;left:0;background:var(--sys-color-cdt-base);z-index:-1}& > devtools-icon{color:var(--sys-color-on-surface-subtle);width:var(--sys-size-8);height:var(--sys-size-8);margin-right:var(--sys-size-3)}&.disabled > devtools-icon{color:var(--sys-color-state-disabled)}}.toolbar-filter .toolbar-input-clear-button{margin-right:var(--sys-size-4)}.toolbar-input-empty .toolbar-input-clear-button{display:none}.toolbar-prompt-proxy{flex:1}.toolbar-input-prompt{flex:1;overflow:hidden;white-space:nowrap;cursor:text;color:var(--sys-color-on-surface)}.toolbar-divider{background-color:var(--sys-color-divider);width:1px;margin:5px 4px;height:16px}.toolbar-spacer{flex:auto}.toolbar-button.emulate-active{background-color:var(--sys-color-surface-variant)}&:not([floating]) > :last-child:not(:first-child, select){flex-shrink:1;justify-content:left}&:not([floating]) > .toolbar-button:last-child:not(:first-child, select){justify-content:left;margin-right:2px}& > .highlight::before{content:"";position:absolute;inset:2px;border-radius:2px;background:var(--sys-color-neutral-container);z-index:-1}& > .highlight:focus-visible{background:var(--sys-color-tonal-container);& > .title{color:var(--sys-color-on-tonal-container)}}devtools-icon.leading-issue-icon{margin:0 7px}@media (forced-colors: active){.toolbar-button:disabled{opacity:100%;color:Graytext}devtools-toolbar > *,\n    .toolbar-text{color:ButtonText}.toolbar-button:disabled .toolbar-text{color:Graytext}devtools-toolbar > select:disabled{opacity:100%;color:Graytext}.toolbar-button.toolbar-state-on .toolbar-glyph{forced-color-adjust:none;color:Highlight}.toolbar-button.toolbar-state-on .toolbar-text{forced-color-adjust:none;color:Highlight}.toolbar-button:enabled:hover:not(:active) .toolbar-text,\n    .toolbar-button:enabled:focus:not(:active) .toolbar-text{color:HighlightText}.toolbar-button:disabled devtools-icon{color:GrayText}.toolbar-button:disabled .toolbar-glyph{color:GrayText}.toolbar-button:enabled.hover:not(:active) .toolbar-glyph{forced-color-adjust:none;color:Highlight}.toolbar-button:enabled:hover .toolbar-glyph,\n    .toolbar-button:enabled:focus .toolbar-glyph,\n    .toolbar-button:enabled:hover:not(:active) .toolbar-glyph,\n    .toolbar-button:enabled:hover devtools-icon,\n    .toolbar-button:enabled:focus devtools-icon{color:HighlightText}.toolbar-input{forced-color-adjust:none;background:canvas;box-shadow:var(--legacy-focus-ring-inactive-shadow)}.toolbar-input.focused,\n    .toolbar-input:not(.toolbar-input-empty){forced-color-adjust:none;background:canvas;box-shadow:var(--legacy-focus-ring-active-shadow)}.toolbar-input:hover{box-shadow:var(--legacy-focus-ring-active-shadow)}devtools-toolbar .devtools-link{color:linktext}.toolbar-has-dropdown{forced-color-adjust:none;background:ButtonFace;color:ButtonText}}}@keyframes fade-out{from{opacity:100%}to{opacity:0%}}.webkit-css-property{color:var(--webkit-css-property-color,var(--sys-color-token-property-special))}.webkit-html-comment{color:var(--sys-color-token-comment)}.webkit-html-tag{color:var(--sys-color-token-tag)}.webkit-html-tag-name,\n.webkit-html-close-tag-name{color:var(--sys-color-token-tag)}.webkit-html-pseudo-element{color:var(--sys-color-token-pseudo-element)}.webkit-html-js-node,\n.webkit-html-css-node{color:var(--text-primary);white-space:pre-wrap}.webkit-html-text-node{color:var(--text-primary);unicode-bidi:-webkit-isolate}.webkit-html-entity-value{background-color:rgb(0 0 0/15%);unicode-bidi:-webkit-isolate}.webkit-html-doctype{color:var(--text-secondary)}.webkit-html-attribute-name{color:var(--sys-color-token-attribute);unicode-bidi:-webkit-isolate}.webkit-html-attribute-value{color:var(--sys-color-token-attribute-value);unicode-bidi:-webkit-isolate;word-break:break-all}.devtools-link{color:var(--text-link);text-decoration:underline;outline-offset:2px;.elements-disclosure &{color:var(--text-link)}devtools-icon{vertical-align:baseline;color:var(--sys-color-primary)}:focus .selected & devtools-icon{color:var(--sys-color-tonal-container)}&:focus-visible{outline-width:unset}&.invalid-link{color:var(--text-disabled);text-decoration:none}&:not(.devtools-link-prevent-click, .invalid-link){cursor:pointer}@media (forced-colors: active){&:not(.devtools-link-prevent-click){forced-color-adjust:none;color:linktext}&:focus-visible{background:Highlight;color:HighlightText}}}\n/*# sourceURL=${import.meta.resolve("./inspectorCommon.css")} */\n`},me={cssText:`*{padding:0;margin:0;box-sizing:border-box;font-size:inherit}.wrapper{display:flex;flex-direction:row;flex:1;height:100%}.main{overflow:hidden;display:flex;flex-direction:column;flex:1}.sections{flex:1;min-height:0;overflow:hidden auto;background-color:var(--sys-color-cdt-base-container);z-index:0;position:relative;container:sections/inline-size}.section{display:flex;padding:0 16px;gap:8px;position:relative}.section::after{content:'';border-bottom:1px solid var(--sys-color-divider);position:absolute;left:0;right:0;bottom:0;z-index:-1}.section:last-child{margin-bottom:70px}.section:last-child::after{content:none}.screenshot-wrapper{flex:0 0 80px;padding-top:32px;z-index:2}@container sections (max-width: 400px){.screenshot-wrapper{display:none}}.screenshot{object-fit:cover;object-position:top center;max-width:100%;width:200px;height:auto;border:1px solid var(--sys-color-divider);border-radius:1px}.content{flex:1;min-width:0}.steps{flex:1;position:relative;align-self:flex-start;overflow:visible}.step{position:relative;padding-left:40px;margin:16px 0}.step .action{font-size:13px;line-height:16px;letter-spacing:0.03em}.recording{color:var(--sys-color-primary);font-style:italic;margin-top:8px;margin-bottom:0}.add-assertion-button{margin-top:8px}.details{max-width:240px;display:flex;flex-direction:column;align-items:flex-end}.url{font-size:12px;line-height:16px;letter-spacing:0.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--sys-color-secondary);max-width:100%;margin-bottom:16px}.header{align-items:center;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:16px}.header-title-wrapper{max-width:100%}.header-title{align-items:center;display:flex;flex:1;max-width:100%}.header-title::before{content:'';min-width:12px;height:12px;display:inline-block;background:var(--sys-color-primary);border-radius:50%;margin-right:7px}#title-input{box-sizing:content-box;font-family:inherit;font-size:18px;line-height:22px;letter-spacing:0.02em;padding:1px 4px;border:1px solid transparent;border-radius:1px;word-break:break-all}#title-input:hover{border-color:var(--input-outline)}#title-input.has-error{border-color:var(--sys-color-error)}#title-input.disabled{color:var(--sys-color-state-disabled)}.title-input-error-text{margin-top:4px;margin-left:19px;color:var(--sys-color-error)}.title-button-bar{padding-left:2px;display:flex}#title-input:focus + .title-button-bar{display:none}.settings-row{padding:16px 28px;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-flow:row wrap;justify-content:space-between}.settings-title{font-size:14px;line-height:24px;letter-spacing:0.03em;color:var(--sys-color-on-surface);display:flex;align-items:center;align-content:center;gap:5px;width:fit-content}.settings{margin-top:4px;display:flex;flex-wrap:wrap;font-size:12px;line-height:20px;letter-spacing:0.03em;color:var(--sys-color-on-surface-subtle)}.settings.expanded{gap:10px}.settings .separator{width:1px;height:20px;background-color:var(--sys-color-divider);margin:0 5px}.actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px}.actions .separator{width:1px;height:24px;background-color:var(--sys-color-divider)}.is-recording .header-title::before{background:var(--sys-color-error-bright)}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container);z-index:1}.controls{align-items:center;display:flex;justify-content:center;position:relative;width:100%}.chevron{width:14px;height:14px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0)}.editable-setting{display:flex;flex-direction:row;gap:12px;align-items:center}.editable-setting .devtools-text-input{width:fit-content;height:var(--sys-size-9)}.wrapping-label{display:inline-flex;align-items:center;gap:12px}.text-editor{height:100%;overflow:auto}.section-toolbar{display:flex;align-items:center;padding:3px 5px;justify-content:space-between;gap:3px}.section-toolbar > devtools-select-menu{height:24px;min-width:50px}.sections .section-toolbar{justify-content:flex-end}devtools-split-view{flex:1 1 0%;min-height:0}[slot='main']{overflow:hidden auto}[slot='sidebar']{display:flex;flex-direction:column;overflow:auto;height:100%;width:100%}[slot='sidebar'] .section-toolbar{border-bottom:1px solid var(--sys-color-divider)}.show-code{margin-right:14px;margin-top:8px}devtools-recorder-extension-view{flex:1}\n/*# sourceURL=${import.meta.resolve("./recordingView.css")} */\n`};const ye=new CSSStyleSheet;ye.replaceSync(be.cssText);const fe=new CSSStyleSheet;fe.replaceSync(me.cssText);const{html:xe}=e,we={mobile:"Mobile",desktop:"Desktop",latency:"Latency: {value} ms",upload:"Upload: {value}",download:"Download: {value}",editReplaySettings:"Edit replay settings",replaySettings:"Replay settings",default:"Default",environment:"Environment",screenshotForSection:"Screenshot for this section",editTitle:"Edit title",requiredTitleError:"Title is required",recording:"Recording…",endRecording:"End recording",recordingIsBeingStopped:"Stopping recording…",timeout:"Timeout: {value} ms",network:"Network",timeoutLabel:"Timeout",timeoutExplanation:"The timeout setting (in milliseconds) applies to every action when replaying the recording. For example, if a DOM element identified by a CSS selector does not appear on the page within the specified timeout, the replay fails with an error.",cancelReplay:"Cancel replay",showCode:"Show code",hideCode:"Hide code",addAssertion:"Add assertion",performancePanel:"Performance panel"},Se=o.i18n.registerUIStrings("panels/recorder/components/RecordingView.ts",we),ke=o.i18n.getLocalizedString.bind(void 0,Se);class $e extends Event{static eventName="recordingfinished";constructor(){super($e.eventName)}}class Ee extends Event{static eventName="playrecording";data;constructor(e={targetPanel:"chrome-recorder",speed:"normal"}){super(Ee.eventName),this.data=e}}class Ce extends Event{static eventName="abortreplay";constructor(){super(Ce.eventName)}}class Re extends Event{static eventName="recordingchanged";data;constructor(e,t){super(Re.eventName),this.data={currentStep:e,newStep:t}}}class Te extends Event{static eventName="addassertion";constructor(){super(Te.eventName)}}class Ie extends Event{static eventName="recordingtitlechanged";title;constructor(e){super(Ie.eventName,{}),this.title=e}}class Ne extends Event{static eventName="networkconditionschanged";data;constructor(e){super(Ne.eventName,{composed:!0,bubbles:!0}),this.data=e}}class je extends Event{static eventName="timeoutchanged";data;constructor(e){super(je.eventName,{composed:!0,bubbles:!0}),this.data=e}}const Ae=[p.NetworkManager.NoThrottlingConditions,p.NetworkManager.OfflineConditions,p.NetworkManager.Slow3GConditions,p.NetworkManager.Slow4GConditions,p.NetworkManager.Fast4GConditions];class ze extends HTMLElement{#t=this.attachShadow({mode:"open"});#S={isPlaying:!1,isPausedOnBreakpoint:!1};#k=null;#$=!1;#E=!1;#C=!1;#R;#T=[];#I;#N=[];#y;#s;#j;#A=new Set;#z;#M=!1;#B=!0;#P=[];#L=[];#f;#O=!1;#F="";#D="";#V;#_;#K;#G=this.#U.bind(this);constructor(){super()}set data(e){this.#$=e.isRecording,this.#S=e.replayState,this.#E=e.recordingTogglingInProgress,this.#R=e.currentStep,this.#k=e.recording,this.#T=this.#k.steps,this.#N=e.sections,this.#y=e.settings,this.#s=e.recorderSettings,this.#I=e.currentError,this.#j=e.lastReplayResult,this.#B=e.replayAllowed,this.#C=!1,this.#A=e.breakpointIndexes,this.#P=e.builtInConverters,this.#L=e.extensionConverters,this.#f=e.replayExtensions,this.#K=e.extensionDescriptor,this.#D=this.#s?.preferredCopyFormat??e.builtInConverters[0]?.getId(),this.#H(),this.#i()}connectedCallback(){this.#t.adoptedStyleSheets=[ye,fe,s.textInputStyles],document.addEventListener("copy",this.#G),this.#i()}disconnectedCallback(){document.removeEventListener("copy",this.#G)}scrollToBottom(){const e=this.shadowRoot?.querySelector(".sections");e&&(e.scrollTop=e.scrollHeight)}#q(){this.dispatchEvent(new Te)}#W(){this.dispatchEvent(new $e)}#X(){this.dispatchEvent(new Ce)}#Y(e){this.dispatchEvent(new Ee({targetPanel:"chrome-recorder",speed:e.speed,extension:e.extension}))}#J(e){if(!this.#R)return"default";if(e===this.#R)return this.#I?"error":this.#S.isPlaying?this.#S.isPausedOnBreakpoint?"stopped":"current":"success";const t=this.#T.indexOf(this.#R);if(-1===t)return"default";return this.#T.indexOf(e)<t?"success":"outstanding"}#Z(e){const t=this.#R;if(!t)return"default";const o=this.#N.find((e=>e.steps.includes(t)));if(!o&&this.#I)return"error";if(e===o)return"success";return this.#N.indexOf(o)>=this.#N.indexOf(e)?"success":"outstanding"}#Q(e,t,o){const r=this.#T.indexOf(t);return xe`
      <devtools-step-view
      @click=${this.#ee}
      @mouseover=${this.#te}
      @copystep=${this.#oe}
      .data=${{step:t,state:this.#J(t),error:this.#R===t?this.#I:void 0,isFirstSection:!1,isLastSection:o&&this.#T[this.#T.length-1]===t,isStartOfGroup:!1,isEndOfGroup:e.steps[e.steps.length-1]===t,stepIndex:r,hasBreakpoint:this.#A.has(r),sectionIndex:-1,isRecording:this.#$,isPlaying:this.#S.isPlaying,removable:this.#T.length>1,builtInConverters:this.#P,extensionConverters:this.#L,isSelected:this.#z===t,recorderSettings:this.#s}}
      jslog=${i.section("step").track({click:!0})}
      ></devtools-step-view>
    `}#te=e=>{const t=e.target,o=t.step||t.section?.causingStep;o&&!this.#z&&this.#re(o)};#ee(e){e.stopPropagation();const t=e.target,o=t.step||t.section?.causingStep||null;this.#z!==o&&(this.#z=o,this.#i(),o&&this.#re(o,!0))}#se(){void 0!==this.#z&&(this.#z=void 0,this.#i())}#ie(e){"Enter"===e.key&&(e.preventDefault(),this.#ne(e))}#ne(e){e.stopPropagation(),this.#M=!this.#M,this.#i()}#ae(e){const t=e.target;if(t instanceof HTMLSelectElement){const e=Ae.find((e=>e.i18nTitleKey===t.value));this.dispatchEvent(new Ne(e?.i18nTitleKey===p.NetworkManager.NoThrottlingConditions.i18nTitleKey?void 0:e))}}#le(e){const t=e.target;t.checkValidity()?this.dispatchEvent(new je(Number(t.value))):t.reportValidity()}#ce=e=>{const t=e.target.innerText.trim();if(!t)return this.#C=!0,void this.#i();this.dispatchEvent(new Ie(t))};#de=e=>{switch(e.code){case"Escape":case"Enter":e.target.blur(),e.stopPropagation()}};#pe=()=>{const e=this.#t.getElementById("title-input");e.focus();const t=document.createRange();t.selectNodeContents(e),t.collapse(!1);const o=window.getSelection();o?.removeAllRanges(),o?.addRange(t)};#ue=e=>{const t=e.target;t.matches(".wrapping-label")&&t.querySelector("devtools-select-menu")?.click()};async#he(e){let t=[...this.#P,...this.#L].find((e=>e.getId()===this.#s?.preferredCopyFormat));if(t||(t=this.#P[0]),!t)throw new Error("No default converter found");let o="";e?o=await t.stringifyStep(e):this.#k&&([o]=await t.stringify(this.#k)),c.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(o);const r=e?function(e){switch(e){case"puppeteer":case"puppeteer-firefox":return 5;case"json":return 6;case"@puppeteer/replay":return 7;default:return 8}}(t.getId()):function(e){switch(e){case"puppeteer":case"puppeteer-firefox":return 1;case"json":return 2;case"@puppeteer/replay":return 3;default:return 4}}(t.getId());c.userMetrics.recordingCopiedToClipboard(r)}#oe(e){e.stopPropagation(),this.#he(e.step)}async#U(e){e.target===document.body&&(e.preventDefault(),await this.#he(this.#z),c.userMetrics.keyboardShortcutFired("chrome-recorder.copy-recording-or-step"))}#ve(){if(!this.#y)return xe``;const t=[];this.#y.viewportSettings&&(t.push(xe`<div>${this.#y.viewportSettings.isMobile?ke(we.mobile):ke(we.desktop)}</div>`),t.push(xe`<div class="separator"></div>`),t.push(xe`<div>${this.#y.viewportSettings.width}×${this.#y.viewportSettings.height} px</div>`));const r=[];if(this.#M){const e=this.#y.networkConditionsSettings?.i18nTitleKey||p.NetworkManager.NoThrottlingConditions.i18nTitleKey,t=Ae.find((t=>t.i18nTitleKey===e));let o="";t&&(o=t.title instanceof Function?t.title():t.title),r.push(xe`<div class="editable-setting">
        <label class="wrapping-label" @click=${this.#ue}>
          ${ke(we.network)}
          <select
              title=${o}
              jslog=${i.dropDown("network-conditions").track({change:!0})}
              @change=${this.#ae}>
        ${Ae.map((t=>xe`
          <option jslog=${i.item(d.StringUtilities.toKebabCase(t.i18nTitleKey||""))}
                  value=${t.i18nTitleKey||""} ?selected=${e===t.i18nTitleKey}>
                  ${t.title instanceof Function?t.title():t.title}
          </option>`))}
      </select>
        </label>
      </div>`),r.push(xe`<div class="editable-setting">
        <label class="wrapping-label" title=${ke(we.timeoutExplanation)}>
          ${ke(we.timeoutLabel)}
          <input
            @input=${this.#le}
            required
            min=${n.SchemaUtils.minTimeout}
            max=${n.SchemaUtils.maxTimeout}
            value=${this.#y.timeout||n.RecordingPlayer.defaultTimeout}
            jslog=${i.textField("timeout").track({change:!0})}
            class="devtools-text-input"
            type="number">
        </label>
      </div>`)}else this.#y.networkConditionsSettings?this.#y.networkConditionsSettings.title?r.push(xe`<div>${this.#y.networkConditionsSettings.title}</div>`):r.push(xe`<div>
            ${ke(we.download,{value:o.ByteUtilities.bytesToString(this.#y.networkConditionsSettings.download)})},
            ${ke(we.upload,{value:o.ByteUtilities.bytesToString(this.#y.networkConditionsSettings.upload)})},
            ${ke(we.latency,{value:this.#y.networkConditionsSettings.latency})}
          </div>`):r.push(xe`<div>${p.NetworkManager.NoThrottlingConditions.title instanceof Function?p.NetworkManager.NoThrottlingConditions.title():p.NetworkManager.NoThrottlingConditions.title}</div>`),r.push(xe`<div class="separator"></div>`),r.push(xe`<div>${ke(we.timeout,{value:this.#y.timeout||n.RecordingPlayer.defaultTimeout})}</div>`);const s=!this.#$&&!this.#S.isPlaying,a={"settings-title":!0,expanded:this.#M},l={expanded:this.#M,settings:!0};return xe`
      <div class="settings-row">
        <div class="settings-container">
          <div
            class=${e.Directives.classMap(a)}
            @keydown=${s&&this.#ie}
            @click=${s&&this.#ne}
            tabindex="0"
            role="button"
            jslog=${i.action("replay-settings").track({click:!0})}
            aria-label=${ke(we.editReplaySettings)}>
            <span>${ke(we.replaySettings)}</span>
            ${s?xe`<devtools-icon
                    class="chevron"
                    name="triangle-down">
                  </devtools-icon>`:""}
          </div>
          <div class=${e.Directives.classMap(l)}>
            ${r.length?r:xe`<div>${ke(we.default)}</div>`}
          </div>
        </div>
        <div class="settings-container">
          <div class="settings-title">${ke(we.environment)}</div>
          <div class="settings">
            ${t.length?t:xe`<div>${ke(we.default)}</div>`}
          </div>
        </div>
      </div>
    `}#ge(){const e=[...this.#P||[],...this.#L||[]].find((e=>e.getId()===this.#D));return e||this.#P[0]}#be(){if(this.#K)return xe`
        <devtools-recorder-extension-view .descriptor=${this.#K}>
        </devtools-recorder-extension-view>
      `;const t=this.#ge(),o=t?.getFormatName();return xe`
        <devtools-split-view
          direction="auto"
          sidebar-position="second"
          sidebar-initial-size="300"
          sidebar-visibility=${this.#O?"":"hidden"}
        >
          <div slot="main">
            ${this.#me()}
          </div>
          <div slot="sidebar" jslog=${i.pane("source-code").track({resize:!0})}>
            ${this.#O?xe`
            <div class="section-toolbar" jslog=${i.toolbar()}>
              <devtools-select-menu
                @selectmenuselected=${this.#ye}
                .showDivider=${!0}
                .showArrow=${!0}
                .sideButton=${!1}
                .showSelectedItem=${!0}
                .position=${"bottom"}
                .buttonTitle=${o||""}
                .jslogContext=${"code-format"}
              >
                ${this.#P.map((e=>xe`<devtools-menu-item
                    .value=${e.getId()}
                    .selected=${this.#D===e.getId()}
                    jslog=${i.action().track({click:!0}).context(`converter-${d.StringUtilities.toKebabCase(e.getId())}`)}
                  >
                    ${e.getFormatName()}
                  </devtools-menu-item>`))}
                ${this.#L.map((e=>xe`<devtools-menu-item
                    .value=${e.getId()}
                    .selected=${this.#D===e.getId()}
                    jslog=${i.action().track({click:!0}).context("converter-extension")}
                  >
                    ${e.getFormatName()}
                  </devtools-menu-item>`))}
              </devtools-select-menu>
              <devtools-button
                title=${n.Tooltip.getTooltipForActions(ke(we.hideCode),"chrome-recorder.toggle-code-view")}
                .data=${{variant:"icon",size:"SMALL",iconName:"cross"}}
                @click=${this.showCodeToggle}
                jslog=${i.close().track({click:!0})}
              ></devtools-button>
            </div>
            ${this.#fe()}`:e.nothing}
          </div>
        </devtools-split-view>
      `}#fe(){if(!this.#V)throw new Error("Unexpected: trying to render the text editor without editorState");return xe`
      <div class="text-editor" jslog=${i.textField().track({change:!0})}>
        <devtools-text-editor .state=${this.#V}></devtools-text-editor>
      </div>
    `}#xe(e){return e.screenshot?xe`
      <img class="screenshot" src=${e.screenshot} alt=${ke(we.screenshotForSection)} />
    `:null}#we(){return this.#S.isPlaying?xe`
        <devtools-button .jslogContext=${"abort-replay"} @click=${this.#X} .iconName=${"pause"} .variant=${"outlined"}>
          ${ke(we.cancelReplay)}
        </devtools-button>`:xe`<devtools-replay-section
        .data=${{settings:this.#s,replayExtensions:this.#f}}
        .disabled=${this.#S.isPlaying}
        @startreplay=${this.#Y}
        >
      </devtools-replay-section>`}#Se(e){e.stopPropagation(),this.dispatchEvent(new Ee({targetPanel:"timeline",speed:"normal"}))}showCodeToggle=()=>{this.#O=!this.#O,c.userMetrics.recordingCodeToggled(this.#O?1:2),this.#H()};#H=async()=>{if(!this.#k)return;const e=this.#ge();if(!e)return;const[t,o]=await e.stringify(this.#k);this.#F=t,this.#_=o,this.#_?.shift();const r=e.getMediaType(),s=r?await h.CodeHighlighter.languageFromMIME(r):null;this.#V=u.EditorState.create({doc:this.#F,extensions:[v.Config.baseConfiguration(this.#F),u.EditorState.readOnly.of(!0),u.EditorView.lineWrapping,s||[]]}),this.#i(),this.dispatchEvent(new Event("code-generated"))};#re=(e,t=!1)=>{if(!this.#_)return;const o=this.#T.indexOf(e);if(-1===o)return;const r=this.#t.querySelector("devtools-text-editor");if(!r)return;const s=r.editor;if(!s)return;const i=this.#_[2*o],n=this.#_[2*o+1];let a=r.createSelection({lineNumber:i+n,columnNumber:0},{lineNumber:i,columnNumber:0});const l=r.state.doc.lineAt(a.main.anchor);a=r.createSelection({lineNumber:i+n-1,columnNumber:l.length+1},{lineNumber:i,columnNumber:0}),s.dispatch({selection:a,effects:t?[u.EditorView.scrollIntoView(a.main,{y:"nearest"})]:void 0})};#ye=e=>{this.#D=e.itemValue,this.#s&&(this.#s.preferredCopyFormat=e.itemValue),this.#H()};#me(){return xe`
      <div class="sections">
      ${this.#O?"":xe`<div class="section-toolbar">
        <devtools-button
          @click=${this.showCodeToggle}
          class="show-code"
          .data=${{variant:"outlined",title:n.Tooltip.getTooltipForActions(ke(we.showCode),"chrome-recorder.toggle-code-view")}}
          jslog=${i.toggleSubpane("chrome-recorder.toggle-code-view").track({click:!0})}
        >
          ${ke(we.showCode)}
        </devtools-button>
      </div>`}
      ${this.#N.map(((e,t)=>xe`
            <div class="section">
              <div class="screenshot-wrapper">
                ${this.#xe(e)}
              </div>
              <div class="content">
                <div class="steps">
                  <devtools-step-view
                    @click=${this.#ee}
                    @mouseover=${this.#te}
                    .data=${{section:e,state:this.#Z(e),isStartOfGroup:!0,isEndOfGroup:0===e.steps.length,isFirstSection:0===t,isLastSection:t===this.#N.length-1&&0===e.steps.length,isSelected:this.#z===(e.causingStep||null),sectionIndex:t,isRecording:this.#$,isPlaying:this.#S.isPlaying,error:"error"===this.#Z(e)?this.#I:void 0,hasBreakpoint:!1,removable:this.#T.length>1&&e.causingStep}}
                  >
                  </devtools-step-view>
                  ${e.steps.map((o=>this.#Q(e,o,t===this.#N.length-1)))}
                  ${!this.#E&&this.#$&&t===this.#N.length-1?xe`<devtools-button
                    class="step add-assertion-button"
                    .data=${{variant:"outlined",title:ke(we.addAssertion),jslogContext:"add-assertion"}}
                    @click=${this.#q}
                  >${ke(we.addAssertion)}</devtools-button>`:void 0}
                  ${this.#$&&t===this.#N.length-1?xe`<div class="step recording">${ke(we.recording)}</div>`:null}
                </div>
              </div>
            </div>
      `))}
      </div>
    `}#ke(){if(!this.#k)return"";const{title:t}=this.#k,o=!this.#S.isPlaying&&!this.#$;return xe`
      <div class="header">
        <div class="header-title-wrapper">
          <div class="header-title">
            <span @blur=${this.#ce}
                  @keydown=${this.#de}
                  id="title-input"
                  .contentEditable=${o?"true":"false"}
                  jslog=${i.value("title").track({change:!0})}
                  class=${e.Directives.classMap({"has-error":this.#C,disabled:!o})}
                  .innerText=${e.Directives.live(t)}></span>
            <div class="title-button-bar">
              <devtools-button
                @click=${this.#pe}
                .data=${{disabled:!o,variant:"toolbar",iconName:"edit",title:ke(we.editTitle),jslogContext:"edit-title"}}
              ></devtools-button>
            </div>
          </div>
          ${this.#C?xe`<div class="title-input-error-text">
            ${ke(we.requiredTitleError)}
          </div>`:""}
        </div>
        ${!this.#$&&this.#B?xe`<div class="actions">
                <devtools-button
                  @click=${this.#Se}
                  .data=${{disabled:this.#S.isPlaying,variant:"outlined",iconName:"performance",title:ke(we.performancePanel),jslogContext:"measure-performance"}}
                >
                  ${ke(we.performancePanel)}
                </devtools-button>
                <div class="separator"></div>
                ${this.#we()}
              </div>`:""}
      </div>`}#$e(){if(!this.#$)return"";const e=this.#E?ke(we.recordingIsBeingStopped):ke(we.endRecording);return xe`
      <div class="footer">
        <div class="controls">
          <devtools-control-button
            jslog=${i.toggle("toggle-recording").track({click:!0})}
            @click=${this.#W}
            .disabled=${this.#E}
            .shape=${"square"}
            .label=${e}
            title=${n.Tooltip.getTooltipForActions(e,"chrome-recorder.start-recording")}
          >
          </devtools-control-button>
        </div>
      </div>
    `}#i(){const t={wrapper:!0,"is-recording":this.#$,"is-playing":this.#S.isPlaying,"was-successful":"Success"===this.#j,"was-failure":"Failure"===this.#j};e.render(xe`
      <div @click=${this.#se} class=${e.Directives.classMap(t)}>
        <div class="main">
          ${this.#ke()}
          ${this.#K?xe`
            <devtools-recorder-extension-view .descriptor=${this.#K}>
            </devtools-recorder-extension-view>
          `:xe`
            ${this.#ve()}
            ${this.#be()}
          `}
          ${this.#$e()}
        </div>
      </div>
    `,this.#t,{host:this})}}customElements.define("devtools-recording-view",ze);var Me=Object.freeze({__proto__:null,AbortReplayEvent:Ce,AddAssertionEvent:Te,NetworkConditionsChanged:Ne,PlayRecordingEvent:Ee,RecordingChangedEvent:Re,RecordingFinishedEvent:$e,RecordingTitleChangedEvent:Ie,RecordingView:ze,TimeoutChanged:je}),Be={cssText:`.select-button{display:flex;gap:12px}.select-button devtools-button{position:relative}.select-button devtools-select-menu{position:relative;top:var(--sys-size-1);height:var(--sys-size-9)}.select-menu-item-content-with-icon{display:flex;align-items:center}\n/*# sourceURL=${import.meta.resolve("./selectButton.css")} */\n`};const Pe=new CSSStyleSheet;Pe.replaceSync(be.cssText);const Le=new CSSStyleSheet;Le.replaceSync(Be.cssText);const{html:Oe,Directives:{ifDefined:Fe,classMap:De}}=e;class Ve extends Event{value;static eventName="selectbuttonclick";constructor(e){super(Ve.eventName,{bubbles:!0,composed:!0}),this.value=e}}class _e extends Event{value;static eventName="selectmenuselected";constructor(e){super(_e.eventName,{bubbles:!0,composed:!0}),this.value=e}}class Ke extends HTMLElement{#t=this.attachShadow({mode:"open"});#c={disabled:!1,value:"",items:[],buttonLabel:"",groups:[],variant:"primary"};connectedCallback(){this.#t.adoptedStyleSheets=[Pe,Le],a.ScheduledRender.scheduleRender(this,this.#i)}get disabled(){return this.#c.disabled}set disabled(e){this.#c.disabled=e,a.ScheduledRender.scheduleRender(this,this.#i)}get items(){return this.#c.items}set items(e){this.#c.items=e,a.ScheduledRender.scheduleRender(this,this.#i)}set buttonLabel(e){this.#c.buttonLabel=e}set groups(e){this.#c.groups=e,a.ScheduledRender.scheduleRender(this,this.#i)}get value(){return this.#c.value}set value(e){this.#c.value=e,a.ScheduledRender.scheduleRender(this,this.#i)}get variant(){return this.#c.variant}set variant(e){this.#c.variant=e,a.ScheduledRender.scheduleRender(this,this.#i)}set action(e){this.#c.action=e,a.ScheduledRender.scheduleRender(this,this.#i)}#Ee(e){e.stopPropagation(),this.dispatchEvent(new Ve(this.#c.value))}#Ce(e){e.target instanceof HTMLSelectElement&&(this.dispatchEvent(new _e(e.target.value)),a.ScheduledRender.scheduleRender(this,this.#i))}#Re(e,t){const o=e.value===t.value;return Oe`
      <option
      .title=${e.label()}
      value=${e.value}
      ?selected=${o}
      jslog=${i.item(d.StringUtilities.toKebabCase(e.value)).track({click:!0})}
      >${o&&e.buttonLabel?e.buttonLabel():e.label()}</option>
    `}#Te(e,t){return Oe`
      <optgroup label=${e.name}>
        ${e.items.map((e=>this.#Re(e,t)))}
      </optgroup>
    `}#Ie(e){return this.#c.action?n.Tooltip.getTooltipForActions(e,this.#c.action):""}#i=()=>{const t=Boolean(this.#c.groups.length),o=t?this.#c.groups.flatMap((e=>e.items)):this.#c.items,r=o.find((e=>e.value===this.#c.value))||o[0];if(!r)return;const s={primary:"primary"===this.#c.variant,secondary:"outlined"===this.#c.variant},n="outlined"===this.#c.variant?"outlined":"primary",a=r.buttonLabel?r.buttonLabel():r.label();e.render(Oe`
      <div class="select-button" title=${Fe(this.#Ie(a))}>
      <select
      class=${De(s)}
      ?disabled=${this.#c.disabled}
      jslog=${i.dropDown("network-conditions").track({change:!0})}
      @change=${this.#Ce}>
        ${t?this.#c.groups.map((e=>this.#Te(e,r))):this.#c.items.map((e=>this.#Re(e,r)))}
    </select>
        ${r?Oe`
        <devtools-button
            .disabled=${this.#c.disabled}
            .variant=${n}
            .iconName=${r.buttonIconName}
            @click=${this.#Ee}>
            ${this.#c.buttonLabel}
        </devtools-button>`:""}
      </div>`,this.#t,{host:this})}}customElements.define("devtools-select-button",Ke);var Ge=Object.freeze({__proto__:null,SelectButton:Ke,SelectButtonClickEvent:Ve,SelectMenuSelectedEvent:_e}),Ue={cssText:`*{box-sizing:border-box;padding:0;margin:0;font-size:inherit}:host{display:block}.row{display:flex;flex-direction:row;color:var(--sys-color-token-property-special);font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);align-items:center;line-height:18px;margin-top:3px}.row devtools-button{line-height:1;margin-left:0.5em}.separator{margin-right:0.5em;color:var(--sys-color-on-surface)}.padded{margin-left:2em}.padded.double{margin-left:4em}.selector-picker{width:18px;height:18px}.inline-button{width:18px;height:18px;opacity:0%;visibility:hidden;transition:opacity 200ms;flex-shrink:0}.row:focus-within .inline-button,\n.row:hover .inline-button{opacity:100%;visibility:visible}.wrapped.row{flex-wrap:wrap}.gap.row{gap:5px}.gap.row devtools-button{margin-left:0}.regular-font{font-family:inherit;font-size:inherit}.no-margin{margin:0}.row-buttons{margin-top:3px}.error{margin:3px 0 6px;padding:8px 12px;background:var(--sys-color-error-container);color:var(--sys-color-error)}\n/*# sourceURL=${import.meta.resolve("./stepEditor.css")} */\n`};function He(e,t="Assertion failed!"){if(!e)throw new Error(t)}const qe=e=>{for(const t of Reflect.ownKeys(e)){const o=e[t];(o&&"object"==typeof o||"function"==typeof o)&&qe(o)}return Object.freeze(e)};class We{value;constructor(e){this.value=e}}class Xe{value;constructor(e){this.value=e}}const Ye=(e,t)=>{if(t instanceof Xe){He(Array.isArray(e),`Expected an array. Got ${typeof e}.`);const o=[...e],r=Object.keys(t.value).sort(((e,t)=>Number(t)-Number(e)));for(const e of r){const r=t.value[Number(e)];void 0===r?o.splice(Number(e),1):r instanceof We?o.splice(Number(e),0,r.value):o[Number(e)]=Ye(o[e],r)}return Object.freeze(o)}if("object"==typeof t&&!Array.isArray(t)){He(!Array.isArray(e),"Expected an object. Got an array.");const o={...e},r=Object.keys(t);for(const e of r){const r=t[e];void 0===r?delete o[e]:o[e]=Ye(o[e],r)}return Object.freeze(o)}return t};var Je=self&&self.__decorate||function(e,t,o,r){var s,i=arguments.length,n=i<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,o):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,o,r);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(i<3?s(n):i>3?s(t,o,n):s(t,o))||n);return i>3&&n&&Object.defineProperty(t,o,n),n};const Ze=new CSSStyleSheet;Ze.replaceSync(Ue.cssText);const{html:Qe,Decorators:et,Directives:tt,LitElement:ot}=e,{customElement:rt,property:st,state:it}=et,{live:nt}=tt,at=Object.freeze({string:e=>e.trim(),number:e=>{const t=parseFloat(e);return Number.isNaN(t)?0:t},boolean:e=>"true"===e.toLowerCase()}),lt=Object.freeze({selectors:"string",offsetX:"number",offsetY:"number",target:"string",frame:"number",assertedEvents:"string",value:"string",key:"string",operator:"string",count:"number",expression:"string",x:"number",y:"number",url:"string",type:"string",timeout:"number",duration:"number",button:"string",deviceType:"string",width:"number",height:"number",deviceScaleFactor:"number",isMobile:"boolean",hasTouch:"boolean",isLandscape:"boolean",download:"number",upload:"number",latency:"number",name:"string",parameters:"string",visible:"boolean",properties:"string",attributes:"string"}),ct=qe({selectors:[[".cls"]],offsetX:1,offsetY:1,target:"main",frame:[0],assertedEvents:[{type:"navigation",url:"https://example.com",title:"Title"}],value:"Value",key:"Enter",operator:">=",count:1,expression:"true",x:0,y:0,url:"https://example.com",timeout:5e3,duration:50,deviceType:"mouse",button:"primary",type:"click",width:800,height:600,deviceScaleFactor:1,isMobile:!1,hasTouch:!1,isLandscape:!0,download:1e3,upload:1e3,latency:25,name:"customParam",parameters:"{}",properties:"{}",attributes:[{name:"attribute",value:"value"}],visible:!0}),dt=qe({[n.Schema.StepType.Click]:{required:["selectors","offsetX","offsetY"],optional:["assertedEvents","button","deviceType","duration","frame","target","timeout"]},[n.Schema.StepType.DoubleClick]:{required:["offsetX","offsetY","selectors"],optional:["assertedEvents","button","deviceType","frame","target","timeout"]},[n.Schema.StepType.Hover]:{required:["selectors"],optional:["assertedEvents","frame","target","timeout"]},[n.Schema.StepType.Change]:{required:["selectors","value"],optional:["assertedEvents","frame","target","timeout"]},[n.Schema.StepType.KeyDown]:{required:["key"],optional:["assertedEvents","target","timeout"]},[n.Schema.StepType.KeyUp]:{required:["key"],optional:["assertedEvents","target","timeout"]},[n.Schema.StepType.Scroll]:{required:[],optional:["assertedEvents","frame","target","timeout","x","y"]},[n.Schema.StepType.Close]:{required:[],optional:["assertedEvents","target","timeout"]},[n.Schema.StepType.Navigate]:{required:["url"],optional:["assertedEvents","target","timeout"]},[n.Schema.StepType.WaitForElement]:{required:["selectors"],optional:["assertedEvents","attributes","count","frame","operator","properties","target","timeout","visible"]},[n.Schema.StepType.WaitForExpression]:{required:["expression"],optional:["assertedEvents","frame","target","timeout"]},[n.Schema.StepType.CustomStep]:{required:["name","parameters"],optional:["assertedEvents","target","timeout"]},[n.Schema.StepType.EmulateNetworkConditions]:{required:["download","latency","upload"],optional:["assertedEvents","target","timeout"]},[n.Schema.StepType.SetViewport]:{required:["deviceScaleFactor","hasTouch","height","isLandscape","isMobile","width"],optional:["assertedEvents","target","timeout"]}}),pt={notSaved:"Not saved: {error}",addAttribute:"Add {attributeName}",deleteRow:"Delete row",selectorPicker:"Select an element in the page to update selectors",addFrameIndex:"Add frame index within the frame tree",removeFrameIndex:"Remove frame index",addSelectorPart:"Add a selector part",removeSelectorPart:"Remove a selector part",addSelector:"Add a selector",removeSelector:"Remove a selector",unknownActionType:"Unknown action type."},ut=o.i18n.registerUIStrings("panels/recorder/components/StepEditor.ts",pt),ht=o.i18n.getLocalizedString.bind(void 0,ut);class vt extends Event{static eventName="stepedited";data;constructor(e){super(vt.eventName,{bubbles:!0,composed:!0}),this.data=e}}class gt{static#Ne=new y.SharedObject.SharedObject((()=>n.RecordingPlayer.RecordingPlayer.connectPuppeteer()),(({browser:e})=>n.RecordingPlayer.RecordingPlayer.disconnectPuppeteer(e)));static async default(e){const t={type:e},o=dt[t.type];let r=Promise.resolve();for(const e of o.required)r=Promise.all([r,(async()=>Object.assign(t,{[e]:await this.defaultByAttribute(t,e)}))()]);return await r,Object.freeze(t)}static async defaultByAttribute(e,t){return await this.#Ne.run((e=>{switch(t){case"assertedEvents":return Ye(ct.assertedEvents,new Xe({0:{url:e.page.url()||ct.assertedEvents[0].url}}));case"url":return e.page.url()||ct.url;case"height":return e.page.evaluate((()=>visualViewport.height))||ct.height;case"width":return e.page.evaluate((()=>visualViewport.width))||ct.width;default:return ct[t]}}))}static fromStep(e){const t=structuredClone(e);for(const o of["parameters","properties"])o in e&&void 0!==e[o]&&(t[o]=JSON.stringify(e[o]));if("attributes"in e&&e.attributes){t.attributes=[];for(const[o,r]of Object.entries(e.attributes))t.attributes.push({name:o,value:r})}return"selectors"in e&&(t.selectors=e.selectors.map((e=>"string"==typeof e?[e]:[...e]))),qe(t)}static toStep(e){const t=structuredClone(e);for(const o of["parameters","properties"]){const r=e[o];r&&Object.assign(t,{[o]:JSON.parse(r)})}if(e.attributes)if(0!==e.attributes.length){const o={};for(const{name:t,value:r}of e.attributes)Object.assign(o,{[t]:r});Object.assign(t,{attributes:o})}else"attributes"in t&&delete t.attributes;if(e.selectors){const o=e.selectors.filter((e=>e.length>0)).map((e=>1===e.length?e[0]:[...e]));0!==o.length?Object.assign(t,{selectors:o}):"selectors"in t&&delete t.selectors}return e.frame&&0===e.frame.length&&"frame"in t&&delete t.frame,o=n.SchemaUtils.parseStep(t),JSON.parse(JSON.stringify(o));var o}}let bt=class extends ot{static styles=[Ze];#je=new m.SelectorPicker.SelectorPicker(this);constructor(){super(),this.disabled=!1}#e=e=>{e.preventDefault(),e.stopPropagation(),this.#je.toggle()};disconnectedCallback(){super.disconnectedCallback(),this.#je.stop()}render(){if(!this.disabled)return Qe`<devtools-button
      @click=${this.#e}
      .title=${ht(pt.selectorPicker)}
      class="selector-picker"
      .size=${"SMALL"}
      .iconName=${"select-element"}
      .active=${this.#je.active}
      .variant=${"icon"}
      jslog=${i.toggle("selector-picker").track({click:!0})}
    ></devtools-button>`}};Je([st({type:Boolean})],bt.prototype,"disabled",void 0),bt=Je([rt("devtools-recorder-selector-picker-button")],bt);let mt=class extends ot{static styles=[Ze];#Ae=new Set;constructor(){super(),this.state={type:n.Schema.StepType.WaitForElement},this.isTypeEditable=!0,this.disabled=!1}createRenderRoot(){const e=super.createRenderRoot();return e.addEventListener("keydown",this.#ze),e}set step(e){this.state=qe(gt.fromStep(e)),this.error=void 0}#Me(e){try{this.dispatchEvent(new vt(gt.toStep(e))),this.state=e}catch(e){this.error=e.message}}#Be=e=>{e.preventDefault(),e.stopPropagation(),this.#Me(Ye(this.state,{target:e.data.target,frame:e.data.frame,selectors:e.data.selectors.map((e=>"string"==typeof e?[e]:e)),offsetX:e.data.offsetX,offsetY:e.data.offsetY}))};#Pe=(e,t,o)=>r=>{r.preventDefault(),r.stopPropagation(),this.#Me(Ye(this.state,e)),this.#Le(t),o&&c.userMetrics.recordingEdited(o)};#ze=e=>{if(He(e instanceof KeyboardEvent),e.target instanceof b.SuggestionInput.SuggestionInput&&"Enter"===e.key){e.preventDefault(),e.stopPropagation();const t=this.renderRoot.querySelectorAll("devtools-suggestion-input"),o=[...t].findIndex((t=>t===e.target));o>=0&&o+1<t.length?t[o+1].focus():e.target.blur()}};#Oe=e=>t=>{if(He(t.target instanceof b.SuggestionInput.SuggestionInput),t.target.disabled)return;const o=lt[e.attribute],r=at[o](t.target.value),s=e.from.bind(this)(r);s&&(this.#Me(Ye(this.state,s)),e.metric&&c.userMetrics.recordingEdited(e.metric))};#Fe=async e=>{if(He(e.target instanceof b.SuggestionInput.SuggestionInput),e.target.disabled)return;const t=e.target.value;t!==this.state.type&&(Object.values(n.Schema.StepType).includes(t)?(this.#Me(await gt.default(t)),c.userMetrics.recordingEdited(9)):this.error=ht(pt.unknownActionType))};#De=async e=>{e.preventDefault(),e.stopPropagation();const t=e.target.dataset.attribute;this.#Me(Ye(this.state,{[t]:await gt.defaultByAttribute(this.state,t)})),this.#Le(`[data-attribute=${t}].attribute devtools-suggestion-input`)};#Ve(e){if(!this.disabled)return Qe`
      <devtools-button
        title=${e.title}
        .size=${"SMALL"}
        .iconName=${e.iconName}
        .variant=${"icon"}
        jslog=${i.action(e.class).track({click:!0})}
        class="inline-button ${e.class}"
        @click=${e.onClick}
      ></devtools-button>
    `}#_e(e){if(this.disabled)return;return[...dt[this.state.type].optional].includes(e)&&!this.disabled?Qe`<devtools-button
      .size=${"SMALL"}
      .iconName=${"bin"}
      .variant=${"icon"}
      .title=${ht(pt.deleteRow)}
      class="inline-button delete-row"
      data-attribute=${e}
      jslog=${i.action("delete").track({click:!0})}
      @click=${t=>{t.preventDefault(),t.stopPropagation(),this.#Me(Ye(this.state,{[e]:void 0}))}}
    ></devtools-button>`:void 0}#Ke(e){return this.#Ae.add("type"),Qe`<div class="row attribute" data-attribute="type" jslog=${i.treeItem("type")}>
      <div>type<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${!e||this.disabled}
        .options=${Object.values(n.Schema.StepType)}
        .placeholder=${ct.type}
        .value=${nt(this.state.type)}
        @blur=${this.#Fe}
      ></devtools-suggestion-input>
    </div>`}#Ge(e){this.#Ae.add(e);const t=this.state[e]?.toString();if(void 0!==t)return Qe`<div class="row attribute" data-attribute=${e} jslog=${i.treeItem(d.StringUtilities.toKebabCase(e))}>
      <div>${e}<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${this.disabled}
        .placeholder=${ct[e].toString()}
        .value=${nt(t)}
        .mimeType=${(()=>{switch(e){case"expression":return"text/javascript";case"properties":return"application/json";default:return""}})()}
        @blur=${this.#Oe({attribute:e,from(t){if(void 0!==this.state[e]){if("properties"===e)c.userMetrics.recordingAssertion(2);return{[e]:t}}},metric:10})}
      ></devtools-suggestion-input>
      ${this.#_e(e)}
    </div>`}#Ue(){if(this.#Ae.add("frame"),void 0!==this.state.frame)return Qe`
      <div class="attribute" data-attribute="frame" jslog=${i.treeItem("frame")}>
        <div class="row">
          <div>frame<span class="separator">:</span></div>
          ${this.#_e("frame")}
        </div>
        ${this.state.frame.map(((e,t,o)=>Qe`
            <div class="padded row">
              <devtools-suggestion-input
                .disabled=${this.disabled}
                .placeholder=${ct.frame[0].toString()}
                .value=${nt(e.toString())}
                data-path=${`frame.${t}`}
                @blur=${this.#Oe({attribute:"frame",from(e){if(void 0!==this.state.frame?.[t])return{frame:new Xe({[t]:e})}},metric:10})}
              ></devtools-suggestion-input>
              ${this.#Ve({class:"add-frame",title:ht(pt.addFrameIndex),iconName:"plus",onClick:this.#Pe({frame:new Xe({[t+1]:new We(ct.frame[0])})},`devtools-suggestion-input[data-path="frame.${t+1}"]`,10)})}
              ${this.#Ve({class:"remove-frame",title:ht(pt.removeFrameIndex),iconName:"minus",onClick:this.#Pe({frame:new Xe({[t]:void 0})},`devtools-suggestion-input[data-path="frame.${Math.min(t,o.length-2)}"]`,10)})}
            </div>
          `))}
      </div>
    `}#He(){if(this.#Ae.add("selectors"),void 0!==this.state.selectors)return Qe`<div class="attribute" data-attribute="selectors" jslog=${i.treeItem("selectors")}>
      <div class="row">
        <div>selectors<span class="separator">:</span></div>
        <devtools-recorder-selector-picker-button
          @selectorpicked=${this.#Be}
          .disabled=${this.disabled}
        ></devtools-recorder-selector-picker-button>
        ${this.#_e("selectors")}
      </div>
      ${this.state.selectors.map(((e,t,o)=>Qe`<div class="padded row" data-selector-path=${t}>
            <div>selector #${t+1}<span class="separator">:</span></div>
            ${this.#Ve({class:"add-selector",title:ht(pt.addSelector),iconName:"plus",onClick:this.#Pe({selectors:new Xe({[t+1]:new We(structuredClone(ct.selectors[0]))})},`devtools-suggestion-input[data-path="selectors.${t+1}.0"]`,4)})}
            ${this.#Ve({class:"remove-selector",title:ht(pt.removeSelector),iconName:"minus",onClick:this.#Pe({selectors:new Xe({[t]:void 0})},`devtools-suggestion-input[data-path="selectors.${Math.min(t,o.length-2)}.0"]`,5)})}
          </div>
          ${e.map(((e,o,r)=>Qe`<div
              class="double padded row"
              data-selector-path="${t}.${o}"
            >
              <devtools-suggestion-input
                .disabled=${this.disabled}
                .placeholder=${ct.selectors[0][0]}
                .value=${nt(e)}
                data-path=${`selectors.${t}.${o}`}
                @blur=${this.#Oe({attribute:"selectors",from(e){if(void 0!==this.state.selectors?.[t]?.[o])return{selectors:new Xe({[t]:new Xe({[o]:e})})}},metric:7})}
              ></devtools-suggestion-input>
              ${this.#Ve({class:"add-selector-part",title:ht(pt.addSelectorPart),iconName:"plus",onClick:this.#Pe({selectors:new Xe({[t]:new Xe({[o+1]:new We(ct.selectors[0][0])})})},`devtools-suggestion-input[data-path="selectors.${t}.${o+1}"]`,6)})}
              ${this.#Ve({class:"remove-selector-part",title:ht(pt.removeSelectorPart),iconName:"minus",onClick:this.#Pe({selectors:new Xe({[t]:new Xe({[o]:void 0})})},`devtools-suggestion-input[data-path="selectors.${t}.${Math.min(o,r.length-2)}"]`,8)})}
            </div>`))}`))}
    </div>`}#qe(){if(this.#Ae.add("assertedEvents"),void 0!==this.state.assertedEvents)return Qe`<div class="attribute" data-attribute="assertedEvents" jslog=${i.treeItem("asserted-events")}>
      <div class="row">
        <div>asserted events<span class="separator">:</span></div>
        ${this.#_e("assertedEvents")}
      </div>
      ${this.state.assertedEvents.map(((e,t)=>Qe` <div class="padded row" jslog=${i.treeItem("event-type")}>
            <div>type<span class="separator">:</span></div>
            <div>${e.type}</div>
          </div>
          <div class="padded row" jslog=${i.treeItem("event-title")}>
            <div>title<span class="separator">:</span></div>
            <devtools-suggestion-input
              .disabled=${this.disabled}
              .placeholder=${ct.assertedEvents[0].title}
              .value=${nt(e.title??"")}
              @blur=${this.#Oe({attribute:"assertedEvents",from(e){if(void 0!==this.state.assertedEvents?.[t]?.title)return{assertedEvents:new Xe({[t]:{title:e}})}},metric:10})}
            ></devtools-suggestion-input>
          </div>
          <div class="padded row" jslog=${i.treeItem("event-url")}>
            <div>url<span class="separator">:</span></div>
            <devtools-suggestion-input
              .disabled=${this.disabled}
              .placeholder=${ct.assertedEvents[0].url}
              .value=${nt(e.url??"")}
              @blur=${this.#Oe({attribute:"url",from(e){if(void 0!==this.state.assertedEvents?.[t]?.url)return{assertedEvents:new Xe({[t]:{url:e}})}},metric:10})}
            ></devtools-suggestion-input>
          </div>`))}
    </div> `}#We(){if(this.#Ae.add("attributes"),void 0!==this.state.attributes)return Qe`<div class="attribute" data-attribute="attributes" jslog=${i.treeItem("attributes")}>
      <div class="row">
        <div>attributes<span class="separator">:</span></div>
        ${this.#_e("attributes")}
      </div>
      ${this.state.attributes.map((({name:e,value:t},o,r)=>Qe`<div class="padded row" jslog=${i.treeItem("attribute")}>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${ct.attributes[0].name}
            .value=${nt(e)}
            data-path=${`attributes.${o}.name`}
            jslog=${i.key().track({change:!0})}
            @blur=${this.#Oe({attribute:"attributes",from(e){if(void 0!==this.state.attributes?.[o]?.name)return c.userMetrics.recordingAssertion(3),{attributes:new Xe({[o]:{name:e}})}},metric:10})}
          ></devtools-suggestion-input>
          <span class="separator">:</span>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${ct.attributes[0].value}
            .value=${nt(t)}
            data-path=${`attributes.${o}.value`}
            @blur=${this.#Oe({attribute:"attributes",from(e){if(void 0!==this.state.attributes?.[o]?.value)return c.userMetrics.recordingAssertion(3),{attributes:new Xe({[o]:{value:e}})}},metric:10})}
          ></devtools-suggestion-input>
          ${this.#Ve({class:"add-attribute-assertion",title:ht(pt.addSelectorPart),iconName:"plus",onClick:this.#Pe({attributes:new Xe({[o+1]:new We((()=>{{const e=new Set(r.map((({name:e})=>e))),t=ct.attributes[0];let o=t.name,s=0;for(;e.has(o);)++s,o=`${t.name}-${s}`;return{...t,name:o}}})())})},`devtools-suggestion-input[data-path="attributes.${o+1}.name"]`,10)})}
          ${this.#Ve({class:"remove-attribute-assertion",title:ht(pt.removeSelectorPart),iconName:"minus",onClick:this.#Pe({attributes:new Xe({[o]:void 0})},`devtools-suggestion-input[data-path="attributes.${Math.min(o,r.length-2)}.value"]`,10)})}
        </div>`))}
    </div>`}#Xe(){return[...dt[this.state.type].optional].filter((e=>void 0===this.state[e])).map((e=>Qe`<devtools-button
          .variant=${"outlined"}
          class="add-row"
          data-attribute=${e}
          jslog=${i.action(`add-${d.StringUtilities.toKebabCase(e)}`)}
          @click=${this.#De}
        >
          ${ht(pt.addAttribute,{attributeName:e})}
        </devtools-button>`))}#Le=e=>{this.updateComplete.then((()=>{const t=this.renderRoot.querySelector(e);t?.focus()}))};render(){this.#Ae=new Set;const e=Qe`
      <div class="wrapper" jslog=${i.tree("step-editor")}>
        ${this.#Ke(this.isTypeEditable)} ${this.#Ge("target")}
        ${this.#Ue()} ${this.#He()}
        ${this.#Ge("deviceType")} ${this.#Ge("button")}
        ${this.#Ge("url")} ${this.#Ge("x")}
        ${this.#Ge("y")} ${this.#Ge("offsetX")}
        ${this.#Ge("offsetY")} ${this.#Ge("value")}
        ${this.#Ge("key")} ${this.#Ge("operator")}
        ${this.#Ge("count")} ${this.#Ge("expression")}
        ${this.#Ge("duration")} ${this.#qe()}
        ${this.#Ge("timeout")} ${this.#Ge("width")}
        ${this.#Ge("height")} ${this.#Ge("deviceScaleFactor")}
        ${this.#Ge("isMobile")} ${this.#Ge("hasTouch")}
        ${this.#Ge("isLandscape")} ${this.#Ge("download")}
        ${this.#Ge("upload")} ${this.#Ge("latency")}
        ${this.#Ge("name")} ${this.#Ge("parameters")}
        ${this.#Ge("visible")} ${this.#Ge("properties")}
        ${this.#We()}
        ${this.error?Qe`
              <div class="error">
                ${ht(pt.notSaved,{error:this.error})}
              </div>
            `:void 0}
        ${this.disabled?void 0:Qe`<div
              class="row-buttons wrapped gap row regular-font no-margin"
            >
              ${this.#Xe()}
            </div>`}
      </div>
    `;for(const e of Object.keys(lt))if(!this.#Ae.has(e))throw new Error(`The editable attribute ${e} does not have UI`);return e}};Je([it()],mt.prototype,"state",void 0),Je([it()],mt.prototype,"error",void 0),Je([st({type:Boolean})],mt.prototype,"isTypeEditable",void 0),Je([st({type:Boolean})],mt.prototype,"disabled",void 0),mt=Je([rt("devtools-recorder-step-editor")],mt);var yt=Object.freeze({__proto__:null,EditorState:gt,StepEditedEvent:vt,get StepEditor(){return mt}}),ft={cssText:`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.timeline-section{position:relative;padding:16px 0 16px 40px;margin-left:8px;--override-color-recording-successful-text:#36a854;--override-color-recording-successful-background:#e6f4ea}.overlay{position:absolute;width:100vw;height:100%;left:calc(-32px - 80px);top:0;z-index:-1;pointer-events:none}@container (max-width: 400px){.overlay{left:-32px}}:hover .overlay{background:var(--sys-color-state-hover-on-subtle)}.is-selected .overlay{background:var(--sys-color-tonal-container)}:host-context(.is-stopped) .overlay{background:var(--sys-color-state-ripple-primary);outline:1px solid var(--sys-color-state-focus-ring);z-index:4}.is-start-of-group{padding-top:28px}.is-end-of-group{padding-bottom:24px}.icon{position:absolute;left:4px;transform:translateX(-50%);z-index:2}.bar{position:absolute;left:4px;display:block;transform:translateX(-50%);top:18px;height:calc(100% + 8px);z-index:1}.bar .background{fill:var(--sys-color-state-hover-on-subtle)}.bar .line{fill:var(--sys-color-primary)}.is-first-section .bar{top:32px;height:calc(100% - 8px);display:none}.is-first-section:not(.is-last-section) .bar{display:block}.is-last-section .bar .line{display:none}.is-last-section .bar .background{display:none}:host-context(.is-error) .bar .line{fill:var(--sys-color-error)}:host-context(.is-error) .bar .background{fill:var(--sys-color-error-container)}:host-context(.was-successful) .bar .background{animation:flash-background 2s}:host-context(.was-successful) .bar .line{animation:flash-line 2s}@keyframes flash-background{25%{fill:var(--override-color-recording-successful-background)}75%{fill:var(--override-color-recording-successful-background)}}@keyframes flash-line{25%{fill:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text)}}\n/*# sourceURL=${import.meta.resolve("./timelineSection.css")} */\n`};const xt=new CSSStyleSheet;xt.replaceSync(ft.cssText);const{html:wt}=e;class St extends HTMLElement{#Ye=!1;#Je=!1;#Ze=!1;#Qe=!1;#et=!1;constructor(){super();this.attachShadow({mode:"open"}).adoptedStyleSheets=[xt]}set data(e){this.#Ze=e.isFirstSection,this.#Qe=e.isLastSection,this.#Ye=e.isEndOfGroup,this.#Je=e.isStartOfGroup,this.#et=e.isSelected,this.#i()}connectedCallback(){this.#i()}#i(){const t={"timeline-section":!0,"is-end-of-group":this.#Ye,"is-start-of-group":this.#Je,"is-first-section":this.#Ze,"is-last-section":this.#Qe,"is-selected":this.#et};e.render(wt`
      <div class=${e.Directives.classMap(t)}>
        <div class="overlay"></div>
        <div class="icon"><slot name="icon"></slot></div>
        <svg width="24" height="100%" class="bar">
          <rect class="line" x="7" y="0" width="2" height="100%" />
        </svg>
        <slot></slot>
      </div>
    `,this.shadowRoot,{host:this})}}customElements.define("devtools-timeline-section",St);var kt=Object.freeze({__proto__:null,TimelineSection:St}),$t={cssText:`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.title-container{max-width:calc(100% - 18px);font-size:13px;line-height:16px;letter-spacing:0.03em;display:flex;flex-direction:row;gap:3px;outline-offset:3px}.action{display:flex;align-items:flex-start}.title{flex:1;min-width:0}.is-start-of-group .title{font-weight:bold}.error-icon{display:none}.breakpoint-icon{visibility:hidden;cursor:pointer;opacity:0%;fill:var(--sys-color-primary);stroke:#1a73e8;transform:translate(-1.92px,-3px)}.circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-cdt-base-container);stroke-width:4px;r:5px;cx:8px;cy:8px}.is-start-of-group .circle-icon{r:7px;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.step.is-success .circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-primary)}.step.is-current .circle-icon{stroke-dasharray:24 10;animation:rotate 1s linear infinite;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error);position:relative}@keyframes rotate{0%{transform:translate(8px,8px) rotate(0) translate(-8px,-8px)}100%{transform:translate(8px,8px) rotate(360deg) translate(-8px,-8px)}}.step.is-error .circle-icon{fill:var(--sys-color-error);stroke:var(--sys-color-error)}.step.is-error .error-icon{display:block;transform:translate(4px,4px)}:host-context(.was-successful) .circle-icon{animation:flash-circle 2s}:host-context(.was-successful) .breakpoint-icon{animation:flash-breakpoint-icon 2s}@keyframes flash-circle{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}@keyframes flash-breakpoint-icon{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}.chevron{width:14px;height:14px;transition:200ms;position:absolute;top:18px;left:24px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0deg)}.is-start-of-group .chevron{top:34px}.details{display:none;margin-top:8px;position:relative}.expanded .details{display:block}.step-details{overflow:auto}devtools-recorder-step-editor{border:1px solid var(--sys-color-neutral-outline);padding:3px 6px 6px;margin-left:-6px;border-radius:3px}devtools-recorder-step-editor:hover{border:1px solid var(--sys-color-neutral-outline)}devtools-recorder-step-editor.is-selected{background-color:color-mix(in srgb,var(--sys-color-tonal-container),var(--sys-color-cdt-base-container) 50%);border:1px solid var(--sys-color-tonal-outline)}.summary{display:flex;flex-flow:row nowrap}.filler{flex-grow:1}.subtitle{font-weight:normal;color:var(--sys-color-on-surface-subtle);word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.main-title{word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.step-actions{border:none;border-radius:0;height:24px;--override-select-menu-show-button-border-radius:0;--override-select-menu-show-button-outline:none;--override-select-menu-show-button-padding:0}.step.has-breakpoint .circle-icon{visibility:hidden}.step:not(.is-start-of-group).has-breakpoint .breakpoint-icon{visibility:visible;opacity:100%}.step:not(.is-start-of-group, .has-breakpoint) .icon:hover .circle-icon{transition:opacity 0.2s;opacity:0%}.step:not(.is-start-of-group, .has-breakpoint) .icon:hover .error-icon{visibility:hidden}.step:not(.is-start-of-group, .has-breakpoint) .icon:hover .breakpoint-icon{transition:opacity 0.2s;visibility:visible;opacity:50%}\n/*# sourceURL=${import.meta.resolve("./stepView.css")} */\n`};const Et=new CSSStyleSheet;Et.replaceSync($t.cssText);const{html:Ct}=e,Rt={setViewportClickTitle:"Set viewport",customStepTitle:"Custom step",clickStepTitle:"Click",doubleClickStepTitle:"Double click",hoverStepTitle:"Hover",emulateNetworkConditionsStepTitle:"Emulate network conditions",changeStepTitle:"Change",closeStepTitle:"Close",scrollStepTitle:"Scroll",keyUpStepTitle:"Key up",navigateStepTitle:"Navigate",keyDownStepTitle:"Key down",waitForElementStepTitle:"Wait for element",waitForExpressionStepTitle:"Wait for expression",elementRoleButton:"Button",elementRoleInput:"Input",elementRoleFallback:"Element",addStepBefore:"Add step before",addStepAfter:"Add step after",removeStep:"Remove step",openStepActions:"Open step actions",addBreakpoint:"Add breakpoint",removeBreakpoint:"Remove breakpoint",copyAs:"Copy as",stepManagement:"Manage steps",breakpoints:"Breakpoints"},Tt=o.i18n.registerUIStrings("panels/recorder/components/StepView.ts",Rt),It=o.i18n.getLocalizedString.bind(void 0,Tt);class Nt extends Event{static eventName="captureselectors";data;constructor(e){super(Nt.eventName,{bubbles:!0,composed:!0}),this.data=e}}class jt extends Event{static eventName="stopselectorscapture";constructor(){super(jt.eventName,{bubbles:!0,composed:!0})}}class At extends Event{static eventName="copystep";step;constructor(e){super(At.eventName,{bubbles:!0,composed:!0}),this.step=e}}class zt extends Event{static eventName="stepchanged";currentStep;newStep;constructor(e,t){super(zt.eventName,{bubbles:!0,composed:!0}),this.currentStep=e,this.newStep=t}}class Mt extends Event{static eventName="addstep";position;stepOrSection;constructor(e,t){super(Mt.eventName,{bubbles:!0,composed:!0}),this.stepOrSection=e,this.position=t}}class Bt extends Event{static eventName="removestep";step;constructor(e){super(Bt.eventName,{bubbles:!0,composed:!0}),this.step=e}}class Pt extends Event{static eventName="addbreakpoint";index;constructor(e){super(Pt.eventName,{bubbles:!0,composed:!0}),this.index=e}}class Lt extends Event{static eventName="removebreakpoint";index;constructor(e){super(Lt.eventName,{bubbles:!0,composed:!0}),this.index=e}}const Ot="copy-step-as-";function Ft(e){if(!("selectors"in e))return"";const t=e.selectors.flat().find((e=>e.startsWith("aria/")));if(!t)return"";const o=t.match(/^aria\/(.+?)(\[role="(.+)"\])?$/);return o?`${function(e){switch(e){case"button":return It(Rt.elementRoleButton);case"input":return It(Rt.elementRoleInput);default:return It(Rt.elementRoleFallback)}}(o[3])} "${o[1]}"`:""}function Dt(t,o,r){if(!t.step&&!t.section)return;const s={step:!0,expanded:t.showDetails,"is-success":"success"===t.state,"is-current":"current"===t.state,"is-outstanding":"outstanding"===t.state,"is-error":"error"===t.state,"is-stopped":"stopped"===t.state,"is-start-of-group":t.isStartOfGroup,"is-first-section":t.isFirstSection,"has-breakpoint":t.hasBreakpoint},a=Boolean(t.step),l=function(e){if(e.section)return e.section.title?e.section.title:Ct`<span class="fallback">(No Title)</span>`;if(!e.step)throw new Error("Missing both step and section");switch(e.step.type){case n.Schema.StepType.CustomStep:return It(Rt.customStepTitle);case n.Schema.StepType.SetViewport:return It(Rt.setViewportClickTitle);case n.Schema.StepType.Click:return It(Rt.clickStepTitle);case n.Schema.StepType.DoubleClick:return It(Rt.doubleClickStepTitle);case n.Schema.StepType.Hover:return It(Rt.hoverStepTitle);case n.Schema.StepType.EmulateNetworkConditions:return It(Rt.emulateNetworkConditionsStepTitle);case n.Schema.StepType.Change:return It(Rt.changeStepTitle);case n.Schema.StepType.Close:return It(Rt.closeStepTitle);case n.Schema.StepType.Scroll:return It(Rt.scrollStepTitle);case n.Schema.StepType.KeyUp:return It(Rt.keyUpStepTitle);case n.Schema.StepType.KeyDown:return It(Rt.keyDownStepTitle);case n.Schema.StepType.WaitForElement:return It(Rt.waitForElementStepTitle);case n.Schema.StepType.WaitForExpression:return It(Rt.waitForExpressionStepTitle);case n.Schema.StepType.Navigate:return It(Rt.navigateStepTitle)}}({step:t.step,section:t.section}),c=t.step?Ft(t.step):d?d.url:"";var d;e.render(Ct`
    <devtools-timeline-section .data=${{isFirstSection:t.isFirstSection,isLastSection:t.isLastSection,isStartOfGroup:t.isStartOfGroup,isEndOfGroup:t.isEndOfGroup,isSelected:t.isSelected}} @contextmenu=${t.onStepContextMenu} data-step-index=${t.stepIndex} data-section-index=${t.sectionIndex} class=${e.Directives.classMap(s)}>
      <svg slot="icon" width="24" height="24" height="100%" class="icon">
        <circle class="circle-icon"/>
        <g class="error-icon">
          <path d="M1.5 1.5L6.5 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1.5 6.5L6.5 1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <path @click=${t.onBreakpointClick} jslog=${i.action("breakpoint").track({click:!0})} class="breakpoint-icon" d="M2.5 5.5H17.7098L21.4241 12L17.7098 18.5H2.5V5.5Z"/>
      </svg>
      <div class="summary">
        <div class="title-container ${a?"action":""}"
          @click=${a&&t.toggleShowDetails}
          @keydown=${a&&t.onToggleShowDetailsKeydown}
          tabindex="0"
          jslog=${i.sectionHeader().track({click:!0})}
          aria-role=${a?"button":""}
          aria-label=${a?"Show details for step":""}
        >
          ${a?Ct`<devtools-icon
                  class="chevron"
                  jslog=${i.expand().track({click:!0})}
                  name="triangle-down">
                </devtools-icon>`:""}
          <div class="title">
            <div class="main-title" title=${l}>${l}</div>
            <div class="subtitle" title=${c}>${c}</div>
          </div>
        </div>
        <div class="filler"></div>
        ${function(e){return Ct`
    <devtools-button
      class="step-actions"
      title=${It(Rt.openStepActions)}
      aria-label=${It(Rt.openStepActions)}
      @click=${e.onStepContextMenu}
      @keydown=${e=>{e.stopPropagation()}}
      jslog=${i.dropDown("step-actions").track({click:!0})}
      .data=${{variant:"icon",iconName:"dots-vertical",title:It(Rt.openStepActions)}}
    ></devtools-button>
  `}(t)}
      </div>
      <div class="details">
        ${t.step&&Ct`<devtools-recorder-step-editor
          class=${t.isSelected?"is-selected":""}
          .step=${t.step}
          .disabled=${t.isPlaying}
          @stepedited=${t.stepEdited}>
        </devtools-recorder-step-editor>`}
        ${t.section?.causingStep&&Ct`<devtools-recorder-step-editor
          .step=${t.section.causingStep}
          .isTypeEditable=${!1}
          .disabled=${t.isPlaying}
          @stepedited=${t.stepEdited}>
        </devtools-recorder-step-editor>`}
      </div>
      ${t.error&&Ct`
        <div class="error" role="alert">
          ${t.error.message}
        </div>
      `}
    </devtools-timeline-section>
  `,r)}class Vt extends HTMLElement{#t=this.attachShadow({mode:"open"});#tt=new IntersectionObserver((e=>{this.#ot.isVisible=e[0].isIntersecting}));#ot={state:"default",showDetails:!1,isEndOfGroup:!1,isStartOfGroup:!1,stepIndex:0,sectionIndex:0,isFirstSection:!1,isLastSection:!1,isRecording:!1,isPlaying:!1,isVisible:!1,hasBreakpoint:!1,removable:!0,builtInConverters:[],extensionConverters:[],isSelected:!1,recorderSettings:void 0,actions:[],stepEdited:this.#rt.bind(this),onBreakpointClick:this.#st.bind(this),handleStepAction:this.#it.bind(this),toggleShowDetails:this.#nt.bind(this),onToggleShowDetailsKeydown:this.#at.bind(this),onStepContextMenu:this.#lt.bind(this)};#ct=Dt;constructor(e){super(),e&&(this.#ct=e),this.setAttribute("jslog",`${i.section("step-view")}`)}set data(e){const t=this.#ot.state;this.#ot.step=e.step,this.#ot.section=e.section,this.#ot.state=e.state,this.#ot.error=e.error,this.#ot.isEndOfGroup=e.isEndOfGroup,this.#ot.isStartOfGroup=e.isStartOfGroup,this.#ot.stepIndex=e.stepIndex,this.#ot.sectionIndex=e.sectionIndex,this.#ot.isFirstSection=e.isFirstSection,this.#ot.isLastSection=e.isLastSection,this.#ot.isRecording=e.isRecording,this.#ot.isPlaying=e.isPlaying,this.#ot.hasBreakpoint=e.hasBreakpoint,this.#ot.removable=e.removable,this.#ot.builtInConverters=e.builtInConverters,this.#ot.extensionConverters=e.extensionConverters,this.#ot.isSelected=e.isSelected,this.#ot.recorderSettings=e.recorderSettings,this.#ot.actions=this.#dt(),this.#i(),this.#ot.state===t||"current"!==this.#ot.state||this.#ot.isVisible||this.scrollIntoView()}get step(){return this.#ot.step}get section(){return this.#ot.section}connectedCallback(){this.#t.adoptedStyleSheets=[Et],this.#tt.observe(this),this.#i()}disconnectedCallback(){this.#tt.unobserve(this)}#nt(){this.#ot.showDetails=!this.#ot.showDetails,this.#i()}#at(e){const t=e;"Enter"!==t.key&&" "!==t.key||(this.#nt(),e.stopPropagation(),e.preventDefault())}#rt(e){const t=this.#ot.step||this.#ot.section?.causingStep;if(!t)throw new Error("Expected step.");this.dispatchEvent(new zt(t,e.data))}#it(e){switch(e.itemValue){case"add-step-before":{const e=this.#ot.step||this.#ot.section;if(!e)throw new Error("Expected step or section.");this.dispatchEvent(new Mt(e,"before"));break}case"add-step-after":{const e=this.#ot.step||this.#ot.section;if(!e)throw new Error("Expected step or section.");this.dispatchEvent(new Mt(e,"after"));break}case"remove-step":{const e=this.#ot.section?.causingStep;if(!this.#ot.step&&!e)throw new Error("Expected step.");this.dispatchEvent(new Bt(this.#ot.step||e));break}case"add-breakpoint":if(!this.#ot.step)throw new Error("Expected step");this.dispatchEvent(new Pt(this.#ot.stepIndex));break;case"remove-breakpoint":if(!this.#ot.step)throw new Error("Expected step");this.dispatchEvent(new Lt(this.#ot.stepIndex));break;default:{const t=e.itemValue;if(!t.startsWith(Ot))throw new Error("Unknown step action.");const o=this.#ot.step||this.#ot.section?.causingStep;if(!o)throw new Error("Step not found.");const r=t.substring(13);this.#ot.recorderSettings&&(this.#ot.recorderSettings.preferredCopyFormat=r),this.dispatchEvent(new At(structuredClone(o)))}}}#st(){this.#ot.hasBreakpoint?this.dispatchEvent(new Lt(this.#ot.stepIndex)):this.dispatchEvent(new Pt(this.#ot.stepIndex)),this.#i()}#dt=()=>{const e=[];if(this.#ot.isPlaying||(this.#ot.step&&e.push({id:"add-step-before",label:It(Rt.addStepBefore),group:"stepManagement",groupTitle:It(Rt.stepManagement)}),e.push({id:"add-step-after",label:It(Rt.addStepAfter),group:"stepManagement",groupTitle:It(Rt.stepManagement)}),this.#ot.removable&&e.push({id:"remove-step",group:"stepManagement",groupTitle:It(Rt.stepManagement),label:It(Rt.removeStep)})),this.#ot.step&&!this.#ot.isRecording&&(this.#ot.hasBreakpoint?e.push({id:"remove-breakpoint",label:It(Rt.removeBreakpoint),group:"breakPointManagement",groupTitle:It(Rt.breakpoints)}):e.push({id:"add-breakpoint",label:It(Rt.addBreakpoint),group:"breakPointManagement",groupTitle:It(Rt.breakpoints)})),this.#ot.step){for(const t of this.#ot.builtInConverters||[])e.push({id:Ot+d.StringUtilities.toKebabCase(t.getId()),label:t.getFormatName(),group:"copy",groupTitle:It(Rt.copyAs)});for(const t of this.#ot.extensionConverters||[])e.push({id:Ot+d.StringUtilities.toKebabCase(t.getId()),label:t.getFormatName(),group:"copy",groupTitle:It(Rt.copyAs),jslogContext:Ot+"extension"})}return e};#lt(e){const o=e.target instanceof r.Button.Button?e.target:void 0,s=new t.ContextMenu.ContextMenu(e,{x:o?.getBoundingClientRect().left,y:o?.getBoundingClientRect().bottom}),i=this.#dt(),n=i.filter((e=>e.id.startsWith(Ot))),a=i.filter((e=>!e.id.startsWith(Ot)));for(const e of a){s.section(e.group).appendItem(e.label,(()=>{this.#it(new g.Menu.MenuItemSelectedEvent(e.id))}),{jslogContext:e.id})}const l=n.find((e=>e.id===Ot+this.#ot.recorderSettings?.preferredCopyFormat));if(l&&s.section("copy").appendItem(l.label,(()=>{this.#it(new g.Menu.MenuItemSelectedEvent(l.id))}),{jslogContext:l.id}),n.length){const e=s.section("copy").appendSubMenuItem(It(Rt.copyAs),!1,"copy");for(const t of n)t!==l&&e.section(t.group).appendItem(t.label,(()=>{this.#it(new g.Menu.MenuItemSelectedEvent(t.id))}),{jslogContext:t.id})}s.show()}#i(){this.#ct(this.#ot,{},this.#t)}}customElements.define("devtools-step-view",Vt);var _t=Object.freeze({__proto__:null,AddBreakpointEvent:Pt,AddStep:Mt,CaptureSelectorsEvent:Nt,CopyStepEvent:At,RemoveBreakpointEvent:Lt,RemoveStep:Bt,StepChanged:zt,StepView:Vt,StopSelectorsCaptureEvent:jt});export{T as ControlButton,F as CreateRecordingView,J as RecordingListView,Me as RecordingView,ge as ReplaySection,Ge as SelectButton,yt as StepEditor,_t as StepView,kt as TimelineSection};
