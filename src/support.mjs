// Codex, 2026-10-22. Optional support after single-file or ZIP download; no payment API.
import {t,onLanguageChange} from './i18n.mjs';
export function setupSupportDialog() {
  const dialog = document.getElementById('support-dialog');
  // Browsers without dialog support keep the download flow working.
  if (!dialog?.showModal) return () => {};
  const flip = document.getElementById('support-flip');
  const toggle = document.getElementById('support-switch');
  const label = document.getElementById('support-method');
  const alipay = document.getElementById('support-alipay');
  const wechat = document.getElementById('support-wechat');
  function setMethod(method) {
    const useWechat = method === 'wechat';
    flip.dataset.method = method;
    alipay.setAttribute('aria-hidden', String(useWechat));
    wechat.setAttribute('aria-hidden', String(!useWechat));
    label.textContent = t(useWechat ? 'wechat' : 'alipay');
    toggle.textContent = t(useWechat ? 'useAlipay' : 'useWechat');
    toggle.setAttribute('aria-label', t(useWechat ? 'switchAlipay' : 'switchWechat'));
  }
  toggle.addEventListener('click', () => setMethod(flip.dataset.method === 'wechat' ? 'alipay' : 'wechat'));
  setMethod('alipay');
  onLanguageChange(()=>setMethod(flip.dataset.method));
  document.getElementById('support-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('support-open'));
  return () => {
    if (dialog.open) return;
    // Reset off-screen so a fresh download never starts on a previous method.
    setMethod('alipay');
    dialog.showModal();
    document.body.classList.add('support-open');
  };
}
