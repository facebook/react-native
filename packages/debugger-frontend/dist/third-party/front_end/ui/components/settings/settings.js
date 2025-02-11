import*as e from"../../lit-html/lit-html.js";import*as t from"../../visual_logging/visual_logging.js";import*as i from"../icon_button/icon_button.js";import*as n from"../input/input.js";import*as s from"../../../core/common/common.js";const a=new CSSStyleSheet;a.replaceSync(":host{display:block;padding:0;margin:0}input{height:12px;width:12px;min-height:12px;min-width:12px;margin:6px}label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis}p{margin:6px 0}.disabled-reason{box-sizing:border-box;margin-left:3px;width:16px;height:16px}\n/*# sourceURL=settingCheckbox.css */\n");const o=new CSSStyleSheet;o.replaceSync(".clickable{cursor:pointer}devtools-icon{vertical-align:text-bottom;padding-left:2px}\n/*# sourceURL=settingDeprecationWarning.css */\n");class c extends HTMLElement{static litTagName=e.literal`devtools-setting-deprecation-warning`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[o]}set data(e){this.#t(e)}#t({disabled:t,warning:n,experiment:a}){const o={clickable:!1};let c;t&&a&&(o.clickable=!0,c=()=>{s.Revealer.reveal(a)}),e.render(e.html`<${i.Icon.Icon.litTagName} class=${e.Directives.classMap(o)} .data=${{iconName:"info",color:"var(--icon-default)",width:"16px"}} title=${n} @click=${c}></${i.Icon.Icon.litTagName}>`,this.#e,{host:this})}}customElements.define("devtools-setting-deprecation-warning",c);var l=Object.freeze({__proto__:null,SettingDeprecationWarning:c});class r extends HTMLElement{static litTagName=e.literal`setting-checkbox`;#e=this.attachShadow({mode:"open"});#i;#n;connectedCallback(){this.#e.adoptedStyleSheets=[n.checkboxStyles,a]}set data(e){this.#n&&this.#i&&this.#i.removeChangeListener(this.#n.listener),this.#i=e.setting,this.#n=this.#i.addChangeListener((()=>{this.#t()})),this.#t()}#s(){if(this.#i?.deprecation)return e.html`<${c.litTagName} .data=${this.#i.deprecation}></${c.litTagName}>`}#t(){if(!this.#i)throw new Error('No "Setting" object provided for rendering');const n=this.#s(),s=this.#i.disabledReason()?e.html`
      <${i.Icon.Icon.litTagName} class="disabled-reason" name="info" title=${this.#i.disabledReason()} @click=${onclick}></${i.Icon.Icon.litTagName}>
    `:e.nothing;e.render(e.html`
      <p>
        <label>
          <input
            type="checkbox"
            .checked=${!this.#i.disabledReason()&&this.#i.get()}
            ?disabled=${this.#i.disabled()}
            @change=${this.#a}
            jslog=${t.toggle().track({click:!0}).context(this.#i.name)}
            aria-label=${this.#i.title()}
          />
          ${this.#i.title()}${s}${n}
        </label>
      </p>`,this.#e,{host:this})}#a(e){this.#i?.set(e.target.checked),this.dispatchEvent(new CustomEvent("change",{bubbles:!0,composed:!1}))}}customElements.define("setting-checkbox",r);var h=Object.freeze({__proto__:null,SettingCheckbox:r});export{h as SettingCheckbox,l as SettingDeprecationWarning};
