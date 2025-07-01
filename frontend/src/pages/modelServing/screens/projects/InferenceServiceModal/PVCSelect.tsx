import React from 'react';
import { Alert, FormGroup, Label, Stack, StackItem } from '@patternfly/react-core';
import TypeaheadSelect, { TypeaheadSelectOption } from '#~/components/TypeaheadSelect';
import { PersistentVolumeClaimKind } from '#~/k8sTypes';
import { getDisplayNameFromK8sResource } from '#~/concepts/k8s/utils';
import {
  getModelServingPVCAccessMode,
  getModelServingPVCAnnotations,
} from '#~/pages/modelServing/utils';
import { PVCAccessMode } from '#~/types';
import { PVCFields } from './PVCFields';

type PvcSelectProps = {
  pvcs?: PersistentVolumeClaimKind[];
  selectedPVC?: PersistentVolumeClaimKind;
  onSelect: (selection: PersistentVolumeClaimKind) => void;
  setModelUri: (uri: string) => void;
  setIsConnectionValid: (isValid: boolean) => void;
  modelUri?: string;
};
export const PvcSelect: React.FC<PvcSelectProps> = ({
  pvcs,
  selectedPVC,
  onSelect,
  setModelUri,
  setIsConnectionValid,
  modelUri,
}) => {
  const options: TypeaheadSelectOption[] = React.useMemo(
    () =>
      pvcs?.map((pvc) => {
        const displayName = getDisplayNameFromK8sResource(pvc);
        const { modelPath, modelName } = getModelServingPVCAnnotations(pvc);
        const isModelServingPVC = !!modelPath || !!modelName;
        return {
          content: displayName,
          value: pvc.metadata.name,
          dropdownLabel: (
            <>
              {isModelServingPVC && (
                <Label isCompact color="green">
                  {modelName ?? 'unknown model'}
                </Label>
              )}
            </>
          ),
          isSelected: selectedPVC?.metadata.name === pvc.metadata.name,
        };
      }) || [],
    [pvcs, selectedPVC],
  );
  const accessMode = selectedPVC ? getModelServingPVCAccessMode(selectedPVC) : undefined;
  const { modelPath } = React.useMemo(() => {
    if (selectedPVC) {
      const { modelPath: selectedModelPath, modelName: selectedModelName } =
        getModelServingPVCAnnotations(selectedPVC);
      return {
        modelPath: selectedModelPath ?? undefined,
        modelName: selectedModelName ?? undefined,
      };
    }
    return { modelPath: undefined, modelName: undefined };
  }, [selectedPVC]);
  const isValidPVCUri = (uri: string): boolean => /^pvc:\/\/[a-z0-9-]+\/\S+$/.test(uri);

  React.useEffect(() => {
    setIsConnectionValid(!!selectedPVC && isValidPVCUri(modelUri ?? ''));
  }, [selectedPVC, modelPath, modelUri, setIsConnectionValid]);
  return (
    <FormGroup label="Cluster storage" isRequired>
      <Stack hasGutter>
        <StackItem>
          <TypeaheadSelect
            placeholder="Select existing storage"
            selectOptions={options}
            dataTestId="pvc-connection-selector"
            onSelect={(_, selection) => {
              const newlySelectedPVC = pvcs?.find((pvc) => pvc.metadata.name === selection);
              if (newlySelectedPVC) {
                onSelect(newlySelectedPVC);
              }
            }}
          />
        </StackItem>
        {selectedPVC && accessMode !== PVCAccessMode.READ_WRITE_MANY && (
          <StackItem>
            <Alert variant="warning" title="Warning" isInline>
              This cluster storage access mode is not ReadWriteMany.
            </Alert>
          </StackItem>
        )}
        {selectedPVC && (
          <StackItem>
            <PVCFields selectedPVC={selectedPVC} setModelUri={setModelUri} modelPath={modelPath} />
          </StackItem>
        )}
      </Stack>
    </FormGroup>
  );
};
