import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import {
  ConnectionTypeConfigMapObj,
  ConnectionTypeDataField,
  ConnectionTypeValueType,
  Connection,
} from '@odh-dashboard/internal/concepts/connectionTypes/types';
import {
  ModelServingCompatibleTypes,
  isModelServingCompatible,
  isConnectionTypeDataField,
  getModelServingConnectionTypeName,
  getModelServingCompatibility,
} from '@odh-dashboard/internal/concepts/connectionTypes/utils';
import ConnectionTypeFormFields from '@odh-dashboard/internal/concepts/connectionTypes/fields/ConnectionTypeFormFields';
import ConnectionOciPathField from '@odh-dashboard/internal/pages/modelServing/screens/projects/InferenceServiceModal/ConnectionOciPathField';
import ConnectionS3FolderPathField from '@odh-dashboard/internal/pages/modelServing/screens/projects/InferenceServiceModal/ConnectionS3FolderPathField';
import { ModelLocationData } from '../../types';

type Props = {
  setModelLocationData: (data: ModelLocationData | undefined) => void;
  modelLocationData?: ModelLocationData;
  connectionType?: ConnectionTypeConfigMapObj;
  connections?: Connection[];
  connectionTypeOptions?: ConnectionTypeConfigMapObj[];
};

const NewConnectionField: React.FC<Props> = ({
  setModelLocationData,
  modelLocationData,
  connectionType,
  connections,
  connectionTypeOptions,
}) => {
  const connection = connections?.find((c) => c.metadata.name === modelLocationData?.connection);
  const connectionValues = React.useMemo(() => {
    if (!modelLocationData) return {};
    return modelLocationData.fieldValues;
  }, [modelLocationData]);

  const handleFieldChange = (field: ConnectionTypeDataField, value: ConnectionTypeValueType) => {
    if (!modelLocationData) return;
    setModelLocationData({
      ...modelLocationData,
      fieldValues: {
        ...modelLocationData.fieldValues,
        [field.envVar]: value,
      },
    });
  };
  const renderAdditionalFields = () => {
    if (!connectionType && !connection) {
      return null;
    }
    if (
      connection &&
      isModelServingCompatible(connection, ModelServingCompatibleTypes.S3ObjectStorage)
    ) {
      return (
        <ConnectionS3FolderPathField
          folderPath={modelLocationData?.additionalFields.modelPath || ''}
          setFolderPath={(path) => {
            if (!modelLocationData) return;
            setModelLocationData({
              ...modelLocationData,
              additionalFields: {
                ...modelLocationData.additionalFields,
                modelPath: path,
              },
            });
          }}
        />
      );
    }

    if (connection && isModelServingCompatible(connection, ModelServingCompatibleTypes.OCI)) {
      return (
        <ConnectionOciPathField
          ociHost={String(modelLocationData?.fieldValues.OCI_HOST || '')}
          modelUri={modelLocationData?.additionalFields.modelUri || ''}
          setModelUri={(uri) => {
            if (!modelLocationData) return;
            setModelLocationData({
              ...modelLocationData,
              additionalFields: {
                ...modelLocationData.additionalFields,
                modelUri: uri || '',
              },
            });
          }}
          isNewConnection
        />
      );
    }

    return null;
  };
  const fields = React.useMemo(() => {
    if (!connectionType) {
      if (connection?.data) {
        const compatibleType = getModelServingCompatibility(connection)[0];
        switch (compatibleType) {
          case ModelServingCompatibleTypes.OCI:
            return connectionTypeOptions?.find(
              (c) =>
                c.metadata.name ===
                getModelServingConnectionTypeName(ModelServingCompatibleTypes.OCI),
            )?.data?.fields;
          case ModelServingCompatibleTypes.S3ObjectStorage:
            return connectionTypeOptions?.find(
              (c) =>
                c.metadata.name ===
                getModelServingConnectionTypeName(ModelServingCompatibleTypes.S3ObjectStorage),
            )?.data?.fields;
          case ModelServingCompatibleTypes.URI:
            return connectionTypeOptions?.find(
              (c) =>
                c.metadata.name ===
                getModelServingConnectionTypeName(ModelServingCompatibleTypes.URI),
            )?.data?.fields;
          default:
            return [];
        }
      }
      return [];
    }
    if (isModelServingCompatible(connectionType, ModelServingCompatibleTypes.S3ObjectStorage)) {
      return connectionType.data?.fields?.map((field) => {
        // Force bucket field to be required
        if (isConnectionTypeDataField(field) && field.envVar === 'AWS_S3_BUCKET') {
          return {
            ...field,
            required: true,
          };
        }
        return field;
      });
    }
    return connectionType.data?.fields;
  }, [connectionType, connections, modelLocationData?.connection]);

  return (
    <FormGroup>
      <ConnectionTypeFormFields
        fields={fields}
        isPreview={false}
        isDisabled={modelLocationData?.disableInputFields}
        onChange={handleFieldChange}
        connectionValues={connectionValues}
      />
      {renderAdditionalFields()}
    </FormGroup>
  );
};

export default NewConnectionField;
