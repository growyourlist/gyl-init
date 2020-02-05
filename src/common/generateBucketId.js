const { randomBytes } = require('crypto')

const generateBucketId = () => {
	const bytes = randomBytes(8);
	return bytes.toString('hex').toLowerCase();
}

module.exports = generateBucketId
