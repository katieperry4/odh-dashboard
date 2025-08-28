import React from 'react';
import { z } from 'zod';
import { Form } from '@patternfly/react-core';
import { useZodFormValidation } from '@odh-dashboard/internal/hooks/useZodFormValidation';
import { ProjectKind } from '@odh-dashboard/internal/k8sTypes';
import { modelTypeSelectFieldSchema, ModelTypeSelectField } from '../fields/ModelTypeSelectField';
import { UseModelDeploymentWizardState } from '../useDeploymentWizard';
import {
  ModelLocationSelectField,
  modelLocationSelectFieldSchema,
} from '../fields/ModelLocationSelectField';

// Schema
export const modelSourceStepSchema = z.object({
  modelType: modelTypeSelectFieldSchema,
  modelLocation: modelLocationSelectFieldSchema,
});

export type ModelSourceStepData = z.infer<typeof modelSourceStepSchema>;

type ModelSourceStepProps = {
  wizardState: UseModelDeploymentWizardState;
  validation: ReturnType<typeof useZodFormValidation<ModelSourceStepData>>;
  project: ProjectKind | null;
};

export const ModelSourceStepContent: React.FC<ModelSourceStepProps> = ({
  wizardState,
  validation,
  project,
}) => {
  return (
    <Form>
      <ModelLocationSelectField
        modelLocation={wizardState.data.modelLocationField}
        setModelLocation={wizardState.handlers.setModelLocation}
        validationProps={validation.getFieldValidationProps(['modelLocation'])}
        validationIssues={validation.getFieldValidation(['modelLocation'])}
        project={project}
        setModelLocationData={wizardState.handlers.setModelLocationData}
        resetModelLocationData={wizardState.handlers.resetModelLocationData}
      />
      <ModelTypeSelectField
        modelType={wizardState.data.modelTypeField}
        setModelType={wizardState.handlers.setModelType}
        validationProps={validation.getFieldValidationProps(['modelType'])}
        validationIssues={validation.getFieldValidation(['modelType'])}
      />
    </Form>
  );
};
