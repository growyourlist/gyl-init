const loadConfig = require('./loadConfig');
const cryto = require('crypto');
const bcrypt = require('bcrypt');
const Logger = require('./Logger');
const validateSourceEmail = require('./ses/validateSourceEmail');
const getAdminEmail = require('./ses/getAdminEmail');
const setSesEventDestinations = require('./ses/setSesEventDestinations');
const createKeyPair = require('./ec2/createKeyPair');
const uploadLambdaFunctions = require('./s3/uploadLambdaFunctions');
const createCloudFormationStack = require('./cloudformation/createCloudFormationStack');
const populateDb = require('./dynamodb/populateDb');

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

const hash = async input => await bcrypt.hash(input, 10);

const init = async () => {
	try {
		console.log('\n### WELCOME TO GROW YOUR LIST (GYL) ###\n\n' +
		'This program will take you through the process of getting set up. ' +
		'It can take some time and requires some details from you.')
		if (!process.env.AWS_ACCESS_KEY_ID) {
			console.log('You will need an access key for an admin user, see: '
			+ 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html')
		}
		await loadConfig();
		const SesSourceEmail = await validateSourceEmail();
		const AdminEmail = await getAdminEmail();
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
			ApiAuthKeyHash,
			DbTablePrefix,
			SesSourceEmail,
			QueueUser: users.GylQueueUser,
			BroadcastUser: users.GylBroadcastUser,
			AdminEmail,
		});
		// Ses EventDestinations cannot be created in CloudFormation, so they're
		// done separately here.
		console.log(outputs);
		await setSesEventDestinations(outputs);
		await populateDb(DbTablePrefix, SesSourceEmail);
		Logger.log(`GYL API Auth Key: ${ApiAuthKey}`);
	} catch (err) {
		console.error(err);
	}
};

module.exports = init;
