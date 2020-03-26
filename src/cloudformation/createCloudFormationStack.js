const fs = require('fs');
const path = require('path');
const getAWS = require('../getAWS');
const AWS = getAWS();
const Logger = require('../Logger');
const { GylEc2MainKeyName } = require('../common/resourceNames');
const { GylVersion } = require('../GylVersion');

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
	} = params;
	Logger.info('Uploading CloudFormation template to bucket');
	await s3
		.putObject({
			Bucket: LambdaBucketName,
			Key: 'gyl-template.yaml',
			ContentType: 'application/x-yaml',
			Body: fs.readFileSync(path.join(__dirname, 'gyl-template.yaml')),
		})
		.promise();
	Logger.log(
		`Creating CloudFormation stack ${StackName}. This process can ` +
			'take several minutes...'
	);
	await cloudFormation
		.validateTemplate({
			TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template.yaml`,
		})
		.promise();
	await cloudFormation
		.createStack({
			StackName,
			TemplateURL: `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template.yaml`,
			Parameters: [
				{ ParameterKey: 'KeyName', ParameterValue: GylEc2MainKeyName },
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
			],
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
