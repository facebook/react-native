import*as e from"../../../core/i18n/i18n.js";import*as t from"../../../ui/components/buttons/buttons.js";import*as s from"../../../ui/components/panel_feedback/panel_feedback.js";import*as r from"../../../ui/components/panel_introduction_steps/panel_introduction_steps.js";import*as o from"../../../ui/lit-html/lit-html.js";const a=new CSSStyleSheet;a.replaceSync("h1{font-weight:normal}.css-overview-start-view{padding:24px;display:flex;flex-direction:column;background-color:var(--sys-color-cdt-base-container);overflow:auto}.start-capture-wrapper{width:fit-content}.preview-feature{padding:12px 16px;border:1px solid var(--sys-color-neutral-outline);color:var(--sys-color-on-surface);font-size:13px;line-height:20px;border-radius:12px;margin:42px 0;letter-spacing:0.01em}.preview-header{color:var(--sys-color-primary);font-size:13px;line-height:20px;letter-spacing:0.01em;margin:9px 0 14px}.preview-icon{vertical-align:middle}.feedback-prompt{margin-bottom:24px}.feedback-prompt .devtools-link{color:-webkit-link;cursor:pointer;text-decoration:underline}.resources{display:flex;flex-direction:row}.thumbnail-wrapper{width:144px;height:92px;margin-right:20px}.video-doc-header{font-size:13px;line-height:20px;letter-spacing:0.04em;color:var(--sys-color-on-surface);margin-bottom:2px}devtools-feedback-button{align-self:flex-end}.resources .devtools-link{font-size:14px;line-height:22px;letter-spacing:0.04em;text-decoration-line:underline;color:var(--sys-color-primary)}\n/*# sourceURL=cssOverviewStartView.css */\n");const i={captureOverview:"Capture overview",identifyCSSImprovements:"Identify potential CSS improvements",capturePageCSSOverview:"Capture an overview of your page’s CSS",identifyCSSImprovementsWithExampleIssues:"Identify potential CSS improvements (e.g. low contrast issues, unused declarations, color or font mismatches)",locateAffectedElements:"Locate the affected elements in the Elements panel",quickStartWithCSSOverview:"Quick start: get started with the new CSS overview panel"},n=e.i18n.registerUIStrings("panels/css_overview/components/CSSOverviewStartView.ts",i),c=e.i18n.getLocalizedString.bind(void 0,n),{render:l,html:p}=o,d="https://g.co/devtools/css-overview-feedback";class v extends Event{static eventName="overviewstartrequested";constructor(){super(v.eventName)}}class m extends HTMLElement{static litTagName=o.literal`devtools-css-overview-start-view`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[a],this.#t()}show(){this.classList.remove("hidden")}hide(){this.classList.add("hidden")}#s(){this.dispatchEvent(new v)}#t(){l(p`
      <div class="css-overview-start-view">
        <${r.PanelIntroductionSteps.PanelIntroductionSteps.litTagName}>
          <span slot="title">${c(i.identifyCSSImprovements)}</span>
          <span slot="step-1">${c(i.capturePageCSSOverview)}</span>
          <span slot="step-2">${c(i.identifyCSSImprovementsWithExampleIssues)}</span>
          <span slot="step-3">${c(i.locateAffectedElements)}</span>
        </${r.PanelIntroductionSteps.PanelIntroductionSteps.litTagName}>
        <div class="start-capture-wrapper">
          <${t.Button.Button.litTagName}
            class="start-capture"
            .variant=${"primary"}
            .jslogContext=${"css-overview.capture-overview"}
            @click=${this.#s}>
            ${c(i.captureOverview)}
          </${t.Button.Button.litTagName}>
        </div>
        <${s.PanelFeedback.PanelFeedback.litTagName} .data=${{feedbackUrl:d,quickStartUrl:"https://developer.chrome.com/docs/devtools/css-overview",quickStartLinkText:c(i.quickStartWithCSSOverview)}}>
        </${s.PanelFeedback.PanelFeedback.litTagName}>
        <${s.FeedbackButton.FeedbackButton.litTagName} .data=${{feedbackUrl:d}}>
        </${s.FeedbackButton.FeedbackButton.litTagName}>
      </div>
    `,this.#e,{host:this});const e=this.#e.querySelector(".start-capture");e&&e.focus()}}customElements.define("devtools-css-overview-start-view",m);var u=Object.freeze({__proto__:null,OverviewStartRequestedEvent:v,CSSOverviewStartView:m});export{u as CSSOverviewStartView};
