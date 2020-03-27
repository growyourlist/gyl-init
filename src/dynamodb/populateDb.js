const getAWS = require('../getAWS')

const populateDb = async (dbTablePrefix, sourceEmail, postalAddress) => {
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
	}).promise();
	await dyanmodb.put({
		TableName: `${dbTablePrefix}Settings`,
		Item: {
			settingName: 'postalAddress',
			value: postalAddress,
		}
	}).promise();
}

module.exports = populateDb
