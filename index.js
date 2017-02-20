const cv = require('bindings')('simple_cv');

const ImageType = {
  Gray: cv.ImageType.Gray,
  BGR: cv.ImageType.BGR,
  BGRA: cv.ImageType.BGRA,
  Float: cv.ImageType.Float
};

const EncodeType = {
  PNG: cv.EncodeType.PNG,
  JPEG: cv.EncodeType.JPEG
};

const BorderType = {
  Replicate: cv.BorderType.Replicate,
  Reflect: cv.BorderType.Reflect,
  Reflect101: cv.BorderType.Reflect101,
  Wrap: cv.BorderType.Wrap,
  Constant: cv.BorderType.Constant
};

const Channel = {
  Gray: cv.Channel.Gray,
  Red: cv.Channel.Red,
  Green: cv.Channel.Green,
  Blue: cv.Channel.Blue,
  Alpha: cv.Channel.Alpha,
  Float: cv.Channel.Float
};

class Matrix {

  constructor(...args) {
    if (args.length === 1 && args[0] instanceof Matrix) {
      this._native = args[0]._native;
    } else if (args.length === 1 && args[0] instanceof cv.Matrix) {
      this._native = args[0];
    } else {
      this._native = new cv.Matrix(...args);
    }
  }

  get width() {
    return this._native.width;
  }

  get height() {
    return this._native.height;
  }

  get type() {
    return this._native.type;
  }

  crop(rect) {
    return new Promise((resolve, reject) => {
      this._native.crop(rect, (err, matrix) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Matrix(matrix));
        }
      });
    });
  }

  cropSync(rect) {
    return new Matrix(this._native.crop(rect));
  }

  set(matrix, point) {
    return new Promise((resolve, reject) => {
      this._native.set(matrix && matrix._native, point, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  setSync(matrix, point) {
    return this._native.set(matrix && matrix._native, point);
  }

  toString() {
    return JSON.stringify(this);
  }

  toArray() {
    return this._native.toArray();
  }

  toBuffers() {
    return this._native.toBuffers();
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      type: this.type,
      data: this.toArray()
    };
  }
}

function matrix(...args) {
  return new Matrix(...args);
}

function showImage(windowName, image) {
  return cv.showImage(windowName, image && image._native);
}

function waitKey(...args) {
  return cv.waitKey(...args);
}

function rotationMatrix(...args) {
  return new Matrix(cv.rotationMatrix(...args));
}

function readImage(...args) {
  return new Promise((resolve, reject) => {
    cv.readImage(...args, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Matrix(image));
      }
    });
  });
}

function readImageSync(...args) {
  return new Matrix(cv.readImage(...args));
}

function decodeImage(...args) {
  return new Promise((resolve, reject) => {
    cv.decodeImage(...args, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Matrix(image));
      }
    });
  });
}

function decodeImageSync(...args) {
  return new Matrix(cv.decodeImage(...args));
}

function writeImage(image, filePath) {
  return new Promise((resolve, reject) => {
    cv.writeImage(image && image._native, filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function writeImageSync(image, filePath) {
  return cv.writeImage(image && image._native, filePath);
}

function encodeImage(image, type) {
  return new Promise((resolve, reject) => {
    cv.encodeImage(image && image._native, type, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

function encodeImageSync(image, type) {
  return cv.encodeImage(image && image._native, type);
}

function resize(image, sizeSpec) {
  return new Promise((resolve, reject) => {
    cv.resize(image && image._native, sizeSpec, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Matrix(image));
      }
    });
  });
}

function resizeSync(image, sizeSpec) {
  return new Matrix(cv.resize(image && image._native, sizeSpec));
}

function warpAffine(...args) {
  return new Promise((resolve, reject) => {
    args[0] = args[0] && args[0]._native;
    args[1] = args[1] && args[1]._native;

    cv.warpAffine(...args, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Matrix(image));
      }
    });
  });
}

function warpAffineSync(...args) {
  args[0] = args[0] && args[0]._native;
  args[1] = args[1] && args[1]._native;
  return new Matrix(cv.warpAffine(...args));
}

function flipUpDown(image) {
  return new Promise((resolve, reject) => {
    cv.flipUpDown(image && image._native, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Matrix(image));
      }
    });
  });
}

function flipUpDownSync(image) {
  return new Matrix(cv.flipUpDown(image && image._native));
}

function flipLeftRight(image) {
  return new Promise((resolve, reject) => {
    cv.flipLeftRight(image && image._native, (err, image) => {
      if (err) {
        reject(err);
      } else {
        resolve(new Matrix(image));
      }
    });
  });
}

function flipLeftRightSync(image) {
  return new Matrix(cv.flipLeftRight(image && image._native));
}

function rotate(image, opt) {
  return new Promise((resolve, reject) => {
    warpAffine(image, rotateShared(image, opt)).then(resolve).catch(reject);
  });
}

function rotateSync(image, opt) {
  return warpAffineSync(image, rotateShared(image, opt));
}

function rotateShared(image, opt) {
  let rot;
  let imageCenter = {
    x: Math.floor(image.width / 2),
    y: Math.floor(image.height / 2)
  };

  if (!(image instanceof Matrix)) {
    throw new Error('first argument (image) must be a Matrix');
  }

  if (typeof opt === 'number') {
    rot = rotationMatrix(imageCenter, opt);
  } else if (typeof opt === 'object' && opt) {
    rot = rotationMatrix({
      x: typeof opt.xCenter === 'number' ? opt.xCenter : imageCenter.x,
      y: typeof opt.yCenter === 'number' ? opt.yCenter : imageCenter.y,
    }, opt.angle || 0);
  } else {
    throw new Error('second argument (angle) must be a number or an object {xCenter?, yCenter?, angle}');
  }

  return rot;
}

module.exports = {
  Matrix,
  ImageType,
  EncodeType,
  BorderType,
  Channel,

  matrix,
  showImage,
  waitKey,
  readImage,
  readImageSync,
  decodeImage,
  decodeImageSync,
  writeImage,
  writeImageSync,
  encodeImage,
  encodeImageSync,
  resize,
  resizeSync,
  warpAffine,
  warpAffineSync,
  rotationMatrix,
  rotate,
  rotateSync,
  flipUpDown,
  flipUpDownSync,
  flipLeftRight,
  flipLeftRightSync
};