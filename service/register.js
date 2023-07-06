const AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-2'})

const util = require('../utils/util.js')
const bcrypt = require('bcryptjs')

const dynamodb = new AWS.DynamoDB.DocumentClient()
const usersTable = 'users'

async function register(userInfo) {
    const name = userInfo.name
    const email = userInfo.email
    const password = userInfo.password
    const username = userInfo.username

    // check if all required fields are present
    if (!name || !email || !password || !username) {
        return util.buildResponse(400, {
            message: 'name, email, password, and username are required in the body'
        })
    }

    // check if email already exists. email should be PK
    const dynamoUser = await getUser(email)
    if (dynamoUser && dynamoUser.email) {
        return util.buildResponse(400, {
            message: 'Email already exists, please use a different email'
        })
    }

    // encrypt password
    const encryptedPW = bcrypt.hashSync(password.trim(), 10)
    const user = {
        name: name,
        email: email.toLowerCase().trim(),
        password: encryptedPW,
        username: username,
    }

    // save user to dynamodb
    const saveUserResponse = await saveUser(user)
    if (!saveUserResponse) {
        return util.buildResponse(503, {
            message: 'There was an error saving the user. Please try again later'
        })
    }

    return util.buildResponse(200, { email: email })
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

async function saveUser(user) {
    const params = {
        TableName: usersTable,
        Item: user
    }
    return await dynamodb.put(params).promise().then((response) => {
        return true
    }, (error) => {
        console.error('There was an error saving the user', error)
    })
}

module.exports.register = register