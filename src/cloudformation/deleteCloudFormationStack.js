const getAWS = require('../getAWS')
const AWS = getAWS()
const Logger = require('../Logger')

const StackName = "GrowYourList";

const deleteCloudFormationStack = async () => {
	const cloudFormation = new AWS.CloudFormation()
	Logger.log(`Deleting CloudFormation stack ${StackName}. This process can `
	+ `take several minutes...`)
	await cloudFormation.deleteStack({ StackName }).promise()
	await cloudFormation.waitFor('stackDeleteComplete', { StackName }).promise()
	Logger.info(`CloudFormation stack ${StackName} deleted`)
}

module.exports = deleteCloudFormationStack
