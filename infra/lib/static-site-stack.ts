import * as cdk from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { CloudFrontWebDistribution, OriginAccessIdentity, ViewerCertificate, CloudFrontAllowedMethods, Function, FunctionCode, FunctionEventType, CachePolicy, CacheCookieBehavior, CacheHeaderBehavior, CacheQueryStringBehavior  } from 'aws-cdk-lib/aws-cloudfront';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';

interface StaticSiteStackProps extends cdk.StackProps {
  domainName: string;
  siteSubDomain: string;
}

export class StevenMcGownHugoSiteStack extends cdk.Stack {
  public readonly bucket: Bucket;
  public readonly distribution: CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props: StaticSiteStackProps) {
    super(scope, id, props);

    // const siteDomain = `${props.siteSubDomain}.${props.domainName}`;
    // Site domain with subdomain only if provided and not empty
    const siteDomain = props.siteSubDomain
      ? `${props.siteSubDomain}.${props.domainName}`
      : props.domainName;

    // Create an S3 bucket for the static site with a specified name and public access blocked
    this.bucket = new Bucket(this, "StaticSiteBucket", {
      bucketName: siteDomain,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL, // Ensures no public access to the bucket
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create an Origin Access Identity for CloudFront
    const oai = new OriginAccessIdentity(this, "OAI");

    // Correctly configure the bucket policy to allow the OAI to access the bucket contents
    this.bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [oai.grantPrincipal],
      })
    );

    // Look up the hosted zone
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    // Create an ACM certificate for the custom domain
    const certificate = new Certificate(this, "SiteCertificate", {
      domainName: siteDomain,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // Function to add index.html to requests for directories
    const urlRewriteFunction = new Function(this, 'AddIndexHtmlFunction', {
      code: FunctionCode.fromInline(`function handler(event) {
        var request = event.request;
        var uri = request.uri;
        if (!uri.includes('.')) {
          request.uri = uri.endsWith('/') ? uri + 'index.html' : uri + '/index.html';
        }
        return request;
      }`)
    });
    
    // Create a custom cache policy for google lighthouse score
  const CloudFrontCachePolicy = new CachePolicy(this, 'MyCachePolicy', {
    comment: 'Caching policy for static assets',
    defaultTtl: cdk.Duration.days(365), // Change TTL as per your requirement
    minTtl: cdk.Duration.days(1),
    maxTtl: cdk.Duration.days(365),
    cookieBehavior: CacheCookieBehavior.none(),
    headerBehavior: CacheHeaderBehavior.none(),
    queryStringBehavior: CacheQueryStringBehavior.none(),
    enableAcceptEncodingGzip: true,
    enableAcceptEncodingBrotli: true,
  });


    // CloudFront distribution setup
    this.distribution = new CloudFrontWebDistribution(this, 'SiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.bucket,
            originAccessIdentity: oai,
          },
          behaviors: [{
            isDefaultBehavior: true,
            allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
            compress: true,
            defaultTtl: cdk.Duration.days(1),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.seconds(0),
            functionAssociations: [{
              eventType: FunctionEventType.VIEWER_REQUEST,
              function: urlRewriteFunction,
            }],
          }],
        },
      ],
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [siteDomain],
      }),
    });

    // Create a Route53 A record for the CloudFront distribution
    new ARecord(this, "SiteAliasRecord", {
      recordName: siteDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      zone: hostedZone,
    });

    // Output the S3 bucket name, CloudFront distribution ID, and site URL
    new cdk.CfnOutput(this, "BucketNameOutput", {
      value: this.bucket.bucketName,
      exportName: "BucketName",
    });

    new cdk.CfnOutput(this, "DistributionIdOutput", {
      value: this.distribution.distributionId,
      exportName: "DistributionId",
    });

    new cdk.CfnOutput(this, "SiteURLOutput", {
      value: `https://${siteDomain}`,
      exportName: "SiteURL",
    });
  }
}
