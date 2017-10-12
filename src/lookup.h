#ifndef SIMPLE_CV_LOOKUP_H
#define SIMPLE_CV_LOOKUP_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(lookup) {
  if (info.Length() < 2 || info.Length() > 3) {
    Nan::ThrowError("expected at least two argument (image, lookupTable) and at most two arguments (image, lookupTable, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  if (!Matrix::isMatrix(info[1])) {
    Nan::ThrowError("second argument (lookupTable) must be a Matrix");
    return;
  }

  auto image = Matrix::get(info[0]);
  auto lookupTable = Matrix::get(info[1]);

  if (lookupTable.type() != CV_8UC1 || lookupTable.total() != 256) {
    Nan::ThrowError("second argument (lookupTable) must be a a Gray matrix with 256 values");
    return;
  }

  maybeAsyncOp<cv::Mat>(info, [image, lookupTable]() {
    cv::Mat result;
    cv::LUT(image, lookupTable, result);
    return result;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif // SIMPLE_CV_LOOKUP_H
