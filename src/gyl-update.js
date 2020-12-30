const AWS = require('./getAWS')();
const loadConfig = require('./loadConfig');
const readline = require('readline');
const cryto = require('crypto');
const bcrypt = require('bcrypt');
const Logger = require('./Logger');
const deployApis = require('./api-gateway/deployApis');
const getUserInput = require('./other/getUserInput');
const getSesSourceEmail = require('./ses/getSesSourceEmail');
const getCurrentSesSourceEmail = require('./ses/getCurrentSesSourceEmail');
const getAdminEmail = require('./ses/getAdminEmail');
const setSesEventDestinations = require('./ses/setSesEventDestinations');
const updateSesEventDestinations = require('./ses/updateSesEventDestinations');
const createKeyPair = require('./ec2/createKeyPair');
const uploadLambdaFunctions = require('./s3/uploadLambdaFunctions');
const createCloudFormationStack = require('./cloudformation/createCloudFormationStack');
const updateCloudFormationStack = require('./cloudformation/updateCloudFormationStack');
const populateDb = require('./dynamodb/populateDb');
const getPostalAddress = require('./other/getPostalAddress');
const setEnvironmentVars = require('./lambda/setEnvironmentVars');
const updateEnvironmentVars = require('./lambda/updateEnvironmentVars');
const getEc2InstanceType = require('./ec2/getEc2InstaceType');
const { GylVersion } = require('./GylVersion');

const createUsers = require('./iam/createUsers');
const { realpath } = require('fs');
const updateUsers = require('./iam/updateUsers');

const showChange = (paramName = '', oldValue = '', newValue = '') => {
	if (oldValue === newValue) {
		return `${paramName} remains ${oldValue}`;
	} else {
		return `${paramName} changes from "${oldValue}" to "${newValue}"`;
	}
};

