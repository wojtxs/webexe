/**
 * Technologie: nazwa i ikona. Ikony to Simple Icons (CC0) w src/assets/tech/, bez <title> i role,
 * importowane jako komponenty SVG Astro; kolor z currentColor, więc bez barw marek.
 * Czytają je siatka technologii w 03 i blok „Z czym połączyliśmy” na stronie projektu.
 */
import astro from '../assets/tech/astro.svg';
import cloudflare from '../assets/tech/cloudflare.svg';
import docker from '../assets/tech/docker.svg';
import github from '../assets/tech/github.svg';
import googlecloud from '../assets/tech/googlecloud.svg';
import jira from '../assets/tech/jira.svg';
import nodejs from '../assets/tech/nodedotjs.svg';
import typescript from '../assets/tech/typescript.svg';
import type { TechKey } from './tech-keys';

export const tech = {
  cloudflare: { name: 'Cloudflare', icon: cloudflare },
  googlecloud: { name: 'Google Cloud', icon: googlecloud },
  astro: { name: 'Astro', icon: astro },
  typescript: { name: 'TypeScript', icon: typescript },
  nodejs: { name: 'Node.js', icon: nodejs },
  docker: { name: 'Docker', icon: docker },
  github: { name: 'GitHub', icon: github },
  jira: { name: 'Jira', icon: jira },
} satisfies Record<TechKey, { name: string; icon: unknown }>;
