import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDeploymentWizardRoute } from './utils';
import type { InitialWizardFormData } from './types';

/**
 * Hook provided via extension point for other packages to navigate to deployment wizard
 * with initial data without importing from model-serving package
 */
export const useNavigateToWizardFromExtension = (): ((
  initialData?: InitialWizardFormData,
  projectName?: string,
) => void) => {
  const navigate = useNavigate();
  const location = useLocation();

  return React.useCallback(
    (initialData?: InitialWizardFormData, projectName?: string) => {
      let returnRoute = location.pathname;
      if (returnRoute.includes('projects')) {
        returnRoute += '?section=model-server';
      }

      navigate(getDeploymentWizardRoute(), {
        state: {
          initialData,
          returnRoute,
          projectName,
        },
      });
    },
    [navigate, location.pathname],
  );
};
