import {
  InferenceServiceKind,
  KnownLabels,
  SupportedModelFormats,
} from '@odh-dashboard/internal/k8sTypes';
import {
  createSecret,
  InferenceServiceModel,
  getGeneratedSecretName,
  getSecret,
  patchSecretWithInferenceServiceOwnerReference,
} from '@odh-dashboard/internal/api/index';
import { applyK8sAPIOptions } from '@odh-dashboard/internal/api/apiMergeUtils';
import { k8sCreateResource } from '@openshift/dynamic-plugin-sdk-utils';
import { HardwareProfileConfig } from '@odh-dashboard/internal/concepts/hardwareProfiles/useHardwareProfileConfig';
import { ServingRuntimeModelType } from '@odh-dashboard/internal/types';
import {
  isModelServingCompatible,
  ModelServingCompatibleTypes,
  assembleConnectionSecret,
} from '@odh-dashboard/internal/concepts/connectionTypes/utils';
import { isPVCUri } from '@odh-dashboard/internal/pages/modelServing/screens/projects/utils';
import { getConnectionProtocolType } from '@odh-dashboard/internal/pages/projects/utils';
import { KServeDeployment } from './deployments';
import {
  ModelLocationData,
  ModelLocationType,
} from '../../model-serving/src/components/deploymentWizard/fields/modelLocationFields/types';
import { UseModelDeploymentWizardState } from '../../model-serving/src/components/deploymentWizard/useDeploymentWizard';
import { ExternalRouteFieldData } from '../../model-serving/src/components/deploymentWizard/fields/ExternalRouteField';
import { TokenAuthenticationFieldData } from '../../model-serving/src/components/deploymentWizard/fields/TokenAuthenticationField';
import { CreateConnectionData } from '../../model-serving/src/components/deploymentWizard/fields/CreateConnectionInputFields';

type CreatingInferenceServiceObject = {
  project: string;
  name: string;
  k8sName: string;
  modelLocationData?: ModelLocationData;
  createConnectionData?: CreateConnectionData;
  modelType: ServingRuntimeModelType;
  hardwareProfile: HardwareProfileConfig;
  modelFormat: SupportedModelFormats;
  externalRoute?: ExternalRouteFieldData;
  tokenAuth?: TokenAuthenticationFieldData;
  inferenceServiceUID?: string;
};

export const deployKServeDeployment = async (
  wizardData: UseModelDeploymentWizardState['state'],
  projectName: string,
  existingDeployment?: KServeDeployment,
  dryRun?: boolean,
): Promise<KServeDeployment> => {
  if (!wizardData.modelType.data) {
    throw new Error('Wizard data is missing required model type field');
  }

  if (!wizardData.modelFormatState.modelFormat) {
    throw new Error('Wizard data is missing required model format field');
  }

  const inferenceServiceData: CreatingInferenceServiceObject = {
    project: projectName,
    name: wizardData.k8sNameDesc.data.name,
    k8sName: wizardData.k8sNameDesc.data.k8sName.value,
    modelLocationData: wizardData.modelLocationData.data,
    createConnectionData: wizardData.createConnectionData.data,
    modelType: wizardData.modelType.data,
    hardwareProfile: wizardData.hardwareProfileConfig.formData,
    modelFormat: wizardData.modelFormatState.modelFormat,
    externalRoute: wizardData.externalRoute.data,
    tokenAuth: wizardData.tokenAuthentication.data,
  };

  const secretName =
    inferenceServiceData.createConnectionData?.nameDesc?.name ||
    inferenceServiceData.modelLocationData?.connection ||
    getGeneratedSecretName();

  if (!inferenceServiceData.createConnectionData?.nameDesc) {
    inferenceServiceData.createConnectionData = {
      ...inferenceServiceData.createConnectionData,
      nameDesc: {
        name: secretName,
        description: '',
        k8sName: {
          value: secretName,
          state: {
            immutable: false,
            invalidCharacters: false,
            invalidLength: false,
            maxLength: 0,
            touched: false,
          },
        },
      },
    };
  }

  await handleConnectionCreation(inferenceServiceData, dryRun, secretName).then(() => {
    // If we're not in dry run, get the secret to make sure it exists before creating the inference service
    if (!dryRun) {
      return getSecret(inferenceServiceData.project, secretName);
    }
    return Promise.resolve(undefined);
  });

  const inferenceService = await createInferenceService(
    inferenceServiceData,
    existingDeployment?.model,
    dryRun,
  );

  if (
    !inferenceServiceData.createConnectionData.saveConnection &&
    !dryRun &&
    inferenceServiceData.modelLocationData?.type !== ModelLocationType.EXISTING
  ) {
    inferenceServiceData.inferenceServiceUID = inferenceService.metadata.uid;
    await getSecret(inferenceService.metadata.namespace, secretName).then((secret) => {
      patchSecretWithInferenceServiceOwnerReference(
        secret,
        inferenceService,
        inferenceServiceData.inferenceServiceUID ?? '',
      );
    });
  }

  return Promise.resolve({
    modelServingPlatformId: 'kserve',
    model: inferenceService,
  });
};

