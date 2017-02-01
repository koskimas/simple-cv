#ifndef SIMPLE_CV_WRITEIMAGE_H
#define SIMPLE_CV_WRITEIMAGE_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(writeImage) {
  if (info.Length() < 3) {
    Nan::ThrowError("expected three (image, filePath, callback) arguments");
    return;
  }

  if (!Matrix::isMatrix(info[0])) {
    Nan::ThrowError("first argument (image) must be a Matrix");
    return;
  }

  if (!info[1]->IsString()) {
    Nan::ThrowError("second argument (filePath) must be a string");
    return;
  }

  if (!info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);
  std::string filePath(v8::String::Utf8Value(info[1]->ToString()).operator*());
  v8::Local<v8::Function> callback = info[2].As<v8::Function>();

  asyncOp(callback, [filePath, image]() {
    cv::imwrite(filePath, image);
  });
}

#endif // SIMPLE_CV_WRITEIMAGE_H
