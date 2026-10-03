var L=Object.defineProperty;var M=(r,t,n)=>t in r?L(r,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[t]=n;var f=(r,t,n)=>M(r,typeof t!="symbol"?t+"":t,n);function d(r){for(const t of r)try{const n=document.querySelector(t);if(n)return n}catch{}return null}function p(r){for(const t of r)try{const n=Array.from(document.querySelectorAll(t));if(n.length>0)return n}catch{}return[]}async function N(r,t,n=!1){var e,o;try{if(r.focus(),(((e=r.innerText)==null?void 0:e.trim())??"").length>0&&!n&&!window.confirm("Ô chat đang có sẵn nội dung. Bạn có muốn thay thế bằng prompt của RootAccess không?"))return{ok:!1,error:"INSERT_FAILED"};const i=window.getSelection(),s=document.createRange();if(s.selectNodeContents(r),i==null||i.removeAllRanges(),i==null||i.addRange(s),!document.execCommand("insertText",!1,t)||!((o=r.innerText)!=null&&o.includes(t.slice(0,20)))){r.focus();const l=new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,inputType:"insertText",data:t});r.dispatchEvent(l),r.innerText=t;const x=new Event("input",{bubbles:!0});r.dispatchEvent(x)}const E=t.slice(0,15).trim();return r.innerText&&r.innerText.includes(E)?{ok:!0}:{ok:!1,error:"INSERT_FAILED"}}catch(g){return console.error("[RootAccess] Insert prompt failed:",g),{ok:!1,error:"INSERT_FAILED"}}}class G{constructor(t){f(this,"id","chatgpt");f(this,"selectors");this.selectors=t??{input:["#prompt-textarea","div[contenteditable='true']"],assistantMessage:["[data-message-author-role='assistant']"],stopButton:["button[data-testid='stop-button']"]}}updateSelectors(t){this.selectors=t}matches(t){return t.hostname.includes("chatgpt.com")}isReady(){return d(this.selectors.input)!==null}async insertPrompt(t){const n=d(this.selectors.input);return n?await N(n,t):{ok:!1,error:"INPUT_NOT_FOUND"}}isGenerating(){return d(this.selectors.stopButton)!==null}async getLastAssistantMessage(){if(this.isGenerating())return{ok:!1,error:"STILL_GENERATING"};const t=p(this.selectors.assistantMessage);if(t.length===0)return{ok:!1,error:"NO_ASSISTANT_MESSAGE"};let e=(t[t.length-1].innerText??"").trim();return e?(e.length>2e4&&(e=e.slice(0,2e4)),{ok:!0,text:e}):{ok:!1,error:"NO_ASSISTANT_MESSAGE"}}getLastAssistantElement(){const t=p(this.selectors.assistantMessage);return t.length===0?null:t[t.length-1]}}class v{constructor(t){f(this,"id","gemini");f(this,"selectors");this.selectors=t??{input:["rich-textarea .ql-editor","div[contenteditable='true']"],assistantMessage:["model-response message-content","model-response"],stopButton:["button[aria-label*='Stop']","button[aria-label*='Dừng']"]}}updateSelectors(t){this.selectors=t}matches(t){return t.hostname.includes("gemini.google.com")}isReady(){return d(this.selectors.input)!==null}async insertPrompt(t){const n=d(this.selectors.input);return n?await N(n,t):{ok:!1,error:"INPUT_NOT_FOUND"}}isGenerating(){return d(this.selectors.stopButton)!==null}async getLastAssistantMessage(){if(this.isGenerating())return{ok:!1,error:"STILL_GENERATING"};const t=p(this.selectors.assistantMessage);if(t.length===0)return{ok:!1,error:"NO_ASSISTANT_MESSAGE"};let e=(t[t.length-1].innerText??"").trim();return e?(e.length>2e4&&(e=e.slice(0,2e4)),{ok:!0,text:e}):{ok:!1,error:"NO_ASSISTANT_MESSAGE"}}getLastAssistantElement(){const t=p(this.selectors.assistantMessage);return t.length===0?null:t[t.length-1]}}let c=null;function S(r){return r.replace(/[*#`_~]/g,"").replace(/\s+/g," ").trim().toLowerCase()}function _(r){(r||document.body).querySelectorAll("mark[data-ra]").forEach(e=>{const o=e.parentNode;if(o){for(;e.firstChild;)o.insertBefore(e.firstChild,e);o.removeChild(e),o.normalize()}})}function C(r,t){if(_(r),!t||t.length===0)return;const n=t.filter(e=>e.evidence_quote&&e.evidence_quote.trim().length>=10);if(n.length!==0){if(!document.getElementById("ra-highlight-styles")){const e=document.createElement("style");e.id="ra-highlight-styles",e.textContent=`
      mark[data-ra] {
        border-radius: 4px;
        padding: 2px 4px;
        cursor: pointer;
        position: relative;
        font-weight: inherit;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        transition: opacity 0.2s ease;
      }
      mark[data-ra="CHUA_DAT"] {
        background-color: rgba(254, 226, 226, 0.9) !important;
        color: #991b1b !important;
        text-decoration-color: #dc2626 !important;
      }
      mark[data-ra="DAT"] {
        background-color: rgba(254, 243, 199, 0.9) !important;
        color: #92400e !important;
        text-decoration-color: #d97706 !important;
      }
      mark[data-ra="TOT"] {
        background-color: rgba(220, 252, 231, 0.9) !important;
        color: #166534 !important;
        text-decoration-color: #16a34a !important;
      }
      .ra-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1c1a17;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        line-height: 1.4;
        white-space: normal;
        max-width: 280px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        z-index: 999999;
        pointer-events: none;
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      mark[data-ra]:hover .ra-tooltip {
        display: block;
      }
      #ra-floating-trigger {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999998;
        background: #4B37C8;
        color: #ffffff;
        padding: 8px 14px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 4px 14px rgba(75, 55, 200, 0.35);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border: none;
        outline: none;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      #ra-floating-trigger:hover {
        transform: translateY(-2px);
        background: #3c2ba6;
      }
      #ra-floating-trigger .ra-logo-icon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: #1c1a17;
        color: #FFE27A;
        font-family: serif;
        font-weight: bold;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,document.head.appendChild(e)}for(const e of n){const o=S(e.evidence_quote);if(o.length<10)continue;const g=o.length>80?o.slice(0,80):o,i=document.createTreeWalker(r,NodeFilter.SHOW_TEXT,null);let s=null;for(;s=i.nextNode();){if(!s.nodeValue)continue;if(S(s.nodeValue).indexOf(g)!==-1)try{const l=s.nodeValue,x=Math.min(g.length+10,l.length),h=document.createRange();h.setStart(s,0),h.setEnd(s,Math.min(l.length,x));const u=document.createElement("mark");u.setAttribute("data-ra",e.level),u.setAttribute("data-ra-id",e.id);const b=document.createElement("span");b.className="ra-tooltip";const I=e.level==="CHUA_DAT"?"⊗ Chưa đạt":e.level==="DAT"?"⊖ Đạt":"✓ Tốt";b.textContent=`${I} · ${e.reason}`;const w=h.extractContents();u.appendChild(w),u.appendChild(b),u.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"RA_SCROLL_TO_CRITERION",criterionId:e.id})}),h.insertNode(u);break}catch(l){console.warn("[RootAccess] Highlighting error:",l)}}}c&&c.disconnect(),c=new MutationObserver(()=>{r.querySelector("mark[data-ra]")||(c==null||c.disconnect(),c=null)}),c.observe(r,{childList:!0,subtree:!1})}}function R(){if(document.getElementById("ra-floating-trigger"))return;const r=document.createElement("button");r.id="ra-floating-trigger",r.innerHTML=`
    <span class="ra-logo-icon">R</span>
    <span>Mở RootAccess</span>
  `,r.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"RA_OPEN_PANEL"})}),document.body.appendChild(r)}let a=null;const A=new URL(window.location.href),m=new G,T=new v;m.matches(A)?a=m:T.matches(A)&&(a=T);var k;(k=chrome==null?void 0:chrome.storage)!=null&&k.local&&chrome.storage.local.get(["cached_selectors"],r=>{if(r.cached_selectors){const t=r.cached_selectors;m&&t.chatgpt&&m.updateSelectors(t.chatgpt),T&&t.gemini&&T.updateSelectors(t.gemini)}});a&&setTimeout(()=>{R()},1e3);chrome.runtime.onMessage.addListener((r,t,n)=>{if(!a)return r.type==="PING"?n({site:null,ready:!1}):n({ok:!1,error:"UNSUPPORTED_SITE"}),!0;switch(r.type){case"PING":n({site:a.id,ready:a.isReady(),url:window.location.href});break;case"IS_GENERATING":n({generating:a.isGenerating()});break;case"INSERT_PROMPT":return a.insertPrompt(r.text).then(e=>n(e)).catch(e=>{n({ok:!1,error:"INSERT_FAILED",detail:String(e)})}),!0;case"READ_LAST_ANSWER":return a.getLastAssistantMessage().then(e=>n(e)).catch(e=>{n({ok:!1,error:"NO_ASSISTANT_MESSAGE",detail:String(e)})}),!0;case"HIGHLIGHT_QUOTES":try{const e=a.getLastAssistantElement();e&&r.items?(C(e,r.items),n({ok:!0})):n({ok:!1,reason:"NO_ELEMENT"})}catch(e){n({ok:!1,error:e.message})}break;case"CLEAR_HIGHLIGHTS":_(),n({ok:!0});break;case"GET_CHAT_URL":n({url:window.location.href});break;default:n({ok:!1,error:"UNKNOWN_MESSAGE_TYPE"})}return!0});
