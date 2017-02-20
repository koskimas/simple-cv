#ifndef SIMPLE_CV_WRITEIMAGE_H
#define SIMPLE_CV_WRITEIMAGE_H

#include "Matrix.h"
#include "async.h"

NAN_METHOD(writeImage) {
  if (info.Length() < 2 || info.Length() > 3) {
    Nan::ThrowError("expected at least two arguments (image, filePath) and at most three arguments (image, filePath, callback)");
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

  if (info.Length() == 3 && !info[2]->IsFunction()) {
    Nan::ThrowError("third argument (callback) must be a function");
    return;
  }

  cv::Mat image = Matrix::get(info[0]);
  std::string filePath(v8::String::Utf8Value(info[1]->ToString()).operator*());

  maybeAsyncOp<int>(info, [filePath, image]() {
    cv::imwrite(filePath, image);
    return 0;
  }, [](const int& res) {
    return Nan::Null();
  });
}

#endif // SIMPLE_CV_WRITEIMAGE_H
