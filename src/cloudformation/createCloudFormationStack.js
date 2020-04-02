const fs = require('fs');
const path = require('path');
const getAWS = require('../getAWS');
const AWS = getAWS();
const Logger = require('../Logger');
const { GylMainEc2KeyName } = require('../common/resourceNames');
const { GylVersion } = require('../GylVersion');

const dbStackName = 'GrowYourListDb';
const StackName = 'GrowYourList';

const createCloudFormationStack = async params => {
	const cloudFormation = new AWS.CloudFormation();
	const s3 = new AWS.S3();
	const {
		LambdaBucketName,
		ApiAuthKeyHash,
		DbTablePrefix,
		SesSourceEmail,
		QueueUser,
		BroadcastUser,
		AdminEmail,
		Ec2InstanceType,
	} = params;
	Logger.info('Uploading CloudFormation templates to bucket');
	await Promise.all(
		[
			s3
				.putObject({
					Bucket: LambdaBucketName,
					Key: 'gyl-template-db.yaml',
					ContentType: 'application/x-yaml',
					Body: fs.readFileSync(path.join(__dirname, 'gyl-template-db.yaml')),
				})
				.promise(),
			s3
				.putObject({
					Bucket: LambdaBucketName,
					Key: 'gyl-template.yaml',
					ContentType: 'application/x-yaml',
					Body: fs.readFileSync(path.join(__dirname, 'gyl-template.yaml')),
				})
				.promise(),
			s3
				.putObject({
					Bucket: LambdaBucketName,
					Key: 'gyl-template-admin-api.yaml',
					ContentType: 'application/x-yaml',
					Body: fs.readFileSync(path.join(__dirname, 'gyl-template-admin-api.yaml')),
				})
				.promise(),
		]
	)
	Logger.log(
		'Creating CloudFormation stacks. This process can take several minutes...'
	);
	await Promise.all([
		cloudFormation
			.validateTemplate({
				TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-db.yaml`,
			})
			.promise(),
		cloudFormation
			.validateTemplate({
				TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template.yaml`,
			})
			.promise(),
		cloudFormation
			.validateTemplate({
				TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-admin-api.yaml`,
			})
			.promise(),
	]);

	const dbOutputs = {};
	try {
		await cloudFormation
			.createStack({
				StackName: dbStackName,
				TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-db.yaml`,
				Parameters: [
					{ ParameterKey: 'DbTablePrefix', ParameterValue: DbTablePrefix },
				],
			})
			.promise();
		const stackCreateCompleteResponse = await cloudFormation
			.waitFor('stackCreateComplete', { StackName: dbStackName })
			.promise();
		Logger.info(`CloudFormation stack ${StackName} created`);
		const stack = stackCreateCompleteResponse.Stacks[0];
		stack.Outputs.forEach((output) => {
			dbOutputs[output.Description] = output.OutputValue;
		});
	} catch (err) {
		if (err.code === 'ResourceNotReady') {
			console.error(
				`Error: It seems the stack ${StackName} could not be ` +
					'created. Please investigate the error online in AWS Console > ' +
					'CloudFormation.'
			);
		}
		throw err;
	}

	const mainStackParameters = [
		{ ParameterKey: 'GylEc2InstanceType', ParameterValue: Ec2InstanceType },
		{ ParameterKey: 'GylKeyName', ParameterValue: GylMainEc2KeyName },
		{ ParameterKey: 'GylVersion', ParameterValue: GylVersion },
		{ ParameterKey: 'LambdaBucketName', ParameterValue: LambdaBucketName },
		{ ParameterKey: 'ApiAuthKeyHash', ParameterValue: ApiAuthKeyHash },
		{ ParameterKey: 'DbTablePrefix', ParameterValue: DbTablePrefix },
		{ ParameterKey: 'AdminEmail', ParameterValue: AdminEmail },
		{ ParameterKey: 'SesSourceEmail', ParameterValue: SesSourceEmail },
		{
			ParameterKey: 'QueueUserAccessKeyId',
			ParameterValue: QueueUser.accessKeyId,
		},
		{
			ParameterKey: 'QueueUserSecretAccessKey',
			ParameterValue: QueueUser.secretAccessKey,
		},
		{
			ParameterKey: 'BroadcastUserAccessKeyId',
			ParameterValue: BroadcastUser.accessKeyId,
		},
		{
			ParameterKey: 'BroadcastUserSecretAccessKey',
			ParameterValue: BroadcastUser.secretAccessKey,
		},
		{
			ParameterKey: 'GylSettingsTableArn',
			ParameterValue: dbOutputs['GylSettingsTableArn'],
		},
		{
			ParameterKey: 'GylSubscribersTableArn',
			ParameterValue: dbOutputs['GylSubscribersTableArn'],
		},
		{
			ParameterKey: 'GylQueueTableArn',
			ParameterValue: dbOutputs['GylQueueTableArn'],
		},
		{
			ParameterKey: 'GylAdminApiStackTemplateUrl',
			ParameterValue: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-admin-api.yaml`
		},
	];

	await cloudFormation
		.createStack({
			StackName,
			TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template.yaml`,
			Parameters: mainStackParameters,
			Capabilities: ['CAPABILITY_IAM'],
		})
		.promise();

	try {
		const stackCreateCompleteResponse = await cloudFormation
			.waitFor('stackCreateComplete', { StackName })
			.promise();
		Logger.info(`CloudFormation stack ${StackName} created`);
		const outputs = {};
		const stack = stackCreateCompleteResponse.Stacks[0];
		stack.Outputs.forEach((output) => {
			outputs[output.Description] = output.OutputValue;
		});
		return outputs;
	} catch (err) {
		if (err.code === 'ResourceNotReady') {
			console.error(
				`Error: It seems the stack ${StackName} could not be ` +
					'created. Please investigate the error online in AWS Console > ' +
					'CloudFormation.'
			);
		}
		throw err;
	}
};

module.exports = createCloudFormationStack;
