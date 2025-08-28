import React from 'react';
import { PvcSelect } from '@odh-dashboard/internal/pages/modelServing/screens/projects/InferenceServiceModal/PVCSelect';
import type { LabeledConnection } from '@odh-dashboard/internal/pages/modelServing/screens/types';
import {
  Connection,
  ConnectionTypeConfigMapObj,
} from '@odh-dashboard/internal/concepts/connectionTypes/types';
import {
  isModelServingCompatible,
  ModelServingCompatibleTypes,
} from '@odh-dashboard/internal/concepts/connectionTypes/utils';
import { OCIAlert } from './modelLocationFields/OCIAlert';
import { ExistingConnectionField } from './modelLocationFields/ExistingConnectionField';
import { ModelLocationFieldData } from './ModelLocationSelectField';
import {
  ConnectionTypeRefs,
  ModelLocationData,
  ModelLocationType,
} from './modelLocationFields/types';
import { NewConnectionField } from './modelLocationFields/NewConnectionField';

// In ModelLocationInputFields.tsx, change the hook return type:
export const useModelLocationData = (
  existingData?: ModelLocationData,
): [ModelLocationData | undefined, (data: ModelLocationData | undefined) => void] => {
  const [modelLocationData, setModelLocationData] = React.useState<ModelLocationData | undefined>(
    existingData,
  );
  return [modelLocationData, setModelLocationData];
};

type ModelLocationInputFieldsProps = {
  modelLocation: ModelLocationFieldData;
  connections: LabeledConnection[];
  connectionTypes: ConnectionTypeConfigMapObj[];
  selectedConnection: Connection | undefined;
  setSelectedConnection: (connection: Connection) => void;
  selectedConnectionType: ConnectionTypeConfigMapObj | undefined;
  setModelLocationData?: (data: ModelLocationData | undefined) => void;
  resetModelLocationData: () => void;
  modelLocationData?: ModelLocationData;
};

export const ModelLocationInputFields: React.FC<ModelLocationInputFieldsProps> = ({
  modelLocation,
  connections,
  connectionTypes,
  selectedConnection,
  setSelectedConnection,
  selectedConnectionType,
  setModelLocationData,
  resetModelLocationData,
  modelLocationData,
}) => {
  if (modelLocation === ModelLocationType.EXISTING) {
    return (
      <ExistingConnectionField
        connectionTypes={connectionTypes}
        projectConnections={connections}
        onSelect={(connection) => {
          setSelectedConnection(connection);
        }}
        selectedConnection={selectedConnection}
        selectedConnectionType={selectedConnectionType}
        setModelLocationData={setModelLocationData}
        resetModelLocationData={resetModelLocationData}
        modelLocationData={modelLocationData}
      >
        {selectedConnectionType &&
          isModelServingCompatible(selectedConnectionType, ModelServingCompatibleTypes.OCI) && (
            <OCIAlert />
          )}
      </ExistingConnectionField>
    );
  }
  if (modelLocation === ModelLocationType.URI) {
    const uriConnectionType = connectionTypes.find(
      (ct) => ct.metadata.name === ConnectionTypeRefs.URI,
    );
    if (uriConnectionType) {
      return (
        <NewConnectionField
          modelLocationType={ModelLocationType.URI}
          connectionTypes={connectionTypes}
          setModelLocationData={setModelLocationData}
        />
      );
    }
  }
  // Make a new OCI connection
  if (modelLocation === ModelLocationType.OCI) {
    const ociConnectionType = connectionTypes.find(
      (ct) => ct.metadata.name === ConnectionTypeRefs.OCI,
    );
    if (ociConnectionType) {
      return (
        <NewConnectionField
          modelLocationType={ModelLocationType.OCI}
          connectionTypes={connectionTypes}
          setModelLocationData={setModelLocationData}
        />
      );
    }
  }
  // Select a PVC to connect to
  if (modelLocation === ModelLocationType.PVC) {
    return (
      <div>
        <PvcSelect
          pvcs={[]}
          selectedPVC={undefined}
          onSelect={() => {
            // TODO: Implement
          }}
          setModelUri={() => {
            // TODO: Implement
          }}
          setIsConnectionValid={() => {
            // TODO: Implement
          }}
        />
      </div>
    );
  }
  if (modelLocation === ModelLocationType.S3) {
    const s3ConnectionType = connectionTypes.find(
      (ct) => ct.metadata.name === ConnectionTypeRefs.S3,
    );
    if (s3ConnectionType) {
      return (
        <NewConnectionField
          modelLocationType={ModelLocationType.S3}
          connectionTypes={connectionTypes}
          setModelLocationData={setModelLocationData}
        />
      );
    }
  }
  return <div>ModelLocationInputFields</div>;
};
