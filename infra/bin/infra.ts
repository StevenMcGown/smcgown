#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StevenMcGownHugoSiteStack } from '../lib/static-site-stack';
import { DeploymentUserStack } from '../lib/deployment-user-stack';

const app = new cdk.App();

// const env = {
//   account: process.env.CDK_DEFAULT_ACCOUNT,
//   region: process.env.CDK_DEFAULT_REGION
// };

const env = {
  account: "914816343260",
  region: "us-east-1"
};

const domainName = app.node.tryGetContext('domainName') || 'smcgown.com'; 
const siteSubDomain = app.node.tryGetContext('siteSubDomain') || undefined;  


const siteStack = new StevenMcGownHugoSiteStack(app, 'StevenMcGownHugoSiteStack', {
  domainName: domainName,
  siteSubDomain: siteSubDomain,
  env: env
});

new DeploymentUserStack(app, 'DeploymentUserStack', {
  bucketArn: siteStack.bucket.bucketArn,
  distributionId: siteStack.distribution.distributionId,
});
