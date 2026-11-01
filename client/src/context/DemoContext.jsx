import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setDemoHeaders } from '../services/api.js';
import { metaApi } from '../services/resources.js';

const STORAGE_KEY = 'skillbridge.demoSession';

export const ROLE_LABELS = { hr: 'HR / Admin', manager: 'Manager', employee: 'Employee' };

// What each demo role can do in the UI. The API enforces the same rules.
const PERMISSIONS = {
  hr: ['employees.view', 'employees.manage', 'competencies.manage', 'assess', 'training.manage', 'assign', 'career.manage', 'analytics.view'],
  manager: ['employees.view', 'assess', 'assign', 'career.manage', 'analytics.view'],
  employee: [],
};

function readStored() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value?.role && value?.employeeId ? value : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts for this tab only.
  }
}

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = readStored();
    setDemoHeaders(stored || {});
    return stored;
  });
  const [personas, setPersonas] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const choose = useCallback((persona) => {
    const next = persona
      ? {
          role: persona.role,
          employeeId: persona.employee._id,
          name: persona.employee.name,
          jobTitle: persona.employee.jobTitle,
          department: persona.employee.department,
        }
      : null;
    setDemoHeaders(next || {});
    writeStored(next);
    setSession(next);
  }, []);

  const loadPersonas = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await metaApi.personas();
      setPersonas(list);
      // Re-running the seed creates new ids, so re-link the stored role to its current persona.
      const stored = readStored();
      if (stored) {
        const match = list.find((item) => item.role === stored.role && item.employee);
        if (!match) choose(null);
        else if (match.employee._id !== stored.employeeId) choose(match);
      }
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [choose]);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  const value = useMemo(() => {
    const role = session?.role || null;
    return {
      session,
      role,
      roleLabel: role ? ROLE_LABELS[role] : '',
      personas,
      status,
      retry: loadPersonas,
      choose,
      signOut: () => choose(null),
      can: (permission) => Boolean(role && PERMISSIONS[role].includes(permission)),
      isSelf: (employeeId) => Boolean(session && String(employeeId) === String(session.employeeId)),
      // Managers act on their direct reports; HR acts on everyone.
      canManage: (employee) => {
        if (role === 'hr') return true;
        if (role !== 'manager' || !employee) return false;
        const managerId = employee.manager?._id || employee.manager;
        return String(managerId) === String(session.employeeId);
      },
    };
  }, [session, personas, status, loadPersonas, choose]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used inside <DemoProvider>');
  return context;
}
