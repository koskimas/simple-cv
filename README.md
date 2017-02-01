# simple-cv

Node.js bindings for OpenCV with a simple promise-based async API, good documentation and excellent tests.

<br/>

# Install

<br/>

## macOS

```bash
brew tap homebrew/science
brew install opencv3
npm install simple-cv
```

<br/>

## Ubuntu

```bash
apt-get install libopencv-dev
npm install simple-cv
```

<br/>

## Windows

```bash
figure-out yourself || install ubuntu || buy mac
```

<br/><br/><br/>





# API documentation

The API documentation assumes you have imported the `simple-cv` main module like this:

```js
const cv = require('simple-cv');
```

Destructuring works also off course:

```js
const {Matrix, ImageType, rotate} = require('simple-cv');
```

<br/><br/><br/>





## Matrix

The basic data type used to represent images, transformation matrices etc. Wraps an instance of OpenCV `Mat`.

<br/>

### Constructors

<br/>

#### cv.Matrix(number, number, type)

| argument | type                      | description
| -------- | ------------------------- | --------------------------
| width    | number                    | The width of the matrix.
| height   | number                    | The height of the matrix.
| type     | [`ImageType`](#imagetype) | The type of the matrix. Default = `ImageType.Gray`. 

```js
const matrix = new cv.Matrix(10, 20, cv.ImageType.Float);
```

<br/>

#### cv.Matrix({width, height, type?, data?})

| property | type                      | description
| -------- | ------------------------- | --------------------------
| width    | number                    | The width of the matrix.
| height   | number                    | The height of the matrix.
| type     | [`ImageType`](#imagetype) | The type of the matrix.
| data     | Array<number>             | The data in a row-major order.

```js
const matrix = new cv.Matrix({
  width: 3,
  height: 2, 
  type: cv.ImageType.Float,
  data: [
    1, 2, 3,
    4, 5, 6
  ]
 });
```

<br/>

### Methods

<br/>

#### array = matrix.toArray()

Returns an array with the matrice's values in row-major order.

| return value | type           | description
| ------------ | -------------- | -------------------------------------
| array        | Array<number>  | The matrix values in row-major order.

```js
const array = matrix.toArray();
```

<br/>

#### matrix = matrix.crop(rect)

Cuts a rectangular piece of the matrix and returns it as a new matrix. The original matrix is not modified.

| argument | type                      | description
| -------- | ------------------------- | ------------------------------------
| rect     | [`Rectangle´](#rectangle) | The rectangle to crop.

| return value | type                | description
| ------------ | ------------------- | --------------------------------------
| matrix       | [`Matrix`](#matrix) | The cropped matrix.

```js
const cropped = matrix.crop({x: 10, y: 10, width: 10, height: 10});
```

<br/>

#### buffers = matrix.toBuffers()

Returns all the matrices channels as `Buffers`. The returned array contains `{channel: Channel, data: Buffer}`
objects.

| return value | type                                  | description
| ------------ | ------------------------------------- | --------------------------------------
| buffers      | Array<[`ChannelData`](#channeldata)>  | Each channel's data as a Buffer.

```js
const buffers = matrix.toBuffers();
const redData = buffers.find(it => it.channel == cv.Channel.Red).data;
```

<br/>

### Properties

<br/>

The `Matrix` class has the following instance properties.

| property | type                      | description
| -------- | ------------------------- | --------------------------
| width    | number                    | The width of the matrix.
| height   | number                    | The height of the matrix.
| type     | [`ImageType`](#imagetype) | The type of the matrix. 

<br/><br/><br/>

## Functions

<br/>

### matrix = cv.matrix(...args)

Shorthand for `new cv.Matrix(...args)`.

<br/>

### promise = cv.readImage(filePath, imageType)

Read an image from a file.

| argument  | type                      | description
| --------- | ------------------------- | ------------------------------------
| filePath  | string                    | Path to the image file to read. All image formats supported by OpenCV are supported.
| imageType | [`ImageType`](#imagetype) | Optional image type. If omitted the image is read as-is. By providing `cv.ImageType.Gray` the image can be read as a gray scale image.

| return value | type                         | description
| ------------ | ---------------------------- | --------------------------------------
| promise      | Promise<[`Matrix`](#matrix)> | The image

```js
const colorImage = await cv.readImage('/path/to/some/color-image.png');
const grayImage = await cv.readImage('/path/to/some/color-image.png', cv.ImageType.Gray);
```

<br/>

### promise = cv.decodeImage(buffer, imageType)

Decode an image from a buffer of data.

| argument  | type                      | description
| --------- | ------------------------- | ------------------------------------
| buffer    | Buffer                    | Image data. All image formats supported by OpenCV are supported.
| imageType | [`ImageType`](#imagetype) | Optional image type. If omitted the decoded is read as-is. By providing `cv.ImageType.Gray` the image can be decoded as a gray scale image.

| return value | type                         | description
| ------------ | ---------------------------- | --------------------------------------
| promise      | Promise<[`Matrix`](#matrix)> | The image

```js
const colorImage = await cv.decodeImage(colorImageData);
const grayImage = await cv.decodeImage(colorImageData, cv.ImageType.Gray);
```

<br/>

### promise = cv.writeImage(image, filePath)

Encode and write an image to a file.

| argument | type                | description
| -------- | ------------------- | ------------------------------------
| image    | [`Matrix`](#matrix) | The image to write to the file.
| filePath | string              | Where to write the file. The image type is derived from the extension.

| return value | type          | description
| ------------ | --------------| --------------------------------------
| promise      | Promise<void> | Empty promise that is resolved after the image has been written.

```js
await cv.writeFile(image, filePath);
```
<br/>

### promise = cv.encodeImage(image, encodeType)

Encode an image and return the data as a buffer.

| argument   | type                    | description
| ---------- | ----------------------- | ------------------------------------
| image      | [`Matrix`](#matrix)     | The image to encode
| encodeType | [`EncodeType`](#matrix) | The wanted image format

| return value | type            | description
| ------------ | --------------- | --------------------------------------
| promise      | Promise<Buffer> | The encoded image data

```js
const jpegData = await cv.encodeImage(matrix, cv.EncodeType.JPEG);
```

<br/>

### cv.showImage(matrix)

Shows an image (or any matrix) using OpenCV's `cv::imshow`.

| argument   | type                | description
| ---------- | ------------------- | ------------------------------------
| windowName | string              | name of the window
| matrix     | [`Matrix`](#matrix) | The matrix to show

```js
cv.showImage('Pretty picture', image);
cv.waitKey();
```

<br/>

### keyCode = cv.waitKey(delay)

Waits for a key using OpenCV's `waitKey`. Note that this function blocks and should only be used
for debugging and testing with `showImage`.

| argument  | type   | description
| --------- | ------ | ------------------------------------
| delay     | number | How many milliseconds to wait for the key press.

| return value | type   | description
| ------------ | ------ | --------------------------------------
| keyCode      | number | The code of the pressed key

```js
// Wait forever.
const key = cv.waitKey(0);
```

<br/><br/><br/>

## Enums

<br/>

### ImageType

| value | description
| ------| -------------------------------------------------------------------------------------
| Gray  | Gray scale image. The underlying OpenCV data type is `CV_8UC1`.         
| BGR   | BGR color image. The underlying OpenCV data type is `CV_8UC3`.   
| BGRA  | BGRA color image with an alpha channel. The underlying OpenCV data type is `CV_8UC4`.  
| Float | Floating point matrix. The underlying OpenCV data type is `CV_64FC1`

```js
const Gray = cv.ImageType.Gray;
```

<br/>

### EncodeType

| value | description
| ------| -------------
| PNG   | PNG format.         
| JPEG  | JPEG format.

```js
const JPEG = cv.EncodeType.JPEG;
```

<br/>

### BorderType

Describes how to fill the empty space created by some operations like `rotate`.

| value      | description
| ---------- | -------------
| Replicate  | `aaaaaa|abcdefgh|hhhhhhh`    
| Reflect    | `fedcba|abcdefgh|hgfedcb`
| Reflect101 | `gfedcb|abcdefgh|gfedcba`
| Wrap       | `cdefgh|abcdefgh|abcdefg`
| Constant   | `iiiiii|abcdefgh|iiiiiii` with some specific `i`

```js
const Replicate = cv.BorderType.Replicate;
```

<br/>

### Channel

| value | description
| ------| -------------
| Gray  | Gray channel   
| Red   | Red channel
| Green | Green channel
| Blue  | Blue channel
| Alpha | Alpha channel
| Float | Floating point channel

```js
const Gray = cv.Channel.Gray;
```

<br/><br/><br/>





## Types

<br/>

### Rectangle

A javascript object with properties `x`, `y`, `width` and `height`.

| property | type   | description
| -------- | ------ | -------------------------
| x        | number | x-coordinate
| y        | number | y-coordinate
| width    | number | width
| height   | number | height

```js
const rect = {
  x: 10,
  y: 20,
  width: 100,
  height: 100
};
```

<br/>

### Point

A javascript object with properties `x` and `y`.

| property | type   | description
| -------- | ------ | -------------------------
| x        | number | x-coordinate
| y        | number | y-coordinate

```js
const point = {
  x: 10,
  y: 20
};
```

<br/>

### Color

A javascript object with properties `r`, `g`, `b` and `a`.

| property | type    | description
| -------- | ------- | --------------------------
| r        | integer | red component
| g        | integer | green component
| b        | integer | blue component
| a        | integer | alpha component

```js
const color = {
  r: 0,
  g: 255,
  b: 128,
  a: 255
};
```

<br/>

### ChannelData

A javascript object with properties `data` and `channel`.

| property | type                  | description
| -------- | --------------------- | --------------------------
| data     | Buffer                | channel data in row-major order
| channel  | [`Channel`](#channel) | channel type

```js
const channelData = {
  data: new Buffer(100),
  channel: cv.Channel.Gray
};
```
