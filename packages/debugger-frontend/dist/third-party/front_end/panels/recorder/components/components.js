import*as e from"../../../ui/lit-html/lit-html.js";import*as t from"../../../ui/legacy/legacy.js";import*as s from"../../../core/i18n/i18n.js";import*as i from"../../../ui/components/buttons/buttons.js";import*as r from"../../../ui/components/icon_button/icon_button.js";import*as o from"../../../ui/components/input/input.js";import*as n from"../../../ui/visual_logging/visual_logging.js";import*as a from"../models/models.js";import*as l from"../../../ui/components/helpers/helpers.js";import*as c from"../../../core/host/host.js";import*as d from"../../../core/platform/platform.js";import*as p from"../../../core/sdk/sdk.js";import*as u from"../../../third_party/codemirror.next/codemirror.next.js";import*as h from"../../../ui/components/code_highlighter/code_highlighter.js";import"../../../ui/components/dialogs/dialogs.js";import*as g from"../../../ui/components/menus/menus.js";import*as v from"../../../ui/components/split_view/split_view.js";import*as m from"../../../ui/components/text_editor/text_editor.js";import*as b from"../extensions/extensions.js";import*as f from"../../../ui/components/panel_feedback/panel_feedback.js";import*as w from"../../../ui/components/panel_introduction_steps/panel_introduction_steps.js";import*as y from"../../../ui/components/suggestion_input/suggestion_input.js";import*as S from"../controllers/controllers.js";import*as x from"../util/util.js";const $=new CSSStyleSheet;$.replaceSync('*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.control{background:none;border:none;display:flex;flex-direction:column;align-items:center}.control[disabled]{filter:grayscale(100%);cursor:auto}.icon{display:flex;width:40px;height:40px;border-radius:50%;background:var(--sys-color-error-bright);margin-bottom:8px;position:relative;transition:background 200ms;justify-content:center;align-content:center;align-items:center}.icon::before{--override-white:#fff;box-sizing:border-box;content:"";display:block;width:14px;height:14px;border:1px solid var(--override-white);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background-color:var(--override-white)}.icon.square::before{border-radius:0}.icon.circle::before{border-radius:50%}.icon:hover{background:color-mix(in sRGB,var(--sys-color-error-bright),var(--sys-color-state-hover-on-prominent) 10%)}.icon:active{background:color-mix(in sRGB,var(--sys-color-error-bright),var(--sys-color-state-ripple-neutral-on-prominent) 16%)}.control[disabled] .icon:hover{background:var(--sys-color-error)}.label{font-size:12px;line-height:16px;text-align:center;letter-spacing:0.02em;color:var(--sys-color-on-surface)}\n/*# sourceURL=controlButton.css */\n');var k=self&&self.__decorate||function(e,t,s,i){var r,o=arguments.length,n=o<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,s,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(n=(o<3?r(n):o>3?r(t,s,n):r(t,s))||n);return o>3&&n&&Object.defineProperty(t,s,n),n};const{html:T,Decorators:E,LitElement:R}=e,{customElement:C,property:I}=E;let N=class extends R{static styles=[$];constructor(){super(),this.label="",this.shape="square",this.disabled=!1}#e=e=>{this.disabled&&(e.stopPropagation(),e.preventDefault())};render(){return T`
            <button
                @click=${this.#e}
                .disabled=${this.disabled}
                class="control"
            >
                <div class="icon ${this.shape}"></div>
                <div class="label">${this.label}</div>
            </button>
        `}};k([I()],N.prototype,"label",void 0),k([I()],N.prototype,"shape",void 0),k([I()],N.prototype,"disabled",void 0),N=k([C("devtools-control-button")],N);var B=Object.freeze({__proto__:null,get ControlButton(){return N}});const j=new CSSStyleSheet;j.replaceSync('*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.wrapper{padding:24px;flex:1}h1{font-size:18px;line-height:24px;letter-spacing:0.02em;color:var(--sys-color-on-surface);margin:0;font-weight:normal}.row-label{font-weight:500;font-size:11px;line-height:16px;letter-spacing:0.8px;text-transform:uppercase;color:var(--sys-color-secondary);margin-bottom:8px;margin-top:32px;display:flex;align-items:center;gap:3px}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container)}.controls{display:flex}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error)}.row-label .link:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}.header-wrapper{display:flex;align-items:baseline;justify-content:space-between}.checkbox-label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis;gap:4px;line-height:1.1;padding:4px}.checkbox-container{display:flex;flex-flow:row wrap;gap:10px}input[type="checkbox"]:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}devtools-icon[name="help"]{width:16px;height:16px}\n/*# sourceURL=createRecordingView.css */\n');const M={recordingName:"Recording name",startRecording:"Start recording",createRecording:"Create a new recording",recordingNameIsRequired:"Recording name is required",selectorAttribute:"Selector attribute",cancelRecording:"Cancel recording",selectorTypeCSS:"CSS",selectorTypePierce:"Pierce",selectorTypeARIA:"ARIA",selectorTypeText:"Text",selectorTypeXPath:"XPath",selectorTypes:"Selector types to record",includeNecessarySelectors:"You must choose CSS, Pierce, or XPath as one of your options. Only these selectors are guaranteed to be recorded since ARIA and text selectors may not be unique.",learnMore:"Learn more"},A=s.i18n.registerUIStrings("panels/recorder/components/CreateRecordingView.ts",M),P=s.i18n.getLocalizedString.bind(void 0,A);class L extends Event{static eventName="recordingstarted";name;selectorAttribute;selectorTypesToRecord;constructor(e,t,s){super(L.eventName,{}),this.name=e,this.selectorAttribute=s||void 0,this.selectorTypesToRecord=t}}class F extends Event{static eventName="recordingcancelled";constructor(){super(F.eventName)}}class O extends HTMLElement{static litTagName=e.literal`devtools-create-recording-view`;#t=this.attachShadow({mode:"open"});#s="";#i;#r;constructor(){super(),this.setAttribute("jslog",`${n.section("create-recording-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[j,o.textInputStyles,o.checkboxStyles],this.#o(),this.#t.querySelector("input")?.focus()}set data(e){this.#r=e.recorderSettings,this.#s=this.#r.defaultTitle}#n(e){this.#i&&(this.#i=void 0,this.#o());"Enter"===e.key&&(this.startRecording(),e.stopPropagation(),e.preventDefault())}startRecording(){const e=this.#t.querySelector("#user-flow-name");if(!e)throw new Error("input#user-flow-name not found");if(!this.#r)throw new Error("settings not set");if(!e.value.trim())return this.#i=new Error(P(M.recordingNameIsRequired)),void this.#o();const t=this.#t.querySelectorAll(".selector-type input[type=checkbox]"),s=[];for(const e of t){const t=e,i=t.value;t.checked&&s.push(i)}if(!s.includes(a.Schema.SelectorType.CSS)&&!s.includes(a.Schema.SelectorType.XPath)&&!s.includes(a.Schema.SelectorType.Pierce))return this.#i=new Error(P(M.includeNecessarySelectors)),void this.#o();for(const e of Object.values(a.Schema.SelectorType))this.#r.setSelectorByType(e,s.includes(e));const i=this.#t.querySelector("#selector-attribute").value.trim();this.#r.selectorAttribute=i,this.dispatchEvent(new L(e.value.trim(),s,i))}#a(){this.dispatchEvent(new F)}#l=()=>{this.#t.querySelector("#user-flow-name")?.select()};#o(){const t=new Map([[a.Schema.SelectorType.ARIA,P(M.selectorTypeARIA)],[a.Schema.SelectorType.CSS,P(M.selectorTypeCSS)],[a.Schema.SelectorType.Text,P(M.selectorTypeText)],[a.Schema.SelectorType.XPath,P(M.selectorTypeXPath)],[a.Schema.SelectorType.Pierce,P(M.selectorTypePierce)]]);e.render(e.html`
        <div class="wrapper">
          <div class="header-wrapper">
            <h1>${P(M.createRecording)}</h1>
            <${i.Button.Button.litTagName}
              title=${P(M.cancelRecording)}
              jslog=${n.close().track({click:!0})}
              .data=${{variant:"icon",size:"SMALL",iconName:"cross"}}
              @click=${this.#a}
            ></${i.Button.Button.litTagName}>
          </div>
          <label class="row-label" for="user-flow-name">${P(M.recordingName)}</label>
          <input
            value=${this.#s}
            @focus=${this.#l}
            @keydown=${this.#n}
            jslog=${n.textField("user-flow-name").track({change:!0})}
            class="devtools-text-input"
            id="user-flow-name"
          />
          <label class="row-label" for="selector-attribute">
            <span>${P(M.selectorAttribute)}</span>
            <x-link
              class="link" href="https://g.co/devtools/recorder#selector"
              title=${P(M.learnMore)}
              jslog=${n.link("recorder-selector-help").track({click:!0})}>
              <${r.Icon.Icon.litTagName} name="help">
              </${r.Icon.Icon.litTagName}>
            </x-link>
          </label>
          <input
            value=${this.#r?.selectorAttribute}
            placeholder="data-testid"
            @keydown=${this.#n}
            jslog=${n.textField("selector-attribute").track({change:!0})}
            class="devtools-text-input"
            id="selector-attribute"
          />
          <label class="row-label">
            <span>${P(M.selectorTypes)}</span>
            <x-link
              class="link" href="https://g.co/devtools/recorder#selector"
              title=${P(M.learnMore)}
              jslog=${n.link("recorder-selector-help").track({click:!0})}>
              <${r.Icon.Icon.litTagName} name="help">
              </${r.Icon.Icon.litTagName}>
            </x-link>
          </label>
          <div class="checkbox-container">
            ${Object.values(a.Schema.SelectorType).map((s=>{const i=this.#r?.getSelectorByType(s);return e.html`
                  <label class="checkbox-label selector-type">
                    <input
                      @keydown=${this.#n}
                      .value=${s}
                      jslog=${n.toggle().track({click:!0}).context(`selector-${s}`)}
                      checked=${e.Directives.ifDefined(i||void 0)}
                      type="checkbox"
                    />
                    ${t.get(s)||s}
                  </label>
                `}))}
          </div>

          ${this.#i&&e.html`
          <div class="error" role="alert">
            ${this.#i.message}
          </div>
        `}
        </div>
        <div class="footer">
          <div class="controls">
            <devtools-control-button
              @click=${this.startRecording}
              .label=${P(M.startRecording)}
              .shape=${"circle"}
              jslog=${n.action("chrome-recorder.start-recording").track({click:!0})}
              title=${a.Tooltip.getTooltipForActions(P(M.startRecording),"chrome-recorder.start-recording")}
            ></devtools-control-button>
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-create-recording-view",O);var D=Object.freeze({__proto__:null,RecordingStartedEvent:L,RecordingCancelledEvent:F,CreateRecordingView:O});const z=new CSSStyleSheet;z.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}*:focus,\n*:focus-visible{outline:none}.wrapper{padding:24px}.header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}h1{font-size:16px;line-height:19px;color:var(--sys-color-on-surface);font-weight:normal}.icon,\n.icon devtools-icon{width:20px;height:20px;color:var(--sys-color-primary)}.table{margin-top:35px}.title{font-size:13px;color:var(--sys-color-on-surface);margin-left:10px;flex:1;overflow-x:hidden;white-space:nowrap;text-overflow:ellipsis}.row{display:flex;align-items:center;padding-right:5px;height:28px;border-bottom:1px solid var(--sys-color-divider)}.row:focus-within,\n.row:hover{background-color:var(--sys-color-state-hover-on-subtle)}.row:last-child{border-bottom:none}.actions{display:flex;align-items:center}.actions button{border:none;background-color:transparent;width:24px;height:24px;border-radius:50%}.actions .divider{width:1px;height:17px;background-color:var(--sys-color-divider);margin:0 6px}\n/*# sourceURL=recordingListView.css */\n");const V={savedRecordings:"Saved recordings",createRecording:"Create a new recording",playRecording:"Play recording",deleteRecording:"Delete recording",openRecording:"Open recording"},_=s.i18n.registerUIStrings("panels/recorder/components/RecordingListView.ts",V),U=s.i18n.getLocalizedString.bind(void 0,_);class K extends Event{static eventName="createrecording";constructor(){super(K.eventName)}}class q extends Event{storageName;static eventName="deleterecording";constructor(e){super(q.eventName),this.storageName=e}}class G extends Event{storageName;static eventName="openrecording";constructor(e){super(G.eventName),this.storageName=e}}class H extends Event{storageName;static eventName="playrecording";constructor(e){super(H.eventName),this.storageName=e}}class W extends HTMLElement{static litTagName=e.literal`devtools-recording-list-view`;#t=this.attachShadow({mode:"open"});#c={recordings:[],replayAllowed:!0};constructor(){super()}connectedCallback(){this.#t.adoptedStyleSheets=[z],l.ScheduledRender.scheduleRender(this,this.#o)}set recordings(e){this.#c.recordings=e,l.ScheduledRender.scheduleRender(this,this.#o)}set replayAllowed(e){this.#c.replayAllowed=e,l.ScheduledRender.scheduleRender(this,this.#o)}#d(){this.dispatchEvent(new K)}#p(e,t){t.stopPropagation(),this.dispatchEvent(new q(e))}#u(e,t){t.stopPropagation(),this.dispatchEvent(new G(e))}#h(e,t){t.stopPropagation(),this.dispatchEvent(new H(e))}#n(e,t){"Enter"===t.key&&this.#u(e,t)}#g(e){e.stopPropagation()}#o=()=>{e.render(e.html`
        <div class="wrapper">
          <div class="header">
            <h1>${U(V.savedRecordings)}</h1>
            <${i.Button.Button.litTagName}
              .variant=${"primary"}
              @click=${this.#d}
              title=${a.Tooltip.getTooltipForActions(U(V.createRecording),"chrome-recorder.create-recording")}
              .jslogContext=${"create-recording"}
            >
              ${U(V.createRecording)}
            </${i.Button.Button.litTagName}>
          </div>
          <div class="table">
            ${this.#c.recordings.map((t=>e.html`
                  <div
                    role="button"
                    tabindex="0"
                    aria-label=${U(V.openRecording)}
                    class="row"
                    @keydown=${this.#n.bind(this,t.storageName)}
                    @click=${this.#u.bind(this,t.storageName)}
                    jslog=${n.item().track({click:!0}).context("recording")}>
                    <div class="icon">
                      <${r.Icon.Icon.litTagName} name="flow">
                      </${r.Icon.Icon.litTagName}>
                    </div>
                    <div class="title">${t.name}</div>
                    <div class="actions">
                      ${this.#c.replayAllowed?e.html`
                              <${i.Button.Button.litTagName}
                                title=${U(V.playRecording)}
                                .data=${{variant:"icon",iconName:"play",jslogContext:"play-recording"}}
                                @click=${this.#h.bind(this,t.storageName)}
                                @keydown=${this.#g}
                              ></${i.Button.Button.litTagName}>
                              <div class="divider"></div>`:""}
                      <${i.Button.Button.litTagName}
                        class="delete-recording-button"
                        title=${U(V.deleteRecording)}
                        .data=${{variant:"icon",iconName:"bin",jslogContext:"delete-recording"}}
                        @click=${this.#p.bind(this,t.storageName)}
                        @keydown=${this.#g}
                      ></${i.Button.Button.litTagName}>
                    </div>
                  </div>
                `))}
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-recording-list-view",W);var X=Object.freeze({__proto__:null,CreateRecordingEvent:K,DeleteRecordingEvent:q,OpenRecordingEvent:G,PlayRecordingEvent:H,RecordingListView:W});const Y=new CSSStyleSheet;Y.replaceSync("*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.extension-view{display:flex;flex-direction:column;height:100%}main{flex:1}iframe{border:none;height:100%;width:100%}header{display:flex;padding:3px 8px;justify-content:space-between;border-bottom:1px solid var(--sys-color-divider)}header > div{align-self:center}.icon{display:block;width:16px;height:16px;color:var(--sys-color-secondary)}.title{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-secondary);align-items:center;font-weight:500}\n/*# sourceURL=extensionView.css */\n");const J={closeView:"Close",extension:"Content provided by a browser extension"},Q=s.i18n.registerUIStrings("panels/recorder/components/ExtensionView.ts",J),Z=s.i18n.getLocalizedString.bind(void 0,Q);class ee extends Event{static eventName="recorderextensionviewclosed";constructor(){super(ee.eventName,{bubbles:!0,composed:!0})}}class te extends HTMLElement{static litTagName=e.literal`devtools-recorder-extension-view`;#t=this.attachShadow({mode:"open"});#v;constructor(){super(),this.setAttribute("jslog",`${n.section("extension-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[Y],this.#o()}disconnectedCallback(){this.#v&&b.ExtensionManager.ExtensionManager.instance().getView(this.#v.id).hide()}set descriptor(e){this.#v=e,this.#o(),b.ExtensionManager.ExtensionManager.instance().getView(e.id).show()}#m(){this.dispatchEvent(new ee)}#o(){if(!this.#v)return;const t=b.ExtensionManager.ExtensionManager.instance().getView(this.#v.id).frame();e.render(e.html`
        <div class="extension-view">
          <header>
            <div class="title">
              <${r.Icon.Icon.litTagName}
                class="icon"
                title=${Z(J.extension)}
                name="extension">
              </${r.Icon.Icon.litTagName}>
              ${this.#v.title}
            </div>
            <${i.Button.Button.litTagName}
              title=${Z(J.closeView)}
              jslog=${n.close().track({click:!0})}
              .data=${{variant:"icon",size:"SMALL",iconName:"cross"}}
              @click=${this.#m}
            ></${i.Button.Button.litTagName}>
          </header>
          <main>
            ${t}
          <main>
      </div>
    `,this.#t,{host:this})}}customElements.define("devtools-recorder-extension-view",te);const se=new CSSStyleSheet;se.replaceSync('*{padding:0;margin:0;box-sizing:border-box;font-size:inherit}.wrapper{display:flex;flex-direction:row;flex:1;height:100%}.main{overflow:hidden;display:flex;flex-direction:column;flex:1}.sections{flex:1;min-height:0;overflow:hidden auto;background-color:var(--sys-color-cdt-base-container);z-index:0;position:relative;container:sections/inline-size}.section{display:flex;padding:0 16px;gap:8px;position:relative}.section::after{content:"";border-bottom:1px solid var(--sys-color-divider);position:absolute;left:0;right:0;bottom:0;z-index:-1}.section:last-child{margin-bottom:70px}.section:last-child::after{content:none}.screenshot-wrapper{flex:0 0 80px;padding-top:32px;z-index:2}@container sections (max-width: 400px){.screenshot-wrapper{display:none}}.screenshot{object-fit:cover;object-position:top center;max-width:100%;width:200px;height:auto;border:1px solid var(--sys-color-divider);border-radius:1px}.content{flex:1;min-width:0}.steps{flex:1;position:relative;align-self:flex-start;overflow:visible}.step{position:relative;padding-left:40px;margin:16px 0}.step .action{font-size:13px;line-height:16px;letter-spacing:0.03em}.recording{color:var(--sys-color-primary);font-style:italic;margin-top:8px;margin-bottom:0}.add-assertion-button{margin-top:8px}.details{max-width:240px;display:flex;flex-direction:column;align-items:flex-end}.url{font-size:12px;line-height:16px;letter-spacing:0.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--sys-color-secondary);max-width:100%;margin-bottom:16px}.header{align-items:center;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:16px}.header-title-wrapper{max-width:100%}.header-title{align-items:center;display:flex;flex:1;max-width:100%}.header-title::before{content:"";min-width:12px;height:12px;display:inline-block;background:var(--sys-color-primary);border-radius:50%;margin-right:7px}#title-input{box-sizing:content-box;font-family:inherit;font-size:18px;line-height:22px;letter-spacing:0.02em;padding:1px 4px;border:1px solid transparent;border-radius:1px;word-break:break-all}#title-input:hover{border-color:var(--input-outline)}#title-input.has-error{border-color:var(--sys-color-error)}#title-input.disabled{color:var(--sys-color-state-disabled)}.title-input-error-text{margin-top:4px;margin-left:19px;color:var(--sys-color-error)}.title-button-bar{padding-left:2px;display:flex}#title-input:focus + .title-button-bar{display:none}.settings-row{padding:16px 28px;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-flow:row wrap;justify-content:space-between}.settings-title{font-size:14px;line-height:24px;letter-spacing:0.03em;color:var(--sys-color-on-surface);display:flex;align-items:center;align-content:center;gap:5px;width:fit-content}.settings{margin-top:4px;display:flex;font-size:12px;line-height:20px;letter-spacing:0.03em;color:var(--sys-color-on-surface-subtle)}.settings.expanded{gap:10px}.settings .separator{width:1px;height:20px;background-color:var(--sys-color-divider);margin:0 5px}.actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px}.actions .separator{width:1px;height:24px;background-color:var(--sys-color-divider)}.is-recording .header-title::before{background:var(--sys-color-error-bright)}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container);z-index:1}.controls{align-items:center;display:flex;justify-content:center;position:relative;width:100%}.chevron{width:14px;height:14px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0)}.editable-setting{display:flex;flex-direction:row;gap:12px;align-items:center}.editable-setting devtools-select-menu{height:32px}.editable-setting .devtools-text-input{width:fit-content}.wrapping-label{display:inline-flex;align-items:center;gap:12px}.text-editor{height:100%;overflow:auto}.section-toolbar{display:flex;align-items:center;padding:3px 5px;justify-content:space-between;gap:3px}.section-toolbar > devtools-select-menu{height:24px;min-width:50px}.sections .section-toolbar{justify-content:flex-end}devtools-split-view{flex:1 1 0%;min-height:0}[slot="sidebar"]{display:flex;flex-direction:column;overflow:auto;height:100%;width:100%}[slot="sidebar"] .section-toolbar{border-bottom:1px solid var(--sys-color-divider)}.show-code{margin-right:14px;margin-top:8px}devtools-recorder-extension-view{flex:1}\n/*# sourceURL=recordingView.css */\n');const ie=new CSSStyleSheet;ie.replaceSync(".select-button{display:flex;gap:12px}.select-button devtools-button{position:relative}.select-menu-item-content-with-icon{display:flex;align-items:center}\n/*# sourceURL=selectButton.css */\n");class re extends Event{value;static eventName="selectbuttonclick";constructor(e){super(re.eventName,{bubbles:!0,composed:!0}),this.value=e}}class oe extends Event{value;static eventName="selectmenuselected";constructor(e){super(oe.eventName,{bubbles:!0,composed:!0}),this.value=e}}class ne extends HTMLElement{static litTagName=e.literal`devtools-select-button`;#t=this.attachShadow({mode:"open"});#c={disabled:!1,value:"",items:[],buttonLabel:"",groups:[],variant:"primary"};connectedCallback(){this.#t.adoptedStyleSheets=[ie],l.ScheduledRender.scheduleRender(this,this.#o)}get disabled(){return this.#c.disabled}set disabled(e){this.#c.disabled=e,l.ScheduledRender.scheduleRender(this,this.#o)}get items(){return this.#c.items}set items(e){this.#c.items=e,l.ScheduledRender.scheduleRender(this,this.#o)}set buttonLabel(e){this.#c.buttonLabel=e}set groups(e){this.#c.groups=e,l.ScheduledRender.scheduleRender(this,this.#o)}get value(){return this.#c.value}set value(e){this.#c.value=e,l.ScheduledRender.scheduleRender(this,this.#o)}get variant(){return this.#c.variant}set variant(e){this.#c.variant=e,l.ScheduledRender.scheduleRender(this,this.#o)}set action(e){this.#c.action=e,l.ScheduledRender.scheduleRender(this,this.#o)}#b(e){e.stopPropagation(),this.dispatchEvent(new re(this.#c.value))}#f(e){this.dispatchEvent(new oe(e.itemValue)),l.ScheduledRender.scheduleRender(this,this.#o)}#w(t,s){return e.html`
      <${g.Menu.MenuItem.litTagName} .value=${t.value} .selected=${t.value===s.value} jslog=${n.item(d.StringUtilities.toKebabCase(t.value)).track({click:!0})}>
        ${t.label()}
      </${g.Menu.MenuItem.litTagName}>
    `}#y(t,s){return e.html`
      <${g.Menu.MenuGroup.litTagName} .name=${t.name}>
        ${t.items.map((e=>this.#w(e,s)))}
      </${g.Menu.MenuGroup.litTagName}>
    `}#S(e){return this.#c.action?a.Tooltip.getTooltipForActions(e,this.#c.action):""}#o=()=>{const t=Boolean(this.#c.groups.length),s=t?this.#c.groups.flatMap((e=>e.items)):this.#c.items,r=s.find((e=>e.value===this.#c.value))||s[0];if(!r)return;const o={primary:"primary"===this.#c.variant,secondary:"outlined"===this.#c.variant},n="outlined"===this.#c.variant?"outlined":"primary",a=r.buttonLabel?r.buttonLabel():r.label();e.render(e.html`
      <div class="select-button" title=${this.#S(a)||e.nothing}>
      <${g.SelectMenu.SelectMenu.litTagName}
          class=${e.Directives.classMap(o)}
          @selectmenuselected=${this.#f}
          ?disabled=${this.#c.disabled}
          .showArrow=${!0}
          .sideButton=${!1}
          .showSelectedItem=${!0}
          .disabled=${this.#c.disabled}
          .buttonTitle=${e.html`${a}`}
          .position=${"bottom"}
          .horizontalAlignment=${"right"}
        >
          ${t?this.#c.groups.map((e=>this.#y(e,r))):this.#c.items.map((e=>this.#w(e,r)))}
        </${g.SelectMenu.SelectMenu.litTagName}>
        ${r?e.html`
        <${i.Button.Button.litTagName}
            .disabled=${this.#c.disabled}
            .variant=${n}
            .iconName=${r.buttonIconName}
            @click=${this.#b}>
            ${this.#c.buttonLabel}
        </${i.Button.Button.litTagName}>`:""}
      </div>`,this.#t,{host:this})}}customElements.define("devtools-select-button",ne);var ae=Object.freeze({__proto__:null,SelectButtonClickEvent:re,SelectMenuSelectedEvent:oe,SelectButton:ne});const le={Replay:"Replay",ReplayNormalButtonLabel:"Normal speed",ReplayNormalItemLabel:"Normal (Default)",ReplaySlowButtonLabel:"Slow speed",ReplaySlowItemLabel:"Slow",ReplayVerySlowButtonLabel:"Very slow speed",ReplayVerySlowItemLabel:"Very slow",ReplayExtremelySlowButtonLabel:"Extremely slow speed",ReplayExtremelySlowItemLabel:"Extremely slow",speedGroup:"Speed",extensionGroup:"Extensions"},ce=[{value:"normal",buttonIconName:"play",buttonLabel:()=>ue(le.ReplayNormalButtonLabel),label:()=>ue(le.ReplayNormalItemLabel)},{value:"slow",buttonIconName:"play",buttonLabel:()=>ue(le.ReplaySlowButtonLabel),label:()=>ue(le.ReplaySlowItemLabel)},{value:"very_slow",buttonIconName:"play",buttonLabel:()=>ue(le.ReplayVerySlowButtonLabel),label:()=>ue(le.ReplayVerySlowItemLabel)},{value:"extremely_slow",buttonIconName:"play",buttonLabel:()=>ue(le.ReplayExtremelySlowButtonLabel),label:()=>ue(le.ReplayExtremelySlowItemLabel)}],de={normal:1,slow:2,very_slow:3,extremely_slow:4},pe=s.i18n.registerUIStrings("panels/recorder/components/ReplaySection.ts",le),ue=s.i18n.getLocalizedString.bind(void 0,pe);class he extends Event{speed;extension;static eventName="startreplay";constructor(e,t){super(he.eventName,{bubbles:!0,composed:!0}),this.speed=e,this.extension=t}}const ge="extension";class ve extends HTMLElement{static litTagName=e.literal`devtools-replay-section`;#t=this.attachShadow({mode:"open"});#x=this.#o.bind(this);#c={disabled:!1};#$;#k=[];set data(e){this.#$=e.settings,this.#k=e.replayExtensions}get disabled(){return this.#c.disabled}set disabled(e){this.#c.disabled=e,l.ScheduledRender.scheduleRender(this,this.#x)}connectedCallback(){l.ScheduledRender.scheduleRender(this,this.#x)}#T(e){const t=e.value;this.#$&&e.value&&(this.#$.speed=t,this.#$.replayExtension=""),c.userMetrics.recordingReplaySpeed(de[t]),l.ScheduledRender.scheduleRender(this,this.#x)}#E(e){if(e.stopPropagation(),e.value&&e.value.startsWith(ge)){this.#$&&(this.#$.replayExtension=e.value);const t=Number(e.value.substring(9));return this.dispatchEvent(new he("normal",this.#k[t])),void l.ScheduledRender.scheduleRender(this,this.#x)}this.dispatchEvent(new he(this.#$?this.#$.speed:"normal")),l.ScheduledRender.scheduleRender(this,this.#x)}#o(){const t=[{name:ue(le.speedGroup),items:ce}];this.#k.length&&t.push({name:ue(le.extensionGroup),items:this.#k.map(((e,t)=>({value:ge+t,buttonIconName:"play",buttonLabel:()=>e.getName(),label:()=>e.getName()})))}),e.render(e.html`
    <${ne.litTagName}
      @selectmenuselected=${this.#T}
      @selectbuttonclick=${this.#E}
      .variant=${"primary"}
      .showItemDivider=${!1}
      .disabled=${this.#c.disabled}
      .action=${"chrome-recorder.replay-recording"}
      .value=${this.#$?.replayExtension||this.#$?.speed}
      .buttonLabel=${ue(le.Replay)}
      .groups=${t}
      jslog=${n.action("chrome-recorder.replay-recording").track({click:!0})}>
    </${ne.litTagName}>`,this.#t,{host:this})}}customElements.define("devtools-replay-section",ve);var me=Object.freeze({__proto__:null,StartReplayEvent:he,ReplaySection:ve});const be=new CSSStyleSheet;be.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.title-container{max-width:calc(100% - 18px);font-size:13px;line-height:16px;letter-spacing:0.03em;display:flex;flex-direction:row;gap:3px;outline-offset:3px}.action{display:flex;align-items:flex-start}.title{flex:1;min-width:0}.is-start-of-group .title{font-weight:bold}.error-icon{display:none}.breakpoint-icon{visibility:hidden;cursor:pointer;opacity:0%;fill:var(--sys-color-primary);stroke:#1a73e8;transform:translate(-1.92px,-3px)}.circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-cdt-base-container);stroke-width:4px;r:5px;cx:8px;cy:8px}.is-start-of-group .circle-icon{r:7px;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.step.is-success .circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-primary)}.step.is-current .circle-icon{stroke-dasharray:24 10;animation:rotate 1s linear infinite;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error);position:relative}@keyframes rotate{0%{transform:translate(8px,8px) rotate(0) translate(-8px,-8px)}100%{transform:translate(8px,8px) rotate(360deg) translate(-8px,-8px)}}.step.is-error .circle-icon{fill:var(--sys-color-error);stroke:var(--sys-color-error)}.step.is-error .error-icon{display:block;transform:translate(4px,4px)}:host-context(.was-successful) .circle-icon{animation:flash-circle 2s}:host-context(.was-successful) .breakpoint-icon{animation:flash-breakpoint-icon 2s}@keyframes flash-circle{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}@keyframes flash-breakpoint-icon{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}.chevron{width:14px;height:14px;transition:200ms;position:absolute;top:18px;left:24px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0deg)}.is-start-of-group .chevron{top:34px}.details{display:none;margin-top:8px;position:relative}.expanded .details{display:block}.step-details{overflow:auto}devtools-recorder-step-editor{border:1px solid var(--sys-color-neutral-outline);padding:3px 6px 6px;margin-left:-6px;border-radius:3px}devtools-recorder-step-editor:hover{border:1px solid var(--sys-color-neutral-outline)}devtools-recorder-step-editor.is-selected{background-color:color-mix(in sRGB,var(--sys-color-tonal-container),var(--sys-color-cdt-base-container) 50%);border:1px solid var(--sys-color-tonal-outline)}.summary{display:flex;flex-flow:row nowrap}.filler{flex-grow:1}.subtitle{font-weight:normal;color:var(--sys-color-on-surface-subtle);word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.main-title{word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.step-actions{border:none;border-radius:0;height:24px;--override-select-menu-show-button-border-radius:0;--override-select-menu-show-button-outline:none;--override-select-menu-show-button-padding:0}.step.has-breakpoint .circle-icon{visibility:hidden}.step:not(.is-start-of-group).has-breakpoint .breakpoint-icon{visibility:visible;opacity:100%}.step:not(.is-start-of-group):not(.has-breakpoint) .icon:hover .circle-icon{transition:opacity 0.2s;opacity:0%}.step:not(.is-start-of-group):not(.has-breakpoint) .icon:hover .error-icon{visibility:hidden}.step:not(.is-start-of-group):not(.has-breakpoint) .icon:hover .breakpoint-icon{transition:opacity 0.2s;visibility:visible;opacity:50%}\n/*# sourceURL=stepView.css */\n");const fe=new CSSStyleSheet;fe.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.timeline-section{position:relative;padding:16px 0 16px 40px;margin-left:8px;--override-color-recording-successful-text:#36a854;--override-color-recording-successful-background:#e6f4ea}.overlay{position:absolute;width:100vw;height:100%;left:calc(-32px - 80px);top:0;z-index:-1;pointer-events:none}@container (max-width: 400px){.overlay{left:-32px}}:hover .overlay{background:var(--sys-color-state-hover-on-subtle)}.is-selected .overlay{background:var(--sys-color-tonal-container)}:host-context(.is-stopped) .overlay{background:var(--sys-color-state-ripple-primary);outline:1px solid var(--sys-color-state-focus-ring);z-index:4}.is-start-of-group{padding-top:28px}.is-end-of-group{padding-bottom:24px}.icon{position:absolute;left:4px;transform:translateX(-50%);z-index:2}.bar{position:absolute;left:4px;display:block;transform:translateX(-50%);top:18px;height:calc(100% + 8px);z-index:1}.bar .background{fill:var(--sys-color-state-hover-on-subtle)}.bar .line{fill:var(--sys-color-primary)}.is-first-section .bar{top:32px;height:calc(100% - 8px);display:none}.is-first-section:not(.is-last-section) .bar{display:block}.is-last-section .bar .line{display:none}.is-last-section .bar .background{display:none}:host-context(.is-error) .bar .line{fill:var(--sys-color-error)}:host-context(.is-error) .bar .background{fill:var(--sys-color-error-container)}:host-context(.was-successful) .bar .background{animation:flash-background 2s}:host-context(.was-successful) .bar .line{animation:flash-line 2s}@keyframes flash-background{25%{fill:var(--override-color-recording-successful-background)}75%{fill:var(--override-color-recording-successful-background)}}@keyframes flash-line{25%{fill:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text)}}\n/*# sourceURL=timelineSection.css */\n");class we extends HTMLElement{static litTagName=e.literal`devtools-timeline-section`;#R=!1;#C=!1;#I=!1;#N=!1;#B=!1;constructor(){super();this.attachShadow({mode:"open"}).adoptedStyleSheets=[fe]}set data(e){this.#I=e.isFirstSection,this.#N=e.isLastSection,this.#R=e.isEndOfGroup,this.#C=e.isStartOfGroup,this.#B=e.isSelected,this.#o()}connectedCallback(){this.#o()}#o(){const t={"timeline-section":!0,"is-end-of-group":this.#R,"is-start-of-group":this.#C,"is-first-section":this.#I,"is-last-section":this.#N,"is-selected":this.#B};e.render(e.html`
      <div class=${e.Directives.classMap(t)}>
        <div class="overlay"></div>
        <div class="icon"><slot name="icon"></slot></div>
        <svg width="24" height="100%" class="bar">
          <rect class="line" x="7" y="0" width="2" height="100%" />
        </svg>
        <slot></slot>
      </div>
    `,this.shadowRoot,{host:this})}}customElements.define("devtools-timeline-section",we);var ye=Object.freeze({__proto__:null,TimelineSection:we});const Se={setViewportClickTitle:"Set viewport",customStepTitle:"Custom step",clickStepTitle:"Click",doubleClickStepTitle:"Double click",hoverStepTitle:"Hover",emulateNetworkConditionsStepTitle:"Emulate network conditions",changeStepTitle:"Change",closeStepTitle:"Close",scrollStepTitle:"Scroll",keyUpStepTitle:"Key up",navigateStepTitle:"Navigate",keyDownStepTitle:"Key down",waitForElementStepTitle:"Wait for element",waitForExpressionStepTitle:"Wait for expression",elementRoleButton:"Button",elementRoleInput:"Input",elementRoleFallback:"Element",addStepBefore:"Add step before",addStepAfter:"Add step after",removeStep:"Remove step",openStepActions:"Open step actions",addBreakpoint:"Add breakpoint",removeBreakpoint:"Remove breakpoint",copyAs:"Copy as",stepManagement:"Manage steps",breakpoints:"Breakpoints"},xe=s.i18n.registerUIStrings("panels/recorder/components/StepView.ts",Se),$e=s.i18n.getLocalizedString.bind(void 0,xe);class ke extends Event{static eventName="captureselectors";data;constructor(e){super(ke.eventName,{bubbles:!0,composed:!0}),this.data=e}}class Te extends Event{static eventName="stopselectorscapture";constructor(){super(Te.eventName,{bubbles:!0,composed:!0})}}class Ee extends Event{static eventName="copystep";step;constructor(e){super(Ee.eventName,{bubbles:!0,composed:!0}),this.step=e}}class Re extends Event{static eventName="stepchanged";currentStep;newStep;constructor(e,t){super(Re.eventName,{bubbles:!0,composed:!0}),this.currentStep=e,this.newStep=t}}class Ce extends Event{static eventName="addstep";position;stepOrSection;constructor(e,t){super(Ce.eventName,{bubbles:!0,composed:!0}),this.stepOrSection=e,this.position=t}}class Ie extends Event{static eventName="removestep";step;constructor(e){super(Ie.eventName,{bubbles:!0,composed:!0}),this.step=e}}class Ne extends Event{static eventName="addbreakpoint";index;constructor(e){super(Ne.eventName,{bubbles:!0,composed:!0}),this.index=e}}class Be extends Event{static eventName="removebreakpoint";index;constructor(e){super(Be.eventName,{bubbles:!0,composed:!0}),this.index=e}}const je="copy-step-as-";function Me(e){if(!e||!("selectors"in e))return"";const t=e.selectors.flat().find((e=>e.startsWith("aria/")));if(!t)return"";const s=t.match(/^aria\/(.+?)(\[role="(.+)"\])?$/);return s?`${function(e){switch(e){case"button":return $e(Se.elementRoleButton);case"input":return $e(Se.elementRoleInput);default:return $e(Se.elementRoleFallback)}}(s[3])} "${s[1]}"`:""}function Ae(t,s,o){if(!t.step&&!t.section)return;const l={step:!0,expanded:t.showDetails,"is-success":"success"===t.state,"is-current":"current"===t.state,"is-outstanding":"outstanding"===t.state,"is-error":"error"===t.state,"is-stopped":"stopped"===t.state,"is-start-of-group":t.isStartOfGroup,"is-first-section":t.isFirstSection,"has-breakpoint":t.hasBreakpoint},c=Boolean(t.step),d=function(t){if(t.section)return t.section.title?t.section.title:e.html`<span class="fallback">(No Title)</span>`;if(!t.step)throw new Error("Missing both step and section");switch(t.step.type){case a.Schema.StepType.CustomStep:return $e(Se.customStepTitle);case a.Schema.StepType.SetViewport:return $e(Se.setViewportClickTitle);case a.Schema.StepType.Click:return $e(Se.clickStepTitle);case a.Schema.StepType.DoubleClick:return $e(Se.doubleClickStepTitle);case a.Schema.StepType.Hover:return $e(Se.hoverStepTitle);case a.Schema.StepType.EmulateNetworkConditions:return $e(Se.emulateNetworkConditionsStepTitle);case a.Schema.StepType.Change:return $e(Se.changeStepTitle);case a.Schema.StepType.Close:return $e(Se.closeStepTitle);case a.Schema.StepType.Scroll:return $e(Se.scrollStepTitle);case a.Schema.StepType.KeyUp:return $e(Se.keyUpStepTitle);case a.Schema.StepType.KeyDown:return $e(Se.keyDownStepTitle);case a.Schema.StepType.WaitForElement:return $e(Se.waitForElementStepTitle);case a.Schema.StepType.WaitForExpression:return $e(Se.waitForExpressionStepTitle);case a.Schema.StepType.Navigate:return $e(Se.navigateStepTitle)}}({step:t.step,section:t.section}),p=t.step?Me():u?u.url:"";var u;e.render(e.html`
    <${we.litTagName} .data=${{isFirstSection:t.isFirstSection,isLastSection:t.isLastSection,isStartOfGroup:t.isStartOfGroup,isEndOfGroup:t.isEndOfGroup,isSelected:t.isSelected}} @contextmenu=${t.onStepContextMenu} data-step-index=${t.stepIndex} data-section-index=${t.sectionIndex} class=${e.Directives.classMap(l)}>
      <svg slot="icon" width="24" height="24" height="100%" class="icon">
        <circle class="circle-icon"/>
        <g class="error-icon">
          <path d="M1.5 1.5L6.5 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1.5 6.5L6.5 1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <path @click=${t.onBreakpointClick} jslog=${n.action("breakpoint").track({click:!0})} class="breakpoint-icon" d="M2.5 5.5H17.7098L21.4241 12L17.7098 18.5H2.5V5.5Z"/>
      </svg>
      <div class="summary">
        <div class="title-container ${c?"action":""}"
          @click=${c&&t.toggleShowDetails}
          @keydown=${c&&t.onToggleShowDetailsKeydown}
          tabindex="0"
          jslog=${n.sectionHeader().track({click:!0})}
          aria-role=${c?"button":""}
          aria-label=${c?"Show details for step":""}
        >
          ${c?e.html`<${r.Icon.Icon.litTagName}
                  class="chevron"
                  jslog=${n.expand().track({click:!0})}
                  name="triangle-down">
                </${r.Icon.Icon.litTagName}>`:""}
          <div class="title">
            <div class="main-title" title=${d}>${d}</div>
            <div class="subtitle" title=${p}>${p}</div>
          </div>
        </div>
        <div class="filler"></div>
        ${function(t){return e.html`
    <${i.Button.Button.litTagName}
      class="step-actions"
      title=${$e(Se.openStepActions)}
      aria-label=${$e(Se.openStepActions)}
      @click=${t.onStepContextMenu}
      @keydown=${e=>{e.stopPropagation()}}
      jslog=${n.dropDown("step-actions").track({click:!0})}
      .data=${{variant:"icon",iconName:"dots-vertical",title:$e(Se.openStepActions)}}
    ></${i.Button.Button.litTagName}>
  `}(t)}
      </div>
      <div class="details">
        ${t.step&&e.html`<devtools-recorder-step-editor
          class=${t.isSelected?"is-selected":""}
          .step=${t.step}
          .disabled=${t.isPlaying}
          @stepedited=${t.stepEdited}>
        </devtools-recorder-step-editor>`}
        ${t.section?.causingStep&&e.html`<devtools-recorder-step-editor
          .step=${t.section.causingStep}
          .isTypeEditable=${!1}
          .disabled=${t.isPlaying}
          @stepedited=${t.stepEdited}>
        </devtools-recorder-step-editor>`}
      </div>
      ${t.error&&e.html`
        <div class="error" role="alert">
          ${t.error.message}
        </div>
      `}
    </${we.litTagName}>
  `,o)}class Pe extends HTMLElement{static litTagName=e.literal`devtools-step-view`;#t=this.attachShadow({mode:"open"});#j=new IntersectionObserver((e=>{this.#M.isVisible=e[0].isIntersecting}));#M={state:"default",showDetails:!1,isEndOfGroup:!1,isStartOfGroup:!1,stepIndex:0,sectionIndex:0,isFirstSection:!1,isLastSection:!1,isRecording:!1,isPlaying:!1,isVisible:!1,hasBreakpoint:!1,removable:!0,builtInConverters:[],extensionConverters:[],isSelected:!1,recorderSettings:void 0,actions:[],stepEdited:this.#A.bind(this),onBreakpointClick:this.#P.bind(this),handleStepAction:this.#L.bind(this),toggleShowDetails:this.#F.bind(this),onToggleShowDetailsKeydown:this.#O.bind(this),onStepContextMenu:this.#D.bind(this)};#z=Ae;constructor(e){super(),e&&(this.#z=e),this.setAttribute("jslog",`${n.section("step-view")}`)}set data(e){const t=this.#M.state;this.#M.step=e.step,this.#M.section=e.section,this.#M.state=e.state,this.#M.error=e.error,this.#M.isEndOfGroup=e.isEndOfGroup,this.#M.isStartOfGroup=e.isStartOfGroup,this.#M.stepIndex=e.stepIndex,this.#M.sectionIndex=e.sectionIndex,this.#M.isFirstSection=e.isFirstSection,this.#M.isLastSection=e.isLastSection,this.#M.isRecording=e.isRecording,this.#M.isPlaying=e.isPlaying,this.#M.hasBreakpoint=e.hasBreakpoint,this.#M.removable=e.removable,this.#M.builtInConverters=e.builtInConverters,this.#M.extensionConverters=e.extensionConverters,this.#M.isSelected=e.isSelected,this.#M.recorderSettings=e.recorderSettings,this.#M.actions=this.#V(),this.#o(),this.#M.state===t||"current"!==this.#M.state||this.#M.isVisible||this.scrollIntoView()}get step(){return this.#M.step}get section(){return this.#M.section}connectedCallback(){this.#t.adoptedStyleSheets=[be],this.#j.observe(this),this.#o()}disconnectedCallback(){this.#j.unobserve(this)}#F(){this.#M.showDetails=!this.#M.showDetails,this.#o()}#O(e){const t=e;"Enter"!==t.key&&" "!==t.key||(this.#F(),e.stopPropagation(),e.preventDefault())}#A(e){const t=this.#M.step||this.#M.section?.causingStep;if(!t)throw new Error("Expected step.");this.dispatchEvent(new Re(t,e.data))}#L(e){switch(e.itemValue){case"add-step-before":{const e=this.#M.step||this.#M.section;if(!e)throw new Error("Expected step or section.");this.dispatchEvent(new Ce(e,"before"));break}case"add-step-after":{const e=this.#M.step||this.#M.section;if(!e)throw new Error("Expected step or section.");this.dispatchEvent(new Ce(e,"after"));break}case"remove-step":{const e=this.#M.section?.causingStep;if(!this.#M.step&&!e)throw new Error("Expected step.");this.dispatchEvent(new Ie(this.#M.step||e));break}case"add-breakpoint":if(!this.#M.step)throw new Error("Expected step");this.dispatchEvent(new Ne(this.#M.stepIndex));break;case"remove-breakpoint":if(!this.#M.step)throw new Error("Expected step");this.dispatchEvent(new Be(this.#M.stepIndex));break;default:{const t=e.itemValue;if(!t.startsWith(je))throw new Error("Unknown step action.");const s=this.#M.step||this.#M.section?.causingStep;if(!s)throw new Error("Step not found.");const i=t.substring(13);this.#M.recorderSettings&&(this.#M.recorderSettings.preferredCopyFormat=i),this.dispatchEvent(new Ee(structuredClone(s)))}}}#P(){this.#M.hasBreakpoint?this.dispatchEvent(new Be(this.#M.stepIndex)):this.dispatchEvent(new Ne(this.#M.stepIndex)),this.#o()}#V=()=>{const e=[];if(this.#M.isPlaying||(this.#M.step&&e.push({id:"add-step-before",label:$e(Se.addStepBefore),group:"stepManagement",groupTitle:$e(Se.stepManagement)}),e.push({id:"add-step-after",label:$e(Se.addStepAfter),group:"stepManagement",groupTitle:$e(Se.stepManagement)}),this.#M.removable&&e.push({id:"remove-step",group:"stepManagement",groupTitle:$e(Se.stepManagement),label:$e(Se.removeStep)})),this.#M.step&&!this.#M.isRecording&&(this.#M.hasBreakpoint?e.push({id:"remove-breakpoint",label:$e(Se.removeBreakpoint),group:"breakPointManagement",groupTitle:$e(Se.breakpoints)}):e.push({id:"add-breakpoint",label:$e(Se.addBreakpoint),group:"breakPointManagement",groupTitle:$e(Se.breakpoints)})),this.#M.step){for(const t of this.#M.builtInConverters||[])e.push({id:je+d.StringUtilities.toKebabCase(t.getId()),label:t.getFormatName(),group:"copy",groupTitle:$e(Se.copyAs)});for(const t of this.#M.extensionConverters||[])e.push({id:je+d.StringUtilities.toKebabCase(t.getId()),label:t.getFormatName(),group:"copy",groupTitle:$e(Se.copyAs),jslogContext:je+"extension"})}return e};#D(e){const s=e.target instanceof i.Button.Button?e.target:void 0,r=new t.ContextMenu.ContextMenu(e,{x:s?.getBoundingClientRect().left,y:s?.getBoundingClientRect().bottom}),o=this.#V(),n=o.filter((e=>e.id.startsWith(je))),a=o.filter((e=>!e.id.startsWith(je)));for(const e of a){r.section(e.group).appendItem(e.label,(()=>{this.#L(new g.Menu.MenuItemSelectedEvent(e.id))}),{jslogContext:e.id})}const l=n.find((e=>e.id===je+this.#M.recorderSettings?.preferredCopyFormat));if(l&&r.section("copy").appendItem(l.label,(()=>{this.#L(new g.Menu.MenuItemSelectedEvent(l.id))}),{jslogContext:l.id}),n.length){const e=r.section("copy").appendSubMenuItem($e(Se.copyAs),!1,"copy");for(const t of n)t!==l&&e.section(t.group).appendItem(t.label,(()=>{this.#L(new g.Menu.MenuItemSelectedEvent(t.id))}),{jslogContext:t.id})}r.show()}#o(){this.#z(this.#M,{},this.#t)}}customElements.define("devtools-step-view",Pe);var Le=Object.freeze({__proto__:null,CaptureSelectorsEvent:ke,StopSelectorsCaptureEvent:Te,CopyStepEvent:Ee,StepChanged:Re,AddStep:Ce,RemoveStep:Ie,AddBreakpointEvent:Ne,RemoveBreakpointEvent:Be,StepView:Pe});const Fe={mobile:"Mobile",desktop:"Desktop",latency:"Latency: {value} ms",upload:"Upload: {value}",download:"Download: {value}",editReplaySettings:"Edit replay settings",replaySettings:"Replay settings",default:"Default",environment:"Environment",screenshotForSection:"Screenshot for this section",editTitle:"Edit title",requiredTitleError:"Title is required",recording:"Recording…",endRecording:"End recording",recordingIsBeingStopped:"Stopping recording…",timeout:"Timeout: {value} ms",network:"Network",timeoutLabel:"Timeout",timeoutExplanation:"The timeout setting (in milliseconds) applies to every action when replaying the recording. For example, if a DOM element identified by a CSS selector does not appear on the page within the specified timeout, the replay fails with an error.",cancelReplay:"Cancel replay",showCode:"Show code",hideCode:"Hide code",addAssertion:"Add assertion",performancePanel:"Performance panel"},Oe=s.i18n.registerUIStrings("panels/recorder/components/RecordingView.ts",Fe),De=s.i18n.getLocalizedString.bind(void 0,Oe);class ze extends Event{static eventName="recordingfinished";constructor(){super(ze.eventName)}}class Ve extends Event{static eventName="playrecording";data;constructor(e={targetPanel:"chrome-recorder",speed:"normal"}){super(Ve.eventName),this.data=e}}class _e extends Event{static eventName="abortreplay";constructor(){super(_e.eventName)}}class Ue extends Event{static eventName="recordingchanged";data;constructor(e,t){super(Ue.eventName),this.data={currentStep:e,newStep:t}}}class Ke extends Event{static eventName="addassertion";constructor(){super(Ke.eventName)}}class qe extends Event{static eventName="recordingtitlechanged";title;constructor(e){super(qe.eventName,{}),this.title=e}}class Ge extends Event{static eventName="networkconditionschanged";data;constructor(e){super(Ge.eventName,{composed:!0,bubbles:!0}),this.data=e}}class He extends Event{static eventName="timeoutchanged";data;constructor(e){super(He.eventName,{composed:!0,bubbles:!0}),this.data=e}}const We=[p.NetworkManager.NoThrottlingConditions,p.NetworkManager.OfflineConditions,p.NetworkManager.Slow3GConditions,p.NetworkManager.Slow4GConditions,p.NetworkManager.Fast4GConditions];class Xe extends HTMLElement{static litTagName=e.literal`devtools-recording-view`;#t=this.attachShadow({mode:"open"});#_={isPlaying:!1,isPausedOnBreakpoint:!1};#U=null;#K=!1;#q=!1;#G=!1;#H;#W=[];#X;#Y=[];#$;#r;#J;#Q=new Set;#Z;#ee=!1;#te=!0;#se=[];#ie=[];#k;#re=!1;#oe="";#ne="";#ae;#le;#ce;#de=this.#pe.bind(this);constructor(){super()}set data(e){this.#K=e.isRecording,this.#_=e.replayState,this.#q=e.recordingTogglingInProgress,this.#H=e.currentStep,this.#U=e.recording,this.#W=this.#U.steps,this.#Y=e.sections,this.#$=e.settings,this.#r=e.recorderSettings,this.#X=e.currentError,this.#J=e.lastReplayResult,this.#te=e.replayAllowed,this.#G=!1,this.#Q=e.breakpointIndexes,this.#se=e.builtInConverters,this.#ie=e.extensionConverters,this.#k=e.replayExtensions,this.#ce=e.extensionDescriptor,this.#ne=this.#r?.preferredCopyFormat??e.builtInConverters[0]?.getId(),this.#ue(),this.#o()}connectedCallback(){this.#t.adoptedStyleSheets=[se,o.textInputStyles],document.addEventListener("copy",this.#de),this.#o()}disconnectedCallback(){document.removeEventListener("copy",this.#de)}scrollToBottom(){const e=this.shadowRoot?.querySelector(".sections");e&&(e.scrollTop=e.scrollHeight)}#he(){this.dispatchEvent(new Ke)}#ge(){this.dispatchEvent(new ze)}#ve(){this.dispatchEvent(new _e)}#me(e){this.dispatchEvent(new Ve({targetPanel:"chrome-recorder",speed:e.speed,extension:e.extension}))}#be(e){if(!this.#H)return"default";if(e===this.#H)return this.#X?"error":this.#_.isPlaying?this.#_.isPausedOnBreakpoint?"stopped":"current":"success";const t=this.#W.indexOf(this.#H);if(-1===t)return"default";return this.#W.indexOf(e)<t?"success":"outstanding"}#fe(e){const t=this.#H;if(!t)return"default";const s=this.#Y.find((e=>e.steps.includes(t)));if(!s&&this.#X)return"error";if(e===s)return"success";return this.#Y.indexOf(s)>=this.#Y.indexOf(e)?"success":"outstanding"}#we(t,s,i){const r=this.#W.indexOf(s);return e.html`
      <${Pe.litTagName}
      @click=${this.#ye}
      @mouseover=${this.#Se}
      @copystep=${this.#xe}
      .data=${{step:s,state:this.#be(s),error:this.#H===s?this.#X:void 0,isFirstSection:!1,isLastSection:i&&this.#W[this.#W.length-1]===s,isStartOfGroup:!1,isEndOfGroup:t.steps[t.steps.length-1]===s,stepIndex:r,hasBreakpoint:this.#Q.has(r),sectionIndex:-1,isRecording:this.#K,isPlaying:this.#_.isPlaying,removable:this.#W.length>1,builtInConverters:this.#se,extensionConverters:this.#ie,isSelected:this.#Z===s,recorderSettings:this.#r}}
      jslog=${n.section("step").track({click:!0})}
      ></${Pe.litTagName}>
    `}#Se=e=>{const t=e.target,s=t.step||t.section?.causingStep;s&&!this.#Z&&this.#$e(s)};#ye(e){e.stopPropagation();const t=e.target,s=t.step||t.section?.causingStep||null;this.#Z!==s&&(this.#Z=s,this.#o(),s&&this.#$e(s,!0))}#ke(){void 0!==this.#Z&&(this.#Z=void 0,this.#o())}#Te(e){"Enter"===e.key&&(e.preventDefault(),this.#Ee(e))}#Ee(e){e.stopPropagation(),this.#ee=!this.#ee,this.#o()}#Re(e){const t=We.find((t=>t.i18nTitleKey===e.itemValue));this.dispatchEvent(new Ge(t?.i18nTitleKey===p.NetworkManager.NoThrottlingConditions.i18nTitleKey?void 0:t))}#Ce(e){const t=e.target;t.checkValidity()?this.dispatchEvent(new He(Number(t.value))):t.reportValidity()}#Ie=e=>{const t=e.target.innerText.trim();if(!t)return this.#G=!0,void this.#o();this.dispatchEvent(new qe(t))};#Ne=e=>{switch(e.code){case"Escape":case"Enter":e.target.blur(),e.stopPropagation()}};#Be=()=>{const e=this.#t.getElementById("title-input");e.focus();const t=document.createRange();t.selectNodeContents(e),t.collapse(!1);const s=window.getSelection();s?.removeAllRanges(),s?.addRange(t)};#je=e=>{const t=e.target;t.matches(".wrapping-label")&&t.querySelector("devtools-select-menu")?.click()};async#Me(e){let t=[...this.#se,...this.#ie].find((e=>e.getId()===this.#r?.preferredCopyFormat));if(t||(t=this.#se[0]),!t)throw new Error("No default converter found");let s="";e?s=await t.stringifyStep(e):this.#U&&([s]=await t.stringify(this.#U)),c.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(s);const i=e?function(e){switch(e){case"puppeteer":return 5;case"json":return 6;case"@puppeteer/replay":return 7;default:return 8}}(t.getId()):function(e){switch(e){case"puppeteer":return 1;case"json":return 2;case"@puppeteer/replay":return 3;default:return 4}}(t.getId());c.userMetrics.recordingCopiedToClipboard(i)}#xe(e){e.stopPropagation(),this.#Me(e.step)}async#pe(e){e.target===document.body&&(e.preventDefault(),await this.#Me(this.#Z),c.userMetrics.keyboardShortcutFired("chrome-recorder.copy-recording-or-step"))}#Ae(){if(!this.#$)return e.html``;const t=[];this.#$.viewportSettings&&(t.push(e.html`<div>${this.#$.viewportSettings.isMobile?De(Fe.mobile):De(Fe.desktop)}</div>`),t.push(e.html`<div class="separator"></div>`),t.push(e.html`<div>${this.#$.viewportSettings.width}×${this.#$.viewportSettings.height} px</div>`));const s=[];if(this.#ee){const t=this.#$.networkConditionsSettings?.i18nTitleKey||p.NetworkManager.NoThrottlingConditions.i18nTitleKey,i=We.find((e=>e.i18nTitleKey===t));let r="";i&&(r=i.title instanceof Function?i.title():i.title),s.push(e.html`<div class="editable-setting">
        <label class="wrapping-label" @click=${this.#je}>
          ${De(Fe.network)}
          <${g.SelectMenu.SelectMenu.litTagName}
            @selectmenuselected=${this.#Re}
            .disabled=${!this.#W.find((e=>"navigate"===e.type))}
            .showDivider=${!0}
            .showArrow=${!0}
            .sideButton=${!1}
            .showSelectedItem=${!0}
            .showConnector=${!1}
            .jslogContext=${"network-conditions"}
            .position=${"bottom"}
            .buttonTitle=${r}
          >
            ${We.map((s=>e.html`<${g.Menu.MenuItem.litTagName}
                .value=${s.i18nTitleKey}
                .selected=${t===s.i18nTitleKey}
                jslog=${n.item(d.StringUtilities.toKebabCase(s.i18nTitleKey||""))}
              >
                ${s.title instanceof Function?s.title():s.title}
              </${g.Menu.MenuItem.litTagName}>`))}
          </${g.SelectMenu.SelectMenu.litTagName}>
        </label>
      </div>`),s.push(e.html`<div class="editable-setting">
        <label class="wrapping-label" title=${De(Fe.timeoutExplanation)}>
          ${De(Fe.timeoutLabel)}
          <input
            @input=${this.#Ce}
            required
            min=${a.SchemaUtils.minTimeout}
            max=${a.SchemaUtils.maxTimeout}
            value=${this.#$.timeout||a.RecordingPlayer.defaultTimeout}
            jslog=${n.textField("timeout").track({change:!0})}
            class="devtools-text-input"
            type="number">
        </label>
      </div>`)}else this.#$.networkConditionsSettings?this.#$.networkConditionsSettings.title?s.push(e.html`<div>${this.#$.networkConditionsSettings.title}</div>`):s.push(e.html`<div>
            ${De(Fe.download,{value:d.NumberUtilities.bytesToString(this.#$.networkConditionsSettings.download)})},
            ${De(Fe.upload,{value:d.NumberUtilities.bytesToString(this.#$.networkConditionsSettings.upload)})},
            ${De(Fe.latency,{value:this.#$.networkConditionsSettings.latency})}
          </div>`):s.push(e.html`<div>${p.NetworkManager.NoThrottlingConditions.title instanceof Function?p.NetworkManager.NoThrottlingConditions.title():p.NetworkManager.NoThrottlingConditions.title}</div>`),s.push(e.html`<div class="separator"></div>`),s.push(e.html`<div>${De(Fe.timeout,{value:this.#$.timeout||a.RecordingPlayer.defaultTimeout})}</div>`);const i=!this.#K&&!this.#_.isPlaying,o={"settings-title":!0,expanded:this.#ee},l={expanded:this.#ee,settings:!0};return e.html`
      <div class="settings-row">
        <div class="settings-container">
          <div
            class=${e.Directives.classMap(o)}
            @keydown=${i&&this.#Te}
            @click=${i&&this.#Ee}
            tabindex="0"
            role="button"
            jslog=${n.action("replay-settings").track({click:!0})}
            aria-label=${De(Fe.editReplaySettings)}>
            <span>${De(Fe.replaySettings)}</span>
            ${i?e.html`<${r.Icon.Icon.litTagName}
                    class="chevron"
                    name="triangle-down">
                  </${r.Icon.Icon.litTagName}>`:""}
          </div>
          <div class=${e.Directives.classMap(l)}>
            ${s.length?s:e.html`<div>${De(Fe.default)}</div>`}
          </div>
        </div>
        <div class="settings-container">
          <div class="settings-title">${De(Fe.environment)}</div>
          <div class="settings">
            ${t.length?t:e.html`<div>${De(Fe.default)}</div>`}
          </div>
        </div>
      </div>
    `}#Pe(){const e=[...this.#se||[],...this.#ie||[]].find((e=>e.getId()===this.#ne));return e||this.#se[0]}#Le(){if(this.#ce)return e.html`
        <${te.litTagName} .descriptor=${this.#ce}>
        </${te.litTagName}>
      `;const t=this.#Pe(),s=t?.getFormatName();return this.#re?e.html`
        <${v.SplitView.SplitView.litTagName}>
          <div slot="main">
            ${this.#Fe()}
          </div>
          <div slot="sidebar" jslog=${n.pane("source-code").track({resize:!0})}>
            <div class="section-toolbar" jslog=${n.toolbar()}>
              <${g.SelectMenu.SelectMenu.litTagName}
                @selectmenuselected=${this.#Oe}
                .showDivider=${!0}
                .showArrow=${!0}
                .sideButton=${!1}
                .showSelectedItem=${!0}
                .showConnector=${!1}
                .position=${"bottom"}
                .buttonTitle=${s}
                .jslogContext=${"code-format"}
              >
                ${this.#se.map((t=>e.html`<${g.Menu.MenuItem.litTagName}
                    .value=${t.getId()}
                    .selected=${this.#ne===t.getId()}
                    jslog=${n.action().track({click:!0}).context(`converter-${d.StringUtilities.toKebabCase(t.getId())}`)}
                  >
                    ${t.getFormatName()}
                  </${g.Menu.MenuItem.litTagName}>`))}
                ${this.#ie.map((t=>e.html`<${g.Menu.MenuItem.litTagName}
                    .value=${t.getId()}
                    .selected=${this.#ne===t.getId()}
                    jslog=${n.action().track({click:!0}).context("converter-extension")}
                  >
                    ${t.getFormatName()}
                  </${g.Menu.MenuItem.litTagName}>`))}
              </${g.SelectMenu.SelectMenu.litTagName}>
              <${i.Button.Button.litTagName}
                title=${a.Tooltip.getTooltipForActions(De(Fe.hideCode),"chrome-recorder.toggle-code-view")}
                .data=${{variant:"icon",size:"SMALL",iconName:"cross"}}
                @click=${this.showCodeToggle}
                jslog=${n.close().track({click:!0})}
              ></${i.Button.Button.litTagName}>
            </div>
            <div class="text-editor" jslog=${n.textField().track({change:!0})}>
              <${m.TextEditor.TextEditor.litTagName} .state=${this.#ae}></${m.TextEditor.TextEditor.litTagName}>
            </div>
          </div>
        </${v.SplitView.SplitView.litTagName}>
      `:this.#Fe()}#De(t){return t.screenshot?e.html`
      <img class="screenshot" src=${t.screenshot} alt=${De(Fe.screenshotForSection)} />
    `:null}#ze(){return this.#_.isPlaying?e.html`
        <${i.Button.Button.litTagName} .jslogContext=${"abort-replay"} @click=${this.#ve} .iconName=${"pause"} .variant=${"outlined"}>
          ${De(Fe.cancelReplay)}
        </${i.Button.Button.litTagName}>`:e.html`<${ve.litTagName}
        .data=${{settings:this.#r,replayExtensions:this.#k}}
        .disabled=${this.#_.isPlaying}
        @startreplay=${this.#me}
        >
      </${ve.litTagName}>`}#Ve(e){e.stopPropagation(),this.dispatchEvent(new Ve({targetPanel:"timeline",speed:"normal"}))}showCodeToggle=()=>{this.#re=!this.#re,c.userMetrics.recordingCodeToggled(this.#re?1:2),this.#ue()};#ue=async()=>{if(!this.#U)return;const e=this.#Pe();if(!e)return;const[t,s]=await e.stringify(this.#U);this.#oe=t,this.#le=s,this.#le?.shift();const i=e.getMediaType(),r=i?await h.CodeHighlighter.languageFromMIME(i):null;this.#ae=u.EditorState.create({doc:this.#oe,extensions:[m.Config.baseConfiguration(this.#oe),u.EditorState.readOnly.of(!0),u.EditorView.lineWrapping,r||[]]}),this.#o(),this.dispatchEvent(new Event("code-generated"))};#$e=(e,t=!1)=>{if(!this.#le)return;const s=this.#W.indexOf(e);if(-1===s)return;const i=this.#t.querySelector("devtools-text-editor");if(!i)return;const r=i.editor;if(!r)return;const o=this.#le[2*s],n=this.#le[2*s+1];let a=i.createSelection({lineNumber:o+n,columnNumber:0},{lineNumber:o,columnNumber:0});const l=i.state.doc.lineAt(a.main.anchor);a=i.createSelection({lineNumber:o+n-1,columnNumber:l.length+1},{lineNumber:o,columnNumber:0}),r.dispatch({selection:a,effects:t?[u.EditorView.scrollIntoView(a.main,{y:"nearest"})]:void 0})};#Oe=e=>{this.#ne=e.itemValue,this.#r&&(this.#r.preferredCopyFormat=e.itemValue),this.#ue()};#Fe(){return e.html`
      <div class="sections">
      ${this.#re?"":e.html`<div class="section-toolbar">
        <${i.Button.Button.litTagName}
          @click=${this.showCodeToggle}
          class="show-code"
          .data=${{variant:"outlined",title:a.Tooltip.getTooltipForActions(De(Fe.showCode),"chrome-recorder.toggle-code-view")}}
          jslog=${n.toggleSubpane("chrome-recorder.toggle-code-view").track({click:!0})}
        >
          ${De(Fe.showCode)}
        </${i.Button.Button.litTagName}>
      </div>`}
      ${this.#Y.map(((t,s)=>e.html`
            <div class="section">
              <div class="screenshot-wrapper">
                ${this.#De(t)}
              </div>
              <div class="content">
                <div class="steps">
                  <${Pe.litTagName}
                    @click=${this.#ye}
                    @mouseover=${this.#Se}
                    .data=${{section:t,state:this.#fe(t),isStartOfGroup:!0,isEndOfGroup:0===t.steps.length,isFirstSection:0===s,isLastSection:s===this.#Y.length-1&&0===t.steps.length,isSelected:this.#Z===(t.causingStep||null),sectionIndex:s,isRecording:this.#K,isPlaying:this.#_.isPlaying,error:"error"===this.#fe(t)?this.#X:void 0,hasBreakpoint:!1,removable:this.#W.length>1&&t.causingStep}}
                  >
                  </${Pe.litTagName}>
                  ${t.steps.map((e=>this.#we(t,e,s===this.#Y.length-1)))}
                  ${!this.#q&&this.#K&&s===this.#Y.length-1?e.html`<devtools-button
                    class="step add-assertion-button"
                    .data=${{variant:"outlined",title:De(Fe.addAssertion),jslogContext:"add-assertion"}}
                    @click=${this.#he}
                  >${De(Fe.addAssertion)}</devtools-button>`:void 0}
                  ${this.#K&&s===this.#Y.length-1?e.html`<div class="step recording">${De(Fe.recording)}</div>`:null}
                </div>
              </div>
            </div>
      `))}
      </div>
    `}#_e(){if(!this.#U)return"";const{title:t}=this.#U,s=!this.#_.isPlaying&&!this.#K;return e.html`
      <div class="header">
        <div class="header-title-wrapper">
          <div class="header-title">
            <span @blur=${this.#Ie}
                  @keydown=${this.#Ne}
                  id="title-input"
                  .contentEditable=${s?"true":"false"}
                  jslog=${n.value("title").track({change:!0})}
                  class=${e.Directives.classMap({"has-error":this.#G,disabled:!s})}
                  .innerText=${e.Directives.live(t)}></span>
            <div class="title-button-bar">
              <${i.Button.Button.litTagName}
                @click=${this.#Be}
                .data=${{disabled:!s,variant:"toolbar",iconName:"edit",title:De(Fe.editTitle),jslogContext:"edit-title"}}
              ></${i.Button.Button.litTagName}>
            </div>
          </div>
          ${this.#G?e.html`<div class="title-input-error-text">
            ${De(Fe.requiredTitleError)}
          </div>`:""}
        </div>
        ${!this.#K&&this.#te?e.html`<div class="actions">
                <${i.Button.Button.litTagName}
                  @click=${this.#Ve}
                  .data=${{disabled:this.#_.isPlaying,variant:"outlined",iconName:"performance",title:De(Fe.performancePanel),jslogContext:"measure-performance"}}
                >
                  ${De(Fe.performancePanel)}
                </${i.Button.Button.litTagName}>
                <div class="separator"></div>
                ${this.#ze()}
              </div>`:""}
      </div>`}#Ue(){if(!this.#K)return"";const t=this.#q?De(Fe.recordingIsBeingStopped):De(Fe.endRecording);return e.html`
      <div class="footer">
        <div class="controls">
          <devtools-control-button
            jslog=${n.toggle("toggle-recording").track({click:!0})}
            @click=${this.#ge}
            .disabled=${this.#q}
            .shape=${"square"}
            .label=${t}
            title=${a.Tooltip.getTooltipForActions(t,"chrome-recorder.start-recording")}
          >
          </devtools-control-button>
        </div>
      </div>
    `}#o(){const t={wrapper:!0,"is-recording":this.#K,"is-playing":this.#_.isPlaying,"was-successful":"Success"===this.#J,"was-failure":"Failure"===this.#J};e.render(e.html`
      <div @click=${this.#ke} class=${e.Directives.classMap(t)}>
        <div class="main">
          ${this.#_e()}
          ${this.#ce?e.html`
            <${te.litTagName} .descriptor=${this.#ce}>
            </${te.litTagName}>
          `:e.html`
            ${this.#Ae()}
            ${this.#Le()}
          `}
          ${this.#Ue()}
        </div>
      </div>
    `,this.#t,{host:this})}}customElements.define("devtools-recording-view",Xe);var Ye=Object.freeze({__proto__:null,RecordingFinishedEvent:ze,PlayRecordingEvent:Ve,AbortReplayEvent:_e,RecordingChangedEvent:Ue,AddAssertionEvent:Ke,RecordingTitleChangedEvent:qe,NetworkConditionsChanged:Ge,TimeoutChanged:He,RecordingView:Xe});const Je=new CSSStyleSheet;Je.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-weight:normal;font-size:inherit}:host{flex:1;display:block;overflow:auto}.wrapper{padding:24px;background-color:var(--sys-color-cdt-base-container);height:100%;display:flex;flex-direction:column}.fit-content{width:fit-content}.align-right{width:auto;display:flex;flex-direction:row;justify-content:flex-end}\n/*# sourceURL=startView.css */\n");const Qe={header:"Measure performance across an entire user journey",step1:"Record a common user journey on your website or app",step2:"Replay the recording to check if the flow is working",step3:"Generate a detailed performance trace or export a Puppeteer script for testing",createRecording:"Create a new recording",quickStart:"Quick start: learn the new Recorder panel in DevTools"},Ze=s.i18n.registerUIStrings("panels/recorder/components/StartView.ts",Qe),et=s.i18n.getLocalizedString.bind(void 0,Ze),tt="https://goo.gle/recorder-feedback";class st extends Event{static eventName="createrecording";constructor(){super(st.eventName)}}class it extends HTMLElement{static litTagName=e.literal`devtools-start-view`;#t=this.attachShadow({mode:"open"});constructor(){super(),this.setAttribute("jslog",`${n.section("start-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[Je],l.ScheduledRender.scheduleRender(this,this.#o)}#Ke(){this.dispatchEvent(new st)}#o=()=>{e.render(e.html`
        <div class="wrapper">
          <${w.PanelIntroductionSteps.PanelIntroductionSteps.litTagName}>
            <span slot="title">${et(Qe.header)}</span>
            <span slot="step-1">${et(Qe.step1)}</span>
            <span slot="step-2">${et(Qe.step2)}</span>
            <span slot="step-3">${et(Qe.step3)}</span>
          </${w.PanelIntroductionSteps.PanelIntroductionSteps.litTagName}>
          <div class="fit-content">
            <${i.Button.Button.litTagName} .variant=${"primary"} @click=${this.#Ke}
              .jslogContext=${"chrome-recorder.create-recording"}>
              ${et(Qe.createRecording)}
            </${i.Button.Button.litTagName}>
          </div>
          <${f.PanelFeedback.PanelFeedback.litTagName} .data=${{feedbackUrl:tt,quickStartUrl:"https://developer.chrome.com/docs/devtools/recorder",quickStartLinkText:et(Qe.quickStart)}}>
          </${f.PanelFeedback.PanelFeedback.litTagName}>
          <div class="align-right">
            <${f.FeedbackButton.FeedbackButton.litTagName} .data=${{feedbackUrl:tt}}>
            </${f.FeedbackButton.FeedbackButton.litTagName}>
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-start-view",it);var rt=Object.freeze({__proto__:null,FEEDBACK_URL:tt,CreateRecordingEvent:st,StartView:it});const ot=new CSSStyleSheet;ot.replaceSync("*{box-sizing:border-box;padding:0;margin:0;font-size:inherit}:host{display:block}.row{display:flex;flex-direction:row;color:var(--sys-color-token-property-special);font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);align-items:center;line-height:18px;margin-top:3px}.row devtools-button{line-height:1;margin-left:0.5em}.separator{margin-right:0.5em;color:var(--sys-color-on-surface)}.padded{margin-left:2em}.padded.double{margin-left:4em}.selector-picker{width:18px;height:18px}.inline-button{width:18px;height:18px;opacity:0%;visibility:hidden;transition:opacity 200ms;flex-shrink:0}.row:focus-within .inline-button,\n.row:hover .inline-button{opacity:100%;visibility:visible}.wrapped.row{flex-wrap:wrap}.gap.row{gap:5px}.gap.row devtools-button{margin-left:0}.regular-font{font-family:inherit;font-size:inherit}.no-margin{margin:0}.row-buttons{margin-top:3px}.error{margin:3px 0 6px;padding:8px 12px;background:var(--sys-color-error-container);color:var(--sys-color-error)}\n/*# sourceURL=stepEditor.css */\n");function nt(e,t="Assertion failed!"){if(!e)throw new Error(t)}const at=e=>{for(const t of Reflect.ownKeys(e)){const s=e[t];(s&&"object"==typeof s||"function"==typeof s)&&at(s)}return Object.freeze(e)};class lt{value;constructor(e){this.value=e}}class ct{value;constructor(e){this.value=e}}const dt=(e,t)=>{if(t instanceof ct){nt(Array.isArray(e),`Expected an array. Got ${typeof e}.`);const s=[...e],i=Object.keys(t.value).sort(((e,t)=>Number(t)-Number(e)));for(const e of i){const i=t.value[Number(e)];void 0===i?s.splice(Number(e),1):i instanceof lt?s.splice(Number(e),0,i.value):s[Number(e)]=dt(s[e],i)}return Object.freeze(s)}if("object"==typeof t&&!Array.isArray(t)){nt(!Array.isArray(e),"Expected an object. Got an array.");const s={...e},i=Object.keys(t);for(const e of i){const i=t[e];void 0===i?delete s[e]:s[e]=dt(s[e],i)}return Object.freeze(s)}return t};var pt=self&&self.__decorate||function(e,t,s,i){var r,o=arguments.length,n=o<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,s,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(n=(o<3?r(n):o>3?r(t,s,n):r(t,s))||n);return o>3&&n&&Object.defineProperty(t,s,n),n};const{html:ut,Decorators:ht,Directives:gt,LitElement:vt}=e,{customElement:mt,property:bt,state:ft}=ht,{live:wt}=gt,yt=Object.freeze({string:e=>e.trim(),number:e=>{const t=parseFloat(e);return Number.isNaN(t)?0:t},boolean:e=>"true"===e.toLowerCase()}),St=Object.freeze({selectors:"string",offsetX:"number",offsetY:"number",target:"string",frame:"number",assertedEvents:"string",value:"string",key:"string",operator:"string",count:"number",expression:"string",x:"number",y:"number",url:"string",type:"string",timeout:"number",duration:"number",button:"string",deviceType:"string",width:"number",height:"number",deviceScaleFactor:"number",isMobile:"boolean",hasTouch:"boolean",isLandscape:"boolean",download:"number",upload:"number",latency:"number",name:"string",parameters:"string",visible:"boolean",properties:"string",attributes:"string"}),xt=at({selectors:[[".cls"]],offsetX:1,offsetY:1,target:"main",frame:[0],assertedEvents:[{type:"navigation",url:"https://example.com",title:"Title"}],value:"Value",key:"Enter",operator:">=",count:1,expression:"true",x:0,y:0,url:"https://example.com",timeout:5e3,duration:50,deviceType:"mouse",button:"primary",type:"click",width:800,height:600,deviceScaleFactor:1,isMobile:!1,hasTouch:!1,isLandscape:!0,download:1e3,upload:1e3,latency:25,name:"customParam",parameters:"{}",properties:"{}",attributes:[{name:"attribute",value:"value"}],visible:!0}),$t=at({[a.Schema.StepType.Click]:{required:["selectors","offsetX","offsetY"],optional:["assertedEvents","button","deviceType","duration","frame","target","timeout"]},[a.Schema.StepType.DoubleClick]:{required:["offsetX","offsetY","selectors"],optional:["assertedEvents","button","deviceType","frame","target","timeout"]},[a.Schema.StepType.Hover]:{required:["selectors"],optional:["assertedEvents","frame","target","timeout"]},[a.Schema.StepType.Change]:{required:["selectors","value"],optional:["assertedEvents","frame","target","timeout"]},[a.Schema.StepType.KeyDown]:{required:["key"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.KeyUp]:{required:["key"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.Scroll]:{required:[],optional:["assertedEvents","frame","target","timeout","x","y"]},[a.Schema.StepType.Close]:{required:[],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.Navigate]:{required:["url"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.WaitForElement]:{required:["selectors"],optional:["assertedEvents","attributes","count","frame","operator","properties","target","timeout","visible"]},[a.Schema.StepType.WaitForExpression]:{required:["expression"],optional:["assertedEvents","frame","target","timeout"]},[a.Schema.StepType.CustomStep]:{required:["name","parameters"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.EmulateNetworkConditions]:{required:["download","latency","upload"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.SetViewport]:{required:["deviceScaleFactor","hasTouch","height","isLandscape","isMobile","width"],optional:["assertedEvents","target","timeout"]}}),kt={notSaved:"Not saved: {error}",addAttribute:"Add {attributeName}",deleteRow:"Delete row",selectorPicker:"Select an element in the page to update selectors",addFrameIndex:"Add frame index within the frame tree",removeFrameIndex:"Remove frame index",addSelectorPart:"Add a selector part",removeSelectorPart:"Remove a selector part",addSelector:"Add a selector",removeSelector:"Remove a selector",unknownActionType:"Unknown action type."},Tt=s.i18n.registerUIStrings("panels/recorder/components/StepEditor.ts",kt),Et=s.i18n.getLocalizedString.bind(void 0,Tt);class Rt extends Event{static eventName="stepedited";data;constructor(e){super(Rt.eventName,{bubbles:!0,composed:!0}),this.data=e}}class Ct{static#qe=new x.SharedObject.SharedObject((()=>a.RecordingPlayer.RecordingPlayer.connectPuppeteer()),(({browser:e})=>a.RecordingPlayer.RecordingPlayer.disconnectPuppeteer(e)));static async default(e){const t={type:e},s=$t[t.type];let i=Promise.resolve();for(const e of s.required)i=Promise.all([i,(async()=>Object.assign(t,{[e]:await this.defaultByAttribute(t,e)}))()]);return await i,Object.freeze(t)}static async defaultByAttribute(e,t){return this.#qe.run((e=>{switch(t){case"assertedEvents":return dt(xt.assertedEvents,new ct({0:{url:e.page.url()||xt.assertedEvents[0].url}}));case"url":return e.page.url()||xt.url;case"height":return e.page.evaluate((()=>visualViewport.height))||xt.height;case"width":return e.page.evaluate((()=>visualViewport.width))||xt.width;default:return xt[t]}}))}static fromStep(e){const t=structuredClone(e);for(const s of["parameters","properties"])s in e&&void 0!==e[s]&&(t[s]=JSON.stringify(e[s]));if("attributes"in e&&e.attributes){t.attributes=[];for(const[s,i]of Object.entries(e.attributes))t.attributes.push({name:s,value:i})}return"selectors"in e&&(t.selectors=e.selectors.map((e=>"string"==typeof e?[e]:[...e]))),at(t)}static toStep(e){const t=structuredClone(e);for(const s of["parameters","properties"]){const i=e[s];i&&Object.assign(t,{[s]:JSON.parse(i)})}if(e.attributes)if(0!==e.attributes.length){const s={};for(const{name:t,value:i}of e.attributes)Object.assign(s,{[t]:i});Object.assign(t,{attributes:s})}else"attributes"in t&&delete t.attributes;if(e.selectors){const s=e.selectors.filter((e=>e.length>0)).map((e=>1===e.length?e[0]:[...e]));0!==s.length?Object.assign(t,{selectors:s}):"selectors"in t&&delete t.selectors}return e.frame&&0===e.frame.length&&"frame"in t&&delete t.frame,s=a.SchemaUtils.parseStep(t),JSON.parse(JSON.stringify(s));var s}}let It=class extends vt{static styles=[ot];#Ge=new S.SelectorPicker.SelectorPicker(this);constructor(){super(),this.disabled=!1}#e=e=>{e.preventDefault(),e.stopPropagation(),this.#Ge.toggle()};disconnectedCallback(){super.disconnectedCallback(),this.#Ge.stop()}render(){if(!this.disabled)return ut`<devtools-button
      @click=${this.#e}
      .title=${Et(kt.selectorPicker)}
      class="selector-picker"
      .size=${"SMALL"}
      .iconName=${"select-element"}
      .active=${this.#Ge.active}
      .variant=${"icon"}
      jslog=${n.toggle("selector-picker").track({click:!0})}
    ></devtools-button>`}};pt([bt()],It.prototype,"disabled",void 0),It=pt([mt("devtools-recorder-selector-picker-button")],It);let Nt=class extends vt{static styles=[ot];#He=new Set;constructor(){super(),this.state={type:a.Schema.StepType.WaitForElement},this.isTypeEditable=!0,this.disabled=!1}createRenderRoot(){const e=super.createRenderRoot();return e.addEventListener("keydown",this.#We),e}set step(e){this.state=at(Ct.fromStep(e)),this.error=void 0}#Xe(e){try{this.dispatchEvent(new Rt(Ct.toStep(e))),this.state=e}catch(e){this.error=e.message}}#Ye=e=>{e.preventDefault(),e.stopPropagation(),this.#Xe(dt(this.state,{target:e.data.target,frame:e.data.frame,selectors:e.data.selectors.map((e=>"string"==typeof e?[e]:e)),offsetX:e.data.offsetX,offsetY:e.data.offsetY}))};#Je=(e,t,s)=>i=>{i.preventDefault(),i.stopPropagation(),this.#Xe(dt(this.state,e)),this.#Qe(t),s&&c.userMetrics.recordingEdited(s)};#We=e=>{if(nt(e instanceof KeyboardEvent),e.target instanceof y.SuggestionInput.SuggestionInput&&"Enter"===e.key){e.preventDefault(),e.stopPropagation();const t=this.renderRoot.querySelectorAll("devtools-suggestion-input"),s=[...t].findIndex((t=>t===e.target));s>=0&&s+1<t.length?t[s+1].focus():e.target.blur()}};#Ze=e=>t=>{if(nt(t.target instanceof y.SuggestionInput.SuggestionInput),t.target.disabled)return;const s=St[e.attribute],i=yt[s](t.target.value),r=e.from.bind(this)(i);r&&(this.#Xe(dt(this.state,r)),e.metric&&c.userMetrics.recordingEdited(e.metric))};#et=async e=>{if(nt(e.target instanceof y.SuggestionInput.SuggestionInput),e.target.disabled)return;const t=e.target.value;t!==this.state.type&&(Object.values(a.Schema.StepType).includes(t)?(this.#Xe(await Ct.default(t)),c.userMetrics.recordingEdited(9)):this.error=Et(kt.unknownActionType))};#tt=async e=>{e.preventDefault(),e.stopPropagation();const t=e.target.dataset.attribute;this.#Xe(dt(this.state,{[t]:await Ct.defaultByAttribute(this.state,t)})),this.#Qe(`[data-attribute=${t}].attribute devtools-suggestion-input`)};#st(e){if(!this.disabled)return ut`
      <devtools-button
        title=${e.title}
        .size=${"SMALL"}
        .iconName=${e.iconName}
        .variant=${"icon"}
        jslog=${n.action(e.class).track({click:!0})}
        class="inline-button ${e.class}"
        @click=${e.onClick}
      ></devtools-button>
    `}#it(e){if(this.disabled)return;return[...$t[this.state.type].optional].includes(e)&&!this.disabled?ut`<devtools-button
      .size=${"SMALL"}
      .iconName=${"bin"}
      .variant=${"icon"}
      .title=${Et(kt.deleteRow)}
      class="inline-button delete-row"
      data-attribute=${e}
      jslog=${n.action("delete").track({click:!0})}
      @click=${t=>{t.preventDefault(),t.stopPropagation(),this.#Xe(dt(this.state,{[e]:void 0}))}}
    ></devtools-button>`:void 0}#rt(e){return this.#He.add("type"),ut`<div class="row attribute" data-attribute="type" jslog=${n.treeItem("type")}>
      <div>type<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${!e||this.disabled}
        .options=${Object.values(a.Schema.StepType)}
        .placeholder=${xt.type}
        .value=${wt(this.state.type)}
        @blur=${this.#et}
      ></devtools-suggestion-input>
    </div>`}#ot(e){this.#He.add(e);const t=this.state[e]?.toString();if(void 0!==t)return ut`<div class="row attribute" data-attribute=${e} jslog=${n.treeItem(d.StringUtilities.toKebabCase(e))}>
      <div>${e}<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${this.disabled}
        .placeholder=${xt[e].toString()}
        .value=${wt(t)}
        .mimeType=${(()=>{switch(e){case"expression":return"text/javascript";case"properties":return"application/json";default:return""}})()}
        @blur=${this.#Ze({attribute:e,from(t){if(void 0!==this.state[e]){if("properties"===e)c.userMetrics.recordingAssertion(2);return{[e]:t}}},metric:10})}
      ></devtools-suggestion-input>
      ${this.#it(e)}
    </div>`}#nt(){if(this.#He.add("frame"),void 0!==this.state.frame)return ut`
      <div class="attribute" data-attribute="frame" jslog=${n.treeItem("frame")}>
        <div class="row">
          <div>frame<span class="separator">:</span></div>
          ${this.#it("frame")}
        </div>
        ${this.state.frame.map(((e,t,s)=>ut`
            <div class="padded row">
              <devtools-suggestion-input
                .disabled=${this.disabled}
                .placeholder=${xt.frame[0].toString()}
                .value=${wt(e.toString())}
                data-path=${`frame.${t}`}
                @blur=${this.#Ze({attribute:"frame",from(e){if(void 0!==this.state.frame?.[t])return{frame:new ct({[t]:e})}},metric:10})}
              ></devtools-suggestion-input>
              ${this.#st({class:"add-frame",title:Et(kt.addFrameIndex),iconName:"plus",onClick:this.#Je({frame:new ct({[t+1]:new lt(xt.frame[0])})},`devtools-suggestion-input[data-path="frame.${t+1}"]`,10)})}
              ${this.#st({class:"remove-frame",title:Et(kt.removeFrameIndex),iconName:"minus",onClick:this.#Je({frame:new ct({[t]:void 0})},`devtools-suggestion-input[data-path="frame.${Math.min(t,s.length-2)}"]`,10)})}
            </div>
          `))}
      </div>
    `}#at(){if(this.#He.add("selectors"),void 0!==this.state.selectors)return ut`<div class="attribute" data-attribute="selectors" jslog=${n.treeItem("selectors")}>
      <div class="row">
        <div>selectors<span class="separator">:</span></div>
        <devtools-recorder-selector-picker-button
          @selectorpicked=${this.#Ye}
          .disabled=${this.disabled}
        ></devtools-recorder-selector-picker-button>
        ${this.#it("selectors")}
      </div>
      ${this.state.selectors.map(((e,t,s)=>ut`<div class="padded row" data-selector-path=${t}>
            <div>selector #${t+1}<span class="separator">:</span></div>
            ${this.#st({class:"add-selector",title:Et(kt.addSelector),iconName:"plus",onClick:this.#Je({selectors:new ct({[t+1]:new lt(structuredClone(xt.selectors[0]))})},`devtools-suggestion-input[data-path="selectors.${t+1}.0"]`,4)})}
            ${this.#st({class:"remove-selector",title:Et(kt.removeSelector),iconName:"minus",onClick:this.#Je({selectors:new ct({[t]:void 0})},`devtools-suggestion-input[data-path="selectors.${Math.min(t,s.length-2)}.0"]`,5)})}
          </div>
          ${e.map(((e,s,i)=>ut`<div
              class="double padded row"
              data-selector-path="${t}.${s}"
            >
              <devtools-suggestion-input
                .disabled=${this.disabled}
                .placeholder=${xt.selectors[0][0]}
                .value=${wt(e)}
                data-path=${`selectors.${t}.${s}`}
                @blur=${this.#Ze({attribute:"selectors",from(e){if(void 0!==this.state.selectors?.[t]?.[s])return{selectors:new ct({[t]:new ct({[s]:e})})}},metric:7})}
              ></devtools-suggestion-input>
              ${this.#st({class:"add-selector-part",title:Et(kt.addSelectorPart),iconName:"plus",onClick:this.#Je({selectors:new ct({[t]:new ct({[s+1]:new lt(xt.selectors[0][0])})})},`devtools-suggestion-input[data-path="selectors.${t}.${s+1}"]`,6)})}
              ${this.#st({class:"remove-selector-part",title:Et(kt.removeSelectorPart),iconName:"minus",onClick:this.#Je({selectors:new ct({[t]:new ct({[s]:void 0})})},`devtools-suggestion-input[data-path="selectors.${t}.${Math.min(s,i.length-2)}"]`,8)})}
            </div>`))}`))}
    </div>`}#lt(){if(this.#He.add("assertedEvents"),void 0!==this.state.assertedEvents)return ut`<div class="attribute" data-attribute="assertedEvents" jslog=${n.treeItem("asserted-events")}>
      <div class="row">
        <div>asserted events<span class="separator">:</span></div>
        ${this.#it("assertedEvents")}
      </div>
      ${this.state.assertedEvents.map(((e,t)=>ut` <div class="padded row" jslog=${n.treeItem("event-type")}>
            <div>type<span class="separator">:</span></div>
            <div>${e.type}</div>
          </div>
          <div class="padded row" jslog=${n.treeItem("event-title")}>
            <div>title<span class="separator">:</span></div>
            <devtools-suggestion-input
              .disabled=${this.disabled}
              .placeholder=${xt.assertedEvents[0].title}
              .value=${wt(e.title??"")}
              @blur=${this.#Ze({attribute:"assertedEvents",from(e){if(void 0!==this.state.assertedEvents?.[t]?.title)return{assertedEvents:new ct({[t]:{title:e}})}},metric:10})}
            ></devtools-suggestion-input>
          </div>
          <div class="padded row" jslog=${n.treeItem("event-url")}>
            <div>url<span class="separator">:</span></div>
            <devtools-suggestion-input
              .disabled=${this.disabled}
              .placeholder=${xt.assertedEvents[0].url}
              .value=${wt(e.url??"")}
              @blur=${this.#Ze({attribute:"url",from(e){if(void 0!==this.state.assertedEvents?.[t]?.url)return{assertedEvents:new ct({[t]:{url:e}})}},metric:10})}
            ></devtools-suggestion-input>
          </div>`))}
    </div> `}#ct(){if(this.#He.add("attributes"),void 0!==this.state.attributes)return ut`<div class="attribute" data-attribute="attributes" jslog=${n.treeItem("attributes")}>
      <div class="row">
        <div>attributes<span class="separator">:</span></div>
        ${this.#it("attributes")}
      </div>
      ${this.state.attributes.map((({name:e,value:t},s,i)=>ut`<div class="padded row" jslog=${n.treeItem("attribute")}>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${xt.attributes[0].name}
            .value=${wt(e)}
            data-path=${`attributes.${s}.name`}
            jslog=${n.key().track({change:!0})}
            @blur=${this.#Ze({attribute:"attributes",from(e){if(void 0!==this.state.attributes?.[s]?.name)return c.userMetrics.recordingAssertion(3),{attributes:new ct({[s]:{name:e}})}},metric:10})}
          ></devtools-suggestion-input>
          <span class="separator">:</span>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${xt.attributes[0].value}
            .value=${wt(t)}
            data-path=${`attributes.${s}.value`}
            @blur=${this.#Ze({attribute:"attributes",from(e){if(void 0!==this.state.attributes?.[s]?.value)return c.userMetrics.recordingAssertion(3),{attributes:new ct({[s]:{value:e}})}},metric:10})}
          ></devtools-suggestion-input>
          ${this.#st({class:"add-attribute-assertion",title:Et(kt.addSelectorPart),iconName:"plus",onClick:this.#Je({attributes:new ct({[s+1]:new lt((()=>{{const e=new Set(i.map((({name:e})=>e))),t=xt.attributes[0];let s=t.name,r=0;for(;e.has(s);)++r,s=`${t.name}-${r}`;return{...t,name:s}}})())})},`devtools-suggestion-input[data-path="attributes.${s+1}.name"]`,10)})}
          ${this.#st({class:"remove-attribute-assertion",title:Et(kt.removeSelectorPart),iconName:"minus",onClick:this.#Je({attributes:new ct({[s]:void 0})},`devtools-suggestion-input[data-path="attributes.${Math.min(s,i.length-2)}.value"]`,10)})}
        </div>`))}
    </div>`}#dt(){return[...$t[this.state.type].optional].filter((e=>void 0===this.state[e])).map((e=>ut`<devtools-button
          .variant=${"outlined"}
          class="add-row"
          data-attribute=${e}
          jslog=${n.action(`add-${d.StringUtilities.toKebabCase(e)}`)}
          @click=${this.#tt}
        >
          ${Et(kt.addAttribute,{attributeName:e})}
        </devtools-button>`))}#Qe=e=>{this.updateComplete.then((()=>{const t=this.renderRoot.querySelector(e);t?.focus()}))};render(){this.#He=new Set;const e=ut`
      <div class="wrapper" jslog=${n.tree("step-editor")}>
        ${this.#rt(this.isTypeEditable)} ${this.#ot("target")}
        ${this.#nt()} ${this.#at()}
        ${this.#ot("deviceType")} ${this.#ot("button")}
        ${this.#ot("url")} ${this.#ot("x")}
        ${this.#ot("y")} ${this.#ot("offsetX")}
        ${this.#ot("offsetY")} ${this.#ot("value")}
        ${this.#ot("key")} ${this.#ot("operator")}
        ${this.#ot("count")} ${this.#ot("expression")}
        ${this.#ot("duration")} ${this.#lt()}
        ${this.#ot("timeout")} ${this.#ot("width")}
        ${this.#ot("height")} ${this.#ot("deviceScaleFactor")}
        ${this.#ot("isMobile")} ${this.#ot("hasTouch")}
        ${this.#ot("isLandscape")} ${this.#ot("download")}
        ${this.#ot("upload")} ${this.#ot("latency")}
        ${this.#ot("name")} ${this.#ot("parameters")}
        ${this.#ot("visible")} ${this.#ot("properties")}
        ${this.#ct()}
        ${this.error?ut`
              <div class="error">
                ${Et(kt.notSaved,{error:this.error})}
              </div>
            `:void 0}
        ${this.disabled?void 0:ut`<div
              class="row-buttons wrapped gap row regular-font no-margin"
            >
              ${this.#dt()}
            </div>`}
      </div>
    `;for(const e of Object.keys(St))if(!this.#He.has(e))throw new Error(`The editable attribute ${e} does not have UI`);return e}};pt([ft()],Nt.prototype,"state",void 0),pt([ft()],Nt.prototype,"error",void 0),pt([bt()],Nt.prototype,"isTypeEditable",void 0),pt([bt()],Nt.prototype,"disabled",void 0),Nt=pt([mt("devtools-recorder-step-editor")],Nt);var Bt=Object.freeze({__proto__:null,StepEditedEvent:Rt,EditorState:Ct,get StepEditor(){return Nt}});export{B as ControlButton,D as CreateRecordingView,X as RecordingListView,Ye as RecordingView,me as ReplaySection,ae as SelectButton,rt as StartView,Bt as StepEditor,Le as StepView,ye as TimelineSection};
