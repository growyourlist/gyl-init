const loadConfig = require('./loadConfig');
const cryto = require('crypto');
const bcrypt = require('bcrypt');
const Logger = require('./Logger');
const getSesSourceEmail = require('./ses/getSesSourceEmail');
const getAdminEmail = require('./ses/getAdminEmail');
const setSesEventDestinations = require('./ses/setSesEventDestinations');
const createKeyPair = require('./ec2/createKeyPair');
const uploadLambdaFunctions = require('./s3/uploadLambdaFunctions');
const createCloudFormationStack = require('./cloudformation/createCloudFormationStack');
const populateDb = require('./dynamodb/populateDb');
const getPostalAddress = require('./other/getPostalAddress');
const setEnvironmentVars = require('./lambda/setEnvironmentVars');
const getEc2InstanceType = require('./ec2/getEc2InstaceType');

const createUsers = require('./iam/createUsers');

const generateAuthKey = async () => {
	return cryto.randomBytes(24).toString('hex');
};

const generateTablePrefix = async () => {
	// Maybe do random prefixes?
	// const charSource = 'abcdefghijklmnopqrstuvwxyz1234567890'
	// const randomArray = [...Array(3)].map(() => charSource[
	// 	Math.floor(Math.random() * charSource.length)
	// ])
	// randomArray[0] = randomArray[0].toLocaleUpperCase()
	// return `Gyl_${randomArray.join('')}_`
	return `Gyl_`;
};

const hash = async input => {
	return await bcrypt.hash(input, 10);
}

const init = async () => {
	try {
		console.log('\n### WELCOME TO GROW YOUR LIST (GYL) ###\n\n' +
		'This program will take you through the process of getting set up. ' +
		'It can take some time and requires some details from you.')
		await loadConfig();
		const SesSourceEmail = await getSesSourceEmail();
		const AdminEmail = await getAdminEmail();
		const Ec2InstanceType = await getEc2InstanceType();
		const footerAddress = await getPostalAddress();
		console.log('\n## Uploading GYL Software ##\n' +
			'Thanks for entering the details, GYL will now be uploaded to your AWS ' +
			'account. This can take some time.\n');
		const DbTablePrefix = await generateTablePrefix();
		const users = await createUsers(DbTablePrefix);
		await createKeyPair();
		const ApiAuthKey = await generateAuthKey();
		const ApiAuthKeyHash = await hash(ApiAuthKey);
		const LambdaBucketName = await uploadLambdaFunctions();
		const outputs = await createCloudFormationStack({
			LambdaBucketName,
			Ec2InstanceType,
			ApiAuthKeyHash,
			DbTablePrefix,
			SesSourceEmail,
			QueueUser: users.GylQueueUser,
			BroadcastUser: users.GylBroadcastUser,
			AdminEmail,
		});
		// Ses EventDestinations cannot be created in CloudFormation, so they're
		// done separately here.
		await setSesEventDestinations(outputs);
		await populateDb(DbTablePrefix, SesSourceEmail, footerAddress);
		const unsubscribeLink = `${outputs['GYL Public API Url']}${outputs['GYL Public API Stage']}/subscriber/unsubscribe?id={{subscriberId}}`;
		await setEnvironmentVars(unsubscribeLink);
		Logger.log(`EC2 Hostname: ${outputs['EC2 Hostname']}`);
		Logger.log(`GYL API URL: ${outputs['GYL Admin API Url']}${outputs['GYL Admin API Stage']}`);
		Logger.log(`GYL API Auth Key: ${ApiAuthKey}`);
	} catch (err) {
		console.error(err);
	}
};

module.exports = init;
