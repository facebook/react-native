import*as e from"../../../core/common/common.js";import*as n from"../../../ui/components/helpers/helpers.js";import*as t from"../../../core/i18n/i18n.js";import*as i from"../../../ui/lit-html/lit-html.js";import*as s from"../../../ui/components/settings/settings.js";import*as o from"../../../ui/components/chrome_link/chrome_link.js";const c=new CSSStyleSheet;c.replaceSync(":host{break-inside:avoid;display:block;padding-bottom:9px;width:288px}fieldset{border:0;margin-left:20px;padding:0}legend{color:var(--sys-color-token-subtle);font-size:120%;margin-left:-20px;padding:0;text-align:left}.link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}img{background-size:32px 32px;border:0;border-radius:50%;display:block;height:32px;width:32px}.warning{display:block;margin-top:12px}.account-info{display:flex;align-items:center;margin-top:12px}.account-email{display:flex;flex-direction:column;margin-left:8px}\n/*# sourceURL=syncSection.css */\n");const r={syncDisabled:"To turn this setting on, you must enable Chrome sync.",preferencesSyncDisabled:"To turn this setting on, you must first enable settings sync in Chrome.",settings:"Go to Settings",signedIn:"Signed into Chrome as:"},a=t.i18n.registerUIStrings("panels/settings/components/SyncSection.ts",r),l=t.i18n.getLocalizedString.bind(void 0,a);class d extends HTMLElement{static litTagName=i.literal`devtools-sync-section`;#e=this.attachShadow({mode:"open"});#n={isSyncActive:!1};#t;#i=this.#s.bind(this);connectedCallback(){this.#e.adoptedStyleSheets=[c]}set data(e){this.#n=e.syncInfo,this.#t=e.syncSetting,n.ScheduledRender.scheduleRender(this,this.#i)}#s(){if(!this.#t)throw new Error("SyncSection not properly initialized");const n=!this.#n.isSyncActive||!this.#n.arePreferencesSynced;this.#t?.setDisabled(n),i.render(i.html`
      <fieldset>
        <legend>${e.Settings.getLocalizedSettingsCategory("SYNC")}</legend>
        ${function(e){if(!e.isSyncActive){const e="chrome://settings/syncSetup";return i.html`
      <span class="warning">
        ${l(r.syncDisabled)}
        <${o.ChromeLink.ChromeLink.litTagName} .href=${e}>${l(r.settings)}</${o.ChromeLink.ChromeLink.litTagName}>
      </span>`}if(!e.arePreferencesSynced){const e="chrome://settings/syncSetup/advanced";return i.html`
      <span class="warning">
        ${l(r.preferencesSyncDisabled)}
        <${o.ChromeLink.ChromeLink.litTagName} .href=${e}>${l(r.settings)}</${o.ChromeLink.ChromeLink.litTagName}>
      </span>`}return i.html`
    <div class="account-info">
      <img src="data:image/png;base64, ${e.accountImage}" alt="Account avatar" />
      <div class="account-email">
        <span>${l(r.signedIn)}</span>
        <span>${e.accountEmail}</span>
      </div>
    </div>`}(this.#n)}
        <${s.SettingCheckbox.SettingCheckbox.litTagName} .data=${{setting:this.#t}}>
        </${s.SettingCheckbox.SettingCheckbox.litTagName}>
      </fieldset>
    `,this.#e,{host:this})}}customElements.define("devtools-sync-section",d);var m=Object.freeze({__proto__:null,SyncSection:d});export{m as SyncSection};
