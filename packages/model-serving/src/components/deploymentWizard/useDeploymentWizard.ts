import {
  K8sNameDescriptionFieldData,
  K8sNameDescriptionFieldUpdateFunction,
} from '@odh-dashboard/internal/concepts/k8s/K8sNameDescriptionField/types';
import { useK8sNameDescriptionFieldData } from '@odh-dashboard/internal/concepts/k8s/K8sNameDescriptionField/K8sNameDescriptionField';
import { extractK8sNameDescriptionFieldData } from '@odh-dashboard/internal/concepts/k8s/K8sNameDescriptionField/utils';
import { ModelLocationData } from './fields/modelLocationFields/types';
import { ModelLocationFieldData, useModelLocationField } from './fields/ModelLocationSelectField';
import { useModelTypeField, type ModelTypeFieldData } from './fields/ModelTypeSelectField';
import { useModelLocationData } from './fields/ModelLocationInputFields';

export type ModelDeploymentWizardData = {
  modelTypeField?: ModelTypeFieldData;
  k8sNameDesc?: K8sNameDescriptionFieldData;
  modelLocationField?: ModelLocationFieldData;
  modelLocationData?: ModelLocationData;
  // Add more field handlers as needed
};

export type ModelDeploymentWizardDataHandlers = {
  setModelType: (data: ModelTypeFieldData) => void;
  setDeploymentName?: K8sNameDescriptionFieldUpdateFunction;
  setModelLocation: (data: ModelLocationFieldData) => void;
  setModelLocationData: (data: ModelLocationData | undefined) => void;
  resetModelLocationData: () => void;
};

export type UseModelDeploymentWizardState = {
  data: ModelDeploymentWizardData;
  handlers: ModelDeploymentWizardDataHandlers;
};

export const useModelDeploymentWizard = (
  existingData?: ModelDeploymentWizardData,
): UseModelDeploymentWizardState => {
  const [modelType, setModelType] = useModelTypeField(existingData?.modelTypeField);
  const { data: k8sNameDesc, onDataChange: setDeploymentName } = useK8sNameDescriptionFieldData({
    initialData: extractK8sNameDescriptionFieldData(existingData?.k8sNameDesc),
  });
  const [modelLocationField, setModelLocation] = useModelLocationField(
    existingData?.modelLocationField,
  );
  const [modelLocationData, setModelLocationData] = useModelLocationData(
    existingData?.modelLocationData,
  );
  const resetModelLocationData = () => setModelLocationData(undefined);
  return {
    data: {
      modelTypeField: modelType,
      modelLocationField,
      k8sNameDesc,
      modelLocationData,
    },
    handlers: {
      setModelType,
      setModelLocation,
      setDeploymentName,
      setModelLocationData,
      resetModelLocationData,
    },
  };
};
