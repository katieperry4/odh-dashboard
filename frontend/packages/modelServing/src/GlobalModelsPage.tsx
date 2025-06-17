import React from 'react';
import { ProjectsContext } from '@odh-dashboard/internal/concepts/projects/ProjectsContext';
import { useParams } from 'react-router-dom';
import { useExtensions, useResolvedExtensions } from '@odh-dashboard/plugin-core';
import { Bullseye, Spinner } from '@patternfly/react-core';
import GlobalDeploymentsView from './components/global/GlobalDeploymentsView';
import { ModelDeploymentsProvider } from './concepts/ModelDeploymentsContext';
import { ModelServingPlatformProvider } from './concepts/ModelServingPlatformContext';
import {
  isModelServingPlatformExtension,
  isModelServingPlatformWatchDeployments,
} from '../extension-points';

const GlobalModelsPage: React.FC = () => (
  <ModelServingPlatformProvider>
    <GlobalModelsPageCoreLoader />
  </ModelServingPlatformProvider>
);

const GlobalModelsPageCoreLoader: React.FC = () => {
  const availablePlatforms = useExtensions(isModelServingPlatformExtension);
  const [deploymentWatchers] = useResolvedExtensions(isModelServingPlatformWatchDeployments);
  const { namespace } = useParams();
  const { projects, loaded: projectsLoaded } = React.useContext(ProjectsContext);
  const selectedProject = namespace
    ? projects.find((project) => project.metadata.name === namespace)
    : null;
  const projectsToShow = selectedProject ? [selectedProject] : projects;
  if (!projectsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (projects.length === 0) {
    return <div>No projects found component</div>;
  }
  return (
    <ModelDeploymentsProvider
      modelServingPlatforms={availablePlatforms}
      projects={projectsToShow}
      deploymentWatchers={deploymentWatchers}
    >
      <GlobalDeploymentsView />
    </ModelDeploymentsProvider>
  );
};

export default GlobalModelsPage;
