import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { NotificationList } from '../components/NotificationList';
import { InboxProvider } from '../context/InboxProvider';
import { localStorageStore } from '../localStorageStore';
import { useInbox } from './useInbox';

import type { InboxItem, InboxStore } from '../Inbox.types';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <InboxProvider store={localStorageStore()}>{children}</InboxProvider>
);

const renderInbox = () => renderHook(() => useInbox(), { wrapper });

const serverItem = (id: string, overrides: Partial<InboxItem> = {}): InboxItem => {
  return {
    id,
    receivedAt: 1,
    readAt: null,
    title: id,
    ...overrides,
  };
};

const createServerStore = (seed: InboxItem[]) => {
  const rows = new Map(seed.map((item) => [item.id, item]));
  let gate: Promise<void> | null = null;

  const store: InboxStore = {
    list: async () => {
      const snapshot = [...rows.values()];
      if (gate) {
        await gate;
      }

      return snapshot;
    },
    add: async (item) => {
      rows.set(item.id, { ...item, readAt: rows.get(item.id)?.readAt ?? item.readAt });
    },
    markRead: async (id, readAt) => {
      const row = rows.get(id);
      if (row) {
        rows.set(id, { ...row, readAt: row.readAt ?? readAt });
      }
    },
    markAllRead: async (readAt) => {
      for (const [id, row] of rows) {
        rows.set(id, { ...row, readAt: row.readAt ?? readAt });
      }
    },
    remove: async (id) => {
      rows.delete(id);
    },
    clear: async () => {
      rows.clear();
    },
  };

  const hold = () => {
    let open = () => {};
    gate = new Promise((resolve) => {
      open = resolve;
    });

    return () => {
      gate = null;
      open();
    };
  };

  return {
    store,
    rows,
    hold,
  };
};

const renderWithStore = (store: InboxStore, initialItems?: InboxItem[]) => {
  return renderHook(() => useInbox(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <InboxProvider store={store} initialItems={initialItems}>{children}</InboxProvider>
    ),
  });
};

describe('useInbox', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('counts only what has not been read', async () => {
    const { result } = renderInbox();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let id: string | null = null;
    await act(async () => {
      id = await result.current.add({ title: 'Ada replied' });
      await result.current.add({ title: 'Grace replied' });
    });

    expect(result.current.unread).toBe(2);

    await act(async () => {
      await result.current.markRead(id ?? '');
    });

    expect(result.current.unread).toBe(1);
    expect(result.current.items).toHaveLength(2);
  });

  it('keeps the newest first and replaces on tag', async () => {
    const { result } = renderInbox();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.add({ title: 'Deploying', tag: 'deploy-1' });
      await result.current.add({ title: 'Other' });
      await result.current.add({ title: 'Deployed', tag: 'deploy-1' });
    });

    expect(result.current.items.map((item) => item.title)).toEqual(['Deployed', 'Other']);
  });

  it('hydrates from the store on mount', async () => {
    const store = localStorageStore();
    await store.add({
      id: 'seed',
      receivedAt: 1,
      readAt: null,
      title: 'From a previous visit',
    });

    const { result } = renderHook(() => useInbox(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <InboxProvider store={store}>{children}</InboxProvider>
      ),
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.unread).toBe(1);
  });

  it('marks all read and clears', async () => {
    const { result } = renderInbox();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.add({ title: 'One' });
      await result.current.add({ title: 'Two' });
      await result.current.markAllRead();
    });

    expect(result.current.unread).toBe(0);

    await act(async () => {
      await result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('throws a useful error without a provider', () => {
    const { result } = renderHook(() => useInbox());

    expect(() => result.current.add({ title: 'Nope' })).toThrow(/InboxProvider/);
  });
});

describe('useInbox with a server store', () => {
  it('renders the initial items before the store answers', async () => {
    const server = createServerStore([serverItem('srv-1'), serverItem('srv-2', { receivedAt: 2 })]);
    const release = server.hold();

    const { result } = renderWithStore(server.store, [serverItem('srv-1')]);

    expect(result.current.isLoading).toBe(false);
    expect(result.current.unread).toBe(1);

    await act(async () => {
      release();
    });

    await waitFor(() => {
      expect(result.current.items.map((item) => item.id)).toEqual(['srv-2', 'srv-1']);
    });
  });

  it('reloads instead of dropping the server list when a write lands mid-read', async () => {
    const server = createServerStore([serverItem('srv-1')]);
    const release = server.hold();

    const { result } = renderWithStore(server.store);

    await act(async () => {
      await result.current.add({ title: 'Live' });
    });

    await act(async () => {
      release();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items.map((item) => item.title)).toEqual(['Live', 'srv-1']);
  });

  it('upserts on a server id and keeps the read state', async () => {
    const server = createServerStore([]);
    const { result } = renderWithStore(server.store);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let id: string | null = null;
    await act(async () => {
      id = await result.current.add({ id: 'srv-7', title: 'Ada replied', receivedAt: 5 });
    });
    await act(async () => {
      await result.current.markRead('srv-7');
    });
    await act(async () => {
      await result.current.add({ id: 'srv-7', title: 'Ada replied again', receivedAt: 5 });
    });

    expect(id).toBe('srv-7');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      title: 'Ada replied again',
      receivedAt: 5,
      readAt: expect.any(Number),
    });
    expect(server.rows.size).toBe(1);
    expect(server.rows.get('srv-7')?.readAt).toEqual(expect.any(Number));
  });

  it('sorts an older server item below newer ones', async () => {
    const server = createServerStore([serverItem('srv-new', { receivedAt: 10 })]);
    const { result } = renderWithStore(server.store);
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      await result.current.add({ id: 'srv-old', title: 'Old', receivedAt: 3 });
    });

    expect(result.current.items.map((item) => item.id)).toEqual(['srv-new', 'srv-old']);
  });
});

