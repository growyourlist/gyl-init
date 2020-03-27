const getAWS = require('../getAWS')
const AWS = getAWS()
const Logger = require('../Logger')

const StackName = "GrowYourList";
const dbStackName = 'GrowYourListDb';

const deleteCloudFormationStack = async () => {
	const cloudFormation = new AWS.CloudFormation()
	Logger.log(`Deleting CloudFormation stack ${StackName}. This process can `
	+ `take several minutes...`)
	await cloudFormation.deleteStack({ StackName }).promise()
	await cloudFormation.waitFor('stackDeleteComplete', { StackName }).promise()
	await cloudFormation.deleteStack({ StackName: dbStackName }).promise()
	await cloudFormation.waitFor('stackDeleteComplete', { StackName: dbStackName }).promise()
	Logger.info(`CloudFormation stack ${dbStackName} deleted`)
}

module.exports = deleteCloudFormationStack
