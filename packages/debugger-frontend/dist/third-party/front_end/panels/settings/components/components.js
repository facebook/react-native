import"../../../ui/components/chrome_link/chrome_link.js";import"../../../ui/components/settings/settings.js";import*as e from"../../../core/i18n/i18n.js";import*as n from"../../../ui/components/helpers/helpers.js";import*as s from"../../../ui/lit/lit.js";var t={cssText:`:host{break-inside:avoid;display:block;padding-bottom:9px;width:288px}fieldset{border:0;padding:0}.link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}img{border:0;border-radius:var(--sys-shape-corner-full);display:block;height:var(--sys-size-9);width:var(--sys-size-9)}.warning{display:block}.account-info{display:flex;align-items:center;margin-top:12px}.account-email{display:flex;flex-direction:column;margin-left:8px}\n/*# sourceURL=${import.meta.resolve("./syncSection.css")} */\n`};const i=new CSSStyleSheet;i.replaceSync(t.cssText);const{html:o}=s,c={syncDisabled:"To turn this setting on, you must enable Chrome sync.",preferencesSyncDisabled:"To turn this setting on, you must first enable settings sync in Chrome.",settings:"Go to Settings",signedIn:"Signed into Chrome as:"},r=e.i18n.registerUIStrings("panels/settings/components/SyncSection.ts",c),a=e.i18n.getLocalizedString.bind(void 0,r);class d extends HTMLElement{#e=this.attachShadow({mode:"open"});#n={isSyncActive:!1};#s;#t=this.#i.bind(this);connectedCallback(){this.#e.adoptedStyleSheets=[i]}set data(e){this.#n=e.syncInfo,this.#s=e.syncSetting,n.ScheduledRender.scheduleRender(this,this.#t)}#i(){if(!this.#s)throw new Error("SyncSection not properly initialized");const e=!this.#n.isSyncActive||!this.#n.arePreferencesSynced;this.#s?.setDisabled(e),s.render(o`
      <fieldset>
        ${function(e){if(!e.isSyncActive){const e="chrome://settings/syncSetup";return o`
      <span class="warning">
        ${a(c.syncDisabled)}
        <devtools-chrome-link .href=${e}>${a(c.settings)}</devtools-chrome-link>
      </span>`}if(!e.arePreferencesSynced){const e="chrome://settings/syncSetup/advanced";return o`
      <span class="warning">
        ${a(c.preferencesSyncDisabled)}
        <devtools-chrome-link .href=${e}>${a(c.settings)}</devtools-chrome-link>
      </span>`}return o`
    <div class="account-info">
      <img src="data:image/png;base64, ${e.accountImage}" alt="Account avatar" />
      <div class="account-email">
        <span>${a(c.signedIn)}</span>
        <span>${e.accountEmail}</span>
      </div>
    </div>`}(this.#n)}
        <setting-checkbox .data=${{setting:this.#s}}>
        </setting-checkbox>
      </fieldset>
    `,this.#e,{host:this})}}customElements.define("devtools-sync-section",d);var l=Object.freeze({__proto__:null,SyncSection:d});export{l as SyncSection};
