/**
 * contact.ts — 07 Kontakt / stopka (docs/INSPIRACJE.md, warstwa sekcji z momentem).
 *
 * Wielki wordmark w stopce: litery wyjeżdżają spod dolnej krawędzi SVG po kolei, gdy stopka
 * wjeżdża na ekran (Wordmark split, atrybut y liter). Węzeł x nad CTA rysuje grid-draw.ts.
 * Formularz: bez kontaktu pole dostaje aria-invalid, fokus i krótkie drgnięcie; z kontaktem formularz
 * ustępuje stanowi sukcesu (x rysuje się, tekst wjeżdża), a fokus idzie na jego nagłówek.
 * TODO(D7): formularz nic nie wysyła, stan sukcesu jest pokazowy (DEMO) do czasu obsługi wysyłki.
 * Reduced motion: wordmark od razu na miejscu, formularz i sukces zamieniają się bez ruchu.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Litery wordmarku: odstęp startów (s)
const LETTER_STAGGER = 0.06;

const Contact: Module = {
  init(root: HTMLElement) {
    const letters = Array.from(root.querySelectorAll<SVGTSpanElement>('[data-wordmark-letter]'));
    const form = root.querySelector<HTMLFormElement>('[data-contact="form"]');
    const success = root.querySelector<HTMLElement>('[data-contact="success"]');
    const field = form?.querySelector<HTMLInputElement>('[name="kontakt"]');
    let full = false;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        full = true;
        const svg = letters[0]?.ownerSVGElement;
        if (svg) {
          const height = svg.viewBox.baseVal.height;
          gsap.from(letters, {
            attr: { y: (_: number, el: SVGTSpanElement) => Number(el.getAttribute('y')) + height },
            duration: durationToken('--d-enter'),
            ease: easeToken('--ease-enter'),
            stagger: LETTER_STAGGER,
            scrollTrigger: { trigger: svg, start: 'top 90%', once: true },
          });
        }
        return () => {
          full = false;
        };
      });
    }, root);

    const invalid = () => {
      if (!field) return;
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      if (full) {
        gsap.fromTo(
          field,
          { x: 0 },
          { keyframes: { x: [0, -6, 6, -4, 4, 0] }, duration: 0.4, ease: 'none', clearProps: 'x' }
        );
      }
    };

    const showSuccess = () => {
      if (!form || !success) return;
      const heading = success.querySelector<HTMLElement>('[tabindex="-1"]');
      const swap = () => {
        form.hidden = true;
        success.hidden = false;
        heading?.focus();
      };
      if (!full) {
        swap();
        return;
      }
      const ease = easeToken('--ease-enter');
      const duration = durationToken('--d-enter');
      gsap
        .timeline()
        .to(form, { autoAlpha: 0, y: -16, duration: duration * 0.4, ease })
        .call(swap)
        .fromTo(
          success.querySelectorAll('.contact__success-x path'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: duration * 0.6, ease, stagger: 0.2 }
        )
        .from(
          success.querySelectorAll('[data-contact-rise]'),
          { y: 24, opacity: 0, duration: duration * 0.6, ease, stagger: 0.08 },
          '<0.15'
        );
    };

    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      if (!field?.value.trim()) {
        invalid();
        return;
      }
      field.removeAttribute('aria-invalid');
      showSuccess();
    };
    const onInput = () => field?.removeAttribute('aria-invalid');

    form?.addEventListener('submit', onSubmit);
    field?.addEventListener('input', onInput);

    this.destroy = () => {
      revert();
      form?.removeEventListener('submit', onSubmit);
      field?.removeEventListener('input', onInput);
    };
  },

  destroy() {},
};

export default Contact;
