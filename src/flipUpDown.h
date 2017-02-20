#ifndef SIMPLE_CV_FLIPUPDOWN_H
#define SIMPLE_CV_FLIPUPDOWN_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(flipUpDown) {
  if (info.Length() < 1 || info.Length() > 2) {
    Nan::ThrowError("expected at least one argument (image) and at most two arguments (image, callback)");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);

  maybeAsyncOp<cv::Mat>(info, [image]() {
    cv::Mat output;
    cv::flip(image, output, 0);
    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif //SIMPLE_CV_FLIPUPDOWN_H
