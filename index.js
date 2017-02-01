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

  toArray() {
    return this._native.toArray();
  }

  toBuffers() {
    return this._native.toBuffers();
  }

  crop(...args) {
    return new Matrix(this._native.crop(...args));
  }

  set(matrix, point) {
    this._native.set(matrix && matrix._native, point);
    return this;
  }

  toString() {
    return JSON.stringify(this);
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

function rotate(image, opt) {
  return new Promise((resolve, reject) => {
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

    warpAffine(image, rot).then(resolve).catch(reject);
  });
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
  decodeImage,
  writeImage,
  encodeImage,
  resize,
  warpAffine,
  rotationMatrix,
  rotate,
  flipUpDown,
  flipLeftRight
};