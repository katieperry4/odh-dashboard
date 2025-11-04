import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HookNotify, useResolvedExtensions } from '@odh-dashboard/plugin-core';
import { isModelCatalogDeployModalExtension } from '~/odh/extension-points';
import { CatalogModel, CatalogModelDetailsParams } from '~/app/modelCatalogTypes';
import { getDeployButtonState } from '~/odh/utils';
import { useCatalogModelArtifacts } from '~/app/hooks/modelCatalog/useCatalogModelArtifacts';
import {
  decodeParams,
  getModelArtifactUri,
} from '~/app/pages/modelCatalog/utils/modelCatalogUtils';
import {
  InitialWizardFormData,
  ModelLocationType,
} from '@odh-dashboard/model-serving/types/form-data';
import { extractExternalFormData } from '~/odh/extractExternalFormData';
import {
  isExternalFormDataExtension,
  isNavigateToWizardExtension,
} from '../extension-points/model-catalog-form-data';

type ModelCatalogDeployModalExtensionProps = {
  model: CatalogModel;
  render: (
    buttonState: { enabled?: boolean; tooltip?: string },
    onOpenModal: () => void,
    isModalAvailable: boolean,
  ) => React.ReactNode;
};

const ModelCatalogDeployModalExtension: React.FC<ModelCatalogDeployModalExtensionProps> = ({
  model,
  render,
}) => {
  const [navigateExtensions, navigateExtensionsLoaded] = useResolvedExtensions(
    isNavigateToWizardExtension,
  );
  const [formDataExtensions, formDataExtensionsLoaded] = useResolvedExtensions(
    isExternalFormDataExtension,
  );
  const [navigateToWizard, setNavigateToWizard] = React.useState<
    ((initialData?: InitialWizardFormData, projectName?: string) => void) | null
  >(null);
  const [platformExtensions, platformExtensionsLoaded] = useResolvedExtensions(
    isModelCatalogDeployModalExtension,
  );
  const [availablePlatformIds, setAvailablePlatformIds] = React.useState<string[]>([]);
  const buttonState = getDeployButtonState(availablePlatformIds, true);
  // const isModalAvailable = React.useMemo(
  //   () => extensionsLoaded && extensions.length > 0 && !!navigateToWizard,
  //   [extensionsLoaded, extensions.length, navigateToWizard],
  // );
  const isModalAvailable = React.useMemo(
    () =>
      navigateExtensionsLoaded &&
      navigateExtensions.length > 0 &&
      !!navigateToWizard &&
      formDataExtensionsLoaded &&
      formDataExtensions.length > 0 &&
      artifactLoaded &&
      !artifactsLoadError,
    [
      navigateExtensionsLoaded,
      navigateExtensions.length,
      navigateToWizard,
      formDataExtensionsLoaded,
      formDataExtensions.length,
    ],
  );

  const params = useParams<CatalogModelDetailsParams>();
  const decodedParams = decodeParams(params);
  const [artifacts, artifactLoaded, artifactsLoadError] = useCatalogModelArtifacts(
    decodedParams.sourceId || '',
    encodeURIComponent(`${decodedParams.modelName}`),
  );
  const uri = artifacts.items.length > 0 ? getModelArtifactUri(artifacts.items) : '';

  // Extract form data using extension
  const wizardInitialData = React.useMemo((): InitialWizardFormData | undefined => {
    if (
      !formDataExtensionsLoaded ||
      formDataExtensions.length === 0 ||
      !uri ||
      !artifactLoaded ||
      artifactsLoadError
    ) {
      return undefined;
    }

    try {
      const extractFn = formDataExtensions[0].properties.extractFormData;
      const formData = extractFn(uri, model.name);
      if (!formData) return undefined;

      return formData;
    } catch (e) {
      console.error('Failed to extract form data:', e);
      return undefined;
    }
  }, [
    uri,
    formDataExtensions,
    formDataExtensionsLoaded,
    artifactLoaded,
    artifactsLoadError,
    model.name,
  ]);

  const onDeployClick = React.useCallback(() => {
    if (navigateToWizard && wizardInitialData) {
      navigateToWizard(wizardInitialData);
    }
  }, [navigateToWizard, wizardInitialData]);

  return (
    <>
      {/* Get platform IDs */}
      {platformExtensions.map((extension) => {
        return (
          extension.properties.useAvailablePlatformIds && (
            <HookNotify
              key={extension.uid}
              useHook={extension.properties.useAvailablePlatformIds}
              onNotify={(value) => setAvailablePlatformIds(value ?? [])}
            />
          )
        );
      })}
      {/* Get navigation function */}
      {navigateExtensionsLoaded &&
        navigateExtensions.length > 0 &&
        navigateExtensions.map((extension) => (
          <HookNotify
            key={extension.uid}
            useHook={extension.properties.useNavigateToWizard}
            onNotify={(fn) => {
              if (fn && typeof fn === 'function') {
                setNavigateToWizard(() => fn);
              }
            }}
          />
        ))}
      {render(buttonState, onDeployClick, navigateExtensionsLoaded && !!navigateToWizard)}
    </>
  );
};

export default ModelCatalogDeployModalExtension;
