#ifndef SIMPLE_CV_FLIPLEFTRIGHT_H
#define SIMPLE_CV_FLIPLEFTRIGHT_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(flipLeftRight) {
  if (info.Length() != 2) {
    Nan::ThrowError("expected two (image, callback) arguments");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);

  if (!info[1]->IsFunction()) {
    Nan::ThrowError("second argument (callback) must be a function");
    return;
  }

  asyncOp<cv::Mat>(info[1].As<v8::Function>(), [image]() {
    cv::Mat output;
    cv::flip(image, output, 1);
    return output;
  }, [](const cv::Mat& result) {
    return Matrix::create(result);
  });
}

#endif //SIMPLE_CV_FLIPLEFTRIGHT_H
