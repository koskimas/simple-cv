#ifndef SIMPLE_CV_WARPAFFINE_H
#define SIMPLE_CV_WARPAFFINE_H

#include "Matrix.h"
#include "async.h"
#include "utils.h"
#include "constants.h"

NAN_METHOD(warpAffine) {
  if (info.Length() < 3) {
    Nan::ThrowError("expected three (image, transformation, callback), or four (image, transformation, options, callback) arguments");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);

  if (!Matrix::isMatrix(info[1])) {
    Nan::ThrowError("second argument (transformation) must be a Matrix");
    return;
  }

  cv::Mat trans = Matrix::get(info[1]);

  if (trans.size().width != 3 || trans.size().height != 2 || trans.type() != ImageTypeFloat) {
    Nan::ThrowError("second argument (transformation) must be a 3x2 float matrix");
    return;
  }

  int borderType = BorderTypeConstant;
  int borderValue = 0;
  v8::Local<v8::Function> callback;

  if (info.Length() >= 4) {
    if (!info[2]->IsObject()) {
      Nan::ThrowError("third argument (options) must be an object");
      return;
    }

    auto opt = info[2];

    if (has(opt, "borderType")) {

      if (!getValue(opt, "borderType")->IsInt32()) {
        Nan::ThrowError("borderType must be one of cv.BorderType.[Constant, Reflect, Reflect101, Replicate, Wrap]");
        return;
      }

      borderType = get<int>(opt, "borderType");

      if (borderType != BorderTypeConstant
          && borderType != BorderTypeReflect
          && borderType != BorderTypeReflect101
          && borderType != BorderTypeReplicate
          && borderType != BorderTypeWrap) {

        Nan::ThrowError("borderType must be one of cv.BorderType.[Constant, Reflect, Reflect101, Replicate, Wrap]");
        return;
      }
    }

    if (has(opt, "borderValue")) {
      borderValue = get<int>(opt, "borderValue");
    }

    if (!info[3]->IsFunction()) {
      Nan::ThrowError("fourth argument (callback) must be a function");
      return;
    }

    callback = info[3].As<v8::Function>();
  } else {
    if (!info[2]->IsFunction()) {
      Nan::ThrowError("third argument (callback) must be a function");
      return;
    }

    callback = info[2].As<v8::Function>();
  }

  asyncImageOp(callback, [image, trans, borderType, borderValue]() {
    cv::Mat output;
    cv::warpAffine(image, output, trans, image.size(), CV_INTER_CUBIC, borderType, borderValue);
    return output;
  });
}

#endif //SIMPLE_CV_WARPAFFINE_H
