import type { ServerMessage } from './Inbox.types';

export const SERVER_MESSAGES: ServerMessage[] = [
  { title: 'Ada replied', body: 'See you at 3', href: '/threads/42', category: 'chat' },
  {
    title: 'Deploy finished',
    body: 'api-gateway in 41s',
    href: '/deploys/8f21',
    category: 'deploy',
    tag: 'deploy-api-gateway',
  },
  { title: 'Grace mentioned you', body: 'Can you review the pricing page?', href: '/threads/7', category: 'chat' },
  { title: 'Build broke', body: 'main is red after #1290', href: '/builds/1290', category: 'ci' },
  { title: 'Invoice paid', body: 'Initech paid invoice 2026-114', href: '/billing/2026-114', category: 'billing' },
];

export const FEED_INTERVAL_MS = 4000;
