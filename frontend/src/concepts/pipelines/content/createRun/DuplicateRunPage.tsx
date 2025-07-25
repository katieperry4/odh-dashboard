import React from 'react';
import { BreadcrumbItem, Truncate } from '@patternfly/react-core';
import { useParams, Link } from 'react-router-dom';
import RunPage from '#~/concepts/pipelines/content/createRun/RunPage';
import ApplicationsPage from '#~/pages/ApplicationsPage';
import { PathProps } from '#~/concepts/pipelines/content/types';
import { ExperimentKF } from '#~/concepts/pipelines/kfTypes';
import usePipelineRunById from '#~/concepts/pipelines/apiHooks/usePipelineRunById';
import PipelineContextBreadcrumb from '#~/concepts/pipelines/content/PipelineContextBreadcrumb';
import { RunTypeOption } from './types';

type DuplicateRunPageProps = {
  detailsRedirect: (runId: string) => string;
  contextExperiment?: ExperimentKF | null;
};

const DuplicateRunPage: React.FC<PathProps & DuplicateRunPageProps> = ({
  breadcrumbPath,
  contextPath,
  detailsRedirect,
  ...props
}) => {
  const { runId } = useParams();
  const [run, loaded, error] = usePipelineRunById(runId);

  return (
    <ApplicationsPage
      title="Duplicate run"
      breadcrumb={
        <PipelineContextBreadcrumb>
          {breadcrumbPath}
          <BreadcrumbItem isActive style={{ maxWidth: 300 }}>
            {run ? (
              <Link to={detailsRedirect(run.run_id)}>
                <Truncate content={run.display_name} />
              </Link>
            ) : (
              'Loading...'
            )}
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Duplicate run</BreadcrumbItem>
        </PipelineContextBreadcrumb>
      }
      loaded={loaded}
      loadError={error}
      empty={false}
    >
      <RunPage
        duplicateRun={run}
        contextPath={contextPath}
        runType={RunTypeOption.ONE_TRIGGER}
        testId="duplicate-run-page"
        {...props}
      />
    </ApplicationsPage>
  );
};

export default DuplicateRunPage;
