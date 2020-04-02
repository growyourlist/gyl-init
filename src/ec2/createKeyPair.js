const fs = require('fs')
const path = require('path')
const getAWS = require('../getAWS')
const AWS = getAWS()
const Logger = require('../Logger')
const { GylMainEc2KeyName } = require('../common/resourceNames')

const createKeyPair = async () => {
	const ec2 = new AWS.EC2()
	const GylKeyName = GylMainEc2KeyName
	let keyAlreadyExists = false
	Logger.info(`Creating key pair ${GylKeyName}...`)
	await new Promise(
		(resolve, reject) => ec2.createKeyPair({KeyName: GylKeyName}, (err, data) => {
			const gotKeyExistsError = err && (err.code === 'InvalidKeyPair.Duplicate')
			if (err && !gotKeyExistsError) {
				reject(err)
				return
			}
			if (gotKeyExistsError) {
				keyAlreadyExists = true
				Logger.info(`Key pair ${GylKeyName} already exists. If you have lost the `
					+ 'key file, you may need to re-create the stack.')
				resolve(data)
				return
			}
			const keyPath = path.resolve(`${GylKeyName}.pem`)
			fs.writeFileSync(keyPath, data.KeyMaterial)
			Logger.log(`Saved key in file: ./${GylKeyName}.pem`)
			Logger.log(
				'This key is used when connecting to your GrowYourList EC2 instance'
			)
			resolve(data)
		})
	);

	return new Promise((resolve, reject) => {
		ec2.waitFor('keyPairExists', {KeyNames: [GylKeyName]}, (err, data) => {
			if (err) {
				reject(err)
				return
			}
			if (!keyAlreadyExists) {
				Logger.info(`Key pair ${GylKeyName} created`)
			}
			resolve(data)
		})
	});
}

module.exports = createKeyPair
