import { NotificationOutcome } from 'react-use-notifications';

import type { ShowResult } from 'react-use-notifications';

export const describeActionsResult = (requested: number, result: ShowResult): string => {
  if (result.outcome !== NotificationOutcome.Shown) {
    return `${result.outcome}: ${result.reason}`;
  }

  if (result.actionsUnsupported) {
    return `Asked for ${requested}, drew none. This delivery cannot show buttons.`;
  }

  const hidden = result.clampedActions.map((action) => action.title);
  if (hidden.length === 0) {
    return `Asked for ${requested}, drew all ${requested}.`;
  }

  const drew = requested - hidden.length;

  return `Asked for ${requested}, drew ${drew}. result.clampedActions holds ${hidden.join(', ')}, `
    + 'so you can render it yourself.';
};
