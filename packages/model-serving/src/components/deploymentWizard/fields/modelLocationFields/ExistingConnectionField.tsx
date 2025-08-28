import React from 'react';
import { Flex, FlexItem, FormGroup, Label, Truncate } from '@patternfly/react-core';
import { LabeledConnection } from '@odh-dashboard/internal/pages/modelServing/screens/types';
import {
  getDescriptionFromK8sResource,
  getDisplayNameFromK8sResource,
  getResourceNameFromK8sResource,
} from '@odh-dashboard/internal/concepts/k8s/utils';
import TypeaheadSelect, {
  TypeaheadSelectOption,
} from '@odh-dashboard/internal/components/TypeaheadSelect';
import { ConnectionDetailsHelperText } from '@odh-dashboard/internal/concepts/connectionTypes/ConnectionDetailsHelperText';
import { getConnectionTypeDisplayName } from '@odh-dashboard/internal/concepts/connectionTypes/utils';
import {
  Connection,
  ConnectionTypeConfigMapObj,
} from '@odh-dashboard/internal/concepts/connectionTypes/types';
import S3ConnectionField from './S3ConnectionField';
import OCIConnectionField from './OCIConnectionField';
import { ConnectionTypeRefs, ModelLocationData } from './types';

type ExistingConnectionFieldProps = {
  children: React.ReactNode;
  connectionTypes: ConnectionTypeConfigMapObj[];
  projectConnections: LabeledConnection[];
  selectedConnection?: Connection;
  onSelect: (connection: Connection) => void;
  selectedConnectionType?: ConnectionTypeConfigMapObj;
  labelHelp?: React.ReactElement;
  setModelLocationData?: (data: ModelLocationData | undefined) => void;
  resetModelLocationData?: () => void;
};

export const ExistingConnectionField: React.FC<ExistingConnectionFieldProps> = ({
  children,
  connectionTypes,
  projectConnections,
  selectedConnection,
  onSelect,
  selectedConnectionType,
  labelHelp,
  setModelLocationData,
  resetModelLocationData,
}) => {
  console.log(setModelLocationData, resetModelLocationData);
  const options: TypeaheadSelectOption[] = React.useMemo(
    () =>
      projectConnections.map((connection) => {
        const { isRecommended } = connection;
        const displayName = getDisplayNameFromK8sResource(connection.connection);

        return {
          content: displayName,
          value: getResourceNameFromK8sResource(connection.connection),
          dropdownLabel: (
            <>
              {isRecommended && (
                <Label color="blue" isCompact>
                  Recommended
                </Label>
              )}
            </>
          ),
          description: (
            <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapNone' }}>
              {getDescriptionFromK8sResource(connection.connection) && (
                <FlexItem>
                  <Truncate content={getDescriptionFromK8sResource(connection.connection)} />
                </FlexItem>
              )}
              <FlexItem>
                <Truncate
                  content={`Type: ${
                    getConnectionTypeDisplayName(connection.connection, connectionTypes) ||
                    'Unknown'
                  }`}
                />
              </FlexItem>
            </Flex>
          ),
          isSelected:
            !!selectedConnection &&
            getResourceNameFromK8sResource(connection.connection) ===
              getResourceNameFromK8sResource(selectedConnection),
        };
      }),
    [connectionTypes, projectConnections, selectedConnection],
  );

  return (
    <FormGroup label="Connection" isRequired className="pf-v6-u-mb-lg" labelHelp={labelHelp}>
      <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>
          <TypeaheadSelect
            toggleWidth="450px"
            selectOptions={options}
            onSelect={(_, value) => {
              const newConnection = projectConnections.find(
                (c) => getResourceNameFromK8sResource(c.connection) === value,
              );
              if (newConnection) {
                onSelect(newConnection.connection);
              }
            }}
            popperProps={{ appendTo: 'inline' }}
            previewDescription={false}
          />
        </FlexItem>
        <FlexItem>
          <ConnectionDetailsHelperText
            connection={selectedConnection}
            connectionType={selectedConnectionType}
          />
        </FlexItem>
      </Flex>
      {children}
      {selectedConnectionType?.metadata.name === ConnectionTypeRefs.S3 && (
        <S3ConnectionField
          folderPath="testing" // TODO: Implement
          setFolderPath={() => console.log('setting folder path')} // TODO: Implement
        />
      )}
      {selectedConnectionType?.metadata.name === ConnectionTypeRefs.OCI && (
        <OCIConnectionField
          ociHost={window.atob(selectedConnection?.data?.OCI_HOST ?? '')}
          modelUri="testing" // TODO: Implement
          setModelUri={() => console.log('setting model uri')} // TODO: Implement
        />
      )}
    </FormGroup>
  );
};
