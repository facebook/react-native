import"../icon_button/icon_button.js";import*as e from"../../../core/common/common.js";import*as t from"../../lit/lit.js";import*as i from"../../../core/host/host.js";import*as s from"../../../core/i18n/i18n.js";import*as n from"../../visual_logging/visual_logging.js";import"../buttons/buttons.js";import*as o from"../input/input.js";var r={cssText:`.clickable{cursor:pointer}devtools-icon{vertical-align:text-bottom;padding-left:2px}\n/*# sourceURL=${import.meta.resolve("./settingDeprecationWarning.css")} */\n`};const a=new CSSStyleSheet;a.replaceSync(r.cssText);const{html:c}=t;class l extends HTMLElement{#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[a]}set data(e){this.#t(e)}#t({disabled:i,warning:s,experiment:n}){const o={clickable:!1};let r;i&&n&&(o.clickable=!0,r=()=>{e.Revealer.reveal(n)}),t.render(c`<devtools-icon class=${t.Directives.classMap(o)} .data=${{iconName:"info",color:"var(--icon-default)",width:"16px"}} title=${s} @click=${r}></devtools-icon>`,this.#e,{host:this})}}customElements.define("devtools-setting-deprecation-warning",l);var h=Object.freeze({__proto__:null,SettingDeprecationWarning:l}),d={cssText:`:host{display:block;padding:0;margin:0}input{height:12px;width:12px;min-height:12px;min-width:12px;margin:6px}label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis}p{margin:6px 0}.disabled-reason{box-sizing:border-box;margin-left:var(--sys-size-2);width:var(--sys-size-9);height:var(--sys-size-9)}.learn-more{cursor:pointer;position:relative;margin-left:var(--sys-size-2);top:var(--sys-size-2);width:var(--sys-size-9);height:var(--sys-size-9)}\n/*# sourceURL=${import.meta.resolve("./settingCheckbox.css")} */\n`};const g=new CSSStyleSheet;g.replaceSync(d.cssText);const{html:p,Directives:{ifDefined:m}}=t,b={learnMore:"Learn more"},v=s.i18n.registerUIStrings("ui/components/settings/SettingCheckbox.ts",b),x=s.i18n.getLocalizedString.bind(void 0,v);class u extends HTMLElement{#e=this.attachShadow({mode:"open"});#i;#s;#n;connectedCallback(){this.#e.adoptedStyleSheets=[o.checkboxStyles,g]}set data(e){this.#s&&this.#i&&this.#i.removeChangeListener(this.#s.listener),this.#i=e.setting,this.#n=e.textOverride,this.#s=this.#i.addChangeListener((()=>{this.#t()})),this.#t()}icon(){if(!this.#i)return;if(this.#i.deprecation)return p`<devtools-setting-deprecation-warning .data=${this.#i.deprecation}></devtools-setting-deprecation-warning>`;const e=this.#i.learnMore();if(e&&e.url){const t=e.url,s={iconName:"help",variant:"icon",size:"SMALL",jslogContext:`${this.#i.name}-documentation`,title:x(b.learnMore)};return p`<devtools-button
                    class=learn-more
                    @click=${e=>{i.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(t),e.consume()}}
                    .data=${s}></devtools-button>`}}#t(){if(!this.#i)throw new Error('No "Setting" object provided for rendering');const e=this.icon(),i=`${this.#i.learnMore()?this.#i.learnMore()?.tooltip():""}`,s=this.#i.disabledReasons(),o=s.length?p`
      <devtools-button class="disabled-reason" .iconName=${"info"} .variant=${"icon"} .size=${"SMALL"} title=${m(s.join("\n"))} @click=${onclick}></devtools-button>
    `:t.nothing;t.render(p`
      <p>
        <label title=${i}>
          <input
            type="checkbox"
            .checked=${!s.length&&this.#i.get()}
            ?disabled=${this.#i.disabled()}
            @change=${this.#o}
            jslog=${n.toggle().track({click:!0}).context(this.#i.name)}
            aria-label=${this.#i.title()}
          />
          ${this.#n||this.#i.title()}${o}
        </label>
        ${e}
      </p>`,this.#e,{host:this})}#o(e){this.#i?.set(e.target.checked),this.dispatchEvent(new CustomEvent("change",{bubbles:!0,composed:!1}))}}customElements.define("setting-checkbox",u);var S=Object.freeze({__proto__:null,SettingCheckbox:u});export{S as SettingCheckbox,h as SettingDeprecationWarning};
