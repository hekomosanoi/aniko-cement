/*
  Настройки сайта (отредактируйте под вашу компанию)
  --------------------------------------------------
  Важно: Я НЕ смог открыть оригинальный сайт по прямой ссылке (502 Bad Gateway из среды).
  Поэтому тут стоят аккуратные значения по умолчанию + удобное место, где их поменять.

  Пример (по данным справочников) ...
*/

const SITE = {
  company: 'АНИКО Цемент',
  phones: [
    {
      label: 'Офис',
      raw: '+74964453212', // формат: +7XXXXXXXXXX (без пробелов)
      display: '+7 (496) 445‑32‑12'
    },
    {
      label: 'Менеджер',
      raw: '+79193875000',
      display: '+7 (919) 387‑50‑00'
    }
  ],
  email: 'info@anikocement.com',
  address: 'Московская обл., г.о. Воскресенск, с. Усадище, ул. Воронцова, д. 123',
  hours: 'Пн–Пт: 09:00–18:00'
};

// --- helpers ---
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);

function setText(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function setLink(sel, { href, text }) {
  const el = $(sel);
  if (!el) return;
  if (href) el.setAttribute('href', href);
  if (text) el.textContent = text;
}

function toast(message, type = 'info') {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.dataset.type = type;
  el.classList.add('toast--show');
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => el.classList.remove('toast--show'), 3200);
}

function normalizePhone(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[()\-]/g, '').trim();
}

// --- boot ---
window.addEventListener('DOMContentLoaded', () => {
  // Year
  setText('#year', String(new Date().getFullYear()));

  // Contacts injection
  const primary = SITE.phones?.[0] || { raw: '+70000000000', display: '+7 (000) 000‑00‑00' };
  const telHref = `tel:${primary.raw}`;
  setLink('#headerPhone', { href: telHref, text: primary.display });
  setLink('#heroCall', { href: telHref, text: 'Позвонить' });
  setLink('#contactCall', { href: telHref, text: 'Позвонить' });

  // Render phones list
  const phonesRoot = document.getElementById('contactPhones');
  if (phonesRoot) {
    phonesRoot.innerHTML = '';
    (SITE.phones || []).forEach((p) => {
      const a = document.createElement('a');
      a.className = 'link';
      a.href = `tel:${p.raw}`;
      a.textContent = p.display;

      const small = document.createElement('span');
      small.className = 'phones__label';
      small.textContent = p.label ? `— ${p.label}` : '';

      const row = document.createElement('div');
      row.className = 'phones__row';
      row.appendChild(a);
      if (p.label) row.appendChild(small);

      phonesRoot.appendChild(row);
    });
  }

  setLink('#contactEmail', { href: `mailto:${SITE.email}`, text: SITE.email });
  setText('#contactAddress', SITE.address);
  setText('#mapText', SITE.address);
  setText('#contactHours', SITE.hours);

  // Mobile nav
  const toggle = $('.nav-toggle');
  const nav = $('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('nav--open');
    });

    // Close menu when clicking a link
    $$('#nav a').forEach((a) => {
      a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('nav--open');
      });
    });
  }

  // Open lead form with prefilled product
  const productInput = $('#leadForm input[name="product"]');
  $$('[data-open-lead]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = btn.getAttribute('data-product') || '';
      if (productInput) productInput.value = product;
      document.querySelector('#lead')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => $('#leadForm input[name="name"]')?.focus(), 400);
    });
  });

  // Modals
  $$('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-open-modal');
      const dlg = document.getElementById(`modal-${id}`);
      if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    });
  });

  $$('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dlg = btn.closest('dialog');
      dlg?.close();
    });
  });

  $$('dialog.modal').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      const rect = dlg.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
      if (!inDialog) dlg.close();
    });
  });

  // Form
  const form = $('#leadForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const status = $('#formStatus');
      const submit = $('#submitBtn');

      const fd = new FormData(form);
      const payload = {
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        product: String(fd.get('product') || '').trim(),
        message: String(fd.get('message') || '').trim(),
        consent: Boolean(fd.get('consent')),
        website: String(fd.get('website') || '').trim()
      };

      // Soft client-side validation
      if (payload.name.length < 2) {
        status && (status.textContent = 'Укажите имя (минимум 2 символа).');
        toast('Проверьте имя', 'error');
        return;
      }

      const phoneNorm = normalizePhone(payload.phone);
      if (phoneNorm.length < 6) {
        status && (status.textContent = 'Укажите телефон, чтобы мы могли связаться.');
        toast('Проверьте телефон', 'error');
        return;
      }

      if (!payload.consent) {
        status && (status.textContent = 'Нужно согласие на обработку персональных данных.');
        toast('Подтвердите согласие', 'error');
        return;
      }

      try {
        submit && (submit.disabled = true);
        status && (status.textContent = 'Отправляем…');

        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json?.error || 'REQUEST_FAILED');
        }

        form.reset();
        status && (status.textContent = 'Готово! Мы свяжемся с вами в ближайшее время.');
        toast('Заявка отправлена', 'success');
      } catch (err) {
        console.error(err);
        status && (status.textContent = 'Не удалось отправить. Попробуйте ещё раз или позвоните.');
        toast('Ошибка отправки', 'error');
      } finally {
        submit && (submit.disabled = false);
      }
    });
  }
});
