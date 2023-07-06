const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });
const util = require("../utils/util.js");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = "orders";

async function orders(orderBody) {
  const orderId = `ORDER-${Date.now()}`;

  const params = {
    TableName: tableName,
    Item: {
      orderID: orderId,
      items: orderBody.items,
    },
  };

  const orderResponse = await dynamodb
    .put(params)
    .promise()
    .then(
      (response) => {
        return true;
      },
      (error) => {
        console.error("There was an error saving the order", error);
      }
    );

  if (!orderResponse) {
    return util.buildResponse(503, {
      message:
        "There was an error processing the order. Please try again later",
    });
  }

  return util.buildResponse(200, { orderID: orderId });
}

module.exports.orders = orders;
