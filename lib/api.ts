const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-access-token');
}

function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('sb-access-token', token);
  } else {
    localStorage.removeItem('sb-access-token');
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  const token = getToken();
  if (!token) return null;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setToken(null);
        cachedAuthState = { user: null, session: null };
        emitAuthEvent('SIGNED_OUT', null);
        return null;
      }
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        cachedAuthState = {
          user: data.user || cachedAuthState.user,
          session: { user: data.user || cachedAuthState.user, access_token: data.token, refresh_token: '' },
        };
        emitAuthEvent('TOKEN_REFRESHED', cachedAuthState.session);
        return data.token;
      }
      return null;
    } catch {
      setToken(null);
      cachedAuthState = { user: null, session: null };
      emitAuthEvent('SIGNED_OUT', null);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    return { error: body.error || body.message || `HTTP ${res.status}` };
  }

  return await res.json();
}

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';
type AuthCallback = (event: AuthEvent, session: ApiSession | null) => void;
const authListeners: AuthCallback[] = [];

function emitAuthEvent(event: AuthEvent, session: ApiSession | null) {
  authListeners.forEach((cb) => cb(event, session));
}

export interface ApiUser {
  id: string;
  email: string;
  name?: string;
  onboarding_completed?: boolean;
  has_sample_data?: boolean;
}

export interface ApiSession {
  user: ApiUser;
  access_token: string;
  refresh_token: string;
}

interface AuthState {
  user: ApiUser | null;
  session: ApiSession | null;
}

let cachedAuthState: AuthState = { user: null, session: null };

async function loadCachedState(): Promise<AuthState> {
  const token = getToken();
  if (!token) {
    cachedAuthState = { user: null, session: null };
    return cachedAuthState;
  }

  const data = await apiFetch('/auth/session');
  if (data.user) {
    cachedAuthState = {
      user: data.user,
      session: { user: data.user, access_token: token, refresh_token: '' },
    };
  } else {
    setToken(null);
    cachedAuthState = { user: null, session: null };
  }
  return cachedAuthState;
}

