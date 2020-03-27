const { writeFileSync, readFileSync } = require('fs');
const { join } = require('path');

const adminApiShorthand = {
  Admin: {
    Analytics: {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylQueueTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-analytics-get-dist.zip',
            description: 'Gets email analytics',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    Autoresponder: {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:PutItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-autoresponder-post-dist.zip',
            description: 'Posts (creates or updates) an autoresponder',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-autoresponder-get-dist.zip',
            description: 'Gets an autoresponder',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
        DELETE: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:DeleteItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-autoresponder-delete-dist.zip',
            description: 'Deletes an autoresponder',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    Autoresponders: {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:Scan'],
                resource: '!Ref GylSettingsTableArn'
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-autoresponders-get-dist.zip',
            description: 'Gets a list of autoresponders',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    Broadcast: {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:GetTemplate'],
                resource: '*',
              },
              {
                actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-broadcast-post-dist.zip',
            description: 'Triggers a broadcast',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    'Email-History': {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-email-history-get-dist.zip',
            description: 'Gets the history of sent emails',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    List: {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-list-post-dist.zip',
            description: 'Posts a info about a new list',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
        DELETE: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-list-delete-dist.zip',
            description: 'Deletes info about a list',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    Lists: {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-lists-get-dist.zip',
            description: 'Gets the list of mailing lists',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    'Postal-Address': {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-postal-address-get-dist.zip',
            description: 'Gets the account postal address',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    'Single-Email-Send': {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:SendEmail'],
                resource: '*',
              },
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: ['dynamodb:PutItem', 'dynamodb:GetItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
              {
                actions: ['dynamodb:PutItem'],
                resource: '!Ref GylQueueTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-single-email-send-post-dist.zip',
            description: 'Sends a single email using given text and/or html',
            env: {
              SOURCE_EMAIL_ADDRESS: '!Ref SesSourceEmail',
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            },
          },
        },
      },
    },
    Subscriber: {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-subscriber-get-dist.zip',
            description: 'Gets the full subscriber',
            env: {
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            }
          }
        },
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:SendTemplatedEmail'],
                resource: '*',
              },
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
              {
                actions: [
                  'dynamodb:PutItem',
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                ],
                resource: '!Ref GylQueueTableArn',
              },
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylQueueTableArn',
                resourceNameSuffix: '/index/SubscriberIdIndex',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-subscriber-post-dist.zip',
            description:
              'Posts (create or update if email exists) a subscriber',
            env: {
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
              SOURCE_EMAIL: '!Ref SesSourceEmail',
            },
          },
        },
        DELETE: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylQueueTableArn',
                resourceNameSuffix: '/index/SubscriberIdIndex',
              },
              {
                actions: ['dynamodb:BatchWriteItem'],
                resource: '!Ref GylQueueTableArn',
              },
              {
                actions: ['dynamodb:DeleteItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-subscriber-delete-dist.zip',
            description: 'Deletes a subscriber',
            env: {
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            },
          },
        },
      },
      Queue: {
        _methods: {
          GET: {
            useAuthorizer: true,
            role: {
              permissions: [
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylSubscribersTableArn',
                  resourceNameSuffix: '/index/EmailToStatusIndex',
                },
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylQueueTableArn',
                  resourceNameSuffix: '/index/SubscriberIdIndex',
                },
                {
                  actions: ['dynamodb:BatchGetItem'],
                  resource: '!Ref GylQueueTableArn',
                },
              ],
            },
            func: {
              zipfile: 'gyl-admin-subscriber-queue-get-dist.zip',
              description: 'Gets a subscribers queued items',
              env: {
                DB_TABLE_PREFIX: '!Ref DbTablePrefix',
              },
            },
          },
        },
      },
      Status: {
        _methods: {
          GET: {
            useAuthorizer: true,
            role: {
              permissions: [
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylSubscribersTableArn',
                  resourceNameSuffix: '/index/EmailToStatusIndex',
                },
              ],
            },
            func: {
              zipfile: 'gyl-admin-subscriber-status-get-dist.zip',
              description:
                'Gets the status of a subscriber (subscriberId, email, unsubscribed, confirmed, tags)',
              env: {
                DB_TABLE_PREFIX: '!Ref DbTablePrefix',
              },
            },
          },
        },
      },
      Tag: {
        _methods: {
          POST: {
            useAuthorizer: true,
            role: {
              permissions: [
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylSubscribersTableArn',
                  resourceNameSuffix: '/index/EmailToStatusIndex',
                },
                {
                  actions: ['dynamodb:UpdateItem'],
                  resource: '!Ref GylSubscribersTableArn',
                },
              ],
            },
            func: {
              zipfile: 'gyl-admin-subscriber-tag-post-dist.zip',
              description: 'Adds a tag to a subscriber.',
              env: {
                DB_TABLE_PREFIX: '!Ref DbTablePrefix',
              },
            },
          },
        },
      },
      Untag: {
        _methods: {
          POST: {
            useAuthorizer: true,
            role: {
              permissions: [
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylSubscribersTableArn',
                  resourceNameSuffix: '/index/EmailToStatusIndex',
                },
                {
                  actions: ['dynamodb:UpdateItem'],
                  resource: '!Ref GylSubscribersTableArn',
                },
              ],
            },
            func: {
              zipfile: 'gyl-admin-subscriber-untag-post-dist.zip',
              description: 'Removes a tag from a subscriber.',
              env: {
                DB_TABLE_PREFIX: '!Ref DbTablePrefix',
              },
            },
          },
        },
      },
      Unsubscribe: {
        _methods: {
          POST: {
            useAuthorizer: true,
            role: {
              permissions: [
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylSubscribersTableArn',
                  resourceNameSuffix: '/index/EmailToStatusIndex',
                },
                {
                  actions: ['dynamodb:UpdateItem'],
                  resource: '!Ref GylSubscribersTableArn',
                },
                {
                  actions: ['dynamodb:Query'],
                  resource: '!Ref GylQueueTableArn',
                  resourceNameSuffix: '/index/SubscriberIdIndex',
                },
                {
                  actions: ['dynamodb:BatchWriteItem'],
                  resource: '!Ref GylQueueTableArn',
                },
              ],
            },
            func: {
              zipfile: 'gyl-admin-subscriber-unsubscribe-post-dist.zip',
              description: 'Unsubscribes a subscriber',
              env: {
                DB_TABLE_PREFIX: '!Ref DbTablePrefix',
              },
            },
          },
        },
      },
    },
    Subscribers: {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: [ 'dynamodb:Query' ],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: [ 'dynamodb:BatchWriteItem' ],
                resource: '!Ref GylSubscribersTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-subscribers-post-dist.zip',
            description:
              'Posts multiple subscribers (between 1 and 25 subscribers inclusive)',
            env: {
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            },
          },
        },
      },
    },
    'Subscriber-Count': {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:PutItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-subscriber-count-post-dist.zip',
            description: 'Triggers a count of subscribers',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-subscriber-count-get-dist.zip',
            description: 'Gets the status of the subscriber count',
            env: { DB_TABLE_PREFIX: '!Ref DbTablePrefix' },
          },
        },
      },
    },
    Template: {
      _methods: {
        POST: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:CreateTemplate', 'ses:UpdateTemplate'],
                resource: '*',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-template-post-dist.zip',
            description: 'Posts (creates or updates) an email template.',
          },
        },
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:GetTemplate'],
                resource: '*',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-template-get-dist.zip',
            description: 'Gets an email template.',
          },
        },
        DELETE: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:DeleteTemplate'],
                resource: '*',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-template-delete-dist.zip',
            description: 'Deletes an email template.',
          },
        },
      },
    },
    Templates: {
      _methods: {
        GET: {
          useAuthorizer: true,
          role: {
            permissions: [
              {
                actions: ['ses:ListTemplates'],
                resource: '*',
              },
            ],
          },
          func: {
            zipfile: 'gyl-admin-templates-get-dist.zip',
            description: 'Gets a list of meta info about templates.',
          },
        },
      },
    },
  },
};