const doUpdate = async () => {
	try {
		Logger.log(
			'\n### UPDATING GROW YOUR LIST (GYL) ###\n\n' +
				'This program will update GYL in your AWS account.'
		);
		await loadConfig();
		const cloudformation = new AWS.CloudFormation();
		const existingStackResponse = await cloudformation
			.describeStacks({ StackName: 'GrowYourList' })
			.promise();
		if (
			!Array.isArray(existingStackResponse.Stacks) ||
			!existingStackResponse.Stacks.length
		) {
			throw new Error(
				"No CloudFormation stacks named GrowYourList found. Are you sure you're connected to the right AWS account?"
			);
		}
		if (existingStackResponse.Stacks.length !== 1) {
			throw new Error(
				'More than 1 GrowYourList stack found. Update can currently only handle 1 GrowYourList stack.'
			);
		}
		const existingStack = existingStackResponse.Stacks[0];
		if (existingStack.Parameters.length < 16) {
			throw new Error('Existing stack has an unexpected number of paramters');
		}
		const checkParams = existingStack.Parameters.filter((p) => {
			switch (p.ParameterKey) {
				case 'AdminEmail':
				case 'DbTablePrefix':
				case 'SesSourceEmail':
				case 'GylEc2InstanceType':
				case 'GylVersion':
					return true;
				default:
					return false;
			}
		});
		if (checkParams.length !== 5) {
			throw new Error('Could not find all "check" parameters');
		}
		const stackDetails = `${checkParams
			.map((p) => `  ${p.ParameterKey}: ${p.ParameterValue}`)
			.join('\n')}`;
		const isAlreadyUpToDate =
			checkParams.find((p) => p.ParameterKey === 'GylVersion')
				.ParameterValue === GylVersion;
		if (isAlreadyUpToDate) {
			Logger.log(`Found GrowYourList stack with the following details:
${stackDetails}
GrowYourList is already up to date (version ${GylVersion}) ✔`);
			return;
		}
		Logger.log(`Found the following GrowYourList stack to update (you can change some of these details during the update):
${stackDetails}
This stack will be updated to GYL version ${GylVersion}`);
		const SesSourceEmailOld = checkParams.find(
			(p) => p.ParameterKey === 'SesSourceEmail'
		).ParameterValue;
		const SesSourceEmail = await getSesSourceEmail({
			currentValue: SesSourceEmailOld,
		});
		const LambdaBucketName = existingStack.Parameters.find(
			(p) => p.ParameterKey === 'LambdaBucketName'
		).ParameterValue;
		const GylEc2InstanceTypeOld = existingStack.Parameters.find(
			(p) => p.ParameterKey === 'GylEc2InstanceType'
		).ParameterValue;
		const Ec2InstanceType = await getEc2InstanceType({
			currentValue: GylEc2InstanceTypeOld,
		});
		const ApiAuthKeyHash = existingStack.Parameters.find(
			(p) => p.ParameterKey === 'ApiAuthKeyHash'
		).ParameterValue;
		const DbTablePrefix = existingStack.Parameters.find(
			(p) => p.ParameterKey === 'DbTablePrefix'
		).ParameterValue;
		const QueueUser = {
			accessKeyId: existingStack.Parameters.find(
				(p) => p.ParameterKey === 'QueueUserAccessKeyId'
			).ParameterValue,
			secretAccessKey: existingStack.Parameters.find(
				(p) => p.ParameterKey === 'QueueUserSecretAccessKey'
			).ParameterValue,
		};
		const BroadcastUser = {
			accessKeyId: existingStack.Parameters.find(
				(p) => p.ParameterKey === 'BroadcastUserAccessKeyId'
			).ParameterValue,
			secretAccessKey: existingStack.Parameters.find(
				(p) => p.ParameterKey === 'BroadcastUserSecretAccessKey'
			).ParameterValue,
		};
		const GylVersionOld = existingStack.Parameters.find(
			(p) => p.ParameterKey === 'GylVersion'
		).ParameterValue;
		const AdminEmailOld = existingStack.Parameters.find(
			(p) => p.ParameterKey === 'AdminEmail'
		).ParameterValue;
		const AdminEmail = await getAdminEmail({ currentValue: AdminEmailOld });
		Logger.log(`About to make the following updates:
${showChange('SesSourceEmail', SesSourceEmailOld, SesSourceEmail)}
${showChange('AdminEmail', AdminEmailOld, AdminEmail)}
${showChange('GylEc2InstanceType', GylEc2InstanceTypeOld, Ec2InstanceType)}
${showChange('GylVersion', GylVersionOld, GylVersion)}`);
		const confirmChanges = await getUserInput(
			'Continue? [y/any key to exit]: '
		);
		if (confirmChanges.toLocaleLowerCase() !== 'y') {
			Logger.log('Exiting update process.');
			return;
		}

		Logger.log(
			'\n## Uploading new version of GYL Software ##\n' +
				`GYL ${GylVersion} will now be uploaded to your AWS ` +
				'account. This can take some time.\n'
		);
		await uploadLambdaFunctions(LambdaBucketName);
		const outputs = await updateCloudFormationStack({
			LambdaBucketName,
			ApiAuthKeyHash,
			DbTablePrefix,
			SesSourceEmail,
			QueueUser,
			BroadcastUser,
			AdminEmail,
			Ec2InstanceType,
			GylVersion,
		});
		await deployApis([
			{
				restApiId: outputs['GYL Admin API'],
				stageName: outputs['GYL Admin API Stage'],
			},
		]);
		// const cf = new AWS.CloudFormation();
		// const res1 = await cf
		// 	.describeStacks({
		// 		StackName: 'GrowYourList',
		// 	})
		// 	.promise();
		// const st1 = res1.Stacks[0];
		// const outputs = {};
		// st1.Outputs.forEach((output) => {
		// 	outputs[output.Description] = output.OutputValue;
		// });
		// Logger.log('OUTPUTS');
		// Logger.log(outputs);
		await updateSesEventDestinations(outputs);
		// TODO decide what to do about populateDb equivalent for updates
		Logger.log('Populate DB is currently a manual step for update processes');
		await updateEnvironmentVars({
			publicApiUrl: `${outputs['GYL Public API Url']}${outputs['GYL Public API Stage']}`
		});
		await updateUsers(DbTablePrefix);

		Logger.log('\n# GrowYourList Details\n');

		Logger.log(`EC2 Hostname: ${outputs['EC2 Hostname']}`);
		Logger.log(
			`GYL API URL: ${outputs['GYL Admin API Url']}${outputs['GYL Admin API Stage']}`
		);
		Logger.log(`\nSuccessfully updated GrowYourList to ${GylVersion}\n`);

		// const DbTablePrefix = await generateTablePrefix();
		// const users = await createUsers(DbTablePrefix);
		// await createKeyPair();
		// const ApiAuthKey = await generateAuthKey();
		// const ApiAuthKeyHash = await hash(ApiAuthKey);
		// const LambdaBucketName = await uploadLambdaFunctions();
		// const outputs = await createCloudFormationStack({
		// 	LambdaBucketName,
		// 	GylEc2InstanceType,
		// 	ApiAuthKeyHash,
		// 	DbTablePrefix,
		// 	SesSourceEmail,
		// 	QueueUser: users.GylQueueUser,
		// 	BroadcastUser: users.GylBroadcastUser,
		// 	AdminEmail,
		// });
		// // Ses EventDestinations cannot be created in CloudFormation, so they're
		// // done separately here.
		// await setSesEventDestinations(outputs);
		// await populateDb(DbTablePrefix, SesSourceEmail, footerAddress);
		// const unsubscribeLink = `${outputs['GYL Public API Url']}${outputs['GYL Public API Stage']}/subscriber/unsubscribe?id={{subscriberId}}`;
		// await setEnvironmentVars(unsubscribeLink);
		// Logger.log(`EC2 Hostname: ${outputs['EC2 Hostname']}`);
		// Logger.log(
		// 	`GYL API URL: ${outputs['GYL Admin API Url']}${outputs['GYL Admin API Stage']}`
		// );
		// Logger.log(`GYL API Auth Key: ${ApiAuthKey}`);
	} catch (err) {
		console.error(err);
	}
};

module.exports = doUpdate;
