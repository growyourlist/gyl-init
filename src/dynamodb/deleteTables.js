const promisify = require('util').promisify
const AWS = require('../getAWS')()
const Logger = require('../Logger')
const tableDefinitions = require('./tableDefinitions')

const deleteTables = async () => {
	const dynamodb = new AWS.DynamoDB()
	const deleteTable = promisify(dynamodb.deleteTable).bind(dynamodb)

	await Promise.all(tableDefinitions.map(async (tableDefinition) => {
		const { TableName } = tableDefinition
		Logger.info(`Deleting table: ${TableName}`)
		await deleteTable({ TableName })
	}))
}

module.exports = deleteTables
