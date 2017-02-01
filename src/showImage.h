#ifndef SIMPLE_CV_SHOWIMAGE_H
#define SIMPLE_CV_SHOWIMAGE_H

#include "Matrix.h"

NAN_METHOD(showImage) {
  if (info.Length() < 2) {
    Nan::ThrowError("expected two arguments (windowName, image)");
    return;
  }

  if (!info[0]->IsString()) {
    Nan::ThrowError("first argument (windowName) must be a string");
    return;
  }

  if (!Matrix::isMatrix(info[1])) {
    Nan::ThrowError("second argument (image) must be an instance of Matrix");
    return;
  }

  v8::String::Utf8Value windowName(info[0]->ToString());
  cv::imshow(windowName.operator*(), Matrix::get(info[1]));
}

#endif //SIMPLE_CV_SHOWIMAGE_H
