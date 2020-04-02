# Creating the template

## Getting the instance types

In the EC2 > New Instance wizard on the Choose an Instance Type step, I ran the following command in the console:

`[...document.querySelectorAll('.lx-J1C:nth-child(3)')].map(elm => elm.textContent.trim()).filter(txt => !!txt).map(txt => txt.split(' ')[0]).join(', ')`

It returned me a list of instance types which I could paste into the YAML file.

## Updating the lambda functions
Make the change in the `generate-admin-api-yaml.js` file, then use `node` to run the this file. It will generate new versions of the YAML files suffixed with `_new`. This compared with the current versions in a text comparison program (like WinMerge) and the changes merged into the yaml files as necessary.
