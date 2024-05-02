import*as e from"../../../../core/i18n/i18n.js";import*as t from"../../../../core/platform/platform.js";import*as a from"../../../../ui/components/buttons/buttons.js";import*as r from"../../../../ui/components/icon_button/icon_button.js";import*as n from"../../../../ui/components/input/input.js";import*as i from"../../../../ui/lit-html/lit-html.js";import*as s from"../../../../ui/visual_logging/visual_logging.js";import*as l from"../utils/utils.js";const o=new CSSStyleSheet;o.replaceSync('.root{color:var(--sys-color-on-surface);width:100%}.tree-title{font-weight:700;display:flex;align-items:center}.rotate-icon{transform:rotate(90deg)}.form-container{display:grid;grid-template-columns:1fr 1fr 1fr auto;align-items:center;column-gap:10px;row-gap:8px;padding:0 10px}.full-row{grid-column:1/5}.half-row{grid-column:span 2}.mobile-checkbox-container{display:flex}.device-model-input{grid-column:1/4}.input-field{color:var(--sys-color-on-surface);padding:3px 6px;border-radius:2px;border:1px solid var(--sys-color-neutral-outline);background-color:var(--sys-color-cdt-base-container);font-size:inherit;height:18px}.input-field:focus{border:1px solid var(--sys-color-state-focus-ring);outline-width:0}.add-container{cursor:pointer;display:flex;align-items:center;gap:6px}.add-icon{margin-right:5px}.brand-row{display:flex;align-items:center;gap:10px;justify-content:space-between}.brand-row > input{width:100%}.info-icon{margin-left:5px;margin-right:1px}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px;font-weight:400}devtools-icon + .link{margin-inline-start:2px}.hide-container{display:none}.input-field-label-container{display:flex;flex-direction:column;gap:10px}@media (forced-colors: active){.input-field{border:1px solid}.tree-title[aria-disabled="true"]{color:GrayText}}\n/*# sourceURL=userAgentClientHintsForm.css */\n');const d={title:"User agent client hints",useragent:"User agent (Sec-CH-UA)",fullVersionList:"Full version list (Sec-CH-UA-Full-Version-List)",brandProperties:"User agent properties",brandName:"Brand",brandNameAriaLabel:"Brand {PH1}",significantBrandVersionPlaceholder:"Significant version (e.g. 87)",brandVersionPlaceholder:"Version (e.g. 87.0.4280.88)",brandVersionAriaLabel:"Version {PH1}",addBrand:"Add Brand",brandUserAgentDelete:"Delete brand from user agent section",brandFullVersionListDelete:"Delete brand from full version list",fullBrowserVersion:"Full browser version (Sec-CH-UA-Full-Browser-Version)",fullBrowserVersionPlaceholder:"Full browser version (e.g. 87.0.4280.88)",platformLabel:"Platform (Sec-CH-UA-Platform / Sec-CH-UA-Platform-Version)",platformProperties:"Platform properties",platformVersion:"Platform version",platformPlaceholder:"Platform (e.g. Android)",architecture:"Architecture (Sec-CH-UA-Arch)",architecturePlaceholder:"Architecture (e.g. x86)",deviceProperties:"Device properties",deviceModel:"Device model (Sec-CH-UA-Model)",mobileCheckboxLabel:"Mobile",update:"Update",notRepresentable:"Not representable as structured headers string.",userAgentClientHintsInfo:"User agent client hints are an alternative to the user agent string that identify the browser and the device in a more structured way with better privacy accounting.",addedBrand:"Added brand row",deletedBrand:"Deleted brand row",learnMore:"Learn more"},c=e.i18n.registerUIStrings("panels/settings/emulation/components/UserAgentClientHintsForm.ts",d),h=e.i18n.getLocalizedString.bind(void 0,c);class u extends Event{static eventName="clienthintschange";constructor(){super(u.eventName)}}class p extends Event{static eventName="clienthintssubmit";detail;constructor(e){super(p.eventName),this.detail={value:e}}}const m={brands:[{brand:"",version:""}],fullVersionList:[{brand:"",version:""}],fullVersion:"",platform:"",platformVersion:"",architecture:"",model:"",mobile:!1};class b extends HTMLElement{static litTagName=i.literal`devtools-user-agent-client-hints-form`;#e=this.attachShadow({mode:"open"});#t=!1;#a=!1;#r=m;#n=!1;#i=!1;#s="";connectedCallback(){this.#e.adoptedStyleSheets=[n.checkboxStyles,o]}set value(e){const{metaData:t=m,showMobileCheckbox:a=!1,showSubmitButton:r=!1}=e;this.#r={...this.#r,...t},this.#n=a,this.#i=r,this.#l()}get value(){return{metaData:this.#r}}set disabled(e){this.#a=e,this.#t=!1,this.#l()}get disabled(){return this.#a}#o=e=>{"Space"!==e.code&&"Enter"!==e.code&&"ArrowLeft"!==e.code&&"ArrowRight"!==e.code||(e.stopPropagation(),this.#d(e.code))};#d=e=>{this.#a||"ArrowLeft"===e&&!this.#t||"ArrowRight"===e&&this.#t||(this.#t=!this.#t,this.#l())};#c=(e,t,a)=>{const r=this.#r.brands?.map(((r,n)=>{if(n===t){const{brand:t,version:n}=r;return"brandName"===a?{brand:e,version:n}:{brand:t,version:e}}return r}));this.#r={...this.#r,brands:r},this.dispatchEvent(new u),this.#l()};#h=(e,t,a)=>{const r=this.#r.fullVersionList?.map(((r,n)=>{if(n===t){const{brand:t,version:n}=r;return"brandName"===a?{brand:e,version:n}:{brand:t,version:e}}return r}));this.#r={...this.#r,fullVersionList:r},this.dispatchEvent(new u),this.#l()};#u=e=>{const{brands:t=[]}=this.#r;t.splice(e,1),this.#r={...this.#r,brands:t},this.dispatchEvent(new u),this.#s=h(d.deletedBrand),this.#l();let a=this.shadowRoot?.getElementById(`ua-brand-${e+1}-input`);a||(a=this.shadowRoot?.getElementById("add-brand-button")),a?.focus()};#p=e=>{const{fullVersionList:t=[]}=this.#r;t.splice(e,1),this.#r={...this.#r,fullVersionList:t},this.dispatchEvent(new u),this.#s=h(d.deletedBrand),this.#l();let a=this.shadowRoot?.getElementById(`fvl-brand-${e+1}-input`);a||(a=this.shadowRoot?.getElementById("add-fvl-brand-button")),a?.focus()};#m=()=>{const{brands:e}=this.#r;this.#r={...this.#r,brands:[...Array.isArray(e)?e:[],{brand:"",version:""}]},this.dispatchEvent(new u),this.#s=h(d.addedBrand),this.#l();const t=this.shadowRoot?.querySelectorAll(".ua-brand-name-input");if(t){const e=Array.from(t).pop();e&&e.focus()}};#b=e=>{"Space"!==e.code&&"Enter"!==e.code||(e.preventDefault(),this.#m())};#g=()=>{const{fullVersionList:e}=this.#r;this.#r={...this.#r,fullVersionList:[...Array.isArray(e)?e:[],{brand:"",version:""}]},this.dispatchEvent(new u),this.#s=h(d.addedBrand),this.#l();const t=this.shadowRoot?.querySelectorAll(".fvl-brand-name-input");if(t){const e=Array.from(t).pop();e&&e.focus()}};#f=e=>{"Space"!==e.code&&"Enter"!==e.code||(e.preventDefault(),this.#g())};#v=(e,t)=>{e in this.#r&&(this.#r={...this.#r,[e]:t},this.#l()),this.dispatchEvent(new u)};#$=e=>{"Space"!==e.code&&"Enter"!==e.code||(e.preventDefault(),e.target.click())};#w=e=>{e.preventDefault(),this.#i&&(this.dispatchEvent(new p(this.#r)),this.#l())};#x(e,a,r,n){return i.html`
      <label class="full-row label input-field-label-container">
        ${e}
        <input
          class="input-field"
          type="text"
          @input=${e=>{const t=e.target.value;this.#v(n,t)}}
          .value=${r}
          placeholder=${a}
          jslog=${s.textField().track({keydown:!0}).context(t.StringUtilities.toKebabCase(n))}
          />
      </label>
    `}#k(){const{platform:e,platformVersion:t}=this.#r;return i.html`
      <span class="full-row label">${h(d.platformLabel)}</span>
      <div class="full-row brand-row" aria-label=${h(d.platformProperties)} role="group">
        <input
          class="input-field half-row"
          type="text"
          @input=${e=>{const t=e.target.value;this.#v("platform",t)}}
          .value=${e}
          placeholder=${h(d.platformPlaceholder)}
          aria-label=${h(d.platformLabel)}
          jslog=${s.textField("platform").track({keydown:!0})}
        />
        <input
          class="input-field half-row"
          type="text"
          @input=${e=>{const t=e.target.value;this.#v("platformVersion",t)}}
          .value=${t}
          placeholder=${h(d.platformVersion)}
          aria-label=${h(d.platformVersion)}
          jslog=${s.textField("platform-version").track({keydown:!0})}
        />
      </div>
    `}#y(){const{model:e,mobile:t}=this.#r,a=this.#n?i.html`
      <label class="mobile-checkbox-container">
        <input type="checkbox" @input=${e=>{const t=e.target.checked;this.#v("mobile",t)}} .checked=${t}
          jslog=${s.toggle("mobile").track({click:!0})}
        />
        ${h(d.mobileCheckboxLabel)}
      </label>
    `:i.html``;return i.html`
      <span class="full-row label">${h(d.deviceModel)}</span>
      <div class="full-row brand-row" aria-label=${h(d.deviceProperties)} role="group">
        <input
          class="input-field ${this.#n?"device-model-input":"full-row"}"
          type="text"
          @input=${e=>{const t=e.target.value;this.#v("model",t)}}
          .value=${e}
          placeholder=${h(d.deviceModel)}
          jslog=${s.textField("model").track({keydown:!0})}
        />
        ${a}
      </div>
    `}#D(){const{brands:e=[{brand:"",version:""}]}=this.#r,t=e.map(((e,t)=>{const{brand:a,version:n}=e,l=()=>{this.#u(t)};return i.html`
        <div class="full-row brand-row" aria-label=${h(d.brandProperties)} role="group">
          <input
            class="input-field ua-brand-name-input"
            type="text"
            @input=${e=>{const a=e.target.value;this.#c(a,t,"brandName")}}
            .value=${a}
            id="ua-brand-${t+1}-input"
            placeholder=${h(d.brandName)}
            aria-label=${h(d.brandNameAriaLabel,{PH1:t+1})}
            jslog=${s.textField("brand-name").track({keydown:!0})}
          />
          <input
            class="input-field"
            type="text"
            @input=${e=>{const a=e.target.value;this.#c(a,t,"brandVersion")}}
            .value=${n}
            placeholder=${h(d.significantBrandVersionPlaceholder)}
            aria-label=${h(d.brandVersionAriaLabel,{PH1:t+1})}
            jslog=${s.textField("brand-version").track({keydown:!0})}
          />
          <${r.Icon.Icon.litTagName}
            .data=${{color:"var(--icon-default)",iconName:"bin",width:"16px",height:"16px"}}
            title=${h(d.brandUserAgentDelete)}
            class="delete-icon"
            tabindex="0"
            role="button"
            @click=${l}
            @keypress=${e=>{"Space"!==e.code&&"Enter"!==e.code||(e.preventDefault(),l())}}
            aria-label=${h(d.brandUserAgentDelete)}
          >
          </${r.Icon.Icon.litTagName}>
        </div>
      `}));return i.html`
      <span class="full-row label">${h(d.useragent)}</span>
      ${t}
      <div
        class="add-container full-row"
        role="button"
        tabindex="0"
        id="add-brand-button"
        aria-label=${h(d.addBrand)}
        @click=${this.#m}
        @keypress=${this.#b}
      >
        <${r.Icon.Icon.litTagName}
          aria-hidden="true"
          .data=${{color:"var(--icon-default)",iconName:"plus",width:"16px"}}
        >
        </${r.Icon.Icon.litTagName}>
        ${h(d.addBrand)}
      </div>
    `}#A(){const{fullVersionList:e=[{brand:"",version:""}]}=this.#r,t=e.map(((e,t)=>{const{brand:a,version:n}=e,l=()=>{this.#p(t)};return i.html`
        <div
          class="full-row brand-row"
          aria-label=${h(d.brandProperties)}
          jslog=${s.section("full-version")}
          role="group">
          <input
            class="input-field fvl-brand-name-input"
            type="text"
            @input=${e=>{const a=e.target.value;this.#h(a,t,"brandName")}}
            .value=${a}
            id="fvl-brand-${t+1}-input"
            placeholder=${h(d.brandName)}
            aria-label=${h(d.brandNameAriaLabel,{PH1:t+1})}
            jslog=${s.textField("brand-name").track({keydown:!0})}
          />
          <input
            class="input-field"
            type="text"
            @input=${e=>{const a=e.target.value;this.#h(a,t,"brandVersion")}}
            .value=${n}
            placeholder=${h(d.brandVersionPlaceholder)}
            aria-label=${h(d.brandVersionAriaLabel,{PH1:t+1})}
            jslog=${s.textField("brand-version").track({keydown:!0})}
          />
          <${r.Icon.Icon.litTagName}
            .data=${{color:"var(--icon-default)",iconName:"bin",width:"16px",height:"16px"}}
            title=${h(d.brandFullVersionListDelete)}
            class="delete-icon"
            tabindex="0"
            role="button"
            @click=${l}
            @keypress=${e=>{"Space"!==e.code&&"Enter"!==e.code||(e.preventDefault(),l())}}
            aria-label=${h(d.brandFullVersionListDelete)}
          >
          </${r.Icon.Icon.litTagName}>
        </div>
      `}));return i.html`
      <span class="full-row label">${h(d.fullVersionList)}</span>
      ${t}
      <div
        class="add-container full-row"
        role="button"
        tabindex="0"
        id="add-fvl-brand-button"
        aria-label=${h(d.addBrand)}
        @click=${this.#g}
        @keypress=${this.#f}
      >
        <${r.Icon.Icon.litTagName}
          aria-hidden="true"
          .data=${{color:"var(--icon-default)",iconName:"plus",width:"16px"}}
        >
        </${r.Icon.Icon.litTagName}>
        ${h(d.addBrand)}
      </div>
    `}#l(){const{fullVersion:e,architecture:t}=this.#r,n=this.#D(),l=this.#A(),o=this.#x(h(d.fullBrowserVersion),h(d.fullBrowserVersionPlaceholder),e||"","fullVersion"),c=this.#k(),u=this.#x(h(d.architecture),h(d.architecturePlaceholder),t,"architecture"),p=this.#y(),m=this.#i?i.html`
      <${a.Button.Button.litTagName}
        .variant=${"secondary"}
        .type=${"submit"}
      >
        ${h(d.update)}
      </${a.Button.Button.litTagName}>
    `:i.nothing,b=i.html`
      <section class="root">
        <div
          class="tree-title"
          role="button"
          @click=${this.#d}
          tabindex="0"
          @keydown=${this.#o}
          aria-expanded=${this.#t}
          aria-controls="form-container"
          @disabled=${this.#a}
          aria-disabled=${this.#a}
          aria-label=${h(d.title)}
          jslog=${s.toggleSubpane().track({click:!0})}
        >
          <${r.Icon.Icon.litTagName}
            class=${this.#t?"rotate-icon":""}
            .data=${{color:"var(--icon-default)",iconName:"triangle-right",width:"14px"}}
          ></${r.Icon.Icon.litTagName}>
          ${h(d.title)}
          <${r.Icon.Icon.litTagName}
            .data=${{color:"var(--icon-default)",iconName:"info",width:"16px"}}
            title=${h(d.userAgentClientHintsInfo)}
            class='info-icon',
          ></${r.Icon.Icon.litTagName}>
          <x-link
           tabindex="0"
           href="https://web.dev/user-agent-client-hints/"
           target="_blank"
           class="link"
           @keypress=${this.#$}
           aria-label=${h(d.userAgentClientHintsInfo)}
           jslog=${s.link("learn-more").track({click:!0})}
          >
            ${h(d.learnMore)}
          </x-link>
        </div>
        <form
          id="form-container"
          class="form-container ${this.#t?"":"hide-container"}"
          @submit=${this.#w}
        >
          ${n}
          ${l}
          ${o}
          ${c}
          ${u}
          ${p}
          ${m}
        </form>
        <div aria-live="polite" aria-label=${this.#s}></div>
      </section>
    `;i.render(b,this.#e,{host:this})}validate=()=>{for(const[e,t]of Object.entries(this.#r))if("brands"===e||"fullVersionList"===e){const e=this.#r.brands?.every((({brand:e,version:t})=>{const a=l.UserAgentMetadata.validateAsStructuredHeadersString(e,h(d.notRepresentable)),r=l.UserAgentMetadata.validateAsStructuredHeadersString(t,h(d.notRepresentable));return a.valid&&r.valid}));if(!e)return{valid:!1,errorMessage:h(d.notRepresentable)}}else{const e=l.UserAgentMetadata.validateAsStructuredHeadersString(t,h(d.notRepresentable));if(!e.valid)return e}return{valid:!0}}}customElements.define("devtools-user-agent-client-hints-form",b);var g=Object.freeze({__proto__:null,ClientHintsChangeEvent:u,ClientHintsSubmitEvent:p,UserAgentClientHintsForm:b});export{g as UserAgentClientHintsForm};
