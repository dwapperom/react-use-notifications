import { CHAT_CODE, ChatRecipe } from './ChatRecipe';
import { DEPLOY_CODE, DeployRecipe } from './DeployRecipe';
import { ROUTER_CODE, RouterRecipe } from './RouterRecipe';
import { UPLOAD_CODE, UploadRecipe } from './UploadRecipe';

import type { Recipe } from './Recipe.types';

export const RECIPES: Recipe[] = [
  {
    label: 'Chat client',
    description:
      'The same call site for both. A plain message has no buttons so it goes out through the '
      + 'constructor; a mention has two, so auto routes it through the service worker instead.',
    code: CHAT_CODE,
    Component: ChatRecipe,
  },
  {
    label: 'Upload progress',
    description:
      'Permission is asked during the click, and the notification arrives seconds later from '
      + 'somewhere else. One tag means each update replaces the last instead of filling the tray.',
    code: UPLOAD_CODE,
    Component: UploadRecipe,
  },
  {
    label: 'Your own router',
    description:
      'No navigate anywhere. The worker posts the click back to the page and your router decides '
      + 'what it means. Send one, then click the notification itself.',
    code: ROUTER_CODE,
    Component: RouterRecipe,
  },
  {
    label: 'Deploy dashboard',
    description:
      'Auto decides per call: a success while you are reading this becomes an in-app toast, a '
      + 'failure is pushed to the operating system regardless.',
    code: DEPLOY_CODE,
    Component: DeployRecipe,
  },
];