class QueryBuilder {
  private table: string;
  private selectCols: string = '*';
  private filters: { column: string; op: string; value: any }[] = [];
  private orderCol?: string;
  private orderAsc: boolean = true;
  private limitN?: number;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols: string = '*') {
    this.selectCols = cols;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  then<TResult1 = any>(onfulfilled: (value: any) => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {
    return this.execute().then(onfulfilled);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const params = new URLSearchParams();
    params.set('select', this.selectCols);

    const eqFilters: string[] = [];
    const inFilters: Record<string, string> = {};

    for (const f of this.filters) {
      if (f.op === 'eq') {
        eqFilters.push(`${f.column}:${f.value}`);
      } else if (f.op === 'in') {
        inFilters[f.column] = (f.value as any[]).join(',');
      }
    }

    if (eqFilters.length > 0) {
      const first = eqFilters[0];
      const [col, val] = first.split(':');
      params.set('filter_field', col);
      params.set('filter_value', val);
    }

    for (const [col, vals] of Object.entries(inFilters)) {
      params.set('filter_field', col);
      params.set('filter_in', vals);
    }

    if (this.orderCol) {
      params.set('order', `${this.orderCol}:${this.orderAsc}`);
    }

    if (this.limitN) {
      params.set('limit', String(this.limitN));
    }

    if (this.isSingle) {
      params.set('single', 'true');
    }

    if (this.isMaybeSingle) {
      params.set('maybe_single', 'true');
    }

    const result = await apiFetch(`/${this.table}?${params.toString()}`);
    return { data: result.data, error: result.error || null };
  }

  insert(data: any) {
    return new InsertBuilder(this.table, data);
  }

  update(data: any) {
    return new UpdateBuilder(this.table, data, [...this.filters]);
  }

  delete() {
    return new DeleteBuilder(this.table, [...this.filters]);
  }
}

class InsertBuilder {
  private table: string;
  private data: any;

  constructor(table: string, data: any) {
    this.table = table;
    this.data = data;
  }

  select(_cols?: string) {
    return this.execute();
  }

  then<TResult1 = any>(onfulfilled: (value: any) => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {
    return this.execute().then(onfulfilled);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const result = await apiFetch(`/${this.table}`, {
      method: 'POST',
      body: JSON.stringify(this.data),
    });
    return { data: result.data, error: result.error || null };
  }
}

class UpdateBuilder {
  private table: string;
  private data: any;
  private filters: { column: string; op: string; value: any }[];

  constructor(table: string, data: any, filters: { column: string; op: string; value: any }[]) {
    this.table = table;
    this.data = data;
    this.filters = filters;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  select(_cols?: string) {
    return this.execute();
  }

  then<TResult1 = any>(onfulfilled: (value: any) => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {
    return this.execute().then(onfulfilled);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const params = new URLSearchParams();
    const eqFilter = this.filters.find((f) => f.op === 'eq');
    const inFilter = this.filters.find((f) => f.op === 'in');

    if (eqFilter) {
      params.set('filter_field', eqFilter.column);
      params.set('filter_value', String(eqFilter.value));
    } else if (inFilter) {
      params.set('filter_field', inFilter.column);
      params.set('filter_in', (inFilter.value as any[]).join(','));
    }

    const result = await apiFetch(`/${this.table}?${params.toString()}`, {
      method: 'PUT',
      body: JSON.stringify(this.data),
    });
    return { data: result.data, error: result.error || null };
  }
}

class DeleteBuilder {
  private table: string;
  private filters: { column: string; op: string; value: any }[];

  constructor(table: string, filters: { column: string; op: string; value: any }[]) {
    this.table = table;
    this.filters = filters;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: values });
    return this;
  }

  then<TResult1 = any>(onfulfilled: (value: any) => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {
    return this.execute().then(onfulfilled);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    const params = new URLSearchParams();
    const eqFilter = this.filters.find((f) => f.op === 'eq');
    const inFilter = this.filters.find((f) => f.op === 'in');

    if (eqFilter) {
      params.set('filter_field', eqFilter.column);
      params.set('filter_value', String(eqFilter.value));
    } else if (inFilter) {
      params.set('filter_field', inFilter.column);
      params.set('filter_in', (inFilter.value as any[]).join(','));
    }

    const result = await apiFetch(`/${this.table}?${params.toString()}`, {
      method: 'DELETE',
    });
    return { data: result.data || result.success, error: result.error || null };
  }
}

const authApi = {
  async signUp({ email, password, name }: { email: string; password: string; name?: string }) {
    const result = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (result.error) return { data: null, error: { message: result.error } };
    if (result.token) {
      setToken(result.token);
      cachedAuthState = {
        user: result.user,
        session: { user: result.user, access_token: result.token, refresh_token: '' },
      };
      emitAuthEvent('SIGNED_IN', cachedAuthState.session);
    }
    return { data: result, error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const result = await apiFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.error) return { data: null, error: { message: result.error } };
    if (result.token) {
      setToken(result.token);
      cachedAuthState = {
        user: result.user,
        session: { user: result.user, access_token: result.token, refresh_token: '' },
      };
      emitAuthEvent('SIGNED_IN', cachedAuthState.session);
    }
    return { data: result, error: null };
  },

  async signOut() {
    await apiFetch('/auth/signout', { method: 'POST' });
    setToken(null);
    cachedAuthState = { user: null, session: null };
    emitAuthEvent('SIGNED_OUT', null);
  },

  async getSession() {
    if (!getToken()) {
      return { data: { session: null }, error: null };
    }
    const state = await loadCachedState();
    return { data: { session: state.session }, error: null };
  },

  async getUser() {
    const state = await loadCachedState();
    return { data: { user: state.user }, error: null };
  },

  onAuthStateChange(callback: AuthCallback) {
    authListeners.push(callback);
    loadCachedState().then((state) => {
      callback(state.session ? 'SIGNED_IN' : 'SIGNED_OUT', state.session);
    });
    return {
      data: { subscription: { unsubscribe: () => {
        const idx = authListeners.indexOf(callback);
        if (idx >= 0) authListeners.splice(idx, 1);
      } } },
    };
  },
};

const onboardingApi = {
  async getStatus(): Promise<{ onboarding_completed: boolean; has_sample_data: boolean }> {
    const result = await apiFetch('/auth/onboarding');
    if (result.error) return { onboarding_completed: false, has_sample_data: false };
    return {
      onboarding_completed: result.onboarding_completed === true,
      has_sample_data: result.has_sample_data === true,
    };
  },

  async markComplete(): Promise<boolean> {
    const result = await apiFetch('/auth/onboarding/complete', { method: 'POST' });
    return !result.error;
  },
};

const seedApi = {
  async getTemplates() {
    const result = await apiFetch('/seed/templates');
    if (result.error) return { templates: [], error: result.error };
    return { templates: result.templates || [], error: null };
  },

  async getTemplate(id?: string) {
    const path = id ? `/seed/template?id=${encodeURIComponent(id)}` : '/seed/template';
    const result = await apiFetch(path);
    if (result.error) return { template: null, error: result.error };
    return { template: result.template || null, error: null };
  },

  async importSampleData(templateId?: string) {
    const result = await apiFetch('/seed', {
      method: 'POST',
      body: JSON.stringify({ template_id: templateId }),
    });
    if (result.error) return { success: false, error: result.error };
    return { success: true, error: null };
  },
};

const supabaseCompat = {
  auth: authApi,
  from(table: string) {
    return new QueryBuilder(table);
  },
};

export { supabaseCompat as supabase };
export { onboardingApi as onboarding };
export { seedApi as seed };
export { apiFetch };
