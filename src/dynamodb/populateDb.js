const getAWS = require('../getAWS')

const populateDb = async (dbTablePrefix, sourceEmail) => {
	const AWS = getAWS()
	const dyanmodb = new AWS.DynamoDB.DocumentClient();
	await dyanmodb.put({
		TableName: `${dbTablePrefix}Settings`,
		Item: {
			settingName: 'lists',
			value: [
				{
					id: 'list-default',
					name: 'Default',
					sourceEmail
				}
			]
		}
	}).promise()
}

module.exports = populateDb
