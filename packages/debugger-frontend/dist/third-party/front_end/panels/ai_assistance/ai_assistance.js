import*as e from"../../ui/legacy/legacy.js";import*as t from"../../core/common/common.js";import*as s from"../../core/host/host.js";import*as n from"../../core/i18n/i18n.js";import*as i from"../../core/root/root.js";import*as o from"../../core/sdk/sdk.js";import*as a from"../../models/ai_assistance/ai_assistance.js";import*as r from"../../models/workspace/workspace.js";import"../../ui/components/buttons/buttons.js";import*as l from"../../ui/lit/lit.js";import{Directives as c,nothing as d,html as h,render as g}from"../../ui/lit/lit.js";import*as u from"../../ui/visual_logging/visual_logging.js";import*as p from"../elements/elements.js";import*as v from"../network/forward/forward.js";import*as m from"../network/network.js";import*as f from"../sources/sources.js";import*as y from"../timeline/timeline.js";import*as b from"../timeline/utils/utils.js";import"../../ui/components/spinners/spinners.js";import*as w from"../../third_party/marked/marked.js";import*as C from"../../ui/components/markdown_view/markdown_view.js";import"../../ui/components/tooltips/tooltips.js";import*as k from"../../models/persistence/persistence.js";import*as x from"../../models/workspace_diff/workspace_diff.js";import*as S from"../changes/changes.js";import*as A from"../../ui/components/input/input.js";var I={cssText:`.toolbar-container{display:flex;background-color:var(--sys-color-cdt-base-container);border-bottom:1px solid var(--sys-color-divider);flex:0 0 auto;justify-content:space-between}.chat-container{display:flex;flex-direction:column;width:100%;height:100%;align-items:center;overflow:hidden}.toolbar-feedback-link{color:var(--sys-color-primary);margin:0 var(--sys-size-3);height:auto}\n/*# sourceURL=${import.meta.resolve("././aiAssistancePanel.css")} */\n`};const{classMap:T}=c,$="Unsaved changes",E="Applying to page tree…",R="Apply to page tree",z="Cancel",L="Discard",M="Save to workspace",F="Changes saved to workspace",O="Use code snippets with caution",P="The source code of the inspected page and its assets, and any data the inspected page can access is sent to Google to generate code suggestions.",j="The source code of the inspected page and its assets, and any data the inspected page can access is sent to Google to generate code suggestions. This data will not be used to improve Google’s AI models.",D="Learn more",N="View data sent to Google",U="(opens in a new tab)",q="Changes couldn’t be applied to the page tree.",B="Export patch file",_="Changes exported as patch file",V=n.i18n.lockedString;var H;!function(e){e.INITIAL="initial",e.LOADING="loading",e.SUCCESS="success",e.ERROR="error",e.EXPORTED_AS_PATCH="exportedAsPatch",e.SAVED_TO_WORKSPACE="savedToWorkspace"}(H||(H={}));let W=class extends e.Widget.Widget{changeSummary="";changeManager;#e;#t={};#s;#n;#i;#o;#a=H.INITIAL;#r=x.WorkspaceDiff.workspaceDiff();#l=k.Persistence.PersistenceImpl.instance();constructor(t,n,o){super(!1,!1,t),this.#s=o?.aidaClient??new s.AidaClient.AidaClient,this.#o=i.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===i.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING,this.#e=n??((t,s,n)=>{function i(){return t.sources?h`<x-link
          class="link sources-link"
          title="${N} ${U}"
          href="data:text/plain,${encodeURIComponent(t.sources)}"
          jslog=${u.link("files-used-in-patching").track({click:!0})}>
          ${N}
        </x-link>`:d}(t.changeSummary||t.patchSuggestionState!==H.INITIAL)&&(s.tooltipRef=s.tooltipRef??c.createRef(),g(h`
          <details class=${T({"change-summary":!0,exported:t.patchSuggestionState===H.EXPORTED_AS_PATCH||t.patchSuggestionState===H.SAVED_TO_WORKSPACE})}>
            <summary>
              ${t.patchSuggestionState===H.EXPORTED_AS_PATCH||t.patchSuggestionState===H.SAVED_TO_WORKSPACE?h`
            <devtools-icon class="green-bright-icon summary-badge" .name=${"check-circle"}></devtools-icon>
            <span class="header-text">
              ${t.patchSuggestionState===H.EXPORTED_AS_PATCH?V(_):V(F)}
            </span>
          `:t.patchSuggestionState===H.SUCCESS?h`
            <devtools-icon class="on-tonal-icon summary-badge" .name=${"difference"}></devtools-icon>
            <span class="header-text">
              ${V("File changes in page")}
            </span>
            <devtools-icon
              class="arrow"
              .name=${"chevron-down"}
            ></devtools-icon>
          `:h`
          <devtools-icon class="on-tonal-icon summary-badge" .name=${"pen-spark"}></devtools-icon>
          <span class="header-text">
            ${V($)}
          </span>
          <devtools-icon
            class="arrow"
            .name=${"chevron-down"}
          ></devtools-icon>
        `}
            </summary>
            ${!t.changeSummary&&t.patchSuggestionState===H.INITIAL||t.patchSuggestionState===H.EXPORTED_AS_PATCH||t.patchSuggestionState===H.SAVED_TO_WORKSPACE?d:t.patchSuggestionState===H.SUCCESS?h`<devtools-widget .widgetConfig=${e.Widget.widgetConfig(S.CombinedDiffView.CombinedDiffView,{workspaceDiff:t.workspaceDiff})}></devtools-widget>`:h`<devtools-code-block
          .code=${t.changeSummary??""}
          .codeLang=${"css"}
          .displayNotice=${!0}
        ></devtools-code-block>
        ${t.patchSuggestionState===H.ERROR?h`<div class="error-container">
              <devtools-icon .name=${"cross-circle-filled"}></devtools-icon>${V(q)} ${i()}
            </div>`:d}`}
            ${t.patchSuggestionState===H.EXPORTED_AS_PATCH||t.patchSuggestionState===H.SAVED_TO_WORKSPACE?d:t.patchSuggestionState===H.SUCCESS?h`
          <div class="footer">
            <x-link class="link disclaimer-link" href="https://support.google.com/legal/answer/13505487" jslog=${u.link("code-disclaimer").track({click:!0})}>
              ${V(O)}
            </x-link>
            ${i()}
            <div class="save-or-discard-buttons">
              <devtools-button
                @click=${t.onDiscard}
                .jslogContext=${"patch-widget.discard"}
                .variant=${"outlined"}>
                  ${V(L)}
              </devtools-button>
              ${t.onSaveToWorkspace?h`
                <devtools-button
                  @click=${t.onSaveToWorkspace}
                  .jslogContext=${"patch-widget.save-to-workspace"}
                  .variant=${"primary"}>
                    ${V(M)}
                </devtools-button>
              `:d}
              <devtools-button
                @click=${t.onExportPatchFile}
                .jslogContext=${"patch-widget.export-patch-file"}
                .variant=${"primary"}>
                  ${V(B)}
              </devtools-button>
            </div>
          </div>
          `:h`
        <div class="footer">
          <div class="apply-to-page-tree-container">
            ${t.patchSuggestionState===H.LOADING?h`
              <div class="loading-text-container">
                <devtools-spinner></devtools-spinner>
                <span>
                  ${V(E)}
                </span>
              </div>
            `:h`
              <devtools-button
                @click=${t.onApplyToPageTree}
                .jslogContext=${"apply-to-page-tree"}
                .variant=${"outlined"}>
                ${V(R)}
              </devtools-button>
            `}
            ${t.patchSuggestionState===H.LOADING?h`<devtools-button
              @click=${t.onCancel}
              .jslogContext=${"cancel"}
              .variant=${"outlined"}>
              ${V(z)}
            </devtools-button>`:d}
            <devtools-button
              aria-details="info-tooltip"
              .iconName=${"info"}
              .variant=${"icon"}
              ></devtools-button>
            <devtools-tooltip variant="rich" id="info-tooltip" ${c.ref(s.tooltipRef)}>
              <div class="info-tooltip-container">
                ${t.disclaimerTooltipText}
                <button
                  class="link tooltip-link"
                  role="link"
                  jslog=${u.link("open-ai-settings").track({click:!0})}
                  @click=${t.onLearnMoreTooltipClick}
                >${V(D)}</button>
              </div>
            </devtools-tooltip>
          </div>
        </div>`}
          </details>
        `,n,{host:n}))}),this.requestUpdate()}#c(){this.#t.tooltipRef?.value?.hidePopover(),e.ViewManager.ViewManager.instance().showView("chrome-ai")}performUpdate(){this.#e({workspaceDiff:this.#r,changeSummary:this.changeSummary,patchSuggestionState:this.#a,sources:this.#i,disclaimerTooltipText:this.#o?V(j):V(P),onLearnMoreTooltipClick:this.#c.bind(this),onApplyToPageTree:this.#d.bind(this),onCancel:()=>{this.#n?.abort()},onDiscard:this.#h.bind(this),onSaveToWorkspace:this.#g()?this.#u.bind(this):void 0,onExportPatchFile:this.#p.bind(this)},this.#t,this.contentElement)}wasShown(){super.wasShown(),G()&&(window.aiAssistanceTestPatchPrompt=async e=>await this.#v(e))}async#d(){if(!G())return;const e=this.changeSummary;if(!e)throw new Error("Change summary does not exist");this.#a=H.LOADING,this.requestUpdate();const{response:t,processedFiles:s}=await this.#v(e);"answer"===t?.type?(await(this.changeManager?.stashChanges()),this.#a=H.SUCCESS):"error"===t?.type&&"abort"===t.error?this.#a=H.INITIAL:this.#a=H.ERROR,this.#i=`Filenames in page.\nFiles:\n${s.map((e=>`* ${e}`)).join("\n")}`,this.requestUpdate()}#h(){this.#r.modifiedUISourceCodes().forEach((e=>{e.resetWorkingCopy()})),this.#a=H.INITIAL,this.#i=void 0,this.changeManager?.popStashedChanges(),this.requestUpdate()}#g(){if(this.#a!==H.SUCCESS)return!1;const e=this.#r.modifiedUISourceCodes().filter((e=>"inspector://"!==e.origin()));return e.length>0&&e.every((e=>this.#l.binding(e)))}#u(){this.#r.modifiedUISourceCodes().forEach((e=>{const t=this.#l.binding(e);t&&t.fileSystem.commitWorkingCopy()})),this.#a=H.SAVED_TO_WORKSPACE,this.changeManager?.dropStashedChanges(),this.requestUpdate()}#p(){this.#a=H.EXPORTED_AS_PATCH,this.requestUpdate()}async#v(e){this.#n=new AbortController;const t=new a.PatchAgent({aidaClient:this.#s,serverSideLoggingEnabled:!1}),{responses:s,processedFiles:n}=await t.applyChanges(e,{signal:this.#n.signal});return{response:s.at(-1),processedFiles:n}}};function G(){return Boolean(i.Runtime.hostConfig.devToolsFreestyler?.patching)}var K=Object.freeze({__proto__:null,get PatchSuggestionState(){return H},PatchWidget:W,isAiAssistancePatchingEnabled:G}),X={cssText:`*{box-sizing:border-box;margin:0;padding:0}:host{width:100%;height:100%;user-select:text;display:flex;flex-direction:column;background-color:var(--sys-color-cdt-base-container)}.chat-ui{width:100%;height:100%;max-height:100%;display:flex;flex-direction:column}.input-form{display:flex;flex-direction:column;padding:var(--sys-size-5) var(--sys-size-5) 0 var(--sys-size-5);max-width:var(--sys-size-36);background-color:var(--sys-color-cdt-base-container);width:100%;position:sticky;z-index:9999;bottom:0;box-shadow:0 1px var(--sys-color-cdt-base-container);@container (width > 688px){--half-scrollbar-width:calc((100cqw - 100%) / 2);margin-left:var(--half-scrollbar-width);margin-right:calc(-1 * var(--half-scrollbar-width))}@container (height < 224px){position:static}& .input-form-shadow-container{position:absolute;top:0;left:-2px;width:calc(100% + 4px);height:var(--sys-size-4);& .input-form-shadow{height:100%;box-shadow:0 -3px 2px -2px var(--app-color-ai-assistance-input-divider);animation:reveal;opacity:0%;animation-timeline:--scroll-timeline}}}.chat-readonly-container{display:flex;width:100%;max-width:var(--sys-size-36);justify-content:center;align-items:center;background-color:var(--sys-color-surface3);font:var(--sys-typescale-body4-regular);padding:var(--sys-size-5) 0;border-radius:var(--sys-shape-corner-medium-small);margin-bottom:var(--sys-size-5);color:var(--sys-color-on-surface-subtle)}.chat-input-container{margin:var(--sys-size-4) 0;width:100%;display:flex;position:relative;flex-direction:column;border:1px solid var(--sys-color-neutral-outline);border-radius:var(--sys-shape-corner-small);&:focus-within{outline:1px solid var(--sys-color-primary);border-color:var(--sys-color-primary)}&.disabled{background-color:var(--sys-color-state-disabled-container);border-color:transparent}.image-input-container{margin:var(--sys-size-3) var(--sys-size-5);max-width:100%;width:fit-content;position:relative;devtools-button{position:absolute;top:var(--sys-size-1);right:-4px;border-radius:var(--sys-shape-corner-full);border:1px solid var(--sys-color-neutral-outline);background-color:var(--sys-color-cdt-base-container)}img{margin:var(--sys-size-4) 0;max-height:var(--sys-size-18);max-width:100%;border:1px solid var(--sys-color-neutral-outline);border-radius:var(--sys-shape-corner-small)}.loading{margin:var(--sys-size-4) 0;display:inline-flex;justify-content:center;align-items:center;height:var(--sys-size-18);width:var(--sys-size-19);background-color:var(--sys-color-surface3);border-radius:var(--sys-shape-corner-small);border:1px solid var(--sys-color-neutral-outline);devtools-spinner{color:var(--sys-color-state-disabled)}}}}.chat-input{--right-padding:calc(var(--sys-size-3) + 26px);scrollbar-width:none;field-sizing:content;resize:none;width:100%;max-height:84px;border:0;border-radius:var(--sys-shape-corner-small);font:var(--sys-typescale-body4-regular);line-height:18px;min-height:var(--sys-size-11);padding:var(--sys-size-4) var(--right-padding) var(--sys-size-4) var(--sys-size-4);color:var(--sys-color-on-surface);background-color:var(--sys-color-cdt-base-container);&::placeholder{opacity:60%}&:focus-visible{outline:0}&:disabled{color:var(--sys-color-state-disabled);background-color:transparent;border-color:transparent;&::placeholder{color:var(--sys-color-on-surface-subtle);opacity:100%}}&.two-big-buttons{--right-padding:172px}&.screenshot-button{--right-padding:calc(2 * var(--sys-size-3) + 2 * 26px)}}.chat-input-buttons{position:absolute;right:0;bottom:0;display:flex;flex-direction:row}.chat-input-button{padding-bottom:2px;padding-right:var(--sys-size-3)}.chat-inline-button{padding-left:3px}.chat-cancel-context-button{padding-bottom:3px;padding-right:var(--sys-size-3)}.disclaimer{display:flex;justify-content:center;border-top:var(--sys-size-1) solid var(--sys-color-divider);.disclaimer-text{max-width:var(--sys-size-38);color:var(--sys-color-on-surface-subtle);font:var(--sys-typescale-body5-regular);text-wrap:pretty;padding:var(--sys-size-2) var(--sys-size-5)}}.messages-container{flex-grow:1;width:100%;max-width:var(--sys-size-36);@container (width > 688px){--half-scrollbar-width:calc((100cqw - 100%) / 2);margin-left:var(--half-scrollbar-width);margin-right:calc(-1 * var(--half-scrollbar-width))}}.chat-message{user-select:text;cursor:initial;display:flex;flex-direction:column;gap:var(--sys-size-5);width:100%;padding:var(--sys-size-7) var(--sys-size-5);font-size:12px;word-break:normal;overflow-wrap:anywhere;border-bottom:var(--sys-size-1) solid var(--sys-color-divider);&:last-of-type{border-bottom:0}.message-info{display:flex;align-items:center;height:var(--sys-size-11);gap:var(--sys-size-4);font:var(--sys-typescale-body4-bold);img{border:0;border-radius:var(--sys-shape-corner-full);display:block;height:var(--sys-size-9);width:var(--sys-size-9)}h2{font:var(--sys-typescale-body4-bold)}}.actions{display:flex;flex-direction:column;gap:var(--sys-size-8);max-width:100%}.aborted{color:var(--sys-color-on-surface-subtle)}.image-link{width:fit-content;border-radius:var(--sys-shape-corner-small);outline-offset:var(--sys-size-2);img{max-height:var(--sys-size-20);max-width:100%;border-radius:var(--sys-shape-corner-small);border:1px solid var(--sys-color-neutral-outline);width:fit-content;vertical-align:bottom}}.unavailable-image{margin:var(--sys-size-4) 0;display:inline-flex;justify-content:center;align-items:center;height:var(--sys-size-17);width:var(--sys-size-18);background-color:var(--sys-color-surface3);border-radius:var(--sys-shape-corner-small);border:1px solid var(--sys-color-neutral-outline);devtools-icon{color:var(--sys-color-state-disabled)}}}.select-element{display:flex;gap:var(--sys-size-3);align-items:center;width:100%;.resource-link,\n  .resource-task{cursor:pointer;padding:var(--sys-size-2) 3px;font:var(--sys-typescale-body4-size);border:var(--sys-size-1) solid var(--sys-color-divider);border-radius:var(--sys-shape-corner-extra-small);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:var(--sys-size-32);&.allow-overflow{overflow:visible}&:focus-visible{outline:2px solid var(--sys-color-state-focus-ring)}.icon,\n    devtools-file-source-icon{display:inline-flex;vertical-align:top;margin-right:var(--sys-size-3);width:var(--sys-size-9);height:var(--sys-size-9)}.network-override-marker{position:relative;float:left}.network-override-marker::before{content:var(--image-file-empty);width:var(--sys-size-4);height:var(--sys-size-4);border-radius:50%;outline:var(--sys-size-1) solid var(--icon-gap-focus-selected);left:11px;position:absolute;top:13px;z-index:1;background-color:var(--sys-color-purple-bright)}.image.icon{display:inline-flex;justify-content:center;align-items:center;margin-right:var(--sys-size-3);img{max-width:var(--sys-size-8);max-height:var(--sys-size-8)}}}.resource-link.not-selected,\n  .resource-task.not-selected{color:var(--sys-color-state-disabled);border-color:var(--sys-color-neutral-outline)}}.indicator{color:var(--sys-color-green-bright)}.summary{display:grid;grid-template-columns:auto 1fr auto;padding:var(--sys-size-3);line-height:var(--sys-size-9);cursor:default;gap:var(--sys-size-3);justify-content:center;align-items:center;.title{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;font:var(--sys-typescale-body4-regular);.paused{font:var(--sys-typescale-body4-bold)}}}.step-code{display:flex;flex-direction:column;gap:var(--sys-size-2)}.js-code-output{devtools-code-block{--code-block-max-code-height:50px}}.context-details{devtools-code-block{--code-block-max-code-height:80px}}.step{width:fit-content;background-color:var(--sys-color-surface3);border-radius:var(--sys-size-6);position:relative;&.empty{pointer-events:none;.arrow{display:none}}&:not(&[open]):hover::after{content:'';height:100%;width:100%;border-radius:inherit;position:absolute;top:0;left:0;pointer-events:none;background-color:var(--sys-color-state-hover-on-subtle)}&.paused{.indicator{color:var(--sys-color-on-surface-subtle)}}&.canceled{.summary{color:var(--sys-color-state-disabled);text-decoration:line-through}.indicator{color:var(--sys-color-state-disabled)}}devtools-markdown-view{--code-background-color:var(--sys-color-surface1)}devtools-icon{vertical-align:bottom}devtools-spinner{width:var(--sys-size-9);height:var(--sys-size-9);padding:var(--sys-size-2)}&[open]{width:auto;.summary .title{white-space:normal;overflow:unset}.summary .arrow{transform:rotate(180deg)}}summary::marker{content:''}summary{border-radius:var(--sys-size-6)}.step-details{padding:0 var(--sys-size-5) var(--sys-size-4) var(--sys-size-12);display:flex;flex-direction:column;gap:var(--sys-size-6);devtools-code-block{--code-block-background-color:var(--sys-color-surface1)}}}.input-header{display:inline-flex;align-items:flex-end;justify-content:space-between;margin-bottom:2px;line-height:20px;gap:var(--sys-size-8);position:relative;& .feedback-icon{width:var(--sys-size-8);height:var(--sys-size-8)}& .header-link-container{display:inline-flex;align-items:center;gap:var(--sys-size-2);flex-shrink:0}& .header-link-container:first-of-type{flex-shrink:1;min-width:0}}.link{color:var(--text-link);text-decoration:underline;cursor:pointer}button.link{border:none;background:none;font:inherit}.select-an-element-text{margin-left:2px}main{overflow:hidden auto;display:flex;flex-direction:column;align-items:center;height:100%;container-type:size;scrollbar-width:thin;transform:translateZ(1px);scroll-timeline:--scroll-timeline y}.empty-state-container{flex-grow:1;display:grid;align-items:center;justify-content:center;font:var(--sys-typescale-headline4);gap:var(--sys-size-8);padding:var(--sys-size-3);max-width:var(--sys-size-33);@container (width > 688px){--half-scrollbar-width:calc((100cqw - 100%) / 2);margin-left:var(--half-scrollbar-width);margin-right:calc(-1 * var(--half-scrollbar-width))}.header{display:flex;flex-direction:column;width:100%;align-items:center;justify-content:center;align-self:end;gap:var(--sys-size-5);.icon{display:flex;justify-content:center;align-items:center;height:var(--sys-size-14);width:var(--sys-size-14);border-radius:var(--sys-shape-corner-small);background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary))}h1{font:var(--sys-typescale-headline4)}p{text-align:center;font:var(--sys-typescale-body4-regular)}}.empty-state-content{display:flex;flex-direction:column;gap:var(--sys-size-5);align-items:center;justify-content:center;align-self:start}}.feature-card{display:flex;padding:var(--sys-size-4) var(--sys-size-6);gap:10px;background-color:var(--sys-color-surface2);border-radius:var(--sys-shape-corner-medium-small);width:100%;align-items:center;.feature-card-icon{min-width:var(--sys-size-12);min-height:var(--sys-size-12);display:flex;justify-content:center;align-items:center;background-color:var(--sys-color-tonal-container);border-radius:var(--sys-shape-corner-full);devtools-icon{width:18px;height:18px}}.feature-card-content{h3{font:var(--sys-typescale-body3-medium)}p{font:var(--sys-typescale-body4-regular);line-height:18px}}}.disabled-view{display:flex;max-width:var(--sys-size-34);border-radius:var(--sys-shape-corner-small);box-shadow:var(--sys-elevation-level3);background-color:var(--app-color-card-background);font:var(--sys-typescale-body4-regular);text-wrap:pretty;padding:var(--sys-size-6) var(--sys-size-8);margin:var(--sys-size-4) 0;line-height:var(--sys-size-9);.disabled-view-icon-container{border-radius:var(--sys-shape-corner-extra-small);width:var(--sys-size-9);height:var(--sys-size-9);background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary));margin-right:var(--sys-size-5);devtools-icon{margin:var(--sys-size-2)}}}.error-step{color:var(--sys-color-error)}.side-effect-confirmation{display:flex;flex-direction:column;gap:var(--sys-size-5);padding-bottom:var(--sys-size-4)}.side-effect-buttons-container{display:flex;gap:var(--sys-size-4)}.change-summary{background-color:var(--sys-color-surface3);border-radius:var(--sys-shape-corner-medium-small);position:relative;margin:0 var(--sys-size-5);padding:0 var(--sys-size-5);&.exported{pointer-events:none}summary{display:flex;align-items:center;gap:var(--sys-size-3);height:var(--sys-size-14);padding-left:var(--sys-size-3);devtools-spinner{width:var(--sys-size-6);height:var(--sys-size-6);margin-left:var(--sys-size-3);margin-right:var(--sys-size-3)}& devtools-icon.summary-badge{width:var(--sys-size-8);height:var(--sys-size-8)}& .green-bright-icon{color:var(--sys-color-green-bright)}& .on-tonal-icon{color:var(--sys-color-on-tonal-container)}& .header-text{font:var(--sys-typescale-body4);color:var(--sys-color-on-surface)}& .arrow{margin-left:auto}&::marker{content:''}}&:not(&[open]):hover::after{content:'';height:100%;width:100%;border-radius:inherit;position:absolute;top:0;left:0;pointer-events:none;background-color:var(--sys-color-state-hover-on-subtle)}&[open]:not(.exported){&::details-content{height:fit-content;padding:var(--sys-size-2) 0;border-radius:inherit}summary .arrow{transform:rotate(180deg)}}devtools-code-block{margin-bottom:var(--sys-size-5);--code-block-background-color:var(--sys-color-surface1)}.error-container{display:flex;align-items:center;gap:var(--sys-size-3);color:var(--sys-color-error);devtools-icon{color:var(--sys-color-error)}}.footer{display:flex;flex-direction:row;justify-content:space-between;margin:var(--sys-size-5) 0 var(--sys-size-5) var(--sys-size-2);gap:var(--sys-size-6);.disclaimer-link{align-self:center}.sources-link{flex-grow:1;align-self:center}.info-tooltip-container{max-width:var(--sys-size-28);.tooltip-link{display:block;margin-top:var(--sys-size-4);color:var(--sys-color-primary)}}.loading-text-container{margin-right:var(--sys-size-3);display:flex;justify-content:center;align-items:center;gap:var(--sys-size-3)}.apply-to-page-tree-container{display:flex;align-items:center;gap:var(--sys-size-3);margin-left:auto;devtools-icon{width:18px;height:18px;margin-left:var(--sys-size-2)}}}}@keyframes reveal{0%,\n  99%{opacity:100%}100%{opacity:0%}}\n/*# sourceURL=${import.meta.resolve("././components/chatView.css")} */\n`};class Y extends C.MarkdownView.MarkdownInsightRenderer{templateForToken(e){if("code"===e.type){const t=e.text.split("\n");"css"===t[0]?.trim()&&(e.lang="css",e.text=t.slice(1).join("\n"))}return super.templateForToken(e)}}var Q=`.ai-assistance-feedback-row{font-family:var(--default-font-family);width:100%;display:flex;gap:var(--sys-size-8);justify-content:space-between;align-items:center;margin-block:calc(-1 * var(--sys-size-3));.rate-buttons{display:flex;align-items:center;gap:var(--sys-size-2);padding:var(--sys-size-4) 0}.vertical-separator{height:16px;width:1px;vertical-align:top;margin:0 var(--sys-size-2);background:var(--sys-color-divider);display:inline-block}.suggestions-container{overflow:hidden;position:relative;display:flex;.suggestions-scroll-container{display:flex;overflow:auto hidden;scrollbar-width:none;gap:var(--sys-size-3);padding:var(--sys-size-3)}.scroll-button-container{position:absolute;top:0;height:100%;display:flex;align-items:center;width:var(--sys-size-15);z-index:999}.scroll-button-container.hidden{display:none}.scroll-button-container.left{left:0;background:linear-gradient(90deg,var(--sys-color-cdt-base-container) 0%,var(--sys-color-cdt-base-container) 50%,transparent)}.scroll-button-container.right{right:0;background:linear-gradient(90deg,transparent,var(--sys-color-cdt-base-container) 50%);justify-content:flex-end}}}.feedback-form{display:flex;flex-direction:column;gap:var(--sys-size-5);margin-top:var(--sys-size-4);background-color:var(--sys-color-surface3);padding:var(--sys-size-6);border-radius:var(--sys-shape-corner-medium-small);max-width:var(--sys-size-32);.feedback-input{height:var(--sys-size-11);padding:0 var(--sys-size-5);background-color:var(--sys-color-surface3);width:auto}.feedback-input::placeholder{color:var(--sys-color-on-surface-subtle);font:var(--sys-typescale-body4-regular)}.feedback-header{display:flex;justify-content:space-between;align-items:center}.feedback-title{margin:0;font:var(--sys-typescale-body3-medium)}.feedback-disclaimer{padding:0 var(--sys-size-4)}}\n/*# sourceURL=${import.meta.resolve("././components/userActionRow.css")} */\n`;const{html:Z,Directives:{ref:J}}=l,ee="Good response",te="Bad response",se="Provide additional feedback",ne="Submitted feedback will also include your conversation",ie="Submit",oe="Why did you choose this rating? (optional)",ae="Close",re="Report legal issue",le="Scroll to next suggestions",ce="Scroll to previous suggestions",de=n.i18n.lockedString,he=(e,t,s)=>{l.render(Z`
    <style>${A.textInputStylesRaw.cssText}</style>
    <style>${Q}</style>
    <div class="ai-assistance-feedback-row">
      <div class="rate-buttons">
        ${e.showRateButtons?Z`
          <devtools-button
            .data=${{variant:"icon",size:"SMALL",iconName:"thumb-up",toggledIconName:"thumb-up-filled",toggled:"POSITIVE"===e.currentRating,toggleType:"primary-toggle",title:de(ee),jslogContext:"thumbs-up"}}
            @click=${()=>e.onRatingClick("POSITIVE")}
          ></devtools-button>
          <devtools-button
            .data=${{variant:"icon",size:"SMALL",iconName:"thumb-down",toggledIconName:"thumb-down-filled",toggled:"NEGATIVE"===e.currentRating,toggleType:"primary-toggle",title:de(te),jslogContext:"thumbs-down"}}
            @click=${()=>e.onRatingClick("NEGATIVE")}
          ></devtools-button>
          <div class="vertical-separator"></div>
        `:l.nothing}
        <devtools-button
          .data=${{variant:"icon",size:"SMALL",title:de(re),iconName:"report",jslogContext:"report"}}
          @click=${e.onReportClick}
        ></devtools-button>
      </div>
      ${e.suggestions?Z`<div class="suggestions-container">
        <div class="scroll-button-container left hidden" ${J((e=>{t.suggestionsLeftScrollButtonContainer=e}))}>
          <devtools-button
            class='scroll-button'
            .data=${{variant:"icon",size:"SMALL",iconName:"chevron-left",title:de(ce),jslogContext:"chevron-left"}}
            @click=${()=>e.scrollSuggestionsScrollContainer("left")}
          ></devtools-button>
        </div>
        <div class="suggestions-scroll-container" @scroll=${e.onSuggestionsScrollOrResize} ${J((e=>{t.suggestionsScrollContainer=e}))}>
          ${e.suggestions.map((t=>Z`<devtools-button
            class='suggestion'
            .data=${{variant:"outlined",title:t,jslogContext:"suggestion"}}
            @click=${()=>e.onSuggestionClick(t)}
          >${t}</devtools-button>`))}
        </div>
        <div class="scroll-button-container right hidden" ${J((e=>{t.suggestionsRightScrollButtonContainer=e}))}>
          <devtools-button
            class='scroll-button'
            .data=${{variant:"icon",size:"SMALL",iconName:"chevron-right",title:de(le),jslogContext:"chevron-right"}}
            @click=${()=>e.scrollSuggestionsScrollContainer("right")}
          ></devtools-button>
        </div>
      </div>`:l.nothing}
    </div>
    ${e.isShowingFeedbackForm?Z`
      <form class="feedback-form" @submit=${e.onSubmit}>
        <div class="feedback-header">
          <h4 class="feedback-title">${de(oe)}</h4>
          <devtools-button
            aria-label=${de(ae)}
            @click=${e.onClose}
            .data=${{variant:"icon",iconName:"cross",size:"SMALL",title:de(ae),jslogContext:"close"}}
          ></devtools-button>
        </div>
        <input
          type="text"
          class="devtools-text-input feedback-input"
          @input=${t=>e.onInputChange(t.target.value)}
          placeholder=${de(se)}
          jslog=${u.textField("feedback").track({keydown:"Enter"})}
        >
        <span class="feedback-disclaimer">${de(ne)}</span>
        <div>
          <devtools-button
          aria-label=${de(ie)}
          .data=${{type:"submit",disabled:e.isSubmitButtonDisabled,variant:"outlined",size:"SMALL",title:de(ie),jslogContext:"send"}}
          >${de(ie)}</devtools-button>
        </div>
      </div>
    </form>
    `:l.nothing}
  `,s,{host:s})};let ge=class extends e.Widget.Widget{showRateButtons=!1;onFeedbackSubmit=()=>{};suggestions;onSuggestionClick=()=>{};canShowFeedbackForm=!1;#m=new ResizeObserver((()=>this.#f()));#y=new t.Throttler.Throttler(50);#b="";#w;#C=!1;#k=!0;view;#t={};constructor(e,t){super(!1,!1,e),this.view=t??he}wasShown(){super.wasShown(),this.performUpdate(),this.#x(),this.#t.suggestionsScrollContainer&&this.#m.observe(this.#t.suggestionsScrollContainer)}performUpdate(){this.view({onSuggestionClick:this.onSuggestionClick,onRatingClick:this.#S.bind(this),onReportClick:()=>e.UIUtils.openInNewTab("https://support.google.com/legal/troubleshooter/1114905?hl=en#ts=1115658%2C13380504"),scrollSuggestionsScrollContainer:this.#A.bind(this),onSuggestionsScrollOrResize:this.#f.bind(this),onSubmit:this.#I.bind(this),onClose:this.#T.bind(this),onInputChange:this.#$.bind(this),isSubmitButtonDisabled:this.#k,showRateButtons:this.showRateButtons,suggestions:this.suggestions,currentRating:this.#w,isShowingFeedbackForm:this.#C},this.#t,this.contentElement)}#$(e){this.#b=e;const t=!e;t!==this.#k&&(this.#k=t,this.performUpdate())}#x=()=>{const e=this.#t.suggestionsScrollContainer,t=this.#t.suggestionsLeftScrollButtonContainer,s=this.#t.suggestionsRightScrollButtonContainer;if(!e||!t||!s)return;const n=e.scrollLeft>1,i=e.scrollLeft+e.offsetWidth+1<e.scrollWidth;t.classList.toggle("hidden",!n),s.classList.toggle("hidden",!i)};disconnectedCallback(){this.#m.disconnect()}#f(){this.#y.schedule((()=>(this.#x(),Promise.resolve())))}#A(e){const t=this.#t.suggestionsScrollContainer;t&&t.scroll({top:0,left:"left"===e?t.scrollLeft-t.clientWidth:t.scrollLeft+t.clientWidth,behavior:"smooth"})}#S(e){if(this.#w===e)return this.#w=void 0,this.#C=!1,this.#k=!0,this.onFeedbackSubmit("SENTIMENT_UNSPECIFIED"),void this.performUpdate();this.#w=e,this.#C=this.canShowFeedbackForm,this.onFeedbackSubmit(e),this.performUpdate()}#T(){this.#C=!1,this.#k=!0,this.performUpdate()}#I(e){e.preventDefault();const t=this.#b;this.#w&&t&&(this.onFeedbackSubmit(this.#w,t),this.#C=!1,this.#k=!0,this.performUpdate())}};var ue=Object.freeze({__proto__:null,DEFAULT_VIEW:he,UserActionRow:ge});const pe=new CSSStyleSheet;pe.replaceSync(X.cssText);const{html:ve,Directives:{ifDefined:me,ref:fe}}=l,ye={notLoggedIn:"This feature is only available when you are signed into Chrome with your Google account",offline:"Check your internet connection and try again",settingsLink:"AI assistance in Settings",turnOnForStyles:"Turn on {PH1} to get help with understanding CSS styles",turnOnForStylesAndRequests:"Turn on {PH1} to get help with styles and network requests",turnOnForStylesRequestsAndFiles:"Turn on {PH1} to get help with styles, network requests, and files",turnOnForStylesRequestsPerformanceAndFiles:"Turn on {PH1} to get help with styles, network requests, performance, and files",learnAbout:"Learn about AI in DevTools",notAvailableInIncognitoMode:"AI assistance is not available in Incognito mode or Guest mode"},be="Send",we="Start new chat",Ce="Cancel",ke="Select an element",xe="No element selected",Se="How can I help you?",Ae="Explore AI assistance",Ie="Something unforeseen happened and I can no longer continue. Try your request again and see if that resolves the issue. If this keeps happening, update Chrome to the latest version.",Te="Seems like I am stuck with the investigation. It would be better if you start over.",$e="You stopped this response",Ee="This code may modify page content. Continue?",Re="Continue",ze="Cancel",Le="AI",Me="You",Fe="Investigating",Oe="Paused",Pe="Code executed",je="Code to execute",De="Data returned",Ne="Completed",Ue="Canceled",qe="You're viewing a past conversation.",Be="Take screenshot",_e="Remove image input",Ve="Image input sent to the model",He="Account avatar",We="Open image in a new tab",Ge="Image unavailable",Ke=n.i18n.registerUIStrings("panels/ai_assistance/components/ChatView.ts",ye),Xe=n.i18n.getLocalizedString.bind(void 0,Ke),Ye=n.i18n.lockedString,Qe="image/jpeg";class Ze extends HTMLElement{#E=this.attachShadow({mode:"open"});#R=new Y;#z;#L;#M;#F=l.Directives.createRef();#O=new ResizeObserver((()=>this.#P()));#j=!0;constructor(e){super(),this.#L=e}set props(e){this.#R=new Y,this.#L=e,this.#D()}connectedCallback(){this.#E.adoptedStyleSheets=[pe],this.#D(),this.#M&&this.#O.observe(this.#M)}disconnectedCallback(){this.#O.disconnect()}focusTextInput(){const e=this.#E.querySelector(".chat-input");e&&e.focus()}restoreScrollPosition(){void 0!==this.#z&&this.#F?.value&&(this.#F.value.scrollTop=this.#z)}scrollToBottom(){this.#F?.value&&(this.#F.value.scrollTop=this.#F.value.scrollHeight)}#P(){this.#j&&this.#F?.value&&this.#j&&(this.#F.value.scrollTop=this.#F.value.scrollHeight)}#N(e){const t=this.#E.querySelector(".chat-input");t&&(t.value=e,this.#L.onTextInputChange(e))}#U(e){this.#M=e,e?this.#O.observe(e):(this.#j=!0,this.#O.disconnect())}#q=e=>{e.target&&e.target instanceof HTMLElement&&(this.#z=e.target.scrollTop,this.#j=e.target.scrollTop+e.target.clientHeight+1>e.target.scrollHeight)};#I=e=>{if(e.preventDefault(),this.#L.imageInput?.isLoading)return;const t=this.#E.querySelector(".chat-input");if(!t?.value)return;const s=!this.#L.imageInput?.isLoading&&this.#L.imageInput?.data?{inlineData:{data:this.#L.imageInput.data,mimeType:Qe}}:void 0;this.#L.onTextSubmit(t.value,s),t.value=""};#B=e=>{if(e.target&&e.target instanceof HTMLTextAreaElement&&"Enter"===e.key&&!e.shiftKey){if(e.preventDefault(),!e.target?.value||this.#L.imageInput?.isLoading)return;const t=!this.#L.imageInput?.isLoading&&this.#L.imageInput?.data?{inlineData:{data:this.#L.imageInput.data,mimeType:Qe}}:void 0;this.#L.onTextSubmit(e.target.value,t),e.target.value=""}};#_=e=>{e.preventDefault(),this.#L.isLoading&&this.#L.onCancelClick()};#V=e=>{this.#N(e),this.focusTextInput(),s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceDynamicSuggestionClicked)};#D(){l.render(ve`
      <div class="chat-ui">
        <main @scroll=${this.#q} ${fe(this.#F)}>
          ${function({state:t,aidaAvailability:s,messages:o,isLoading:r,isReadOnly:c,canShowFeedbackForm:d,isTextInputDisabled:h,suggestions:g,userInfo:p,markdownRenderer:v,conversationType:m,changeSummary:f,changeManager:y,onSuggestionClick:b,onFeedbackSubmit:w,onMessageContainerRef:C}){if("consent-view"===t)return et(function(){const t=document.createElement("button");let s;t.textContent=Xe(ye.settingsLink),t.classList.add("link"),e.ARIAUtils.markAsLink(t),t.addEventListener("click",(()=>{e.ViewManager.ViewManager.instance().showView("chrome-ai")})),t.setAttribute("jslog",`${u.action("open-ai-settings").track({click:!0})}`);const o=i.Runtime.hostConfig;if(o.isOffTheRecord)return ve`${Xe(ye.notAvailableInIncognitoMode)}`;s=o.devToolsAiAssistancePerformanceAgent?.enabled?n.i18n.getFormatLocalizedString(Ke,ye.turnOnForStylesRequestsPerformanceAndFiles,{PH1:t}):o.devToolsAiAssistanceFileAgent?.enabled?n.i18n.getFormatLocalizedString(Ke,ye.turnOnForStylesRequestsAndFiles,{PH1:t}):o.devToolsAiAssistanceNetworkAgent?.enabled?n.i18n.getFormatLocalizedString(Ke,ye.turnOnForStylesAndRequests,{PH1:t}):n.i18n.getFormatLocalizedString(Ke,ye.turnOnForStyles,{PH1:t});return ve`${s}`}());if("available"!==s)return et(function(e){switch(e){case"no-account-email":case"sync-is-paused":return ve`${Xe(ye.notLoggedIn)}`;case"no-internet":return ve`${Xe(ye.offline)}`}}(s));if(!m)return function(){const t=i.Runtime.hostConfig,s=[...t.devToolsFreestyler?.enabled?[{icon:"brush-2",heading:"CSS styles",content:ve`Open <button class="link" role="link" jslog=${u.link("open-elements-panel").track({click:!0})} @click=${()=>{e.ViewManager.ViewManager.instance().showView("elements")}}>Elements</button> to ask about CSS styles`}]:[],...t.devToolsAiAssistanceNetworkAgent?.enabled?[{icon:"arrow-up-down",heading:"Network",content:ve`Open <button class="link" role="link" jslog=${u.link("open-network-panel").track({click:!0})} @click=${()=>{e.ViewManager.ViewManager.instance().showView("network")}}>Network</button> to ask about a request's details`}]:[],...t.devToolsAiAssistanceFileAgent?.enabled?[{icon:"document",heading:"Files",content:ve`Open <button class="link" role="link" jslog=${u.link("open-sources-panel").track({click:!0})} @click=${()=>{e.ViewManager.ViewManager.instance().showView("sources")}}>Sources</button> to ask about a file's content`}]:[],...t.devToolsAiAssistancePerformanceAgent?.enabled?[{icon:"performance",heading:"Performance",content:ve`Open <button class="link" role="link" jslog=${u.link("open-performance-panel").track({click:!0})} @click=${()=>{e.ViewManager.ViewManager.instance().showView("timeline")}}>Performance</button> to ask about a trace item`}]:[]];return ve`
    <div class="empty-state-container">
      <div class="header">
        <div class="icon">
          <devtools-icon
            name="smart-assistant"
          ></devtools-icon>
        </div>
        <h1>${Ye(Ae)}</h1>
        <p>To chat about an item, right-click and select <strong>Ask AI</strong></p>
      </div>
      <div class="empty-state-content">
        ${s.map((e=>ve`
          <div class="feature-card">
            <div class="feature-card-icon">
              <devtools-icon name=${e.icon}></devtools-icon>
            </div>
            <div class="feature-card-content">
              <h3>${e.heading}</h3>
              <p>${e.content}</p>
            </div>
          </div>
        `))}
      </div>
    </div>`}();if(o.length>0)return function({messages:t,isLoading:s,isReadOnly:n,canShowFeedbackForm:i,userInfo:o,markdownRenderer:r,changeSummary:c,changeManager:d,onSuggestionClick:h,onFeedbackSubmit:g,onMessageContainerRef:p}){function v(){return s?l.nothing:ve`<devtools-widget
      .widgetConfig=${e.Widget.widgetConfig(W,{changeSummary:c,changeManager:d})}
    ></devtools-widget>`}return ve`
    <div class="messages-container" ${fe(p)}>
      ${t.map(((t,c,d)=>function({message:t,isLoading:s,isReadOnly:n,canShowFeedbackForm:i,isLast:o,userInfo:r,markdownRenderer:c,onSuggestionClick:d,onFeedbackSubmit:h}){if("user"===t.entity){const e=r.accountFullName||Ye(Me),s=r.accountImage?ve`<img src="data:image/png;base64, ${r.accountImage}" alt=${He} />`:ve`<devtools-icon
          .name=${"profile"}
        ></devtools-icon>`,n=t.imageInput&&"inlineData"in t.imageInput?function(e){if(e.data===a.NOT_FOUND_IMAGE_DATA)return ve`<div class="unavailable-image" title=${Ge}>
      <devtools-icon name='file-image'></devtools-icon>
    </div>`;const t=`data:image/jpeg;base64,${e.data}`;return ve`<x-link
      class="image-link" title=${We}
      href=${t}
    >
      <img src=${t} alt=${Ve} />
    </x-link>`}(t.imageInput.inlineData):l.nothing;return ve`<section
      class="chat-message query"
      jslog=${u.section("question")}
    >
      <div class="message-info">
        ${s}
        <div class="message-name">
          <h2>${e}</h2>
        </div>
      </div>
      ${n}
      <div class="message-content">${Je(t.text,c)}</div>
    </section>`}return ve`
    <section
      class="chat-message answer"
      jslog=${u.section("answer")}
    >
      <div class="message-info">
        <devtools-icon name="smart-assistant"></devtools-icon>
        <div class="message-name">
          <h2>${Ye(Le)}</h2>
        </div>
      </div>
      ${l.Directives.repeat(t.steps,((e,t)=>t),(e=>function({step:e,isLoading:t,markdownRenderer:s,isLast:n}){const i=l.Directives.classMap({step:!0,empty:!e.thought&&!e.code&&!e.contextDetails,paused:Boolean(e.sideEffect),canceled:Boolean(e.canceled)});return ve`
    <details class=${i}
      jslog=${u.section("step")}
      .open=${Boolean(e.sideEffect)}>
      <summary>
        <div class="summary">
          ${function({step:e,isLoading:t,isLast:s}){if(t&&s&&!e.sideEffect)return ve`<devtools-spinner></devtools-spinner>`;let n="checkmark",i=Ye(Ne),o="button";s&&e.sideEffect?(o=void 0,i=void 0,n="pause-circle"):e.canceled&&(i=Ye(Ue),n="cross");return ve`<devtools-icon
      class="indicator"
      role=${me(o)}
      aria-label=${me(i)}
      .name=${n}
    ></devtools-icon>`}({step:e,isLoading:t,isLast:n})}
          ${function(e){const t=e.sideEffect?ve`<span class="paused">${Ye(Oe)}: </span>`:l.nothing,s=e.title??`${Ye(Fe)}…`;return ve`<span class="title">${t}${s}</span>`}(e)}
          <devtools-icon
            class="arrow"
            .name=${"chevron-down"}
          ></devtools-icon>
        </div>
      </summary>
      ${function({step:e,markdownRenderer:t,isLast:s}){const n=s&&e.sideEffect?function(e){if(!e.sideEffect)return l.nothing;return ve`<div
    class="side-effect-confirmation"
    jslog=${u.section("side-effect-confirmation")}
  >
    <p>${Ye(Ee)}</p>
    <div class="side-effect-buttons-container">
      <devtools-button
        .data=${{variant:"outlined",jslogContext:"decline-execute-code"}}
        @click=${()=>e.sideEffect?.onAnswer(!1)}
      >${Ye(ze)}</devtools-button>
      <devtools-button
        .data=${{variant:"primary",jslogContext:"accept-execute-code",iconName:"play"}}
        @click=${()=>e.sideEffect?.onAnswer(!0)}
      >${Ye(Re)}</devtools-button>
    </div>
  </div>`}(e):l.nothing,i=e.thought?ve`<p>${Je(e.thought,t)}</p>`:l.nothing,o=e.contextDetails?ve`${l.Directives.repeat(e.contextDetails,(e=>ve`<div class="context-details">
      <devtools-code-block
        .code=${e.text}
        .codeLang=${e.codeLang||""}
        .displayNotice=${!1}
        .header=${e.title}
        .showCopyButton=${!0}
      ></devtools-code-block>
    </div>`))}`:l.nothing;return ve`<div class="step-details">
    ${i}
    ${function(e){if(!e.code&&!e.output)return l.nothing;const t=e.output&&!e.canceled?Ye(Pe):Ye(je),s=e.code?ve`<div class="action-result">
      <devtools-code-block
        .code=${e.code.trim()}
        .codeLang=${"js"}
        .displayNotice=${!Boolean(e.output)}
        .header=${t}
        .showCopyButton=${!0}
      ></devtools-code-block>
  </div>`:l.nothing,n=e.output?ve`<div class="js-code-output">
    <devtools-code-block
      .code=${e.output}
      .codeLang=${"js"}
      .displayNotice=${!0}
      .header=${Ye(De)}
      .showCopyButton=${!1}
    ></devtools-code-block>
  </div>`:l.nothing;return ve`<div class="step-code">${s}${n}</div>`}(e)}
    ${n}
    ${o}
  </div>`}({step:e,markdownRenderer:s,isLast:n})}
    </details>`}({step:e,isLoading:s,markdownRenderer:c,isLast:[...t.steps.values()].at(-1)===e&&o})))}
      ${t.answer?ve`<p>${Je(t.answer,c,{animate:!n&&s&&o})}</p>`:l.nothing}
      ${function(e){if(e.error){let t;switch(e.error){case"unknown":case"block":t=Ie;break;case"max-steps":t=Te;break;case"abort":return ve`<p class="aborted" jslog=${u.section("aborted")}>${Ye($e)}</p>`}return ve`<p class="error" jslog=${u.section("error")}>${Ye(t)}</p>`}return l.nothing}(t)}
      ${o&&s?l.nothing:ve`<devtools-widget class="actions" .widgetConfig=${e.Widget.widgetConfig(ge,{showRateButtons:void 0!==t.rpcId,onFeedbackSubmit:(e,s)=>{t.rpcId&&h(t.rpcId,e,s)},suggestions:o?t.suggestions:void 0,onSuggestionClick:d,canShowFeedbackForm:i})}></devtools-widget>`}
    </section>
  `}({message:t,isLoading:s,isReadOnly:n,canShowFeedbackForm:i,isLast:d.at(-1)===t,userInfo:o,markdownRenderer:r,onSuggestionClick:h,onFeedbackSubmit:g})))}
      ${v()}
    </div>
  `}({messages:o,isLoading:r,isReadOnly:c,canShowFeedbackForm:d,userInfo:p,markdownRenderer:v,changeSummary:f,changeManager:y,onSuggestionClick:b,onFeedbackSubmit:w,onMessageContainerRef:C});return function({isTextInputDisabled:e,suggestions:t,onSuggestionClick:s}){return ve`<div class="empty-state-container">
    <div class="header">
      <div class="icon">
        <devtools-icon
          name="smart-assistant"
        ></devtools-icon>
      </div>
      <h1>${Ye(Se)}</h1>
    </div>
    <div class="empty-state-content">
      ${t.map((t=>ve`<devtools-button
          class="suggestion"
          @click=${()=>s(t)}
          .data=${{variant:"outlined",size:"REGULAR",title:t,jslogContext:"suggestion",disabled:e}}
        >${t}</devtools-button>`))}
    </div>
  </div>`}({isTextInputDisabled:h,suggestions:g,onSuggestionClick:b})}({state:this.#L.state,aidaAvailability:this.#L.aidaAvailability,messages:this.#L.messages,isLoading:this.#L.isLoading,isReadOnly:this.#L.isReadOnly,canShowFeedbackForm:this.#L.canShowFeedbackForm,isTextInputDisabled:this.#L.isTextInputDisabled,suggestions:this.#L.emptyStateSuggestions,userInfo:this.#L.userInfo,markdownRenderer:this.#R,conversationType:this.#L.conversationType,changeSummary:this.#L.changeSummary,changeManager:this.#L.changeManager,onSuggestionClick:this.#V,onFeedbackSubmit:this.#L.onFeedbackSubmit,onMessageContainerRef:this.#U})}
          ${this.#L.isReadOnly?function({onNewConversation:e,conversationType:t}){if(!t)return l.nothing;return ve`<div
    class="chat-readonly-container"
    jslog=${u.section("read-only")}
  >
    <span>${Ye(qe)}</span>
    <devtools-button
      aria-label=${Ye(we)}
      class="chat-inline-button"
      @click=${e}
      .data=${{variant:"text",title:Ye(we),jslogContext:"start-new-chat"}}
    >${Ye(we)}</devtools-button>
  </div>`}({conversationType:this.#L.conversationType,onNewConversation:this.#L.onNewConversation}):function({isLoading:e,blockedByCrossOrigin:t,isTextInputDisabled:s,inputPlaceholder:n,state:i,selectedContext:o,inspectElementToggled:a,multimodalInputEnabled:r,conversationType:c,imageInput:d,isTextInputEmpty:h,onContextClick:g,onInspectElementClick:p,onSubmit:v,onTextAreaKeyDown:m,onCancel:f,onNewConversation:y,onTakeScreenshot:b,onRemoveImageInput:w,onTextInputChange:C}){if(!c)return l.nothing;const k=l.Directives.classMap({"chat-input":!0,"two-big-buttons":t,"screenshot-button":Boolean(r)&&!t}),x=l.Directives.classMap({"chat-input-container":!0,disabled:s});return ve`
  <form class="input-form" @submit=${v}>
    <div class="input-form-shadow-container">
      <div class="input-form-shadow"></div>
    </div>
    ${"consent-view"!==i?ve`
      <div class="input-header">
        <div class="header-link-container">
          ${function({selectedContext:e,inspectElementToggled:t,conversationType:s,onContextClick:n,onInspectElementClick:i}){if(!s)return l.nothing;const o="freestyler"===s,a=l.Directives.classMap({"not-selected":!e,"resource-link":!0,"allow-overflow":o});if(!e&&!o)return l.nothing;const r=e?.getIcon()??l.nothing,c=e=>{"Enter"!==e.key&&" "!==e.key||n()};return ve`<div class="select-element">
    ${o?ve`
        <devtools-button
          .data=${{variant:"icon_toggle",size:"REGULAR",iconName:"select-element",toggledIconName:"select-element",toggleType:"primary-toggle",toggled:t,title:Ye(ke),jslogContext:"select-element"}}
          @click=${i}
        ></devtools-button>
      `:l.nothing}
    <div
      role=button
      class=${a}
      tabindex=${o?"-1":"0"}
      @click=${n}
      @keydown=${c}
    >
      ${r}${e?.getTitle()??ve`<span>${Ye(xe)}</span>`}
    </div>
  </div>`}({selectedContext:o,inspectElementToggled:a,conversationType:c,onContextClick:g,onInspectElementClick:p})}
        </div>
      </div>
    `:l.nothing}
    <div class=${x}>
      ${function({multimodalInputEnabled:e,imageInput:t,onRemoveImageInput:s}){if(!e||!t)return l.nothing;const n=ve`<devtools-button
      aria-label=${Ye(_e)}
      @click=${s}
      .data=${{variant:"icon",size:"MICRO",iconName:"cross",title:Ye(_e)}}
    ></devtools-button>`;if(t.isLoading)return ve`<div class="image-input-container">
        ${n}
        <div class="loading">
          <devtools-spinner></devtools-spinner>
        </div>
      </div>`;return ve`
    <div class="image-input-container">
      ${n}
      <img src="data:image/jpeg;base64, ${t.data}" alt="Screenshot input" />
    </div>`}({multimodalInputEnabled:r,imageInput:d,onRemoveImageInput:w})}
      <textarea class=${k}
        .disabled=${s}
        wrap="hard"
        maxlength="10000"
        @keydown=${m}
        @input=${e=>C(e.target.value)}
        placeholder=${n}
        jslog=${u.textField("query").track({keydown:"Enter"})}
      ></textarea>
      <div class="chat-input-buttons">
        ${function({multimodalInputEnabled:e,blockedByCrossOrigin:t,isTextInputDisabled:s,imageInput:n,onTakeScreenshot:i}){if(!e||t)return l.nothing;return ve`<devtools-button
      class="chat-input-button"
      aria-label=${Ye(Be)}
      @click=${i}
      .data=${{variant:"icon",size:"REGULAR",disabled:s||n?.isLoading,iconName:"photo-camera",title:Ye(Be),jslogContext:"take-screenshot"}}
    ></devtools-button>`}({multimodalInputEnabled:r,blockedByCrossOrigin:t,isTextInputDisabled:s,imageInput:d,onTakeScreenshot:b})}
        ${function({isLoading:e,blockedByCrossOrigin:t,isTextInputDisabled:s,isTextInputEmpty:n,imageInput:i,onCancel:o,onNewConversation:a}){if(e)return ve`<devtools-button
      class="chat-input-button"
      aria-label=${Ye(Ce)}
      @click=${o}
      .data=${{variant:"icon",size:"REGULAR",iconName:"record-stop",title:Ye(Ce),jslogContext:"stop"}}
    ></devtools-button>`;if(t)return ve`
      <devtools-button
        class="chat-input-button"
        aria-label=${Ye(we)}
        @click=${a}
        .data=${{variant:"primary",size:"REGULAR",title:Ye(we),jslogContext:"start-new-chat"}}
      >${Ye(we)}</devtools-button>
    `;return ve`<devtools-button
    class="chat-input-button"
    aria-label=${Ye(be)}
    .data=${{type:"submit",variant:"icon",size:"REGULAR",disabled:s||n||i?.isLoading,iconName:"send",title:Ye(be),jslogContext:"send"}}
  ></devtools-button>`}({isLoading:e,blockedByCrossOrigin:t,isTextInputDisabled:s,isTextInputEmpty:h,imageInput:d,onCancel:f,onNewConversation:y})}
      </div>
    </div>
  </form>`}({isLoading:this.#L.isLoading,blockedByCrossOrigin:this.#L.blockedByCrossOrigin,isTextInputDisabled:this.#L.isTextInputDisabled,inputPlaceholder:this.#L.inputPlaceholder,state:this.#L.state,selectedContext:this.#L.selectedContext,inspectElementToggled:this.#L.inspectElementToggled,multimodalInputEnabled:this.#L.multimodalInputEnabled,conversationType:this.#L.conversationType,imageInput:this.#L.imageInput,isTextInputEmpty:this.#L.isTextInputEmpty,onContextClick:this.#L.onContextClick,onInspectElementClick:this.#L.onInspectElementClick,onSubmit:this.#I,onTextAreaKeyDown:this.#B,onCancel:this.#_,onNewConversation:this.#L.onNewConversation,onTakeScreenshot:this.#L.onTakeScreenshot,onRemoveImageInput:this.#L.onRemoveImageInput,onTextInputChange:this.#L.onTextInputChange})}
        </main>
        <footer class="disclaimer" jslog=${u.section("footer")}>
          <p class="disclaimer-text">
            ${this.#L.disclaimerText}
            <button
              class="link"
              role="link"
              jslog=${u.link("open-ai-settings").track({click:!0})}
              @click=${()=>{e.ViewManager.ViewManager.instance().showView("chrome-ai")}}
            >${Xe(ye.learnAbout)}</button>
          </p>
        </footer>
      </div>
    `,this.#E,{host:this})}}function Je(e,t,{animate:s,ref:n}={}){let i=[];try{i=w.Marked.lexer(e);for(const e of i)t.renderToken(e)}catch{return ve`${e}`}return ve`<devtools-markdown-view
    .data=${{tokens:i,renderer:t,animationEnabled:s}}
    ${n?fe(n):l.nothing}>
  </devtools-markdown-view>`}function et(e){return ve`
    <div class="empty-state-container">
      <div class="disabled-view">
        <div class="disabled-view-icon-container">
          <devtools-icon .data=${{iconName:"smart-assistant",width:"var(--sys-size-8)",height:"var(--sys-size-8)"}}>
          </devtools-icon>
        </div>
        <div>
          ${e}
        </div>
      </div>
    </div>
  `}customElements.define("devtools-ai-chat-view",Ze);const{html:tt}=l,st={newChat:"New chat",help:"Help",settings:"Settings",sendFeedback:"Send feedback",newChatCreated:"New chat created",chatDeleted:"Chat deleted",history:"History",deleteChat:"Delete local chat",clearChatHistory:"Clear local chats",noPastConversations:"No past conversations",followTheSteps:"Follow the steps above to ask a question",inputDisclaimerForEmptyState:"This is an experimental AI feature and won't always get it right."},nt="Answer loading",it="Answer ready",ot="To talk about data from another origin, start a new chat",at="Ask a question about the selected element",rt="Ask a question about the selected network request",lt="Ask a question about the selected file",ct="Ask a question about the selected item and its call tree",dt="Select an element to ask a question",ht="Select a network request to ask a question",gt="Select a file to ask a question",ut="Select an item to ask a question",pt="Ask a question about the selected performance insight",vt="Select a performance insight to ask a question",mt="Chat messages and any data the inspected page can access via Web APIs are sent to Google and may be seen by human reviewers to improve this feature. This is an experimental AI feature and won’t always get it right.",ft="Chat messages and any data the inspected page can access via Web APIs are sent to Google. The content you submit and that is generated by this feature will not be used to improve Google’s AI models. This is an experimental AI feature and won’t always get it right.",yt="Chat messages and the selected network request are sent to Google and may be seen by human reviewers to improve this feature. This is an experimental AI feature and won’t always get it right.",bt="Chat messages and the selected network request are sent to Google. The content you submit and that is generated by this feature will not be used to improve Google’s AI models. This is an experimental AI feature and won’t always get it right.",wt="Chat messages and the selected file are sent to Google and may be seen by human reviewers to improve this feature. This is an experimental AI feature and won't always get it right.",Ct="Chat messages and the selected file are sent to Google. The content you submit and that is generated by this feature will not be used to improve Google’s AI models. This is an experimental AI feature and won’t always get it right.",kt="Chat messages and trace data from your performance trace are sent to Google and may be seen by human reviewers to improve this feature. This is an experimental AI feature and won't always get it right.",xt="Chat messages and data from your performance trace are sent to Google. The content you submit and that is generated by this feature will not be used to improve Google’s AI models. This is an experimental AI feature and won’t always get it right.",St=n.i18n.registerUIStrings("panels/ai_assistance/AiAssistancePanel.ts",st),At=n.i18n.getLocalizedString.bind(void 0,St),It=n.i18n.lockedString;function Tt(e){return e&&e.nodeType()===Node.ELEMENT_NODE?e:null}function $t(e,t){if(e){const t=e.getSuggestions();if(t)return t}if(!t)return[];switch(t){case"freestyler":return["What can you help me with?","Why isn’t this element visible?","How do I center this element?"];case"drjones-file":return["What does this script do?","Is the script optimized for performance?","Does the script handle user input safely?"];case"drjones-network-request":return["Why is this network request taking so long?","Are there any security headers present?","Why is the request failing?"];case"drjones-performance":return["Identify performance issues in this call tree","Where is most of the time being spent in this call tree?","How can I reduce the time of this call tree?"];case"performance-insight":return["Help me optimize my LCP","Help me optimize my INP","For now"]}}function Et(e,t,s){l.render(tt`
    ${function(e){return tt`
    <div class="toolbar-container" role="toolbar" .jslogContext=${u.toolbar()}>
      <devtools-toolbar class="freestyler-left-toolbar" role="presentation">
        <devtools-button
          title=${At(st.newChat)}
          aria-label=${At(st.newChat)}
          .iconName=${"plus"}
          .jslogContext=${"freestyler.new-chat"}
          .variant=${"toolbar"}
          @click=${e.onNewChatClick}></devtools-button>
        <div class="toolbar-divider"></div>
        <devtools-button
          title=${At(st.history)}
          aria-label=${At(st.history)}
          .iconName=${"history"}
          .jslogContext=${"freestyler.history"}
          .variant=${"toolbar"}
          @click=${e.onHistoryClick}></devtools-button>
        ${e.isDeleteHistoryButtonVisible?tt`<devtools-button
              title=${At(st.deleteChat)}
              aria-label=${At(st.deleteChat)}
              .iconName=${"bin"}
              .jslogContext=${"freestyler.delete"}
              .variant=${"toolbar"}
              @click=${e.onDeleteClick}></devtools-button>`:l.nothing}
      </devtools-toolbar>
      <devtools-toolbar class="freestyler-right-toolbar" role="presentation">
        <x-link
          class="toolbar-feedback-link devtools-link"
          title=${st.sendFeedback}
          href=${"https://crbug.com/364805393"}
          jslog=${u.link().track({click:!0,keydown:"Enter|Space"}).context("freestyler.send-feedback")}
        >${st.sendFeedback}</x-link>
        <div class="toolbar-divider"></div>
        <devtools-button
          title=${At(st.help)}
          aria-label=${At(st.help)}
          .iconName=${"help"}
          .jslogContext=${"freestyler.help"}
          .variant=${"toolbar"}
          @click=${e.onHelpClick}></devtools-button>
        <devtools-button
          title=${At(st.settings)}
          aria-label=${At(st.settings)}
          .iconName=${"gear"}
          .jslogContext=${"freestyler.settings"}
          .variant=${"toolbar"}
          @click=${e.onSettingsClick}></devtools-button>
      </devtools-toolbar>
    </div>
  `}(e)}
    <div class="chat-container">
      <devtools-ai-chat-view .props=${e} ${l.Directives.ref((e=>{e&&e instanceof Ze&&(t.chatView=e)}))}></devtools-ai-chat-view>
    </div>
  `,s,{host:e})}function Rt(e){return e?new a.NodeContext(e):null}let zt;class Lt extends e.Panel.Panel{view;static panelName="freestyler";#H;#s;#t={};#W=function(){return!i.Runtime.hostConfig.aidaAvailability?.disallowLogging}();#G;#K=new a.ChangeManager;#X=new t.Mutex.Mutex;#Y;#Q;#Z=[];#J=null;#ee=null;#te=null;#se=null;#ne=null;#ie=[];#oe=!1;#ae=!1;#re=null;#le;#ce;#de;#he=!0;constructor(t=Et,{aidaClient:s,aidaAvailability:n,syncInfo:i}){super(Lt.panelName),this.view=t,this.registerRequiredCSS(I),this.#G=this.#ge(),this.#H=e.ActionRegistry.ActionRegistry.instance().getAction("elements.toggle-element-search"),this.#s=s,this.#le=n,this.#ce={accountImage:i.accountImage,accountFullName:i.accountFullName},this.#Z=a.AiHistoryStorage.instance().getHistory().map((e=>new a.Conversation(e.type,e.history,e.id,!0)))}#ue(){const e=!0===i.Runtime.hostConfig.aidaAvailability?.blockedByAge;return this.#G?.getIfNotDisabled()&&!e?"chat-view":"consent-view"}#ge(){try{return t.Settings.moduleSetting("ai-assistance-enabled")}catch{return}}#pe(e){const t={aidaClient:this.#s,serverSideLoggingEnabled:this.#W};let s;switch(e){case"freestyler":s=new a.StylingAgent({...t,changeManager:this.#K}),Boolean(i.Runtime.hostConfig.devToolsFreestyler?.functionCalling)&&(s=new a.StylingAgentWithFunctionCalling({...t,changeManager:this.#K}));break;case"drjones-network-request":s=new a.NetworkAgent(t);break;case"drjones-file":s=new a.FileAgent(t);break;case"drjones-performance":s=new a.PerformanceAgent(t);break;case"performance-insight":s=new a.PerformanceInsightsAgent(t)}return s}static async instance(e={forceNew:null}){const{forceNew:t}=e;if(!zt||t){const e=new s.AidaClient.AidaClient,t=new Promise((e=>s.InspectorFrontendHost.InspectorFrontendHostInstance.getSyncInformation(e))),[n,i]=await Promise.all([s.AidaClient.AidaClient.checkAccessPreconditions(),t]);zt=new Lt(Et,{aidaClient:e,aidaAvailability:n,syncInfo:i})}return zt}#ve(){if(this.#Y&&this.#Q&&!this.#Q.isEmpty||this.#ae)return;const{hostConfig:t}=i.Runtime,s=Boolean(e.Context.Context.instance().flavor(p.ElementsPanel.ElementsPanel)),n=Boolean(e.Context.Context.instance().flavor(m.NetworkPanel.NetworkPanel)),o=Boolean(e.Context.Context.instance().flavor(f.SourcesPanel.SourcesPanel)),a=Boolean(e.Context.Context.instance().flavor(y.TimelinePanel.TimelinePanel)),r=Boolean(e.Context.Context.instance().flavor(y.TimelinePanel.SelectedInsight));let l;if(s&&t.devToolsFreestyler?.enabled?l="freestyler":n&&t.devToolsAiAssistanceNetworkAgent?.enabled?l="drjones-network-request":o&&t.devToolsAiAssistanceFileAgent?.enabled?l="drjones-file":a&&t.devToolsAiAssistancePerformanceAgent?.enabled&&t.devToolsAiAssistancePerformanceAgent?.insightsEnabled&&r?l="performance-insight":a&&t.devToolsAiAssistancePerformanceAgent?.enabled&&(l="drjones-performance"),this.#Y?.type===l)return;const c=l?this.#pe(l):void 0;this.#me(c)}#me(e){const t=e instanceof a.AiAgent?e:void 0,s=e instanceof a.Conversation?e:void 0;this.#Y!==t&&(this.#fe(),this.#ie=[],this.#ae=!1,this.#Q?.archiveConversation(),this.#Y=t,t&&(this.#Q=new a.Conversation(function(e){switch(e){case"freestyler":return"freestyler";case"drjones-network-request":return"drjones-network-request";case"drjones-file":return"drjones-file";case"drjones-performance":return"drjones-performance";case"performance-insight":return"performance-insight";case"patch":throw new Error("PATCH AiAssistanceModel.AgentType does not have a corresponding AiAssistanceModels.ConversationType.")}}(t.type),[],t.id,!1),this.#Z.push(this.#Q))),t||(this.#Q=void 0,this.#ie=[],s&&(this.#Q=s)),this.#Y||this.#Q||this.#ve(),this.#ye(),this.requestUpdate()}wasShown(){var t,n,i,l;super.wasShown(),this.#t.chatView?.restoreScrollPosition(),this.#t.chatView?.focusTextInput(),this.#be(),this.#ee=Rt(Tt(e.Context.Context.instance().flavor(o.DOMModel.DOMNode))),this.#ne=(t=e.Context.Context.instance().flavor(o.NetworkRequest.NetworkRequest))?new a.RequestContext(t):null,this.#te=(n=e.Context.Context.instance().flavor(b.AICallTree.AICallTree))?new a.CallTreeContext(n):null,this.#se=(i=e.Context.Context.instance().flavor(b.InsightAIContext.ActiveInsight))?new a.InsightContext(i):null,this.#J=(l=e.Context.Context.instance().flavor(r.UISourceCode.UISourceCode))?new a.FileContext(l):null,this.#me(this.#Y),this.#G?.addChangeListener(this.requestUpdate,this),s.AidaClient.HostConfigTracker.instance().addEventListener("aidaAvailabilityChanged",this.#be),this.#H.addEventListener("Toggled",this.requestUpdate,this),e.Context.Context.instance().addFlavorChangeListener(o.DOMModel.DOMNode,this.#we),e.Context.Context.instance().addFlavorChangeListener(o.NetworkRequest.NetworkRequest,this.#Ce),e.Context.Context.instance().addFlavorChangeListener(b.AICallTree.AICallTree,this.#ke),e.Context.Context.instance().addFlavorChangeListener(r.UISourceCode.UISourceCode,this.#xe),e.Context.Context.instance().addFlavorChangeListener(b.InsightAIContext.ActiveInsight,this.#Se),e.Context.Context.instance().addFlavorChangeListener(p.ElementsPanel.ElementsPanel,this.#ve,this),e.Context.Context.instance().addFlavorChangeListener(m.NetworkPanel.NetworkPanel,this.#ve,this),e.Context.Context.instance().addFlavorChangeListener(f.SourcesPanel.SourcesPanel,this.#ve,this),e.Context.Context.instance().addFlavorChangeListener(y.TimelinePanel.TimelinePanel,this.#ve,this),o.TargetManager.TargetManager.instance().addModelListener(o.DOMModel.DOMModel,o.DOMModel.Events.AttrModified,this.#Ae,this),o.TargetManager.TargetManager.instance().addModelListener(o.DOMModel.DOMModel,o.DOMModel.Events.AttrRemoved,this.#Ae,this),o.TargetManager.TargetManager.instance().addModelListener(o.ResourceTreeModel.ResourceTreeModel,o.ResourceTreeModel.Events.PrimaryPageChanged,this.#Ie,this),s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistancePanelOpened)}willHide(){this.#G?.removeChangeListener(this.requestUpdate,this),s.AidaClient.HostConfigTracker.instance().removeEventListener("aidaAvailabilityChanged",this.#be),this.#H.removeEventListener("Toggled",this.requestUpdate,this),e.Context.Context.instance().removeFlavorChangeListener(o.DOMModel.DOMNode,this.#we),e.Context.Context.instance().removeFlavorChangeListener(o.NetworkRequest.NetworkRequest,this.#Ce),e.Context.Context.instance().removeFlavorChangeListener(b.AICallTree.AICallTree,this.#ke),e.Context.Context.instance().removeFlavorChangeListener(b.InsightAIContext.ActiveInsight,this.#Se),e.Context.Context.instance().removeFlavorChangeListener(r.UISourceCode.UISourceCode,this.#xe),e.Context.Context.instance().removeFlavorChangeListener(p.ElementsPanel.ElementsPanel,this.#ve,this),e.Context.Context.instance().removeFlavorChangeListener(m.NetworkPanel.NetworkPanel,this.#ve,this),e.Context.Context.instance().removeFlavorChangeListener(f.SourcesPanel.SourcesPanel,this.#ve,this),e.Context.Context.instance().removeFlavorChangeListener(y.TimelinePanel.TimelinePanel,this.#ve,this),o.TargetManager.TargetManager.instance().removeModelListener(o.DOMModel.DOMModel,o.DOMModel.Events.AttrModified,this.#Ae,this),o.TargetManager.TargetManager.instance().removeModelListener(o.DOMModel.DOMModel,o.DOMModel.Events.AttrRemoved,this.#Ae,this),o.TargetManager.TargetManager.instance().removeModelListener(o.ResourceTreeModel.ResourceTreeModel,o.ResourceTreeModel.Events.PrimaryPageChanged,this.#Ie,this)}#be=async()=>{const e=await s.AidaClient.AidaClient.checkAccessPreconditions();if(e!==this.#le){this.#le=e;const t=await new Promise((e=>s.InspectorFrontendHost.InspectorFrontendHostInstance.getSyncInformation(e)));this.#ce={accountImage:t.accountImage,accountFullName:t.accountFullName},this.requestUpdate()}};#we=e=>{this.#ee?.getItem()!==e.data&&(this.#ee=Rt(Tt(e.data)),this.#me(this.#Y))};#Ae=e=>{this.#ee?.getItem()===e.data.node&&("class"!==e.data.name&&"id"!==e.data.name||this.requestUpdate())};#Ce=e=>{this.#ne?.getItem()!==e.data&&(this.#ne=Boolean(e.data)?new a.RequestContext(e.data):null,this.#me(this.#Y))};#ke=e=>{this.#te?.getItem()!==e.data&&(this.#te=Boolean(e.data)?new a.CallTreeContext(e.data):null,this.#me(this.#Y))};#Se=e=>{this.#se?.getItem()!==e.data&&(this.#se=Boolean(e.data)?new a.InsightContext(e.data):null,this.#me(this.#Y))};#xe=e=>{const t=e.data;t&&this.#J?.getItem()!==t&&(this.#J=new a.FileContext(e.data),this.#me(this.#Y))};#Ie(){this.#de&&(this.#de=void 0,this.requestUpdate())}#Te(){if(G()&&this.#Y&&!this.#Q?.isReadOnly)return this.#K.formatChangesForPatching(this.#Y.id,!0)}async performUpdate(){this.view({state:this.#ue(),blockedByCrossOrigin:this.#oe,aidaAvailability:this.#le,isLoading:this.#ae,messages:this.#ie,selectedContext:this.#re,conversationType:this.#Q?.type,isReadOnly:this.#Q?.isReadOnly??!1,changeSummary:this.#Te(),inspectElementToggled:this.#H.toggled(),userInfo:this.#ce,canShowFeedbackForm:this.#W,multimodalInputEnabled:Ft()&&"freestyler"===this.#Q?.type,imageInput:this.#de,isDeleteHistoryButtonVisible:Boolean(this.#Q&&!this.#Q.isEmpty),isTextInputDisabled:this.#$e(),emptyStateSuggestions:$t(this.#re,this.#Q?.type),inputPlaceholder:this.#Ee(),disclaimerText:this.#Re(),isTextInputEmpty:this.#he,changeManager:this.#K,onNewChatClick:this.#ze.bind(this),onHistoryClick:this.#Le.bind(this),onDeleteClick:this.#Me.bind(this),onHelpClick:()=>{e.UIUtils.openInNewTab("https://developer.chrome.com/docs/devtools/ai-assistance")},onSettingsClick:()=>{e.ViewManager.ViewManager.instance().showView("chrome-ai")},onTextSubmit:async(e,t)=>{this.#de=void 0,this.#he=!0,s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceQuerySubmitted),await this.#Fe(e,t)},onInspectElementClick:this.#Oe.bind(this),onFeedbackSubmit:this.#Pe.bind(this),onCancelClick:this.#fe.bind(this),onContextClick:this.#je.bind(this),onNewConversation:this.#ze.bind(this),onTakeScreenshot:Ft()?this.#De.bind(this):void 0,onRemoveImageInput:Ft()?this.#Ne.bind(this):void 0,onTextInputChange:this.#Ue.bind(this)},this.#t,this.contentElement)}#Oe(){this.#H.execute()}#$e(){const e=this.#G?.getIfNotDisabled(),t=!0===i.Runtime.hostConfig.aidaAvailability?.blockedByAge;if(!e||t)return!0;return!("available"===this.#le)||(!!this.#oe||(!this.#Q||!this.#re))}#Ee(){if("consent-view"===this.#ue()||!this.#Q)return At(st.followTheSteps);if(this.#oe)return It(ot);switch(this.#Q.type){case"freestyler":return this.#re?It(at):It(dt);case"drjones-file":return this.#re?It(lt):It(gt);case"drjones-network-request":return this.#re?It(rt):It(ht);case"drjones-performance":return this.#re?It(ct):It(ut);case"performance-insight":return this.#re?It(pt):It(vt)}}#Re(){if("consent-view"===this.#ue()||!this.#Q||this.#Q.isReadOnly)return At(st.inputDisclaimerForEmptyState);const e=i.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===i.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;switch(this.#Q.type){case"freestyler":return It(e?ft:mt);case"drjones-file":return It(e?Ct:wt);case"drjones-network-request":return It(e?bt:yt);case"drjones-performance":case"performance-insight":return It(e?xt:kt)}}#Pe(e,t,s){this.#s.registerClientEvent({corresponding_aida_rpc_global_id:e,disable_user_content_logging:!this.#W,do_conversation_client_event:{user_feedback:{sentiment:t,user_input:{comment:s}}}})}#je(){const e=this.#re;if(e instanceof a.RequestContext){const s=v.UIRequestLocation.UIRequestLocation.tab(e.getItem(),"headers-component");return t.Revealer.reveal(s)}if(e instanceof a.FileContext)return t.Revealer.reveal(e.getItem().uiLocation(0,0));if(e instanceof a.CallTreeContext){const s=e.getItem(),n=s.selectedNode?.event??s.rootNode.event,i=new o.TraceObject.RevealableEvent(n);return t.Revealer.reveal(i)}}handleAction(e){if(this.#ae)return void this.#t.chatView?.focusTextInput();let t;switch(e){case"freestyler.elements-floating-button":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromElementsPanelFloatingButton),t="freestyler";break;case"freestyler.element-panel-context":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromElementsPanel),t="freestyler";break;case"drjones.network-floating-button":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromNetworkPanelFloatingButton),t="drjones-network-request";break;case"drjones.network-panel-context":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromNetworkPanel),t="drjones-network-request";break;case"drjones.performance-panel-context":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromPerformancePanel),t="drjones-performance";break;case"drjones.performance-insight-context":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromPerformanceInsight),t="performance-insight";break;case"drjones.sources-floating-button":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromSourcesPanelFloatingButton),t="drjones-file";break;case"drjones.sources-panel-context":s.userMetrics.actionTaken(s.UserMetrics.Action.AiAssistanceOpenedFromSourcesPanel),t="drjones-file"}if(!t)return;let n=this.#Y;this.#Q&&this.#Y&&this.#Q.type===t&&!this.#Q?.isEmpty&&"drjones-performance"!==t||(n=this.#pe(t)),this.#me(n),this.#t.chatView?.focusTextInput()}#Le(t){const s=t.target,n=s?.getBoundingClientRect(),i=new e.ContextMenu.ContextMenu(t,{useSoftMenu:!0,x:n?.left,y:n?.bottom});for(const e of[...this.#Z].reverse()){if(e.isEmpty)continue;const t=e.title;t&&i.defaultSection().appendCheckboxItem(t,(()=>{this.#qe(e)}),{checked:this.#Q===e})}const o=0===i.defaultSection().items.length;o&&i.defaultSection().appendItem(At(st.noPastConversations),(()=>{}),{disabled:!0}),i.footerSection().appendItem(At(st.clearChatHistory),(()=>{this.#Be()}),{disabled:o}),i.show()}#Be(){this.#Z=[],a.AiHistoryStorage.instance().deleteAll(),this.#me()}#Me(){this.#Q&&(this.#Z=this.#Z.filter((e=>e!==this.#Q)),a.AiHistoryStorage.instance().deleteHistoryEntry(this.#Q.id),this.#me(),e.ARIAUtils.alert(At(st.chatDeleted)))}async#qe(e){this.#Q!==e&&(this.#me(e),await this.#_e(e.history))}#ze(){this.#me(),e.ARIAUtils.alert(At(st.newChatCreated))}async#De(){const e=o.TargetManager.TargetManager.instance().primaryPageTarget();if(!e)throw new Error("Could not find main target");const t=e.model(o.ScreenCaptureModel.ScreenCaptureModel);if(!t)throw new Error("Could not find model");const s=setTimeout((()=>{this.#de={isLoading:!0},this.requestUpdate()}),100),n=await t.captureScreenshot("jpeg",100,"fromViewport");clearTimeout(s),n&&(this.#de={isLoading:!1,data:n},this.requestUpdate(),this.updateComplete.then((()=>{this.#t.chatView?.focusTextInput()})))}#Ne(){this.#de=void 0,this.requestUpdate(),this.updateComplete.then((()=>{this.#t.chatView?.focusTextInput()}))}#Ue(e){const t=!e;t!==this.#he&&(this.#he=t,this.requestUpdate())}#Ve=new AbortController;#fe(){this.#Ve.abort(),this.#Ve=new AbortController}#ye(e){if(!this.#Y)return void(this.#oe=!1);const t=e??this.#He();this.#re=t,this.#oe=!!t&&!t.isOriginAllowed(this.#Y.origin)}#He(){if(!this.#Q)return null;let e;switch(this.#Q.type){case"freestyler":e=this.#ee;break;case"drjones-file":e=this.#J;break;case"drjones-network-request":e=this.#ne;break;case"drjones-performance":e=this.#te;break;case"performance-insight":e=this.#se}return e}async#Fe(t,s){if(!this.#Y)return;this.#fe();const n=this.#Ve.signal,i=this.#He();if(i&&!i.isOriginAllowed(this.#Y.origin))throw new Error("cross-origin context data should not be included");const o=Ft()?s:void 0,a=o?crypto.randomUUID():void 0,r=this.#Y.run(t,{signal:n,selected:i},o,a);e.ARIAUtils.alert(It(nt)),await this.#_e(this.#We(r)),e.ARIAUtils.alert(It(it))}async*#We(e){const t=this.#Q;for await(const s of e)("answer"!==s.type||s.complete)&&t?.addHistoryItem(s),yield s}async#_e(e){const t=await this.#X.acquire();try{let s={entity:"model",steps:[]},n={isLoading:!0};function i(){s.steps.at(-1)!==n&&s.steps.push(n)}this.#ae=!0;for await(const o of e){switch(n.sideEffect=void 0,o.type){case"user-query":this.#ie.push({entity:"user",text:o.query,imageInput:o.imageInput}),s={entity:"model",steps:[]},this.#ie.push(s);break;case"querying":n={isLoading:!0},s.steps.length||s.steps.push(n);break;case"context":n.title=o.title,n.contextDetails=o.details,n.isLoading=!1,i();break;case"title":n.title=o.title,i();break;case"thought":n.isLoading=!1,n.thought=o.thought,i();break;case"suggestions":s.suggestions=o.suggestions;break;case"side-effect":n.isLoading=!1,n.code??=o.code,n.sideEffect={onAnswer:e=>{o.confirm(e),n.sideEffect=void 0,this.requestUpdate()}},i();break;case"action":n.isLoading=!1,n.code??=o.code,n.output??=o.output,n.canceled=o.canceled,i();break;case"answer":s.suggestions??=o.suggestions,s.answer=o.text,s.rpcId=o.rpcId,1===s.steps.length&&s.steps[0].isLoading&&s.steps.pop(),n.isLoading=!1;break;case"error":{s.error=o.error,s.rpcId=void 0;const a=s.steps.at(-1);a&&("abort"===o.error?a.canceled=!0:a.isLoading&&s.steps.pop()),"block"===o.error&&(s.answer=void 0)}}this.#Q?.isReadOnly||(this.requestUpdate(),"context"!==o.type&&"side-effect"!==o.type||this.#t.chatView?.scrollToBottom())}this.#ae=!1,this.requestUpdate()}finally{t()}}}class Mt{handleAction(t,s){switch(s){case"freestyler.elements-floating-button":case"freestyler.element-panel-context":case"drjones.network-floating-button":case"drjones.network-panel-context":case"drjones.performance-panel-context":case"drjones.performance-insight-context":case"drjones.sources-floating-button":case"drjones.sources-panel-context":return(async()=>{const t=e.ViewManager.ViewManager.instance().view(Lt.panelName);if(t){await e.ViewManager.ViewManager.instance().showView(Lt.panelName);(await t.widget()).handleAction(s)}})(),!0}return!1}}function Ft(){return Boolean(i.Runtime.hostConfig.devToolsFreestyler?.multimodal)}export{Mt as ActionDelegate,Lt as AiAssistancePanel,Ze as ChatView,Y as MarkdownRendererWithCodeBlock,K as PatchWidget,ue as UserActionRow};
