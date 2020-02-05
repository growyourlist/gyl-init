const fs = require('fs')
const path = require('path')
const getAWS = require('../getAWS')
const AWS = getAWS()
const Logger = require('../Logger')
const { GylEc2MainKeyName } = require('../common/resourceNames')

const createKeyPair = async () => {
	const ec2 = new AWS.EC2()
	const KeyName = GylEc2MainKeyName
	let keyAlreadyExists = false
	Logger.info(`Creating key pair ${KeyName}...`)
	await new Promise(
		(resolve, reject) => ec2.createKeyPair({KeyName}, (err, data) => {
			const gotKeyExistsError = err && (err.code === 'InvalidKeyPair.Duplicate')
			if (err && !gotKeyExistsError) {
				reject(err)
				return
			}
			if (gotKeyExistsError) {
				keyAlreadyExists = true
				Logger.info(`Key pair ${KeyName} already exists. If you have lost the `
					+ 'key file, you may need to re-create the stack.')
				resolve(data)
				return
			}
			const keyPath = path.resolve(`${KeyName}.pem`)
			fs.writeFileSync(keyPath, data.KeyMaterial)
			Logger.info(`Saved key in file: ${keyPath}`)
			resolve(data)
		})
	);

	return new Promise((resolve, reject) => {
		ec2.waitFor('keyPairExists', {KeyNames: [KeyName]}, (err, data) => {
			if (err) {
				reject(err)
				return
			}
			if (!keyAlreadyExists) {
				Logger.info(`Key pair ${KeyName} created`)
			}
			resolve(data)
		})
	});
}

module.exports = createKeyPair
