const cv = require('bindings')('simple_cv');
const { Rect } = require('./lib/Rect');

const ImageType = cv.ImageType;
const EncodeType = cv.EncodeType;
const BorderType = cv.BorderType;
const Channel = cv.Channel;
const Conversion = cv.Conversion;

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

  get native() {
    return this._native;
  }

  get width() {
    return this.native.width;
  }

  get height() {
    return this.native.height;
  }

  get type() {
    return this.native.type;
  }

  crop(...args) {
    return asyncWrap(this.native, this.native.crop, args);
  }

  cropSync(...args) {
    return wrap(this.native, this.native.crop, args);
  }

  set(...args) {
    return asyncWrap(this.native, this.native.set, args, this);
  }

  setSync(...args) {
    return wrap(this.native, this.native.set, args, this);
  }

  add(...args) {
    return asyncWrap(this.native, this.native.add, args, this);
  }

  addSync(...args) {
    return wrap(this.native, this.native.add, args, this);
  }

  subtract(...args) {
    return asyncWrap(this.native, this.native.subtract, args, this);
  }

  subtractSync(...args) {
    return wrap(this.native, this.native.subtract, args, this);
  }

  mul(...args) {
    return asyncWrap(this.native, this.native.mul, args, this);
  }

  mulSync(...args) {
    return wrap(this.native, this.native.mul, args, this);
  }

  clone(...args) {
    return wrap(this.native, this.native.clone, args);
  }

  toString() {
    return JSON.stringify(this);
  }

  toArray() {
    return this.native.toArray();
  }

  toBuffers() {
    return this.native.toBuffers();
  }

  toBuffer() {
    return this.native.toBuffer();
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

function showImage(...args) {
  return wrap(cv, cv.showImage, args);
}

function drawRectangle(...args) {
  return wrap(cv, cv.drawRectangle, args);
}

function drawLine(...args) {
  return wrap(cv, cv.drawLine, args);
}

function waitKey(...args) {
  return wrap(cv, cv.waitKey, args);
}

function rotationMatrix(...args) {
  return wrap(cv, cv.rotationMatrix, args);
}

function readImage(...args) {
  return asyncWrap(cv, cv.readImage, args);
}

function readImageSync(...args) {
  return wrap(cv, cv.readImage, args);
}

function convertColor(...args) {
  return asyncWrap(cv, cv.convertColor, args);
}

function convertColorSync(...args) {
  return wrap(cv, cv.convertColor, args);
}

function decodeImage(...args) {
  return asyncWrap(cv, cv.decodeImage, args);
}

function decodeImageSync(...args) {
  return wrap(cv, cv.decodeImage, args);
}

function writeImage(...args) {
  return asyncWrap(cv, cv.writeImage, args);
}

function writeImageSync(...args) {
  return wrap(cv, cv.writeImage, args);
}

function encodeImage(...args) {
  return asyncWrap(cv, cv.encodeImage, args);
}

function encodeImageSync(...args) {
  return wrap(cv, cv.encodeImage, args);
}

function resize(...args) {
  return asyncWrap(cv, cv.resize, args);
}

function resizeSync(...args) {
  return wrap(cv, cv.resize, args);
}

function warpAffine(...args) {
  return asyncWrap(cv, cv.warpAffine, args);
}

function warpAffineSync(...args) {
  return wrap(cv, cv.warpAffine, args);
}

function flipUpDown(...args) {
  return asyncWrap(cv, cv.flipUpDown, args);
}

function flipUpDownSync(...args) {
  return wrap(cv, cv.flipUpDown, args);
}

function flipLeftRight(...args) {
  return asyncWrap(cv, cv.flipLeftRight, args);
}

function flipLeftRightSync(...args) {
  return wrap(cv, cv.flipLeftRight, args);
}

function split(...args) {
  return asyncWrap(cv, cv.split, args).then(unwrapMatrices);
}

function splitSync(...args) {
  return unwrapMatrices(wrap(cv, cv.split, args));
}

function merge(...args) {
  return asyncWrap(cv, cv.merge, args);
}

function mergeSync(...args) {
  return wrap(cv, cv.merge, args);
}

function lookup(...args) {
  return asyncWrap(cv, cv.lookup, args);
}

function lookupSync(...args) {
  return wrap(cv, cv.lookup, args);
}

function rotate(image, opt) {
  return new Promise((resolve, reject) => {
    const {transformation, warpOptions} = rotateShared(image, opt);
    warpAffine(image, transformation, warpOptions).then(resolve).catch(reject);
  });
}

function rotateSync(image, opt) {
  const {transformation, warpOptions} = rotateShared(image, opt);
  return warpAffineSync(image, transformation, warpOptions);
}

function rotateShared(image, opt) {
  let rot;
  let warpOpt = {};

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

  return {
    transformation: rot,
    warpOptions: warpOpt
  };
}

function wrap(obj, method, args, returnValue) {
  let wrappedArgs = wrapMatrices(args);
  let result = method.apply(obj, wrappedArgs);

  if (returnValue) {
    result = returnValue;
  }

  if (result instanceof cv.Matrix) {
    return matrix(result);
  } else {
    return result;
  }
}

function asyncWrap(obj, method, args, returnValue) {
  return new Promise((resolve, reject) => {
    let wrappedArgs = wrapMatrices(args);

    wrappedArgs.push((err, result) => {
      if (returnValue) {
        result = returnValue;
      }

      if (err) {
        reject(err);
      } else {
        if (result instanceof cv.Matrix) {
          resolve(matrix(result));
        } else {
          resolve(result);
        }
      }
    });

    method.apply(obj, wrappedArgs);
  });
}

function wrapMatrices(args) {
  return args.map(arg => {
    if (arg instanceof Matrix) {
      return arg.native;
    } else {
      return arg;
    }
  });
}

function unwrapMatrices(args) {
  return args.map(arg => {
    if (arg instanceof cv.Matrix) {
      return matrix(arg);
    } else {
      return arg;
    }
  });
}

module.exports = {
  Matrix,
  ImageType,
  EncodeType,
  BorderType,
  Conversion,
  Channel,
  Rect,

  matrix,
  showImage,
  drawRectangle,
  drawLine,
  waitKey,
  readImage,
  readImageSync,
  convertColor,
  convertColorSync,
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
  flipLeftRightSync,
  split,
  splitSync,
  merge,
  mergeSync,
  lookup,
  lookupSync
};