const assembleInferenceService = (
  data: CreatingInferenceServiceObject,
  existingInferenceService?: InferenceServiceKind,
  dryRun?: boolean,
): InferenceServiceKind => {
  const {
    project,
    name,
    k8sName,
    modelType,
    hardwareProfile,
    modelFormat,
    tokenAuth,
    externalRoute,
    createConnectionData,
  } = data;
  const inferenceService: InferenceServiceKind = existingInferenceService
    ? { ...existingInferenceService }
    : {
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: {
          name: k8sName,
          namespace: project,
        },
        spec: {
          predictor: {
            model: {
              modelFormat: {
                name: modelFormat.name,
                ...(modelFormat.version && { version: modelFormat.version }),
              },
              resources: hardwareProfile.resources,
            },
          },
        },
      };

  const annotations = { ...inferenceService.metadata.annotations };
  annotations['openshift.io/display-name'] = name.trim();
  annotations['opendatahub.io/model-type'] = modelType;

  const isLegacyHardwareProfile = !hardwareProfile.selectedProfile?.metadata.uid;
  if (!isLegacyHardwareProfile) {
    annotations['opendatahub.io/hardware-profile-name'] =
      hardwareProfile.selectedProfile?.metadata.name;
  } else {
    const legacyName = hardwareProfile.selectedProfile?.metadata.name;
    if (legacyName) {
      annotations['opendatahub.io/legacy-hardware-profile-name'] = legacyName;
    }
  }
  annotations['opendatahub.io/hardware-profile-namespace'] =
    hardwareProfile.selectedProfile?.metadata.namespace;

  if (tokenAuth && tokenAuth.length > 0) {
    annotations['security.opendatahub.io/enable-auth'] = 'true';
  }
  if (createConnectionData?.nameDesc?.name && !dryRun) {
    annotations['opendatahub.io/connections'] = createConnectionData.nameDesc.name;
  }

  inferenceService.metadata.annotations = annotations;

  if (externalRoute) {
    if (!inferenceService.metadata.labels) {
      inferenceService.metadata.labels = {};
    }
    delete inferenceService.metadata.labels['networking.kserve.io/visibility'];

    inferenceService.metadata.labels['networking.kserve.io/visibility'] = 'exposed';
  }

  const labels = { ...inferenceService.metadata.labels };
  labels[KnownLabels.DASHBOARD_RESOURCE] = 'true';
  inferenceService.metadata.labels = labels;

  const updatedInferenceService = addConnectionDataToInferenceService(data, inferenceService);
  return updatedInferenceService;
};

const createInferenceService = (
  data: CreatingInferenceServiceObject,
  inferenceService?: InferenceServiceKind,
  dryRun?: boolean,
): Promise<InferenceServiceKind> => {
  const assembledInferenceService = assembleInferenceService(data, inferenceService, dryRun);

  return k8sCreateResource<InferenceServiceKind>(
    applyK8sAPIOptions(
      {
        model: InferenceServiceModel,
        resource: assembledInferenceService,
      },
      { dryRun: dryRun ?? false },
    ),
  );
};

const handleConnectionCreation = async (
  data: CreatingInferenceServiceObject,
  dryRun?: boolean,
  secretName?: string,
) => {
  const { createConnectionData, modelLocationData, project } = data;

  // Don't do anything if the connection already exists
  if (
    modelLocationData?.type === ModelLocationType.EXISTING ||
    modelLocationData?.type === ModelLocationType.PVC ||
    !modelLocationData
  ) {
    return;
  }

  const connectionTypeName = modelLocationData.connectionTypeObject?.metadata.name ?? 'uri';

  const newConnection = assembleConnectionSecret(
    project,
    connectionTypeName,
    createConnectionData?.nameDesc ?? {
      name: secretName ?? '',
      description: '',
      k8sName: {
        value: secretName ?? '',
        state: {
          immutable: false,
          invalidCharacters: false,
          invalidLength: false,
          maxLength: 0,
          touched: false,
        },
      },
    },
    modelLocationData.fieldValues,
  );

  // Apply protocol annotation based on base connection type
  const protocolType = modelLocationData.connectionTypeObject
    ? getConnectionProtocolType(modelLocationData.connectionTypeObject)
    : 'uri';

  const annotatedConnection = {
    ...newConnection,
    metadata: {
      ...newConnection.metadata,
      annotations: {
        ...newConnection.metadata.annotations,
        'opendatahub.io/connection-type-protocol': protocolType,
      },
    },
  };

  // If not saving as connection
  if (!createConnectionData?.saveConnection) {
    // Remove dashboard resource label so it doesn't show in connections list
    annotatedConnection.metadata.labels['opendatahub.io/dashboard'] = 'false';
  }
  return createSecret(annotatedConnection, { dryRun: dryRun ?? false });
};

const addConnectionDataToInferenceService = (
  data: CreatingInferenceServiceObject,
  inferenceService: InferenceServiceKind,
): InferenceServiceKind => {
  const { modelLocationData } = data;
  const updatedInferenceService = { ...inferenceService };

  if (!updatedInferenceService.spec.predictor.model || !inferenceService.spec.predictor.model) {
    updatedInferenceService.spec.predictor.model = {};
  }

  // Adds storage URI for PVC
  if (isPVCUri(String(modelLocationData?.fieldValues.URI))) {
    updatedInferenceService.spec.predictor.model.storageUri = String(
      modelLocationData?.fieldValues.URI,
    );
  }
  // Handle additional fields based on connection type
  if (modelLocationData?.connectionTypeObject) {
    if (
      isModelServingCompatible(
        modelLocationData.connectionTypeObject,
        ModelServingCompatibleTypes.S3ObjectStorage,
      )
    ) {
      // For S3, add storage path
      updatedInferenceService.spec.predictor.model.storage = {
        path: modelLocationData.additionalFields.modelPath,
      };
    } else if (
      isModelServingCompatible(
        modelLocationData.connectionTypeObject,
        ModelServingCompatibleTypes.OCI,
      )
    ) {
      // For OCI add storage URI
      updatedInferenceService.spec.predictor.model.storageUri =
        modelLocationData.additionalFields.modelUri ?? String(modelLocationData.fieldValues.URI);
    }
  }
  return updatedInferenceService;
};
