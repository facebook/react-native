import*as e from"../../ui/legacy/legacy.js";import*as t from"../../core/host/host.js";import*as o from"../../core/i18n/i18n.js";import*as i from"../../core/sdk/sdk.js";import*as n from"../../ui/lit-html/lit-html.js";const r=new CSSStyleSheet;r.replaceSync('.rn-welcome-panel{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;justify-content:center;padding:36px;background-color:var(--color-background-elevation-0);min-height:100%}@media (min-width: 1000px){.rn-welcome-panel{flex-direction:row;align-items:center;justify-content:stretch;height:100%;padding:0}}.rn-welcome-hero{display:flex;flex-direction:column;flex-grow:1;flex-shrink:0;align-items:center;justify-content:center;padding:16px;text-align:center}@media (min-width: 1000px){.rn-welcome-hero{margin-left:24px}}.rn-welcome-heading{display:flex;align-items:center;margin-bottom:16px}.rn-welcome-icon{width:30px;height:30px;border-radius:4px;margin-right:12px}.rn-welcome-title{font-size:20px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-title-accessory{margin-left:12px;padding:4px 8px;border-radius:4px;background-color:var(--color-green);font-size:12px;color:var(--color-on-primary)}.rn-welcome-title-accessory-purple{background-color:var(--color-purple-bright)}.rn-welcome-tagline{margin-bottom:24px;font-size:1rem;line-height:1.3;color:var(--color-text-secondary)}.rn-welcome-links{display:flex;align-items:center}.rn-welcome-links > .devtools-link{position:relative;margin:0 16px;font-size:14px}.rn-welcome-links > .devtools-link:not(:last-child)::after{content:"";position:absolute;right:-16px;height:16px;border-right:1px solid var(--color-details-hairline)}.rn-welcome-version{position:fixed;top:8px;right:8px;margin-top:24px;padding:4px 12px;border-radius:6px;background-color:var(--color-background-hover-overlay);color:var(--color-text-secondary);font-size:11px}.rn-welcome-docsfeed{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;max-width:700px;margin:0 auto;padding:24px}@media (min-width: 1000px){.rn-welcome-docsfeed{flex-shrink:1;width:45%;max-height:100%;margin:0;padding:20px 24px;padding-right:80px;overflow:auto}}.rn-welcome-h2{flex-shrink:0;font-size:16px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-docsfeed-item{display:flex;flex-shrink:0;align-items:center;margin-bottom:8px;padding:8px;padding-right:16px;border:1px solid var(--color-details-hairline);border-radius:4px;background-color:var(--color-background);text-align:left;font-size:14px;cursor:pointer}.rn-welcome-docsfeed-item:hover{background-color:var(--color-background-elevation-0)}.rn-welcome-docsfeed-item:focus{outline:solid var(--color-button-outline-focus)}.rn-welcome-docsfeed-item p{margin:0;margin-bottom:4px;text-decoration:none}.rn-welcome-docsfeed-item :not(.devtools-link){color:var(--color-text-secondary)}.rn-welcome-image{flex-shrink:0;aspect-ratio:calc(16 / 9);height:64px;margin-right:16px;border-radius:2px;background-color:var(--color-gray-100);background-position:center;background-size:cover}\n/*# sourceURL=rnWelcome.css */\n');const a={betaLabel:"Beta",techPreviewLabel:"Tech Preview",welcomeMessage:"Welcome to debugging in React Native",docsLabel:"Debugging docs",whatsNewLabel:"What's new",docsDebuggingBasics:"Debugging Basics",docsDebuggingBasicsDetail:"Overview of debugging tools in React Native",docsReactNativeDevTools:"React Native DevTools",docsReactDevToolsDetail:"Explore features available in React Native DevTools",docsNativeDebugging:"Native Debugging",docsNativeDebuggingDetail:"Find out more about native debugging tools"},{render:s,html:l}=n,c=o.i18n.registerUIStrings("panels/rn_welcome/RNWelcome.ts",a),d=o.i18n.getLocalizedString.bind(void 0,c);let g;class p extends e.Widget.VBox{options;#e;static instance(e){return g||(g=new p(e)),g}constructor(e){super(!0,!0),this.options=e,i.TargetManager.TargetManager.instance().observeModels(i.ReactNativeApplicationModel.ReactNativeApplicationModel,this)}wasShown(){super.wasShown(),this.registerCSSFiles([r]),this.render(),e.InspectorView.InspectorView.instance().showDrawer({focus:!0,hasTargetDrawer:!1})}modelAdded(e){e.ensureEnabled(),e.addEventListener("MetadataUpdated",this.#t,this),this.#e=e.metadataCached?.reactNativeVersion}modelRemoved(e){e.removeEventListener("MetadataUpdated",this.#t,this)}#t(e){this.#e=e.data.reactNativeVersion,this.isShowing()&&this.render()}#o(e){t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(e)}render(){const{debuggerBrandName:e,showBetaLabel:t=!1,showTechPreviewLabel:o=!1,showDocs:i=!1}=this.options,n=new URL("../../Images/react_native/welcomeIcon.png",import.meta.url).toString(),r=new URL("../../Images/react_native/learn-debugging-basics.jpg",import.meta.url).toString(),c=new URL("../../Images/react_native/learn-react-native-devtools.jpg",import.meta.url).toString(),g=new URL("../../Images/react_native/learn-native-debugging.jpg",import.meta.url).toString();s(l`
      <div class="rn-welcome-panel">
        <header class="rn-welcome-hero">
          <div class="rn-welcome-heading">
            <img class="rn-welcome-icon" src=${n} role="presentation" />
            <h1 class="rn-welcome-title">
              ${e()}
            </h1>
            ${t?l`
              <div class="rn-welcome-title-accessory">
                ${d(a.betaLabel)}
              </div>
            `:null}
            ${o?l`
              <div class="rn-welcome-title-accessory rn-welcome-title-accessory-purple">
                ${d(a.techPreviewLabel)}
              </div>
            `:null}
          </div>
          <div class="rn-welcome-tagline">
            ${d(a.welcomeMessage)}
          </div>
          <div class="rn-welcome-links">
            <x-link class="devtools-link" href="https://reactnative.dev/docs/debugging">
              ${d(a.docsLabel)}
            </x-link>
            <x-link class="devtools-link" href="https://reactnative.dev/blog">
              ${d(a.whatsNewLabel)}
            </x-link>
          </div>
          ${null!==this.#e&&void 0!==this.#e?l`
              <p class="rn-welcome-version">React Native: <code>${this.#e}</code></p>
            `:null}
        </header>
        ${i?l`
          <section class="rn-welcome-docsfeed">
            <h2 class="rn-welcome-h2">Learn</h2>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#o.bind(this,"https://reactnative.dev/docs/debugging")} title=${d(a.docsDebuggingBasics)}>
              <div class="rn-welcome-image" style="background-image: url('${r}')"></div>
              <div>
                <p class="devtools-link">${d(a.docsDebuggingBasics)}</p>
                <p>${d(a.docsDebuggingBasicsDetail)}</p>
              </div>
            </button>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#o.bind(this,"https://reactnative.dev/docs/react-devtools")} title=${d(a.docsReactNativeDevTools)}>
              <div class="rn-welcome-image" style="background-image: url('${c}')"></div>
              <div>
                <p class="devtools-link">${d(a.docsReactNativeDevTools)}</p>
                <p>${d(a.docsReactDevToolsDetail)}</p>
              </div>
            </button>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#o.bind(this,"https://reactnative.dev/docs/debugging-native-code")} title=${d(a.docsNativeDebugging)}>
              <div class="rn-welcome-image" style="background-image: url('${g}')"></div>
              <div>
                <p class="devtools-link">${d(a.docsNativeDebugging)}</p>
                <p>${d(a.docsNativeDebuggingDetail)}</p>
              </div>
            </button>
          </section>
        `:null}
      </div>
    `,this.contentElement,{host:this})}}var m=Object.freeze({__proto__:null,RNWelcomeImpl:p});export{m as RNWelcome};
