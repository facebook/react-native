import*as e from"../../core/common/common.js";import*as t from"../../core/sdk/sdk.js";import*as n from"../../core/i18n/i18n.js";import*as r from"../../ui/legacy/components/object_ui/object_ui.js";import*as o from"../../ui/legacy/components/utils/utils.js";import*as i from"../../ui/legacy/legacy.js";async function s(n){const r=n.runtimeModel().target().model(t.DOMDebuggerModel.DOMDebuggerModel);if(!r)return{eventListeners:[],internalHandlers:null};const o={internalHandlers:null,eventListeners:[]};return n.callFunction((function(){const e=[];let t=[],n=[],r=[function(e){if(!(e&&e instanceof Node))return{eventListeners:[]};const t=window.jQuery;if(!t||!t.fn)return{eventListeners:[]};const n=t,r=t._data||t.data,o=[],i=[];if("function"==typeof r){const t=r(e,"events");for(const n in t)for(const r in t[n]){const i=t[n][r];if("object"==typeof i||"function"==typeof i){const t={handler:i.handler||i,useCapture:!0,passive:!1,once:!1,type:n,remove:u.bind(e,i.selector)};o.push(t)}}const n=r(e);n&&"function"==typeof n.handle&&i.push(n.handle)}const s=n(e)[0];if(s){const e=s.$events;for(const t in e){const n=e[t];for(const e in n)if("function"==typeof n[e]){const r={handler:n[e],useCapture:!0,passive:!1,once:!1,type:t};o.push(r)}}s&&s.$handle&&i.push(s.$handle)}return{eventListeners:o,internalHandlers:i}}];try{self.devtoolsFrameworkEventListeners&&i(self.devtoolsFrameworkEventListeners)&&(r=r.concat(self.devtoolsFrameworkEventListeners))}catch(t){e.push("devtoolsFrameworkEventListeners call produced error: "+a(t))}for(let o=0;o<r.length;++o)try{const e=r[o](this);if(e.eventListeners&&i(e.eventListeners)){const n=e.eventListeners.map((e=>s(e))).filter(c);t=t.concat(n)}if(e.internalHandlers&&i(e.internalHandlers)){const t=e.internalHandlers.map((e=>l(e))).filter(c);n=n.concat(t)}}catch(t){e.push("fetcher call produced error: "+a(t))}const o={eventListeners:t,internalHandlers:n.length?n:void 0,errorString:void 0};o.internalHandlers||delete o.internalHandlers;if(e.length){let t="Framework Event Listeners API Errors:\n\t"+e.join("\n\t");t=t.substr(0,t.length-1),o.errorString=t}""!==o.errorString&&void 0!==o.errorString||delete o.errorString;return o;function i(e){if(!e||"object"!=typeof e)return!1;try{if("function"==typeof e.splice){const t=e.length;return"number"==typeof t&&t>>>0===t&&(t>0||1/t>0)}}catch(e){}return!1}function s(t){try{let n="";if(t){const e=t.type;e&&"string"==typeof e||(n+="event listener's type isn't string or empty, ");const r=t.useCapture;"boolean"!=typeof r&&(n+="event listener's useCapture isn't boolean or undefined, ");const o=t.passive;"boolean"!=typeof o&&(n+="event listener's passive isn't boolean or undefined, ");const i=t.once;"boolean"!=typeof i&&(n+="event listener's once isn't boolean or undefined, ");const s=t.handler;s&&"function"==typeof s||(n+="event listener's handler isn't a function or empty, ");const l=t.remove;if(l&&"function"!=typeof l&&(n+="event listener's remove isn't a function, "),!n)return{type:e,useCapture:r,passive:o,once:i,handler:s,remove:l}}else n+="empty event listener, ";return e.push(n.substr(0,n.length-2)),null}catch(t){return e.push(a(t)),null}}function l(t){return t&&"function"==typeof t?t:(e.push("internal handler isn't a function or empty"),null)}function a(e){try{return String(e)}catch(e){return"<error>"}}function c(e){return Boolean(e)}function u(e,t,n){if(!(this&&this instanceof Node))return;const r=window.jQuery;if(!r||!r.fn)return;r(this).off(t,e,n)}}),void 0).then(c).then((function(e){return e.getOwnProperties(!1)})).then((async function(n){if(!n.properties)throw new Error("Object properties is empty");const r=[];for(const u of n.properties)"eventListeners"===u.name&&u.value&&r.push(i(u.value).then(l)),"internalHandlers"===u.name&&u.value&&r.push((c=u.value,t.RemoteObject.RemoteArray.objectAsArray(c).map(s).then(t.RemoteObject.RemoteArray.createFromRemoteObjects.bind(null))).then(a)),"errorString"===u.name&&u.value&&(o=u.value,e.Console.Console.instance().error(String(o.value)));var o;var c;await Promise.all(r)})).then((function(){return o})).catch((e=>(console.error(e),o)));function i(e){return t.RemoteObject.RemoteArray.objectAsArray(e).map((function(e){let o,i,l,a,u=null,d=null,h=null,v=null;const p=[];function f(e){h=e?e.location:null}return p.push(e.callFunctionJSON((function(){return{type:this.type,useCapture:this.useCapture,passive:this.passive,once:this.once}}),void 0).then((function(e){void 0!==e.type&&(o=e.type);void 0!==e.useCapture&&(i=e.useCapture);void 0!==e.passive&&(l=e.passive);void 0!==e.once&&(a=e.once)}))),p.push(e.callFunction((function(){return this.handler||null})).then(c).then((function(e){return d=e,d})).then(s).then((function(e){return u=e,e.debuggerModel().functionDetailsPromise(e).then(f)}))),p.push(e.callFunction((function(){return this.remove||null})).then(c).then((function(e){if("function"!==e.type)return;v=e}))),Promise.all(p).then((function(){if(!h)throw new Error("Empty event listener's location");return new t.DOMDebuggerModel.EventListener(r,n,o,i,l,a,u,d,h,v,"FrameworkUser")})).catch((e=>(console.error(e),null)))})).then(u)}function s(e){return t.RemoteObject.RemoteFunction.objectAsFunction(e).targetFunction()}function l(e){o.eventListeners=e}function a(e){o.internalHandlers=e}function c(e){if(e.wasThrown||!e.object)throw new Error("Exception in callFunction or empty result");return e.object}function u(e){return e.filter((function(e){return Boolean(e)}))}}var l=Object.freeze({__proto__:null,frameworkEventListeners:s});const a=new CSSStyleSheet;a.replaceSync(".value.object-value-node:hover{background-color:var(--sys-color-state-hover-on-subtle)}.object-value-function-prefix,\n.object-value-boolean{color:var(--sys-color-token-attribute-value)}.object-value-function{font-style:italic}.object-value-function.linkified:hover{--override-linkified-hover-background:rgb(0 0 0/10%);background-color:var(--override-linkified-hover-background);cursor:pointer}.-theme-with-dark-background .object-value-function.linkified:hover,\n:host-context(.-theme-with-dark-background) .object-value-function.linkified:hover{--override-linkified-hover-background:rgb(230 230 230/10%)}.object-value-number{color:var(--sys-color-token-attribute-value)}.object-value-bigint{color:var(--sys-color-token-comment)}.object-value-string,\n.object-value-regexp,\n.object-value-symbol{white-space:pre;unicode-bidi:-webkit-isolate;color:var(--sys-color-token-property-special)}.object-value-node{position:relative;vertical-align:baseline;color:var(--sys-color-token-variable);white-space:nowrap}.object-value-null,\n.object-value-undefined{color:var(--sys-color-state-disabled)}.object-value-unavailable{color:var(--sys-color-token-tag)}.object-value-calculate-value-button:hover{text-decoration:underline}.object-properties-section-custom-section{display:inline-flex;flex-direction:column}.-theme-with-dark-background .object-value-number,\n:host-context(.-theme-with-dark-background) .object-value-number,\n.-theme-with-dark-background .object-value-boolean,\n:host-context(.-theme-with-dark-background) .object-value-boolean{--override-primitive-dark-mode-color:hsl(252deg 100% 75%);color:var(--override-primitive-dark-mode-color)}.object-properties-section .object-description{color:var(--sys-color-token-subtle)}.value .object-properties-preview{white-space:nowrap}.name{color:var(--sys-color-token-tag);flex-shrink:0}.object-properties-preview .name{color:var(--sys-color-token-subtle)}@media (forced-colors: active){.object-value-calculate-value-button:hover{forced-color-adjust:none;color:Highlight}}\n/*# sourceURL=objectValue.css */\n");const c=new CSSStyleSheet;c.replaceSync(".tree-outline-disclosure li{padding:2px 0 0 5px;overflow:hidden;display:flex;min-height:17px;align-items:baseline}.tree-outline-disclosure{padding-left:0!important;padding-right:3px}.tree-outline-disclosure li.parent::before{top:0!important}.tree-outline-disclosure .name{color:var(--sys-color-token-tag)}.tree-outline-disclosure .object-value-node,\n.tree-outline-disclosure .object-value-object{overflow:hidden;text-overflow:ellipsis}.event-listener-details{display:flex}.event-listener-tree-subtitle{float:right;margin-left:5px;flex-shrink:0}.event-listener-button{padding:0 5px;color:var(--sys-color-primary);background-color:var(--sys-color-cdt-base-container);border-radius:7px;border:1px solid var(--sys-color-tonal-outline);margin-left:5px;display:block;flex-shrink:0;&:hover{background-color:var(--sys-color-state-hover-on-subtle)}&:active{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}}.tree-outline-disclosure li:hover .event-listener-button{display:inline}@media (forced-colors: active){.event-listener-details .event-listener-button{forced-color-adjust:none;opacity:100%;background:ButtonFace;color:ButtonText;border-color:ButtonText}.event-listener-button:hover{background-color:Highlight!important;color:HighlightText;border-color:ButtonText}.tree-outline.hide-selection-when-blurred .selected:focus-visible .event-listener-button,\n  .tree-outline-disclosure li:focus-visible .gray-info-message{background-color:Highlight;color:HighlightText;border-color:HighlightText}}\n/*# sourceURL=eventListenersView.css */\n");const u={noEventListeners:"No event listeners",remove:"Remove",deleteEventListener:"Delete event listener",togglePassive:"Toggle Passive",toggleWhetherEventListenerIs:"Toggle whether event listener is passive or blocking",revealInElementsPanel:"Reveal in Elements panel",passive:"Passive"},d=n.i18n.registerUIStrings("panels/event_listeners/EventListenersView.ts",u),h=n.i18n.getLocalizedString.bind(void 0,d);class v extends i.Widget.VBox{changeCallback;enableDefaultTreeFocus;treeOutline;emptyHolder;linkifier;treeItemMap;constructor(e,t=!1){super(),this.changeCallback=e,this.enableDefaultTreeFocus=t,this.treeOutline=new i.TreeOutline.TreeOutlineInShadow,this.treeOutline.setComparator(p.comparator),this.treeOutline.element.classList.add("monospace"),this.treeOutline.setShowSelectionOnKeyboardFocus(!0),this.treeOutline.setFocusable(!0),this.element.appendChild(this.treeOutline.element),this.emptyHolder=document.createElement("div"),this.emptyHolder.classList.add("gray-info-message"),this.emptyHolder.textContent=h(u.noEventListeners),this.emptyHolder.tabIndex=-1,this.linkifier=new o.Linkifier.Linkifier,this.treeItemMap=new Map}focus(){this.enableDefaultTreeFocus&&(this.emptyHolder.parentNode?this.emptyHolder.focus():this.treeOutline.forceSelect())}async addObjects(e){this.reset(),await Promise.all(e.map((e=>e?this.addObject(e):Promise.resolve()))),this.addEmptyHolderIfNeeded(),this.eventListenersArrivedForTest()}addObject(e){let n,r=null;const o=[],i=e.runtimeModel().target().model(t.DOMDebuggerModel.DOMDebuggerModel);return i&&o.push(i.eventListeners(e).then((function(e){n=e}))),o.push(s(e).then((function(e){r=e}))),Promise.all(o).then((async function(){if(!r)return;if(!r.internalHandlers)return;return r.internalHandlers.object().callFunctionJSON((function(){const e=[],t=new Set(this);for(const n of arguments)e.push(t.has(n));return e}),n.map((function(e){return t.RemoteObject.RemoteObject.toCallArgument(e.handler())}))).then((function(e){for(let t=0;t<n.length;++t)e[t]&&n[t].markAsFramework()}))})).then(function(){this.addObjectEventListeners(e,n),r&&this.addObjectEventListeners(e,r.eventListeners)}.bind(this))}addObjectEventListeners(e,t){if(t)for(const n of t){this.getOrCreateTreeElementForType(n.type()).addObjectEventListener(n,e)}}showFrameworkListeners(e,t,n){const r=this.treeOutline.rootElement().children();for(const o of r){let r=!0;for(const i of o.children()){const o=i,s=o.eventListener().origin();let l=!1;"FrameworkUser"!==s||e||(l=!0),"Framework"===s&&e&&(l=!0),!t&&o.eventListener().passive()&&(l=!0),n||o.eventListener().passive()||(l=!0),o.hidden=l,r=r&&l}o.hidden=r}}getOrCreateTreeElementForType(e){let t=this.treeItemMap.get(e);return t||(t=new p(e,this.linkifier,this.changeCallback),this.treeItemMap.set(e,t),t.hidden=!0,this.treeOutline.appendChild(t)),this.emptyHolder.remove(),t}addEmptyHolderIfNeeded(){let e=!0,t=null;for(const n of this.treeOutline.rootElement().children())n.hidden=!n.firstChild(),e=e&&n.hidden,t||n.hidden||(t=n);e&&!this.emptyHolder.parentNode&&this.element.appendChild(this.emptyHolder),t&&t.select(!0),this.treeOutline.setFocusable(Boolean(t))}reset(){const e=this.treeOutline.rootElement().children();for(const t of e)t.removeChildren();this.linkifier.reset()}eventListenersArrivedForTest(){}wasShown(){super.wasShown(),this.treeOutline.registerCSSFiles([c,a])}}class p extends i.TreeOutline.TreeElement{toggleOnClick;linkifier;changeCallback;constructor(e,t,n){super(e),this.toggleOnClick=!0,this.linkifier=t,this.changeCallback=n,i.ARIAUtils.setLabel(this.listItemElement,`${e}, event listener`)}static comparator(e,t){return e.title===t.title?0:e.title>t.title?1:-1}addObjectEventListener(e,t){const n=new f(e,t,this.linkifier,this.changeCallback);this.appendChild(n)}}class f extends i.TreeOutline.TreeElement{eventListenerInternal;editable;changeCallback;valueTitle;constructor(e,t,n,r){super("",!0),this.eventListenerInternal=e,this.editable=!1,this.setTitle(t,n),this.changeCallback=r}async onpopulate(){const e=[],n=this.eventListenerInternal,o=n.domDebuggerModel().runtimeModel();e.push(o.createRemotePropertyFromPrimitiveValue("useCapture",n.useCapture())),e.push(o.createRemotePropertyFromPrimitiveValue("passive",n.passive())),e.push(o.createRemotePropertyFromPrimitiveValue("once",n.once())),void 0!==n.handler()&&e.push(new t.RemoteObject.RemoteObjectProperty("handler",n.handler())),r.ObjectPropertiesSection.ObjectPropertyTreeElement.populateWithProperties(this,e,[],!0,!0,null)}setTitle(t,n){const o=this.listItemElement.createChild("span","event-listener-details"),s=r.ObjectPropertiesSection.ObjectPropertiesSection.createPropertyValue(t,!1,!1);if(this.valueTitle=s.element,o.appendChild(this.valueTitle),this.eventListenerInternal.canRemove()){const e=o.createChild("span","event-listener-button");e.textContent=h(u.remove),i.Tooltip.Tooltip.install(e,h(u.deleteEventListener)),e.addEventListener("click",(e=>{this.removeListener(),e.consume()}),!1),o.appendChild(e)}if(this.eventListenerInternal.isScrollBlockingType()&&this.eventListenerInternal.canTogglePassive()){const e=o.createChild("span","event-listener-button");e.textContent=h(u.togglePassive),i.Tooltip.Tooltip.install(e,h(u.toggleWhetherEventListenerIs)),e.addEventListener("click",(e=>{this.togglePassiveListener(),e.consume()}),!1),o.appendChild(e)}const l=o.createChild("span","event-listener-tree-subtitle"),a=n.linkifyRawLocation(this.eventListenerInternal.location(),this.eventListenerInternal.sourceURL());l.appendChild(a),this.listItemElement.addEventListener("contextmenu",(n=>{const r=new i.ContextMenu.ContextMenu(n);n.target!==a&&r.appendApplicableItems(a),"node"===t.subtype&&r.defaultSection().appendItem(h(u.revealInElementsPanel),(()=>e.Revealer.reveal(t)),{jslogContext:"reveal-in-elements"}),r.defaultSection().appendItem(h(u.deleteEventListener),this.removeListener.bind(this),{disabled:!this.eventListenerInternal.canRemove(),jslogContext:"delete-event-listener"}),r.defaultSection().appendCheckboxItem(h(u.passive),this.togglePassiveListener.bind(this),{checked:this.eventListenerInternal.passive(),disabled:!this.eventListenerInternal.canTogglePassive(),jslogContext:"passive"}),r.show()}))}removeListener(){this.removeListenerBar(),this.eventListenerInternal.remove()}togglePassiveListener(){this.eventListenerInternal.togglePassive().then((()=>this.changeCallback()))}removeListenerBar(){const e=this.parent;if(!e)return;e.removeChild(this),e.childCount()||e.collapse();let t=!0;for(const n of e.children())n.hidden||(t=!1);e.hidden=t}eventListener(){return this.eventListenerInternal}onenter(){return!!this.valueTitle&&(this.valueTitle.click(),!0)}ondelete(){return!!this.eventListenerInternal.canRemove()&&(this.removeListener(),!0)}}var m=Object.freeze({__proto__:null,EventListenersView:v,EventListenersTreeElement:p,ObjectEventListenerBar:f});export{l as EventListenersUtils,m as EventListenersView};
