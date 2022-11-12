import { strict as assert } from "assert";
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import S3 from "aws-sdk/clients/s3";
import convert from "heic-convert";
import sharp from "sharp";

const s3 = new S3({
  apiVersion: "2006-03-01",
});

const bucketName = process.env.MEDIA_BUCKET;
assert(bucketName, "Bucket name environment variable is required");

const getParams = (event: APIGatewayProxyEventV2) => {
  const { queryStringParameters } = event;
  const { width, height, key } = queryStringParameters;
  assert(
    width && height && key,
    "Height and width query string parameters are required"
  );

  return { key, width: Number(width), height: Number(height) };
};

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  console.log({ event, context });

  const { key, width, height } = getParams(event);

  console.log({ key, width, height });

  const { Body: imgBuffer } = await s3
    .getObject({
      Bucket: bucketName,
      Key: key,
    })
    .promise();

  return {
    statusCode: 200,
    isBase64Encoded: true,
    body: (
      await sharp(imgBuffer as Buffer)
        .resize(width, height)
        .toBuffer()
    ).toString("base64"),
  };
};

async function run(buf) {
  const outputBuffer = await convert({
    buffer: buf, // the HEIC file buffer
    format: "JPEG", // output format
    quality: 1, // the jpeg compression quality, between 0 and 1
  });

  console.log("out.jpeg", outputBuffer);
}

console.log("==> 0");

const buf = s3.getObject({ Bucket: "", Key: "" });

console.log("==>", buf);

run(buf);
