import*as e from"../../ui/legacy/legacy.js";import*as i from"../../core/host/host.js";import*as t from"../../core/i18n/i18n.js";import*as o from"../../core/root/root.js";import*as n from"../../core/sdk/sdk.js";import*as r from"../../ui/lit-html/lit-html.js";const a=new CSSStyleSheet;a.replaceSync('.rn-welcome-panel{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;justify-content:center;padding:36px;background-color:var(--color-background-elevation-0);min-height:100%}@media (min-width: 1000px){.rn-welcome-panel{flex-direction:row;align-items:center;justify-content:stretch;height:100%;padding:0}}.rn-welcome-hero{display:flex;flex-direction:column;flex-grow:1;flex-shrink:0;align-items:center;justify-content:center;padding:16px;text-align:center}@media (min-width: 1000px){.rn-welcome-hero{margin-left:24px}}.rn-welcome-heading{display:flex;align-items:center;margin-bottom:16px}.rn-welcome-icon{width:30px;height:30px;border-radius:4px;margin-right:12px}.rn-welcome-title{font-size:20px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-title-accessory{margin-left:12px;padding:4px 8px;border-radius:4px;background-color:var(--color-green);font-size:12px;color:var(--color-on-primary)}.rn-welcome-title-accessory-purple{background-color:var(--color-purple-bright)}.rn-welcome-tagline{margin-bottom:24px;font-size:1rem;line-height:1.3;color:var(--color-text-secondary)}.rn-welcome-links{display:flex;align-items:center}.rn-welcome-links > .devtools-link{position:relative;margin:0 16px;font-size:14px}.rn-welcome-links > .devtools-link:not(:last-child)::after{content:"";position:absolute;right:-16px;height:16px;border-right:1px solid var(--color-details-hairline)}.rn-session-id{display:flex;align-items:center;margin-top:24px;user-select:all}.rn-welcome-version{position:fixed;top:8px;right:8px;margin-top:24px;padding:4px 12px;border-radius:6px;background-color:var(--color-background-hover-overlay);color:var(--color-text-secondary);font-size:11px}.rn-welcome-docsfeed{display:flex;flex-direction:column;flex-shrink:0;align-items:stretch;max-width:700px;margin:0 auto;padding:24px}@media (min-width: 1000px){.rn-welcome-docsfeed{flex-shrink:1;width:45%;max-height:100%;margin:0;padding:20px 24px;padding-right:80px;overflow:auto}}.rn-welcome-h2{flex-shrink:0;font-size:16px;font-weight:normal;color:var(--color-text-primary)}.rn-welcome-docsfeed-item{display:flex;flex-shrink:0;align-items:center;margin-bottom:8px;padding:8px;padding-right:16px;border:1px solid var(--color-details-hairline);border-radius:4px;background-color:var(--color-background);text-align:left;font-size:14px;cursor:pointer}.rn-welcome-docsfeed-item:hover{background-color:var(--color-background-elevation-0)}.rn-welcome-docsfeed-item:focus{outline:solid var(--color-button-outline-focus)}.rn-welcome-docsfeed-item p{margin:0;margin-bottom:4px;text-decoration:none}.rn-welcome-docsfeed-item :not(.devtools-link){color:var(--color-text-secondary)}.rn-welcome-image{flex-shrink:0;aspect-ratio:calc(16 / 9);height:64px;margin-right:16px;border-radius:2px;background-color:var(--color-gray-100);background-position:center;background-size:cover}\n/*# sourceURL=rnWelcome.css */\n');const s={betaLabel:"Beta",techPreviewLabel:"Tech Preview",welcomeMessage:"Welcome to debugging in React Native",docsLabel:"Debugging docs",whatsNewLabel:"What's new",sessionIdMessage:"[FB-only] The ID for this React Native DevTools session is:",docsDebuggingBasics:"Debugging Basics",docsDebuggingBasicsDetail:"Overview of debugging tools in React Native",docsReactNativeDevTools:"React Native DevTools",docsReactDevToolsDetail:"Explore features available in React Native DevTools",docsNativeDebugging:"Native Debugging",docsNativeDebuggingDetail:"Find out more about native debugging tools"},{render:l,html:c}=r,d=t.i18n.registerUIStrings("panels/rn_welcome/RNWelcome.ts",s),g=t.i18n.getLocalizedString.bind(void 0,d);let m;class p extends e.Widget.VBox{options;#e;#i=!1;static instance(e){return m||(m=new p(e)),m}constructor(e){super(!0,!0),this.options=e,n.TargetManager.TargetManager.instance().observeModels(n.ReactNativeApplicationModel.ReactNativeApplicationModel,this)}wasShown(){super.wasShown(),this.registerCSSFiles([a]),this.render(),this.#i||e.InspectorView.InspectorView.instance().showDrawer({focus:!0,hasTargetDrawer:!1})}modelAdded(e){e.ensureEnabled(),e.addEventListener("MetadataUpdated",this.#t,this),this.#e=e.metadataCached?.reactNativeVersion,this.#i=e.metadataCached?.unstable_isProfilingBuild||!1}modelRemoved(e){e.removeEventListener("MetadataUpdated",this.#t,this)}#t(e){this.#e=e.data.reactNativeVersion,this.#i=e.data.unstable_isProfilingBuild||!1,this.isShowing()&&this.render()}#o(e){i.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(e)}render(){const{debuggerBrandName:e,showBetaLabel:i=!1,showTechPreviewLabel:t=!1,showDocs:n=!1}=this.options,r=new URL("../../Images/react_native/welcomeIcon.png",import.meta.url).toString(),a=new URL("../../Images/react_native/learn-debugging-basics.jpg",import.meta.url).toString(),d=new URL("../../Images/react_native/learn-react-native-devtools.jpg",import.meta.url).toString(),m=new URL("../../Images/react_native/learn-native-debugging.jpg",import.meta.url).toString(),p=o.Runtime.Runtime.queryParam("launchId");l(c`
      <div class="rn-welcome-panel">
        <header class="rn-welcome-hero">
          <div class="rn-welcome-heading">
            <img class="rn-welcome-icon" src=${r} role="presentation" />
            <h1 class="rn-welcome-title">
              ${e()}
            </h1>
            ${i?c`
              <div class="rn-welcome-title-accessory">
                ${g(s.betaLabel)}
              </div>
            `:null}
            ${t?c`
              <div class="rn-welcome-title-accessory rn-welcome-title-accessory-purple">
                ${g(s.techPreviewLabel)}
              </div>
            `:null}
          </div>
          <div class="rn-welcome-tagline">
            ${g(s.welcomeMessage)}
          </div>
          <div class="rn-welcome-links">
            <x-link class="devtools-link" href="https://reactnative.dev/docs/debugging">
              ${g(s.docsLabel)}
            </x-link>
            <x-link class="devtools-link" href="https://reactnative.dev/blog">
              ${g(s.whatsNewLabel)}
            </x-link>
          </div>
          ${p?c`
            <div class="rn-session-id">
              ${g(s.sessionIdMessage)}
              <br/>
              ${p}
            </div>
          `:""}
          ${null!==this.#e&&void 0!==this.#e?c`
              <p class="rn-welcome-version">React Native: <code>${this.#e}</code></p>
            `:null}
        </header>
        ${n?c`
          <section class="rn-welcome-docsfeed">
            <h2 class="rn-welcome-h2">Learn</h2>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#o.bind(this,"https://reactnative.dev/docs/debugging")} title=${g(s.docsDebuggingBasics)}>
              <div class="rn-welcome-image" style="background-image: url('${a}')"></div>
              <div>
                <p class="devtools-link">${g(s.docsDebuggingBasics)}</p>
                <p>${g(s.docsDebuggingBasicsDetail)}</p>
              </div>
            </button>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#o.bind(this,"https://reactnative.dev/docs/react-native-devtools")} title=${g(s.docsReactNativeDevTools)}>
              <div class="rn-welcome-image" style="background-image: url('${d}')"></div>
              <div>
                <p class="devtools-link">${g(s.docsReactNativeDevTools)}</p>
                <p>${g(s.docsReactDevToolsDetail)}</p>
              </div>
            </button>
            <button class="rn-welcome-docsfeed-item" type="button" role="link" @click=${this.#o.bind(this,"https://reactnative.dev/docs/debugging-native-code")} title=${g(s.docsNativeDebugging)}>
              <div class="rn-welcome-image" style="background-image: url('${m}')"></div>
              <div>
                <p class="devtools-link">${g(s.docsNativeDebugging)}</p>
                <p>${g(s.docsNativeDebuggingDetail)}</p>
              </div>
            </button>
          </section>
        `:null}
      </div>
    `,this.contentElement,{host:this})}}var v=Object.freeze({__proto__:null,RNWelcomeImpl:p});export{v as RNWelcome};
