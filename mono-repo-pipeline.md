# mono-repo pipeline

## Resources

- [Environment Variables in Build Environments](https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-env-vars.html)
- [Build scripts](https://github.com/fourTheorem/slic-starter/tree/master/build-scripts)

## Workflow

### SLICPipelineSource (Build project)
- Downloads entire repository
- Executes [source-kickoff.sh](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/source-kickoff.sh)
- Finds all modules (basically subDirectories)
- git diff between last commit and this one to work out which modules changed
- Writes pipeline-state.env with modules and whether module had changed
- Zips to `orchestrator-pipeline-source.zip`

`pipeline-state.env`    
```sh
declare -A changedModules=([certs]="true" [api-service]="true" [util]="true" [frontend]="true" [test-common]="true" [checklist-service]="true" [node_modules]="true" [welcome-service]="true" [build-scripts]="true" [slic-tools]="true" [email-service]="true" [e2e-tests]="true" [user-service]="true" [cicd]="true" [sharing-service]="true" [integration-tests]="true" [localstack]="true" )
export changedModules
declare -x CODEBUILD_BUILD_ID="SLICPipelineSource:a7584389-f11c-4d66-b9b0-99378f11c291"
export CODEBUILD_BUILD_ID

export COMMIT_LOG
declare -x ORIGINAL_CODEBUILD_SOURCE_VERSION=""
export ORIGINAL_CODEBUILD_SOURCE_VERSION
```

### OrchestratorPipeline (Build pipeline)
- Triggered by `orchestrator-pipeline-source.zip`
- Triggers `stgDeployProject`
- Then `stgIntegrationTest` & `stgE2ETest`
- Then manual approval
- Then `prodDeployProject`
- Then `updateDeploymentStateProject`

### stgDeployProject (Build project)
- Executes [source-kickoff.sh](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/orchestrator-stage-deploy.sh)
- For each changed module
    - Copy full s3 artifact to `stg_module_pipelines/module_source/${moduleName}.zip`
    - Start pipeline named `${moduleName}_stg_pipeline`
- Check status of each pipeline in a loop untill all succeeded or some failed

### ${moduleName}_stg_pipeline (Build pipeline)
- Triggers `module_build`
- Triggers `module_deploy`

### module_build (Build project)
- Executes [audit-module](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/audit-module.sh)
    - cd `MODULE_NAME`
    - `npm audit --audit-level=moderate `
- Executes [build-module](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/build-module.sh)
    - cd `MODULE_NAME`
    - Assumes role `role/slic-cicd-deployment-role` in cross account
    - `npm install`
    - `npm test`
- Executes [package-module](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/package-module.sh)
    - cd `MODULE_NAME`
    - Assumes role `role/slic-cicd-deployment-role` in cross account
    - `serverless package build-artifacts/stg`

### module_deploy (Build project)
- Executes [deploy-module](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/deploy-module.sh)
    - cd `MODULE_NAME`
    - Assumes role `role/slic-cicd-deployment-role` in cross account
    - `serverless deploy build-artifacts/stg`

### stgIntegrationTest (Build project)
- Executes [buildspec.yml](https://github.com/fourTheorem/slic-starter/blob/master/integration-tests/buildspec.yml)

### stgE2ETest (Build project)
- Executes [buildspec.yml](https://github.com/fourTheorem/slic-starter/blob/master/e2e-tests/buildspec.yml)

### prodDeployProject (Build project)
- Executes [orchestrator-stage-deploy](https://github.com/fourTheorem/slic-starter/blob/master/build-scripts/orchestrator-stage-deploy.sh)
- For each changed module
    - Copy full s3 artifact to `prod_module_pipelines/module_source/${moduleName}.zip`
    - Start pipeline named `${moduleName}_prod_pipeline`
- Check status of each pipeline in a loop untill all succeeded or some failed