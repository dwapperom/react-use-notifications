import {
  createFakeRegistration,
  FakeNotification,
  installFakeNotification as installCoreNotification,
  installFakePermissions,
  setSecureContext,
} from '../../../core/src/test/fakes';

export { createFakeRegistration, FakeNotification };

const toPermissionState = (permission: NotificationPermission): PermissionState => {
  return permission === 'default'
    ? 'prompt'
    : permission;
};

export const installFakeNotification = (permission: NotificationPermission = 'granted'): void => {
  const Fake = installCoreNotification();
  Fake.permission = permission;

  setSecureContext(true);
  installFakePermissions(toPermissionState(permission));
};
