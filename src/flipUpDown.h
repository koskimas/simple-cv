#ifndef SIMPLE_CV_FLIPUPDOWN_H
#define SIMPLE_CV_FLIPUPDOWN_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(flipUpDown) {
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

  asyncImageOp(info[1].As<v8::Function>(), [image]() {
    cv::Mat output;
    cv::flip(image, output, 0);
    return output;
  });
}

#endif //SIMPLE_CV_FLIPUPDOWN_H
