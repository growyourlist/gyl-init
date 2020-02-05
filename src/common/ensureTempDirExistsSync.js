const fs = require('fs')
const path = require('path')

const ensureTempDirExistsSync = (tempPath) => {
	const parts = path.normalize(tempPath).split(path.sep)
	let fullPath = ''
	parts.forEach((part, index) => {
		if (index === 0) {
			if (!fs.existsSync(part)) {
				throw new Error('The root directory should exist.')
			}
			const fileInfo = fs.lstatSync(part)
			if (!(fileInfo.isBlockDevice() || fileInfo.isCharacterDevice() ||
				fileInfo.isDirectory())) {
				throw new Error('The root directory should be a directory.')
			}
			fullPath = part
			return
		}
		fullPath = path.join(fullPath, part)
		if (fs.existsSync(fullPath)) {
			const fileInfo = fs.lstatSync(fullPath)
			if (!fileInfo.isDirectory()) {
				throw new Error(`Not a directory: ${fullPath}`)
			}
			return
		}
		fs.mkdirSync(fullPath)
	})
}

module.exports = ensureTempDirExistsSync
