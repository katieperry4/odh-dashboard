import React from 'react';
import ApplicationsPage from '@odh-dashboard/internal/pages/ApplicationsPage';
import { ProjectObjectType } from '@odh-dashboard/internal/concepts/design/utils';
import TitleWithIcon from '@odh-dashboard/internal/concepts/design/TitleWithIcon';
import { ProjectsContext } from '@odh-dashboard/internal/concepts/projects/ProjectsContext';
import { GlobalNoModelsView } from './GlobalNoModelsView';
import GlobalDeploymentsTable from './GlobalDeploymentsTable';
import ModelServingProjectSelection from './ModelServingProjectSelection';
import { ModelDeploymentsContext } from '../../concepts/ModelDeploymentsContext';

const GlobalDeploymentsView: React.FC = () => {
  const { deployments, loaded: deploymentsLoaded } = React.useContext(ModelDeploymentsContext);
  const { preferredProject: currentProject } = React.useContext(ProjectsContext);
  const hasDeployments = deployments && deployments.length > 0;
  const isLoading = !deploymentsLoaded;

  return (
    <ApplicationsPage
      loaded={!isLoading}
      empty={!hasDeployments}
      emptyStatePage={<GlobalNoModelsView project={currentProject ?? undefined} />}
      description="Manage and view the health and performance of your deployed models."
      title={
        <TitleWithIcon title="Model deployments" objectType={ProjectObjectType.deployedModels} />
      }
      headerContent={
        <ModelServingProjectSelection getRedirectPath={(ns: string) => `/modelServing/${ns}`} />
      }
    >
      <GlobalDeploymentsTable />
    </ApplicationsPage>
  );
};

export default GlobalDeploymentsView;
