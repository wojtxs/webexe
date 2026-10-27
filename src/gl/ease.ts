/**
 * ease.ts — token cubic-bezier z tokens.css (np. --ease-default) jako ease GSAP.
 */

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { cssVar } from '@core/css';

gsap.registerPlugin(CustomEase);

export function easeFromToken(token: string): string {
  const nums = cssVar(token).match(/-?[\d.]+/g);
  if (nums?.length !== 4) return 'power3.out';
  const name = token.replace(/^--/, '');
  CustomEase.create(name, nums.join(','));
  return name;
}
