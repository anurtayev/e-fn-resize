import { strict as assert } from "assert";
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import S3 from "aws-sdk/clients/s3";
import convert from "heic-convert";
import sharp from "sharp";

const s3 = new S3({
  apiVersion: "2006-03-01",
});

const mediaBucket = process.env.MEDIA_BUCKET;
assert(mediaBucket, "Bucket name environment variable is required");

const resizerBucket = process.env.RESIZER_BUCKET;
assert(resizerBucket, "Bucket name environment variable is required");

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
      Bucket: mediaBucket,
      Key: key,
    })
    .promise();

  const outputBuffer = await convert({
    buffer: imgBuffer as Buffer,
    format: "JPEG",
    quality: 1,
  });

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
