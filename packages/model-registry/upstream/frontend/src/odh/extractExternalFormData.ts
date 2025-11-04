import { ServingRuntimeModelType } from '@odh-dashboard/internal/types';
import type { InitialWizardFormData } from '@odh-dashboard/model-serving/types/form-data';
import { ModelLocationType } from '@odh-dashboard/model-serving/types/form-data';

export const extractExternalFormData = (
  modelUri: string,
  modelName: string,
): InitialWizardFormData | null => {
  if (!modelUri) return null;

  return {
    modelLocationData: {
      type: ModelLocationType.NEW,
      fieldValues: {
        URI: modelUri,
      },
      additionalFields: {},
      disableInputFields: true,
    },
    createConnectionData: {
        saveConnection: false,
        hideFields: true,
    },
    modelTypeField: ServingRuntimeModelType.GENERATIVE, 
    k8sNameDesc: {
      name: modelName,
      k8sName: {
        value: modelName,
        state: {
          immutable: false,
          invalidCharacters: false,
          invalidLength: false,
          maxLength: 253,
          touched: false,
        },
      },
      description: '',
    },
  };
};