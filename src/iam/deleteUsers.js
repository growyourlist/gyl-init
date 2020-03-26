const getAWS = require('../getAWS');
const Logger = require('../Logger');

const deleteUsers = async () => {
	const AWS = getAWS();
	const iam = new AWS.IAM();

	const deleteUser = async UserName => {
		let policiesResponse;
		try {
			// Delete any log in details
			Logger.info(`Deleting login profile: ${UserName}`);
			await iam.deleteLoginProfile({ UserName }).promise();
		} catch (err) {
			// Ignore errors if the profile does not exist.
			if (err.code !== 'NoSuchEntity') {
				throw err;
			}
			Logger.info(`Note: No login profile found for: ${UserName}`);
		}

		try {
			// Delete all access keys for the user
			Logger.info(`Deleting access keys: ${UserName}`);
			const keysResponse = await iam.listAccessKeys({ UserName }).promise();
			await Promise.all(
				keysResponse.AccessKeyMetadata.map(async keyData => {
					const { AccessKeyId } = keyData;
					await iam.deleteAccessKey({ UserName, AccessKeyId }).promise();
				})
			);
		} catch (err) {
			// Ignore errors if the profile does not exist.
			if (err.code !== 'NoSuchEntity') {
				throw err;
			}
			Logger.info(`Note: No login profile found for: ${UserName}`);
		}

		try {
			// Detach user policies
			Logger.info(`Detaching user policies: ${UserName}`);
			policiesResponse = await iam
				.listAttachedUserPolicies({ UserName })
				.promise();
			await Promise.all(
				policiesResponse.AttachedPolicies.map(async policy => {
					const { PolicyArn } = policy;
					await iam.detachUserPolicy({ UserName, PolicyArn }).promise();
				})
			);
		} catch (err) {
			// Ignore errors if the profile does not exist.
			if (err.code !== 'NoSuchEntity') {
				throw err;
			}
			Logger.info(`Note: No login profile found for: ${UserName}`);
		}

		try {
			// Delete the user
			Logger.info(`Deleting user: ${UserName}`);
			await iam.deleteUser({ UserName }).promise();
		} catch (err) {
			// Ignore errors if the profile does not exist.
			if (err.code !== 'NoSuchEntity') {
				throw err;
			}
			Logger.info(`Note: No login profile found for: ${UserName}`);
		}

		// Delete the policies
		if (policiesResponse && Array.isArray(policiesResponse.AttachedPolicies)) {
			await Promise.all(
				policiesResponse.AttachedPolicies.map(async policy => {
					const { PolicyArn, PolicyName } = policy;
					Logger.info(`Deleting policy: ${PolicyName}`);
					try {
						await iam.deletePolicy({ PolicyArn }).promise();
					} catch (err) {
						console.error(err);
					}
				})
			);
		}
	};

	Logger.log('Removing GYL users...');
	await deleteUser('GylQueueUser');
	await deleteUser('GylBroadcastUser');
};

module.exports = deleteUsers;
