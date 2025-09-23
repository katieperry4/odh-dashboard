import React from 'react';
import { z } from 'zod';
import { Form } from '@patternfly/react-core';
import { useZodFormValidation } from '@odh-dashboard/internal/hooks/useZodFormValidation';
import { Connection } from '@odh-dashboard/internal/concepts/connectionTypes/types';
import { modelTypeSelectFieldSchema, ModelTypeSelectField } from '../fields/ModelTypeSelectField';
import { UseModelDeploymentWizardState } from '../useDeploymentWizard';
import { ModelLocationSelectField } from '../fields/ModelLocationSelectField';
import { isValidModelLocationData } from '../fields/ModelLocationInputFields';
import { ModelLocationData } from '../fields/modelLocationFields/types';
import {
  createConnectionDataSchema,
  CreateConnectionInputFields,
} from '../fields/CreateConnectionInputFields';

// Schema
export const modelSourceStepSchema = z.object({
  modelType: modelTypeSelectFieldSchema,
  modelLocationData: z.custom<ModelLocationData>((val) => {
    if (!val) return false;
    return isValidModelLocationData(val.type, val);
  }),
  createConnectionData: createConnectionDataSchema,
});

export type ModelSourceStepData = z.infer<typeof modelSourceStepSchema>;

type ModelSourceStepProps = {
  wizardState: UseModelDeploymentWizardState;
  validation: ReturnType<typeof useZodFormValidation<ModelSourceStepData>>;
  connections: Connection[];
  selectedConnection: Connection | undefined;
  setSelectedConnection: (connection: Connection | undefined) => void;
};

export const ModelSourceStepContent: React.FC<ModelSourceStepProps> = ({
  wizardState,
  validation,
  connections,
  selectedConnection,
  setSelectedConnection,
}) => {
  return (
    <Form>
      <ModelLocationSelectField
        modelLocation={wizardState.state.modelLocationData.data?.type}
        validationProps={validation.getFieldValidationProps(['modelLocation', 'modelLocationData'])}
        validationIssues={validation.getFieldValidation(['modelLocation', 'modelLocationData'])}
        project={wizardState.state.modelLocationData.project}
        connections={connections}
        selectedConnection={selectedConnection}
        modelLocationData={wizardState.state.modelLocationData.data}
        setSelectedConnection={setSelectedConnection}
        setModelLocationData={wizardState.state.modelLocationData.setData}
        resetModelLocationData={() => wizardState.state.modelLocationData.setData(undefined)}
      />
      <CreateConnectionInputFields
        createConnectionData={wizardState.state.createConnectionData.data}
        setCreateConnectionData={wizardState.state.createConnectionData.setData}
        project={wizardState.state.modelLocationData.project}
        modelLocationData={wizardState.state.modelLocationData.data}
      />
      <ModelTypeSelectField
        modelType={wizardState.state.modelType.data}
        setModelType={wizardState.state.modelType.setData}
        validationProps={validation.getFieldValidationProps(['modelType'])}
        validationIssues={validation.getFieldValidation(['modelType'])}
      />
    </Form>
  );
};
