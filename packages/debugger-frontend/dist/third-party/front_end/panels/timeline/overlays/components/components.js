import"../../../../ui/components/icon_button/icon_button.js";import*as e from"../../../../core/i18n/i18n.js";import"../../../../models/trace/trace.js";import*as t from"../../../../ui/legacy/theme_support/theme_support.js";import*as i from"../../../../ui/lit/lit.js";import{render as n,html as o}from"../../../../ui/lit/lit.js";import*as s from"../../../../ui/visual_logging/visual_logging.js";import"../../../../ui/components/tooltips/tooltips.js";import"../../../../ui/components/spinners/spinners.js";import*as r from"../../../../core/common/common.js";import*as a from"../../../../core/host/host.js";import*as l from"../../../../core/platform/platform.js";import*as c from"../../../../core/root/root.js";import*as h from"../../../../models/ai_assistance/ai_assistance.js";import"../../../../ui/components/buttons/buttons.js";import*as d from"../../../../ui/components/helpers/helpers.js";import*as b from"../../../../ui/legacy/legacy.js";import*as p from"../../../common/common.js";var u={cssText:`.connectorContainer{display:flex;width:100%;height:100%}.entry-wrapper{pointer-events:none;position:absolute;display:block;border:2px solid var(--color-text-primary);box-sizing:border-box;&.cut-off-top{border-top:none}&.cut-off-bottom{border-bottom:none}&.cut-off-right{border-right:none}&.cut-off-left{border-left:none}}.entry-is-not-source{border:2px dashed var(--color-text-primary)}.create-link-icon{pointer-events:auto;cursor:pointer;color:var(--sys-color-on-surface);width:16px;height:16px;position:absolute}\n/*# sourceURL=${import.meta.resolve("./entriesLinkOverlay.css")} */\n`};const y={diagram:"Links bteween entries"},g=e.i18n.registerUIStrings("panels/timeline/overlays/components/EntriesLinkOverlay.ts",y),m=e.i18n.getLocalizedString.bind(void 0,g),v=new CSSStyleSheet;v.replaceSync(u.cssText);class f extends Event{static eventName="entrylinkstartcreating";constructor(){super(f.eventName,{bubbles:!0,composed:!0})}}let w=class extends HTMLElement{#e=this.attachShadow({mode:"open"});#t;#i;#n;#o=null;#s=null;#r=null;#a=null;#l=null;#c=null;#h=null;#d=!0;#b=!0;#p=null;#u=!0;#y=!0;#g=!1;#m;constructor(e,t){super(),this.#v(),this.#t={x:e.x,y:e.y},this.#i={width:e.width,height:e.height},this.#n={x:e.x,y:e.y},this.#s=this.#e.querySelector(".connectorContainer")??null,this.#r=this.#s?.querySelector("line")??null,this.#a=this.#e.querySelector(".from-highlight-wrapper")??null,this.#l=this.#e.querySelector(".to-highlight-wrapper")??null,this.#c=this.#s?.querySelector(".entryFromConnector")??null,this.#h=this.#s?.querySelector(".entryToConnector")??null,this.#m=t,this.#v()}set canvasRect(e){null!==e&&(this.#p&&this.#p.width===e.width&&this.#p.height===e.height||(this.#p=e,this.#v()))}entryFromWrapper(){return this.#a}entryToWrapper(){return this.#l}connectedCallback(){this.#e.adoptedStyleSheets=[v]}set hideArrow(e){this.#g=e,this.#r&&(this.#r.style.display=e?"none":"block")}set fromEntryCoordinateAndDimensions(e){this.#t={x:e.x,y:e.y},this.#i={width:e.length,height:e.height},this.#f(),this.#w()}set entriesVisibility(e){this.#d=e.fromEntryVisibility,this.#b=e.toEntryVisibility,this.#w()}set toEntryCoordinateAndDimensions(e){this.#n={x:e.x,y:e.y},e.length&&e.height?this.#o={width:e.length,height:e.height}:this.#o=null,this.#f(),this.#w()}set fromEntryIsSource(e){e!==this.#u&&(this.#u=e,this.#v())}set toEntryIsSource(e){e!==this.#y&&(this.#y=e,this.#v())}#w(){if(!(this.#r&&this.#a&&this.#l&&this.#c&&this.#h))return void console.error("`connector` element is missing.");if("creation_not_started"===this.#m)return this.#c.setAttribute("visibility","hidden"),void this.#h.setAttribute("visibility","hidden");const e=this.#d&&!this.#g&&this.#u&&this.#i.width>=8,i=this.#o?.width??0,n=!this.#g&&this.#b&&this.#y&&i>=8&&!this.#g;this.#c.setAttribute("visibility",e?"visible":"hidden"),this.#h.setAttribute("visibility",n?"visible":"hidden");const o=this.#i.height/2;if(this.#d){const e=String(this.#t.x+this.#i.width),t=String(this.#t.y+o);this.#r.setAttribute("x1",e),this.#r.setAttribute("y1",t),this.#c.setAttribute("cx",e),this.#c.setAttribute("cy",t),this.#a.style.visibility="visible"}else this.#r.setAttribute("x1",(this.#t.x+this.#i.width).toString()),this.#r.setAttribute("y1",String(this.#t.y+o)),this.#a.style.visibility="hidden";if(this.#o&&this.#b){const e=String(this.#n.x),t=String(this.#n.y+this.#o.height/2);this.#r.setAttribute("x2",e),this.#r.setAttribute("y2",t),this.#h.setAttribute("cx",e),this.#h.setAttribute("cy",t),this.#l.style.visibility="visible"}else if(this.#l.style.visibility="hidden",this.#r.setAttribute("x2",this.#n.x.toString()),this.#o){const e=this.#o.height/2;this.#r.setAttribute("y2",String(this.#n.y+e))}else this.#r.setAttribute("y2",this.#n.y.toString());if(this.#r.setAttribute("stroke-width","2"),this.#o&&this.#d&&!this.#b)this.#r.setAttribute("stroke","url(#fromVisibleLineGradient)");else if(this.#o&&this.#b&&!this.#d)this.#r.setAttribute("stroke","url(#toVisibleLineGradient)");else{const e=t.ThemeSupport.instance().getComputedValue("--color-text-primary");this.#r.setAttribute("stroke",e)}this.#v()}#x(){if(!this.#p)return 100;const e=this.#n.x-(this.#t.x+this.#i.width);let t=0;this.#d&&!this.#b?t=this.#p.width-(this.#t.x+this.#i.width):!this.#d&&this.#b&&(t=this.#n.x);const i=100*t/e;return i<100?i:100}#f(){const e=this.#e.querySelector(".create-link-box"),t=e?.querySelector(".create-link-icon")??null;e&&t?"creation_not_started"===this.#m?(t.style.left=`${this.#t.x+this.#i.width}px`,t.style.top=`${this.#t.y}px`):t.style.display="none":console.error("creating element is missing.")}#L(){this.#m="pending_to_event",this.dispatchEvent(new f)}#v(){const e=t.ThemeSupport.instance().getComputedValue("--color-text-primary");n(o`
          <svg class="connectorContainer" width="100%" height="100%" role="region" aria-label=${m(y.diagram)}>
            <defs>
              <linearGradient
                id="fromVisibleLineGradient"
                x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stop-color=${e}
                  stop-opacity="1" />
                <stop
                  offset="${this.#x()}%"
                  stop-color=${e}
                  stop-opacity="0" />
              </linearGradient>

              <linearGradient
                id="toVisibleLineGradient"
                x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="${100-this.#x()}%"
                  stop-color=${e}
                  stop-opacity="0" />
                <stop
                  offset="100%"
                  stop-color=${e}
                  stop-opacity="1" />
              </linearGradient>
              <marker
                id="arrow"
                orient="auto"
                markerWidth="3"
                markerHeight="4"
                fill-opacity="1"
                refX="4"
                refY="2"
                visibility=${this.#b||!this.#o?"visible":"hidden"}>
                <path d="M0,0 V4 L4,2 Z" fill=${e} />
              </marker>
            </defs>
            <line
              marker-end="url(#arrow)"
              stroke-dasharray=${this.#u&&this.#y?"none":E}
              visibility=${this.#d||this.#b?"visible":"hidden"}
              />
            <circle class="entryFromConnector" fill="none" stroke=${e} stroke-width=${L} r=${x} />
            <circle class="entryToConnector" fill="none" stroke=${e} stroke-width=${L} r=${x} />
          </svg>
          <div class="entry-wrapper from-highlight-wrapper ${this.#u?"":"entry-is-not-source"}"></div>
          <div class="entry-wrapper to-highlight-wrapper ${this.#y?"":"entry-is-not-source"}"></div>
          <div class="create-link-box ${this.#m?"visible":"hidden"}">
            <devtools-icon
              class='create-link-icon'
              jslog=${s.action("timeline.annotations.create-entry-link").track({click:!0})}
              @click=${this.#L}
              name='arrow-right-circle'>
            </devtools-icon>
          </div>
        `,this.#e,{host:this})}};const x=2,L=1,E=4;customElements.define("devtools-entries-link-overlay",w);var A=Object.freeze({__proto__:null,EntriesLinkOverlay:w,EntryLinkStartCreating:f}),C={cssText:`.label-parts-wrapper{display:flex;flex-direction:column;align-items:center}.label-button-input-wrapper{display:flex;position:relative;overflow:visible}.ai-label-button-wrapper,\n.ai-label-disabled-button-wrapper,\n.ai-label-loading,\n.ai-label-error{position:absolute;left:100%;display:flex;transform:translateY(-3px);flex-flow:row nowrap;border:none;border-radius:var(--sys-shape-corner-large);background:var(--sys-color-surface3);box-shadow:var(--drop-shadow);align-items:center;gap:var(--sys-size-4);pointer-events:auto;transition:all var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);&.only-pen-wrapper{overflow:hidden;width:var(--sys-size-12);height:var(--sys-size-12)}*{transform:translateX(-2px)}}.ai-label-loading,\n.ai-label-error{gap:var(--sys-size-6);padding:var(--sys-size-5) var(--sys-size-8)}.ai-label-button-wrapper:focus,\n.ai-label-button-wrapper:focus-within,\n.ai-label-button-wrapper:hover{width:auto;height:var(--sys-size-13);padding:var(--sys-size-3) var(--sys-size-5);transform:translateY(-9px);*{transform:translateX(0)}}.ai-label-button{display:flex;align-items:center;gap:var(--sys-size-4);padding:var(--sys-size-3) var(--sys-size-5);border:1px solid var(--color-primary);border-radius:var(--sys-shape-corner-large);&.enabled{background:var(--sys-color-surface3)}&.disabled{background:var(--sys-color-surface5)}&:hover{background:var(--sys-color-state-hover-on-subtle)}}.generate-label-text{white-space:nowrap;color:var(--color-primary)}.input-field{background-color:var(--color-background-inverted);color:var(--color-background);pointer-events:auto;border-radius:var(--sys-shape-corner-extra-small);white-space:nowrap;padding:var(--sys-size-3) var(--sys-size-4);font-family:var(--default-font-family);font-size:var(--sys-typescale-body2-size);font-weight:var(--ref-typeface-weight-medium)}.input-field:focus,\n.label-parts-wrapper:focus-within .input-field,\n.input-field.fake-focus-state{background-color:var(--color-background);color:var(--color-background-inverted);outline:2px solid var(--color-background-inverted)}.connectorContainer{overflow:visible}.entry-highlight-wrapper{box-sizing:border-box;border:2px solid var(--sys-color-on-surface);&.cut-off-top{border-top:none}&.cut-off-bottom{border-bottom:none}&.cut-off-right{border-right:none}&.cut-off-left{border-left:none}}.info-tooltip-container{max-width:var(--sys-size-28);button.link{cursor:pointer;text-decoration:underline;border:none;padding:0;background:none;font:inherit;font-weight:var(--ref-typeface-weight-medium);display:block;margin-top:var(--sys-size-4);color:var(--sys-color-primary)}}\n/*# sourceURL=${import.meta.resolve("./entryLabelOverlay.css")} */\n`};const{html:k,Directives:T}=i,S=new CSSStyleSheet;S.replaceSync(C.cssText);const R={entryLabel:"Entry label",inputTextPrompt:"Enter an annotation label",generateLabelButton:"Generate label",freDialog:"Get AI-powered annotation suggestions dialog",learnMoreAriaLabel:"Learn more about auto annotations in settings",moreInfoAriaLabel:"More info"},I="Learn more in settings",_="The selected call stack is sent to Google. The content you submit and that is generated by this feature will be used to improve Google’s AI models. This is an experimental AI feature and won’t always get it right.",$="The selected call stack is sent to Google. The content you submit and that is generated by this feature will not be used to improve Google’s AI models. This is an experimental AI feature and won’t always get it right.",B="Auto annotations are not available.",F="Auto annotations are not available because you are offline.",N="Get AI-powered annotation suggestions",D="Generating label",H="Generation failed",O="This feature uses AI and won’t always get it right",V="Performance trace is sent to Google to generate annotation suggestions",G="You can control this feature in the",z="settings panel",P="Learn more about auto annotations",j=e.i18n.registerUIStrings("panels/timeline/overlays/components/EntryLabelOverlay.ts",R),M=e.i18n.getLocalizedString.bind(void 0,j),W=e.i18n.lockedString;function U(){return!c.Runtime.hostConfig.aidaAvailability?.disallowLogging}class q extends Event{static eventName="emptyentrylabelremoveevent";constructor(){super(q.eventName)}}class K extends Event{newLabel;static eventName="entrylabelchangeevent";constructor(e){super(K.eventName),this.newLabel=e}}class Y extends Event{isVisible;static eventName="labelannotationsconsentdialogvisiblitychange";constructor(e){super(Y.eventName,{bubbles:!0,composed:!0}),this.isVisible=e}}let X=class e extends HTMLElement{static LABEL_AND_CONNECTOR_SHIFT_LENGTH=8;static LABEL_CONNECTOR_HEIGHT=7;static LABEL_HEIGHT=17;static LABEL_PADDING=4;static LABEL_AND_CONNECTOR_HEIGHT=e.LABEL_HEIGHT+2*e.LABEL_PADDING+e.LABEL_CONNECTOR_HEIGHT;static MAX_LABEL_LENGTH=100;#e=this.attachShadow({mode:"open"});#E=this.#v.bind(this);#A=!1;#C=!0;#k=null;#T=null;#S=null;#R=null;#s=null;#I;#_;#$=T.createRef();#B=null;#F=r.Settings.Settings.instance().createSetting("ai-annotations-enabled",!1);#N=new h.PerformanceAnnotationsAgent({aidaClient:new a.AidaClient.AidaClient,serverSideLoggingEnabled:U()});#D=!1;#H=!1;#O=!1;constructor(e,t=!1){super(),this.#v(),this.#_=t,this.#T=this.#e.querySelector(".label-parts-wrapper"),this.#R=this.#T?.querySelector(".input-field")??null,this.#s=this.#T?.querySelector(".connectorContainer")??null,this.#S=this.#T?.querySelector(".entry-highlight-wrapper")??null,this.#I=e,this.#V(e),""!==e&&this.setLabelEditabilityAndRemoveEmptyLabel(!1);const i=""===e?M(R.inputTextPrompt):e;this.#R?.setAttribute("aria-label",i),this.#G()}overrideAIAgentForTest(e){this.#N=e}connectedCallback(){this.#e.adoptedStyleSheets=[S]}entryHighlightWrapper(){return this.#S}#z(){const e=this.#R?.textContent?.trim()??"";e!==this.#I&&(this.#I=e,this.dispatchEvent(new K(this.#I)),this.#R?.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))),this.#R?.setAttribute("aria-label",e)}#P(t){if(!this.#R)return!1;return t.key!==l.KeyboardUtilities.ENTER_KEY&&t.key!==l.KeyboardUtilities.ESCAPE_KEY||!this.#C?null!==this.#R.textContent&&this.#R.textContent.length<=e.MAX_LABEL_LENGTH||(!!["Backspace","Delete","ArrowLeft","ArrowRight"].includes(t.key)||(!(1!==t.key.length||!t.ctrlKey)||(t.preventDefault(),!1))):(this.#R.blur(),this.setLabelEditabilityAndRemoveEmptyLabel(!1),!1)}#j(t){t.preventDefault();const i=t.clipboardData;if(!i||!this.#R)return;const n=i.getData("text"),o=(this.#R.textContent+n).slice(0,e.MAX_LABEL_LENGTH+1);this.#R.textContent=o,this.#M()}set entryLabelVisibleHeight(e){e!==this.#k?(this.#k=e,d.ScheduledRender.scheduleRender(this,this.#E),this.#C&&this.#W(),this.#V(),this.#G()):this.#G()}#G(){if(!this.#s)return void console.error("`connectorLineContainer` element is missing.");if(this.#_&&this.#k){const t=this.#k+e.LABEL_CONNECTOR_HEIGHT;this.#s.style.transform=`translateY(${t}px) rotate(180deg)`}const i=this.#s.querySelector("line"),n=this.#s.querySelector("circle");if(!i||!n)return void console.error("Some entry label elements are missing.");this.#s.setAttribute("width",(2*e.LABEL_AND_CONNECTOR_SHIFT_LENGTH).toString()),this.#s.setAttribute("height",e.LABEL_CONNECTOR_HEIGHT.toString()),i.setAttribute("x1","0"),i.setAttribute("y1","0"),i.setAttribute("x2",e.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString()),i.setAttribute("y2",e.LABEL_CONNECTOR_HEIGHT.toString());const o=t.ThemeSupport.instance().getComputedValue("--color-text-primary");i.setAttribute("stroke",o),i.setAttribute("stroke-width","2"),n.setAttribute("cx",e.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString()),n.setAttribute("cy",e.LABEL_CONNECTOR_HEIGHT.toString()),n.setAttribute("r","3"),n.setAttribute("fill",o)}#V(t){if(!this.#R)return void console.error("`labelBox`element is missing.");"string"==typeof t&&(this.#R.innerText=t);let i=null,n=null;if(i=this.#_?e.LABEL_AND_CONNECTOR_SHIFT_LENGTH:-1*e.LABEL_AND_CONNECTOR_SHIFT_LENGTH,this.#_&&this.#k){n=this.#k+e.LABEL_HEIGHT+2*e.LABEL_PADDING+2*e.LABEL_CONNECTOR_HEIGHT}let o="";i&&(o+=`translateX(${i}px) `),n&&(o+=`translateY(${n}px)`),o.length&&(this.#R.style.transform=o)}#W(){this.#R?this.#R.focus():console.error("`labelBox` element is missing.")}setLabelEditabilityAndRemoveEmptyLabel(e){if(this.#D&&!1===e)return;e?this.setAttribute("data-user-editing-label","true"):this.removeAttribute("data-user-editing-label"),this.#C=e,this.#v(),e&&this.#R&&(this.#M(),this.#W());const t=this.#R?.textContent?.trim()??"";e||0!==t.length||this.#A||(this.#A=!0,this.dispatchEvent(new q))}#M(){if(!this.#R)return;const e=window.getSelection(),t=document.createRange();t.selectNodeContents(this.#R),t.collapse(!1),e?.removeAllRanges(),e?.addRange(t)}set callTree(e){this.#B=e}async#U(){if(this.#F.get()){if(!this.#B||!this.#R)return;try{this.#H=!0,b.ARIAUtils.alert(D),this.#v(),this.#W(),d.ScheduledRender.scheduleRender(this,this.#E),this.#I=await this.#N.generateAIEntryLabel(this.#B),this.dispatchEvent(new K(this.#I)),this.#R.innerText=this.#I,this.#H=!1,this.#v()}catch{this.#H=!1,this.#O=!0,d.ScheduledRender.scheduleRender(this,this.#E)}}else{this.#H=!1,this.#D=!0,this.#v();const e=await this.#q();this.#D=!1,this.setLabelEditabilityAndRemoveEmptyLabel(!0),e&&await this.#U()}}async#q(){this.dispatchEvent(new Y(!0));const e=await p.FreDialog.show({ariaLabel:M(R.freDialog),header:{iconName:"pen-spark",text:W(N)},reminderItems:[{iconName:"psychiatry",content:W(O)},{iconName:"google",content:W(V)},{iconName:"gear",content:k`
            ${W(G)}
            <button
              @click=${()=>{b.ViewManager.ViewManager.instance().showView("chrome-ai")}}
              class="link"
              role="link"
              jslog=${s.link("open-ai-settings").track({click:!0})}
              tabindex="0"
            >${W(z)}</button>`}],onLearnMoreClick:()=>{b.UIUtils.openInNewTab("https://developer.chrome.com/docs/devtools/performance/reference#auto-annotations")},learnMoreButtonTitle:P});return this.dispatchEvent(new Y(!1)),e&&this.#F.set(!0),this.#F.get()}#K(){const e=Boolean(c.Runtime.hostConfig.devToolsAiGeneratedTimelineLabels?.enabled),t=c.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===c.Runtime.GenAiEnterprisePolicyValue.DISABLE,i=null!==this.#B,n=this.#I?.length<=0;if(!e||t||!i||!n)return"hidden";const o=!c.Runtime.hostConfig.aidaAvailability?.blockedByAge&&!c.Runtime.hostConfig.aidaAvailability?.blockedByGeo&&!1==!navigator.onLine;return o?"enabled":o?(console.error("'Generate label' button is hidden for an unknown reason"),"hidden"):"disabled"}#Y(e){return k`<devtools-tooltip
    variant="rich"
    id="info-tooltip"
    ${T.ref(this.#$)}>
      <div class="info-tooltip-container">
        ${e.textContent}
        ${e.includeSettingsButton?k`
          <button
            class="link tooltip-link"
            role="link"
            jslog=${s.link("open-ai-settings").track({click:!0})}
            @click=${this.#X}
            aria-label=${M(R.learnMoreAriaLabel)}
          >${W(I)}</button>
        `:i.nothing}
      </div>
    </devtools-tooltip>`}#Z(){const e=c.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===c.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;return this.#H?k`
      <span
        class="ai-label-loading">
        <devtools-spinner></devtools-spinner>
        <span class="generate-label-text">${W(D)}</span>
      </span>
    `:this.#O?(this.#O=!1,k`
        <span
          class="ai-label-error">
          <devtools-icon
            class="warning"
            .name=${"warning"}
            .data=${{iconName:"warning",color:"var(--ref-palette-error50)",width:"20px"}}>
          </devtools-icon>
          <span class="generate-label-text">${W(H)}</span>
        </span>
      `):k`
      <!-- 'preventDefault' on the AI label button to prevent the label removal on blur  -->
      <span
        class="ai-label-button-wrapper only-pen-wrapper"
        @mousedown=${e=>e.preventDefault()}>
        <button
          class="ai-label-button enabled"
          @click=${this.#U}>
          <devtools-icon
            class="pen-icon"
            .name=${"pen-spark"}
            .data=${{iconName:"pen-spark",color:"var(--color-primary)",width:"20px"}}>
          </devtools-icon>
          <span class="generate-label-text">${M(R.generateLabelButton)}</span>
        </button>
        <devtools-button
          aria-details="info-tooltip"
          aria-label=${M(R.moreInfoAriaLabel)}
          class="pen-icon"
          .iconName=${"info"}
          .variant=${"icon"}
          ></devtools-button>
        ${this.#Y({textContent:W(e?$:_),includeSettingsButton:!0})}
      </span>
    `}#X(){this.#$?.value?.hidePopover(),b.ViewManager.ViewManager.instance().showView("chrome-ai")}#J(){const e=!1===navigator.onLine;return k`
      <!-- 'preventDefault' on the AI label button to prevent the label removal on blur  -->
      <span
        class="ai-label-disabled-button-wrapper only-pen-wrapper"
        @mousedown=${e=>e.preventDefault()}>
        <button
          class="ai-label-button disabled"
          ?disabled=${!0}
          @click=${this.#U}>
          <devtools-icon
            aria-details="info-tooltip"
            class="pen-icon"
            .name=${"pen-spark"}
            .data=${{iconName:"pen-spark",color:"var(--sys-color-state-disabled)",width:"20px"}}>
          </devtools-icon>
        </button>
        ${this.#Y({textContent:W(e?F:B),includeSettingsButton:!e})}
      </span>
    `}#Q(){requestAnimationFrame((()=>{this.hasFocus()||this.setLabelEditabilityAndRemoveEmptyLabel(!1)}))}#v(){const e=i.Directives.classMap({"input-field":!0,"fake-focus-state":this.#D});i.render(k`
        <span class="label-parts-wrapper" role="region" aria-label=${M(R.entryLabel)}
          @focusout=${this.#Q}
        >
          <span
            class="label-button-input-wrapper">
            <span
              class=${e}
              role="textbox"
              @focus=${()=>{this.setLabelEditabilityAndRemoveEmptyLabel(!0)}}
              @dblclick=${()=>{this.setLabelEditabilityAndRemoveEmptyLabel(!0)}}
              @keydown=${this.#P}
              @paste=${this.#j}
              @keyup=${()=>{this.#z(),this.#v()}}
              contenteditable=${!!this.#C&&"plaintext-only"}
              jslog=${s.textField("timeline.annotations.entry-label-input").track({keydown:!0,click:!0,change:!0})}
              tabindex="0"
            ></span>
            ${(()=>{switch(this.#K()){case"hidden":return i.nothing;case"enabled":return this.#Z();case"disabled":return this.#J()}})()}
          </span>
          <svg class="connectorContainer">
            <line/>
            <circle/>
          </svg>
          <div class="entry-highlight-wrapper"></div>
        </span>`,this.#e,{host:this})}};customElements.define("devtools-entry-label-overlay",X);var Z=Object.freeze({__proto__:null,EmptyEntryLabelRemoveEvent:q,EntryLabelChangeEvent:K,EntryLabelOverlay:X,LabelAnnotationsConsentDialogVisiblityChange:Y}),J={cssText:`:host{display:flex;overflow:hidden;flex-direction:column;justify-content:flex-end;width:100%;height:100%;box-sizing:border-box;padding-bottom:5px;background:linear-gradient(180deg,rgb(255 125 210/0%) 0%,rgb(255 125 210/15%) 85%);border-color:var(--ref-palette-pink55);border-width:0 1px 5px;border-style:solid;pointer-events:none}.range-container{display:flex;align-items:center;flex-direction:column;text-align:center;box-sizing:border-box;pointer-events:all;user-select:none;color:var(--sys-color-pink);&.labelHidden{user-select:none;pointer-events:none;visibility:hidden}&.offScreenLeft{align-items:flex-start;text-align:left}&.offScreenRight{align-items:flex-end;text-align:right}}.label-text{width:100%;max-width:70px;min-width:fit-content;text-overflow:ellipsis;overflow:hidden;word-break:normal;overflow-wrap:anywhere;margin-bottom:3px;display:-webkit-box;white-space:break-spaces;-webkit-line-clamp:2;-webkit-box-orient:vertical}.label-text[contenteditable='true']{outline:none;box-shadow:0 0 0 1px var(--ref-palette-pink55)}\n/*# sourceURL=${import.meta.resolve("./timeRangeOverlay.css")} */\n`};const Q=new CSSStyleSheet;Q.replaceSync(J.cssText);const ee={timeRange:"Time range"},te=e.i18n.registerUIStrings("panels/timeline/overlays/components/TimeRangeOverlay.ts",ee),ie=e.i18n.getLocalizedString.bind(void 0,te);class ne extends Event{newLabel;static eventName="timerangelabelchange";constructor(e){super(ne.eventName),this.newLabel=e}}class oe extends Event{static eventName="timerangeremoveevent";constructor(){super(oe.eventName)}}let se=class extends HTMLElement{#e=this.attachShadow({mode:"open"});#ee=null;#p=null;#I;#C=!0;#te=null;#ie=null;connectedCallback(){this.#e.adoptedStyleSheets=[Q]}constructor(e){super(),this.#v(),this.#te=this.#e.querySelector(".range-container"),this.#ie=this.#te?.querySelector(".label-text")??null,this.#I=e,this.#ie?(this.#ie.innerText=e,e&&(this.#ie?.setAttribute("aria-label",e),this.#ne(!1))):console.error("`labelBox` element is missing.")}set canvasRect(e){null!==e&&(this.#p&&this.#p.width===e.width&&this.#p.height===e.height||(this.#p=e,this.#v()))}set duration(e){e!==this.#ee&&(this.#ee=e,this.#v())}#oe(e){if(!this.#p)return 0;const{x:t,width:i}=e,n=t+i,o=this.#p.x,s=this.#p.x+this.#p.width,r=Math.max(o,t);return Math.min(s,n)-r}updateLabelPositioning(){if(!this.#te)return;if(!this.#p||!this.#ie)return;const e=this.getBoundingClientRect(),t=this.#e.activeElement===this.#ie,i=this.#te.getBoundingClientRect(),n=this.#oe(e)-9,o=this.#te.querySelector(".duration")??null,s=o?.getBoundingClientRect().width;if(!s)return;const r=n<=s&&!t&&this.#I.length>0;if(this.#te.classList.toggle("labelHidden",r),r)return;const a=(e.width-i.width)/2,l=e.x+a<this.#p.x;this.#te.classList.toggle("offScreenLeft",l);const c=this.#p.x+this.#p.width,h=e.x+a+i.width>c;this.#te.classList.toggle("offScreenRight",h),l?this.#te.style.marginLeft=`${Math.abs(this.#p.x-e.x)+9}px`:h?this.#te.style.marginRight=e.right-this.#p.right+9+"px":this.#te.style.margin="0px",""===this.#ie?.innerText&&this.#ne(!0)}#W(){this.#ie?this.#ie.focus():console.error("`labelBox` element is missing.")}#ne(e){""!==this.#ie?.innerText?(this.#C=e,this.#v(),e&&this.#W()):this.#W()}#z(){const e=this.#ie?.textContent??"";e!==this.#I&&(this.#I=e,this.dispatchEvent(new ne(this.#I)),this.#ie?.setAttribute("aria-label",e))}#P(e){return e.key!==l.KeyboardUtilities.ENTER_KEY&&e.key!==l.KeyboardUtilities.ESCAPE_KEY||(e.stopPropagation(),""===this.#I&&this.dispatchEvent(new oe),this.#ie?.blur(),!1)}#v(){const t=this.#ee?e.TimeUtilities.formatMicroSecondsTime(this.#ee):"";n(o`
          <span class="range-container" role="region" aria-label=${ie(ee.timeRange)}>
            <span
             class="label-text"
             role="textbox"
             @focusout=${()=>this.#ne(!1)}
             @dblclick=${()=>this.#ne(!0)}
             @keydown=${this.#P}
             @keyup=${this.#z}
             contenteditable=${!!this.#C&&"plaintext-only"}
             jslog=${s.textField("timeline.annotations.time-range-label-input").track({keydown:!0,click:!0})}
            ></span>
            <span class="duration">${t}</span>
          </span>
          `,this.#e,{host:this}),this.updateLabelPositioning()}};customElements.define("devtools-time-range-overlay",se);var re=Object.freeze({__proto__:null,TimeRangeLabelChangeEvent:ne,TimeRangeOverlay:se,TimeRangeRemoveEvent:oe}),ae={cssText:`.timespan-breakdown-overlay-section{border:solid;border-color:var(--sys-color-on-surface);border-width:4px 1px 0;align-content:flex-start;text-align:center;overflow:hidden;text-overflow:ellipsis;background-image:linear-gradient(180deg,var(--sys-color-on-primary),transparent);height:90%;box-sizing:border-box;padding-top:var(--sys-size-2);:host(.is-below) &{border-top-width:0;border-bottom-width:4px;align-content:flex-end;padding-bottom:var(--sys-size-2);padding-top:0;.timespan-breakdown-overlay-label{display:flex;flex-direction:column-reverse}}}:host{display:flex;overflow:hidden;flex-direction:row;justify-content:flex-end;align-items:flex-end;width:100%;box-sizing:border-box;height:100%;max-height:100px;.timespan-breakdown-overlay-section:first-child{border-left-width:1px!important}.timespan-breakdown-overlay-section:last-child{border-right-width:1px!important}}:host(.is-below){align-items:flex-start}:host(.odd-number-of-sections){.timespan-breakdown-overlay-section:nth-child(even){height:100%}.timespan-breakdown-overlay-section:nth-child(odd){border-left-width:0;border-right-width:0}}:host(.even-number-of-sections){.timespan-breakdown-overlay-section:nth-child(odd){height:100%}.timespan-breakdown-overlay-section:nth-child(even){border-left-width:0;border-right-width:0}}.timespan-breakdown-overlay-label{font-family:var(--default-font-family);font-size:var(--sys-typescale-body2-size);line-height:var(--sys-typescale-body4-line-height);font-weight:var(--ref-typeface-weight-medium);color:var(--sys-color-on-surface);text-align:center;box-sizing:border-box;width:max-content;padding:0 3px;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;.duration-text{font-size:var(--sys-typescale-body4-size);text-overflow:ellipsis;overflow:hidden;text-wrap:nowrap;display:block}.discovery-time-ms{font-weight:var(--ref-typeface-weight-bold)}&.labelHidden{user-select:none;pointer-events:none;visibility:hidden}&.labelTruncated{max-width:100%}&.offScreenLeft{text-align:left}&.offScreenRight{text-align:right}}\n/*# sourceURL=${import.meta.resolve("./timespanBreakdownOverlay.css")} */\n`};const le=new CSSStyleSheet;le.replaceSync(ae.cssText);const{html:ce}=i;let he=class extends HTMLElement{#e=this.attachShadow({mode:"open"});#p=null;#se=null;connectedCallback(){this.#e.adoptedStyleSheets=[le]}set isBelowEntry(e){this.classList.toggle("is-below",e)}set canvasRect(e){this.#p&&e&&this.#p.width===e.width&&this.#p.height===e.height||(this.#p=e,this.#v())}set sections(e){e!==this.#se&&(this.#se=e,this.#v())}checkSectionLabelPositioning(){const e=this.#e.querySelectorAll(".timespan-breakdown-overlay-section");if(!e)return;if(!this.#p)return;const t=new Map;for(const i of e){const e=i.querySelector(".timespan-breakdown-overlay-label");if(!e)continue;const n=i.getBoundingClientRect(),o=e.getBoundingClientRect();t.set(i,{sectionRect:n,labelRect:o,label:e})}for(const i of e){const e=t.get(i);if(!e)break;const{labelRect:n,sectionRect:o,label:s}=e,r=o.width<30,a=o.width-5<=n.width;if(s.classList.toggle("labelHidden",r),s.classList.toggle("labelTruncated",a),r||a)continue;const l=(o.width-n.width)/2,c=o.x+l<this.#p.x;s.classList.toggle("offScreenLeft",c);const h=this.#p.x+this.#p.width,d=o.x+l+n.width>h;if(s.classList.toggle("offScreenRight",d),c)s.style.marginLeft=`${Math.abs(this.#p.x-o.x)+9}px`;else if(d){const e=h-n.width-o.x;s.style.marginLeft=`${e}px`}else s.style.marginLeft=`${l}px`}}renderedSections(){return Array.from(this.#e.querySelectorAll(".timespan-breakdown-overlay-section"))}#re(t){return ce`
      <div class="timespan-breakdown-overlay-section">
        <div class="timespan-breakdown-overlay-label">
        ${t.showDuration?ce`
            <span class="duration-text">${e.TimeUtilities.formatMicroSecondsAsMillisFixed(t.bounds.range)}</span>
          `:i.nothing}
          <span class="section-label-text">
            ${t.label}
          </span>
        </div>
      </div>`}#v(){this.#se&&(this.classList.toggle("odd-number-of-sections",this.#se.length%2==1),this.classList.toggle("even-number-of-sections",this.#se.length%2==0)),i.render(ce`${this.#se?.map(this.#re)}`,this.#e,{host:this}),this.checkSectionLabelPositioning()}};customElements.define("devtools-timespan-breakdown-overlay",he);var de=Object.freeze({__proto__:null,TimespanBreakdownOverlay:he});export{A as EntriesLinkOverlay,Z as EntryLabelOverlay,re as TimeRangeOverlay,de as TimespanBreakdownOverlay};
