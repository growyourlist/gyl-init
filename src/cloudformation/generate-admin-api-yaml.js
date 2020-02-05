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
      },
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
      },
    },
    'Queue': {
      '_methods': {
        'GET': {
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
                'actions': [ 'dynamodb:BatchGetItem' ],
                'resourceName': 'GylQueueTable'
              },
            ]
          },
          'func': {
            'zipfile': 'gyl-admin-subscriber-queue-get-dist.zip',
            'description': 'Gets a subscribers queued items',
            'env': {
              'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
            }
          }
        },
      },
    },
    'Status': {
      '_methods': {
        'GET': {
          'role': {
            'dependsOn': [ 'GylSubscribersTable' ],
            'permissions': [
              {
                'actions': [ 'dynamodb:Query' ],
                'resourceName': 'GylSubscribersTable',
                'resourceNameSuffix': '/index/EmailToStatusIndex',
              },
            ]
          },
          'func': {
            'zipfile': 'gyl-admin-subscriber-status-get-dist.zip',
            'description': 'Gets the status of a subscriber (subscriberId, email, unsubscribed, confirmed, tags)',
            'env': {
              'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
            }
          }
        },
      },
    },
    'Tag': {
      '_methods': {
        'POST': {
          'role': {
            'dependsOn': [ 'GylSubscribersTable' ],
            'permissions': [
              {
                'actions': [ 'dynamodb:Query' ],
                'resourceName': 'GylSubscribersTable',
                'resourceNameSuffix': '/index/EmailToStatusIndex'
              },
              {
                'actions': [ 'dynamodb:UpdateItem' ],
                'resourceName': 'GylSubscribersTable',
              },
            ]
          },
          'func': {
            'zipfile': 'gyl-admin-subscriber-tag-post-dist.zip',
            'description': 'Adds a tag to a subscriber.',
            'env': {
              'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
            }
          }
        },
      }
    },
    'Untag': {
      '_methods': {
        'POST': {
          'role': {
            'dependsOn': [ 'GylSubscribersTable' ],
            'permissions': [
              {
                'actions': [ 'dynamodb:Query' ],
                'resourceName': 'GylSubscribersTable',
                'resourceNameSuffix': '/index/EmailToStatusIndex'
              },
              {
                'actions': [ 'dynamodb:UpdateItem' ],
                'resourceName': 'GylSubscribersTable',
              },
            ]
          },
          'func': {
            'zipfile': 'gyl-admin-subscriber-untag-post-dist.zip',
            'description': 'Removes a tag from a subscriber.',
            'env': {
              'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
            }
          }
        },
      }
    },
    'Unsubscribe': {
      '_methods': {
        'POST': {
          'role': {
            'dependsOn': [ 'GylSubscribersTable', 'GylQueueTable' ],
            'permissions': [
              {
                'actions': [ 'dynamodb:Query' ],
                'resourceName': 'GylSubscribersTable',
                'resourceNameSuffix': '/index/EmailToStatusIndex'
              },
              {
                'actions': [ 'dynamodb:UpdateItem' ],
                'resourceName': 'GylSubscribersTable',
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
            ]
          },
          'func': {
            'zipfile': 'gyl-admin-subscriber-unsubscribe-post-dist.zip',
            'description': 'Unsubscribes a subscriber',
            'env': {
              'DB_TABLE_PREFIX': '!Ref DbTablePrefix',
            }
          }
        },
      }
    }
  },
  'Template': {
    '_methods': {
      'POST': {
        'role': {
          'dependsOn': [],
          'permissions': [
            {
              'actions': [ 'ses:CreateTemplate', 'ses:UpdateTemplate' ],
              'resources': '*'
            }
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-template-post-dist.zip',
          'description': 'Posts (creates or updates) an email template.',
        }
      },
      'GET': {
        'role': {
          'dependsOn': [],
          'permissions': [
            {
              'actions': [ 'ses:GetTemplate' ],
              'resources': '*',
            }
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-template-get-dist.zip',
          'description': 'Gets an email template.',
        }
      },
      'DELETE': {
        'role': {
          'dependsOn': [],
          'permissions': [
            {
              'actions': [ 'ses:DeleteTemplate' ],
              'resources': '*',
            }
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-template-delete-dist.zip',
          'description': 'Deletes an email template.',
        }
      }
    }
  },
  'Templates': {
    '_methods': {
      'GET': {
        'role': {
          'dependsOn': [],
          'permissions': [
            {
              'actions': [ 'ses:ListTemplates' ],
              'resources': '*',
            }
          ]
        },
        'func': {
          'zipfile': 'gyl-admin-templates-get-dist.zip',
          'description': 'Gets a list of meta info about templates.',
        }
      },
    }
  }
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
              -
                Effect: Allow
                Action: logs:CreateLogGroup
                Resource: !Join
                  - ''
                  - - 'arn:aws:logs:'
                    - 
                      Ref: AWS::Region
                    - ':'
                    -
                      Ref: AWS::AccountId
                    - ':*'
              -
                Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Join
                  - ''
                  - - 'arn:aws:logs:'
                    - 
                      Ref: AWS::Region
                    - ':'
                    -
                      Ref: AWS::AccountId
                    - ':log-group:/aws/lambda/${methodName}:*'
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

const generateResourceYaml = (name, parentInfo) => {
  let realName = name
  let resource = 'GylApiAdminResource'
  if (parentInfo.name) {
    realName = name.substring(parentInfo.name.length)
    resource = `GylApi${parentInfo.name}Resource`
  }
  let yaml = `  GylApi${name}Resource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId:
        Ref: GylApi
      ParentId: !Ref ${resource}
      PathPart: ${realName.toLocaleLowerCase()}
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

const generateYaml = (def, parentInfo = {name: '', resource: ''}) => {
  let yaml = '';
  Object.keys(def).filter(k => k !== '_methods').forEach(resourceKey => {
    const resourceDef = def[resourceKey]
    const resourceName = `${parentInfo.name}${resourceKey}`
    Object.keys(resourceDef['_methods']).forEach(methodKey => {
      const methodNameShort = `${resourceName}${methodKey.charAt(0)}${
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
        resourceName,
        methodNameShort,
        methodKey,
      )
    })
    yaml += generateResourceYaml(resourceName, parentInfo)
    yaml += generateOptionsYaml(
      resourceName, Object.keys(resourceDef['_methods'])
    )
    const subResources = Object.keys(resourceDef).filter(k => k !== '_methods')
    if (subResources.length) {
      yaml += generateYaml(resourceDef, {
        name: resourceKey,
      })
    }
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
