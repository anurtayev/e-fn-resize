import { strict as assert } from "assert";
import S3 from "aws-sdk/clients/s3";
import convert from "heic-convert";
import sharp from "sharp";
import { number, object, string } from "yup";

const { log } = console;

const validationSchema = object({
  key: string().trim().lowercase().required(),
  width: number().required(),
  height: number().required(),
});

const s3 = new S3({
  apiVersion: "2006-03-01",
});

const mediaBucket = process.env.MEDIA_BUCKET;
assert(mediaBucket, "Bucket name environment variable is required");

const resizerBucket = process.env.RESIZER_BUCKET;
assert(resizerBucket, "Bucket name environment variable is required");

type InputEvent = {
  key: string;
  width: number;
  height: number;
};

export const handler = async (event: InputEvent, context) => {
  log({ event, context });

  if (!(await validationSchema.isValid(event))) {
    throw new Error("invalid input");
  }

  const { key, width, height } = event;

  const requiredKey = `${key}/${width}x${height}.jpeg`;

  const { Contents: contents } = await s3
    .listObjectsV2({
      Bucket: resizerBucket,
      Prefix: requiredKey,
    })
    .promise();

  let resizedBuffer;
  if (contents.length) {
    log("file already resized");

    resizedBuffer = await s3
      .getObject({
        Bucket: resizerBucket,
        Key: key,
      })
      .promise();

    return;
  } else {
    log("file was not resized previously");

    const { Body: imgBuffer } = await s3
      .getObject({
        Bucket: mediaBucket,
        Key: key,
      })
      .promise();

    log("downloaded file");

    const convertedBuffer = await convert({
      buffer: imgBuffer as Buffer,
      format: "JPEG",
      quality: 1,
    });

    log("converted file to JPEG");

    resizedBuffer = await sharp(convertedBuffer as Buffer)
      .resize(width, height)
      .toBuffer();

    await s3
      .putObject({
        Bucket: resizerBucket,
        Key: requiredKey,
        Body: resizedBuffer,
      })
      .promise();

    console.log("uploaded file");
  }

  return {
    statusCode: 200,
    isBase64Encoded: true,
    body: resizedBuffer.toString("base64"),
  };
};
