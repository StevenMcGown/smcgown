import * as cdk from 'aws-cdk-lib';
import { User, PolicyStatement, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Fn } from 'aws-cdk-lib';

interface DeploymentUserStackProps extends cdk.StackProps {
  bucketArn: string;
  distributionId: string;
}

export class DeploymentUserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentUserStackProps) {
    super(scope, id, props);

    // Import the bucket ARN and distribution ID from StaticSiteStack
    const bucketArn = Fn.importValue('BucketName');
    const distributionId = Fn.importValue('DistributionId');

    // Create an IAM user for deployment
    const deploymentUser = new User(this, 'GitHubActionsUser', {
      userName: 'GitHubActionsUser',
    });

    // Allow the user to put objects to the S3 bucket
    deploymentUser.addToPolicy(new PolicyStatement({
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      resources: [`arn:aws:s3:::${bucketArn}/*`],
    }));

    // Allow the user to list objects in the S3 bucket
    deploymentUser.addToPolicy(new PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [`arn:aws:s3:::${bucketArn}`],
    }));
    
    // Allow the user to invalidate the CloudFront distribution
    deploymentUser.addToPolicy(new PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [`arn:aws:cloudfront::${this.account}:distribution/${distributionId}`],
    }));

    // Output the user name
    new cdk.CfnOutput(this, 'UserName', {
      value: deploymentUser.userName,
    });
  }
}
