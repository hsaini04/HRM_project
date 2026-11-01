import { createContext, useContext } from 'react';
import { useApi } from '../hooks/useApi.js';
import { metaApi } from '../services/resources.js';

// Reference data (departments, roles, enums, proficiency scale) served by the API so the
// UI never hard-codes values that the backend validates.
const MetaContext = createContext(null);

export function MetaProvider({ children }) {
  const { data, error, loading, reload } = useApi(() => metaApi.get(), []);
  return <MetaContext.Provider value={{ meta: data, error, loading, reload }}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  const context = useContext(MetaContext);
  if (!context) throw new Error('useMeta must be used inside <MetaProvider>');
  return context;
}
