const { writeFileSync, readFileSync } = require('fs')
const { join } = require('path')

const shorthand = {
  'Autoresponder': {
    '_methods': {
      'POST': {
        'role': {
          'dependsOn': [ 'GylSettingsTable' ],
          'permissions': [
            {
              'actions': [ 'dynamodb:PutItem' ],
              'resourceName': 'GylSettingsTable',
            },
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-autoresponder-post-dist.zip',
          'description': 'Posts (creates or updates) an autoresponder',
          'env': {
            'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
          }
        }
      }
    },
  },
  'Subscriber': {
    '_methods': {
      'POST': {
        'role': {
          'dependsOn': [ 'GylSubscribersTable', 'GylQueueTable', 'GylSettingsTable' ],
          'permissions': [
            {
              'actions': [ 'ses:SendTemplatedEmail' ],
              'resource': '*',
            },
            {
              'actions': [ 'dynamodb:Query' ],
              'resourceName': 'GylSubscribersTable',
              'resourceNameSuffix': '/index/EmailToStatusIndex'
            },
            {
              'actions': [
                'dynamodb:GetItem',
                'dynamodb:PutItem'
              ],
              'resourceName': 'GylSubscribersTable',
            },
            {
              'actions': [
                'dynamodb:GetItem'
              ],
              'resourceName': 'GylSettingsTable'
            },
            {
              'actions': [
                'dynamodb:PutItem',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
              ],
              'resourceName': 'GylQueueTable'
            },
            {
              'actions': [ 'dynamodb:Query' ],
              'resourceName': 'GylQueueTable',
              'resourceNameSuffix': '/index/SubscriberIdIndex'
            }
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-subscriber-post-dist.zip',
          'description': 'Posts (create or update if email exists) a subscriber',
          'env': {
            'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
            'SOURCE_EMAIL': '!Ref SesSourceEmail',
          }
        }
      },
      'DELETE': {
        'role': {
          'dependsOn': [ 'GylSubscribersTable', 'GylQueueTable' ],
          'permissions': [
            {
              'actions': [ 'dynamodb:Query' ],
              'resourceName': 'GylSubscribersTable',
              'resourceNameSuffix': '/index/EmailToStatusIndex',
            },
            {
              'actions': [ 'dynamodb:Query' ],
              'resourceName': 'GylQueueTable',
              'resourceNameSuffix': '/index/SubscriberIdIndex'
            },
            {
              'actions': [ 'dynamodb:BatchWriteItem' ],
              'resourceName': 'GylQueueTable'
            },
            {
              'actions': [ 'dynamodb:DeleteItem' ],
              'resourceName': 'GylSubscribersTable',
            },
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-subscriber-delete-dist.zip',
          'description': 'Deletes a subscriber',
          'env': {
            'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
          }
        }
      }
    }
  },
}

const generatePermissionActionYaml = (action, indentSize) => {
  const indent = '  '.repeat(indentSize)
  const yaml = `${indent}- ${action}\n`
  return yaml
}

const generatePermissionYaml = (permission, indentSize = 7) => {
  const indent = '  '.repeat(indentSize)
  let yaml = `${indent}-
${indent}  Effect: Allow
${indent}  Action:
`
  permission['actions'].forEach(action => {
    yaml += generatePermissionActionYaml(action, indentSize + 2)
  });
  if (permission['resource']) {
    yaml += `${indent}  Resource: '${permission['resource']}'\n`
  }
  else if (permission['resourceName']) {
    if (permission['resourceNameSuffix']) {
      yaml += `${indent}  Resource:
${indent}    - !Join
${indent}      - ''
${indent}      - - !GetAtt
${indent}          - ${permission['resourceName']}
${indent}          - Arn
${indent}        - ${permission['resourceNameSuffix']}
`
    }
    else {
      yaml += `${indent}  Resource:
${indent}    - !GetAtt
${indent}      - ${permission['resourceName']}
${indent}      - Arn
`
    }
  }
  return yaml;
}

const generateRoleYaml = (methodName, def) => {
  let yaml = `  ${methodName}LambdaRole:
    Type: AWS::IAM::Role
    DependsOn:
`;
  def['dependsOn'].forEach(dep => {
    yaml += `      - ${dep}\n`
  })
  yaml += `    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          -
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        -
          PolicyName: ${methodName}LambdaPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
`
  def['permissions'].forEach(permission => {
    yaml += generatePermissionYaml(permission)
  })
  return yaml;
}

const generateLambdaYaml = (methodName, def) => {
  let yaml = `  ${methodName}Lambda:
    Type: AWS::Lambda::Function
    Properties:
      Code:
        S3Bucket: !Ref LambdaBucketName
        S3Key: ${def['zipfile']}
      Description: ${def['description']}
      FunctionName: ${methodName}
      Handler: index.handler
      Role: !GetAtt
        - ${methodName}LambdaRole
        - Arn
      Runtime: nodejs12.x
`
  if (def['env']) {
    yaml += `      Environment:
        Variables:
`
    Object.keys(def['env']).forEach(key => {
      yaml += `          ${key}: ${def['env'][key]}\n`
    })
  }
  return yaml
}

const generateLambdaPermissionYaml = methodName => {
  let yaml = `  ${methodName}Permission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:invokeFunction
      FunctionName: !GetAtt
        - ${methodName}Lambda
        - Arn
      Principal: apigateway.amazonaws.com
      SourceArn: !Join
        - ''
        - - 'arn:aws:execute-api:'
          - 
            Ref: AWS::Region
          - ':'
          -
            Ref: AWS::AccountId
          - ':'
          -
            Ref: GylApi
          - '/*'
`
  return yaml;
}

const generateResourceYaml = name => {
  let yaml = `  GylApi${name}Resource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId:
        Ref: GylApi
      ParentId: !Ref GylApiAdminResource
      PathPart: ${name.toLocaleLowerCase()}
`
  return yaml;
}

const generateOptionsYaml = (name, methods) => {
  let yaml = `  GylApi${name}Options:
    Type: AWS::ApiGateway::Method
    DependsOn:
      - GylApiEmptyModel
    Properties:
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      ApiKeyRequired: false
      RequestParameters: {}
      ResourceId:
        Ref: GylApi${name}Resource
      RestApiId:
        Ref: GylApi
      MethodResponses:
        -
          StatusCode: '200'
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false
          ResponseModels:
            application/json: GylApiEmptyModel
      Integration:
        Type: MOCK
        RequestTemplates:
          application/json: '{"statusCode": 200}'
        IntegrationResponses:
          -
            StatusCode: '200'
            ResponseParameters:
              method.response.header.Access-Control-Allow-Headers: >-
                'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Gyl-Auth-Key'
              method.response.header.Access-Control-Allow-Methods: >-
                '${methods.concat('OPTIONS').join(',')}'
              method.response.header.Access-Control-Allow-Origin: "'*'"
`
  return yaml;
}

const generateMethodYaml = (resourceName, methodName, method) => {
  let yaml = `  GylApi${methodName}:
    Type: AWS::ApiGateway::Method
    DependsOn:
      - Gyl${methodName}Permission
    Properties:
      HttpMethod: ${method}
      AuthorizationType: CUSTOM
      AuthorizerId: !Ref GylApiAuthorizer
      ApiKeyRequired: false
      RequestParameters: {}
      ResourceId:
        Ref: GylApi${resourceName}Resource
      RestApiId:
        Ref: GylApi
      MethodResponses:
        -
          StatusCode: '200'
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: false
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Join
          - ''
          - - 'arn:aws:apigateway:'
            -
              Ref: AWS::Region
            - :lambda:path/2015-03-31/functions/
            -
              !GetAtt
                - Gyl${methodName}Lambda
                - Arn
            - /invocations
        IntegrationResponses:
          -
            StatusCode: '200'
            ResponseParameters:
              method.response.header.Access-Control-Allow-Origin: "'*'"
`
  return yaml;
}

const generateYaml = def => {
  let yaml = '';
  Object.keys(def).forEach(resourceKey => {
    const resourceDef = def[resourceKey]
    Object.keys(resourceDef['_methods']).forEach(methodKey => {
      const methodNameShort = `${resourceKey}${methodKey.charAt(0)}${
        methodKey.substring(1).toLocaleLowerCase()
      }`
      const methodName = `Gyl${methodNameShort}`
      yaml += generateRoleYaml(
        methodName,
        resourceDef['_methods'][methodKey]['role'],
      );
      yaml += generateLambdaYaml(
        methodName,
        resourceDef['_methods'][methodKey]['func'],
      );
      yaml += generateLambdaPermissionYaml(
        methodName
      )
      yaml += generateMethodYaml(
        resourceKey,
        methodNameShort,
        methodKey,
      )
    })
    yaml += generateResourceYaml(resourceKey)
    yaml += generateOptionsYaml(
      resourceKey, Object.keys(resourceDef['_methods'])
    )
  })
  return yaml;
}

const outputYaml = generateYaml(shorthand)
writeFileSync('test-output.yaml', outputYaml)
let newTemplate = ''
let inGeneratedContent = false;
let generatedOpenPattern = /### BEGIN GENERATED PART/
let generatedClosePattern = /### END GENERATED PART/
readFileSync(join(__dirname, 'gyl-template.yaml')).toString('utf8').split('\n').forEach(line => {
  if (!inGeneratedContent) {
    newTemplate += line + '\n';
  }
  if (generatedOpenPattern.test(line)) {
    inGeneratedContent = true
    newTemplate += outputYaml
  }
  else if (generatedClosePattern.test(line)) {
    newTemplate += line + '\n'
    inGeneratedContent = false
  }
})
writeFileSync(join(__dirname, 'gyl-template-new.yaml'), newTemplate);
