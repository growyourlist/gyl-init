const promisify = require('util').promisify
const AWS = require('../getAWS')()
const Logger = require('../Logger')
const tableDefinitions = require('./tableDefinitions')

const createTables = async (dbConfig = null) => {
	const dynamodb = new AWS.DynamoDB(dbConfig)
	const createTable = promisify(dynamodb.createTable).bind(dynamodb)
	const describeTable = promisify(dynamodb.describeTable).bind(dynamodb)

	const waitForTableExists = params => new Promise((resolve, reject) => {
		dynamodb.waitFor('tableExists', params, (err, data) => {
			if (err) {
				return reject(err)
			}
			return resolve(data)
		})
	})

	// Only one table with a secondary index can be created at a time. Therefore,
	// only create one table at a time.
	for (let i = 0; i < tableDefinitions.length; i++) {
		const tableDefinition = tableDefinitions[i];
		const { TableName } = tableDefinition
		try {
			Logger.info(`Checking for table: ${TableName}`)
			await describeTable({ TableName })
		}
		catch (err) {
			if (err.code === 'ResourceNotFoundException') {
				console.log(`Creating table: ${TableName}`)
				await createTable(tableDefinition)
				await waitForTableExists({ TableName })
			}
			else {
				throw err
			}
		}
	}
}

module.exports = createTables
