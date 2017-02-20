#ifndef SIMPLE_CV_WARPAFFINE_H
#define SIMPLE_CV_WARPAFFINE_H

#include "Matrix.h"
#include "async.h"
#include "utils.h"
#include "constants.h"

/**
 * warpAffine(image, transformation)
 * warpAffine(image, transformation, options)
 * warpAffine(image, transformation, callback)
 * warpAffine(image, transformation, options, callback)
 */
NAN_METHOD(warpAffine) {
  if (info.Length() < 2 || info.Length() > 4) {
    Nan::ThrowError("expected at least two arguments (image, transformation) and at most four arguments (image, transformation, options, callback)");
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

  if (info.Length() >= 3) {
    if (info[2]->IsObject() && !info[2]->IsFunction()) {
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
    } else if (!info[2]->IsFunction()) {
      Nan::ThrowError("third argument must be either a callback or an options object");
      return;
    }
  }

  maybeAsyncOp<cv::Mat>(info, [image, trans, borderType, borderValue]() {
    cv::Mat output;
    cv::warpAffine(image, output, trans, image.size(), CV_INTER_CUBIC, borderType, borderValue);
    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif //SIMPLE_CV_WARPAFFINE_H
