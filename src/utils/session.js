// manage uuid!

const SESSION_KEY = 'vbk_user_uuid';
const USER_KEY = 'vbk_active_user';

export const setSession = (uuid, userObj) => {
  sessionStorage.setItem(SESSION_KEY, uuid);
  if (userObj) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(userObj));
  }
};

export const getSession = () => sessionStorage.getItem(SESSION_KEY);

export const getActiveUser = () => {
  const user = sessionStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch (err) {
    return null;
  }
};

export const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const hasSession = () => Boolean(getSession());
