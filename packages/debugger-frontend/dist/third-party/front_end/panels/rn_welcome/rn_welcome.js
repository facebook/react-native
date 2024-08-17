import*as e from"../../ui/legacy/legacy.js";import*as o from"../../core/host/host.js";import*as t from"../../core/i18n/i18n.js";import*as i from"../../ui/lit-html/lit-html.js";const n=new CSSStyleSheet;n.replaceSync('.rn-welcome-panel{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;justify-content:center;padding:36px;background-color:var(--color-background-elevation-0);min-height:100%}@media (min-width: 1000px){.rn-welcome-panel{flex-direction:row;align-items:center;justify-content:stretch;height:100%;padding:24px 60px}}.rn-welcome-hero{display:flex;flex-direction:column;flex-grow:1;flex-shrink:0;align-items:center;padding:16px;text-align:center}.rn-welcome-heading{display:flex;align-items:center;margin-bottom:16px}.rn-welcome-icon{width:30px;height:30px;border-radius:4px;margin-right:12px}.rn-welcome-title{font-size:20px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-title-accessory{margin-left:12px;padding:4px 8px;border-radius:4px;background-color:var(--color-green);font-size:12px;color:var(--color-on-primary)}.rn-welcome-title-accessory-purple{background-color:var(--color-purple-bright)}.rn-welcome-tagline{margin-bottom:24px;font-size:1rem;line-height:1.3;color:var(--color-text-secondary)}.rn-welcome-links{display:flex;align-items:center}.rn-welcome-links > .devtools-link{position:relative;margin:0 16px;font-size:14px}.rn-welcome-links > .devtools-link:not(:last-child)::after{content:"";position:absolute;right:-16px;height:16px;border-right:1px solid var(--color-details-hairline)}.rn-welcome-docsfeed{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;max-width:700px;margin:0 auto;padding:24px}@media (min-width: 1000px){.rn-welcome-docsfeed{flex-shrink:1;width:45%;margin:0}}.rn-welcome-h2{font-size:16px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-docsfeed-item{display:flex;align-items:center;margin-bottom:8px;padding:8px;padding-right:16px;border:1px solid var(--color-details-hairline);border-radius:4px;background-color:var(--color-background);text-align:left;font-size:14px;cursor:pointer}.rn-welcome-docsfeed-item:hover{background-color:var(--color-background-elevation-0)}.rn-welcome-docsfeed-item p{margin:0;margin-bottom:4px;text-decoration:none}.rn-welcome-docsfeed-item :not(.devtools-link){color:var(--color-text-secondary)}.rn-welcome-image{aspect-ratio:calc(16 / 9);height:64px;margin-right:16px;border-radius:2px;background-color:var(--color-gray-100);background-position:center;background-size:cover}\n/*# sourceURL=rnWelcome.css */\n');const r={betaLabel:"Beta",techPreviewLabel:"Tech Preview",welcomeMessage:"Welcome to debugging in React Native",docsLabel:"Debugging docs",whatsNewLabel:"What's new",docsDebuggingBasics:"Debugging Basics",docsDebuggingBasicsDetail:"Overview of debugging tools in React Native",docsReactDevTools:"React DevTools",docsReactDevToolsDetail:"Debug React components with React DevTools",docsRNDevTools:"React Native DevTools",docsRNDevToolsDetail:"Explore features available in React Native DevTools"},{render:s,html:l}=i,c=t.i18n.registerUIStrings("panels/rn_welcome/RNWelcome.ts",r),a=t.i18n.getLocalizedString.bind(void 0,c);let d;class g extends e.Widget.VBox{options;static instance(e){return d||(d=new g(e)),d}constructor(e){super(!0,!0),this.options=e}wasShown(){super.wasShown(),this.registerCSSFiles([n]),this.render(),e.InspectorView.InspectorView.instance().showDrawer({focus:!0,hasTargetDrawer:!1})}_handleLinkPress(e){o.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(e)}render(){const{debuggerBrandName:e,showBetaLabel:o=!1,showTechPreviewLabel:t=!1,showDocs:i=!1}=this.options,n=new URL("../../Images/react_native/welcomeIcon.png",import.meta.url).toString();s(l`
      <div class="rn-welcome-panel">
        <header class="rn-welcome-hero">
          <div class="rn-welcome-heading">
            <img class="rn-welcome-icon" src="${n}" role="presentation" />
            <h1 class="rn-welcome-title">
              ${e()}
            </h1>
            ${o?l`
              <div class="rn-welcome-title-accessory">
                ${a(r.betaLabel)}
              </div>
            `:null}
            ${t?l`
              <div class="rn-welcome-title-accessory rn-welcome-title-accessory-purple">
                ${a(r.techPreviewLabel)}
              </div>
            `:null}
          </div>
          <div class="rn-welcome-tagline">
            ${a(r.welcomeMessage)}
          </div>
          <div class="rn-welcome-links">
            <x-link class="devtools-link" href="https://reactnative.dev/docs/debugging">
              ${a(r.docsLabel)}
            </x-link>
            <x-link class="devtools-link" href="https://reactnative.dev/blog">
              ${a(r.whatsNewLabel)}
            </x-link>
          </div>
        </header>
        ${i?l`
          <section class="rn-welcome-docsfeed">
            <h2 class="rn-welcome-h2">Learn</h2>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this._handleLinkPress.bind(this,"https://reactnative.dev/docs/debugging")} title="${a(r.docsDebuggingBasics)}">
              <div class="rn-welcome-image" style="background-image: url('https://reactnative.dev/assets/images/debugging-dev-menu-2453a57e031a9da86b2ed42f16ffe82a.jpg')"></div>
              <div>
                <p class="devtools-link">${a(r.docsDebuggingBasics)}</p>
                <p>${a(r.docsDebuggingBasicsDetail)}</p>
              </div>
            </button>
            <!-- TODO(huntie): Replace this item when React Native DevTools docs are complete -->
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this._handleLinkPress.bind(this,"https://reactnative.dev/docs/debugging/react-devtools")} title="${a(r.docsReactDevTools)}">
              <div class="rn-welcome-image" style="background-image: url('https://reactnative.dev/assets/images/debugging-react-devtools-detail-914f08a97163dd51ebe732fd8ae4ea3c.jpg')"></div>
              <div>
                <p class="devtools-link">${a(r.docsReactDevTools)}</p>
                <p>${a(r.docsReactDevToolsDetail)}</p>
              </div>
            </button>
          </section>
        `:null}
      </div>
    `,this.contentElement,{host:this})}}var m=Object.freeze({__proto__:null,RNWelcomeImpl:g});export{m as RNWelcome};
