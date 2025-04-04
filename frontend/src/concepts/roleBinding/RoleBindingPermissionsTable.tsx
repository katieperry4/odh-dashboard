import * as React from 'react';
import { K8sResourceCommon, K8sStatus } from '@openshift/dynamic-plugin-sdk-utils';
import { Table } from '~/components/table';
import { RoleBindingKind, RoleBindingRoleRef, RoleBindingSubject } from '~/k8sTypes';
import { generateRoleBindingPermissions } from '~/api';
import RoleBindingPermissionsTableRow from './RoleBindingPermissionsTableRow';
import { columnsRoleBindingPermissions } from './data';
import { RoleBindingPermissionsRoleType } from './types';
import { firstSubject } from './utils';
//import RoleBindingPermissionsTableRowAdd from './RoleBindingPermissionsTableRowAdd';

type RoleBindingPermissionsTableProps = {
  ownerReference?: K8sResourceCommon;
  subjectKind: RoleBindingSubject['kind'];
  namespace: string;
  roleRefKind: RoleBindingRoleRef['kind'];
  roleRefName?: RoleBindingRoleRef['name'];
  labels?: { [key: string]: string };
  isProjectSubject?: boolean;
  defaultRoleBindingName?: string;
  permissions: RoleBindingKind[];
  permissionOptions: {
    type: RoleBindingPermissionsRoleType;
    description: string;
  }[];
  isAdding: boolean;
  typeAhead?: string[];
  createRoleBinding: (roleBinding: RoleBindingKind) => Promise<RoleBindingKind>;
  deleteRoleBinding: (name: string, namespace: string) => Promise<K8sStatus>;
  onDismissNewRow: () => void;
  onError: (error: Error) => void;
  refresh: () => void;
};

const RoleBindingPermissionsTable: React.FC<RoleBindingPermissionsTableProps> = ({
  ownerReference,
  subjectKind,
  namespace,
  roleRefKind,
  roleRefName,
  labels,
  defaultRoleBindingName,
  permissions,
  permissionOptions,
  typeAhead,
  isProjectSubject,
  isAdding,
  createRoleBinding,
  deleteRoleBinding,
  onDismissNewRow,
  onError,
  refresh,
}) => {
  const [editCell, setEditCell] = React.useState<string[]>([]);
  const defaultRoleBinding: RoleBindingKind = {
    metadata: {
      name: '',
      namespace: '',
    },
    subjects: [],
    roleRef: { name: 'edit', kind: 'ClusterRole' },
    apiVersion: '',
    kind: '',
  };
  const createProjectRoleBinding = (
    subjectName: string,
    newRBObject: RoleBindingKind,
    rb: RoleBindingKind,
  ) => {
    const usedNames: string[] = [];
    Object.entries(permissions).forEach((permission) => {
      const permissionName = permission[1].subjects[0].name;
      usedNames.push(permissionName);
    });
    if (isAdding && usedNames.includes(subjectName)) {
      onError(new Error(`${subjectName} has been used already. Try another name.`));
      refresh();
    } else if (isAdding) {
      createRoleBinding(newRBObject)
        .then(() => {
          onDismissNewRow();
          refresh();
        })
        .catch((e) => {
          onError(e);
        });
    } else {
      createRoleBinding(newRBObject)
        .then(() =>
          deleteRoleBinding(rb.metadata.name, rb.metadata.namespace)
            .then(() => refresh())
            .catch((e) => {
              onError(e);
              setEditCell((prev) => prev.filter((cell) => cell !== rb.metadata.name));
            }),
        )
        .catch((e) => {
          onError(e);
          setEditCell((prev) => prev.filter((cell) => cell !== rb.metadata.name));
        });
    }
  };
  return (
    <Table
      variant="compact"
      data={permissions}
      data-testid={`role-binding-table ${subjectKind}`}
      columns={columnsRoleBindingPermissions}
      disableRowRenderSupport
      footerRow={() =>
        isAdding ? (
          <RoleBindingPermissionsTableRow
            key="add-permissions-row"
            subjectKind={subjectKind}
            permissionOptions={permissionOptions}
            isProjectSubject={isProjectSubject}
            typeAhead={typeAhead}
            isEditing={false}
            isAdding
            onChange={(subjectName, rbRoleRefName) => {
              const newRBObject = generateRoleBindingPermissions(
                namespace,
                subjectKind,
                subjectName,
                roleRefName || rbRoleRefName,
                roleRefKind,
                labels,
                ownerReference,
              );
              createProjectRoleBinding(subjectName, newRBObject, newRBObject);
            }}
            onCancel={onDismissNewRow}
            onDelete={() => null}
            onEdit={() => null}
            roleBindingObject={defaultRoleBinding}
          />
        ) : null
      }
      rowRenderer={(rb) => (
        <RoleBindingPermissionsTableRow
          isProjectSubject={isProjectSubject}
          defaultRoleBindingName={defaultRoleBindingName}
          key={rb.metadata.name || ''}
          permissionOptions={permissionOptions}
          roleBindingObject={rb}
          subjectKind={subjectKind}
          isEditing={
            firstSubject(rb, isProjectSubject) === '' || editCell.includes(rb.metadata.name)
          }
          isAdding={false}
          typeAhead={typeAhead}
          onChange={(subjectName, rbRoleRefName) => {
            const newRBObject = generateRoleBindingPermissions(
              namespace,
              subjectKind,
              subjectName,
              roleRefName || rbRoleRefName,
              roleRefKind,
              labels,
              ownerReference,
            );
            createProjectRoleBinding(subjectName, newRBObject, rb);
            refresh();
          }}
          onDelete={() => {
            deleteRoleBinding(rb.metadata.name, rb.metadata.namespace).then(() => refresh());
          }}
          onEdit={() => {
            setEditCell((prev) => [...prev, rb.metadata.name]);
          }}
          onCancel={() => {
            setEditCell((prev) => prev.filter((cell) => cell !== rb.metadata.name));
            onDismissNewRow();
          }}
        />
      )}
    />
  );
};
export default RoleBindingPermissionsTable;
