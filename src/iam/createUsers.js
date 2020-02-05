const util = require('util')
const AWS = require('../getAWS')()
const Logger = require('../Logger')
const { promisify } = util
const accountId = process.env.AWS_ACCOUNT_ID

const createUsers = async () => {
	const iam = new AWS.IAM()
	const createUser = promisify(iam.createUser).bind(iam)
	const createPolicy = promisify(iam.createPolicy).bind(iam)
	const attachUserPolicy = promisify(iam.attachUserPolicy).bind(iam)
	const createAccessKey = promisify(iam.createAccessKey).bind(iam)

	// Create a new user.
	const UserName = 'gylQueueUser'
	Logger.info(`Creating user: ${UserName}`)
	await createUser({ UserName })

	// Create a the permissions policy for the user.
	Logger.info(`Creating policy: ${'gylQueueUserPolicy'}`)
	const policyResponse = await createPolicy({
		PolicyName: 'gylQueueUserPolicy',
		Description: 'A policy granting all required permissions to run the GYL queue',
		PolicyDocument: JSON.stringify({
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "VisualEditor0",
					"Effect": "Allow",
					"Action": [
						"dynamodb:BatchGetItem",
						"ses:SendTemplatedEmail",
						"dynamodb:BatchWriteItem",
						"dynamodb:PutItem",
						"dynamodb:DescribeTable",
						"dynamodb:DeleteItem",
						"dynamodb:GetItem",
						"ses:SendBulkTemplatedEmail",
						"dynamodb:Scan",
						"dynamodb:Query",
						"dynamodb:UpdateItem"
					],
					"Resource": "*"
				}
			]
		})
	})
		.catch(err => {
			if (err.code === 'EntityAlreadyExists') {
				return {
					Policy: {
						Arn:
							`arn:aws:iam::${
							accountId
							}:policy/gylQueueUserPolicy`
					}
				}
			}
			throw err
		})

	// Attach the permissions policy to the user.
	Logger.info(`Attaching policy ${'gylQueueUserPolicy'} to ${UserName}`)
	await attachUserPolicy({
		UserName,
		PolicyArn: policyResponse.Policy.Arn
	})

	// Generate access keys for the user
	Logger.info(`Generating access keys for ${UserName}`)
	await createAccessKey({ UserName })
	// const accessKey = await createAccessKey({ UserName })
}

module.exports = createUsers
