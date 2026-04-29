export const TEMP_UUID = 'dbf9f839-b57e-415f-8b5b-9213524ed827';

export const getUserUuid = () => {
  if (typeof window === 'undefined') {
    return TEMP_UUID;
  }

  const params = new URLSearchParams(window.location.search);
  const uuidFromQuery = params.get('uuid');

  return uuidFromQuery && uuidFromQuery.trim() ? uuidFromQuery.trim() : TEMP_UUID;
};
