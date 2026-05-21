// manage uuid!

const SESSION_KEY = 'vbk_user_uuid';

export const setSession = (uuid) => sessionStorage.setItem(SESSION_KEY, uuid);

export const getSession = () => sessionStorage.getItem(SESSION_KEY);

export const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

export const hasSession = () => Boolean(getSession());