describe('useInbox writes', () => {
  it('reaches the store in the order they were made', async () => {
    const calls: string[] = [];
    let openAdd = () => {};
    const store: InboxStore = {
      list: async () => [],
      add: (item) => {
        calls.push(`add ${item.id}`);

        return new Promise((resolve) => {
          openAdd = resolve;
        });
      },
      markRead: async (id) => {
        calls.push(`markRead ${id}`);
      },
      markAllRead: async () => {},
      remove: async () => {},
      clear: async () => {},
    };

    const { result } = renderWithStore(store);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let added: Promise<string | null> = Promise.resolve(null);
    let read: Promise<void> = Promise.resolve();
    await act(async () => {
      added = result.current.add({ id: 'srv-1', title: 'Ada replied' });
      read = result.current.markRead('srv-1');
    });

    expect(calls).toEqual(['add srv-1']);

    await act(async () => {
      openAdd();
      await Promise.all([added, read]);
    });

    expect(calls).toEqual(['add srv-1', 'markRead srv-1']);
  });

  it('marks all read in a single store call', async () => {
    const server = createServerStore([serverItem('srv-1'), serverItem('srv-2')]);
    const markAllRead = vi.fn(async () => {});
    const markRead = vi.spyOn(server.store, 'markRead');

    const { result } = renderWithStore({ ...server.store, markAllRead });
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(markAllRead).toHaveBeenCalledWith(expect.any(Number));
    expect(markRead).not.toHaveBeenCalled();
    expect(result.current.unread).toBe(0);
  });

  it('holds the state to the limit the store keeps', async () => {
    const server = createServerStore([]);
    const { result } = renderWithStore({ ...server.store, limit: 2 });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.add({ title: 'a', receivedAt: 1 });
      await result.current.add({ title: 'b', receivedAt: 2 });
      await result.current.add({ title: 'c', receivedAt: 3 });
    });

    expect(result.current.items.map((item) => item.title)).toEqual(['c', 'b']);
  });

  it('undoes a change the store refuses, without rejecting', async () => {
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = createServerStore([serverItem('srv-1')]);
    const store: InboxStore = {
      ...server.store,
      markRead: () => Promise.reject(new Error('offline')),
    };

    const { result } = renderWithStore(store);
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => {
      await expect(result.current.markRead('srv-1')).resolves.toBeUndefined();
    });

    await waitFor(() => expect(result.current.unread).toBe(1));
    expect(onError).toHaveBeenCalledWith(
      '[react-use-notifications-ui] could not save the inbox, undoing the change',
      expect.any(Error),
    );
    onError.mockRestore();
  });

  it('undoes the change even when the store cannot be read either', async () => {
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = createServerStore([]);
    const store: InboxStore = {
      ...server.store,
      list: () => Promise.reject(new Error('offline')),
      markRead: () => Promise.reject(new Error('offline')),
    };

    const { result } = renderWithStore(store, [serverItem('srv-1')]);
    await waitFor(() => expect(result.current.loadFailed).toBe(true));

    await act(async () => {
      await result.current.markRead('srv-1');
    });

    expect(result.current.unread).toBe(1);
    onError.mockRestore();
  });

  it('answers null for an item the store refused to save', async () => {
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = createServerStore([]);
    const store: InboxStore = {
      ...server.store,
      add: () => Promise.reject(new Error('offline')),
    };

    const { result } = renderWithStore(store);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let id: string | null = 'unset';
    await act(async () => {
      id = await result.current.add({ title: 'Ada replied' });
    });

    expect(id).toBeNull();
    await waitFor(() => expect(result.current.items).toHaveLength(0));
    onError.mockRestore();
  });

  it('reports a failed load instead of passing it off as empty', async () => {
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = createServerStore([]);
    const store: InboxStore = {
      ...server.store,
      list: () => Promise.reject(new Error('offline')),
    };

    const { result } = renderWithStore(store);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadFailed).toBe(true);
    expect(onError).toHaveBeenCalled();
    onError.mockRestore();
  });
});

describe('NotificationList', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('marks an item read when it is clicked, then hands it over', async () => {
    const onSelect = vi.fn();

    const Harness = () => {
      const { add, unread } = useInbox();

      return (
        <>
          <button type="button" onClick={() => void add({ title: 'Ada replied', href: '/a' })}>
            seed
          </button>
          <span data-testid="unread">{unread}</span>
          <NotificationList onSelect={onSelect} />
        </>
      );
    };

    render(
      <InboxProvider store={localStorageStore()}>
        <Harness />
      </InboxProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'seed' }).click();
    });

    expect(screen.getByTestId('unread')).toHaveTextContent('1');

    await act(async () => {
      screen.getByRole('button', { name: /Ada replied/ }).click();
    });

    expect(screen.getByTestId('unread')).toHaveTextContent('0');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ href: '/a' }));
  });

  it('shows the empty label with nothing to list', async () => {
    render(
      <InboxProvider store={localStorageStore()}>
        <NotificationList emptyLabel="All caught up" />
      </InboxProvider>,
    );

    await waitFor(() => expect(screen.getByText('All caught up')).toBeInTheDocument());
  });
});
