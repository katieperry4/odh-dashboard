import * as React from 'react';
import { ConnectionTypeConfigMapObj } from '@odh-dashboard/internal/concepts/connectionTypes/types';
import { ModelLocationType, ModelLocationData } from './types';
import ModelLocationFormFields from './ModelLocationFormFields';
import { ModelLocationFieldData } from '../ModelLocationSelectField';

type NewConnectionFieldProps = {
  modelLocationType: (typeof ModelLocationType)[keyof typeof ModelLocationType];
  connectionTypes: ConnectionTypeConfigMapObj[];
  setModelLocationData?: (data: ModelLocationData | undefined) => void;
};

export const NewConnectionField: React.FC<NewConnectionFieldProps> = ({
  modelLocationType,
  connectionTypes,
  setModelLocationData,
}) => {
  // Map location type to connection type
  const getConnectionType = (locationType: ModelLocationFieldData) => {
    switch (locationType) {
      case ModelLocationType.S3:
        return connectionTypes.find(
          (ct) => ct.metadata.name === 's3' || ct.metadata.name.includes('aws'),
        );
      case ModelLocationType.OCI:
        return connectionTypes.find((ct) => ct.metadata.name === 'oci-v1');
      case ModelLocationType.URI:
        return connectionTypes.find((ct) => ct.metadata.name === 'uri-v1');
      default:
        return undefined;
    }
  };

  const connectionType = getConnectionType(modelLocationType);

  if (!connectionType) {
    return <div>Connection type not found for {modelLocationType}</div>;
  }

  // Just render the form fields directly
  return (
    <>
      <ModelLocationFormFields
        fields={connectionType.data?.fields}
        isPreview={false}
        setModelLocationData={setModelLocationData}
        connectionType={connectionType.metadata.name}
      />
    </>
  );
};
