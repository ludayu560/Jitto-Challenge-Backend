const AWS = require('aws-sdk')
const auth = require('../utils/auth.js')

AWS.config.update({region: 'us-east-2'})

const util = require('../utils/util.js')
const bcrypt = require('bcryptjs')

const dynamodb = new AWS.DynamoDB.DocumentClient()
const usersTable = 'users'

async function login(user) { 
    const email = user.email
    const password = user.password
    if (!email || !password) {
        return util.buildResponse(401, {
            message: 'email and password are required in the body'
        })
    }


    // login error messages are vague on purpose to not give away too much info
    const dynamoUser = await getUser(email)
    if (!dynamoUser || !dynamoUser.email) {
        return util.buildResponse(403, {
            message: 'Login Failed'
        })
    }
    if (!bcrypt.compareSync(password, dynamoUser.password)) {
        return util.buildResponse(403, {
            message: 'Login Failed'
        })
    }

    const userInfo = {
        email: dynamoUser.email,
        name: dynamoUser.name,
    }

    const token = auth.generateToken(userInfo)

    const response = { 
        token: token,
        user: userInfo
    }

    return util.buildResponse(200, response)
}

async function getUser(email) {
    const params = {
        TableName: usersTable, 
        Key: {
            email: email.toLowerCase().trim()
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
        return response.Item
    }, (error) => {
        console.error('There was an error retrieving the user', error)
    })
}

module.exports.login = login