// manage uuid!

const SESSION_KEY = 'vbk_user_uuid';
const USER_KEY = 'vbk_active_user';

export const DEFAULT_USER = {
  uuid_de_usuario: 'dbf9f839-b57e-415f-8b5b-9213524ed827',
  nombre: 'Romina',
  apellido: 'Mendez'
};

export const setSession = (uuid, userObj) => {
  sessionStorage.setItem(SESSION_KEY, uuid);
  if (userObj) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(userObj));
  }
};

export const getSession = () => {
  const uuid = sessionStorage.getItem(SESSION_KEY);
  if (!uuid) {
    return DEFAULT_USER.uuid_de_usuario;
  }
  return uuid;
};

export const getActiveUser = () => {
  const user = sessionStorage.getItem(USER_KEY);
  if (!user) {
    return DEFAULT_USER;
  }
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

export const hasSession = () => Boolean(sessionStorage.getItem(SESSION_KEY));
