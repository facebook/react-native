import*as e from"../../core/host/host.js";import*as t from"../../core/i18n/i18n.js";import"../../ui/components/buttons/buttons.js";import*as s from"../../ui/legacy/legacy.js";import*as i from"../../ui/lit/lit.js";var o={cssText:`.fre-disclaimer{width:var(--sys-size-33);padding:var(--sys-size-9);header{display:flex;gap:var(--sys-size-8);margin-bottom:var(--sys-size-6);align-items:center;h2{margin:0;color:var(--sys-color-on-surface);font:var(--sys-typescale-headline5)}.header-icon-container{background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary));border-radius:var(--sys-size-4);min-height:var(--sys-size-14);min-width:var(--sys-size-14);display:flex;align-items:center;justify-content:center;devtools-icon{width:var(--sys-size-9);height:var(--sys-size-9)}}}.reminder-container{border-radius:var(--sys-size-6);background-color:var(--sys-color-surface4);padding:var(--sys-size-9);h3{color:var(--sys-color-on-surface);font:var(--sys-typescale-body4-medium);margin:0}.reminder-item{display:flex;flex-direction:row;align-items:center;gap:var(--sys-size-5);margin-top:var(--sys-size-6);font:var(--sys-typescale-body5-regular);devtools-icon.reminder-icon{width:var(--sys-size-8);height:var(--sys-size-8)}.link{color:var(--sys-color-primary);text-decoration-line:underline}}}footer{display:flex;flex-direction:row;align-items:center;justify-content:space-between;margin-top:var(--sys-size-8);min-width:var(--sys-size-28);.right-buttons{display:flex;gap:var(--sys-size-5)}}}.type-to-allow-dialog{width:100%;.header{display:flex;justify-content:space-between;font:var(--sys-typescale-body2-medium);margin:var(--sys-size-5) var(--sys-size-5) var(--sys-size-5) var(--sys-size-8)}.title{padding-top:var(--sys-size-3)}.dialog-close-button{margin:var(--sys-size-3);z-index:1}.message,\n  .text-input{margin:0 var(--sys-size-8)}.text-input{margin-top:var(--sys-size-5)}.button{text-align:right;margin:var(--sys-size-6) var(--sys-size-8) var(--sys-size-8) var(--sys-size-8);gap:var(--sys-size-5);display:flex;flex-direction:row-reverse;justify-content:flex-start}.button button{min-width:var(--sys-size-19)}}\n/*# sourceURL=${import.meta.resolve("./common.css")} */\n`};const{html:a}=i,r={thingsToConsider:"Things to consider",learnMore:"Learn more",cancel:"Cancel",allow:"Allow",gotIt:"Got it"},n=t.i18n.registerUIStrings("panels/common/common.ts",r),l=t.i18n.getLocalizedString.bind(void 0,n);class c{static show({header:e,reminderItems:t,onLearnMoreClick:n,ariaLabel:c,learnMoreButtonTitle:d}){const v=new s.Dialog.Dialog;c&&v.setAriaLabel(c);const m=Promise.withResolvers();return i.render(a`
      <div class="fre-disclaimer">
        <style>
          ${o.cssText}
        </style>
        <header>
          <div class="header-icon-container">
            <devtools-icon name=${e.iconName}></devtools-icon>
          </div>
          <h2 tabindex="-1">
            ${e.text}
          </h2>
        </header>
        <main class="reminder-container">
          <h3>${l(r.thingsToConsider)}</h3>
          ${t.map((e=>a`
            <div class="reminder-item">
              <devtools-icon class="reminder-icon" name=${e.iconName}></devtools-icon>
              <span>${e.content}</span>
            </div>
          `))}
        </main>
        <footer>
          <devtools-button
            @click=${n}
            .jslogContext=${"fre-disclaimer.learn-more"}
            .variant=${"outlined"}>
            ${d??l(r.learnMore)}
          </devtools-button>
          <div class="right-buttons">
            <devtools-button
              @click=${()=>{v.hide(),m.resolve(!1)}}
              .jslogContext=${"fre-disclaimer.cancel"}
              .variant=${"tonal"}>
              ${l(r.cancel)}
            </devtools-button>
            <devtools-button
              @click=${()=>{v.hide(),m.resolve(!0)}}
              .jslogContext=${"fre-disclaimer.continue"}
              .variant=${"primary"}>
              ${l(r.gotIt)}
            </devtools-button>
          </div>
        </footer>
      </div>`,v.contentElement),v.setOutsideClickCallback((e=>{e.consume(),v.hide(),m.resolve(!1)})),v.setSizeBehavior("MeasureContent"),v.setDimmed(!0),v.show(),m.promise}constructor(){}}class d{static async show(t){const i=new s.Dialog.Dialog(t.jslogContext.dialog);i.setMaxContentSize(new s.Geometry.Size(504,340)),i.setSizeBehavior("SetExactWidthMaxHeight"),i.setDimmed(!0);const a=s.UIUtils.createShadowRootWithCoreStyles(i.contentElement,{cssFile:o}).createChild("div","type-to-allow-dialog"),n=await new Promise((o=>{const n=a.createChild("div","header");n.createChild("div","title").textContent=t.header;const c=n.createChild("dt-close-button","dialog-close-button");c.setTabbable(!0),self.onInvokeElement(c,(e=>{i.hide(),e.consume(!0),o(!1)})),c.setSize("SMALL"),a.createChild("div","message").textContent=t.message;const d=s.UIUtils.createInput("text-input","text",t.jslogContext.input);d.placeholder=t.inputPlaceholder,a.appendChild(d);const v=a.createChild("div","button"),m=s.UIUtils.createTextButton(l(r.cancel),(()=>o(!1)),{jslogContext:"cancel"}),y=s.UIUtils.createTextButton(l(r.allow),(()=>{o(d.value===t.typePhrase)}),{jslogContext:"confirm",variant:"primary"});y.disabled=!0,v.appendChild(y),v.appendChild(m),d.addEventListener("input",(()=>{y.disabled=!Boolean(d.value)}),!1),d.addEventListener("paste",(e=>e.preventDefault())),d.addEventListener("drop",(e=>e.preventDefault())),i.setOutsideClickCallback((e=>{e.consume(),o(!1)})),i.show(),e.userMetrics.actionTaken(e.UserMetrics.Action.SelfXssWarningDialogShown)}));return i.hide(),n}}export{c as FreDialog,d as TypeToAllowDialog};
