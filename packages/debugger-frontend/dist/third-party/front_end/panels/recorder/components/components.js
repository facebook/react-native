import*as e from"../../../ui/lit-html/lit-html.js";import*as t from"../../../ui/legacy/legacy.js";import*as s from"../../../core/i18n/i18n.js";import*as i from"../../../ui/components/buttons/buttons.js";import*as r from"../../../ui/components/icon_button/icon_button.js";import*as o from"../../../ui/components/input/input.js";import*as n from"../../../ui/visual_logging/visual_logging.js";import*as a from"../models/models.js";import*as l from"../../../ui/components/helpers/helpers.js";import*as c from"../../../core/host/host.js";import*as d from"../../../core/platform/platform.js";import*as p from"../../../core/sdk/sdk.js";import*as h from"../../../third_party/codemirror.next/codemirror.next.js";import*as u from"../../../ui/components/code_highlighter/code_highlighter.js";import"../../../ui/components/dialogs/dialogs.js";import*as g from"../../../ui/components/menus/menus.js";import*as m from"../../../ui/components/split_view/split_view.js";import*as v from"../../../ui/components/text_editor/text_editor.js";import*as b from"../extensions/extensions.js";import*as f from"../../../ui/components/panel_feedback/panel_feedback.js";import*as y from"../../../ui/components/panel_introduction_steps/panel_introduction_steps.js";import*as w from"../../../ui/components/suggestion_input/suggestion_input.js";import*as S from"../controllers/controllers.js";import*as x from"../util/util.js";const $=new CSSStyleSheet;$.replaceSync('*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.control{background:none;border:none;display:flex;flex-direction:column;align-items:center}.control[disabled]{filter:grayscale(100%);cursor:auto}.icon{display:flex;width:40px;height:40px;border-radius:50%;background:var(--sys-color-error-bright);margin-bottom:8px;position:relative;transition:background 200ms;justify-content:center;align-content:center;align-items:center}.icon::before{--override-white:#fff;box-sizing:border-box;content:"";display:block;width:14px;height:14px;border:1px solid var(--override-white);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background-color:var(--override-white)}.icon.square::before{border-radius:0}.icon.circle::before{border-radius:50%}.icon:hover{background:color-mix(in sRGB,var(--sys-color-error-bright),var(--sys-color-state-hover-on-prominent) 10%)}.icon:active{background:color-mix(in sRGB,var(--sys-color-error-bright),var(--sys-color-state-ripple-neutral-on-prominent) 16%)}.control[disabled] .icon:hover{background:var(--sys-color-error)}.label{font-size:12px;line-height:16px;text-align:center;letter-spacing:0.02em;color:var(--sys-color-on-surface)}\n/*# sourceURL=controlButton.css */\n');var k=self&&self.__decorate||function(e,t,s,i){var r,o=arguments.length,n=o<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,s,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(n=(o<3?r(n):o>3?r(t,s,n):r(t,s))||n);return o>3&&n&&Object.defineProperty(t,s,n),n};const{html:T,Decorators:E,LitElement:R}=e,{customElement:C,property:N}=E;let I=class extends R{static styles=[$];constructor(){super(),this.label="",this.shape="square",this.disabled=!1}#e=e=>{this.disabled&&(e.stopPropagation(),e.preventDefault())};render(){return T`
            <button
                @click=${this.#e}
                .disabled=${this.disabled}
                class="control"
            >
                <div class="icon ${this.shape}"></div>
                <div class="label">${this.label}</div>
            </button>
        `}};k([N()],I.prototype,"label",void 0),k([N()],I.prototype,"shape",void 0),k([N()],I.prototype,"disabled",void 0),I=k([C("devtools-control-button")],I);var M=Object.freeze({__proto__:null,get ControlButton(){return I}});const B=new CSSStyleSheet;B.replaceSync('*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.wrapper{padding:24px;flex:1}h1{font-size:18px;line-height:24px;letter-spacing:0.02em;color:var(--sys-color-on-surface);margin:0;font-weight:normal}.row-label{font-weight:500;font-size:11px;line-height:16px;letter-spacing:0.8px;text-transform:uppercase;color:var(--sys-color-secondary);margin-bottom:8px;margin-top:32px;display:flex;align-items:center;gap:3px}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container)}.controls{display:flex}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error)}.row-label .link:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}.header-wrapper{display:flex;align-items:baseline;justify-content:space-between}.checkbox-label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis;gap:4px;line-height:1.1;padding:4px}.checkbox-container{display:flex;flex-flow:row wrap;gap:10px}input[type="checkbox"]:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}devtools-icon[name="help"]{width:16px;height:16px}\n/*# sourceURL=createRecordingView.css */\n');const j={recordingName:"Recording name",startRecording:"Start recording",createRecording:"Create a new recording",recordingNameIsRequired:"Recording name is required",selectorAttribute:"Selector attribute",cancelRecording:"Cancel recording",selectorTypeCSS:"CSS",selectorTypePierce:"Pierce",selectorTypeARIA:"ARIA",selectorTypeText:"Text",selectorTypeXPath:"XPath",selectorTypes:"Selector types to record",includeNecessarySelectors:"You must choose CSS, Pierce, or XPath as one of your options. Only these selectors are guaranteed to be recorded since ARIA and text selectors may not be unique.",learnMore:"Learn more"},A=s.i18n.registerUIStrings("panels/recorder/components/CreateRecordingView.ts",j),P=s.i18n.getLocalizedString.bind(void 0,A);class F extends Event{static eventName="recordingstarted";name;selectorAttribute;selectorTypesToRecord;constructor(e,t,s){super(F.eventName,{}),this.name=e,this.selectorAttribute=s||void 0,this.selectorTypesToRecord=t}}class L extends Event{static eventName="recordingcancelled";constructor(){super(L.eventName)}}class O extends HTMLElement{static litTagName=e.literal`devtools-create-recording-view`;#t=this.attachShadow({mode:"open"});#s="";#i;#r;constructor(){super(),this.setAttribute("jslog",`${n.section("create-recording-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[B,o.textInputStyles,o.checkboxStyles],this.#o(),this.#t.querySelector("input")?.focus()}set data(e){this.#r=e.recorderSettings,this.#s=this.#r.defaultTitle}#n(e){this.#i&&(this.#i=void 0,this.#o());"Enter"===e.key&&(this.startRecording(),e.stopPropagation(),e.preventDefault())}startRecording(){const e=this.#t.querySelector("#user-flow-name");if(!e)throw new Error("input#user-flow-name not found");if(!this.#r)throw new Error("settings not set");if(!e.value.trim())return this.#i=new Error(P(j.recordingNameIsRequired)),void this.#o();const t=this.#t.querySelectorAll(".selector-type input[type=checkbox]"),s=[];for(const e of t){const t=e,i=t.value;t.checked&&s.push(i)}if(!s.includes(a.Schema.SelectorType.CSS)&&!s.includes(a.Schema.SelectorType.XPath)&&!s.includes(a.Schema.SelectorType.Pierce))return this.#i=new Error(P(j.includeNecessarySelectors)),void this.#o();for(const e of Object.values(a.Schema.SelectorType))this.#r.setSelectorByType(e,s.includes(e));const i=this.#t.querySelector("#selector-attribute").value.trim();this.#r.selectorAttribute=i,this.dispatchEvent(new F(e.value.trim(),s,i))}#a(){this.dispatchEvent(new L)}#l=()=>{this.#t.querySelector("#user-flow-name")?.select()};#o(){const t=new Map([[a.Schema.SelectorType.ARIA,P(j.selectorTypeARIA)],[a.Schema.SelectorType.CSS,P(j.selectorTypeCSS)],[a.Schema.SelectorType.Text,P(j.selectorTypeText)],[a.Schema.SelectorType.XPath,P(j.selectorTypeXPath)],[a.Schema.SelectorType.Pierce,P(j.selectorTypePierce)]]);e.render(e.html`
        <div class="wrapper">
          <div class="header-wrapper">
            <h1>${P(j.createRecording)}</h1>
            <${i.Button.Button.litTagName}
              title=${P(j.cancelRecording)}
              jslog=${n.close().track({click:!0})}
              .data=${{variant:"round",size:"SMALL",iconName:"cross"}}
              @click=${this.#a}
            ></${i.Button.Button.litTagName}>
          </div>
          <label class="row-label" for="user-flow-name">${P(j.recordingName)}</label>
          <input
            value=${this.#s}
            @focus=${this.#l}
            @keydown=${this.#n}
            jslog=${n.textField("user-flow-name").track({keydown:!0})}
            class="devtools-text-input"
            id="user-flow-name"
          />
          <label class="row-label" for="selector-attribute">
            <span>${P(j.selectorAttribute)}</span>
            <x-link
              class="link" href="https://g.co/devtools/recorder#selector"
              title=${P(j.learnMore)}
              jslog=${n.link("recorder-selector-help").track({click:!0})}>
              <${r.Icon.Icon.litTagName} name="help">
              </${r.Icon.Icon.litTagName}>
            </x-link>
          </label>
          <input
            value=${this.#r?.selectorAttribute}
            placeholder="data-testid"
            @keydown=${this.#n}
            jslog=${n.textField("selector-attribute").track({keydown:!0})}
            class="devtools-text-input"
            id="selector-attribute"
          />
          <label class="row-label">
            <span>${P(j.selectorTypes)}</span>
            <x-link
              class="link" href="https://g.co/devtools/recorder#selector"
              title=${P(j.learnMore)}
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
              .label=${P(j.startRecording)}
              .shape=${"circle"}
              jslog=${n.action("chrome-recorder.start-recording").track({click:!0})}
              title=${a.Tooltip.getTooltipForActions(P(j.startRecording),"chrome-recorder.start-recording")}
            ></devtools-control-button>
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-create-recording-view",O);var D=Object.freeze({__proto__:null,RecordingStartedEvent:F,RecordingCancelledEvent:L,CreateRecordingView:O});const z=new CSSStyleSheet;z.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}*:focus,\n*:focus-visible{outline:none}.wrapper{padding:24px}.header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}h1{font-size:16px;line-height:19px;color:var(--sys-color-on-surface);font-weight:normal}.icon,\n.icon devtools-icon{width:20px;height:20px;color:var(--sys-color-primary)}.table{margin-top:35px}.title{font-size:13px;color:var(--sys-color-on-surface);margin-left:10px;flex:1;overflow-x:hidden;white-space:nowrap;text-overflow:ellipsis}.row{display:flex;align-items:center;padding-right:5px;height:28px;border-bottom:1px solid var(--sys-color-divider)}.row:focus-within,\n.row:hover{background-color:var(--sys-color-state-hover-on-subtle)}.row:last-child{border-bottom:none}.actions{display:flex;align-items:center}.actions button{border:none;background-color:transparent;width:24px;height:24px;border-radius:50%}.actions .divider{width:1px;height:17px;background-color:var(--sys-color-divider);margin:0 6px}\n/*# sourceURL=recordingListView.css */\n");const V={savedRecordings:"Saved recordings",createRecording:"Create a new recording",playRecording:"Play recording",deleteRecording:"Delete recording",openRecording:"Open recording"},_=s.i18n.registerUIStrings("panels/recorder/components/RecordingListView.ts",V),U=s.i18n.getLocalizedString.bind(void 0,_);class G extends Event{static eventName="createrecording";constructor(){super(G.eventName)}}class q extends Event{storageName;static eventName="deleterecording";constructor(e){super(q.eventName),this.storageName=e}}class K extends Event{storageName;static eventName="openrecording";constructor(e){super(K.eventName),this.storageName=e}}class H extends Event{storageName;static eventName="playrecording";constructor(e){super(H.eventName),this.storageName=e}}class W extends HTMLElement{static litTagName=e.literal`devtools-recording-list-view`;#t=this.attachShadow({mode:"open"});#c={recordings:[],replayAllowed:!0};constructor(){super()}connectedCallback(){this.#t.adoptedStyleSheets=[z],l.ScheduledRender.scheduleRender(this,this.#o)}set recordings(e){this.#c.recordings=e,l.ScheduledRender.scheduleRender(this,this.#o)}set replayAllowed(e){this.#c.replayAllowed=e,l.ScheduledRender.scheduleRender(this,this.#o)}#d(){this.dispatchEvent(new G)}#p(e,t){t.stopPropagation(),this.dispatchEvent(new q(e))}#h(e,t){t.stopPropagation(),this.dispatchEvent(new K(e))}#u(e,t){t.stopPropagation(),this.dispatchEvent(new H(e))}#n(e,t){"Enter"===t.key&&this.#h(e,t)}#g(e){e.stopPropagation()}#o=()=>{e.render(e.html`
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
                    @click=${this.#h.bind(this,t.storageName)}
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
                                .data=${{variant:"round",iconName:"play",jslogContext:"play-recording"}}
                                @click=${this.#u.bind(this,t.storageName)}
                                @keydown=${this.#g}
                              ></${i.Button.Button.litTagName}>
                              <div class="divider"></div>`:""}
                      <${i.Button.Button.litTagName}
                        class="delete-recording-button"
                        title=${U(V.deleteRecording)}
                        .data=${{variant:"round",iconName:"bin",jslogContext:"delete-recording"}}
                        @click=${this.#p.bind(this,t.storageName)}
                        @keydown=${this.#g}
                      ></${i.Button.Button.litTagName}>
                    </div>
                  </div>
                `))}
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-recording-list-view",W);var X=Object.freeze({__proto__:null,CreateRecordingEvent:G,DeleteRecordingEvent:q,OpenRecordingEvent:K,PlayRecordingEvent:H,RecordingListView:W});const Y=new CSSStyleSheet;Y.replaceSync("*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.extension-view{display:flex;flex-direction:column;height:100%}main{flex:1}iframe{border:none;height:100%;width:100%}header{display:flex;padding:3px 8px;justify-content:space-between;border-bottom:1px solid var(--sys-color-divider)}header > div{align-self:center}.icon{display:block;width:16px;height:16px;color:var(--sys-color-secondary)}.title{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-secondary);align-items:center;font-weight:500}\n/*# sourceURL=extensionView.css */\n");const J={closeView:"Close",extension:"Content provided by a browser extension"},Q=s.i18n.registerUIStrings("panels/recorder/components/ExtensionView.ts",J),Z=s.i18n.getLocalizedString.bind(void 0,Q);class ee extends Event{static eventName="recorderextensionviewclosed";constructor(){super(ee.eventName,{bubbles:!0,composed:!0})}}class te extends HTMLElement{static litTagName=e.literal`devtools-recorder-extension-view`;#t=this.attachShadow({mode:"open"});#m;constructor(){super(),this.setAttribute("jslog",`${n.section("extension-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[Y],this.#o()}disconnectedCallback(){this.#m&&b.ExtensionManager.ExtensionManager.instance().getView(this.#m.id).hide()}set descriptor(e){this.#m=e,this.#o(),b.ExtensionManager.ExtensionManager.instance().getView(e.id).show()}#v(){this.dispatchEvent(new ee)}#o(){if(!this.#m)return;const t=b.ExtensionManager.ExtensionManager.instance().getView(this.#m.id).frame();e.render(e.html`
        <div class="extension-view">
          <header>
            <div class="title">
              <${r.Icon.Icon.litTagName}
                class="icon"
                title=${Z(J.extension)}
                name="extension">
              </${r.Icon.Icon.litTagName}>
              ${this.#m.title}
            </div>
            <${i.Button.Button.litTagName}
              title=${Z(J.closeView)}
              jslog=${n.close().track({click:!0})}
              .data=${{variant:"round",size:"SMALL",iconName:"cross"}}
              @click=${this.#v}
            ></${i.Button.Button.litTagName}>
          </header>
          <main>
            ${t}
          <main>
      </div>
    `,this.#t,{host:this})}}customElements.define("devtools-recorder-extension-view",te);const se=new CSSStyleSheet;se.replaceSync('*{padding:0;margin:0;box-sizing:border-box;font-size:inherit}.wrapper{display:flex;flex-direction:row;flex:1;height:100%}.main{overflow:hidden;display:flex;flex-direction:column;flex:1}.sections{flex:1;min-height:0;overflow:hidden auto;background-color:var(--sys-color-cdt-base-container);z-index:0;position:relative;container:sections/inline-size}.section{display:flex;padding:0 16px;gap:8px;position:relative}.section::after{content:"";border-bottom:1px solid var(--sys-color-divider);position:absolute;left:0;right:0;bottom:0;z-index:-1}.section:last-child{margin-bottom:70px}.section:last-child::after{content:none}.screenshot-wrapper{flex:0 0 80px;padding-top:32px;z-index:2}@container sections (max-width: 400px){.screenshot-wrapper{display:none}}.screenshot{object-fit:cover;object-position:top center;max-width:100%;width:200px;height:auto;border:1px solid var(--sys-color-divider);border-radius:1px}.content{flex:1;min-width:0}.steps{flex:1;position:relative;align-self:flex-start;overflow:visible}.step{position:relative;padding-left:40px;margin:16px 0}.step .action{font-size:13px;line-height:16px;letter-spacing:0.03em}.recording{color:var(--sys-color-primary);font-style:italic;margin-top:8px;margin-bottom:0}.add-assertion-button{margin-top:8px}.details{max-width:240px;display:flex;flex-direction:column;align-items:flex-end}.url{font-size:12px;line-height:16px;letter-spacing:0.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--sys-color-secondary);max-width:100%;margin-bottom:16px}.header{align-items:center;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:16px}.header-title-wrapper{max-width:100%}.header-title{align-items:center;display:flex;flex:1;max-width:100%}.header-title::before{content:"";min-width:12px;height:12px;display:inline-block;background:var(--sys-color-primary);border-radius:50%;margin-right:7px}#title-input{box-sizing:content-box;font-family:inherit;font-size:18px;line-height:22px;letter-spacing:0.02em;padding:1px 4px;border:1px solid transparent;border-radius:1px;word-break:break-all}#title-input:hover{border-color:var(--input-outline)}#title-input.has-error{border-color:var(--sys-color-error)}#title-input.disabled{color:var(--sys-color-state-disabled)}.title-input-error-text{margin-top:4px;margin-left:19px;color:var(--sys-color-error)}.title-button-bar{padding-left:2px;display:flex}#title-input:focus + .title-button-bar{display:none}.settings-row{padding:16px 28px;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-flow:row wrap;justify-content:space-between}.settings-title{font-size:14px;line-height:24px;letter-spacing:0.03em;color:var(--sys-color-on-surface);display:flex;align-items:center;align-content:center;gap:5px;width:fit-content}.settings{margin-top:4px;display:flex;font-size:12px;line-height:20px;letter-spacing:0.03em;color:var(--sys-color-on-surface-subtle)}.settings.expanded{gap:10px}.settings .separator{width:1px;height:20px;background-color:var(--sys-color-divider);margin:0 5px}.actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px}.is-recording .header-title::before{background:var(--sys-color-error-bright)}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container);z-index:1}.controls{align-items:center;display:flex;justify-content:center;position:relative;width:100%}.chevron{width:14px;height:14px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0)}.editable-setting{display:flex;flex-direction:row;gap:12px;align-items:center}.editable-setting devtools-select-menu{height:32px}.editable-setting .devtools-text-input{width:fit-content}.wrapping-label{display:inline-flex;align-items:center;gap:12px}.text-editor{height:100%;overflow:auto}.section-toolbar{display:flex;align-items:center;padding:3px 5px;justify-content:space-between;gap:3px}.section-toolbar > devtools-select-menu{height:24px;min-width:50px}.sections .section-toolbar{justify-content:flex-end}devtools-split-view{flex:1 1 0%;min-height:0}[slot="sidebar"]{display:flex;flex-direction:column;overflow:auto;height:100%;width:100%}[slot="sidebar"] .section-toolbar{border-bottom:1px solid var(--sys-color-divider)}.show-code{margin-right:14px;margin-top:8px}devtools-recorder-extension-view{flex:1}\n/*# sourceURL=recordingView.css */\n');const ie=new CSSStyleSheet;ie.replaceSync('.select-button{display:flex;--override-button-no-right-border-radius:1}.select-button devtools-button{position:relative}.select-menu-item-content-with-icon{display:flex;align-items:center}.select-menu-item-content-with-icon::before{content:"";position:relative;left:0;top:0;background-color:var(--sys-color-on-surface);display:inline-block;mask-repeat:no-repeat;mask-position:center;width:24px;height:24px;margin-right:4px;mask-image:var(--item-mask-icon)}devtools-select-menu{height:var(--override-select-menu-height,24px);border-radius:0 4px 4px 0;box-sizing:border-box;--override-select-menu-show-button-outline:var(--sys-color-state-focus-ring);--override-select-menu-label-with-arrow-padding:0;--override-select-menu-border:none;--override-select-menu-show-button-padding:0 6px 0 0}devtools-select-menu.primary{border:none;border-left:1px solid var(--override-icon-and-text-color);--override-icon-and-text-color:var(--sys-color-cdt-base-container);--override-select-menu-arrow-color:var(--override-icon-and-text-color);--override-divider-color:var(--override-icon-and-text-color);--override-select-menu-background-color:var(--sys-color-primary);--override-select-menu-active-background-color:var(\n      --override-select-menu-background-color\n    )}devtools-select-menu.primary:hover{--override-select-menu-background-color:color-mix(in sRGB,var(--sys-color-primary),var(--sys-color-state-hover-on-prominent) 10%)}devtools-select-menu[disabled].primary,\ndevtools-select-menu[disabled].primary:hover{--override-icon-and-text-color:var(--sys-color-state-disabled);--override-select-menu-background-color:var(--sys-color-cdt-base-container-elevation-1)}\n/*# sourceURL=selectButton.css */\n');class re extends Event{value;static eventName="selectbuttonclick";constructor(e){super(re.eventName,{bubbles:!0,composed:!0}),this.value=e}}class oe extends HTMLElement{static litTagName=e.literal`devtools-select-button`;#t=this.attachShadow({mode:"open"});#c={disabled:!1,value:"",items:[],groups:[],variant:"primary"};connectedCallback(){this.#t.adoptedStyleSheets=[ie],l.ScheduledRender.scheduleRender(this,this.#o)}get disabled(){return this.#c.disabled}set disabled(e){this.#c.disabled=e,l.ScheduledRender.scheduleRender(this,this.#o)}get items(){return this.#c.items}set items(e){this.#c.items=e,l.ScheduledRender.scheduleRender(this,this.#o)}set groups(e){this.#c.groups=e,l.ScheduledRender.scheduleRender(this,this.#o)}get value(){return this.#c.value}set value(e){this.#c.value=e,l.ScheduledRender.scheduleRender(this,this.#o)}get variant(){return this.#c.variant}set variant(e){this.#c.variant=e,l.ScheduledRender.scheduleRender(this,this.#o)}set action(e){this.#c.action=e,l.ScheduledRender.scheduleRender(this,this.#o)}#b(e){e.stopPropagation(),this.dispatchEvent(new re(this.#c.value))}#f(e){this.dispatchEvent(new re(e.itemValue)),l.ScheduledRender.scheduleRender(this,this.#o)}#y(t,s){return e.html`
      <${g.Menu.MenuItem.litTagName} .value=${t.value} .selected=${t.value===s.value} jslog=${n.item(d.StringUtilities.toKebabCase(t.value)).track({click:!0})}>
        ${t.label()}
      </${g.Menu.MenuItem.litTagName}>
    `}#w(t,s){return e.html`
      <${g.Menu.MenuGroup.litTagName} .name=${t.name}>
        ${t.items.map((e=>this.#y(e,s)))}
      </${g.Menu.MenuGroup.litTagName}>
    `}#S(e){return this.#c.action?a.Tooltip.getTooltipForActions(e,this.#c.action):""}#o=()=>{const t=Boolean(this.#c.groups.length),s=t?this.#c.groups.flatMap((e=>e.items)):this.#c.items,r=s.find((e=>e.value===this.#c.value))||s[0];if(!r)return;const o={primary:"primary"===this.#c.variant,secondary:"secondary"===this.#c.variant},n="secondary"===this.#c.variant?"secondary":"primary",a=r.buttonLabel?r.buttonLabel():r.label();e.render(e.html`
      <div class="select-button" title=${this.#S(a)||e.nothing}>
        ${r?e.html`
        <${i.Button.Button.litTagName}
            .disabled=${this.#c.disabled}
            .variant=${n}
            .iconName=${r.buttonIconName}
            @click=${this.#b}>
            ${a}
        </${i.Button.Button.litTagName}>`:""}
        <${g.SelectMenu.SelectMenu.litTagName}
          class=${e.Directives.classMap(o)}
          @selectmenuselected=${this.#f}
          ?disabled=${this.#c.disabled}
          .showArrow=${!0}
          .sideButton=${!1}
          .showSelectedItem=${!0}
          .disabled=${this.#c.disabled}
          .buttonTitle=${e.html``}
          .position=${"bottom"}
          .horizontalAlignment=${"right"}
        >
          ${t?this.#c.groups.map((e=>this.#w(e,r))):this.#c.items.map((e=>this.#y(e,r)))}
        </${g.SelectMenu.SelectMenu.litTagName}>
      </div>`,this.#t,{host:this})}}customElements.define("devtools-select-button",oe);var ne=Object.freeze({__proto__:null,SelectButtonClickEvent:re,SelectButton:oe});const ae={ReplayNormalButtonLabel:"Replay",ReplayNormalItemLabel:"Normal (Default)",ReplaySlowButtonLabel:"Slow replay",ReplaySlowItemLabel:"Slow",ReplayVerySlowButtonLabel:"Very slow replay",ReplayVerySlowItemLabel:"Very slow",ReplayExtremelySlowButtonLabel:"Extremely slow replay",ReplayExtremelySlowItemLabel:"Extremely slow",speedGroup:"Speed",extensionGroup:"Extensions"},le=[{value:"normal",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplayNormalButtonLabel),label:()=>pe(ae.ReplayNormalItemLabel)},{value:"slow",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplaySlowButtonLabel),label:()=>pe(ae.ReplaySlowItemLabel)},{value:"very_slow",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplayVerySlowButtonLabel),label:()=>pe(ae.ReplayVerySlowItemLabel)},{value:"extremely_slow",buttonIconName:"play",buttonLabel:()=>pe(ae.ReplayExtremelySlowButtonLabel),label:()=>pe(ae.ReplayExtremelySlowItemLabel)}],ce={normal:1,slow:2,very_slow:3,extremely_slow:4},de=s.i18n.registerUIStrings("panels/recorder/components/ReplayButton.ts",ae),pe=s.i18n.getLocalizedString.bind(void 0,de);class he extends Event{speed;extension;static eventName="startreplay";constructor(e,t){super(he.eventName,{bubbles:!0,composed:!0}),this.speed=e,this.extension=t}}const ue="extension";class ge extends HTMLElement{static litTagName=e.literal`devtools-replay-button`;#t=this.attachShadow({mode:"open"});#x=this.#o.bind(this);#c={disabled:!1};#$;#k=[];set data(e){this.#$=e.settings,this.#k=e.replayExtensions}get disabled(){return this.#c.disabled}set disabled(e){this.#c.disabled=e,l.ScheduledRender.scheduleRender(this,this.#x)}connectedCallback(){l.ScheduledRender.scheduleRender(this,this.#x)}#T(e){if(e.stopPropagation(),e.value.startsWith(ue)){this.#$&&(this.#$.replayExtension=e.value);const t=Number(e.value.substring(9));return this.dispatchEvent(new he("normal",this.#k[t])),void l.ScheduledRender.scheduleRender(this,this.#x)}const t=e.value;this.#$&&(this.#$.speed=t,this.#$.replayExtension=""),c.userMetrics.recordingReplaySpeed(ce[t]),this.dispatchEvent(new he(e.value)),l.ScheduledRender.scheduleRender(this,this.#x)}#o(){const t=[{name:pe(ae.speedGroup),items:le}];this.#k.length&&t.push({name:pe(ae.extensionGroup),items:this.#k.map(((e,t)=>({value:ue+t,buttonIconName:"play",buttonLabel:()=>e.getName(),label:()=>e.getName()})))}),e.render(e.html`
    <${oe.litTagName}
      @selectbuttonclick=${this.#T}
      .variant=${"primary"}
      .showItemDivider=${!1}
      .disabled=${this.#c.disabled}
      .action=${"chrome-recorder.replay-recording"}
      .value=${this.#$?.replayExtension||this.#$?.speed}
      .groups=${t}
      jslog=${n.action("chrome-recorder.replay-recording").track({click:!0})}>
    </${oe.litTagName}>`,this.#t,{host:this})}}customElements.define("devtools-replay-button",ge);var me=Object.freeze({__proto__:null,StartReplayEvent:he,ReplayButton:ge});const ve=new CSSStyleSheet;ve.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.title-container{max-width:calc(100% - 18px);font-size:13px;line-height:16px;letter-spacing:0.03em;display:flex;flex-direction:row;gap:3px;outline-offset:3px}.action{display:flex;align-items:flex-start}.title{flex:1;min-width:0}.is-start-of-group .title{font-weight:bold}.error-icon{display:none}.breakpoint-icon{visibility:hidden;cursor:pointer;opacity:0%;fill:var(--sys-color-primary);stroke:#1a73e8;transform:translate(-1.92px,-3px)}.circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-cdt-base-container);stroke-width:4px;r:5px;cx:8px;cy:8px}.is-start-of-group .circle-icon{r:7px;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.step.is-success .circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-primary)}.step.is-current .circle-icon{stroke-dasharray:24 10;animation:rotate 1s linear infinite;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error);position:relative}@keyframes rotate{0%{transform:translate(8px,8px) rotate(0) translate(-8px,-8px)}100%{transform:translate(8px,8px) rotate(360deg) translate(-8px,-8px)}}.step.is-error .circle-icon{fill:var(--sys-color-error);stroke:var(--sys-color-error)}.step.is-error .error-icon{display:block;transform:translate(4px,4px)}:host-context(.was-successful) .circle-icon{animation:flash-circle 2s}:host-context(.was-successful) .breakpoint-icon{animation:flash-breakpoint-icon 2s}@keyframes flash-circle{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}@keyframes flash-breakpoint-icon{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}.chevron{width:14px;height:14px;transition:200ms;position:absolute;top:18px;left:24px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0deg)}.is-start-of-group .chevron{top:34px}.details{display:none;margin-top:8px;position:relative}.expanded .details{display:block}.step-details{overflow:auto}devtools-recorder-step-editor{border:1px solid var(--sys-color-neutral-outline);padding:3px 6px 6px;margin-left:-6px;border-radius:3px}devtools-recorder-step-editor:hover{border:1px solid var(--sys-color-neutral-outline)}devtools-recorder-step-editor.is-selected{background-color:color-mix(in sRGB,var(--sys-color-tonal-container),var(--sys-color-cdt-base-container) 50%);border:1px solid var(--sys-color-tonal-outline)}.summary{display:flex;flex-flow:row nowrap}.filler{flex-grow:1}.subtitle{font-weight:normal;color:var(--sys-color-on-surface-subtle);word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.main-title{word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.step-actions{border:none;border-radius:0;width:24px;height:24px;--override-select-menu-show-button-border-radius:0;--override-select-menu-show-button-outline:none;--override-select-menu-show-button-padding:0}.step-actions:hover,\n.step-actions:focus-within{background-color:var(--sys-color-state-hover-on-subtle)}.step-actions:active{background-color:var(--sys-color-cdt-base-container)}.step.has-breakpoint .circle-icon{visibility:hidden}.step:not(.is-start-of-group).has-breakpoint .breakpoint-icon{visibility:visible;opacity:100%}.step:not(.is-start-of-group):not(.has-breakpoint) .icon:hover .circle-icon{transition:opacity 0.2s;opacity:0%}.step:not(.is-start-of-group):not(.has-breakpoint) .icon:hover .error-icon{visibility:hidden}.step:not(.is-start-of-group):not(.has-breakpoint) .icon:hover .breakpoint-icon{transition:opacity 0.2s;visibility:visible;opacity:50%}\n/*# sourceURL=stepView.css */\n");const be=new CSSStyleSheet;be.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.timeline-section{position:relative;padding:16px 0 16px 40px;margin-left:8px;--override-color-recording-successful-text:#36a854;--override-color-recording-successful-background:#e6f4ea}.overlay{position:absolute;width:100vw;height:100%;left:calc(-32px - 80px);top:0;z-index:-1;pointer-events:none}@container (max-width: 400px){.overlay{left:-32px}}:hover .overlay{background:var(--sys-color-state-hover-on-subtle)}.is-selected .overlay{background:var(--sys-color-tonal-container)}:host-context(.is-stopped) .overlay{background:var(--sys-color-state-ripple-primary);outline:1px solid var(--sys-color-state-focus-ring);z-index:4}.is-start-of-group{padding-top:28px}.is-end-of-group{padding-bottom:24px}.icon{position:absolute;left:4px;transform:translateX(-50%);z-index:2}.bar{position:absolute;left:4px;display:block;transform:translateX(-50%);top:18px;height:calc(100% + 8px);z-index:1}.bar .background{fill:var(--sys-color-state-hover-on-subtle)}.bar .line{fill:var(--sys-color-primary)}.is-first-section .bar{top:32px;height:calc(100% - 8px);display:none}.is-first-section:not(.is-last-section) .bar{display:block}.is-last-section .bar .line{display:none}.is-last-section .bar .background{display:none}:host-context(.is-error) .bar .line{fill:var(--sys-color-error)}:host-context(.is-error) .bar .background{fill:var(--sys-color-error-container)}:host-context(.was-successful) .bar .background{animation:flash-background 2s}:host-context(.was-successful) .bar .line{animation:flash-line 2s}@keyframes flash-background{25%{fill:var(--override-color-recording-successful-background)}75%{fill:var(--override-color-recording-successful-background)}}@keyframes flash-line{25%{fill:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text)}}\n/*# sourceURL=timelineSection.css */\n");class fe extends HTMLElement{static litTagName=e.literal`devtools-timeline-section`;#E=!1;#R=!1;#C=!1;#N=!1;#I=!1;constructor(){super();this.attachShadow({mode:"open"}).adoptedStyleSheets=[be]}set data(e){this.#C=e.isFirstSection,this.#N=e.isLastSection,this.#E=e.isEndOfGroup,this.#R=e.isStartOfGroup,this.#I=e.isSelected,this.#o()}connectedCallback(){this.#o()}#o(){const t={"timeline-section":!0,"is-end-of-group":this.#E,"is-start-of-group":this.#R,"is-first-section":this.#C,"is-last-section":this.#N,"is-selected":this.#I};e.render(e.html`
      <div class=${e.Directives.classMap(t)}>
        <div class="overlay"></div>
        <div class="icon"><slot name="icon"></slot></div>
        <svg width="24" height="100%" class="bar">
          <rect class="line" x="7" y="0" width="2" height="100%" />
        </svg>
        <slot></slot>
      </div>
    `,this.shadowRoot,{host:this})}}customElements.define("devtools-timeline-section",fe);var ye=Object.freeze({__proto__:null,TimelineSection:fe});const we={setViewportClickTitle:"Set viewport",customStepTitle:"Custom step",clickStepTitle:"Click",doubleClickStepTitle:"Double click",hoverStepTitle:"Hover",emulateNetworkConditionsStepTitle:"Emulate network conditions",changeStepTitle:"Change",closeStepTitle:"Close",scrollStepTitle:"Scroll",keyUpStepTitle:"Key up",navigateStepTitle:"Navigate",keyDownStepTitle:"Key down",waitForElementStepTitle:"Wait for element",waitForExpressionStepTitle:"Wait for expression",elementRoleButton:"Button",elementRoleInput:"Input",elementRoleFallback:"Element",addStepBefore:"Add step before",addStepAfter:"Add step after",removeStep:"Remove step",openStepActions:"Open step actions",addBreakpoint:"Add breakpoint",removeBreakpoint:"Remove breakpoint",copyAs:"Copy as",stepManagement:"Manage steps",breakpoints:"Breakpoints"},Se=s.i18n.registerUIStrings("panels/recorder/components/StepView.ts",we),xe=s.i18n.getLocalizedString.bind(void 0,Se);class $e extends Event{static eventName="captureselectors";data;constructor(e){super($e.eventName,{bubbles:!0,composed:!0}),this.data=e}}class ke extends Event{static eventName="stopselectorscapture";constructor(){super(ke.eventName,{bubbles:!0,composed:!0})}}class Te extends Event{static eventName="copystep";step;constructor(e){super(Te.eventName,{bubbles:!0,composed:!0}),this.step=e}}class Ee extends Event{static eventName="stepchanged";currentStep;newStep;constructor(e,t){super(Ee.eventName,{bubbles:!0,composed:!0}),this.currentStep=e,this.newStep=t}}class Re extends Event{static eventName="addstep";position;stepOrSection;constructor(e,t){super(Re.eventName,{bubbles:!0,composed:!0}),this.stepOrSection=e,this.position=t}}class Ce extends Event{static eventName="removestep";step;constructor(e){super(Ce.eventName,{bubbles:!0,composed:!0}),this.step=e}}class Ne extends Event{static eventName="addbreakpoint";index;constructor(e){super(Ne.eventName,{bubbles:!0,composed:!0}),this.index=e}}class Ie extends Event{static eventName="removebreakpoint";index;constructor(e){super(Ie.eventName,{bubbles:!0,composed:!0}),this.index=e}}const Me="copy-step-as-";class Be extends HTMLElement{static litTagName=e.literal`devtools-step-view`;#t=this.attachShadow({mode:"open"});#M;#B;#j="default";#i;#A=!1;#E=!1;#R=!1;#P=0;#F=0;#C=!1;#N=!1;#L=!1;#O=!1;#D;#z=!1;#V=!1;#_=new IntersectionObserver((e=>{this.#V=e[0].isIntersecting}));#U=!1;#G=!0;#q;#K;#I=!1;#r;constructor(){super(),this.setAttribute("jslog",`${n.section("step-view")}`)}set data(e){const t=this.#j;this.#M=e.step,this.#B=e.section,this.#j=e.state,this.#i=e.error,this.#E=e.isEndOfGroup,this.#R=e.isStartOfGroup,this.#P=e.stepIndex,this.#F=e.sectionIndex,this.#C=e.isFirstSection,this.#N=e.isLastSection,this.#L=e.isRecording,this.#O=e.isPlaying,this.#U=e.hasBreakpoint,this.#G=e.removable,this.#q=e.builtInConverters,this.#K=e.extensionConverters,this.#I=e.isSelected,this.#r=e.recorderSettings,this.#o(),this.#j===t||"current"!==this.#j||this.#V||this.scrollIntoView()}get step(){return this.#M}get section(){return this.#B}connectedCallback(){this.#t.adoptedStyleSheets=[ve],this.#_.observe(this),this.#o()}disconnectedCallback(){this.#_.unobserve(this)}#H(){this.#A=!this.#A,this.#o()}#W(e){const t=e;"Enter"!==t.key&&" "!==t.key||(this.#H(),e.stopPropagation(),e.preventDefault())}#X(){if(this.#B)return this.#B.title?this.#B.title:e.html`<span class="fallback">(No Title)</span>`;if(!this.#M)throw new Error("Missing both step and section");switch(this.#M.type){case a.Schema.StepType.CustomStep:return xe(we.customStepTitle);case a.Schema.StepType.SetViewport:return xe(we.setViewportClickTitle);case a.Schema.StepType.Click:return xe(we.clickStepTitle);case a.Schema.StepType.DoubleClick:return xe(we.doubleClickStepTitle);case a.Schema.StepType.Hover:return xe(we.hoverStepTitle);case a.Schema.StepType.EmulateNetworkConditions:return xe(we.emulateNetworkConditionsStepTitle);case a.Schema.StepType.Change:return xe(we.changeStepTitle);case a.Schema.StepType.Close:return xe(we.closeStepTitle);case a.Schema.StepType.Scroll:return xe(we.scrollStepTitle);case a.Schema.StepType.KeyUp:return xe(we.keyUpStepTitle);case a.Schema.StepType.KeyDown:return xe(we.keyDownStepTitle);case a.Schema.StepType.WaitForElement:return xe(we.waitForElementStepTitle);case a.Schema.StepType.WaitForExpression:return xe(we.waitForExpressionStepTitle);case a.Schema.StepType.Navigate:return xe(we.navigateStepTitle)}}#Y(e){switch(e){case"button":return xe(we.elementRoleButton);case"input":return xe(we.elementRoleInput);default:return xe(we.elementRoleFallback)}}#J(){if(!this.#M||!("selectors"in this.#M))return"";const e=this.#M.selectors.flat().find((e=>e.startsWith("aria/")));if(!e)return"";const t=e.match(/^aria\/(.+?)(\[role="(.+)"\])?$/);return t?`${this.#Y(t[3])} "${t[1]}"`:""}#Q(){return this.#B?this.#B.url:""}#Z(e){const t=this.#M||this.#B?.causingStep;if(!t)throw new Error("Expected step.");this.dispatchEvent(new Ee(t,e.data))}#ee(e){switch(e.itemValue){case"add-step-before":{const e=this.#M||this.#B;if(!e)throw new Error("Expected step or section.");this.dispatchEvent(new Re(e,"before"));break}case"add-step-after":{const e=this.#M||this.#B;if(!e)throw new Error("Expected step or section.");this.dispatchEvent(new Re(e,"after"));break}case"remove-step":{const e=this.#B?.causingStep;if(!this.#M&&!e)throw new Error("Expected step.");this.dispatchEvent(new Ce(this.#M||e));break}case"add-breakpoint":if(!this.#M)throw new Error("Expected step");this.dispatchEvent(new Ne(this.#P));break;case"remove-breakpoint":if(!this.#M)throw new Error("Expected step");this.dispatchEvent(new Ie(this.#P));break;default:{const t=e.itemValue;if(!t.startsWith(Me))throw new Error("Unknown step action.");const s=this.#M||this.#B?.causingStep;if(!s)throw new Error("Step not found.");const i=t.substring(13);this.#r&&(this.#r.preferredCopyFormat=i),this.dispatchEvent(new Te(structuredClone(s)))}}}#te(e){e.stopPropagation(),e.preventDefault(),this.#z=!this.#z,this.#o()}#se(){this.#z=!1,this.#o()}#ie(){this.#U?this.dispatchEvent(new Ie(this.#P)):this.dispatchEvent(new Ne(this.#P)),this.#o()}#re(){if(!this.#D)throw new Error("Missing actionsMenuButton");return this.#D}#oe=()=>{const e=[];if(this.#O||(this.#M&&e.push({id:"add-step-before",label:xe(we.addStepBefore),group:"stepManagement",groupTitle:xe(we.stepManagement)}),e.push({id:"add-step-after",label:xe(we.addStepAfter),group:"stepManagement",groupTitle:xe(we.stepManagement)}),this.#G&&e.push({id:"remove-step",group:"stepManagement",groupTitle:xe(we.stepManagement),label:xe(we.removeStep)})),this.#M&&!this.#L&&(this.#U?e.push({id:"remove-breakpoint",label:xe(we.removeBreakpoint),group:"breakPointManagement",groupTitle:xe(we.breakpoints)}):e.push({id:"add-breakpoint",label:xe(we.addBreakpoint),group:"breakPointManagement",groupTitle:xe(we.breakpoints)})),this.#M){for(const t of this.#q||[])e.push({id:Me+d.StringUtilities.toKebabCase(t.getId()),label:t.getFormatName(),group:"copy",groupTitle:xe(we.copyAs)});for(const t of this.#K||[])e.push({id:Me+d.StringUtilities.toKebabCase(t.getId()),label:t.getFormatName(),group:"copy",groupTitle:xe(we.copyAs)})}return e};#ne(){const t=this.#oe(),s=new Map;for(const e of t){const t=s.get(e.group);t?t.push(e):s.set(e.group,[e])}const r=[];for(const[e,t]of s)r.push({group:e,groupTitle:t[0].groupTitle,actions:t});return e.html`
      <${i.Button.Button.litTagName}
        class="step-actions"
        title=${xe(we.openStepActions)}
        aria-label=${xe(we.openStepActions)}
        @click=${this.#te}
        @keydown=${e=>{e.stopPropagation()}}
        on-render=${l.Directives.nodeRenderedCallback((e=>{this.#D=e}))}
        jslog=${n.dropDown("step-actions").track({click:!0})}
        .data=${{variant:"toolbar",iconName:"dots-vertical",title:xe(we.openStepActions)}}
      ></${i.Button.Button.litTagName}>
      <${g.Menu.Menu.litTagName}
        @menucloserequest=${this.#se}
        @menuitemselected=${this.#ee}
        .origin=${this.#re.bind(this)}
        .showSelectedItem=${!1}
        .showConnector=${!1}
        .open=${this.#z}
      >
        ${e.Directives.repeat(r,(e=>e.group),(t=>e.html`
            <${g.Menu.MenuGroup.litTagName}
              .name=${t.groupTitle}
            >
              ${e.Directives.repeat(t.actions,(e=>e.id),(t=>e.html`<${g.Menu.MenuItem.litTagName}
                      .value=${t.id}
                      jslog=${n.action().track({click:!0}).context(`${t.id}`)}
                    >
                      ${t.label}
                    </${g.Menu.MenuItem.litTagName}>
                  `))}
            </${g.Menu.MenuGroup.litTagName}>
          `))}
      </${g.Menu.Menu.litTagName}>
    `}#ae=e=>{if(2!==e.button)return;const s=new t.ContextMenu.ContextMenu(e),i=this.#oe(),r=i.filter((e=>e.id.startsWith(Me))),o=i.filter((e=>!e.id.startsWith(Me)));for(const e of o){s.section(e.group).appendItem(e.label,(()=>{this.#ee(new g.Menu.MenuItemSelectedEvent(e.id))}),{jslogContext:e.id})}const n=r.find((e=>e.id===Me+this.#r?.preferredCopyFormat));if(n&&s.section("copy").appendItem(n.label,(()=>{this.#ee(new g.Menu.MenuItemSelectedEvent(n.id))}),{jslogContext:n.id}),r.length){const e=s.section("copy").appendSubMenuItem(xe(we.copyAs),!1,"copy");for(const t of r)t!==n&&e.section(t.group).appendItem(t.label,(()=>{this.#ee(new g.Menu.MenuItemSelectedEvent(t.id))}),{jslogContext:t.id})}s.show()};#o(){if(!this.#M&&!this.#B)return;const t={step:!0,expanded:this.#A,"is-success":"success"===this.#j,"is-current":"current"===this.#j,"is-outstanding":"outstanding"===this.#j,"is-error":"error"===this.#j,"is-stopped":"stopped"===this.#j,"is-start-of-group":this.#R,"is-first-section":this.#C,"has-breakpoint":this.#U},s=Boolean(this.#M),i=this.#X(),o=this.#M?this.#J():this.#Q();e.render(e.html`
      <${fe.litTagName} .data=${{isFirstSection:this.#C,isLastSection:this.#N,isStartOfGroup:this.#R,isEndOfGroup:this.#E,isSelected:this.#I}} @contextmenu=${this.#ae} data-step-index=${this.#P} data-section-index=${this.#F} class=${e.Directives.classMap(t)}>
        <svg slot="icon" width="24" height="24" height="100%" class="icon">
          <circle class="circle-icon"/>
          <g class="error-icon">
            <path d="M1.5 1.5L6.5 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 6.5L6.5 1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <path @click=${this.#ie.bind(this)} jslog=${n.action("breakpoint").track({click:!0})} class="breakpoint-icon" d="M2.5 5.5H17.7098L21.4241 12L17.7098 18.5H2.5V5.5Z"/>
        </svg>
        <div class="summary">
          <div class="title-container ${s?"action":""}"
            @click=${s&&this.#H.bind(this)}
            @keydown=${s&&this.#W.bind(this)}
            tabindex="0"
            jslog=${n.sectionHeader().track({click:!0})}
            aria-role=${s?"button":""}
            aria-label=${s?"Show details for step":""}
          >
            ${s?e.html`<${r.Icon.Icon.litTagName}
                    class="chevron"
                    jslog=${n.expand().track({click:!0})}
                    name="triangle-down">
                  </${r.Icon.Icon.litTagName}>`:""}
            <div class="title">
              <div class="main-title" title=${i}>${i}</div>
              <div class="subtitle" title=${o}>${o}</div>
            </div>
          </div>
          <div class="filler"></div>
          ${this.#ne()}
        </div>
        <div class="details">
          ${this.#M&&e.html`<devtools-recorder-step-editor
            class=${this.#I?"is-selected":""}
            .step=${this.#M}
            .disabled=${this.#O}
            @stepedited=${this.#Z}>
          </devtools-recorder-step-editor>`}
          ${this.#B?.causingStep&&e.html`<devtools-recorder-step-editor
            .step=${this.#B.causingStep}
            .isTypeEditable=${!1}
            .disabled=${this.#O}
            @stepedited=${this.#Z}>
          </devtools-recorder-step-editor>`}
        </div>
        ${this.#i&&e.html`
          <div class="error" role="alert">
            ${this.#i.message}
          </div>
        `}
      </${fe.litTagName}>
    `,this.#t,{host:this})}}customElements.define("devtools-step-view",Be);var je=Object.freeze({__proto__:null,CaptureSelectorsEvent:$e,StopSelectorsCaptureEvent:ke,CopyStepEvent:Te,StepChanged:Ee,AddStep:Re,RemoveStep:Ce,AddBreakpointEvent:Ne,RemoveBreakpointEvent:Ie,StepView:Be});const Ae={mobile:"Mobile",desktop:"Desktop",latency:"Latency: {value} ms",upload:"Upload: {value}",download:"Download: {value}",editReplaySettings:"Edit replay settings",replaySettings:"Replay settings",default:"Default",environment:"Environment",screenshotForSection:"Screenshot for this section",editTitle:"Edit title",requiredTitleError:"Title is required",recording:"Recording…",endRecording:"End recording",recordingIsBeingStopped:"Stopping recording…",timeout:"Timeout: {value} ms",network:"Network",timeoutLabel:"Timeout",timeoutExplanation:"The timeout setting (in milliseconds) applies to every action when replaying the recording. For example, if a DOM element identified by a CSS selector does not appear on the page within the specified timeout, the replay fails with an error.",cancelReplay:"Cancel replay",showCode:"Show code",hideCode:"Hide code",addAssertion:"Add assertion",performancePanel:"Performance panel"},Pe=s.i18n.registerUIStrings("panels/recorder/components/RecordingView.ts",Ae),Fe=s.i18n.getLocalizedString.bind(void 0,Pe);class Le extends Event{static eventName="recordingfinished";constructor(){super(Le.eventName)}}class Oe extends Event{static eventName="playrecording";data;constructor(e={targetPanel:"chrome-recorder",speed:"normal"}){super(Oe.eventName),this.data=e}}class De extends Event{static eventName="abortreplay";constructor(){super(De.eventName)}}class ze extends Event{static eventName="recordingchanged";data;constructor(e,t){super(ze.eventName),this.data={currentStep:e,newStep:t}}}class Ve extends Event{static eventName="addassertion";constructor(){super(Ve.eventName)}}class _e extends Event{static eventName="recordingtitlechanged";title;constructor(e){super(_e.eventName,{}),this.title=e}}class Ue extends Event{static eventName="networkconditionschanged";data;constructor(e){super(Ue.eventName,{composed:!0,bubbles:!0}),this.data=e}}class Ge extends Event{static eventName="timeoutchanged";data;constructor(e){super(Ge.eventName,{composed:!0,bubbles:!0}),this.data=e}}const qe=[p.NetworkManager.NoThrottlingConditions,p.NetworkManager.OfflineConditions,p.NetworkManager.Slow3GConditions,p.NetworkManager.Fast3GConditions];class Ke extends HTMLElement{static litTagName=e.literal`devtools-recording-view`;#t=this.attachShadow({mode:"open"});#le={isPlaying:!1,isPausedOnBreakpoint:!1};#ce=null;#L=!1;#de=!1;#pe=!1;#he;#ue=[];#ge;#me=[];#$;#r;#ve;#be=new Set;#fe;#ye=!1;#we=!0;#q=[];#K=[];#k;#Se=!1;#xe="";#$e="";#ke;#Te;#Ee;#Re=this.#Ce.bind(this);constructor(){super()}set data(e){this.#L=e.isRecording,this.#le=e.replayState,this.#de=e.recordingTogglingInProgress,this.#he=e.currentStep,this.#ce=e.recording,this.#ue=this.#ce.steps,this.#me=e.sections,this.#$=e.settings,this.#r=e.recorderSettings,this.#ge=e.currentError,this.#ve=e.lastReplayResult,this.#we=e.replayAllowed,this.#pe=!1,this.#be=e.breakpointIndexes,this.#q=e.builtInConverters,this.#K=e.extensionConverters,this.#k=e.replayExtensions,this.#Ee=e.extensionDescriptor,this.#$e=this.#r?.preferredCopyFormat??e.builtInConverters[0]?.getId(),this.#Ne(),this.#o()}connectedCallback(){this.#t.adoptedStyleSheets=[se,o.textInputStyles],document.addEventListener("copy",this.#Re),this.#o()}disconnectedCallback(){document.removeEventListener("copy",this.#Re)}scrollToBottom(){const e=this.shadowRoot?.querySelector(".sections");e&&(e.scrollTop=e.scrollHeight)}#Ie(){this.dispatchEvent(new Ve)}#Me(){this.dispatchEvent(new Le)}#Be(){this.dispatchEvent(new De)}#je(e){this.dispatchEvent(new Oe({targetPanel:"chrome-recorder",speed:e.speed,extension:e.extension}))}#Ae(e){if(!this.#he)return"default";if(e===this.#he)return this.#ge?"error":this.#le.isPlaying?this.#le.isPausedOnBreakpoint?"stopped":"current":"success";const t=this.#ue.indexOf(this.#he);if(-1===t)return"default";return this.#ue.indexOf(e)<t?"success":"outstanding"}#Pe(e){const t=this.#he;if(!t)return"default";const s=this.#me.find((e=>e.steps.includes(t)));if(!s&&this.#ge)return"error";if(e===s)return"success";return this.#me.indexOf(s)>=this.#me.indexOf(e)?"success":"outstanding"}#Fe(t,s,i){const r=this.#ue.indexOf(s);return e.html`
      <${Be.litTagName}
      @click=${this.#Le}
      @mouseover=${this.#Oe}
      @copystep=${this.#De}
      .data=${{step:s,state:this.#Ae(s),error:this.#he===s?this.#ge:void 0,isFirstSection:!1,isLastSection:i&&this.#ue[this.#ue.length-1]===s,isStartOfGroup:!1,isEndOfGroup:t.steps[t.steps.length-1]===s,stepIndex:r,hasBreakpoint:this.#be.has(r),sectionIndex:-1,isRecording:this.#L,isPlaying:this.#le.isPlaying,removable:this.#ue.length>1,builtInConverters:this.#q,extensionConverters:this.#K,isSelected:this.#fe===s,recorderSettings:this.#r}}
      jslog=${n.section("step").track({click:!0})}
      ></${Be.litTagName}>
    `}#Oe=e=>{const t=e.target,s=t.step||t.section?.causingStep;s&&!this.#fe&&this.#ze(s)};#Le(e){e.stopPropagation();const t=e.target,s=t.step||t.section?.causingStep||null;this.#fe!==s&&(this.#fe=s,this.#o(),s&&this.#ze(s,!0))}#Ve(){void 0!==this.#fe&&(this.#fe=void 0,this.#o())}#_e(e){"Enter"===e.key&&(e.preventDefault(),this.#Ue(e))}#Ue(e){e.stopPropagation(),this.#ye=!this.#ye,this.#o()}#Ge(e){const t=qe.find((t=>t.i18nTitleKey===e.itemValue));this.dispatchEvent(new Ue(t?.i18nTitleKey===p.NetworkManager.NoThrottlingConditions.i18nTitleKey?void 0:t))}#qe(e){const t=e.target;t.checkValidity()?this.dispatchEvent(new Ge(Number(t.value))):t.reportValidity()}#Ke=e=>{const t=e.target.innerText.trim();if(!t)return this.#pe=!0,void this.#o();this.dispatchEvent(new _e(t))};#He=e=>{switch(e.code){case"Escape":case"Enter":e.target.blur(),e.stopPropagation()}};#We=()=>{const e=this.#t.getElementById("title-input");e.focus();const t=document.createRange();t.selectNodeContents(e),t.collapse(!1);const s=window.getSelection();s?.removeAllRanges(),s?.addRange(t)};#Xe=e=>{const t=e.target;t.matches(".wrapping-label")&&t.querySelector("devtools-select-menu")?.click()};async#Ye(e){let t=[...this.#q,...this.#K].find((e=>e.getId()===this.#r?.preferredCopyFormat));if(t||(t=this.#q[0]),!t)throw new Error("No default converter found");let s="";e?s=await t.stringifyStep(e):this.#ce&&([s]=await t.stringify(this.#ce)),c.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(s);const i=e?function(e){switch(e){case"puppeteer":return 5;case"json":return 6;case"@puppeteer/replay":return 7;default:return 8}}(t.getId()):function(e){switch(e){case"puppeteer":return 1;case"json":return 2;case"@puppeteer/replay":return 3;default:return 4}}(t.getId());c.userMetrics.recordingCopiedToClipboard(i)}#De(e){e.stopPropagation(),this.#Ye(e.step)}async#Ce(e){e.target===document.body&&(e.preventDefault(),await this.#Ye(this.#fe),c.userMetrics.keyboardShortcutFired("chrome-recorder.copy-recording-or-step"))}#Je(){if(!this.#$)return e.html``;const t=[];this.#$.viewportSettings&&(t.push(e.html`<div>${this.#$.viewportSettings.isMobile?Fe(Ae.mobile):Fe(Ae.desktop)}</div>`),t.push(e.html`<div class="separator"></div>`),t.push(e.html`<div>${this.#$.viewportSettings.width}×${this.#$.viewportSettings.height} px</div>`));const s=[];if(this.#ye){const t=this.#$.networkConditionsSettings?.i18nTitleKey||p.NetworkManager.NoThrottlingConditions.i18nTitleKey,i=qe.find((e=>e.i18nTitleKey===t));let r="";i&&(r=i.title instanceof Function?i.title():i.title),s.push(e.html`<div class="editable-setting">
        <label class="wrapping-label" @click=${this.#Xe}>
          ${Fe(Ae.network)}
          <${g.SelectMenu.SelectMenu.litTagName}
            @selectmenuselected=${this.#Ge}
            .disabled=${!this.#ue.find((e=>"navigate"===e.type))}
            .showDivider=${!0}
            .showArrow=${!0}
            .sideButton=${!1}
            .showSelectedItem=${!0}
            .showConnector=${!1}
            .jslogContext=${"network-conditions"}
            .position=${"bottom"}
            .buttonTitle=${r}
          >
            ${qe.map((s=>e.html`<${g.Menu.MenuItem.litTagName}
                .value=${s.i18nTitleKey}
                .selected=${t===s.i18nTitleKey}
                jslog=${n.item(d.StringUtilities.toKebabCase(s.i18nTitleKey||""))}
              >
                ${s.title instanceof Function?s.title():s.title}
              </${g.Menu.MenuItem.litTagName}>`))}
          </${g.SelectMenu.SelectMenu.litTagName}>
        </label>
      </div>`),s.push(e.html`<div class="editable-setting">
        <label class="wrapping-label" title=${Fe(Ae.timeoutExplanation)}>
          ${Fe(Ae.timeoutLabel)}
          <input
            @input=${this.#qe}
            required
            min=${a.SchemaUtils.minTimeout}
            max=${a.SchemaUtils.maxTimeout}
            value=${this.#$.timeout||a.RecordingPlayer.defaultTimeout}
            jslog=${n.textField("timeout").track({keydown:!0})}
            class="devtools-text-input"
            type="number">
        </label>
      </div>`)}else this.#$.networkConditionsSettings?this.#$.networkConditionsSettings.title?s.push(e.html`<div>${this.#$.networkConditionsSettings.title}</div>`):s.push(e.html`<div>
            ${Fe(Ae.download,{value:d.NumberUtilities.bytesToString(this.#$.networkConditionsSettings.download)})},
            ${Fe(Ae.upload,{value:d.NumberUtilities.bytesToString(this.#$.networkConditionsSettings.upload)})},
            ${Fe(Ae.latency,{value:this.#$.networkConditionsSettings.latency})}
          </div>`):s.push(e.html`<div>${p.NetworkManager.NoThrottlingConditions.title instanceof Function?p.NetworkManager.NoThrottlingConditions.title():p.NetworkManager.NoThrottlingConditions.title}</div>`),s.push(e.html`<div class="separator"></div>`),s.push(e.html`<div>${Fe(Ae.timeout,{value:this.#$.timeout||a.RecordingPlayer.defaultTimeout})}</div>`);const i=!this.#L&&!this.#le.isPlaying,o={"settings-title":!0,expanded:this.#ye},l={expanded:this.#ye,settings:!0};return e.html`
      <div class="settings-row">
        <div class="settings-container">
          <div
            class=${e.Directives.classMap(o)}
            @keydown=${i&&this.#_e}
            @click=${i&&this.#Ue}
            tabindex="0"
            role="button"
            jslog=${n.action("replay-settings").track({click:!0})}
            aria-label=${Fe(Ae.editReplaySettings)}>
            <span>${Fe(Ae.replaySettings)}</span>
            ${i?e.html`<${r.Icon.Icon.litTagName}
                    class="chevron"
                    name="triangle-down">
                  </${r.Icon.Icon.litTagName}>`:""}
          </div>
          <div class=${e.Directives.classMap(l)}>
            ${s.length?s:e.html`<div>${Fe(Ae.default)}</div>`}
          </div>
        </div>
        <div class="settings-container">
          <div class="settings-title">${Fe(Ae.environment)}</div>
          <div class="settings">
            ${t.length?t:e.html`<div>${Fe(Ae.default)}</div>`}
          </div>
        </div>
      </div>
    `}#Qe(){const e=[...this.#q||[],...this.#K||[]].find((e=>e.getId()===this.#$e));return e||this.#q[0]}#Ze(){if(this.#Ee)return e.html`
        <${te.litTagName} .descriptor=${this.#Ee}>
        </${te.litTagName}>
      `;const t=this.#Qe(),s=t?.getFormatName();return this.#Se?e.html`
        <${m.SplitView.SplitView.litTagName}>
          <div slot="main">
            ${this.#et()}
          </div>
          <div slot="sidebar" jslog=${n.pane("source-code").track({resize:!0})}>
            <div class="section-toolbar" jslog=${n.toolbar()}>
              <${g.SelectMenu.SelectMenu.litTagName}
                @selectmenuselected=${this.#tt}
                .showDivider=${!0}
                .showArrow=${!0}
                .sideButton=${!1}
                .showSelectedItem=${!0}
                .showConnector=${!1}
                .position=${"bottom"}
                .buttonTitle=${s}
                .jslogContext=${"code-format"}
              >
                ${this.#q.map((t=>e.html`<${g.Menu.MenuItem.litTagName}
                    .value=${t.getId()}
                    .selected=${this.#$e===t.getId()}
                    jslog=${n.action().track({click:!0}).context(`converter-${d.StringUtilities.toKebabCase(t.getId())}`)}
                  >
                    ${t.getFormatName()}
                  </${g.Menu.MenuItem.litTagName}>`))}
                ${this.#K.map((t=>e.html`<${g.Menu.MenuItem.litTagName}
                    .value=${t.getId()}
                    .selected=${this.#$e===t.getId()}
                    jslog=${n.action().track({click:!0}).context(`converter-${d.StringUtilities.toKebabCase(t.getId())}`)}
                  >
                    ${t.getFormatName()}
                  </${g.Menu.MenuItem.litTagName}>`))}
              </${g.SelectMenu.SelectMenu.litTagName}>
              <${i.Button.Button.litTagName}
                title=${a.Tooltip.getTooltipForActions(Fe(Ae.hideCode),"chrome-recorder.toggle-code-view")}
                .data=${{variant:"round",size:"SMALL",iconName:"cross"}}
                @click=${this.showCodeToggle}
                jslog=${n.close().track({click:!0})}
              ></${i.Button.Button.litTagName}>
            </div>
            <div class="text-editor" jslog=${n.textField().track({keydown:!0})}>
              <${v.TextEditor.TextEditor.litTagName} .state=${this.#ke}></${v.TextEditor.TextEditor.litTagName}>
            </div>
          </div>
        </${m.SplitView.SplitView.litTagName}>
      `:this.#et()}#st(t){return t.screenshot?e.html`
      <img class="screenshot" src=${t.screenshot} alt=${Fe(Ae.screenshotForSection)} />
    `:null}#it(){return this.#le.isPlaying?e.html`
        <${i.Button.Button.litTagName} .jslogContext=${"abort-replay"} @click=${this.#Be} .iconName=${"pause"} .variant=${"secondary"}>
          ${Fe(Ae.cancelReplay)}
        </${i.Button.Button.litTagName}>`:e.html`<${ge.litTagName}
        .data=${{settings:this.#r,replayExtensions:this.#k}}
        .disabled=${this.#le.isPlaying}
        @startreplay=${this.#je}
        >
      </${ge.litTagName}>`}#rt(e){e.stopPropagation(),this.dispatchEvent(new Oe({targetPanel:"timeline",speed:"normal"}))}showCodeToggle=()=>{this.#Se=!this.#Se,c.userMetrics.recordingCodeToggled(this.#Se?1:2),this.#Ne()};#Ne=async()=>{if(!this.#ce)return;const e=this.#Qe();if(!e)return;const[t,s]=await e.stringify(this.#ce);this.#xe=t,this.#Te=s,this.#Te?.shift();const i=e.getMediaType(),r=i?await u.CodeHighlighter.languageFromMIME(i):null;this.#ke=h.EditorState.create({doc:this.#xe,extensions:[v.Config.baseConfiguration(this.#xe),h.EditorState.readOnly.of(!0),h.EditorView.lineWrapping,r||[]]}),this.#o(),this.dispatchEvent(new Event("code-generated"))};#ze=(e,t=!1)=>{if(!this.#Te)return;const s=this.#ue.indexOf(e);if(-1===s)return;const i=this.#t.querySelector("devtools-text-editor");if(!i)return;const r=i.editor;if(!r)return;const o=this.#Te[2*s],n=this.#Te[2*s+1];let a=i.createSelection({lineNumber:o+n,columnNumber:0},{lineNumber:o,columnNumber:0});const l=i.state.doc.lineAt(a.main.anchor);a=i.createSelection({lineNumber:o+n-1,columnNumber:l.length+1},{lineNumber:o,columnNumber:0}),r.dispatch({selection:a,effects:t?[h.EditorView.scrollIntoView(a.main,{y:"nearest"})]:void 0})};#tt=e=>{this.#$e=e.itemValue,this.#r&&(this.#r.preferredCopyFormat=e.itemValue),this.#Ne()};#et(){return e.html`
      <div class="sections">
      ${this.#Se?"":e.html`<div class="section-toolbar">
        <${i.Button.Button.litTagName}
          @click=${this.showCodeToggle}
          class="show-code"
          .data=${{variant:"secondary",title:a.Tooltip.getTooltipForActions(Fe(Ae.showCode),"chrome-recorder.toggle-code-view")}}
          jslog=${n.toggleSubpane("chrome-recorder.toggle-code-view").track({click:!0})}
        >
          ${Fe(Ae.showCode)}
        </${i.Button.Button.litTagName}>
      </div>`}
      ${this.#me.map(((t,s)=>e.html`
            <div class="section">
              <div class="screenshot-wrapper">
                ${this.#st(t)}
              </div>
              <div class="content">
                <div class="steps">
                  <${Be.litTagName}
                    @click=${this.#Le}
                    @mouseover=${this.#Oe}
                    .data=${{section:t,state:this.#Pe(t),isStartOfGroup:!0,isEndOfGroup:0===t.steps.length,isFirstSection:0===s,isLastSection:s===this.#me.length-1&&0===t.steps.length,isSelected:this.#fe===(t.causingStep||null),sectionIndex:s,isRecording:this.#L,isPlaying:this.#le.isPlaying,error:"error"===this.#Pe(t)?this.#ge:void 0,hasBreakpoint:!1,removable:this.#ue.length>1&&t.causingStep}}
                  >
                  </${Be.litTagName}>
                  ${t.steps.map((e=>this.#Fe(t,e,s===this.#me.length-1)))}
                  ${!this.#de&&this.#L&&s===this.#me.length-1?e.html`<devtools-button
                    class="step add-assertion-button"
                    .data=${{variant:"secondary",title:Fe(Ae.addAssertion),jslogContext:"add-assertion"}}
                    @click=${this.#Ie}
                  >${Fe(Ae.addAssertion)}</devtools-button>`:void 0}
                  ${this.#L&&s===this.#me.length-1?e.html`<div class="step recording">${Fe(Ae.recording)}</div>`:null}
                </div>
              </div>
            </div>
      `))}
      </div>
    `}#ot(){if(!this.#ce)return"";const{title:t}=this.#ce,s=!this.#le.isPlaying&&!this.#L;return e.html`
      <div class="header">
        <div class="header-title-wrapper">
          <div class="header-title">
            <span @blur=${this.#Ke}
                  @keydown=${this.#He}
                  id="title-input"
                  .contentEditable=${s?"true":"false"}
                  jslog=${n.value("title").track({change:!0})}
                  class=${e.Directives.classMap({"has-error":this.#pe,disabled:!s})}
                  .innerText=${e.Directives.live(t)}></span>
            <div class="title-button-bar">
              <${i.Button.Button.litTagName}
                @click=${this.#We}
                .data=${{disabled:!s,variant:"toolbar",iconName:"edit",title:Fe(Ae.editTitle),jslogContext:"edit-title"}}
              ></${i.Button.Button.litTagName}>
            </div>
          </div>
          ${this.#pe?e.html`<div class="title-input-error-text">
            ${Fe(Ae.requiredTitleError)}
          </div>`:""}
        </div>
        ${!this.#L&&this.#we?e.html`<div class="actions">
                <${i.Button.Button.litTagName}
                  @click=${this.#rt}
                  .data=${{disabled:this.#le.isPlaying,variant:"secondary",iconName:"performance",title:Fe(Ae.performancePanel),jslogContext:"measure-performance"}}
                >
                  ${Fe(Ae.performancePanel)}
                </${i.Button.Button.litTagName}>
                ${this.#it()}
              </div>`:""}
      </div>`}#nt(){if(!this.#L)return"";const t=this.#de?Fe(Ae.recordingIsBeingStopped):Fe(Ae.endRecording);return e.html`
      <div class="footer">
        <div class="controls">
          <devtools-control-button
            jslog=${n.toggle("toggle-recording").track({click:!0})}
            @click=${this.#Me}
            .disabled=${this.#de}
            .shape=${"square"}
            .label=${t}
            title=${a.Tooltip.getTooltipForActions(t,"chrome-recorder.start-recording")}
          >
          </devtools-control-button>
        </div>
      </div>
    `}#o(){const t={wrapper:!0,"is-recording":this.#L,"is-playing":this.#le.isPlaying,"was-successful":"Success"===this.#ve,"was-failure":"Failure"===this.#ve};e.render(e.html`
      <div @click=${this.#Ve} class=${e.Directives.classMap(t)}>
        <div class="main">
          ${this.#ot()}
          ${this.#Ee?e.html`
            <${te.litTagName} .descriptor=${this.#Ee}>
            </${te.litTagName}>
          `:e.html`
            ${this.#Je()}
            ${this.#Ze()}
          `}
          ${this.#nt()}
        </div>
      </div>
    `,this.#t,{host:this})}}customElements.define("devtools-recording-view",Ke);var He=Object.freeze({__proto__:null,RecordingFinishedEvent:Le,PlayRecordingEvent:Oe,AbortReplayEvent:De,RecordingChangedEvent:ze,AddAssertionEvent:Ve,RecordingTitleChangedEvent:_e,NetworkConditionsChanged:Ue,TimeoutChanged:Ge,RecordingView:Ke});const We=new CSSStyleSheet;We.replaceSync("*{margin:0;padding:0;box-sizing:border-box;font-weight:normal;font-size:inherit}:host{flex:1;display:block;overflow:auto}.wrapper{padding:24px;background-color:var(--sys-color-cdt-base-container);height:100%;display:flex;flex-direction:column}.fit-content{width:fit-content}.align-right{width:auto;display:flex;flex-direction:row;justify-content:flex-end}\n/*# sourceURL=startView.css */\n");const Xe={header:"Measure performance across an entire user journey",step1:"Record a common user journey on your website or app",step2:"Replay the recording to check if the flow is working",step3:"Generate a detailed performance trace or export a Puppeteer script for testing",createRecording:"Create a new recording",quickStart:"Quick start: learn the new Recorder panel in DevTools"},Ye=s.i18n.registerUIStrings("panels/recorder/components/StartView.ts",Xe),Je=s.i18n.getLocalizedString.bind(void 0,Ye),Qe="https://goo.gle/recorder-feedback";class Ze extends Event{static eventName="createrecording";constructor(){super(Ze.eventName)}}class et extends HTMLElement{static litTagName=e.literal`devtools-start-view`;#t=this.attachShadow({mode:"open"});constructor(){super(),this.setAttribute("jslog",`${n.section("start-view")}`)}connectedCallback(){this.#t.adoptedStyleSheets=[We],l.ScheduledRender.scheduleRender(this,this.#o)}#at(){this.dispatchEvent(new Ze)}#o=()=>{e.render(e.html`
        <div class="wrapper">
          <${y.PanelIntroductionSteps.PanelIntroductionSteps.litTagName}>
            <span slot="title">${Je(Xe.header)}</span>
            <span slot="step-1">${Je(Xe.step1)}</span>
            <span slot="step-2">${Je(Xe.step2)}</span>
            <span slot="step-3">${Je(Xe.step3)}</span>
          </${y.PanelIntroductionSteps.PanelIntroductionSteps.litTagName}>
          <div class="fit-content">
            <${i.Button.Button.litTagName} .variant=${"primary"} @click=${this.#at}
              .jslogContext=${"chrome-recorder.create-recording"}>
              ${Je(Xe.createRecording)}
            </${i.Button.Button.litTagName}>
          </div>
          <${f.PanelFeedback.PanelFeedback.litTagName} .data=${{feedbackUrl:Qe,quickStartUrl:"https://developer.chrome.com/docs/devtools/recorder",quickStartLinkText:Je(Xe.quickStart)}}>
          </${f.PanelFeedback.PanelFeedback.litTagName}>
          <div class="align-right">
            <${f.FeedbackButton.FeedbackButton.litTagName} .data=${{feedbackUrl:Qe}}>
            </${f.FeedbackButton.FeedbackButton.litTagName}>
          </div>
        </div>
      `,this.#t,{host:this})}}customElements.define("devtools-start-view",et);var tt=Object.freeze({__proto__:null,FEEDBACK_URL:Qe,CreateRecordingEvent:Ze,StartView:et});const st=new CSSStyleSheet;st.replaceSync("*{box-sizing:border-box;padding:0;margin:0;font-size:inherit}:host{display:block}.row{display:flex;flex-direction:row;color:var(--sys-color-token-property-special);font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);align-items:center;line-height:18px;margin-top:3px}.row devtools-button{line-height:1;margin-left:0.5em}.separator{margin-right:0.5em;color:var(--sys-color-on-surface)}.padded{margin-left:2em}.padded.double{margin-left:4em}.selector-picker{width:18px;height:18px}.inline-button{width:18px;height:18px;opacity:0%;visibility:hidden;transition:opacity 200ms;flex-shrink:0}.row:focus-within .inline-button,\n.row:hover .inline-button{opacity:100%;visibility:visible}.wrapped.row{flex-wrap:wrap}.gap.row{gap:5px}.gap.row devtools-button{margin-left:0}.regular-font{font-family:inherit;font-size:inherit}.no-margin{margin:0}.row-buttons{margin-top:3px}.error{margin:3px 0 6px;padding:8px 12px;background:var(--sys-color-error-container);color:var(--sys-color-error)}\n/*# sourceURL=stepEditor.css */\n");function it(e,t="Assertion failed!"){if(!e)throw new Error(t)}const rt=e=>{for(const t of Reflect.ownKeys(e)){const s=e[t];(s&&"object"==typeof s||"function"==typeof s)&&rt(s)}return Object.freeze(e)};class ot{value;constructor(e){this.value=e}}class nt{value;constructor(e){this.value=e}}const at=(e,t)=>{if(t instanceof nt){it(Array.isArray(e),`Expected an array. Got ${typeof e}.`);const s=[...e],i=Object.keys(t.value).sort(((e,t)=>Number(t)-Number(e)));for(const e of i){const i=t.value[Number(e)];void 0===i?s.splice(Number(e),1):i instanceof ot?s.splice(Number(e),0,i.value):s[Number(e)]=at(s[e],i)}return Object.freeze(s)}if("object"==typeof t&&!Array.isArray(t)){it(!Array.isArray(e),"Expected an object. Got an array.");const s={...e},i=Object.keys(t);for(const e of i){const i=t[e];void 0===i?delete s[e]:s[e]=at(s[e],i)}return Object.freeze(s)}return t};var lt=self&&self.__decorate||function(e,t,s,i){var r,o=arguments.length,n=o<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,s,i);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(n=(o<3?r(n):o>3?r(t,s,n):r(t,s))||n);return o>3&&n&&Object.defineProperty(t,s,n),n};const{html:ct,Decorators:dt,Directives:pt,LitElement:ht}=e,{customElement:ut,property:gt,state:mt}=dt,{live:vt}=pt,bt=Object.freeze({string:e=>e.trim(),number:e=>{const t=parseFloat(e);return Number.isNaN(t)?0:t},boolean:e=>"true"===e.toLowerCase()}),ft=Object.freeze({selectors:"string",offsetX:"number",offsetY:"number",target:"string",frame:"number",assertedEvents:"string",value:"string",key:"string",operator:"string",count:"number",expression:"string",x:"number",y:"number",url:"string",type:"string",timeout:"number",duration:"number",button:"string",deviceType:"string",width:"number",height:"number",deviceScaleFactor:"number",isMobile:"boolean",hasTouch:"boolean",isLandscape:"boolean",download:"number",upload:"number",latency:"number",name:"string",parameters:"string",visible:"boolean",properties:"string",attributes:"string"}),yt=rt({selectors:[[".cls"]],offsetX:1,offsetY:1,target:"main",frame:[0],assertedEvents:[{type:"navigation",url:"https://example.com",title:"Title"}],value:"Value",key:"Enter",operator:">=",count:1,expression:"true",x:0,y:0,url:"https://example.com",timeout:5e3,duration:50,deviceType:"mouse",button:"primary",type:"click",width:800,height:600,deviceScaleFactor:1,isMobile:!1,hasTouch:!1,isLandscape:!0,download:1e3,upload:1e3,latency:25,name:"customParam",parameters:"{}",properties:"{}",attributes:[{name:"attribute",value:"value"}],visible:!0}),wt=rt({[a.Schema.StepType.Click]:{required:["selectors","offsetX","offsetY"],optional:["assertedEvents","button","deviceType","duration","frame","target","timeout"]},[a.Schema.StepType.DoubleClick]:{required:["offsetX","offsetY","selectors"],optional:["assertedEvents","button","deviceType","frame","target","timeout"]},[a.Schema.StepType.Hover]:{required:["selectors"],optional:["assertedEvents","frame","target","timeout"]},[a.Schema.StepType.Change]:{required:["selectors","value"],optional:["assertedEvents","frame","target","timeout"]},[a.Schema.StepType.KeyDown]:{required:["key"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.KeyUp]:{required:["key"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.Scroll]:{required:[],optional:["assertedEvents","frame","target","timeout","x","y"]},[a.Schema.StepType.Close]:{required:[],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.Navigate]:{required:["url"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.WaitForElement]:{required:["selectors"],optional:["assertedEvents","attributes","count","frame","operator","properties","target","timeout","visible"]},[a.Schema.StepType.WaitForExpression]:{required:["expression"],optional:["assertedEvents","frame","target","timeout"]},[a.Schema.StepType.CustomStep]:{required:["name","parameters"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.EmulateNetworkConditions]:{required:["download","latency","upload"],optional:["assertedEvents","target","timeout"]},[a.Schema.StepType.SetViewport]:{required:["deviceScaleFactor","hasTouch","height","isLandscape","isMobile","width"],optional:["assertedEvents","target","timeout"]}}),St={notSaved:"Not saved: {error}",addAttribute:"Add {attributeName}",deleteRow:"Delete row",selectorPicker:"Select an element in the page to update selectors",addFrameIndex:"Add frame index within the frame tree",removeFrameIndex:"Remove frame index",addSelectorPart:"Add a selector part",removeSelectorPart:"Remove a selector part",addSelector:"Add a selector",removeSelector:"Remove a selector",unknownActionType:"Unknown action type."},xt=s.i18n.registerUIStrings("panels/recorder/components/StepEditor.ts",St),$t=s.i18n.getLocalizedString.bind(void 0,xt);class kt extends Event{static eventName="stepedited";data;constructor(e){super(kt.eventName,{bubbles:!0,composed:!0}),this.data=e}}class Tt{static#lt=new x.SharedObject.SharedObject((()=>a.RecordingPlayer.RecordingPlayer.connectPuppeteer()),(({browser:e})=>a.RecordingPlayer.RecordingPlayer.disconnectPuppeteer(e)));static async default(e){const t={type:e},s=wt[t.type];let i=Promise.resolve();for(const e of s.required)i=Promise.all([i,(async()=>Object.assign(t,{[e]:await this.defaultByAttribute(t,e)}))()]);return await i,Object.freeze(t)}static async defaultByAttribute(e,t){return this.#lt.run((e=>{switch(t){case"assertedEvents":return at(yt.assertedEvents,new nt({0:{url:e.page.url()||yt.assertedEvents[0].url}}));case"url":return e.page.url()||yt.url;case"height":return e.page.evaluate((()=>visualViewport.height))||yt.height;case"width":return e.page.evaluate((()=>visualViewport.width))||yt.width;default:return yt[t]}}))}static fromStep(e){const t=structuredClone(e);for(const s of["parameters","properties"])s in e&&void 0!==e[s]&&(t[s]=JSON.stringify(e[s]));if("attributes"in e&&e.attributes){t.attributes=[];for(const[s,i]of Object.entries(e.attributes))t.attributes.push({name:s,value:i})}return"selectors"in e&&(t.selectors=e.selectors.map((e=>"string"==typeof e?[e]:[...e]))),rt(t)}static toStep(e){const t=structuredClone(e);for(const s of["parameters","properties"]){const i=e[s];i&&Object.assign(t,{[s]:JSON.parse(i)})}if(e.attributes)if(0!==e.attributes.length){const s={};for(const{name:t,value:i}of e.attributes)Object.assign(s,{[t]:i});Object.assign(t,{attributes:s})}else"attributes"in t&&delete t.attributes;if(e.selectors){const s=e.selectors.filter((e=>e.length>0)).map((e=>1===e.length?e[0]:[...e]));0!==s.length?Object.assign(t,{selectors:s}):"selectors"in t&&delete t.selectors}return e.frame&&0===e.frame.length&&"frame"in t&&delete t.frame,s=a.SchemaUtils.parseStep(t),JSON.parse(JSON.stringify(s));var s}}let Et=class extends ht{static styles=[st];#ct=new S.SelectorPicker.SelectorPicker(this);constructor(){super(),this.disabled=!1}#e=e=>{e.preventDefault(),e.stopPropagation(),this.#ct.toggle()};disconnectedCallback(){super.disconnectedCallback(),this.#ct.stop()}render(){if(!this.disabled)return ct`<devtools-button
      @click=${this.#e}
      .title=${$t(St.selectorPicker)}
      class="selector-picker"
      .size=${"SMALL"}
      .iconName=${"select-element"}
      .active=${this.#ct.active}
      .variant=${"secondary"}
      jslog=${n.toggle("selector-picker").track({click:!0})}
    ></devtools-button>`}};lt([gt()],Et.prototype,"disabled",void 0),Et=lt([ut("devtools-recorder-selector-picker-button")],Et);let Rt=class extends ht{static styles=[st];#dt=new Set;constructor(){super(),this.state={type:a.Schema.StepType.WaitForElement},this.isTypeEditable=!0,this.disabled=!1}createRenderRoot(){const e=super.createRenderRoot();return e.addEventListener("keydown",this.#pt),e}set step(e){this.state=rt(Tt.fromStep(e)),this.error=void 0}#ht(e){try{this.dispatchEvent(new kt(Tt.toStep(e))),this.state=e}catch(e){this.error=e.message}}#ut=e=>{e.preventDefault(),e.stopPropagation(),this.#ht(at(this.state,{target:e.data.target,frame:e.data.frame,selectors:e.data.selectors.map((e=>"string"==typeof e?[e]:e)),offsetX:e.data.offsetX,offsetY:e.data.offsetY}))};#gt=(e,t,s)=>i=>{i.preventDefault(),i.stopPropagation(),this.#ht(at(this.state,e)),this.#mt(t),s&&c.userMetrics.recordingEdited(s)};#pt=e=>{if(it(e instanceof KeyboardEvent),e.target instanceof w.SuggestionInput.SuggestionInput&&"Enter"===e.key){e.preventDefault(),e.stopPropagation();const t=this.renderRoot.querySelectorAll("devtools-suggestion-input"),s=[...t].findIndex((t=>t===e.target));s>=0&&s+1<t.length?t[s+1].focus():e.target.blur()}};#vt=e=>t=>{if(it(t.target instanceof w.SuggestionInput.SuggestionInput),t.target.disabled)return;const s=ft[e.attribute],i=bt[s](t.target.value),r=e.from.bind(this)(i);r&&(this.#ht(at(this.state,r)),e.metric&&c.userMetrics.recordingEdited(e.metric))};#bt=async e=>{if(it(e.target instanceof w.SuggestionInput.SuggestionInput),e.target.disabled)return;const t=e.target.value;t!==this.state.type&&(Object.values(a.Schema.StepType).includes(t)?(this.#ht(await Tt.default(t)),c.userMetrics.recordingEdited(9)):this.error=$t(St.unknownActionType))};#ft=async e=>{e.preventDefault(),e.stopPropagation();const t=e.target.dataset.attribute;this.#ht(at(this.state,{[t]:await Tt.defaultByAttribute(this.state,t)})),this.#mt(`[data-attribute=${t}].attribute devtools-suggestion-input`)};#yt(e){if(!this.disabled)return ct`
      <devtools-button
        title=${e.title}
        .size=${"SMALL"}
        .iconName=${e.iconName}
        .variant=${"secondary"}
        jslog=${n.action(e.class).track({click:!0})}
        class="inline-button ${e.class}"
        @click=${e.onClick}
      ></devtools-button>
    `}#wt(e){if(this.disabled)return;return[...wt[this.state.type].optional].includes(e)&&!this.disabled?ct`<devtools-button
      .size=${"SMALL"}
      .iconName=${"bin"}
      .variant=${"secondary"}
      .title=${$t(St.deleteRow)}
      class="inline-button delete-row"
      data-attribute=${e}
      jslog=${n.action("delete").track({click:!0})}
      @click=${t=>{t.preventDefault(),t.stopPropagation(),this.#ht(at(this.state,{[e]:void 0}))}}
    ></devtools-button>`:void 0}#St(e){return this.#dt.add("type"),ct`<div class="row attribute" data-attribute="type" jslog=${n.treeItem("type")}>
      <div>type<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${!e||this.disabled}
        .options=${Object.values(a.Schema.StepType)}
        .placeholder=${yt.type}
        .value=${vt(this.state.type)}
        @blur=${this.#bt}
      ></devtools-suggestion-input>
    </div>`}#xt(e){this.#dt.add(e);const t=this.state[e]?.toString();if(void 0!==t)return ct`<div class="row attribute" data-attribute=${e} jslog=${n.treeItem(d.StringUtilities.toKebabCase(e))}>
      <div>${e}<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${this.disabled}
        .placeholder=${yt[e].toString()}
        .value=${vt(t)}
        .mimeType=${(()=>{switch(e){case"expression":return"text/javascript";case"properties":return"application/json";default:return""}})()}
        @blur=${this.#vt({attribute:e,from(t){if(void 0!==this.state[e]){if("properties"===e)c.userMetrics.recordingAssertion(2);return{[e]:t}}},metric:10})}
      ></devtools-suggestion-input>
      ${this.#wt(e)}
    </div>`}#$t(){if(this.#dt.add("frame"),void 0!==this.state.frame)return ct`
      <div class="attribute" data-attribute="frame" jslog=${n.treeItem("frame")}>
        <div class="row">
          <div>frame<span class="separator">:</span></div>
          ${this.#wt("frame")}
        </div>
        ${this.state.frame.map(((e,t,s)=>ct`
            <div class="padded row">
              <devtools-suggestion-input
                .disabled=${this.disabled}
                .placeholder=${yt.frame[0].toString()}
                .value=${vt(e.toString())}
                data-path=${`frame.${t}`}
                @blur=${this.#vt({attribute:"frame",from(e){if(void 0!==this.state.frame?.[t])return{frame:new nt({[t]:e})}},metric:10})}
              ></devtools-suggestion-input>
              ${this.#yt({class:"add-frame",title:$t(St.addFrameIndex),iconName:"plus",onClick:this.#gt({frame:new nt({[t+1]:new ot(yt.frame[0])})},`devtools-suggestion-input[data-path="frame.${t+1}"]`,10)})}
              ${this.#yt({class:"remove-frame",title:$t(St.removeFrameIndex),iconName:"minus",onClick:this.#gt({frame:new nt({[t]:void 0})},`devtools-suggestion-input[data-path="frame.${Math.min(t,s.length-2)}"]`,10)})}
            </div>
          `))}
      </div>
    `}#kt(){if(this.#dt.add("selectors"),void 0!==this.state.selectors)return ct`<div class="attribute" data-attribute="selectors" jslog=${n.treeItem("selectors")}>
      <div class="row">
        <div>selectors<span class="separator">:</span></div>
        <devtools-recorder-selector-picker-button
          @selectorpicked=${this.#ut}
          .disabled=${this.disabled}
        ></devtools-recorder-selector-picker-button>
        ${this.#wt("selectors")}
      </div>
      ${this.state.selectors.map(((e,t,s)=>ct`<div class="padded row" data-selector-path=${t}>
            <div>selector #${t+1}<span class="separator">:</span></div>
            ${this.#yt({class:"add-selector",title:$t(St.addSelector),iconName:"plus",onClick:this.#gt({selectors:new nt({[t+1]:new ot(structuredClone(yt.selectors[0]))})},`devtools-suggestion-input[data-path="selectors.${t+1}.0"]`,4)})}
            ${this.#yt({class:"remove-selector",title:$t(St.removeSelector),iconName:"minus",onClick:this.#gt({selectors:new nt({[t]:void 0})},`devtools-suggestion-input[data-path="selectors.${Math.min(t,s.length-2)}.0"]`,5)})}
          </div>
          ${e.map(((e,s,i)=>ct`<div
              class="double padded row"
              data-selector-path="${t}.${s}"
            >
              <devtools-suggestion-input
                .disabled=${this.disabled}
                .placeholder=${yt.selectors[0][0]}
                .value=${vt(e)}
                data-path=${`selectors.${t}.${s}`}
                @blur=${this.#vt({attribute:"selectors",from(e){if(void 0!==this.state.selectors?.[t]?.[s])return{selectors:new nt({[t]:new nt({[s]:e})})}},metric:7})}
              ></devtools-suggestion-input>
              ${this.#yt({class:"add-selector-part",title:$t(St.addSelectorPart),iconName:"plus",onClick:this.#gt({selectors:new nt({[t]:new nt({[s+1]:new ot(yt.selectors[0][0])})})},`devtools-suggestion-input[data-path="selectors.${t}.${s+1}"]`,6)})}
              ${this.#yt({class:"remove-selector-part",title:$t(St.removeSelectorPart),iconName:"minus",onClick:this.#gt({selectors:new nt({[t]:new nt({[s]:void 0})})},`devtools-suggestion-input[data-path="selectors.${t}.${Math.min(s,i.length-2)}"]`,8)})}
            </div>`))}`))}
    </div>`}#Tt(){if(this.#dt.add("assertedEvents"),void 0!==this.state.assertedEvents)return ct`<div class="attribute" data-attribute="assertedEvents" jslog=${n.treeItem("asserted-events")}>
      <div class="row">
        <div>asserted events<span class="separator">:</span></div>
        ${this.#wt("assertedEvents")}
      </div>
      ${this.state.assertedEvents.map(((e,t)=>ct` <div class="padded row" jslog=${n.treeItem("event-type")}>
            <div>type<span class="separator">:</span></div>
            <div>${e.type}</div>
          </div>
          <div class="padded row" jslog=${n.treeItem("event-title")}>
            <div>title<span class="separator">:</span></div>
            <devtools-suggestion-input
              .disabled=${this.disabled}
              .placeholder=${yt.assertedEvents[0].title}
              .value=${vt(e.title??"")}
              @blur=${this.#vt({attribute:"assertedEvents",from(e){if(void 0!==this.state.assertedEvents?.[t]?.title)return{assertedEvents:new nt({[t]:{title:e}})}},metric:10})}
            ></devtools-suggestion-input>
          </div>
          <div class="padded row" jslog=${n.treeItem("event-url")}>
            <div>url<span class="separator">:</span></div>
            <devtools-suggestion-input
              .disabled=${this.disabled}
              .placeholder=${yt.assertedEvents[0].url}
              .value=${vt(e.url??"")}
              @blur=${this.#vt({attribute:"url",from(e){if(void 0!==this.state.assertedEvents?.[t]?.url)return{assertedEvents:new nt({[t]:{url:e}})}},metric:10})}
            ></devtools-suggestion-input>
          </div>`))}
    </div> `}#Et(){if(this.#dt.add("attributes"),void 0!==this.state.attributes)return ct`<div class="attribute" data-attribute="attributes" jslog=${n.treeItem("attributes")}>
      <div class="row">
        <div>attributes<span class="separator">:</span></div>
        ${this.#wt("attributes")}
      </div>
      ${this.state.attributes.map((({name:e,value:t},s,i)=>ct`<div class="padded row" jslog=${n.treeItem("attribute")}>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${yt.attributes[0].name}
            .value=${vt(e)}
            data-path=${`attributes.${s}.name`}
            jslog=${n.key().track({change:!0})}
            @blur=${this.#vt({attribute:"attributes",from(e){if(void 0!==this.state.attributes?.[s]?.name)return c.userMetrics.recordingAssertion(3),{attributes:new nt({[s]:{name:e}})}},metric:10})}
          ></devtools-suggestion-input>
          <span class="separator">:</span>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${yt.attributes[0].value}
            .value=${vt(t)}
            data-path=${`attributes.${s}.value`}
            @blur=${this.#vt({attribute:"attributes",from(e){if(void 0!==this.state.attributes?.[s]?.value)return c.userMetrics.recordingAssertion(3),{attributes:new nt({[s]:{value:e}})}},metric:10})}
          ></devtools-suggestion-input>
          ${this.#yt({class:"add-attribute-assertion",title:$t(St.addSelectorPart),iconName:"plus",onClick:this.#gt({attributes:new nt({[s+1]:new ot((()=>{{const e=new Set(i.map((({name:e})=>e))),t=yt.attributes[0];let s=t.name,r=0;for(;e.has(s);)++r,s=`${t.name}-${r}`;return{...t,name:s}}})())})},`devtools-suggestion-input[data-path="attributes.${s+1}.name"]`,10)})}
          ${this.#yt({class:"remove-attribute-assertion",title:$t(St.removeSelectorPart),iconName:"minus",onClick:this.#gt({attributes:new nt({[s]:void 0})},`devtools-suggestion-input[data-path="attributes.${Math.min(s,i.length-2)}.value"]`,10)})}
        </div>`))}
    </div>`}#Rt(){return[...wt[this.state.type].optional].filter((e=>void 0===this.state[e])).map((e=>ct`<devtools-button
          .variant=${"secondary"}
          class="add-row"
          data-attribute=${e}
          jslog=${n.action(`add-${d.StringUtilities.toKebabCase(e)}`)}
          @click=${this.#ft}
        >
          ${$t(St.addAttribute,{attributeName:e})}
        </devtools-button>`))}#mt=e=>{this.updateComplete.then((()=>{const t=this.renderRoot.querySelector(e);t?.focus()}))};render(){this.#dt=new Set;const e=ct`
      <div class="wrapper" jslog=${n.tree("step-editor")}>
        ${this.#St(this.isTypeEditable)} ${this.#xt("target")}
        ${this.#$t()} ${this.#kt()}
        ${this.#xt("deviceType")} ${this.#xt("button")}
        ${this.#xt("url")} ${this.#xt("x")}
        ${this.#xt("y")} ${this.#xt("offsetX")}
        ${this.#xt("offsetY")} ${this.#xt("value")}
        ${this.#xt("key")} ${this.#xt("operator")}
        ${this.#xt("count")} ${this.#xt("expression")}
        ${this.#xt("duration")} ${this.#Tt()}
        ${this.#xt("timeout")} ${this.#xt("width")}
        ${this.#xt("height")} ${this.#xt("deviceScaleFactor")}
        ${this.#xt("isMobile")} ${this.#xt("hasTouch")}
        ${this.#xt("isLandscape")} ${this.#xt("download")}
        ${this.#xt("upload")} ${this.#xt("latency")}
        ${this.#xt("name")} ${this.#xt("parameters")}
        ${this.#xt("visible")} ${this.#xt("properties")}
        ${this.#Et()}
        ${this.error?ct`
              <div class="error">
                ${$t(St.notSaved,{error:this.error})}
              </div>
            `:void 0}
        ${this.disabled?void 0:ct`<div
              class="row-buttons wrapped gap row regular-font no-margin"
            >
              ${this.#Rt()}
            </div>`}
      </div>
    `;for(const e of Object.keys(ft))if(!this.#dt.has(e))throw new Error(`The editable attribute ${e} does not have UI`);return e}};lt([mt()],Rt.prototype,"state",void 0),lt([mt()],Rt.prototype,"error",void 0),lt([gt()],Rt.prototype,"isTypeEditable",void 0),lt([gt()],Rt.prototype,"disabled",void 0),Rt=lt([ut("devtools-recorder-step-editor")],Rt);var Ct=Object.freeze({__proto__:null,StepEditedEvent:kt,EditorState:Tt,get StepEditor(){return Rt}});export{M as ControlButton,D as CreateRecordingView,X as RecordingListView,He as RecordingView,me as ReplayButton,ne as SelectButton,tt as StartView,Ct as StepEditor,je as StepView,ye as TimelineSection};
