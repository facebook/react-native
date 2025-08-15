import*as e from"../../../ui/components/helpers/helpers.js";import*as t from"../../../ui/lit/lit.js";import{render as r,html as s,nothing as o}from"../../../ui/lit/lit.js";import*as i from"../../../ui/visual_logging/visual_logging.js";import*as a from"../../../ui/legacy/legacy.js";import*as n from"../../../core/host/host.js";import*as d from"../../../core/i18n/i18n.js";import*as l from"../../../core/platform/platform.js";import*as h from"../../../core/sdk/sdk.js";import*as c from"../../../third_party/chromium/client-variations/client-variations.js";import"../../../ui/components/buttons/buttons.js";import"../forward/forward.js";import*as u from"../../../core/common/common.js";import*as p from"../../../models/persistence/persistence.js";import*as v from"../../../models/workspace/workspace.js";import*as m from"../../../ui/components/input/input.js";import*as g from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as f from"../../../ui/components/render_coordinator/render_coordinator.js";import*as w from"../../sources/sources.js";import*as y from"../../../models/issues_manager/issues_manager.js";import"../../../ui/components/report_view/report_view.js";import"../../../ui/components/icon_button/icon_button.js";import"../../../ui/legacy/components/data_grid/data_grid.js";import{PanelUtils as b}from"../../utils/utils.js";var k={cssText:`:host{display:inline}.editable{cursor:text;overflow-wrap:anywhere;min-height:18px;line-height:18px;min-width:0.5em;background:transparent;border:none;border-radius:4px;outline:none;display:inline-block;font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);&:hover{border:1px solid var(--sys-color-neutral-outline)}&:focus{border:1px solid var(--sys-color-state-focus-ring)}}.editable::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}\n/*# sourceURL=${import.meta.resolve("./EditableSpan.css")} */\n`};const x=new CSSStyleSheet;x.replaceSync(k.cssText);class S extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=this.#r.bind(this);#s="";connectedCallback(){this.#e.adoptedStyleSheets=[x],this.#e.addEventListener("focusin",this.#o.bind(this)),this.#e.addEventListener("keydown",this.#i.bind(this)),this.#e.addEventListener("input",this.#a.bind(this))}set data(t){this.#s=t.value,e.ScheduledRender.scheduleRender(this,this.#t)}get value(){return this.#e.querySelector("span")?.innerText||""}set value(e){this.#s=e;const t=this.#e.querySelector("span");t&&(t.innerText=e)}#i(e){"Enter"===e.key&&(e.preventDefault(),e.target?.blur())}#a(e){this.#s=e.target.innerText}#o(e){const t=e.target,r=window.getSelection(),s=document.createRange();s.selectNodeContents(t),r?.removeAllRanges(),r?.addRange(s)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");r(s`<span
        contenteditable="plaintext-only"
        class="editable"
        tabindex="0"
        .innerText=${this.#s}
        jslog=${i.value("header-editor").track({change:!0,keydown:"Enter|Escape"})}
    </span>`,this.#e,{host:this})}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".editable");e?.focus()}))}}customElements.define("devtools-editable-span",S);var R=Object.freeze({__proto__:null,EditableSpan:S}),E={cssText:`:host{display:block}.row{display:flex;line-height:18px;padding-left:8px;gap:var(--sys-size-6);user-select:text;margin:var(--sys-size-3) 0}.row.header-editable{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.header-name{font:var(--sys-typescale-body5-medium);color:var(--sys-color-on-surface-subtle);width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize;overflow-wrap:break-word}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.header-name.pseudo-header{text-transform:none}.header-editable .header-name{color:var(--sys-color-token-property-special)}.row.header-deleted .header-name{color:var(--sys-color-token-subtle)}.header-value{display:flex;overflow-wrap:anywhere;margin-inline-end:14px;font:var(--sys-typescale-body4-regular)}.header-badge-text{font-variant:small-caps;font-weight:500;white-space:pre-wrap;word-break:break-all;text-transform:none}.header-badge{display:inline;background-color:var(--sys-color-error);color:var(--sys-color-on-error);border-radius:100vh;padding-left:6px;padding-right:6px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}.row-flex-icon{margin:2px 5px 0}.header-value code{display:block;white-space:pre-wrap;font-size:90%;color:var(--sys-color-token-subtle)}x-link .inline-icon{padding-right:3px}.header-highlight{background-color:var(--sys-color-yellow-container)}.header-warning{color:var(--sys-color-error)}.header-overridden{background-color:var(--sys-color-tertiary-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.header-deleted{background-color:var(--sys-color-surface-error);border-left:3px solid var(--sys-color-error-bright);color:var(--sys-color-token-subtle);text-decoration:line-through}.header-highlight.header-overridden{background-color:var(--sys-color-yellow-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.inline-button{vertical-align:middle}.row .inline-button{opacity:0%;visibility:hidden;transition:opacity 200ms;padding-left:2px}.row.header-overridden:focus-within .inline-button,\n.row.header-overridden:hover .inline-button{opacity:100%;visibility:visible}.row:hover .inline-button.enable-editing{opacity:100%;visibility:visible}.flex-right{margin-left:auto}.flex-columns{flex-direction:column}\n/*# sourceURL=${import.meta.resolve("./HeaderSectionRow.css")} */\n`};const H=new CSSStyleSheet;H.replaceSync(E.cssText);const{render:q,html:$}=t,C={activeClientExperimentVariation:"Active `client experiment variation IDs`.",activeClientExperimentVariationIds:"Active `client experiment variation IDs` that trigger server-side behavior.",decoded:"Decoded:",editHeader:"Override header",headerNamesOnlyLetters:"Header names should contain only letters, digits, hyphens or underscores",learnMore:"Learn more",learnMoreInTheIssuesTab:"Learn more in the issues tab",reloadPrompt:"Refresh the page/request for these changes to take effect",removeOverride:"Remove this header override"},T=d.i18n.registerUIStrings("panels/network/components/HeaderSectionRow.ts",C),O=d.i18n.getLocalizedString.bind(void 0,T),N=e=>/^[a-z0-9_\-]+$/i.test(e),A=(e,t)=>e?.replaceAll(/\s/g," ")===t?.replaceAll(/\s/g," ");class D extends Event{static eventName="headeredited";headerName;headerValue;constructor(e,t){super(D.eventName,{}),this.headerName=e,this.headerValue=t}}class L extends Event{static eventName="headerremoved";headerName;headerValue;constructor(e,t){super(L.eventName,{}),this.headerName=e,this.headerValue=t}}class I extends Event{static eventName="enableheaderediting";constructor(){super(I.eventName,{})}}class U extends HTMLElement{#e=this.attachShadow({mode:"open"});#n=null;#t=this.#r.bind(this);#d=!1;#l=!0;connectedCallback(){this.#e.adoptedStyleSheets=[H]}set data(t){this.#n=t.header,this.#d=void 0!==this.#n.originalValue&&this.#n.value!==this.#n.originalValue,this.#l=N(this.#n.name),e.ScheduledRender.scheduleRender(this,this.#t)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");if(!this.#n)return;const r=t.Directives.classMap({row:!0,"header-highlight":Boolean(this.#n.highlight),"header-overridden":Boolean(this.#n.isOverride)||this.#d,"header-editable":1===this.#n.valueEditable,"header-deleted":Boolean(this.#n.isDeleted)}),s=t.Directives.classMap({"header-name":!0,"pseudo-header":this.#n.name.startsWith(":")}),o=t.Directives.classMap({"header-value":!0,"header-warning":Boolean(this.#n.headerValueIncorrect),"flex-columns":"x-client-data"===this.#n.name&&!this.#n.isResponseHeader}),i=this.#n.nameEditable&&1===this.#n.valueEditable,a=this.#n.nameEditable||this.#n.isDeleted||this.#d;q($`
      <div class=${r}>
        <div class=${s}>
          ${this.#n.headerNotSet?$`<div class="header-badge header-badge-text">${d.i18n.lockedString("not-set")}</div> `:t.nothing}
          ${i&&!this.#l?$`<devtools-icon class="inline-icon disallowed-characters" title=${C.headerNamesOnlyLetters} .data=${{iconName:"cross-circle-filled",width:"16px",height:"16px",color:"var(--icon-error)"}}>
            </devtools-icon>`:t.nothing}
          ${i&&!this.#n.isDeleted?$`<devtools-editable-span
              @focusout=${this.#h}
              @keydown=${this.#i}
              @input=${this.#c}
              @paste=${this.#u}
              .data=${{value:this.#n.name}}
            ></devtools-editable-span>`:this.#n.name}
        </div>
        <div
          class=${o}
          @copy=${()=>n.userMetrics.actionTaken(n.UserMetrics.Action.NetworkPanelCopyValue)}
        >
          ${this.#p()}
        </div>
        ${a?$`<devtools-icon class="row-flex-icon flex-right" title=${C.reloadPrompt} .data=${{iconName:"info",width:"16px",height:"16px",color:"var(--icon-default)"}}>
          </devtools-icon>`:t.nothing}
      </div>
      ${this.#v(this.#n.blockedDetails)}
    `,this.#e,{host:this}),this.#n.highlight&&this.scrollIntoView({behavior:"auto"})}#p(){if(!this.#n)return t.nothing;if("x-client-data"===this.#n.name&&!this.#n.isResponseHeader)return this.#m(this.#n);if(this.#n.isDeleted||1!==this.#n.valueEditable){const e=this.#n.isResponseHeader&&!this.#n.isDeleted&&2!==this.#n.valueEditable;return $`
      ${this.#n.value||""}
      ${this.#g(this.#n)}
      ${e?$`
        <devtools-button
          title=${O(C.editHeader)}
          .size=${"SMALL"}
          .iconName=${"edit"}
          .variant=${"icon"}
          @click=${()=>{this.dispatchEvent(new I)}}
          jslog=${i.action("enable-header-overrides").track({click:!0})}
          class="enable-editing inline-button"
        ></devtools-button>
      `:t.nothing}
    `}return $`
      <devtools-editable-span
        @focusout=${this.#f}
        @input=${this.#w}
        @paste=${this.#w}
        @keydown=${this.#i}
        .data=${{value:this.#n.value||""}}
      ></devtools-editable-span>
      ${this.#g(this.#n)}
      <devtools-button
        title=${O(C.removeOverride)}
        .size=${"SMALL"}
        .iconName=${"bin"}
        .variant=${"icon"}
        class="remove-header inline-button"
        @click=${this.#y}
        jslog=${i.action("remove-header-override").track({click:!0})}
      ></devtools-button>
    `}#m(e){const t=c.parseClientVariations(e.value||""),r=c.formatClientVariations(t,O(C.activeClientExperimentVariation),O(C.activeClientExperimentVariationIds));return $`
      <div>${e.value||""}</div>
      <div>${O(C.decoded)}</div>
      <code>${r}</code>
    `}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".header-name devtools-editable-span");e?.focus()}))}#g(e){if("set-cookie"===e.name&&e.setCookieBlockedReasons){const t=e.setCookieBlockedReasons.map(h.NetworkRequest.setCookieBlockedReasonToUiString).join("\n");return $`
        <devtools-icon class="row-flex-icon" title=${t} .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
        </devtools-icon>
      `}return t.nothing}#v(e){return e?$`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation">${e.explanation()}</div>
          ${e.examples.map((e=>$`
            <div class="example">
              <code>${e.codeSnippet}</code>
              ${e.comment?$`
                <span class="comment">${e.comment()}</span>
              `:""}
            </div>
          `))}
          ${this.#b(e)}
        </div>
      </div>
    `:t.nothing}#b(e){return e?.reveal?$`
        <div class="devtools-link" @click=${e.reveal}>
          <devtools-icon class="inline-icon" .data=${{iconName:"issue-exclamation-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
          </devtools-icon
          >${O(C.learnMoreInTheIssuesTab)}
        </div>
      `:e?.link?$`
        <x-link href=${e.link.url} class="link">
          <devtools-icon class="inline-icon" .data=${{iconName:"open-externally",color:"var(--icon-link)",width:"20px",height:"20px"}}>
          </devtools-icon
          >${O(C.learnMore)}
        </x-link>
      `:t.nothing}#f(t){const r=t.target;if(!this.#n)return;const s=r.value.trim();A(s,this.#n.value?.trim())||(this.#n.value=s,this.dispatchEvent(new D(this.#n.name,s)),e.ScheduledRender.scheduleRender(this,this.#t));const o=window.getSelection();o?.removeAllRanges(),this.#n.originalName=""}#h(t){const r=t.target;if(!this.#n)return;const s=l.StringUtilities.toLowerCaseString(r.value.trim());""===s?r.value=this.#n.name:A(s,this.#n.name.trim())||(this.#n.name=s,this.dispatchEvent(new D(s,this.#n.value||"")),e.ScheduledRender.scheduleRender(this,this.#t));const o=window.getSelection();o?.removeAllRanges()}#y(){if(!this.#n)return;const e=this.#e.querySelector(".header-value devtools-editable-span");this.#n.originalValue&&(e.value=this.#n?.originalValue),this.dispatchEvent(new L(this.#n.name,this.#n.value||""))}#i(e){const t=e,r=e.target;if("Escape"===t.key){if(e.consume(),r.matches(".header-name devtools-editable-span"))r.value=this.#n?.name||"",this.#c(e);else if(r.matches(".header-value devtools-editable-span")&&(r.value=this.#n?.value||"",this.#w(e),this.#n?.originalName)){const e=this.#e.querySelector(".header-name devtools-editable-span");return e.value=this.#n.originalName,this.#n.originalName="",e.dispatchEvent(new Event("input")),void e.focus()}r.blur()}}#c(t){const r=t.target,s=N(r.value);this.#l!==s&&(this.#l=s,e.ScheduledRender.scheduleRender(this,this.#t))}#w(t){const r=t.target,s=void 0!==this.#n?.originalValue&&!A(this.#n?.originalValue||"",r.value);this.#d!==s&&(this.#d=s,this.#n&&(this.#n.highlight=!1),e.ScheduledRender.scheduleRender(this,this.#t))}#u(e){if(!e.clipboardData)return;const t=e.target,r=e.clipboardData.getData("text/plain")||"",s=r.indexOf(":");if(s<1)return t.value=r,e.preventDefault(),void t.dispatchEvent(new Event("input",{bubbles:!0}));this.#n&&(this.#n.originalName=this.#n.name);const o=r.substring(s+1,r.length).trim(),i=r.substring(0,s);t.value=i,t.dispatchEvent(new Event("input"));const a=this.#e.querySelector(".header-value devtools-editable-span");a&&(a.focus(),a.value=o,a.dispatchEvent(new Event("input"))),e.preventDefault()}}customElements.define("devtools-header-section-row",U);var V=Object.freeze({__proto__:null,EnableHeaderEditingEvent:I,HeaderEditedEvent:D,HeaderRemovedEvent:L,HeaderSectionRow:U,compareHeaders:A,isValidHeaderName:N}),F={cssText:`:host{display:block}devtools-header-section-row:last-of-type{margin-bottom:10px}devtools-header-section-row:first-of-type{margin-top:2px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=${import.meta.resolve("./RequestHeaderSection.css")} */\n`};const P=new CSSStyleSheet;P.replaceSync(F.cssText);const{render:_,html:M}=t,j={learnMore:"Learn more",provisionalHeadersAreShownDisableCache:"Provisional headers are shown. Disable cache to see full headers.",onlyProvisionalHeadersAre:"Only provisional headers are available because this request was not sent over the network and instead was served from a local cache, which doesn’t store the original request headers. Disable cache to see full request headers.",provisionalHeadersAreShown:"Provisional headers are shown."},z=d.i18n.registerUIStrings("panels/network/components/RequestHeaderSection.ts",j),W=d.i18n.getLocalizedString.bind(void 0,z);class B extends HTMLElement{#e=this.attachShadow({mode:"open"});#k;#x=[];connectedCallback(){this.#e.adoptedStyleSheets=[P]}set data(e){this.#k=e.request,this.#x=this.#k.requestHeaders().map((e=>({name:l.StringUtilities.toLowerCaseString(e.name),value:e.value,valueEditable:2}))),this.#x.sort(((e,t)=>l.StringUtilities.compare(e.name,t.name))),"Request"===e.toReveal?.section&&this.#x.filter((t=>t.name===e.toReveal?.header?.toLowerCase())).forEach((e=>{e.highlight=!0})),this.#r()}#r(){this.#k&&_(M`
      ${this.#S()}
      ${this.#x.map((e=>M`
        <devtools-header-section-row
          .data=${{header:e}}
          jslog=${i.item("request-header")}
        ></devtools-header-section-row>
      `))}
    `,this.#e,{host:this})}#S(){if(!this.#k||void 0!==this.#k.requestHeadersText())return t.nothing;let e,r="";return this.#k.cachedInMemory()||this.#k.cached()?(e=W(j.provisionalHeadersAreShownDisableCache),r=W(j.onlyProvisionalHeadersAre)):e=W(j.provisionalHeadersAreShown),M`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation" title=${r}>
            <devtools-icon class="inline-icon" .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
            </devtools-icon>
            ${e} <x-link href="https://developer.chrome.com/docs/devtools/network/reference/#provisional-headers" class="link">${W(j.learnMore)}</x-link>
          </div>
        </div>
      </div>
    `}}customElements.define("devtools-request-header-section",B);var G=Object.freeze({__proto__:null,RequestHeaderSection:B}),K={cssText:`.header{background-color:var(--sys-color-surface1);border-bottom:1px solid var(--sys-color-divider);border-top:1px solid var(--sys-color-divider);line-height:25px;padding:0 5px}.header::marker{font-size:11px;line-height:1}.header:focus{background-color:var(--sys-color-state-header-hover)}details[open] .header-count{display:none}details .hide-when-closed{display:none}details[open] .hide-when-closed{display:block}details summary input{vertical-align:middle}.row{display:flex;line-height:18px;padding-left:8px;gap:var(--sys-size-6);user-select:text;margin:var(--sys-size-3) 0}div.raw-headers-row{display:block}.row:first-of-type{margin-top:var(--sys-size-5)}.row:last-child{margin-bottom:var(--sys-size-5)}.header-name{color:var(--sys-color-on-surface-subtle);font:var(--sys-typescale-body5-medium);width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize}.header-value{word-break:break-all;display:flex;align-items:center;gap:2px;font:var(--sys-typescale-body4-regular)}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.green-circle::before,\n.red-circle::before,\n.yellow-circle::before{content:"";display:inline-block;width:12px;height:12px;border-radius:6px;vertical-align:text-top;margin-right:2px}.green-circle::before{background-color:var(--sys-color-green-bright)}.red-circle::before{background-color:var(--sys-color-error-bright)}.yellow-circle::before{background-color:var(--issue-color-yellow)}.status-with-comment{color:var(--sys-color-token-subtle)}.raw-headers{font-family:var(--source-code-font-family);font-size:var(--source-code-font-size);white-space:pre-wrap;word-break:break-all}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.inline-icon{vertical-align:middle}.header-grid-container{display:inline-grid;grid-template-columns:156px 50px 1fr;grid-gap:4px;width:calc(100% - 15px)}.header-grid-container div:last-child{text-align:right}.header .devtools-link{color:var(--sys-color-on-surface)}x-link{position:relative}x-link .inline-icon{padding-right:3px}.purple.dot::before{background-color:var(--sys-color-purple-bright);content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-toolbar);left:9px;position:absolute;top:11px;z-index:1}summary label{display:inline-flex;align-items:center;vertical-align:middle;gap:var(--sys-size-3)}summary label input[type="checkbox"]{margin-top:1px}\n/*# sourceURL=${import.meta.resolve("./RequestHeadersView.css")} */\n`},Y={cssText:`:host{display:block}devtools-header-section-row:last-of-type{margin-bottom:var(--sys-size-5)}devtools-header-section-row:first-of-type{margin-top:var(--sys-size-5)}.add-header-button{margin:-4px 0 10px 5px}\n/*# sourceURL=${import.meta.resolve("./ResponseHeaderSection.css")} */\n`};const J=new CSSStyleSheet;J.replaceSync(Y.cssText);const Q={addHeader:"Add header",chooseThisOptionIfTheResourceAnd:"Choose this option if the resource and the document are served from the same site.",onlyChooseThisOptionIfAn:"Only choose this option if an arbitrary website including this resource does not impose a security risk.",thisDocumentWasBlockedFrom:"The document was blocked from loading in a popup opened by a sandboxed iframe because this document specified a cross-origin opener policy.",toEmbedThisFrameInYourDocument:"To embed this frame in your document, the response needs to enable the cross-origin embedder policy by specifying the following response header:",toUseThisResourceFromADifferent:"To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:",toUseThisResourceFromADifferentOrigin:"To use this resource from a different origin, the server may relax the cross-origin resource policy response header:",toUseThisResourceFromADifferentSite:"To use this resource from a different site, the server may relax the cross-origin resource policy response header:"},X=d.i18n.registerUIStrings("panels/network/components/ResponseHeaderSection.ts",Q),Z=d.i18n.getLocalizedString.bind(void 0,X),ee=d.i18n.getLazilyComputedLocalizedString.bind(void 0,X),te="ResponseHeaderSection";class re extends HTMLElement{shadow=this.attachShadow({mode:"open"});headerDetails=[];connectedCallback(){this.shadow.adoptedStyleSheets=[J]}setHeaders(e){e.sort((function(e,t){return l.StringUtilities.compare(e.name.toLowerCase(),t.name.toLowerCase())})),this.headerDetails=e.map((e=>({name:l.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})))}highlightHeaders(e){"Response"===e.toReveal?.section&&this.headerDetails.filter((t=>A(t.name,e.toReveal?.header?.toLowerCase()))).forEach((e=>{e.highlight=!0}))}}class se extends re{#k;set data(e){this.#k=e.request,this.setHeaders(this.#k.earlyHintsHeaders),this.highlightHeaders(e),this.#r()}#r(){this.#k&&r(s`
      ${this.headerDetails.map((e=>s`
        <devtools-header-section-row .data=${{header:e}}></devtools-header-section-row>
      `))}
    `,this.shadow,{host:this})}}customElements.define("devtools-early-hints-header-section",se);class oe extends re{#k;#R=[];#E=null;#H=[];#q=0;set data(e){this.#k=e.request,this.#q=p.NetworkPersistenceManager.NetworkPersistenceManager.isForbiddenNetworkUrl(this.#k.url())?2:0;const t=this.#k.sortedResponseHeaders.concat(this.#k.setCookieHeaders);this.setHeaders(t);const r=[];if(this.#k.wasBlocked()){const e=ie.get(this.#k.blockedReason());if(e){if(y.RelatedIssue.hasIssueOfCategory(this.#k,"CrossOriginEmbedderPolicy")){const t=()=>{n.userMetrics.issuesPanelOpenedFrom(1),this.#k&&y.RelatedIssue.reveal(this.#k,"CrossOriginEmbedderPolicy")};e.blockedDetails&&(e.blockedDetails.reveal=t)}r.push(e)}}this.headerDetails=function(e,t){let r=0,s=0;const o=[];for(;r<e.length&&s<t.length;)e[r].name<t[s].name?o.push({...e[r++],headerNotSet:!1}):e[r].name>t[s].name?o.push({...t[s++],headerNotSet:!0}):o.push({...t[s++],...e[r++],headerNotSet:!1});for(;r<e.length;)o.push({...e[r++],headerNotSet:!1});for(;s<t.length;)o.push({...t[s++],headerNotSet:!0});return o}(this.headerDetails,r);const s=this.#k.blockedResponseCookies(),o=new Map(s?.map((e=>[e.cookieLine.replace(/\s/g," "),e.blockedReasons])));for(const e of this.headerDetails)if("set-cookie"===e.name&&e.value){const t=o.get(e.value);t&&(e.setCookieBlockedReasons=t)}this.highlightHeaders(e);const i=this.#k.getAssociatedData(te);i?this.#R=i:(this.#R=this.headerDetails.map((e=>({name:e.name,value:e.value,originalValue:e.value,valueEditable:this.#q}))),this.#$()),this.#C(),this.#k.setAssociatedData(te,this.#R),this.#r()}#T(){this.#k&&(this.#q=p.NetworkPersistenceManager.NetworkPersistenceManager.isForbiddenNetworkUrl(this.#k.url())?2:0,this.#R=this.headerDetails.map((e=>({name:e.name,value:e.value,originalValue:e.value,valueEditable:this.#q}))),this.#$(),this.#k.setAssociatedData(te,this.#R))}async#C(){if(this.#k){if(this.#E=p.NetworkPersistenceManager.NetworkPersistenceManager.instance().getHeadersUISourceCodeFromUrl(this.#k.url()),!this.#E)return this.#T(),void this.#r();try{const e=await this.#E.requestContent();if(this.#H=JSON.parse(e.content||"[]"),!this.#H.every(p.NetworkPersistenceManager.isHeaderOverride))throw new Error("Type mismatch after parsing");u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").get()&&0===this.#q&&(this.#q=1);for(const e of this.#R)e.valueEditable=this.#q}catch{console.error("Failed to parse",this.#E?.url()||"source code file","for locally overriding headers."),this.#T()}finally{this.#r()}}}#$(){if(!this.#k||0===this.#k.originalResponseHeaders.length)return;const e=this.#k.originalResponseHeaders.map((e=>({name:l.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})));e.sort((function(e,t){return l.StringUtilities.compare(e.name,t.name)}));let t=0,r=0;for(;t<this.headerDetails.length;){const s=this.headerDetails[t].name;let o=this.headerDetails[t].value||"";const i=this.headerDetails[t].headerNotSet;for(;t<this.headerDetails.length-1&&this.headerDetails[t+1].name===s;)t++,o+=`, ${this.headerDetails[t].value}`;for(;r<e.length&&e[r].name<s;)r++;if(r<e.length&&e[r].name===s){let t=e[r].value;for(;r<e.length-1&&e[r+1].name===s;)r++,t+=`, ${e[r].value}`;r++,"set-cookie"===s||i||A(o,t)||this.#R.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}))}else"set-cookie"===s||i||this.#R.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}));t++}this.#R.filter((e=>"set-cookie"===e.name)).forEach((e=>{void 0===this.#k?.originalResponseHeaders.find((t=>"set-cookie"===l.StringUtilities.toLowerCaseString(t.name)&&A(t.value,e.value)))&&(e.isOverride=!0)}))}#O(e){const t=e.target;if(void 0===t.dataset.index)return;const r=Number(t.dataset.index);N(e.headerName)&&(this.#N(e.headerName,e.headerValue,r),n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideHeaderEdited))}#A(e){const t=p.NetworkPersistenceManager.NetworkPersistenceManager.instance().rawPathFromUrl(e,!0),r=t.lastIndexOf("/");return u.ParsedURL.ParsedURL.substring(t,r+1)}#D(){this.#E?.setWorkingCopy(JSON.stringify(this.#H,null,2)),this.#E?.commitWorkingCopy()}#L(e,t,r){for(let s=this.#H.length-1;s>=0;s--){const o=this.#H[s];if(o.applyTo!==e)continue;const i=o.headers.findIndex((e=>A(e.name,t)&&A(e.value,r)));if(!(i<0))return o.headers.splice(i,1),void(0===o.headers.length&&this.#H.splice(s,1))}}#I(e){const t=e.target;if(void 0===t.dataset.index||!this.#k)return;const r=Number(t.dataset.index),s=this.#A(this.#k.url());this.#L(s,e.headerName,e.headerValue),this.#D(),this.#R[r].isDeleted=!0,this.#r(),n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideHeaderRemoved)}#N(e,t,r){if(!this.#k)return;0===this.#k.originalResponseHeaders.length&&(this.#k.originalResponseHeaders=this.#k.sortedResponseHeaders.map((e=>({...e}))));const s=this.#R[r].name,o=this.#R[r].value;this.#R[r].name=e,this.#R[r].value=t;let i=[];"set-cookie"===e?i.push({name:e,value:t,valueEditable:this.#q}):i=this.#R.filter((t=>A(t.name,e)&&(!A(t.value,t.originalValue)||t.isOverride)));const a=this.#A(this.#k.url());let n=null;const[d]=this.#H.slice(-1);if(d?.applyTo===a?n=d:(n={applyTo:a,headers:[]},this.#H.push(n)),"set-cookie"===e){const e=n.headers.findIndex((e=>A(e.name,s)&&A(e.value,o)));e>=0&&n.headers.splice(e,1)}else n.headers=n.headers.filter((t=>!A(t.name,e)));if(!A(this.#R[r].name,s))for(let e=0;e<n.headers.length;++e)if(A(n.headers[e].name,s)&&A(n.headers[e].value,o)){n.headers.splice(e,1);break}for(const e of i)n.headers.push({name:e.name,value:e.value||""});0===n.headers.length&&this.#H.pop(),this.#D()}#U(){this.#R.push({name:l.StringUtilities.toLowerCaseString(d.i18n.lockedString("header-name")),value:d.i18n.lockedString("header value"),isOverride:!0,nameEditable:!0,valueEditable:1});const e=this.#R.length-1;this.#N(this.#R[e].name,this.#R[e].value||"",e),this.#r();const t=this.shadow.querySelectorAll("devtools-header-section-row"),[r]=Array.from(t).slice(-1);r?.focus(),n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideHeaderAdded)}#r(){if(!this.#k)return;const e=this.#R.map(((e,t)=>({...this.headerDetails[t],...e,isResponseHeader:!0})));r(s`
      ${e.map(((e,t)=>s`
        <devtools-header-section-row
            .data=${{header:e}}
            @headeredited=${this.#O}
            @headerremoved=${this.#I}
            @enableheaderediting=${this.#V}
            data-index=${t}
            jslog=${i.item("response-header")}
        ></devtools-header-section-row>
      `))}
      ${1===this.#q?s`
        <devtools-button
          class="add-header-button"
          .variant=${"outlined"}
          .iconName=${"plus"}
          @click=${this.#U}
          jslog=${i.action("add-header").track({click:!0})}>
          ${Z(Q.addHeader)}
        </devtools-button>
      `:o}
    `,this.shadow,{host:this})}async#V(){if(!this.#k)return;n.userMetrics.actionTaken(n.UserMetrics.Action.HeaderOverrideEnableEditingClicked);const e=this.#k.url(),t=p.NetworkPersistenceManager.NetworkPersistenceManager.instance();t.project()?(u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").set(!0),await t.getOrCreateHeadersUISourceCodeFromUrl(e)):a.InspectorView.InspectorView.instance().displaySelectOverrideFolderInfobar((async()=>{await w.SourcesNavigator.OverridesNavigatorView.instance().setupNewWorkspace(),await t.getOrCreateHeadersUISourceCodeFromUrl(e)}))}}customElements.define("devtools-response-header-section",oe);const ie=new Map([["coep-frame-resource-needs-coep-header",{name:l.StringUtilities.toLowerCaseString("cross-origin-embedder-policy"),value:null,blockedDetails:{explanation:ee(Q.toEmbedThisFrameInYourDocument),examples:[{codeSnippet:"Cross-Origin-Embedder-Policy: require-corp",comment:void 0}],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-origin-after-defaulted-to-same-origin-by-coep",{name:l.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,blockedDetails:{explanation:ee(Q.toUseThisResourceFromADifferent),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:ee(Q.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:ee(Q.onlyChooseThisOptionIfAn)}],link:{url:"https://web.dev/coop-coep/"}}}],["coop-sandboxed-iframe-cannot-navigate-to-coop-page",{name:l.StringUtilities.toLowerCaseString("cross-origin-opener-policy"),value:null,headerValueIncorrect:!1,blockedDetails:{explanation:ee(Q.thisDocumentWasBlockedFrom),examples:[],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-site",{name:l.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:ee(Q.toUseThisResourceFromADifferentSite),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:ee(Q.onlyChooseThisOptionIfAn)}],link:null}}],["corp-not-same-origin",{name:l.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:ee(Q.toUseThisResourceFromADifferentOrigin),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:ee(Q.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:ee(Q.onlyChooseThisOptionIfAn)}],link:null}}]]);var ae=Object.freeze({__proto__:null,EarlyHintsHeaderSection:se,RESPONSE_HEADER_SECTION_DATA_KEY:te,ResponseHeaderSection:oe});const ne=new CSSStyleSheet;ne.replaceSync(K.cssText);const{render:de,html:le}=t,he={fromDiskCache:"(from disk cache)",fromMemoryCache:"(from memory cache)",fromEarlyHints:"(from early hints)",fromPrefetchCache:"(from prefetch cache)",fromServiceWorker:"(from `service worker`)",fromSignedexchange:"(from signed-exchange)",fromWebBundle:"(from Web Bundle)",general:"General",raw:"Raw",referrerPolicy:"Referrer Policy",remoteAddress:"Remote Address",requestHeaders:"Request Headers",requestMethod:"Request Method",requestUrl:"Request URL",responseHeaders:"Response Headers",earlyHintsHeaders:"Early Hints Headers",revealHeaderOverrides:"Reveal header override definitions",showMore:"Show more",statusCode:"Status Code"},ce=d.i18n.registerUIStrings("panels/network/components/RequestHeadersView.ts",he),ue=d.i18n.getLocalizedString.bind(void 0,ce);class pe extends g.LegacyWrapper.WrappableComponent{#k;#e=this.attachShadow({mode:"open"});#F=!1;#P=!1;#_=!1;#M=!1;#j=void 0;#z=v.Workspace.WorkspaceImpl.instance();constructor(e){super(),this.#k=e,this.setAttribute("jslog",`${i.pane("headers").track({resize:!0})}`)}wasShown(){this.#k.addEventListener(h.NetworkRequest.Events.REMOTE_ADDRESS_CHANGED,this.#W,this),this.#k.addEventListener(h.NetworkRequest.Events.FINISHED_LOADING,this.#W,this),this.#k.addEventListener(h.NetworkRequest.Events.REQUEST_HEADERS_CHANGED,this.#W,this),this.#k.addEventListener(h.NetworkRequest.Events.RESPONSE_HEADERS_CHANGED,this.#B,this),this.#j=void 0,this.#W()}willHide(){this.#k.removeEventListener(h.NetworkRequest.Events.REMOTE_ADDRESS_CHANGED,this.#W,this),this.#k.removeEventListener(h.NetworkRequest.Events.FINISHED_LOADING,this.#W,this),this.#k.removeEventListener(h.NetworkRequest.Events.REQUEST_HEADERS_CHANGED,this.#W,this),this.#k.removeEventListener(h.NetworkRequest.Events.RESPONSE_HEADERS_CHANGED,this.#B,this)}#B(){this.#k.deleteAssociatedData(te),this.render()}#W(){this.render()}revealHeader(e,t){this.#j={section:e,header:t},this.render()}connectedCallback(){this.#e.adoptedStyleSheets=[ne],this.#z.addEventListener(v.Workspace.Events.UISourceCodeAdded,this.#G,this),this.#z.addEventListener(v.Workspace.Events.UISourceCodeRemoved,this.#G,this),u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").addChangeListener(this.render,this)}disconnectedCallback(){this.#z.removeEventListener(v.Workspace.Events.UISourceCodeAdded,this.#G,this),this.#z.removeEventListener(v.Workspace.Events.UISourceCodeRemoved,this.#G,this),u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").removeChangeListener(this.render,this)}#G(e){this.#K()===e.data.url()&&this.render()}async render(){if(this.#k)return await f.write((()=>{de(le`
        ${this.#Y()}
        ${this.#J()}
        ${this.#Q()}
        ${this.#X()}
      `,this.#e,{host:this})}))}#J(){if(!this.#k||!this.#k.earlyHintsHeaders||0===this.#k.earlyHintsHeaders.length)return t.nothing;return le`
      <devtools-request-headers-category
        @togglerawevent=${()=>{this.#F=!this.#F,this.render()}}
        .data=${{name:"early-hints-headers",title:ue(he.earlyHintsHeaders),headerCount:this.#k.earlyHintsHeaders.length,checked:void 0,additionalContent:void 0,forceOpen:"EarlyHints"===this.#j?.section,loggingContext:"early-hints-headers"}}
        aria-label=${ue(he.earlyHintsHeaders)}
      >
        ${this.#F?this.#Z(this.#k.responseHeadersText,!0):le`
          <devtools-early-hints-header-section .data=${{request:this.#k,toReveal:this.#j}}></devtools-early-hints-header-section>
        `}
      </devtools-request-headers-category>
    `}#Q(){if(!this.#k)return t.nothing;return le`
      <devtools-request-headers-category
        @togglerawevent=${()=>{this.#F=!this.#F,this.render()}}
        .data=${{name:"response-headers",title:ue(he.responseHeaders),headerCount:this.#k.sortedResponseHeaders.length,checked:this.#k.responseHeadersText?this.#F:void 0,additionalContent:this.#ee(),forceOpen:"Response"===this.#j?.section,loggingContext:"response-headers"}}
        aria-label=${ue(he.responseHeaders)}
      >
        ${this.#F?this.#Z(this.#k.responseHeadersText,!0):le`
          <devtools-response-header-section .data=${{request:this.#k,toReveal:this.#j}} jslog=${i.section("response-headers")}></devtools-response-header-section>
        `}
      </devtools-request-headers-category>
    `}#ee(){if(!this.#z.uiSourceCodeForURL(this.#K()))return t.nothing;const e=u.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled"),r=le`
      <devtools-icon class=${e.get()?"inline-icon dot purple":"inline-icon"} .data=${{iconName:"document",width:"16px",height:"16px"}}>
      </devtools-icon>`;return le`
      <x-link
          href="https://goo.gle/devtools-override"
          class="link devtools-link"
          jslog=${i.link("devtools-override").track({click:!0})}
      >
        <devtools-icon class="inline-icon" .data=${{iconName:"help",width:"16px",height:"16px"}}>
        </devtools-icon
      ></x-link>
      <x-link
          @click=${e=>{e.preventDefault();const t=this.#z.uiSourceCodeForURL(this.#K());t&&(w.SourcesPanel.SourcesPanel.instance().showUISourceCode(t),w.SourcesPanel.SourcesPanel.instance().revealInNavigator(t))}}
          class="link devtools-link"
          title=${he.revealHeaderOverrides}
          jslog=${i.link("reveal-header-overrides").track({click:!0})}
      >
        ${r}${p.NetworkPersistenceManager.HEADERS_FILENAME}
      </x-link>
    `}#K(){if(!this.#k)return l.DevToolsPath.EmptyUrlString;const e=p.NetworkPersistenceManager.NetworkPersistenceManager.instance().fileUrlFromNetworkUrl(this.#k.url(),!0);return e.substring(0,e.lastIndexOf("/"))+"/"+p.NetworkPersistenceManager.HEADERS_FILENAME}#X(){if(!this.#k)return t.nothing;const e=this.#k.requestHeadersText();return le`
      <devtools-request-headers-category
        @togglerawevent=${()=>{this.#P=!this.#P,this.render()}}
        .data=${{name:"request-headers",title:ue(he.requestHeaders),headerCount:this.#k.requestHeaders().length,checked:e?this.#P:void 0,forceOpen:"Request"===this.#j?.section,loggingContext:"request-headers"}}
        aria-label=${ue(he.requestHeaders)}
      >
        ${this.#P&&e?this.#Z(e,!1):le`
          <devtools-request-header-section .data=${{request:this.#k,toReveal:this.#j}} jslog=${i.section("request-headers")}></devtools-request-header-section>
        `}
      </devtools-request-headers-category>
    `}#Z(r,s){const o=r.trim(),n=!(s?this.#_:this.#M)&&o.length>3e3,d=()=>{s?this.#_=!0:this.#M=!0,this.render()},l=e=>{if(!(s?this.#_:this.#M)){const t=new a.ContextMenu.ContextMenu(e);t.newSection().appendItem(ue(he.showMore),d,{jslogContext:"show-more"}),t.show()}};return le`
      <div class="row raw-headers-row" on-render=${e.Directives.nodeRenderedCallback((e=>{n&&e.addEventListener("contextmenu",l)}))}>
        <div class="raw-headers">${n?o.substring(0,3e3):o}</div>
        ${n?le`
          <devtools-button
            .size=${"SMALL"}
            .variant=${"outlined"}
            @click=${d}
            jslog=${i.action("raw-headers-show-more").track({click:!0})}
          >${ue(he.showMore)}</devtools-button>
        `:t.nothing}
      </div>
    `}#Y(){if(!this.#k)return t.nothing;const e=["status"];this.#k.statusCode<300||304===this.#k.statusCode?e.push("green-circle"):this.#k.statusCode<400?e.push("yellow-circle"):e.push("red-circle");let r="";this.#k.cachedInMemory()?r=ue(he.fromMemoryCache):this.#k.fromEarlyHints()?r=ue(he.fromEarlyHints):this.#k.fetchedViaServiceWorker?r=ue(he.fromServiceWorker):this.#k.redirectSourceSignedExchangeInfoHasNoErrors()?r=ue(he.fromSignedexchange):this.#k.webBundleInnerRequestInfo()?r=ue(he.fromWebBundle):this.#k.fromPrefetchCache()?r=ue(he.fromPrefetchCache):this.#k.cached()&&(r=ue(he.fromDiskCache)),r&&e.push("status-with-comment");const s=[this.#k.statusCode,this.#k.getInferredStatusText(),r].join(" ");return le`
      <devtools-request-headers-category
        .data=${{name:"general",title:ue(he.general),forceOpen:"General"===this.#j?.section,loggingContext:"general"}}
        aria-label=${ue(he.general)}
      >
      <div jslog=${i.section("general")}>
        ${this.#te(ue(he.requestUrl),this.#k.url())}
        ${this.#k.statusCode?this.#te(ue(he.requestMethod),this.#k.requestMethod):t.nothing}
        ${this.#k.statusCode?this.#te(ue(he.statusCode),s,e):t.nothing}
        ${this.#k.remoteAddress()?this.#te(ue(he.remoteAddress),this.#k.remoteAddress()):t.nothing}
        ${this.#k.referrerPolicy()?this.#te(ue(he.referrerPolicy),String(this.#k.referrerPolicy())):t.nothing}
      </div>
      </devtools-request-headers-category>
    `}#te(e,t,r){const s="General"===this.#j?.section&&e.toLowerCase()===this.#j?.header?.toLowerCase();return le`
      <div class="row ${s?"header-highlight":""}">
        <div class="header-name">${e}</div>
        <div
          class="header-value ${r?.join(" ")}"
          @copy=${()=>n.userMetrics.actionTaken(n.UserMetrics.Action.NetworkPanelCopyValue)}
        >${t}</div>
      </div>
    `}}class ve extends Event{static eventName="togglerawevent";constructor(){super(ve.eventName,{})}}class me extends HTMLElement{#e=this.attachShadow({mode:"open"});#re;#se=u.UIString.LocalizedEmptyString;#oe=void 0;#ie=void 0;#ae=void 0;#ne=void 0;#de="";connectedCallback(){this.#e.adoptedStyleSheets=[ne,m.checkboxStyles]}set data(e){this.#se=e.title,this.#re=u.Settings.Settings.instance().createSetting("request-info-"+e.name+"-category-expanded",!0),this.#oe=e.headerCount,this.#ie=e.checked,this.#ae=e.additionalContent,this.#ne=e.forceOpen,this.#de=e.loggingContext,this.#r()}#le(){this.dispatchEvent(new ve)}#r(){const e=!this.#re||this.#re.get()||this.#ne;de(le`
      <details ?open=${e} @toggle=${this.#he}>
        <summary
          class="header"
          @keydown=${this.#ce}
          jslog=${i.sectionHeader().track({click:!0}).context(this.#de)}
        >
          <div class="header-grid-container">
            <div>
              ${this.#se}${void 0!==this.#oe?le`<span class="header-count"> (${this.#oe})</span>`:t.nothing}
            </div>
            <div class="hide-when-closed">
              ${void 0!==this.#ie?le`
                <label><input
                    type="checkbox"
                    .checked=${this.#ie}
                    @change=${this.#le}
                    jslog=${i.toggle("raw-headers").track({change:!0})}
                />${ue(he.raw)}</label>
              `:t.nothing}
            </div>
            <div class="hide-when-closed">${this.#ae}</div>
          </div>
        </summary>
        <slot></slot>
      </details>
    `,this.#e,{host:this})}#ce(e){if(!e.target)return;const t=e.target.parentElement;if(!t)throw new Error("<details> element is not found for a <summary> element");switch(e.key){case"ArrowLeft":t.open=!1;break;case"ArrowRight":t.open=!0}}#he(e){this.#re?.set(e.target.open)}}customElements.define("devtools-request-headers",pe),customElements.define("devtools-request-headers-category",me);var ge=Object.freeze({__proto__:null,Category:me,RequestHeadersView:pe,ToggleRawHeadersEvent:ve}),fe={cssText:`.code{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.issuers-list{display:flex;flex-direction:column;list-style-type:none;padding:0;margin:0}.status-icon{margin:0 0.3em 2px 0;vertical-align:middle}\n/*# sourceURL=${import.meta.resolve("./RequestTrustTokensView.css")} */\n`};const we=new CSSStyleSheet;we.replaceSync(fe.cssText);const{html:ye}=t,be={parameters:"Parameters",type:"Type",refreshPolicy:"Refresh policy",issuers:"Issuers",topLevelOrigin:"Top level origin",issuer:"Issuer",result:"Result",status:"Status",numberOfIssuedTokens:"Number of issued tokens",success:"Success",failure:"Failure",theOperationsResultWasServedFrom:"The operations result was served from cache.",theOperationWasFulfilledLocally:"The operation was fulfilled locally, no request was sent.",theKeysForThisPSTIssuerAreUnavailable:"The keys for this PST issuer are unavailable. The issuer may need to be registered via the Chrome registration process.",aClientprovidedArgumentWas:"A client-provided argument was malformed or otherwise invalid.",eitherNoInputsForThisOperation:"Either no inputs for this operation are available or the output exceeds the operations quota.",theServersResponseWasMalformedOr:"The servers response was malformed or otherwise invalid.",theOperationFailedForAnUnknown:"The operation failed for an unknown reason.",perSiteLimit:"Per-site issuer limit reached."},ke=d.i18n.registerUIStrings("panels/network/components/RequestTrustTokensView.ts",be),xe=d.i18n.getLocalizedString.bind(void 0,ke);class Se extends g.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#k;constructor(e){super(),this.#k=e}wasShown(){this.#k.addEventListener(h.NetworkRequest.Events.TRUST_TOKEN_RESULT_ADDED,this.render,this),this.render()}willHide(){this.#k.removeEventListener(h.NetworkRequest.Events.TRUST_TOKEN_RESULT_ADDED,this.render,this)}connectedCallback(){this.#e.adoptedStyleSheets=[we]}async render(){if(!this.#k)throw new Error("Trying to render a Trust Token report without providing data");t.render(ye`<devtools-report>
        ${this.#ue()}
        ${this.#pe()}
      </devtools-report>
    `,this.#e,{host:this})}#ue(){const e=this.#k.trustTokenParams();return e?ye`
      <devtools-report-section-header jslog=${i.pane("trust-tokens").track({resize:!0})}>${xe(be.parameters)}</devtools-report-section-header>
      ${$e(xe(be.type),e.operation.toString())}
      ${this.#ve(e)}
      ${this.#me(e)}
      ${this.#ge()}
      <devtools-report-divider></devtools-report-divider>
    `:t.nothing}#ve(e){return"Redemption"!==e.operation?t.nothing:$e(xe(be.refreshPolicy),e.refreshPolicy.toString())}#me(e){return e.issuers&&0!==e.issuers.length?ye`
      <devtools-report-key>${xe(be.issuers)}</devtools-report-key>
      <devtools-report-value>
        <ul class="issuers-list">
          ${e.issuers.map((e=>ye`<li>${e}</li>`))}
        </ul>
      </devtools-report-value>
    `:t.nothing}#ge(){const e=this.#k.trustTokenOperationDoneEvent();return e?ye`
      ${qe(xe(be.topLevelOrigin),e.topLevelOrigin)}
      ${qe(xe(be.issuer),e.issuerOrigin)}`:t.nothing}#pe(){const e=this.#k.trustTokenOperationDoneEvent();return e?ye`
      <devtools-report-section-header>${xe(be.result)}</devtools-report-section-header>
      <devtools-report-key>${xe(be.status)}</devtools-report-key>
      <devtools-report-value>
        <span>
          <devtools-icon class="status-icon"
            .data=${r=e.status,He(r)?Re:Ee}>
          </devtools-icon>
          <strong>${function(e){return He(e)?xe(be.success):xe(be.failure)}(e.status)}</strong>
          ${function(e){switch(e){case"Ok":return null;case"AlreadyExists":return xe(be.theOperationsResultWasServedFrom);case"FulfilledLocally":return xe(be.theOperationWasFulfilledLocally);case"InvalidArgument":return xe(be.aClientprovidedArgumentWas);case"ResourceExhausted":return xe(be.eitherNoInputsForThisOperation);case"BadResponse":return xe(be.theServersResponseWasMalformedOr);case"MissingIssuerKeys":return xe(be.theKeysForThisPSTIssuerAreUnavailable);case"FailedPrecondition":case"ResourceLimited":case"InternalError":case"Unauthorized":case"UnknownError":return xe(be.theOperationFailedForAnUnknown);case"SiteIssuerLimit":return xe(be.perSiteLimit)}}(e.status)}
        </span>
      </devtools-report-value>
      ${this.#fe(e)}
      <devtools-report-divider></devtools-report-divider>
      `:t.nothing;var r}#fe(e){return"Issuance"!==e.type?t.nothing:qe(xe(be.numberOfIssuedTokens),e.issuedTokenCount)}}const Re={color:"var(--icon-checkmark-green)",iconName:"check-circle",width:"16px",height:"16px"},Ee={color:"var(--icon-error)",iconName:"cross-circle-filled",width:"16px",height:"16px"};function He(e){return"Ok"===e||"AlreadyExists"===e||"FulfilledLocally"===e}function qe(e,r){return void 0===r?t.nothing:ye`
    <devtools-report-key>${e}</devtools-report-key>
    <devtools-report-value>${r}</devtools-report-value>
  `}function $e(e,t){return ye`
    <devtools-report-key>${e}</devtools-report-key>
    <devtools-report-value class="code">${t}</devtools-report-value>
  `}customElements.define("devtools-trust-token-report",Se);var Ce=Object.freeze({__proto__:null,RequestTrustTokensView:Se,statusConsideredSuccess:He}),Te={cssText:`:host{--icon-padding:4px;display:flex;flex-direction:column;height:100%}.header{display:flex;font-weight:bold;padding:calc(2 * var(--icon-padding)) var(--icon-padding);line-height:20px}.icon{margin:0 var(--icon-padding)}devtools-data-grid{height:100%}\n/*# sourceURL=${import.meta.resolve("./WebBundleInfoView.css")} */\n`};const Oe=new CSSStyleSheet;Oe.replaceSync(Te.cssText);const{mimeFromURL:Ne,fromMimeTypeOverride:Ae,fromMimeType:De}=u.ResourceType.ResourceType,{iconDataForResourceType:Le}=b,Ie={bundledResource:"Bundled resource"},Ue=d.i18n.registerUIStrings("panels/network/components/WebBundleInfoView.ts",Ie),Ve=d.i18n.getLocalizedString.bind(void 0,Ue);class Fe extends g.LegacyWrapper.WrappableComponent{#e=this.attachShadow({mode:"open"});#we;#ye;constructor(e){super();const t=e.webBundleInfo();if(!t)throw new Error("Trying to render a Web Bundle info without providing data");this.#we=t,this.#ye=e.parsedURL.lastPathComponent,this.setAttribute("jslog",`${i.pane("webbundle").track({resize:!0})}`)}connectedCallback(){this.#e.adoptedStyleSheets=[Oe]}async render(){r(s`
      <div class="header">
        <devtools-icon class="icon"
          .data=${{color:"var(--icon-default)",iconName:"bundle",width:"20px"}}>
        </devtools-icon>
        <span>${this.#ye}</span>
        <x-link href="https://web.dev/web-bundles/#explaining-web-bundles"
          jslog=${i.link("webbundle-explainer").track({click:!0})}>
          <devtools-icon class="icon"
            .data=${{color:"var(--icon-default)",iconName:"help",width:"16px"}}>
          </devtools-icon>
        </x-link>
      </div>
      <devtools-data-grid striped>
        <table>
          <tr><th id="url">${Ve(Ie.bundledResource)}</th></tr>
          ${this.#we.resourceUrls?.map((e=>{const t=Ne(e)||null,r=Ae(t)||De(t),o=Le(r);return s`<tr><td>
                <div style="display: flex;">
                  <devtools-icon class="icon" .data=${{...o,width:"20px"}}>
                  </devtools-icon>
                  <span>${e}</span>
                </div></td></tr>`}))}
        </table>
      </devtools-data-grid>`,this.#e,{host:this})}}customElements.define("devtools-web-bundle-info",Fe);var Pe=Object.freeze({__proto__:null,WebBundleInfoView:Fe});export{R as EditableSpan,V as HeaderSectionRow,G as RequestHeaderSection,ge as RequestHeadersView,Ce as RequestTrustTokensView,ae as ResponseHeaderSection,Pe as WebBundleInfoView};
