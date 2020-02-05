const promisify = require('util').promisify
const AWS = require('../getAWS')()
const Logger = require('../Logger')

const deleteUsers = async () => {
	const iam = new AWS.IAM()
	const deleteLoginProfile = promisify(iam.deleteLoginProfile).bind(iam)
	const listAccessKeys = promisify(iam.listAccessKeys).bind(iam)
	const deleteAccessKey = promisify(iam.deleteAccessKey).bind(iam)
	const listAttachedUserPolicies = promisify(iam.listAttachedUserPolicies).bind(iam)
	const detachUserPolicy = promisify(iam.detachUserPolicy).bind(iam)
	const deletePolicy = promisify(iam.deletePolicy).bind(iam)
	const deleteUser = promisify(iam.deleteUser).bind(iam)

	const UserName = 'gylQueueUser'

	// Delete any log in details
	Logger.info(`Deleting login profile: ${UserName}`)
	try {
		await deleteLoginProfile({ UserName })
	}
	catch (err) {
		// Ignore errors if the profile does not exist.
		if (err.code !== 'NoSuchEntity') {
			throw err
		}
		Logger.info(`Note: No login profile found for: ${UserName}`)
	}

	// Delete all access keys for the user
	Logger.info(`Deleting access keys: ${UserName}`)
	const keysResponse = await listAccessKeys({ UserName })
	await Promise.all(keysResponse.AccessKeyMetadata.map(async (keyData) => {
		const { AccessKeyId } = keyData
		await deleteAccessKey({ UserName, AccessKeyId })
	}))

	// Detach user policies
	Logger.info(`Detaching user policies: ${UserName}`)
	const policiesResponse = await listAttachedUserPolicies({ UserName })
	await Promise.all(policiesResponse.AttachedPolicies.map(async (policy) => {
		const { PolicyArn } = policy
		await detachUserPolicy({ UserName, PolicyArn })
	}))


	// Delete the user
	Logger.info(`Deleting user: ${UserName}`)
	await deleteUser({ UserName })

	// Delete the policies
	await Promise.all(policiesResponse.AttachedPolicies.map(async (policy) => {
		const { PolicyArn, PolicyName } = policy
		Logger.info(`Deleting policy: ${PolicyName}`)
		await deletePolicy({ PolicyArn })
	}))
}

module.exports = deleteUsers
