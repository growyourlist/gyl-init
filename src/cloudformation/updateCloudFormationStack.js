const fs = require('fs');
const path = require('path');
const getAWS = require('../getAWS');
const AWS = getAWS();
const Logger = require('../Logger');
const { GylMainEc2KeyName } = require('../common/resourceNames');
const getUserInput = require('../other/getUserInput');

const dbStackName = 'GrowYourListDb';
const StackName = 'GrowYourList';

const createChangeSet = async (
	StackName,
	TemplateURL,
	ChangeSetName,
	Parameters
) => {
	const cloudFormation = new AWS.CloudFormation();
	Logger.log(`Creating change set for stack: ${StackName}`);
	await cloudFormation
		.createChangeSet({
			StackName,
			TemplateURL,
			ChangeSetName,
			Parameters,
			Capabilities: ['CAPABILITY_IAM'],
		})
		.promise();
	try {
		const createdResponse = await cloudFormation
			.waitFor('changeSetCreateComplete', { StackName, ChangeSetName })
			.promise();
		Logger.info(`Stack ${StackName} created`);
		return {
			ChangeSetName: createdResponse.ChangeSetName,
			Changes: createdResponse.Changes,
		};
	} catch (err) {
		const changeSetDescriptionResponse = await cloudFormation
			.describeChangeSet({
				StackName,
				ChangeSetName,
			})
			.promise();
		if (
			/didn't contain changes/.test(
				changeSetDescriptionResponse.StatusReason || ''
			)
		) {
			Logger.info(
				`Skipping updates to stack ${StackName} because no changes were detected.`
			);
		} else {
			throw err;
		}
	}
};

const updateCloudFormationStack = async (params) => {
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
		GylVersion,
	} = params;
	Logger.info('Uploading CloudFormation templates to bucket');
	const dbStackS3File = `gyl-template-db-${GylVersion}.yaml`;
	const dbStackS3Path = `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-db-${GylVersion}.yaml`;
	const dbChangeSetName = `UpdateGylDbStackTo${GylVersion.replace(/\./g, '-')}`;
	const mainStackS3File = `gyl-template-${GylVersion}.yaml`;
	const mainStackS3Path = `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-${GylVersion}.yaml`;
	const mainChangeSetName = `UpdateGylStackTo${GylVersion.replace(/\./g, '-')}`;
	const adminApiStackS3File = `gyl-template-admin-api-${GylVersion}.yaml`;
	const adminApiStackS3Path = `https://${LambdaBucketName}.s3.amazonaws.com/gyl-template-admin-api-${GylVersion}.yaml`;
	await Promise.all([
		s3
			.putObject({
				Bucket: LambdaBucketName,
				Key: dbStackS3File,
				ContentType: 'application/x-yaml',
				Body: fs.readFileSync(path.join(__dirname, 'gyl-template-db.yaml')),
			})
			.promise(),
		s3
			.putObject({
				Bucket: LambdaBucketName,
				Key: mainStackS3File,
				ContentType: 'application/x-yaml',
				Body: fs.readFileSync(path.join(__dirname, 'gyl-template.yaml')),
			})
			.promise(),
		s3
			.putObject({
				Bucket: LambdaBucketName,
				Key: adminApiStackS3File,
				ContentType: 'application/x-yaml',
				Body: fs.readFileSync(
					path.join(__dirname, 'gyl-template-admin-api.yaml')
				),
			})
			.promise(),
	]);
	Logger.log(
		'Update CloudFormation stacks. This process can take several minutes...'
	);

	const validateTemplate = async (TemplateURL) => {
		try {
			await cloudFormation.validateTemplate({ TemplateURL }).promise();
		} catch (err) {
			Logger.error(`Error validating: ${TemplateURL}`);
			throw err;
		}
	};

	await Promise.all([
		validateTemplate(dbStackS3Path),
		validateTemplate(mainStackS3Path),
		validateTemplate(adminApiStackS3Path),
	]);
	Logger.info('All CloudFormation templates successfully validated.');
	const dbChanges = await createChangeSet(
		dbStackName,
		dbStackS3Path,
		dbChangeSetName,
		[{ ParameterKey: 'DbTablePrefix', ParameterValue: DbTablePrefix }]
	);
	const dbOutputs = {};
	if (dbChanges) {
		console.log(`\n# Changes to the stack: ${dbStackName}\n`);
		console.log(JSON.stringify(dbChanges) + '\n');

		console.log(
			'WARNING: BACK UP YOUR DATABASE (i.e. DynamoDB tables) BEFORE PROCEEDING. CHANGES TO THE DATABASE ARE LIKELY TO DELETE ALL DATA.' +
				'\n'
		);
		const input = await getUserInput('Proceed? [y/any key to cancel]: ');
		if (input.toLocaleLowerCase() !== 'y') {
			Logger.log('Cancelled update, exiting.');
			process.exit();
		}
		Logger.log(`Updating stack: ${dbStackName}...`);
		await cloudFormation
			.executeChangeSet({
				ChangeSetName: dbChangeSetName,
				StackName: dbStackName,
			})
			.promise();
		const stackUpdatedResponse = await cloudFormation
			.waitFor('stackUpdateComplete', { StackName: dbStackName })
			.promise();
		const stack = stackUpdatedResponse.Stacks[0];
		stack.Outputs.forEach((output) => {
			dbOutputs[output.Description] = output.OutputValue;
		});
	} else {
		const dbStackResponse = await cloudFormation
			.describeStacks({ StackName: dbStackName })
			.promise();
		dbStackResponse.Stacks[0].Outputs.forEach((output) => {
			dbOutputs[output.Description] = output.OutputValue;
		});
	}
	const mainChanges = await createChangeSet(
		StackName,
		mainStackS3Path,
		mainChangeSetName,
		[
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
				ParameterKey: 'GylTemplateHistoryTableArn',
				ParameterValue: dbOutputs['GylTemplateHistoryTableArn'],
			},
			{
				ParameterKey: 'GylAutoresponderHistoryTableArn',
				ParameterValue: dbOutputs['GylAutoresponderHistoryTableArn'],
			},
			{
				ParameterKey: 'GylBroadcastQueueTableArn',
				ParameterValue: dbOutputs['GylBroadcastQueueTableArn'],
			},
			{
				ParameterKey: 'GylAdminApiStackTemplateUrl',
				ParameterValue: adminApiStackS3Path,
			},
		]
	);
	if (mainChanges) {
		console.log(`\n# Changes to the stack: ${StackName}\n`);
		console.log(JSON.stringify(mainChanges) + '\n');
		const input = await getUserInput('Proceed? [y/any key to cancel]: ');
		if (input.toLocaleLowerCase() !== 'y') {
			Logger.log('Cancelled update, exiting.');
			process.exit();
		}
		Logger.log(`Updating stack: ${StackName}...`);
		await cloudFormation
			.executeChangeSet({
				ChangeSetName: mainChangeSetName,
				StackName: StackName,
			})
			.promise();
		const stackUpdatedResponse = await cloudFormation
			.waitFor('stackUpdateComplete', { StackName })
			.promise();
		const outputs = {};
		const stack = stackUpdatedResponse.Stacks[0];
		stack.Outputs.forEach((output) => {
			outputs[output.Description] = output.OutputValue;
		});
		return outputs;
	} else {
		const stackResponse = await cloudFormation
			.describeStacks({ StackName })
			.promise();
		const outputs = {};
		stackResponse.Stacks[0].Outputs.forEach((output) => {
			outputs[output.Description] = output.OutputValue;
		});
		return outputs;
	}
};

module.exports = updateCloudFormationStack;
