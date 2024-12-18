import*as e from"../../../core/host/host.js";import*as t from"../../../core/i18n/i18n.js";import*as i from"../../../core/platform/platform.js";import*as n from"../helpers/helpers.js";import*as r from"../../lit-html/lit-html.js";import*as o from"../buttons/buttons.js";import*as a from"../../visual_logging/visual_logging.js";import*as s from"../icon_button/icon_button.js";import*as l from"../../../core/root/root.js";import*as c from"../input/input.js";const d={feedback:"Feedback"},h=t.i18n.registerUIStrings("ui/components/panel_feedback/FeedbackButton.ts",d),p=t.i18n.getLocalizedString.bind(void 0,h),m=new URL("../../../Images/review.svg",import.meta.url).toString();class k extends HTMLElement{static litTagName=r.literal`devtools-feedback-button`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#n={feedbackUrl:i.DevToolsPath.EmptyUrlString};set data(e){this.#n=e,n.ScheduledRender.scheduleRender(this,this.#t)}#r(){e.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(this.#n.feedbackUrl)}#i(){if(!n.ScheduledRender.isScheduledRender(this))throw new Error("FeedbackButton render was not scheduled");r.render(r.html`
      <${o.Button.Button.litTagName}
          @click=${this.#r}
          .iconUrl=${m}
          .variant=${"outlined"}
          .jslogContext=${"feedback"}
      >${p(d.feedback)}</${o.Button.Button.litTagName}>
      `,this.#e,{host:this})}}customElements.define("devtools-feedback-button",k);var x=Object.freeze({__proto__:null,FeedbackButton:k});const b=new CSSStyleSheet;b.replaceSync(":host{display:block}.preview{padding:12px 16px;border:1px solid var(--sys-color-divider);color:var(--sys-color-on-surface);font-size:13px;line-height:20px;border-radius:12px;margin:42px 0;letter-spacing:0.01em}h2{color:var(--sys-color-primary);font-size:13px;line-height:20px;letter-spacing:0.01em;margin:9px 0 14px;display:flex;align-items:center;gap:5px;font-weight:normal}h3{font-size:13px;line-height:20px;letter-spacing:0.04em;color:var(--sys-color-on-surface);margin-bottom:2px;font-weight:normal}.preview p{margin-bottom:24px}.thumbnail{height:92px}.video{display:flex;flex-flow:row wrap;gap:20px}x-link{color:var(--sys-color-primary);text-decoration-line:underline}x-link.quick-start-link{font-size:14px;line-height:22px;letter-spacing:0.04em}.video-description{min-width:min-content;flex-basis:min-content;flex-grow:1}@media (forced-colors: active){x-link{color:linktext}}\n/*# sourceURL=panelFeedback.css */\n");const g={previewText:"Our team is actively working on this feature and we would love to know what you think.",previewTextFeedbackLink:"Send us your feedback.",previewFeature:"Preview feature",videoAndDocumentation:"Video and documentation"},u=t.i18n.registerUIStrings("ui/components/panel_feedback/PanelFeedback.ts",g),v=t.i18n.getLocalizedString.bind(void 0,u),f=new URL("../../../Images/experiment.svg",import.meta.url).toString(),w=new URL("../../../Images/preview_feature_video_thumbnail.svg",import.meta.url).toString();class S extends HTMLElement{static litTagName=r.literal`devtools-panel-feedback`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#n={feedbackUrl:i.DevToolsPath.EmptyUrlString,quickStartUrl:i.DevToolsPath.EmptyUrlString,quickStartLinkText:""};connectedCallback(){this.#e.adoptedStyleSheets=[b]}set data(e){this.#n=e,n.ScheduledRender.scheduleRender(this,this.#t)}#i(){if(!n.ScheduledRender.isScheduledRender(this))throw new Error("PanelFeedback render was not scheduled");r.render(r.html`
      <div class="preview">
        <h2 class="flex">
          <${s.Icon.Icon.litTagName} .data=${{iconPath:f,width:"20px",height:"20px",color:"var(--icon-primary)"}}></${s.Icon.Icon.litTagName}> ${v(g.previewFeature)}
        </h2>
        <p>${v(g.previewText)} <x-link href=${this.#n.feedbackUrl} jslog=${a.link("feedback").track({click:!0})}>${v(g.previewTextFeedbackLink)}</x-link></p>
        <div class="video">
          <div class="thumbnail">
            <img src=${w} role="presentation" />
          </div>
          <div class="video-description">
            <h3>${v(g.videoAndDocumentation)}</h3>
            <x-link class="quick-start-link" href=${this.#n.quickStartUrl} jslog=${a.link("css-overview.quick-start").track({click:!0})}>${this.#n.quickStartLinkText}</x-link>
          </div>
        </div>
      </div>
      `,this.#e,{host:this})}}customElements.define("devtools-panel-feedback",S);var $=Object.freeze({__proto__:null,PanelFeedback:S});const L=new CSSStyleSheet;L.replaceSync(":host{display:block}.container{display:flex;flex-wrap:wrap;padding:4px}.experiment-preview,\n.feedback,\n.learn-more{display:flex;align-items:center}.helper{flex-basis:100%;text-align:center;font-style:italic}.spacer{flex:1}.x-link{color:var(--sys-color-primary);text-decoration-line:underline;margin:0 4px}.feedback .x-link{color:var(--sys-color-token-subtle)}\n/*# sourceURL=previewToggle.css */\n");const{render:T,html:y,nothing:R}=r,U={previewTextFeedbackLink:"Send us your feedback.",shortFeedbackLink:"Send feedback",learnMoreLink:"Learn More"},F=t.i18n.registerUIStrings("ui/components/panel_feedback/PreviewToggle.ts",U),_=t.i18n.getLocalizedString.bind(void 0,F);class I extends HTMLElement{static litTagName=r.literal`devtools-preview-toggle`;#e=this.attachShadow({mode:"open"});#o="";#a=null;#s=null;#l;#c="";#d;connectedCallback(){this.#e.adoptedStyleSheets=[c.checkboxStyles,L]}set data(e){this.#o=e.name,this.#a=e.helperText,this.#s=e.feedbackURL,this.#l=e.learnMoreURL,this.#c=e.experiment,this.#d=e.onChangeCallback,this.#i()}#i(){const e=l.Runtime.experiments.isEnabled(this.#c);T(y`
      <div class="container">
        <label class="experiment-preview">
          <input type="checkbox" ?checked=${e} @change=${this.#h} aria-label=${this.#o}/>
          <${s.Icon.Icon.litTagName} .data=${{iconName:"experiment",width:"16px",height:"16px",color:"var(--icon-default)"}}>
          </${s.Icon.Icon.litTagName}>${this.#o}
        </label>
        <div class="spacer"></div>
        ${this.#s&&!this.#a?y`<div class="feedback"><x-link class="x-link" href=${this.#s}>${_(U.shortFeedbackLink)}</x-link></div>`:R}
        ${this.#l?y`<div class="learn-more"><x-link class="x-link" href=${this.#l}>${_(U.learnMoreLink)}</x-link></div>`:R}
        <div class="helper">
          ${this.#a&&this.#s?y`<p>${this.#a} <x-link class="x-link" href=${this.#s}>${_(U.previewTextFeedbackLink)}</x-link></p>`:R}
        </div>
      </div>`,this.#e,{host:this})}#h(e){const t=e.target.checked;l.Runtime.experiments.setEnabled(this.#c,t),this.#d?.(t)}}customElements.define("devtools-preview-toggle",I);var C=Object.freeze({__proto__:null,PreviewToggle:I});export{x as FeedbackButton,$ as PanelFeedback,C as PreviewToggle};
