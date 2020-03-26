const { randomBytes } = require('crypto')

const generateBucketId = () => {
	const bytes = randomBytes(16);
	return bytes.toString('hex').toLowerCase();
}

module.exports = generateBucketId
