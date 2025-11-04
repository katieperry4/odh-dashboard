import type { Extension, CodeRef } from '@openshift/dynamic-plugin-sdk';
import type { InitialWizardFormData } from '@odh-dashboard/model-serving/types/form-data';

export type ExternalFormDataExtension = Extension<
  'model-serving.external/extract-form-data',
  {
    extractFormData: CodeRef<
      (modelUri: string, modelName: string) => InitialWizardFormData | null
    >;
  }
>;

export const isExternalFormDataExtension = (
  extension: Extension,
): extension is ExternalFormDataExtension =>
  extension.type === 'model-serving.external/extract-form-data';

  export type NavigateToWizardExtension = Extension<
  'model-serving.deployment/navigate-wizard',
  {
    useNavigateToWizard: CodeRef<
      () => (initialData?: InitialWizardFormData, projectName?: string) => void
    >;
  }
>;

export const isNavigateToWizardExtension = (
  extension: Extension,
): extension is NavigateToWizardExtension =>
  extension.type === 'model-serving.deployment/navigate-wizard';