const AWS = require('aws-sdk')

// Create default connection details for AWS API
module.exports = () => {
	AWS.config = new AWS.Config({
		region: process.env.AWS_REGION,
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	})
	return AWS;
}
