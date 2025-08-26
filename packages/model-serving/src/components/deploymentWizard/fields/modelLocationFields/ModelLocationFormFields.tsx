import * as React from 'react';
import ConnectionTypeDataFormField from '@odh-dashboard/internal/concepts/connectionTypes/fields/ConnectionTypeDataFormField';
import DataFormFieldGroup from '@odh-dashboard/internal/concepts/connectionTypes/fields/DataFormFieldGroup';
import SectionFormField from '@odh-dashboard/internal/concepts/connectionTypes/fields/SectionFormField';
import {
  ConnectionTypeDataField,
  ConnectionTypeField,
  ConnectionTypeFieldType,
  ConnectionTypeValueType,
  SectionField,
} from '@odh-dashboard/internal/concepts/connectionTypes/types';
import { ModelLocationData, ModelLocationType } from './types';

type Props = {
  fields?: ConnectionTypeField[];
  isPreview?: boolean;
  //modelLocationData?: ModelLocationData;
  setModelLocationData?: (data: ModelLocationData | undefined) => void;
  connectionType: string;
};

type FieldGroup = {
  section: SectionField | undefined;
  fields: ConnectionTypeDataField[];
};

const ConnectionTypeFormFields: React.FC<Props> = ({
  fields,
  isPreview,
  //modelLocationData,
  setModelLocationData,
  connectionType,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fieldValues, setFieldValues] = React.useState<Record<string, any>>({});

  const handleFieldChange = (field: ConnectionTypeDataField, value: ConnectionTypeValueType) => {
    setFieldValues((prev) => {
      const newFieldValues = { ...prev, [field.envVar]: value };

      // Map to typed structure with the updated values
      const typedData = mapFieldValuesToLocationData(newFieldValues, connectionType);

      setModelLocationData?.(typedData);

      return newFieldValues;
    });
  };

  const mapFieldValuesToLocationData = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: Record<string, any>,
    type: string,
  ): ModelLocationData => {
    switch (type) {
      case 'uri-v1':
        return {
          type: ModelLocationType.URI,
          uri: String(values.URI || ''),
        };
      case 's3':
        return {
          type: ModelLocationType.S3,
          accessKey: String(values.AWS_ACCESS_KEY_ID || ''),
          secretKey: String(values.AWS_SECRET_ACCESS_KEY || ''),
          endpoint: String(values.AWS_S3_ENDPOINT || ''),
          bucket: String(values.AWS_S3_BUCKET || ''),
          path: String(values.AWS_S3_FOLDER_PATH || ''),
        };
      case 'oci-v1':
        return {
          type: ModelLocationType.OCI,
          secretDetails: String(values.OCI_SECRET_DETAILS || ''),
          registryHost: String(values.OCI_REGISTRY_HOST || ''),
          modelUri: String(values.OCI_MODEL_URI || ''),
        };
      default:
        return {
          type: ModelLocationType.URI,
          uri: '',
        };
    }
  };

  const getFieldValue = (fieldName: string) => {
    return fieldValues[fieldName] || '';
  };

  const fieldGroups = React.useMemo(
    () =>
      fields?.reduce<FieldGroup[]>((acc, field) => {
        if (field.type === ConnectionTypeFieldType.Section) {
          acc.push({ section: field, fields: [] });
        } else if (acc.length === 0) {
          acc.push({ section: undefined, fields: [field] });
        } else {
          acc[acc.length - 1].fields.push(field);
        }
        return acc;
      }, []),
    [fields],
  );

  const renderDataFields = (dataFields: ConnectionTypeDataField[]) =>
    dataFields.map((field, i) => {
      const id = `field-${field.envVar}`;
      return (
        <DataFormFieldGroup key={i} field={field} id={id}>
          <ConnectionTypeDataFormField
            id={id}
            field={field}
            mode={isPreview ? 'preview' : 'instance'}
            onChange={(v) => handleFieldChange(field, v)}
            value={getFieldValue(field.envVar)}
            data-testid={`field ${field.envVar}`}
          />
        </DataFormFieldGroup>
      );
    });

  return (
    <>
      {fieldGroups?.map((fieldGroup, i) =>
        fieldGroup.section ? (
          <SectionFormField field={fieldGroup.section} key={i} data-testid="fields-section">
            {renderDataFields(fieldGroup.fields)}
          </SectionFormField>
        ) : (
          <React.Fragment key={i}>{renderDataFields(fieldGroup.fields)}</React.Fragment>
        ),
      )}
    </>
  );
};

export default React.memo(ConnectionTypeFormFields);