const publicApiShorthand = {
  Subscriber: {
    Confirm: {
      _methods: {
        GET: {
          useAuthorizer: false,
          role: {
            permissions: [
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
              {
                actions: ['dynamodb:UpdateItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
              {
                actions: ['dynamodb:Settings'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-public-subscriber-confirm-get-dist.zip',
            description: 'Confirms a subscriber in response to link click',
            env: {
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            },
          },
        },
      },
    },
    Unsubscribe: {
      _methods: {
        GET: {
          useAuthorizer: false,
          role: {
            permissions: [
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: ['dynamodb:UpdateItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
              {
                actions: ['dynamodb:GetItem'],
                resource: '!Ref GylSettingsTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-public-subscriber-unsubscribe-get-dist.zip',
            description: 'Gets a public unsubscribe request',
            env: {
              PUBLIC_API: `!Join
  - ''
  - - https://
    -
      Ref: GylPublicApi
    - .execute-api.
    -
      Ref: AWS::Region
    - .amazonaws.com/
    - beta`,
              GLOBAL_UNSUBSCRIBE_URL: 'https://www.growyourlist.com/unsubscribe/',
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            },
          },
        },
        POST: {
          useAuthorizer: false,
          role: {
            permissions: [
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylSubscribersTableArn',
                resourceNameSuffix: '/index/EmailToStatusIndex',
              },
              {
                actions: ['dynamodb:UpdateItem'],
                resource: '!Ref GylSubscribersTableArn',
              },
              {
                actions: ['dynamodb:Query'],
                resource: '!Ref GylQueueTableArn',
                resourceNameSuffix: '/index/SubscriberIdIndex',
              },
              {
                actions: ['dynamodb:BatchWriteItem'],
                resource: '!Ref GylQueueTableArn',
              },
            ],
          },
          func: {
            zipfile: 'gyl-public-subscriber-unsubscribe-post-dist.zip',
            description: 'Posts a public unsubscribe request',
            env: {
              DB_TABLE_PREFIX: '!Ref DbTablePrefix',
            },
          },
        },
      },
    },
  },
};

const generatePermissionActionYaml = (action, indentSize) => {
  const indent = '  '.repeat(indentSize);
  const yaml = `${indent}- ${action}\n`;
  return yaml;
};

const generatePermissionYaml = (permission, indentSize = 7) => {
  const indent = '  '.repeat(indentSize);
  let yaml = `${indent}-
${indent}  Effect: Allow
${indent}  Action:
`;
  permission['actions'].forEach(action => {
    yaml += generatePermissionActionYaml(action, indentSize + 2);
  });
  if (permission['resource']) {
    if (permission['resourceNameSuffix']) {
      yaml += `${indent}  Resource:
${indent}    - !Join
${indent}      - ''
${indent}      - - ${permission['resource']}
${indent}        - ${permission['resourceNameSuffix']}
`
    }
    else {
      yaml += `${indent}  Resource: ${permission['resource'] === '*' ? "'*'" : permission['resource']}\n`;
    }
  } else if (permission['resourceName']) {
    if (permission['resourceNameSuffix']) {
      yaml += `${indent}  Resource:
${indent}    - !Join
${indent}      - ''
${indent}      - - !GetAtt
${indent}          - ${permission['resourceName']}
${indent}          - Arn
${indent}        - ${permission['resourceNameSuffix']}
`;
    } else {
      yaml += `${indent}  Resource:
${indent}    - !GetAtt
${indent}      - ${permission['resourceName']}
${indent}      - Arn
`;
    }
  }
  return yaml;
};

const generateRoleYaml = (methodName, def) => {
  let yaml = `  ${methodName}LambdaRole:
    Type: AWS::IAM::Role
`;
  if (def['dependsOn'] && def['dependsOn'].length) {
    yaml += `    DependsOn:
`;
    def['dependsOn'].forEach(dep => {
      yaml += `      - ${dep}\n`;
    });
  }
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
`;
  def['permissions'].forEach(permission => {
    yaml += generatePermissionYaml(permission);
  });
  return yaml;
};

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
`;
  if (def['env']) {
    yaml += `      Environment:
        Variables:
`;
    Object.keys(def['env']).forEach(key => {
      const baseIndent = '          ';
      if (def['env'][key].indexOf('\n') >= 0) {
        def['env'][key].split('\n').forEach((line, index) => {
          if (index === 0) {
            yaml += `${baseIndent}${key}: ${line}\n`;
          }
          else {
            yaml += `${baseIndent}${line}\n`
          }
        });
      }
      else {
        yaml += `${baseIndent}${key}: ${def['env'][key]}\n`;
      }
    });
  }
  return yaml;
};

const generateLambdaPermissionYaml = (methodName, apiBaseId) => {
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
            Ref: ${apiBaseId}
          - '/*'
`;
  return yaml;
};

const generateResourceYaml = (name, parentInfo, apiBaseId) => {
  let realName = name;
  let resource = `${apiBaseId}Resource`;
  let parentId = '';
  if (parentInfo.name) {
    realName = name.substring(parentInfo.name.length);
    resource = `${apiBaseId}${parentInfo.name}Resource`;
    parentId = `!Ref ${resource}`;
  }
  else {
    parentId = `!GetAtt
        - ${apiBaseId}
        - RootResourceId`
  }
  let yaml = `  ${apiBaseId}${name.replace(/-/g, '')}Resource:
    Type: AWS::ApiGateway::Resource
    Properties:
      RestApiId:
        Ref: ${apiBaseId}
      ParentId: ${parentId}
      PathPart: ${realName.toLocaleLowerCase()}
`;
  return yaml;
};

const generateOptionsYaml = (name, methods, apiBaseId) => {
  let yaml = `  ${apiBaseId}${name}Options:
    Type: AWS::ApiGateway::Method
    DependsOn:
      - ${apiBaseId}EmptyModel
    Properties:
      HttpMethod: OPTIONS
      AuthorizationType: NONE
      ApiKeyRequired: false
      RequestParameters: {}
      ResourceId:
        Ref: ${apiBaseId}${name}Resource
      RestApiId:
        Ref: ${apiBaseId}
      MethodResponses:
        -
          StatusCode: '200'
          ResponseParameters:
            method.response.header.Access-Control-Allow-Headers: false
            method.response.header.Access-Control-Allow-Methods: false
            method.response.header.Access-Control-Allow-Origin: false
          ResponseModels:
            application/json: ${apiBaseId}EmptyModel
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
`;
  return yaml;
};

const generateMethodYaml = (resourceName, methodName, method, useAuthorizer, apiBaseId) => {
  if (typeof useAuthorizer !== 'boolean') {
    console.warn(`Authorizer is not boolean ${resourceName} ${methodName} ${method}`)
  }
  let authorizer = '';
  if (useAuthorizer) {
    authorizer = `AuthorizationType: CUSTOM
      AuthorizerId: !Ref ${apiBaseId}Authorizer`;
  }
  else {
    authorizer = `AuthorizationType: NONE`;
  }
  let yaml = `  ${apiBaseId}${methodName}:
    Type: AWS::ApiGateway::Method
    DependsOn:
      - Gyl${methodName}Permission
    Properties:
      HttpMethod: ${method}
      ${authorizer}
      ApiKeyRequired: false
      RequestParameters: {}
      ResourceId:
        Ref: ${apiBaseId}${resourceName}Resource
      RestApiId:
        Ref: ${apiBaseId}
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
`;
  return yaml;
};

const generateYaml = (def, apiBaseId, parentInfo = { name: '' }) => {
  let yaml = '';
  Object.keys(def)
    .filter(k => k !== '_methods')
    .forEach(resourceKey => {
      const resourceDef = def[resourceKey];
      const resourceName = `${parentInfo.name}${resourceKey}`;
      if (typeof resourceDef['_methods'] === 'object') {
        Object.keys(resourceDef['_methods']).forEach(methodKey => {
          const methodNameShort = `${resourceName}${methodKey.charAt(
            0
          )}${methodKey.substring(1).toLocaleLowerCase()}`;
          const methodName = `Gyl${methodNameShort.replace(/-/g, '')}`;
          yaml += generateRoleYaml(
            methodName,
            resourceDef['_methods'][methodKey]['role']
          );
          yaml += generateLambdaYaml(
            methodName,
            resourceDef['_methods'][methodKey]['func']
          );
          yaml += generateLambdaPermissionYaml(methodName, apiBaseId);
          yaml += generateMethodYaml(
            resourceName.replace(/-/g, ''),
            methodNameShort.replace(/-/g, ''),
            methodKey,
            resourceDef['_methods'][methodKey]['useAuthorizer'],
            apiBaseId,
          );
        });
        yaml += generateOptionsYaml(
          resourceName.replace(/-/g, ''),
          Object.keys(resourceDef['_methods']),
          apiBaseId,
        );
      }
      yaml += generateResourceYaml(resourceName, parentInfo, apiBaseId);
      const subResources = Object.keys(resourceDef).filter(
        k => k !== '_methods'
      );
      if (subResources.length) {
        yaml += generateYaml(resourceDef, apiBaseId, {
          name: parentInfo.name + resourceKey,
        });
      }
    });
  return yaml;
};

const adminApiYaml = generateYaml(adminApiShorthand, 'GylAdminApi');
const publicApiYaml = generateYaml(publicApiShorthand, 'GylPublicApi');

let newAdminTemplate = '';
let newMainTemplate = '';
let inGeneratedContent = false;
let generatedAdminApiBeginPattern = /### BEGIN ADMIN API GENERATED PART/;
let generatedAdminApiEndPattern = /### END ADMIN API GENERATED PART/;
let generatedPublicApiBeginPattern = /### BEGIN PUBLIC API GENERATED PART/;
let generatedPublicApiEndPattern = /### END PUBLIC API GENERATED PART/;

readFileSync(join(__dirname, 'gyl-template-admin-api.yaml'))
  .toString('utf8')
  .split('\n')
  .forEach(line => {
    if (!inGeneratedContent) {
      newAdminTemplate += line + '\n';
    }
    if (generatedAdminApiBeginPattern.test(line)) {
      inGeneratedContent = true;
      newAdminTemplate += adminApiYaml;
    } else if (generatedAdminApiEndPattern.test(line)) {
      newAdminTemplate += line + '\n';
      inGeneratedContent = false;
    }
  });
writeFileSync(
  join(__dirname, 'gyl-template-admin-api-new.yaml'),
  newAdminTemplate.trimRight() + '\n'
);

readFileSync(join(__dirname, 'gyl-template.yaml'))
  .toString('utf8')
  .split('\n')
  .forEach(line => {
    if (!inGeneratedContent) {
      newMainTemplate += line + '\n';
    }
    if (generatedPublicApiBeginPattern.test(line)) {
      inGeneratedContent = true;
      newMainTemplate += publicApiYaml;
    } else if (generatedPublicApiEndPattern.test(line)) {
      newMainTemplate += line + '\n';
      inGeneratedContent = false;
    }
  });
writeFileSync(
  join(__dirname, 'gyl-template-new.yaml'),
  newMainTemplate.trimRight() + '\n'
);
